<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $usersData = [
            'Admin' => [
                ['name' => 'Admin Utama', 'email' => 'admin@moey.com']
            ],
            'Legal Admin' => [
                ['name' => 'Legal Admin 1', 'email' => 'legal1@company.com'],
                ['name' => 'Legal Admin 2', 'email' => 'legal2@company.com'],
                ['name' => 'Legal Admin 3', 'email' => 'legal3@company.com']
            ],
            'Customer Service' => [
                ['name' => 'CS Andi', 'email' => 'cs.andi@company.com'],
                ['name' => 'CS Budi', 'email' => 'cs.budi@company.com'],
                ['name' => 'CS Citra', 'email' => 'cs.citra@company.com'],
                ['name' => 'CS Dini', 'email' => 'cs.dini@company.com']
            ],
            'Surveyor' => [
                ['name' => 'Surveyor Eko', 'email' => 'surveyor.eko@company.com'],
                ['name' => 'Surveyor Fajar', 'email' => 'surveyor.fajar@company.com'],
                ['name' => 'Surveyor Gita', 'email' => 'surveyor.gita@company.com']
            ],
            'Drafter' => [
                ['name' => 'Drafter Hadi', 'email' => 'drafter.hadi@company.com'],
                ['name' => 'Drafter Ika', 'email' => 'drafter.ika@company.com'],
                ['name' => 'Drafter Joko', 'email' => 'drafter.joko@company.com'],
                ['name' => 'Drafter Lina', 'email' => 'drafter.lina@company.com']
            ],
            'Estimator' => [
                ['name' => 'Estimator Maya', 'email' => 'estimator.maya@company.com'],
                ['name' => 'Estimator Nanda', 'email' => 'estimator.nanda@company.com'],
                ['name' => 'Estimator Oki', 'email' => 'estimator.oki@company.com']
            ],
            'Desainer' => [
                ['name' => 'Desainer Putri', 'email' => 'desainer.putri@company.com'],
                ['name' => 'Desainer Rani', 'email' => 'desainer.rani@company.com'],
                ['name' => 'Desainer Santi', 'email' => 'desainer.santi@company.com'],
                ['name' => 'Desainer Taufik', 'email' => 'desainer.taufik@company.com']
            ],
            'Owner' => [
                ['name' => 'Owner Utama', 'email' => 'owner@company.com'],
                ['name' => 'Owner Partner', 'email' => 'owner.partner@company.com'],
                ['name' => 'Owner Investor', 'email' => 'owner.investor@company.com']
            ],
            'Supervisor' => [
                ['name' => 'Supervisor Umar', 'email' => 'supervisor.umar@company.com'],
                ['name' => 'Supervisor Vina', 'email' => 'supervisor.vina@company.com'],
                ['name' => 'Supervisor Wawan', 'email' => 'supervisor.wawan@company.com']
            ],
            'Project Manager' => [
                ['name' => 'PM Yanto', 'email' => 'pm.yanto@company.com'],
                ['name' => 'PM Zahra', 'email' => 'pm.zahra@company.com'],
                ['name' => 'PM Agus', 'email' => 'pm.agus@company.com'],
                ['name' => 'PM Bella', 'email' => 'pm.bella@company.com']
            ],
            'Kepala Marketing' => [
                ['name' => 'Kepala Marketing Cahyo', 'email' => 'marketing.cahyo@company.com'],
                ['name' => 'Kepala Marketing Dewi', 'email' => 'marketing.dewi@company.com'],
                ['name' => 'Kepala Marketing Eko', 'email' => 'marketing.eko@company.com']
            ]
        ];

        foreach ($usersData as $roleName => $users) {
            $role = Role::where('nama_role', $roleName)->first();
            
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