<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GambarKerja extends Model
{
    protected $fillable = [
        'order_id',
        'response_time',
        'response_by',
        'status',
        'notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function files()
    {
        return $this->hasMany(GambarKerjaFile::class);
    }
}
