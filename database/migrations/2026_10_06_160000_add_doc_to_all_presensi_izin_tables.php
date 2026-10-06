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
        if (Schema::hasTable('presensi_izinabsen') && !Schema::hasColumn('presensi_izinabsen', 'doc_izin')) {
            Schema::table('presensi_izinabsen', function (Blueprint $table) {
                $table->string('doc_izin', 255)->nullable()->after('keterangan');
            });
        }

        if (Schema::hasTable('presensi_izindinas') && !Schema::hasColumn('presensi_izindinas', 'doc_dinas')) {
            Schema::table('presensi_izindinas', function (Blueprint $table) {
                $table->string('doc_dinas', 255)->nullable()->after('keterangan');
            });
        }

        if (Schema::hasTable('presensi_koreksi') && !Schema::hasColumn('presensi_koreksi', 'doc_koreksi')) {
            Schema::table('presensi_koreksi', function (Blueprint $table) {
                $table->string('doc_koreksi', 255)->nullable()->after('keterangan');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('presensi_izinabsen') && Schema::hasColumn('presensi_izinabsen', 'doc_izin')) {
            Schema::table('presensi_izinabsen', function (Blueprint $table) {
                $table->dropColumn('doc_izin');
            });
        }

        if (Schema::hasTable('presensi_izindinas') && Schema::hasColumn('presensi_izindinas', 'doc_dinas')) {
            Schema::table('presensi_izindinas', function (Blueprint $table) {
                $table->dropColumn('doc_dinas');
            });
        }

        if (Schema::hasTable('presensi_koreksi') && Schema::hasColumn('presensi_koreksi', 'doc_koreksi')) {
            Schema::table('presensi_koreksi', function (Blueprint $table) {
                $table->dropColumn('doc_koreksi');
            });
        }
    }
};
