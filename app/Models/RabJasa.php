<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabJasa extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_pekerjaan_id',
        'response_by',
        'response_time',
    ];

    protected $casts = [
        'response_time' => 'datetime',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function rabJasaProduks()
    {
        return $this->hasMany(RabJasaProduk::class);
    }
}
