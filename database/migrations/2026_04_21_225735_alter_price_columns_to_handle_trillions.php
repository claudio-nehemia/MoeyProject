<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'items' => ['harga'],
            'produks' => ['harga', 'harga_jasa'],
            'commitment_fees' => ['total_fee'],
            'rab_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir'],
            'rab_aksesoris' => ['harga_satuan_aksesoris', 'harga_total'],
            'rab_kontraks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir', 'harga_satuan_aksesoris', 'harga_total'],
            'rab_vendor_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir'],
            'rab_vendor_aksesoris' => ['harga_satuan_aksesoris', 'harga_total'],
            'rab_jasa_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_akhir'],
            'kontraks' => ['harga_kontrak'],
            'invoices' => ['total_amount'],
            'produk_items' => ['harga_dasar', 'harga_jasa'],
            'item_pekerjaan_produk_bahan_bakus' => ['harga_dasar', 'harga_jasa'],
            'rab_kontrak_produks' => ['harga_finishing_dalam', 'harga_finishing_luar', 'harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir']
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tableBlueprint) use ($columns, $table) {
                    foreach ($columns as $column) {
                        if (Schema::hasColumn($table, $column)) {
                            // Support values up to 999 Trillion (18 digits total, 2 decimal places => 15 integer digits. Let's make it 25, 2 which handles Septillions to be safe)
                            $tableBlueprint->decimal($column, 25, 2)->nullable()->change();
                        }
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'items' => ['harga'],
            'produks' => ['harga', 'harga_jasa'],
            'commitment_fees' => ['total_fee'],
            'rab_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir'],
            'rab_aksesoris' => ['harga_satuan_aksesoris', 'harga_total'],
            'rab_kontraks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir', 'harga_satuan_aksesoris', 'harga_total'],
            'rab_vendor_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir'],
            'rab_vendor_aksesoris' => ['harga_satuan_aksesoris', 'harga_total'],
            'rab_jasa_produks' => ['harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_akhir'],
            'kontraks' => ['harga_kontrak'],
            'invoices' => ['total_amount'],
            'produk_items' => ['harga_dasar', 'harga_jasa'],
            'item_pekerjaan_produk_bahan_bakus' => ['harga_dasar', 'harga_jasa'],
            'rab_kontrak_produks' => ['harga_finishing_dalam', 'harga_finishing_luar', 'harga_dasar', 'harga_items_non_aksesoris', 'harga_dimensi', 'harga_satuan', 'harga_total_aksesoris', 'harga_akhir']
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $tableBlueprint) use ($columns, $table) {
                    foreach ($columns as $column) {
                        if (Schema::hasColumn($table, $column)) {
                            $tableBlueprint->decimal($column, 15, 2)->nullable()->change();
                        }
                    }
                });
            }
        }
    }
};
