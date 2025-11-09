<?php

namespace Database\Seeders;

use App\Models\Divisi;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $listDivisions = [
            'A',
            'B',
            'C',
            'D',
        ];

        foreach ($listDivisions as $divisionName) {
            Divisi::firstOrCreate(['nama_divisi' => $divisionName]);
        }
    }
}
