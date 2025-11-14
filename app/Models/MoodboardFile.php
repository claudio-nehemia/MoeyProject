<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MoodboardFile extends Model
{
    protected $fillable = [
        'moodboard_id',
        'file_path',
        'file_type',
        'original_name',
    ];

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }
}
