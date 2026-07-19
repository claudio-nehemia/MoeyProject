<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Denda keterlambatan
        if (!Schema::hasTable('denda')) {
            Schema::create('denda', function (Blueprint $table) {
                $table->id();
                $table->smallInteger('dari');
                $table->smallInteger('sampai');
                $table->integer('denda');
                $table->timestamps();
            });
        }

        // 2. Jenis Tunjangan
        if (!Schema::hasTable('jenis_tunjangan')) {
            Schema::create('jenis_tunjangan', function (Blueprint $table) {
                $table->char('kode_jenis_tunjangan', 4)->primary();
                $table->string('jenis_tunjangan');
                $table->char('status_tunjangan', 1)->default('1'); // 0: Tidak Tetap, 1: Tetap
                $table->timestamps();
            });
        }

        // 3. Gaji Pokok per Karyawan
        if (!Schema::hasTable('karyawan_gaji_pokok')) {
            Schema::create('karyawan_gaji_pokok', function (Blueprint $table) {
                $table->char('kode_gaji', 7)->primary();
                $table->char('nik', 10);
                $table->integer('jumlah');
                $table->enum('jenis_upah', ['Bulanan', 'Harian'])->default('Bulanan');
                $table->date('tanggal_berlaku');
                $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 4. BPJS Kesehatan
        if (!Schema::hasTable('karyawan_bpjskesehatan')) {
            Schema::create('karyawan_bpjskesehatan', function (Blueprint $table) {
                $table->char('kode_bpjs_kesehatan', 7)->primary();
                $table->char('nik', 10);
                $table->integer('jumlah');
                $table->date('tanggal_berlaku');
                $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 5. BPJS Ketenagakerjaan
        if (!Schema::hasTable('karyawan_bpjstenagakerja')) {
            Schema::create('karyawan_bpjstenagakerja', function (Blueprint $table) {
                $table->char('kode_bpjs_tk', 7)->primary();
                $table->char('nik', 10);
                $table->integer('jumlah');
                $table->date('tanggal_berlaku');
                $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 6. Tunjangan per Karyawan (Header)
        if (!Schema::hasTable('karyawan_tunjangan')) {
            Schema::create('karyawan_tunjangan', function (Blueprint $table) {
                $table->char('kode_tunjangan', 7)->primary();
                $table->char('nik', 10);
                $table->date('tanggal_berlaku');
                $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 7. Detail Tunjangan per Jenis
        if (!Schema::hasTable('karyawan_tunjangan_detail')) {
            Schema::create('karyawan_tunjangan_detail', function (Blueprint $table) {
                $table->id();
                $table->char('kode_tunjangan', 7);
                $table->char('kode_jenis_tunjangan', 4);
                $table->integer('jumlah');
                $table->foreign('kode_tunjangan')->references('kode_tunjangan')->on('karyawan_tunjangan')->onDelete('cascade')->onUpdate('cascade');
                $table->foreign('kode_jenis_tunjangan')->references('kode_jenis_tunjangan')->on('jenis_tunjangan')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 8. Penyesuaian Gaji (Header)
        if (!Schema::hasTable('karyawan_penyesuaian_gaji')) {
            Schema::create('karyawan_penyesuaian_gaji', function (Blueprint $table) {
                $table->char('kode_penyesuaian_gaji', 9)->primary();
                $table->smallInteger('bulan');
                $table->smallInteger('tahun');
                $table->timestamps();
            });
        }

        // 9. Detail Penyesuaian Gaji per Karyawan
        if (!Schema::hasTable('karyawan_penyesuaian_gaji_detail')) {
            Schema::create('karyawan_penyesuaian_gaji_detail', function (Blueprint $table) {
                $table->id();
                $table->char('kode_penyesuaian_gaji', 9);
                $table->char('nik', 10);
                $table->integer('penambah');
                $table->integer('pengurang');
                $table->string('keterangan');
                $table->foreign('nik')->references('nik')->on('karyawan')->onDelete('cascade')->onUpdate('cascade');
                $table->foreign('kode_penyesuaian_gaji')->references('kode_penyesuaian_gaji')->on('karyawan_penyesuaian_gaji')->onDelete('cascade')->onUpdate('cascade');
                $table->timestamps();
            });
        }

        // 10. Slip Gaji Bulanan
        if (!Schema::hasTable('slip_gaji')) {
            Schema::create('slip_gaji', function (Blueprint $table) {
                $table->char('kode_slip_gaji', 8)->primary();
                $table->smallInteger('bulan');
                $table->char('tahun', 4);
                $table->enum('jenis_upah', ['Bulanan', 'Harian'])->default('Bulanan');
                $table->boolean('status')->default(0);
                $table->timestamps();
            });
        }

        // 11. Slip Gaji Harian (Header)
        if (!Schema::hasTable('slip_gaji_harian')) {
            Schema::create('slip_gaji_harian', function (Blueprint $table) {
                $table->string('kode_slip_gaji_harian', 20)->primary();
                $table->date('tanggal_slip')->nullable();
                $table->date('dari');
                $table->date('sampai');
                $table->boolean('status')->default(0);
                $table->timestamps();
            });
        }

        // 12. Slip Gaji Harian Detail
        if (!Schema::hasTable('slip_gaji_harian_detail')) {
            Schema::create('slip_gaji_harian_detail', function (Blueprint $table) {
                $table->id();
                $table->string('kode_slip_gaji_harian', 20);
                $table->string('nik', 20);
                $table->foreign('kode_slip_gaji_harian')->references('kode_slip_gaji_harian')->on('slip_gaji_harian')->onDelete('cascade');
                $table->timestamps();
            });
        }

        // 13. PPh 21 Settings (Global Config)
        if (!Schema::hasTable('pph21_settings')) {
            Schema::create('pph21_settings', function (Blueprint $table) {
                $table->id();
                $table->boolean('status_aktif')->default(false)->comment('Toggle aktif/nonaktif fitur PPh 21');
                $table->enum('metode', ['TER', 'PROGRESIF'])->default('TER')->comment('Metode perhitungan: TER atau Progresif manual');
                $table->enum('metode_tanggungan', ['GROSS', 'GROSS_UP'])->default('GROSS')->comment('GROSS=karyawan tanggung PPh, GROSS_UP=perusahaan tanggung');
                $table->decimal('biaya_jabatan_persen', 5, 2)->default(5.00)->comment('% Biaya Jabatan (default 5%)');
                $table->bigInteger('biaya_jabatan_max_bulan')->default(500000)->comment('Max biaya jabatan per bulan (default 500rb)');
                $table->timestamps();
            });
        }

        // 14. PPh 21 Formula Komponen
        if (!Schema::hasTable('pph21_formula_komponen')) {
            Schema::create('pph21_formula_komponen', function (Blueprint $table) {
                $table->id();
                $table->string('nama_komponen', 100)->comment('Label tampilan komponen');
                $table->enum('tipe', ['penambah', 'pengurang'])->comment('penambah=masuk bruto, pengurang=dikurangi dari bruto');
                $table->enum('sumber', ['gaji_pokok', 'tunjangan', 'bpjs_kesehatan', 'bpjs_tenagakerja', 'lembur'])->comment('Sumber data komponen');
                $table->string('kode_sumber', 10)->nullable()->comment('Kode jenis tunjangan jika sumber=tunjangan');
                $table->boolean('status_aktif')->default(true);
                $table->integer('urutan')->default(0);
                $table->timestamps();
            });
        }

        // 15. Tambah kolom kategori_ter dan nilai_ptkp ke status_kawin
        if (Schema::hasTable('status_kawin')) {
            if (!Schema::hasColumn('status_kawin', 'kategori_ter')) {
                Schema::table('status_kawin', function (Blueprint $table) {
                    $table->char('kategori_ter', 1)->nullable()->after('status_kawin')->comment('Kategori TER: A, B, atau C');
                    $table->bigInteger('nilai_ptkp')->default(54000000)->after('kategori_ter')->comment('Nilai PTKP per tahun dalam rupiah');
                });
            }
        }

        // 16. Tarif TER Bulanan (PP 58/2023)
        if (!Schema::hasTable('pph21_ter_rates')) {
            Schema::create('pph21_ter_rates', function (Blueprint $table) {
                $table->id();
                $table->char('kategori', 1)->comment('A, B, atau C');
                $table->bigInteger('penghasilan_dari')->default(0)->comment('Batas bawah penghasilan bruto bulanan');
                $table->bigInteger('penghasilan_sampai')->nullable()->comment('Batas atas (null = tak terbatas)');
                $table->decimal('tarif_persen', 5, 2)->default(0.00)->comment('Tarif TER dalam persen');
                $table->boolean('status_aktif')->default(true);
                $table->timestamps();
            });
        }

        // 17. Tarif Progresif Pasal 17 UU HPP
        if (!Schema::hasTable('pph21_progresif_rates')) {
            Schema::create('pph21_progresif_rates', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('pkp_dari')->default(0)->comment('Batas bawah PKP setahun');
                $table->bigInteger('pkp_sampai')->nullable()->comment('Batas atas PKP setahun (null = tak terbatas)');
                $table->decimal('tarif_persen', 5, 2)->default(0.00)->comment('Tarif dalam persen');
                $table->boolean('status_aktif')->default(true);
                $table->timestamps();
            });
        }

        // 18. Snapshot PPh 21 per Karyawan per Slip
        if (!Schema::hasTable('pph21_slip_detail')) {
            Schema::create('pph21_slip_detail', function (Blueprint $table) {
                $table->id();
                $table->char('kode_slip_gaji', 8)->index()->comment('Ref ke slip_gaji');
                $table->char('nik', 10)->comment('NIK karyawan');
                $table->char('kode_status_kawin', 5)->nullable()->comment('Snapshot status kawin saat generate');
                $table->char('kategori_ter', 1)->nullable()->comment('A/B/C');
                $table->enum('metode', ['TER', 'PROGRESIF'])->default('TER');
                $table->enum('metode_tanggungan', ['GROSS', 'GROSS_UP'])->default('GROSS');
                $table->bigInteger('penghasilan_bruto')->default(0)->comment('Total bruto sesuai formula');
                $table->bigInteger('biaya_jabatan')->default(0);
                $table->bigInteger('nilai_ptkp')->default(0)->comment('Nilai PTKP per tahun');
                $table->bigInteger('pkp_setahun')->default(0)->comment('Penghasilan Kena Pajak setahun');
                $table->decimal('tarif_ter_persen', 5, 2)->default(0)->comment('Tarif TER yg digunakan');
                $table->bigInteger('pph21_terutang')->default(0)->comment('PPh 21 final bulan ini');
                $table->bigInteger('pph21_ditanggung_perusahaan')->default(0)->comment('Jika gross-up');
                $table->json('detail_komponen')->nullable()->comment('Snapshot rincian komponen bruto');
                $table->timestamps();
                $table->unique(['kode_slip_gaji', 'nik']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pph21_slip_detail');
        Schema::dropIfExists('pph21_progresif_rates');
        Schema::dropIfExists('pph21_ter_rates');
        if (Schema::hasTable('status_kawin') && Schema::hasColumn('status_kawin', 'kategori_ter')) {
            Schema::table('status_kawin', function (Blueprint $table) {
                $table->dropColumn(['kategori_ter', 'nilai_ptkp']);
            });
        }
        Schema::dropIfExists('pph21_formula_komponen');
        Schema::dropIfExists('pph21_settings');
        Schema::dropIfExists('slip_gaji_harian_detail');
        Schema::dropIfExists('slip_gaji_harian');
        Schema::dropIfExists('slip_gaji');
        Schema::dropIfExists('karyawan_penyesuaian_gaji_detail');
        Schema::dropIfExists('karyawan_penyesuaian_gaji');
        Schema::dropIfExists('karyawan_tunjangan_detail');
        Schema::dropIfExists('karyawan_tunjangan');
        Schema::dropIfExists('karyawan_bpjstenagakerja');
        Schema::dropIfExists('karyawan_bpjskesehatan');
        Schema::dropIfExists('karyawan_gaji_pokok');
        Schema::dropIfExists('jenis_tunjangan');
        Schema::dropIfExists('denda');
    }
};
