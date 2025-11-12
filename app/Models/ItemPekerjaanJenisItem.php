<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanJenisItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'jenis_item_id',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function jenisItem()
    {
        return $this->belongsTo(JenisItem::class);
    }

    public function items()
    {
        return $this->hasMany(ItemPekerjaanItem::class);
    }
}
