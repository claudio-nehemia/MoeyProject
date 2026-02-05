<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabInternal extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'response_by',
        'response_time',
        'pm_response_time',
        'pm_response_by',
        'is_submitted',
        'submitted_by',
        'submitted_at',
    ];

    protected $casts = [
        'response_time' => 'datetime',
        'pm_response_time' => 'datetime',
        'submitted_at' => 'datetime',
        'is_submitted' => 'boolean',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function rabProduks()
    {
        return $this->hasMany(RabProduk::class);
    }
}
