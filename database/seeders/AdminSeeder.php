<?php

namespace Database\Seeders;

use App\Models\Divisi;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $nama_role = 'Admin';

        $role = new Role();
        $role->nama_role = $nama_role;
        $role->divisi_id = Divisi::inRandomOrder()->first()->id;
        $role->save();

        $admin = Role::where('nama_role', 'Admin')->first();
        if ($admin) {
            $allPermissions = Permission::pluck('name')->toArray();
            $admin->syncPermissions($allPermissions);
        }

        // Create Admin
        $email = 'admin@moey.com';
        $name = 'Admin';

        User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password123'),
                'role_id' => $role->id,
            ]
        );
    }
}
