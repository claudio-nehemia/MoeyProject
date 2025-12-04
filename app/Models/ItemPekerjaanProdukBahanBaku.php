<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanProdukBahanBaku extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'item_id',
        'harga_dasar',
        'harga_jasa',
    ];

    protected $casts = [
        'harga_dasar' => 'decimal:2',
        'harga_jasa' => 'decimal:2',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
