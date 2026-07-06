<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\TaskResponse;
use App\Models\JenisInterior;
use App\Services\NotificationService;
use App\Services\ImageService;
use Illuminate\Http\Request;

class OrderApiController extends Controller
{
    /**
     * Get list of orders visible to the current user (CS sees their own, etc.)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $orders = Order::visibleToUser($user)
            ->with(['jenisInterior', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'company_name' => $order->company_name,
                    'project_status' => $order->project_status,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'jenis_interior' => $order->jenisInterior?->nama_interior,
                    'created_at' => $order->created_at->toIso8601String(),
                ];
            })
        ]);
    }

    /**
     * Get form data needed for order creation
     */
    public function getFormData()
    {
        $marketings = User::whereHas('roles', function ($query) {
            $query->where('nama_role', 'Kepala Marketing');
        })->get(['id', 'name', 'email']);
        
        $drafters = User::whereHas('roles', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get(['id', 'name', 'email']);
        
        $desainers = User::whereHas('roles', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get(['id', 'name', 'email']);
        
        $jenisInteriors = JenisInterior::select('id', 'nama_interior')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'marketings' => $marketings,
                'drafters' => $drafters,
                'desainers' => $desainers,
                'jenis_interiors' => $jenisInteriors,
            ]
        ]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_project' => 'required|string|max:255',
            'jenis_interior_id' => 'required|exists:jenis_interiors,id',
            'company_name' => 'required|string|max:255',
            'customer_name' => 'required|string|max:255',
            'customer_additional_info' => 'nullable|string',
            'nomor_unit' => 'nullable|string|max:100',
            'phone_number' => 'required|string|max:20',
            'alamat' => 'required|string',
            'tanggal_survey' => 'nullable|string',
            'priority_level' => 'nullable|string|max:100',
            'user_ids' => 'nullable|array',
            'mom_file' => 'nullable',
            'mom_files' => 'nullable|array',
            'mom_files.*' => 'file|mimes:pdf,doc,docx',
        ]);

        $validated['project_status'] = 'pending';
        $validated['priority_level'] = $validated['priority_level'] ?? 'medium';
        $validated['tanggal_masuk_customer'] = now()->toDateString();
        $validated['created_by'] = auth()->id();

        // Handle file uploads
        $momFilesArray = [];
        if ($request->hasFile('mom_files')) {
            $files = $request->file('mom_files');
            if (!is_array($files)) {
                $files = [$files];
            }
            foreach ($files as $file) {
                $result = app(ImageService::class)->saveRawFile($file, 'mom_files');
                $momFilesArray[] = $result;
            }
        }
        
        if ($request->hasFile('mom_file')) {
            $result = app(ImageService::class)->saveRawFile($request->file('mom_file'), 'mom_files');
            array_unshift($momFilesArray, $result);
        }

        if (!empty($momFilesArray)) {
            $validated['mom_file'] = $momFilesArray[0]['path'];
            $validated['mom_files'] = $momFilesArray;
        }

        $userIds = $validated['user_ids'] ?? [];
        unset($validated['user_ids']);

        $order = Order::create($validated);

        if (!empty($userIds)) {
            $order->users()->attach($userIds);
            try {
                $notificationService = new NotificationService();
                $notificationService->sendSurveyRequestNotification($order);
            } catch (\Exception $e) {
                \Log::error('Failed to send survey notification: ' . $e->getMessage());
            }
        }

        // Create Task Responses for Survey
        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null,
            'tahap' => 'survey',
            'start_time' => now(),
            'deadline' => now()->addDays(3),
            'duration' => 3,
            'duration_actual' => 3,
            'extend_time' => 0,
            'status' => 'menunggu_response',
        ]);

        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null,
            'tahap' => 'survey',
            'start_time' => now(),
            'deadline' => now()->addDays(3),
            'duration' => 3,
            'duration_actual' => 3,
            'extend_time' => 0,
            'status' => 'menunggu_response',
            'is_marketing' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => [
                'order' => $order->load('users.role', 'jenisInterior'),
            ]
        ], 201);
    }

    /**
     * Get details of a single order
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::visibleToUser($user)
            ->with(['jenisInterior', 'creator', 'users.role'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $order->id,
                'nama_project' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'company_name' => $order->company_name,
                'project_status' => $order->project_status,
                'tahapan_proyek' => $order->tahapan_proyek,
                'jenis_interior' => $order->jenisInterior?->nama_interior,
                'nomor_unit' => $order->nomor_unit,
                'phone_number' => $order->phone_number,
                'alamat' => $order->alamat,
                'customer_additional_info' => $order->customer_additional_info,
                'tanggal_survey' => $order->tanggal_survey,
                'tanggal_masuk_customer' => $order->tanggal_masuk_customer,
                'priority_level' => $order->priority_level,
                'mom_file' => $order->mom_file,
                'mom_files' => $order->mom_files ?? [],
                'users' => $order->users->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'role' => $u->role?->nama_role,
                    ];
                }),
            ]
        ]);
    }
}
