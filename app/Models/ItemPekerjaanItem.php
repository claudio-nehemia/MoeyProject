<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_jenis_item_id',
        'item_id',
        'quantity',
        'notes',
        'keterangan_material',
        'kode_material',
        'brand_spek',
        'area',
        'foto',
    ];

    protected $casts = [
        'kode_material' => 'array',
        'brand_spek' => 'array',
    ];

    public function itemPekerjaanJenisItem()
    {
        return $this->belongsTo(ItemPekerjaanJenisItem::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
