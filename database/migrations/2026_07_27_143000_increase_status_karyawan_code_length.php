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
        Schema::table('status_karyawan', function (Blueprint $table) {
            $table->string('kode_status_karyawan', 20)->change();
            $table->string('nama_status_karyawan', 100)->change();
        });

        Schema::table('karyawan', function (Blueprint $table) {
            $table->string('status_karyawan', 20)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('status_karyawan', function (Blueprint $table) {
            $table->string('kode_status_karyawan', 5)->change();
            $table->string('nama_status_karyawan', 30)->change();
        });

        Schema::table('karyawan', function (Blueprint $table) {
            $table->string('status_karyawan', 5)->change();
        });
    }
};
