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
        if (!Schema::hasColumn('presensi_jamkerja', 'hari')) {
            Schema::table('presensi_jamkerja', function (Blueprint $table) {
                $table->text('hari')->nullable()->after('keterangan');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('presensi_jamkerja', 'hari')) {
            Schema::table('presensi_jamkerja', function (Blueprint $table) {
                $table->dropColumn('hari');
            });
        }
    }
};
