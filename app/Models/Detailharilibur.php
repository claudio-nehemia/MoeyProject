<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Detailharilibur extends Model
{
    use HasFactory;
    protected $table = 'hari_libur_detail';
    protected $guarded = ['id'];

    public function harilibur()
    {
        return $this->belongsTo(Harilibur::class, 'kode_libur', 'kode_libur');
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }
}
