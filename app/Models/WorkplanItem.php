<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkplanItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'nama_tahapan',
        'start_date',
        'end_date',
        'duration_days',
        'urutan',
        'status',
        'catatan',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function itemPekerjaanProduk(): BelongsTo
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }
}
