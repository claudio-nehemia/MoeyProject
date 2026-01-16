<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabProduk extends Model
{
    protected $fillable = [
        'rab_internal_id',
        'item_pekerjaan_produk_id',
        'markup_satuan',
        'harga_dasar',
        'harga_items_non_aksesoris',
        'harga_dimensi',
        'harga_satuan',
        'harga_total_aksesoris',
        'diskon_per_produk',
        'harga_akhir',
    ];

    public function rabInternal()
    {
        return $this->belongsTo(RabInternal::class);
    }

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function rabAksesoris()
    {
        return $this->hasMany(RabAksesoris::class);
    }
}
