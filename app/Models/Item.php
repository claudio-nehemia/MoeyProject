<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = ['nama_item', 'jenis_item_id', 'harga'];

    public function jenisItem()
    {
        return $this->belongsTo(JenisItem::class, 'jenis_item_id');
    }

    public function itemPekerjaanItems()
    {
        return $this->hasMany(ItemPekerjaanItem::class);
    }   

    public function produkBahanBakus()
    {
        return $this->belongsToMany(Produk::class, 'produk_items');
    }
}
