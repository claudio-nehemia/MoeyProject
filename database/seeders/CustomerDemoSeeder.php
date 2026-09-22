<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = Role::firstOrCreate(['nama_role' => 'Customer'], [
            'divisi_id' => 1,
        ]);

        // Buat akun customer demo
        $customer = User::updateOrCreate(
            ['email' => 'customer@moeyliving.com'],
            [
                'name' => 'Bpk. Andreas test',
                'password' => Hash::make('password'),
                'role_id' => $role->id,
            ]
        );

        $customer->roles()->syncWithoutDetaching([$role->id]);

        // Hubungkan order #152 ke akun customer ini (atau order pertama jika 152 tidak ada)
        $order = Order::find(152) ?? Order::first();
        if ($order) {
            $order->update([
                'customer_user_id' => $customer->id,
            ]);
            $this->command->info("Order #{$order->id} ({$order->nama_project}) berhasil ditautkan ke customer {$customer->email}");
        }

        $this->command->info("Akun Customer berhasil dibuat: customer@moeyliving.com / password");
    }
}
