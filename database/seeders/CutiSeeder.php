<?php

namespace Database\Seeders;

use App\Models\Cuti;
use Illuminate\Database\Seeder;

class CutiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
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
            Cuti::firstOrCreate(
                ['kode_cuti' => $cuti['kode_cuti']],
                [
                    'jenis_cuti' => $cuti['jenis_cuti'],
                    'jumlah_hari' => $cuti['jumlah_hari'],
                ]
            );
        }
    }
}
