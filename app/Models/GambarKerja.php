<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GambarKerja extends Model
{
    protected $fillable = [
        'order_id',
        'status',                // pending | uploaded | approved
        'response_time',
        'response_by',
        'notes',
        'revisi_notes',
        'approved_time',
        'approved_by',
    ];

    protected $casts = [
        'response_time' => 'datetime',
        'approved_time' => 'datetime',
    ];

    /* ================= RELATIONS ================= */

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function files()
    {
        return $this->hasMany(GambarKerjaFile::class);
    }
}
