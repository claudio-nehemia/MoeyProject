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
        Schema::table('produk_items', function (Blueprint $table) {
            $table->decimal('harga_dasar', 18, 2)->default(0)->after('item_id');
            $table->decimal('harga_jasa', 18, 2)->default(0)->after('harga_dasar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produk_items', function (Blueprint $table) {
            $table->dropColumn(['harga_dasar', 'harga_jasa']);
        });
    }
};
