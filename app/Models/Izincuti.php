<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Izincuti extends Model
{
    use HasFactory;
    protected $table = 'presensi_izincuti';
    protected $guarded = [];
    protected $primaryKey = 'kode_izin_cuti';
    public $incrementing = false;

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }

    public function cuti()
    {
        return $this->belongsTo(Cuti::class, 'kode_cuti', 'kode_cuti');
    }
}
