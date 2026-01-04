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
        Schema::table('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->text('keterangan_bahan_baku')->nullable()->after('harga_jasa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->dropColumn('keterangan_bahan_baku');
        });
    }
};
