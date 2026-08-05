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
        if (!Schema::hasTable('pengaturan_umum')) {
            Schema::create('pengaturan_umum', function (Blueprint $table) {
                $table->id();
                $table->string('nama_perusahaan')->nullable();
                $table->string('timezone')->default('Asia/Jakarta');
                $table->boolean('face_recognition')->default(false);
                $table->boolean('batasi_absen')->default(false);
                $table->string('batas_jam_absen')->default('01:00:00');
                $table->string('batas_jam_absen_pulang')->default('01:00:00');
                $table->string('batas_presensi_lintashari')->default('08:00:00');
                $table->boolean('global_jamkerja_aktif')->default(false);
                $table->boolean('feature_visit_tracking')->default(false);
                $table->boolean('feature_daily_activity')->default(false);
                $table->boolean('feature_wa_notification')->default(false);
                $table->unsignedBigInteger('cuti_approval_role_id')->nullable();
                $table->timestamps();
            });
        }

        // Ensure default row exists
        $exists = \Illuminate\Support\Facades\DB::table('pengaturan_umum')->where('id', 1)->exists();
        if (!$exists) {
            \Illuminate\Support\Facades\DB::table('pengaturan_umum')->insert([
                'id' => 1,
                'nama_perusahaan' => 'Moey Project',
                'timezone' => 'Asia/Jakarta',
                'face_recognition' => false,
                'batasi_absen' => false,
                'batas_jam_absen' => '01:00:00',
                'batas_jam_absen_pulang' => '01:00:00',
                'batas_presensi_lintashari' => '08:00:00',
                'global_jamkerja_aktif' => false,
                'feature_visit_tracking' => true,
                'feature_daily_activity' => true,
                'feature_wa_notification' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengaturan_umum');
    }
};
