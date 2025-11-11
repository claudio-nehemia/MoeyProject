<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommitmentFee extends Model
{
    protected $fillable = [
        'total_fee',
        'payment_proof',
        'payment_status',
        'moodboard_id',
        'response_by',
        'response_time',
    ];

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }
}
