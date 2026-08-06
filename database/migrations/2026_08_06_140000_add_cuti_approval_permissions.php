<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Permission;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $newPermissions = [
            [
                'name' => 'approve-cuti.index',
                'display_name' => 'View Persetujuan Cuti/Izin',
                'group' => 'Master Data - Karyawan',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approve-cuti.approve',
                'display_name' => 'Proses Persetujuan Cuti/Izin',
                'group' => 'Master Data - Karyawan',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($newPermissions as $perm) {
            $permission = Permission::firstOrCreate(
                ['name' => $perm['name']],
                $perm
            );

            // Grant to Admin and Super Admin roles automatically
            $roles = Role::whereIn('nama_role', ['Admin', 'Super Admin'])->get();
            foreach ($roles as $role) {
                if (!$role->permissions()->where('permission_id', $permission->id)->exists()) {
                    $role->permissions()->attach($permission->id);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permIds = Permission::whereIn('name', ['approve-cuti.index', 'approve-cuti.approve'])->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $permIds)->delete();
        Permission::whereIn('name', ['approve-cuti.index', 'approve-cuti.approve'])->delete();
    }
};
