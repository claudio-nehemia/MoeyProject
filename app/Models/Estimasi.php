<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estimasi extends Model
{
    protected $fillable = [
        'moodboard_id',
        'estimated_cost',
        'response_by',
        'response_time',
    ];

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }
}
