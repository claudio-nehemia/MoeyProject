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
        // 1. Tambah role Customer jika belum ada
        $roleExists = DB::table('roles')->where('nama_role', 'Customer')->exists();
        if (!$roleExists) {
            $divisiId = DB::table('divisis')->value('id') ?? 1;
            DB::table('roles')->insert([
                'nama_role' => 'Customer',
                'divisi_id' => $divisiId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Tambah kolom customer_user_id di tabel orders
        if (!Schema::hasColumn('orders', 'customer_user_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('customer_user_id')
                    ->nullable()
                    ->after('customer_name')
                    ->constrained('users')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('orders', 'customer_user_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['customer_user_id']);
                $table->dropColumn('customer_user_id');
            });
        }
    }
};
