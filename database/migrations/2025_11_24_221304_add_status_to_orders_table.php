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
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('payment_status', ['not_start','cm_fee', 'dp', 'termin', 'lunas'])->default('not_start');
            $table->enum('tahapan_proyek', ['not_start','survey', 'moodboard', 'cm_fee', 'desain_final', 'rab', 'kontrak', 'survey_ulang', 'gambar_kerja', 'produksi'])->default('not_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('payment_status');
            $table->dropColumn('tahapan_proyek');
        });
    }
};
