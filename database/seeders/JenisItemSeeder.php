<?php

namespace Database\Seeders;

use App\Models\JenisItem;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class JenisItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jenisItems = [
            'Bahan Baku',
            'Finishing Luar',
            'Finishing Dalam',
            'Aksesoris',
        ];

        foreach ($jenisItems as $itemName) {
            JenisItem::firstOrCreate(['nama_jenis_item' => $itemName]);
        }
    }
}
