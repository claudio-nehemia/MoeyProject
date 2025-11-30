<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $fillable = ['nama_produk', 'harga', 'harga_jasa'];

    public function itemPekerjaanProduks()
    {
        return $this->hasMany(ItemPekerjaanProduk::class);
    }

    public function produkImages()
    {
        return $this->hasMany(ProdukImages::class, 'produk_id');
    }

    public function bahanBakus()
    {
        return $this->belongsToMany(Item::class, 'produk_items')
            ->whereHas('jenisItem', function ($query) {
                $query->where('nama_jenis_item', 'Bahan Baku');
            });
    }
}
