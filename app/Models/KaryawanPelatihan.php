<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KaryawanPelatihan extends Model
{
    use HasFactory;

    protected $table = 'karyawan_pelatihan';
    protected $guarded = [];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }

    public function pelatihan()
    {
        return $this->belongsTo(Pelatihan::class, 'kode_pelatihan', 'kode_pelatihan');
    }
}
