<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pelatihan extends Model
{
    use HasFactory;

    protected $table = 'pelatihan';
    protected $primaryKey = 'kode_pelatihan';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];

    public function karyawanPelatihan()
    {
        return $this->hasMany(KaryawanPelatihan::class, 'kode_pelatihan', 'kode_pelatihan');
    }
}
