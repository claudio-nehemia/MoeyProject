<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabKontrakProduk extends Model
{
    protected $fillable = [
        'rab_kontrak_id',
        'item_pekerjaan_produk_id',
        'harga_dasar',
        'harga_finishing_dalam',
        'harga_finishing_luar',
        'harga_items_non_aksesoris',
        'harga_dimensi',
        'harga_satuan',
        'harga_total_aksesoris',
        'diskon_per_produk',
        'harga_akhir',
    ];

    public function rabKontrak()
    {
        return $this->belongsTo(RabKontrak::class);
    }

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function rabKontrakAksesoris()
    {
        return $this->hasMany(RabKontrakAksesoris::class);
    }
}
