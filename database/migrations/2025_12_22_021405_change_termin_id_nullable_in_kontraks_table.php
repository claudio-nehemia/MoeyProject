<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kontraks', function (Blueprint $table) {
            $table->unsignedBigInteger('termin_id')->nullable()->change();
            $table->integer('durasi_kontrak')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('kontraks', function (Blueprint $table) {
            $table->unsignedBigInteger('termin_id')->nullable(false)->change();
            $table->integer('durasi_kontrak')->nullable(false)->change();
        });
    }

};
