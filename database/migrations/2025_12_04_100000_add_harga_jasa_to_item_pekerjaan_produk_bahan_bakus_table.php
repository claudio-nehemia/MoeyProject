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
            $table->decimal('harga_jasa', 18, 2)->default(0)->after('harga_dasar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaan_produk_bahan_bakus', function (Blueprint $table) {
            $table->dropColumn('harga_jasa');
        });
    }
};
