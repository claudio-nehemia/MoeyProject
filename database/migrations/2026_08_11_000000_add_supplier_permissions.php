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
                'name' => 'supplier.index',
                'display_name' => 'View Supplier List',
                'group' => 'Master Data - Supplier',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'supplier.show',
                'display_name' => 'View Supplier Detail',
                'group' => 'Master Data - Supplier',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'supplier.create',
                'display_name' => 'Create Supplier',
                'group' => 'Master Data - Supplier',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'supplier.edit',
                'display_name' => 'Edit Supplier',
                'group' => 'Master Data - Supplier',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'supplier.delete',
                'display_name' => 'Delete Supplier',
                'group' => 'Master Data - Supplier',
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
        $permNames = ['supplier.index', 'supplier.show', 'supplier.create', 'supplier.edit', 'supplier.delete'];
        $permIds = Permission::whereIn('name', $permNames)->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $permIds)->delete();
        Permission::whereIn('name', $permNames)->delete();
    }
};
