<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabVendorAksesoris extends Model
{
    use HasFactory;

    protected $fillable = [
        'rab_vendor_produk_id',
        'item_pekerjaan_item_id',
        'harga_satuan_aksesoris',
        'qty_aksesoris',
        'harga_total',
    ];

    protected $casts = [
        'harga_satuan_aksesoris' => 'decimal:2',
        'harga_total' => 'decimal:2',
    ];

    public function rabVendorProduk()
    {
        return $this->belongsTo(RabVendorProduk::class);
    }

    public function itemPekerjaanItem()
    {
        return $this->belongsTo(ItemPekerjaanItem::class);
    }
}
