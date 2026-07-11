<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create table pengaturan_umum
        Schema::create('pengaturan_umum', function (Blueprint $table) {
            $table->id();
            $table->string('nama_perusahaan')->default('Moey Project');
            $table->string('nama_aplikasi')->nullable()->default('E-Presensi Moey');
            $table->string('alamat')->default('Bandung');
            $table->string('telepon')->default('-');
            $table->string('logo')->default('logo.png');
            $table->integer('total_jam_bulan')->default(176);
            $table->tinyInteger('show_rate_slip')->default(1);
            $table->tinyInteger('status_potongan_jam')->default(1);
            $table->tinyInteger('absen_istirahat')->default(0);
            $table->tinyInteger('potongan_istirahat')->default(0);
            $table->enum('sistem_hari_kerja', ['5', '6'])->default('6');
            $table->tinyInteger('global_jamkerja_aktif')->default(0);
            $table->tinyInteger('denda')->default(0); // Set default 0 as per user request to disable denda
            $table->tinyInteger('face_recognition')->default(0);
            $table->smallInteger('periode_laporan_dari')->default(26);
            $table->smallInteger('periode_laporan_sampai')->default(25);
            $table->tinyInteger('periode_laporan_next_bulan')->default(1);
            $table->string('cloud_id')->nullable();
            $table->string('api_key')->nullable();
            $table->string('domain_email')->nullable();
            $table->string('domain_wa_gateway')->nullable();
            $table->string('wa_api_key')->default('-');
            $table->string('provider_wa', 2)->default('ig');
            $table->tinyInteger('tujuan_notifikasi_wa')->default(0);
            $table->string('id_group_wa')->nullable();
            $table->tinyInteger('batasi_absen')->default(0);
            $table->smallInteger('batas_jam_absen')->default(0);
            $table->smallInteger('batas_jam_absen_pulang')->default(0);
            $table->tinyInteger('multi_lokasi')->default(0);
            $table->tinyInteger('notifikasi_wa')->default(0);
            $table->tinyInteger('batasi_hari_izin')->default(1);
            $table->integer('jml_hari_izin_max')->default(12);
            $table->time('batas_presensi_lintashari')->default('08:00:00');
            $table->string('timezone')->default('Asia/Jakarta');
            $table->string('theme_color_1')->nullable();
            $table->string('theme_color_2')->nullable();
            $table->string('mobile_theme_scheme')->default('green');
            $table->integer('session_time')->default(120);
            $table->string('nama_hrd')->nullable();
            $table->date('expired')->nullable();
            
            // Dynamic Configurations added
            $table->unsignedBigInteger('cuti_approval_role_id')->nullable();
            $table->tinyInteger('feature_visit_tracking')->default(1);
            $table->tinyInteger('feature_daily_activity')->default(1);
            $table->tinyInteger('feature_wa_notification')->default(1);

            $table->timestamps();
            
            $table->foreign('cuti_approval_role_id')->references('id')->on('roles')->onDelete('set null');
        });

        // Insert default row in pengaturan_umum
        DB::table('pengaturan_umum')->insert([
            'nama_perusahaan' => 'Moey Project',
            'created_at' => now(),
            'updated_at' => now(),
            'total_jam_bulan' => 176,
            'periode_laporan_dari' => 26,
            'periode_laporan_sampai' => 25,
            'periode_laporan_next_bulan' => 1,
            'wa_api_key' => '-',
            'jml_hari_izin_max' => 12,
        ]);

        // 2. Add columns to kpi_settings
        Schema::table('kpi_settings', function (Blueprint $table) {
            $table->integer('penalty_attendance_late')->default(5);
            $table->integer('penalty_attendance_alpha')->default(15);
            $table->integer('bonus_attendance_perfect')->default(15);
        });

        // 3. Add columns to kpi_histories
        Schema::table('kpi_histories', function (Blueprint $table) {
            $table->integer('late_presences')->default(0);
            $table->integer('alpha_days')->default(0);
            $table->boolean('perfect_attendance_bonus')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kpi_histories', function (Blueprint $table) {
            $table->dropColumn(['late_presences', 'alpha_days', 'perfect_attendance_bonus']);
        });

        Schema::table('kpi_settings', function (Blueprint $table) {
            $table->dropColumn(['penalty_attendance_late', 'penalty_attendance_alpha', 'bonus_attendance_perfect']);
        });

        Schema::dropIfExists('pengaturan_umum');
    }
};
