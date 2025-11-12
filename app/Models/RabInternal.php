<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabInternal extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'response_by',
        'response_time',
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
