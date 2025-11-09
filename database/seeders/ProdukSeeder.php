<?php

namespace Database\Seeders;

use App\Models\Produk;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ProdukSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $produks = [
            ['nama_produk' => 'Wardrobe', 'harga' => 1500000],
            ['nama_produk' => 'Kitchen Set', 'harga' => 2500000],
            ['nama_produk' => 'Meja Belajar', 'harga' => 800000],
            ['nama_produk' => 'Lemari Buku', 'harga' => 1200000],
            ['nama_produk' => 'Rak Sepatu', 'harga' => 600000],
        ];

        foreach ($produks as $produk) {
            Produk::firstOrCreate([
                'nama_produk' => $produk['nama_produk'],
                'harga' => $produk['harga'],
            ]);
        }
    }
}
