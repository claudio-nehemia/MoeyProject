<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabAksesoris extends Model
{
    protected $fillable = [
        'rab_produk_id',
        'item_pekerjaan_item_id',
        'nama_aksesoris',
        'qty_aksesoris',
        'markup_aksesoris',
        'harga_satuan_aksesoris',
        'harga_total',
    ];

    public function rabProduk()
    {
        return $this->belongsTo(RabProduk::class);
    }

    public function itemPekerjaanItem()
    {
        return $this->belongsTo(ItemPekerjaanItem::class);
    }
}
