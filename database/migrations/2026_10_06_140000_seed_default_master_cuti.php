<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultCuti = [
            [
                'kode_cuti' => 'C01',
                'jenis_cuti' => 'Tahunan',
                'jumlah_hari' => 12,
            ],
            [
                'kode_cuti' => 'C02',
                'jenis_cuti' => 'Melahirkan',
                'jumlah_hari' => 90,
            ],
            [
                'kode_cuti' => 'C03',
                'jenis_cuti' => 'Khusus',
                'jumlah_hari' => 1,
            ],
        ];

        foreach ($defaultCuti as $cuti) {
            $exists = DB::table('cuti')->where('kode_cuti', $cuti['kode_cuti'])->exists();
            if (!$exists) {
                DB::table('cuti')->insert([
                    'kode_cuti' => $cuti['kode_cuti'],
                    'jenis_cuti' => $cuti['jenis_cuti'],
                    'jumlah_hari' => $cuti['jumlah_hari'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('cuti')->whereIn('kode_cuti', ['C01', 'C02', 'C03'])->delete();
    }
};
