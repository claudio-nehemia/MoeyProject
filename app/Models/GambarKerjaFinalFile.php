<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GambarKerjaFinalFile extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'order_id',
        'file_path',
        'original_name',
        'file_size',
        'uploaded_by',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
