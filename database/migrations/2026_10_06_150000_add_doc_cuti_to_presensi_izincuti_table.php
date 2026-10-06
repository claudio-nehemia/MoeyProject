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
        if (Schema::hasTable('presensi_izincuti') && !Schema::hasColumn('presensi_izincuti', 'doc_cuti')) {
            Schema::table('presensi_izincuti', function (Blueprint $table) {
                $table->string('doc_cuti', 255)->nullable()->after('keterangan');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('presensi_izincuti') && Schema::hasColumn('presensi_izincuti', 'doc_cuti')) {
            Schema::table('presensi_izincuti', function (Blueprint $table) {
                $table->dropColumn('doc_cuti');
            });
        }
    }
};
