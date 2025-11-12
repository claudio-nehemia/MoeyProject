<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RabJasaProduk extends Model
{
    use HasFactory;

    protected $fillable = [
        'rab_jasa_id',
        'item_pekerjaan_produk_id',
        'harga_dasar',
        'harga_items_non_aksesoris',
        'harga_dimensi',
        'harga_satuan',
        'harga_akhir',
    ];

    protected $casts = [
        'harga_dasar' => 'decimal:2',
        'harga_items_non_aksesoris' => 'decimal:2',
        'harga_dimensi' => 'decimal:2',
        'harga_satuan' => 'decimal:2',
        'harga_akhir' => 'decimal:2',
    ];

    public function rabJasa()
    {
        return $this->belongsTo(RabJasa::class);
    }

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }
}
