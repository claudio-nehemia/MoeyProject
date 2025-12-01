<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('orders', function ($table) {
            $table->string('payment_status')->default('not_start')->change();
            $table->string('tahapan_proyek')->default('not_start')->change();
        });
    }

    public function down()
    {
        Schema::table('orders', function ($table) {
            $table->enum('payment_status', ['not_start', 'cm_fee', 'dp', 'termin', 'lunas'])->default('not_start')->change();
            $table->enum('tahapan_proyek', ['not_start', 'survey', 'moodboard', 'cm_fee', 'desain_final', 'rab', 'kontrak', 'survey_ulang', 'gambar_kerja', 'produksi'])->default('not_start')->change();
        });
    }
};
