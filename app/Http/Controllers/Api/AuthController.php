<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\TaskResponse;
use App\Models\CashflowVendorEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->with('role')->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;
        $alerts = $this->getDashboardAlerts($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->nama_role,
                    'is_kepala_marketing' => $user->role && $user->role->nama_role === 'Kepala Marketing',
                    'nearest_task' => $alerts['nearest_task'],
                    'nearest_payment' => $alerts['nearest_payment'],
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('role');
        $alerts = $this->getDashboardAlerts($user);
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'role_name' => $user->role?->nama_role,
                'is_kepala_marketing' => $user->role && $user->role->nama_role === 'Kepala Marketing',
                'nearest_task' => $alerts['nearest_task'],
                'nearest_payment' => $alerts['nearest_payment'],
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        // Check if using token-based authentication
        $token = $request->user()->currentAccessToken();
        
        if ($token && !($token instanceof \Laravel\Sanctum\TransientToken)) {
            // API token-based logout
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Helper to retrieve dashboard alerts
     */
    private function getDashboardAlerts(User $user)
    {
        $roleName = $user->role?->nama_role;
        $alerts = [
            'nearest_task' => null,
            'nearest_payment' => null,
        ];

        // Define which roles are responsible for which task stages
        $roleTasksMap = [
            'Surveyor' => ['survey', 'survey_schedule', 'survey_ulang'],
            'Desainer' => ['moodboard', 'desain_final', 'approval_material'],
            'Drafter' => ['gambar_kerja'],
            'Kepala Marketing' => ['estimasi', 'rab_internal', 'kontrak', 'cm_fee', 'item_pekerjaan', 'workplan'],
            'Project Manager' => ['estimasi', 'rab_internal', 'kontrak', 'cm_fee', 'item_pekerjaan', 'workplan'],
            'PM' => ['estimasi', 'rab_internal', 'kontrak', 'cm_fee', 'item_pekerjaan', 'workplan'],
            'Admin' => ['estimasi', 'rab_internal', 'kontrak', 'cm_fee', 'item_pekerjaan', 'workplan'],
            'Supervisor' => ['estimasi', 'rab_internal', 'kontrak', 'cm_fee', 'item_pekerjaan', 'workplan'],
        ];

        $roleTasks = $roleTasksMap[$roleName] ?? [];
        $nearestTask = null;

        if (!empty($roleTasks)) {
            $visibleOrderIds = Order::visibleToUser($user)->pluck('id');
            $nearestTask = TaskResponse::whereIn('order_id', $visibleOrderIds)
                ->whereIn('tahap', $roleTasks)
                ->whereNotIn('status', ['selesai', 'telat_submit'])
                ->whereNotNull('deadline')
                ->with('order')
                ->orderBy('deadline', 'asc')
                ->first();
        }

        if ($nearestTask && $nearestTask->order) {
            $tahapMap = [
                'survey' => 'survey',
                'moodboard' => 'moodboard',
                'estimasi' => 'estimasi',
                'cm_fee' => 'commitment fee',
                'desain_final' => 'desain final',
                'item_pekerjaan' => 'item pekerjaan',
                'rab_internal' => 'RAB internal',
                'kontrak' => 'kontrak',
                'survey_schedule' => 'jadwal survey',
                'survey_ulang' => 'survey ulang',
                'gambar_kerja' => 'gambar kerja',
                'approval_material' => 'approval material',
                'workplan' => 'workplan',
            ];
            $tahapName = $tahapMap[$nearestTask->tahap] ?? $nearestTask->tahap;
            $projectName = $nearestTask->order->nama_project;

            $deadline = Carbon::parse($nearestTask->deadline);
            $daysLeft = now()->startOfDay()->diffInDays($deadline, false);

            $alerts['nearest_task'] = [
                'id' => $nearestTask->id,
                'tahap' => $nearestTask->tahap,
                'nama_project' => $projectName,
                'message' => "Ada task terdekat terkait {$tahapName} project \"{$projectName}\"",
                'deadline' => $nearestTask->deadline->toIso8601String(),
                'days_left' => $daysLeft,
            ];
        }

        // 2. Nearest Payment logic (only for Legal Admin)
        if ($roleName === 'Legal Admin') {
            $today = Carbon::today();
            
            // Find unpaid cashflow entries
            $nearestPayment = CashflowVendorEntry::where('order_id', '>', 0)
                ->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('tanggal_pembayaran')
                            ->whereRaw('pembayaran < nilai');
                    })->orWhere(function ($sub) {
                        $sub->whereNotNull('tanggal_pembayaran_termin')
                            ->whereRaw('pembayaran_termin < nilai');
                    });
                })
                ->with('order')
                ->get()
                ->sortBy(function ($entry) use ($today) {
                    $date1 = $entry->tanggal_pembayaran ? Carbon::parse($entry->tanggal_pembayaran) : null;
                    $date2 = $entry->tanggal_pembayaran_termin ? Carbon::parse($entry->tanggal_pembayaran_termin) : null;
                    
                    if ($date1 && $date2) {
                        return $date1->min($date2);
                    }
                    return $date1 ?: $date2;
                })
                ->first();

            if ($nearestPayment && $nearestPayment->order) {
                $date1 = $nearestPayment->tanggal_pembayaran ? Carbon::parse($nearestPayment->tanggal_pembayaran) : null;
                $date2 = $nearestPayment->tanggal_pembayaran_termin ? Carbon::parse($nearestPayment->tanggal_pembayaran_termin) : null;
                
                $targetDate = null;
                $paymentLabel = '';
                
                if ($date1 && $date2) {
                    if ($date1->lte($date2)) {
                        $targetDate = $date1;
                        $paymentLabel = 'pembayaran DP/cash';
                    } else {
                        $targetDate = $date2;
                        $paymentLabel = 'pembayaran termin';
                    }
                } else {
                    $targetDate = $date1 ?: $date2;
                    $paymentLabel = $date1 ? 'pembayaran DP/cash' : 'pembayaran termin';
                }

                if ($targetDate) {
                    $daysLeft = now()->startOfDay()->diffInDays($targetDate, false);
                    $alerts['nearest_payment'] = [
                        'id' => $nearestPayment->id,
                        'nama_project' => $nearestPayment->order->nama_project,
                        'vendor_name' => $nearestPayment->vendor_name ?? $nearestPayment->label,
                        'message' => "Reminder: Pembayaran terdekat untuk project \"{$nearestPayment->order->nama_project}\" (Vendor: {$nearestPayment->vendor_name}) jatuh tempo.",
                        'tanggal' => $targetDate->toIso8601String(),
                        'days_left' => $daysLeft,
                        'type' => $paymentLabel,
                    ];
                }
            }
        }

        return $alerts;
    }
}