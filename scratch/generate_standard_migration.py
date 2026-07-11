# Python script to generate standard Laravel schema migrations for absensi tables
import os

migration_file = r"c:\projectFlutter\MOEYPROJECT\MoeyBackendAdmin\database\migrations\2026_07_12_000001_create_absensi_tables.php"

migration_code = """<?php

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
        // 1. cabang
        Schema::create('cabang', function (Blueprint $table) {
            $table->string('kode_cabang', 3)->primary();
            $table->string('nama_cabang', 50);
            $table->string('alamat_cabang', 100);
            $table->string('telepon_cabang', 13);
            $table->string('lokasi_cabang', 255);
            $table->smallInteger('radius_cabang');
            $table->string('timezone', 255)->default('Asia/Jakarta');
            $table->timestamps();
        });

        // 2. departemen
        Schema::create('departemen', function (Blueprint $table) {
            $table->string('kode_dept', 3)->primary();
            $table->string('nama_dept', 30);
            $table->timestamps();
        });

        // 3. jabatan
        Schema::create('jabatan', function (Blueprint $table) {
            $table->string('kode_jabatan', 3)->primary();
            $table->string('nama_jabatan', 30);
            $table->timestamps();
        });

        // 4. status_kawin
        Schema::create('status_kawin', function (Blueprint $table) {
            $table->string('kode_status_kawin', 2)->primary();
            $table->string('status_kawin', 255);
            $table->string('kategori_ter', 1)->nullable();
            $table->bigInteger('nilai_ptkp')->default(54000000);
            $table->timestamps();
        });

        // 5. status_karyawan
        Schema::create('status_karyawan', function (Blueprint $table) {
            $table->string('kode_status_karyawan', 5)->primary();
            $table->string('nama_status_karyawan', 30);
            $table->timestamps();
        });

        // 6. cuti
        Schema::create('cuti', function (Blueprint $table) {
            $table->string('kode_cuti', 3)->primary();
            $table->string('jenis_cuti', 255);
            $table->smallInteger('jumlah_hari');
            $table->timestamps();
        });

        // 7. mesin_fingerprints
        Schema::create('mesin_fingerprints', function (Blueprint $table) {
            $table->id();
            $table->string('sn', 255)->unique();
            $table->string('nama_mesin', 255);
            $table->string('merk', 255)->nullable();
            $table->string('lokasi', 255)->nullable();
            $table->string('titik_koordinat', 255)->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });

        // 8. karyawan
        Schema::create('karyawan', function (Blueprint $table) {
            $table->string('nik', 9)->primary();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('nik_show', 30)->nullable();
            $table->string('no_ktp', 16);
            $table->string('npwp', 20)->nullable();
            $table->tinyInteger('hitung_pph21')->default(1);
            $table->string('nama_karyawan', 100);
            $table->string('tempat_lahir', 20)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('alamat', 255)->nullable();
            $table->string('alamat_sesuai_ktp', 255)->nullable();
            $table->string('no_hp', 15)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('kontak_darurat', 100)->nullable();
            $table->string('hubungan_kontak_darurat', 50)->nullable();
            $table->string('nama_bank', 50)->nullable();
            $table->string('no_rekening', 30)->nullable();
            $table->string('nama_rekening', 100)->nullable();
            $table->string('jenis_kelamin', 1);
            $table->string('kode_status_kawin', 2)->nullable();
            $table->string('pendidikan_terakhir', 4)->nullable();
            $table->string('jurusan', 100)->nullable();
            $table->string('kode_cabang', 3);
            $table->json('kode_cabang_array')->nullable();
            $table->string('kode_dept', 3);
            $table->string('kode_jabatan', 3);
            $table->date('tanggal_masuk');
            $table->string('status_karyawan', 5); // linked to status_karyawan table
            $table->string('foto', 255)->nullable();
            $table->string('kode_jadwal', 5)->nullable();
            $table->smallInteger('pin')->nullable();
            $table->string('rfid_uid', 255)->nullable()->unique();
            $table->date('tanggal_nonaktif')->nullable();
            $table->date('tanggal_off_gaji')->nullable();
            $table->string('lock_location', 1)->default('1');
            $table->string('lock_jam_kerja', 1)->default('1');
            $table->string('status_aktif_karyawan', 1)->default('1');
            $table->string('password', 255)->default('');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kode_cabang')->references('kode_cabang')->on('cabang')->onUpdate('cascade');
            $table->foreign('kode_dept')->references('kode_dept')->on('departemen')->onUpdate('cascade');
            $table->foreign('kode_jabatan')->references('kode_jabatan')->on('jabatan')->onUpdate('cascade');
            $table->foreign('kode_status_kawin')->references('kode_status_kawin')->on('status_kawin')->onUpdate('cascade');
            $table->foreign('status_karyawan')->references('kode_status_karyawan')->on('status_karyawan')->onUpdate('cascade');
        });

        // 9. presensi_jamkerja
        Schema::create('presensi_jamkerja', function (Blueprint $table) {
            $table->string('kode_jam_kerja', 4)->primary();
            $table->string('nama_jam_kerja', 255);
            $table->time('jam_masuk');
            $table->time('jam_pulang');
            $table->string('istirahat', 1)->default('0');
            $table->time('jam_awal_istirahat')->nullable();
            $table->time('jam_akhir_istirahat')->nullable();
            $table->smallInteger('total_jam');
            $table->string('lintashari', 1)->default('0');
            $table->time('batas_presensi_pulang')->nullable();
            $table->string('keterangan', 255)->nullable();
            $table->string('color', 7)->nullable();
            $table->timestamps();
        });

        // 10. presensi
        Schema::create('presensi', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 9);
            $table->date('tanggal');
            $table->dateTime('jam_in')->nullable();
            $table->dateTime('jam_out')->nullable();
            $table->string('foto_in', 255)->nullable();
            $table->string('foto_out', 255)->nullable();
            $table->unsignedBigInteger('id_mesin')->nullable();
            $table->string('lokasi_in', 255)->nullable();
            $table->string('lokasi_out', 255)->nullable();
            $table->string('kode_jam_kerja', 4);
            $table->string('status', 1); // 'h'=hadir, 'i'=izin, 's'=sakit, 'c'=cuti
            $table->integer('denda')->nullable();
            $table->decimal('jam_lembur_aktual', 5, 2)->nullable();
            $table->decimal('jam_lembur_netto', 5, 2)->nullable();
            $table->integer('nominal_lembur')->nullable();
            $table->tinyInteger('is_lembur_khusus')->default(0);
            $table->dateTime('istirahat_in')->nullable();
            $table->string('lokasi_istirahat_in', 255)->nullable();
            $table->string('foto_istirahat_in', 255)->nullable();
            $table->dateTime('istirahat_out')->nullable();
            $table->string('lokasi_istirahat_out', 255)->nullable();
            $table->string('foto_istirahat_out', 255)->nullable();
            $table->tinyInteger('status_potongan')->nullable();
            $table->tinyInteger('status_potongan_istirahat')->nullable();
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja');
            $table->foreign('id_mesin')->references('id')->on('mesin_fingerprints')->onDelete('set null');
        });

        // 11. presensi_jamkerja_bydate
        Schema::create('presensi_jamkerja_bydate', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 9);
            $table->date('tanggal');
            $table->string('kode_jam_kerja', 4);
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja');
        });

        // 12. presensi_jamkerja_byday
        Schema::create('presensi_jamkerja_byday', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 9);
            $table->string('hari', 255);
            $table->string('kode_jam_kerja', 4);
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja');
        });

        // 13. presensi_jamkerja_bydept
        Schema::create('presensi_jamkerja_bydept', function (Blueprint $table) {
            $table->string('kode_jk_dept', 7)->primary();
            $table->string('kode_cabang', 3);
            $table->string('kode_dept', 3);
            $table->timestamps();
        });

        // 14. presensi_jamkerja_bydept_detail
        Schema::create('presensi_jamkerja_bydept_detail', function (Blueprint $table) {
            $table->id();
            $table->string('kode_jk_dept', 7);
            $table->string('hari', 255);
            $table->string('kode_jam_kerja', 4);
            $table->timestamps();

            $table->foreign('kode_jk_dept')->references('kode_jk_dept')->on('presensi_jamkerja_bydept')->onDelete('cascade');
            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja');
        });

        // 15. global_jamkerja
        Schema::create('global_jamkerja', function (Blueprint $table) {
            $table->id();
            $table->string('hari', 10);
            $table->string('kode_jam_kerja', 4)->nullable();
            $table->timestamps();

            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja');
        });

        // 16. karyawan_wajah (Face templates)
        Schema::create('karyawan_wajah', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 9);
            $table->string('wajah', 255);
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 17. presensi_izinabsen
        Schema::create('presensi_izinabsen', function (Blueprint $table) {
            $table->string('kode_izin', 255)->primary();
            $table->date('tanggal');
            $table->date('dari');
            $table->date('sampai');
            $table->string('nik', 9);
            $table->string('keterangan', 255);
            $table->string('keterangan_hrd', 255)->nullable();
            $table->string('status', 1);
            $table->integer('approval_step')->default(0);
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 18. presensi_izincuti
        Schema::create('presensi_izincuti', function (Blueprint $table) {
            $table->string('kode_izin_cuti', 12)->primary();
            $table->string('nik', 9);
            $table->date('tanggal');
            $table->date('dari');
            $table->date('sampai');
            $table->string('kode_cuti', 3);
            $table->string('keterangan', 255);
            $table->string('pelimpahan_tugas', 255)->nullable();
            $table->string('nama_kepala_divisi', 255)->nullable();
            $table->string('keterangan_hrd', 255)->nullable();
            $table->string('status', 1);
            $table->tinyInteger('approval_step')->default(0);
            $table->unsignedBigInteger('id_user');
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('kode_cuti')->references('kode_cuti')->on('cuti');
        });

        // 19. presensi_izinsakit
        Schema::create('presensi_izinsakit', function (Blueprint $table) {
            $table->string('kode_izin_sakit', 12)->primary();
            $table->string('nik', 9);
            $table->date('tanggal');
            $table->date('dari');
            $table->date('sampai');
            $table->string('doc_sid', 255)->nullable();
            $table->string('keterangan', 255);
            $table->string('keterangan_hrd', 255)->nullable();
            $table->string('status', 1);
            $table->tinyInteger('approval_step')->default(0);
            $table->unsignedBigInteger('id_user');
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 20. presensi_izindinas
        Schema::create('presensi_izindinas', function (Blueprint $table) {
            $table->string('kode_izin_dinas', 255)->primary();
            $table->date('tanggal');
            $table->date('dari');
            $table->date('sampai');
            $table->string('nik', 9);
            $table->string('keterangan', 255);
            $table->string('keterangan_hrd', 255)->nullable();
            $table->string('status', 1);
            $table->tinyInteger('approval_step')->default(0);
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 21. presensi_izinabsen_approve (links approval to presensi)
        Schema::create('presensi_izinabsen_approve', function (Blueprint $table) {
            $table->unsignedBigInteger('id_presensi')->primary();
            $table->string('kode_izin', 255);
            $table->timestamps();

            $table->foreign('id_presensi')->references('id')->on('presensi')->onDelete('cascade');
            $table->foreign('kode_izin')->references('kode_izin')->on('presensi_izinabsen')->onDelete('cascade');
        });

        // 22. presensi_izincuti_approve
        Schema::create('presensi_izincuti_approve', function (Blueprint $table) {
            $table->unsignedBigInteger('id_presensi')->primary();
            $table->string('kode_izin_cuti', 12);
            $table->timestamps();

            $table->foreign('id_presensi')->references('id')->on('presensi')->onDelete('cascade');
            $table->foreign('kode_izin_cuti')->references('kode_izin_cuti')->on('presensi_izincuti')->onDelete('cascade');
        });

        // 23. presensi_izinsakit_approve
        Schema::create('presensi_izinsakit_approve', function (Blueprint $table) {
            $table->unsignedBigInteger('id_presensi')->primary();
            $table->string('kode_izin_sakit', 12);
            $table->timestamps();

            $table->foreign('id_presensi')->references('id')->on('presensi')->onDelete('cascade');
            $table->foreign('kode_izin_sakit')->references('kode_izin_sakit')->on('presensi_izinsakit')->onDelete('cascade');
        });

        // 24. presensi_koreksi
        Schema::create('presensi_koreksi', function (Blueprint $table) {
            $table->string('kode_koreksi', 10)->primary();
            $table->string('nik', 9);
            $table->date('tanggal');
            $table->string('kode_jam_kerja', 4)->nullable();
            $table->time('jam_in')->nullable();
            $table->time('jam_out')->nullable();
            $table->string('keterangan', 255);
            $table->string('status', 1)->default('0');
            $table->integer('approval_step')->default(1);
            $table->unsignedBigInteger('id_user');
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
            $table->foreign('id_user')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('kode_jam_kerja')->references('kode_jam_kerja')->on('presensi_jamkerja')->onDelete('set null');
        });

        // 25. presensi_koreksi_approve
        Schema::create('presensi_koreksi_approve', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_presensi');
            $table->string('kode_koreksi', 10);
            $table->timestamps();

            $table->foreign('id_presensi')->references('id')->on('presensi')->onDelete('cascade');
            $table->foreign('kode_koreksi')->references('kode_koreksi')->on('presensi_koreksi')->onDelete('cascade');
        });

        // 26. lembur
        Schema::create('lembur', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->string('nik', 9);
            $table->dateTime('lembur_mulai');
            $table->dateTime('lembur_selesai');
            $table->dateTime('lembur_in')->nullable();
            $table->dateTime('lembur_out')->nullable();
            $table->string('foto_lembur_in', 255)->nullable();
            $table->string('foto_lembur_out', 255)->nullable();
            $table->string('lokasi_lembur_in', 255)->nullable();
            $table->string('lokasi_lembur_out', 255)->nullable();
            $table->string('status', 1);
            $table->string('keterangan', 255);
            $table->timestamps();
        });

        // 27. hari_libur
        Schema::create('hari_libur', function (Blueprint $table) {
            $table->string('kode_libur', 7)->primary();
            $table->date('tanggal');
            $table->string('kode_cabang', 3);
            $table->string('keterangan', 255);
            $table->timestamps();

            $table->foreign('kode_cabang')->references('kode_cabang')->on('cabang')->onUpdate('cascade');
        });

        // 28. hari_libur_detail
        Schema::create('hari_libur_detail', function (Blueprint $table) {
            $table->id();
            $table->string('kode_libur', 7);
            $table->string('nik', 9);
            $table->timestamps();

            $table->foreign('kode_libur')->references('kode_libur')->on('hari_libur')->onDelete('cascade');
            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 29. pengumuman
        Schema::create('pengumuman', function (Blueprint $table) {
            $table->id();
            $table->string('judul', 255);
            $table->text('isi');
            $table->string('lampiran', 255)->nullable();
            $table->timestamps();
        });

        // 30. kunjungan
        Schema::create('kunjungan', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 20);
            $table->text('deskripsi')->nullable();
            $table->string('foto', 255)->nullable();
            $table->string('lokasi', 255)->nullable();
            $table->date('tanggal_kunjungan');
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });

        // 31. aktivitas_karyawan
        Schema::create('aktivitas_karyawan', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 20);
            $table->text('aktivitas');
            $table->string('foto', 255)->nullable();
            $table->string('lokasi', 255)->nullable();
            $table->timestamps();

            $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aktivitas_karyawan');
        Schema::dropIfExists('kunjungan');
        Schema::dropIfExists('pengumuman');
        Schema::dropIfExists('hari_libur_detail');
        Schema::dropIfExists('hari_libur');
        Schema::dropIfExists('lembur');
        Schema::dropIfExists('presensi_koreksi_approve');
        Schema::dropIfExists('presensi_koreksi');
        Schema::dropIfExists('presensi_izinsakit_approve');
        Schema::dropIfExists('presensi_izincuti_approve');
        Schema::dropIfExists('presensi_izinabsen_approve');
        Schema::dropIfExists('presensi_izindinas');
        Schema::dropIfExists('presensi_izinsakit');
        Schema::dropIfExists('presensi_izincuti');
        Schema::dropIfExists('presensi_izinabsen');
        Schema::dropIfExists('karyawan_wajah');
        Schema::dropIfExists('global_jamkerja');
        Schema::dropIfExists('presensi_jamkerja_bydept_detail');
        Schema::dropIfExists('presensi_jamkerja_bydept');
        Schema::dropIfExists('presensi_jamkerja_byday');
        Schema::dropIfExists('presensi_jamkerja_bydate');
        Schema::dropIfExists('presensi');
        Schema::dropIfExists('presensi_jamkerja');
        Schema::dropIfExists('karyawan');
        Schema::dropIfExists('mesin_fingerprints');
        Schema::dropIfExists('cuti');
        Schema::dropIfExists('status_karyawan');
        Schema::dropIfExists('status_kawin');
        Schema::dropIfExists('jabatan');
        Schema::dropIfExists('departemen');
        Schema::dropIfExists('cabang');
    }
};
"""

with open(migration_file, "w", encoding="utf-8") as f:
    f.write(migration_code)

print("Standard schema migration generated successfully!")
