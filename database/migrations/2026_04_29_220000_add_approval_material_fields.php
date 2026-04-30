<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah field kode_material (JSON), brand_spek (JSON), area
     * ke item_pekerjaan_items dan item_pekerjaan_produk_bahan_bakus
     * untuk Approval Material / export PDF.
     */
    public function up(): void
    {
        // ===== item_pekerjaan_items (finishing & aksesoris) =====
        Schema::table('item_pekerjaan_items', function (Blueprint $table) {
            $table->json('kode_material')->nullable()->after('keterangan_material');
            $table->json('brand_spek')->nullable()->after('kode_material');
            $table->string('area')->nullable()->after('brand_spek');
        });

        // ===== item_pekerjaan_produk_bahan_bakus (bahan baku) =====
        Schema::table('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->json('kode_material')->nullable()->after('keterangan_bahan_baku');
            $table->json('brand_spek')->nullable()->after('kode_material');
            $table->string('area')->nullable()->after('brand_spek');
        });
    }

    public function down(): void
    {
        Schema::table('item_pekerjaan_items', function (Blueprint $table) {
            $table->dropColumn(['kode_material', 'brand_spek', 'area']);
        });

        Schema::table('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->dropColumn(['kode_material', 'brand_spek', 'area']);
        });
    }
};
