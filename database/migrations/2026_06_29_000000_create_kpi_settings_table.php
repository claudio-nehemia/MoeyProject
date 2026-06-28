<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create kpi_settings table
        Schema::create('kpi_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('base_points')->default(100);
            $table->integer('points_fast_response')->default(5);
            $table->integer('points_fast_update')->default(10);
            $table->integer('penalty_late')->default(10);
            $table->integer('points_completed_project')->default(20);
            $table->string('bonus_type')->default('flat'); // 'flat' or 'proportional'
            $table->timestamps();
        });

        // Insert default row
        DB::table('kpi_settings')->insert([
            'base_points' => 100,
            'points_fast_response' => 5,
            'points_fast_update' => 10,
            'penalty_late' => 10,
            'points_completed_project' => 20,
            'bonus_type' => 'flat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert new permissions if not already present
        $permissions = [
            [
                'name' => 'kpi.index',
                'display_name' => 'View KPI List & Settings',
                'group' => 'Master Data - KPI',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'kpi.edit-settings',
                'display_name' => 'Edit KPI Settings',
                'group' => 'Master Data - KPI',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        foreach ($permissions as $perm) {
            $exists = DB::table('permissions')->where('name', $perm['name'])->exists();
            if (!$exists) {
                DB::table('permissions')->insert($perm);
            }
        }

        // Map new permissions to Admin role
        $adminRole = DB::table('roles')->where('nama_role', 'Admin')->first();
        if ($adminRole) {
            $insertedPermissions = DB::table('permissions')
                ->whereIn('name', ['kpi.index', 'kpi.edit-settings'])
                ->get();

            foreach ($insertedPermissions as $perm) {
                $mappingExists = DB::table('role_permission')
                    ->where('role_id', $adminRole->id)
                    ->where('permission_id', $perm->id)
                    ->exists();

                if (!$mappingExists) {
                    DB::table('role_permission')->insert([
                        'role_id' => $adminRole->id,
                        'permission_id' => $perm->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove mappings
        $adminRole = DB::table('roles')->where('nama_role', 'Admin')->first();
        if ($adminRole) {
            $insertedPermissions = DB::table('permissions')
                ->whereIn('name', ['kpi.index', 'kpi.edit-settings'])
                ->pluck('id')
                ->toArray();

            DB::table('role_permission')
                ->where('role_id', $adminRole->id)
                ->whereIn('permission_id', $insertedPermissions)
                ->delete();
        }

        // Remove permissions
        DB::table('permissions')
            ->whereIn('name', ['kpi.index', 'kpi.edit-settings'])
            ->delete();

        Schema::dropIfExists('kpi_settings');
    }
};
