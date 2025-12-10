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
            $table->string('nama_ruangan')->nullable()->after('item_pekerjaan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_pekerjaan_produks', function (Blueprint $table) {
            $table->dropColumn('nama_ruangan');
        });
    }
};
