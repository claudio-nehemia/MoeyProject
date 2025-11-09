<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\JenisItem;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            // Bahan Baku
            [
                'jenis' => 'Bahan Baku',
                'items' => [
                    ['nama' => 'Blok Mint', 'harga' => 2000000],
                    ['nama' => 'Trip Mint', 'harga' => 3000000],
                    ['nama' => 'HMR', 'harga' => 4000000],
                    ['nama' => 'PVC Board', 'harga' => 4000000],
                    ['nama' => 'MDF', 'harga' => 3400000],
                ]
            ],
            // Finishing Luar
            [
                'jenis' => 'Finishing Luar',
                'items' => [
                    ['nama' => 'HPL Standar', 'harga' => 100000],
                    ['nama' => 'HPL Premium', 'harga' => 400000],
                    ['nama' => 'Duco', 'harga' => 50000],
                    ['nama' => 'Kaca', 'harga' => 300000],
                    ['nama' => 'PVC', 'harga' => 4000000],
                ]
            ],
            // Finishing Dalam
            [
                'jenis' => 'Finishing Dalam',
                'items' => [
                    ['nama' => 'Melaminto', 'harga' => 100000],
                    ['nama' => 'PVC', 'harga' => 400000],
                    ['nama' => 'HPL', 'harga' => 50000],
                    ['nama' => 'Duco', 'harga' => 300000],
                ]
            ],
            // Aksesoris
            [
                'jenis' => 'Aksesoris',
                'items' => [
                    ['nama' => 'Engsel', 'harga' => 100000],
                    ['nama' => 'Drower', 'harga' => 400000],
                    ['nama' => 'Kunci', 'harga' => 50000],
                    ['nama' => 'Handle', 'harga' => 300000],
                ]
            ],
        ];

        foreach ($items as $jenisData) {
            $jenisItem = JenisItem::where('nama_jenis_item', $jenisData['jenis'])->first();
            
            if ($jenisItem) {
                foreach ($jenisData['items'] as $itemData) {
                    Item::firstOrCreate(
                        [
                            'nama_item' => $itemData['nama'],
                            'jenis_item_id' => $jenisItem->id,
                        ],
                        [
                            'harga' => $itemData['harga']
                        ]
                    );
                }
            }
        }
    }
}