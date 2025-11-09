<?php

namespace Database\Seeders;

use App\Models\JenisInterior;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class JenisInteriorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $interiors = [
            'Apartement',
            'Rumah',
            'Hotel',
            'Restaurant',
            'Office',
            'Booth',
            'Other'
        ];

        foreach ($interiors as $interiorName) {
            JenisInterior::firstOrCreate(['nama_interior' => $interiorName]);
        }
    }
}
