<?php

namespace Database\Seeders;

use App\Models\Divisi;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $nama_role = 'Customer Service';

        $role = new Role();
        $role->nama_role = $nama_role;
        $role->divisi_id = Divisi::inRandomOrder()->first()->id;
        $role->save();

        $customerService = Role::where('nama_role', 'Customer Service')->first();
        if ($customerService) {
            $csPermissions = Permission::where('group', 'Operations - Order')
                ->whereIn('name', ['order.index', 'order.show'])
                ->pluck('name')->toArray();
            $customerService->syncPermissions($csPermissions);
        }

        $usersData = [
            'Customer Service' => [
                ['name' => 'CS Andi', 'email' => 'cs.andi@company.com'],
                ['name' => 'CS Budi', 'email' => 'cs.budi@company.com'],
                ['name' => 'CS Citra', 'email' => 'cs.citra@company.com'],
                ['name' => 'CS Dini', 'email' => 'cs.dini@company.com']
            ],
        ];

        foreach ($usersData as $roleName => $users) {
            if ($role) {
                foreach ($users as $userData) {
                    User::firstOrCreate(
                        ['email' => $userData['email']],
                        [
                            'name' => $userData['name'],
                            'password' => Hash::make('password123'),
                            'role_id' => $role->id,
                        ]
                    );
                }
            }
        }
    }
}
