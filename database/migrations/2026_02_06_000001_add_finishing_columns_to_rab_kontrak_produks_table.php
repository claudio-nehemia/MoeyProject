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
        Schema::table('rab_kontrak_produks', function (Blueprint $table) {
            // Add columns for finishing dalam and finishing luar (already with markup)
            $table->decimal('harga_finishing_dalam', 15, 2)->default(0)->after('harga_dasar');
            $table->decimal('harga_finishing_luar', 15, 2)->default(0)->after('harga_finishing_dalam');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rab_kontrak_produks', function (Blueprint $table) {
            $table->dropColumn(['harga_finishing_dalam', 'harga_finishing_luar']);
        });
    }
};
