<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Izindinas extends Model
{
    use HasFactory;
    protected $table = 'presensi_izindinas';
    protected $guarded = [];
    protected $primaryKey = 'kode_izin_dinas';
    public $incrementing = false;

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }
}
