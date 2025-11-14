<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstimasiFile extends Model
{
    protected $fillable = [
        'estimasi_id',
        'moodboard_file_id',
        'file_path',
        'original_name',
    ];

    public function estimasi()
    {
        return $this->belongsTo(Estimasi::class);
    }

    public function moodboardFile()
    {
        return $this->belongsTo(MoodboardFile::class);
    }
}
