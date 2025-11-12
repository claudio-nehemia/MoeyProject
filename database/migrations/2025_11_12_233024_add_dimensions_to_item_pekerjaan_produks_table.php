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
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->decimal('panjang', 10, 2)->nullable()->after('quantity')->comment('Panjang dalam cm');
            $table->decimal('lebar', 10, 2)->nullable()->after('panjang')->comment('Lebar dalam cm');
            $table->decimal('tinggi', 10, 2)->nullable()->after('lebar')->comment('Tinggi dalam cm');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn(['panjang', 'lebar', 'tinggi']);
        });
    }
};
