<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Divisi;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Admin',
            'Legal Admin',
            'Customer Service',
            'Surveyor',
            'Drafter',
            'Estimator',
            'Desainer',
            'Owner',
            'Supervisor',
            'Project Manager',
            'Kepala Marketing'
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate([
                'nama_role' => $roleName,
                // mengambil id divisi secara random dari tabel divisi
                'divisi_id' => Divisi::inRandomOrder()->first()->id,
            ]);
        }
    }
}
