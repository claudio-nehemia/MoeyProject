<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_jenis_item_id',
        'item_id',
        'quantity',
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
