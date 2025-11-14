<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Termin extends Model
{
    protected $fillable = [
        'kode_tipe',
        'nama_tipe',
        'deskripsi',
        'tahapan',
    ];

    protected $casts = [
        'tahapan' => 'array',
    ];

    public function kontraks()
    {
        return $this->hasMany(Kontrak::class);
    }
}
