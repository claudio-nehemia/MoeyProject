<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabKontrakAksesoris extends Model
{
    protected $fillable = [
        'rab_kontrak_produk_id',
        'item_pekerjaan_item_id',
        'harga_satuan_aksesoris',
        'qty_aksesoris',
        'harga_total',
    ];

    public function rabKontrakProduk()
    {
        return $this->belongsTo(RabKontrakProduk::class);
    }

    public function itemPekerjaanItem()
    {
        return $this->belongsTo(ItemPekerjaanItem::class);
    }
}
