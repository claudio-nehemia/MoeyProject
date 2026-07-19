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
        Schema::create('log_mesin_presensis', function (Blueprint $table) {
            $table->id();
            $table->string('pin');
            $table->string('status_scan')->nullable();
            $table->dateTime('jam_absen')->nullable();
            $table->string('id_mesin')->nullable();
            $table->tinyInteger('status')->default(0)->comment('1: success, 0: fail');
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_mesin_presensis');
    }
};
