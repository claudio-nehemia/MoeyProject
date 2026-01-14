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
        'response_time',
        'response_by',
        'pm_response_time',
        'pm_response_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'response_time' => 'datetime',
        'pm_response_time' => 'datetime',
    ];

    public function itemPekerjaanProduk(): BelongsTo
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    /**
     * Scope untuk filter workplan yang sudah direspond
     */
    public function scopeResponded($query)
    {
        return $query->whereNotNull('response_time');
    }

    /**
     * Check if this workplan item has been responded
     */
    public function isResponded(): bool
    {
        return $this->response_time !== null;
    }

    /**
     * Static method to check if ANY workplan item in collection has been responded
     * Used for Order-level response check (karena workplan ada banyak items)
     */
    public static function hasAnyResponded($workplanItems): bool
    {
        foreach ($workplanItems as $item) {
            if ($item->response_time !== null) {
                return true;
            }
        }
        return false;
    }
}
