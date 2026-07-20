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
        // 1. pelatihan table
        Schema::create('pelatihan', function (Blueprint $table) {
            $table->string('kode_pelatihan', 30)->primary();
            $table->string('nama_pelatihan', 150);
            $table->string('penyelenggara', 100);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        // 2. karyawan_pelatihan table
        Schema::create('karyawan_pelatihan', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nik', 9);
            $table->string('kode_pelatihan', 30);
            $table->string('status_kelulusan', 20)->default('Mengikuti'); // Mengikuti, Lulus, Tidak Lulus
            $table->string('nilai', 10)->nullable();
            $table->string('file_sertifikat', 255)->nullable();
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('kode_pelatihan')->references('kode_pelatihan')->on('pelatihan')->onDelete('cascade');
        });

        // 3. karyawan_resign table
        Schema::create('karyawan_resign', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nik', 9);
            $table->date('tanggal_pengajuan');
            $table->date('tanggal_efektif');
            $table->text('alasan');
            $table->string('file_surat_resign', 255)->nullable();
            $table->string('status_approval', 15)->default('Pending'); // Pending, Disetujui, Ditolak
            $table->text('catatan_hrd')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('karyawan_resign');
        Schema::dropIfExists('karyawan_pelatihan');
        Schema::dropIfExists('pelatihan');
    }
};
