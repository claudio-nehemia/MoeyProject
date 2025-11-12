<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaan extends Model
{
    protected $fillable = [
        'moodboard_id',
        'response_by',
        'response_time',
    ];

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }

    public function produks()
    {
        return $this->hasMany(ItemPekerjaanProduk::class);
    }

    public function rabInternal()
    {
        return $this->hasOne(RabInternal::class);
    }

    public function rabKontrak()
    {
        return $this->hasOne(RabKontrak::class);
    }

    public function rabVendor()
    {
        return $this->hasOne(RabVendor::class);
    }

    public function rabJasa()
    {
        return $this->hasOne(RabJasa::class);
    }


    public function kontrak()
    {
        return $this->hasOne(Kontrak::class);
    }
}
