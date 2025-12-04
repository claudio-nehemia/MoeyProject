<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JenisPengukuranSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['nama_pengukuran' => 'Lift Dimensi Tinggi, Lebar dan Diagonal'],
            ['nama_pengukuran' => 'Lebar dan tinggi plafon koridor menuju unit'],
            ['nama_pengukuran' => 'Pintu unit tinggi dan lebar'],
            ['nama_pengukuran' => 'Lebar dan tinggi plafon dari anak tangga'],
            ['nama_pengukuran' => 'Jendela lebar, tinggi dan jarak antara lantai, plafon dan dinding'],
            ['nama_pengukuran' => 'AC tinggi dari lantai, jarak antara dinding dan plafon'],
            ['nama_pengukuran' => 'MCB, Stop kontak, saklar dan Data'],
            ['nama_pengukuran' => 'Dimensi lorong dalam unit bagian muka dan belakang'],
            ['nama_pengukuran' => 'Tinggi dan lebar Skriting'],
            ['nama_pengukuran' => 'Tinggi dan lebar Drop Ceiling'],
            ['nama_pengukuran' => 'Tinggi, lebar dan panjang kolom'],
            ['nama_pengukuran' => 'Tinggi plafon'],
            ['nama_pengukuran' => 'Posisi lampu, Smoke Detector, Sprinkle dan CCTV'],
            ['nama_pengukuran' => 'Dimensi ukuran elektronik (Kulkas, TV, Microwave, Kompor, Cookerhood)'],
            ['nama_pengukuran' => 'Dimensi Interior Existing'],
            ['nama_pengukuran' => 'Dimensi ukuran keseluruhan unit dan layout'],
            ['nama_pengukuran' => 'Dokumentasi Foto & Video'],
        ];

        DB::table('jenis_pengukuran')->insert($data);
    }
}
