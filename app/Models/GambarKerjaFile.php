<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GambarKerjaFile extends Model
{
    protected $fillable = [
        'gambar_kerja_id',
        'file_path',
        'original_name',
        'uploaded_by',
    ];

    public function gambarKerja()
    {
        return $this->belongsTo(GambarKerja::class);
    }
}
