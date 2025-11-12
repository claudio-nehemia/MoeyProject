<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanProduk extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'produk_id',
        'quantity',
        'panjang',
        'lebar',
        'tinggi',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    public function jenisItems()
    {
        return $this->hasMany(ItemPekerjaanJenisItem::class);
    }
}
