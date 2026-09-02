<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payroll_settings')) {
            Schema::create('payroll_settings', function (Blueprint $table) {
                $table->id();
                $table->unsignedTinyInteger('tanggal_gajian')->default(25)->comment('Tanggal gajian per bulan (1-31)');
                $table->string('tipe_hitung', 30)->default('tanggal_gajian')->comment('akhir_bulan atau tanggal_gajian');
                $table->boolean('auto_generate_on_payday')->default(true)->comment('Otomatis generate saat tanggal gajian');
                $table->unsignedTinyInteger('cutoff_tanggal')->default(20)->comment('Tanggal cutoff absensi & omzet');
                $table->text('catatan')->nullable();
                $table->timestamps();
            });

            // Default seed
            DB::table('payroll_settings')->insert([
                'tanggal_gajian' => 25,
                'tipe_hitung' => 'tanggal_gajian',
                'auto_generate_on_payday' => true,
                'cutoff_tanggal' => 20,
                'catatan' => 'Penggajian otomatis setiap tanggal 25. Setiap hari dapat memonitor gaji sementara.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
