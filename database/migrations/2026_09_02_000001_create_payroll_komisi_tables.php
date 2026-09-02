<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Konfigurasi gaji per jabatan (based on Excel: Simulasi Komposisi Pendapatan)
        if (!Schema::hasTable('payroll_position_configs')) {
            Schema::create('payroll_position_configs', function (Blueprint $table) {
                $table->id();
                $table->string('divisi', 50)->comment('Nama divisi: Design, Marketing, Team Tengah, Pelaksana Project');
                $table->string('jabatan', 100)->comment('Nama jabatan: Staff Drafter, Manager Design, dll');
                $table->string('kode_jabatan', 10)->nullable()->comment('FK ke tabel jabatan jika ada');

                // Gaji Pokok
                $table->bigInteger('gaji_pokok')->default(0)->comment('Gaji pokok per bulan (Rp)');
                $table->bigInteger('gaji_pokok_harian')->default(0)->comment('Gaji pokok per hari (gaji_pokok / hari_kerja)');

                // Tunjangan Jabatan
                $table->bigInteger('tunjangan_jabatan')->default(0)->comment('Nominal tunjangan jabatan');
                $table->string('tunjangan_jabatan_condition', 50)->nullable()->comment('Kondisi: omzet_min, always, never');
                $table->bigInteger('tunjangan_jabatan_min_omzet')->default(0)->comment('Min omzet agar tunjangan aktif');

                // Tunjangan Operasional Harian
                $table->bigInteger('transportasi_harian')->default(25000)->comment('Transportasi per hari');
                $table->bigInteger('makan_harian')->default(40000)->comment('Uang makan per hari');
                $table->bigInteger('kehadiran_harian')->default(55000)->comment('Uang kehadiran/absensi per hari');

                // Commitment Fee
                $table->bigInteger('cf_per_client')->default(0)->comment('CF per client yang masuk');
                $table->unsignedTinyInteger('cf_max_per_bulan')->default(0)->comment('Maksimum CF per bulan (e.g. 4, 8)');

                // Komisi atas DP (Internal)
                $table->decimal('komisi_dp_persen_internal', 6, 4)->default(0)->comment('% komisi atas DP internal (e.g. 0.014 = 1.4%)');
                $table->decimal('komisi_dp_persen_eksternal', 6, 4)->default(0)->comment('% komisi atas DP eksternal');
                $table->decimal('komisi_dp_bayar_persen', 5, 2)->default(70)->comment('% yang dibayarkan (30/50/70%)');
                $table->bigInteger('min_omzet_komisi_dp')->default(0)->comment('Minimum omzet untuk mendapat komisi DP');

                // Komisi atas Pelunasan
                $table->decimal('komisi_pelunasan_persen_internal', 6, 4)->default(0)->comment('% komisi atas pelunasan internal');
                $table->decimal('komisi_pelunasan_persen_eksternal', 6, 4)->default(0)->comment('% komisi atas pelunasan eksternal');
                $table->decimal('komisi_pelunasan_bayar_persen', 5, 2)->default(30)->comment('% yang dibayarkan');

                // Achievement
                $table->decimal('achievement_rate', 6, 4)->default(0)->comment('Rate achievement atas omzet (e.g. 0.0035)');
                $table->bigInteger('min_omzet_achievement')->default(0)->comment('Min omzet untuk achievement');
                $table->bigInteger('achievement_fixed')->default(0)->comment('Bonus achievement fixed (jika ada, e.g. 2000000)');
                $table->decimal('min_success_project_persen', 5, 2)->default(50)->comment('Min % success project');

                // Komisi Success Project
                $table->decimal('komisi_success_persen_internal', 6, 4)->default(0)->comment('% komisi success project internal');
                $table->decimal('komisi_success_persen_eksternal', 6, 4)->default(0)->comment('% komisi success project eksternal');
                $table->decimal('komisi_success_bayar_persen', 5, 2)->default(30)->comment('% yang dibayarkan');

                // Achievement Pelaksanaan (per project selesai)
                $table->decimal('achievement_pelaksanaan_persen', 6, 4)->default(0)->comment('% achievement pelaksanaan');

                // Settings
                $table->unsignedTinyInteger('hari_kerja_default')->default(26);
                $table->boolean('is_active')->default(true);
                $table->text('catatan')->nullable();

                $table->timestamps();

                $table->index('divisi');
                $table->index('jabatan');
            });
        }

        // 2. Konfigurasi KPI per jabatan
        if (!Schema::hasTable('payroll_kpi_configs')) {
            Schema::create('payroll_kpi_configs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_position_config_id')->constrained('payroll_position_configs')->cascadeOnDelete();
                $table->string('komponen', 50)->comment('omzet, omzet_mandiri, omzet_team, cf, cf_mandiri, cf_team, absensi, timeline, team');
                $table->decimal('bobot', 5, 2)->default(0)->comment('Bobot dalam persen (e.g. 40 = 40%)');
                $table->unsignedTinyInteger('urutan')->default(0);
                $table->timestamps();
            });
        }

        // 3. Kasbon karyawan
        if (!Schema::hasTable('payroll_kasbon')) {
            Schema::create('payroll_kasbon', function (Blueprint $table) {
                $table->id();
                $table->char('nik', 10);
                $table->bigInteger('total_kasbon')->default(0);
                $table->bigInteger('cicilan_per_bulan')->default(0);
                $table->bigInteger('sisa_kasbon')->default(0);
                $table->text('keterangan')->nullable();
                $table->enum('status', ['aktif', 'lunas'])->default('aktif');
                $table->foreign('nik')->references('nik')->on('karyawan')->cascadeOnDelete()->cascadeOnUpdate();
                $table->timestamps();
            });
        }

        // 4. Slip gaji bulanan (komisi & achievement)
        if (!Schema::hasTable('payroll_monthly')) {
            Schema::create('payroll_monthly', function (Blueprint $table) {
                $table->id();
                $table->char('nik', 10);
                $table->unsignedTinyInteger('bulan');
                $table->unsignedSmallInteger('tahun');
                $table->foreignId('payroll_position_config_id')->nullable()->constrained('payroll_position_configs')->nullOnDelete();

                // Hari kerja
                $table->unsignedTinyInteger('hari_kerja')->default(26)->comment('Total hari kerja bulan itu');
                $table->unsignedTinyInteger('hari_hadir')->default(0)->comment('Total hari hadir karyawan');

                // Capaian Omzet
                $table->bigInteger('capaian_omzet_internal')->default(0);
                $table->bigInteger('capaian_omzet_eksternal')->default(0);

                // Komponen Pendapatan
                $table->bigInteger('gaji_pokok')->default(0);
                $table->bigInteger('tunjangan_jabatan')->default(0);
                $table->bigInteger('transportasi')->default(0);
                $table->bigInteger('makan')->default(0);
                $table->bigInteger('kehadiran')->default(0);
                $table->bigInteger('komisi_cf')->default(0)->comment('Komisi dari Commitment Fee');
                $table->bigInteger('komisi_dp')->default(0)->comment('Komisi atas DP (internal + eksternal)');
                $table->bigInteger('komisi_pelunasan')->default(0)->comment('Komisi atas pelunasan');
                $table->bigInteger('komisi_success_project')->default(0)->comment('Komisi success project');
                $table->bigInteger('achievement_omzet')->default(0)->comment('Achievement atas omzet');
                $table->bigInteger('achievement_pelaksanaan')->default(0)->comment('Achievement pelaksanaan project');

                // Subtotals
                $table->bigInteger('total_pendapatan_diluar_komisi')->default(0)->comment('Gaji + Tunjangan + Operasional');
                $table->bigInteger('total_pendapatan_cf')->default(0)->comment('Total CF');
                $table->bigInteger('total_pendapatan_komisi_achievement')->default(0)->comment('Komisi DP + Pelunasan + Achievement');

                // Potongan
                $table->bigInteger('kasbon')->default(0)->comment('Potongan kasbon');

                // Total
                $table->bigInteger('total_diterima')->default(0)->comment('Total akhir yang diterima');

                // KPI
                $table->decimal('kpi_skor', 5, 2)->nullable()->comment('Skor KPI 0-100');
                $table->string('kpi_status', 20)->nullable()->comment('Sangat Baik/Baik/Cukup/Buruk/Sangat Buruk');
                $table->json('kpi_detail')->nullable()->comment('Snapshot detail komponen KPI');

                // Status
                $table->enum('status', ['draft', 'final', 'paid'])->default('draft');
                $table->unsignedBigInteger('generated_by')->nullable();

                $table->foreign('nik')->references('nik')->on('karyawan')->cascadeOnDelete()->cascadeOnUpdate();
                $table->timestamps();

                $table->unique(['nik', 'bulan', 'tahun']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_monthly');
        Schema::dropIfExists('payroll_kasbon');
        Schema::dropIfExists('payroll_kpi_configs');
        Schema::dropIfExists('payroll_position_configs');
    }
};
