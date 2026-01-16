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
        // Add diskon_per_produk to rab_produks
        Schema::table('rab_produks', function (Blueprint $table) {
            $table->decimal('diskon_per_produk', 5, 2)->default(0)->after('harga_total_aksesoris')->comment('Diskon dalam persen (%)');
        });

        // Add diskon_per_produk to rab_kontrak_produks
        Schema::table('rab_kontrak_produks', function (Blueprint $table) {
            $table->decimal('diskon_per_produk', 5, 2)->default(0)->after('harga_total_aksesoris')->comment('Diskon dalam persen (%)');
        });

        // Add diskon_per_produk to rab_jasa_produks
        Schema::table('rab_jasa_produks', function (Blueprint $table) {
            $table->decimal('diskon_per_produk', 5, 2)->default(0)->after('harga_akhir')->comment('Diskon dalam persen (%)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rab_produks', function (Blueprint $table) {
            $table->dropColumn('diskon_per_produk');
        });

        Schema::table('rab_kontrak_produks', function (Blueprint $table) {
            $table->dropColumn('diskon_per_produk');
        });

        Schema::table('rab_jasa_produks', function (Blueprint $table) {
            $table->dropColumn('diskon_per_produk');
        });
    }
};
