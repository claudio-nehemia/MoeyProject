<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Moodboard extends Model
{
    protected $fillable = [
        'order_id',
        'moodboard_kasar',
        'moodboard_final',
        'response_time',
        'response_by',
        'status',
        'notes',  
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function estimasi()
    {
        return $this->hasOne(Estimasi::class);
    }

    public function commitmentFee()
    {
        return $this->hasOne(CommitmentFee::class);
    }
}
