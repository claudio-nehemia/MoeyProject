<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GambarKerja extends Model
{
    protected $table = 'gambar_kerjas'; 
    
    protected $fillable = [
        'order_id',
        'gambar_kerja',
        'response_time',
        'response_by',
        'status',
        'notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
