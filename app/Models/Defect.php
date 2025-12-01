<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Defect extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'qc_stage',
        'reported_by',
        'reported_at',
        'status',
    ];

    protected $casts = [
        'reported_at' => 'datetime',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function defectItems()
    {
        return $this->hasMany(DefectItem::class);
    }

    // Accessor: Cek apakah semua defect items sudah diperbaiki DAN di-approve
    public function getIsAllRepairedAttribute()
    {
        return $this->defectItems->every(function ($item) {
            return $item->repairs->count() > 0 && $item->repairs->every(fn($r) => $r->is_approved);
        });
    }

    // Accessor: Cek apakah ada repair yang pending approval
    public function getHasPendingApprovalAttribute()
    {
        return $this->defectItems->contains(function ($item) {
            return $item->repairs->contains(fn($r) => !$r->is_approved);
        });
    }
}
