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
                'name' => 'customer.index',
                'display_name' => 'View Customer Portal List',
                'group' => 'Master Data - Customer Portal',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'customer.create',
                'display_name' => 'Create Customer Portal Account',
                'group' => 'Master Data - Customer Portal',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'customer.edit',
                'display_name' => 'Reset Customer Portal Password',
                'group' => 'Master Data - Customer Portal',
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

            // Grant to Admin, Super Admin, Customer Service, and Kepala Marketing roles automatically
            $roles = Role::whereIn('nama_role', ['Admin', 'Super Admin', 'Customer Service', 'Kepala Marketing'])->get();
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
        $permNames = ['customer.index', 'customer.create', 'customer.edit'];
        $permIds = Permission::whereIn('name', $permNames)->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $permIds)->delete();
        Permission::whereIn('name', $permNames)->delete();
    }
};
