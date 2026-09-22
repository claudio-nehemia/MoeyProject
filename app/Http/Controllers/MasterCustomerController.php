<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Models\Role;
use App\Models\Divisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class MasterCustomerController extends Controller
{
    /**
     * Display a listing of customers registered in orders & customer users.
     */
    public function index(Request $request)
    {
        // 1. Dapatkan role Customer
        $customerRole = Role::where('nama_role', 'Customer')->first();
        $customerRoleId = $customerRole?->id;

        // 2. Ambil semua User ber-role Customer
        $customerUsers = User::with('role')
            ->where(function ($q) use ($customerRoleId) {
                if ($customerRoleId) {
                    $q->where('role_id', $customerRoleId)
                      ->orWhereHas('roles', fn($r) => $r->where('roles.id', $customerRoleId));
                } else {
                    $q->whereHas('roles', fn($r) => $r->where('nama_role', 'Customer'));
                }
            })
            ->get()
            ->keyBy('id');

        // 3. Ambil semua order dengan data customer
        $orders = Order::select([
            'id',
            'nama_project',
            'company_name',
            'customer_name',
            'customer_email',
            'phone_number',
            'alamat',
            'project_status',
            'tahapan_proyek',
            'customer_user_id',
            'created_at'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        // 4. Kelompokkan data customer dari orders dan users
        $customerMap = [];

        // Pertama, masukkan customer dari orders
        foreach ($orders as $order) {
            $email = trim((string) $order->customer_email);
            $userId = $order->customer_user_id;
            $name = trim((string) $order->customer_name);
            $phone = trim((string) $order->phone_number);

            // Tentukan primary key unik untuk grouping
            if ($userId && isset($customerUsers[$userId])) {
                $groupKey = 'user_' . $userId;
            } elseif (!empty($email)) {
                $groupKey = 'email_' . strtolower($email);
            } else {
                $groupKey = 'name_phone_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name . $phone));
            }

            if (!isset($customerMap[$groupKey])) {
                $customerMap[$groupKey] = [
                    'group_key' => $groupKey,
                    'customer_name' => $name,
                    'customer_email' => $email,
                    'phone_number' => $phone,
                    'alamat' => $order->alamat,
                    'company_name' => $order->company_name,
                    'orders' => [],
                    'user' => null,
                    'has_account' => false,
                ];
            }

            // Simpan detail order
            $customerMap[$groupKey]['orders'][] = [
                'id' => $order->id,
                'nama_project' => $order->nama_project,
                'project_status' => $order->project_status,
                'tahapan_proyek' => $order->tahapan_proyek,
                'created_at' => $order->created_at?->format('d M Y'),
            ];

            // Tautkan user jika ada
            if ($userId && isset($customerUsers[$userId])) {
                $user = $customerUsers[$userId];
                $customerMap[$groupKey]['user'] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at?->format('d M Y H:i'),
                ];
                $customerMap[$groupKey]['has_account'] = true;
                if (empty($customerMap[$groupKey]['customer_email'])) {
                    $customerMap[$groupKey]['customer_email'] = $user->email;
                }
            }
        }

        // Kedua, cek apakah ada email yang cocok dengan user yang belum terhubung via customer_user_id
        $usersByEmail = $customerUsers->keyBy(fn($u) => strtolower($u->email));
        foreach ($customerMap as $key => &$cust) {
            if (!$cust['has_account'] && !empty($cust['customer_email'])) {
                $normalizedEmail = strtolower($cust['customer_email']);
                if (isset($usersByEmail[$normalizedEmail])) {
                    $u = $usersByEmail[$normalizedEmail];
                    $cust['user'] = [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'created_at' => $u->created_at?->format('d M Y H:i'),
                    ];
                    $cust['has_account'] = true;
                }
            }
        }
        unset($cust);

        // Ketiga, tambahkan user ber-role Customer yang mungkin belum ada ordernya
        $linkedUserIds = collect($customerMap)->pluck('user.id')->filter()->toArray();
        foreach ($customerUsers as $u) {
            if (!in_array($u->id, $linkedUserIds)) {
                $groupKey = 'user_' . $u->id;
                $customerMap[$groupKey] = [
                    'group_key' => $groupKey,
                    'customer_name' => $u->name,
                    'customer_email' => $u->email,
                    'phone_number' => '-',
                    'alamat' => '-',
                    'company_name' => '-',
                    'orders' => [],
                    'user' => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'created_at' => $u->created_at?->format('d M Y H:i'),
                    ],
                    'has_account' => true,
                ];
            }
        }

        $customersList = array_values($customerMap);

        // Statistik
        $totalCustomers = count($customersList);
        $totalWithAccount = collect($customersList)->where('has_account', true)->count();
        $totalWithoutAccount = $totalCustomers - $totalWithAccount;

        return Inertia::render('MasterCustomer/Index', [
            'customers' => $customersList,
            'stats' => [
                'total' => $totalCustomers,
                'with_account' => $totalWithAccount,
                'without_account' => $totalWithoutAccount,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Create portal account for a customer.
     */
    public function storeAccount(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'nullable|string|min:6',
            'order_ids' => 'nullable|array',
            'order_ids.*' => 'exists:orders,id',
        ], [
            'email.unique' => 'Email ini sudah terdaftar sebagai pengguna lain.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        // Pastikan role Customer tersedia
        $customerRole = Role::firstOrCreate(
            ['nama_role' => 'Customer'],
            ['divisi_id' => Divisi::value('id') ?? 1]
        );

        $plainPassword = !empty($validated['password']) ? $validated['password'] : 'password123';

        // Buat User dengan role Customer
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($plainPassword),
            'role_id' => $customerRole->id,
            'email_verified_at' => now(),
        ]);

        if (Schema::hasTable('user_roles')) {
            $user->roles()->syncWithoutDetaching([$customerRole->id]);
        }

        // Tautkan order yang dipilih secara eksplisit
        $linkedOrderIds = $validated['order_ids'] ?? [];
        if (!empty($linkedOrderIds)) {
            Order::whereIn('id', $linkedOrderIds)->update([
                'customer_user_id' => $user->id,
                'customer_email' => $user->email,
            ]);
        }

        // Tautkan juga order lain yang email atau namanya persis sama dan belum punya customer_user_id
        Order::where(function ($q) use ($user) {
            $q->where('customer_email', $user->email)
              ->orWhere(function ($q2) use ($user) {
                  $q2->whereNull('customer_user_id')
                     ->whereRaw('LOWER(TRIM(customer_name)) = ?', [strtolower(trim($user->name))]);
              });
        })->update([
            'customer_user_id' => $user->id,
            'customer_email' => $user->email,
        ]);

        return redirect()->back()->with('success', [
            'title' => 'Akun Portal Berhasil Dibuat!',
            'message' => "Akun portal untuk {$user->name} berhasil diaktifkan dengan role Customer.",
            'credentials' => [
                'name' => $user->name,
                'email' => $user->email,
                'password' => $plainPassword,
            ],
        ]);
    }

    /**
     * Reset customer password.
     */
    public function resetPassword(Request $request, $userId)
    {
        $validated = $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        $user = User::findOrFail($userId);
        $plainPassword = !empty($validated['password']) ? $validated['password'] : 'password123';

        $user->update([
            'password' => Hash::make($plainPassword),
        ]);

        return redirect()->back()->with('success', [
            'title' => 'Password Berhasil Direset!',
            'message' => "Password untuk {$user->name} ({$user->email}) berhasil diperbarui.",
            'credentials' => [
                'name' => $user->name,
                'email' => $user->email,
                'password' => $plainPassword,
            ],
        ]);
    }
}
