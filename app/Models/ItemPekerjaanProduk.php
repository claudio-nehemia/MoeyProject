<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemPekerjaanProduk extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'produk_id',
        'quantity',
        'panjang',
        'lebar',
        'tinggi',
        'current_stage',
        'bast_number',
        'bast_date',
        'bast_pdf_path',
    ];

    protected $casts = [
        'bast_date' => 'datetime',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    public function jenisItems()
    {
        return $this->hasMany(ItemPekerjaanJenisItem::class);
    }

    public function stageEvidences()
    {
        return $this->hasMany(StageEvidence::class);
    }

    public static function stageWeights()
    {
        return config('stage.stages');
    }

    public function defects()
    {
        return $this->hasMany(Defect::class);
    }

    // Accessor: Cek apakah produk punya defect yang belum selesai
    public function getHasPendingDefectsAttribute()
    {
        return $this->defects()
            ->whereIn('status', ['pending', 'in_repair'])
            ->exists();
    }

    // Accessor: Cek apakah produk sudah selesai (Install QC = tahap terakhir)
    public function getIsCompletedAttribute()
    {
        return $this->current_stage === 'Install QC';
    }

    // Accessor: Cek apakah BAST sudah dibuat
    public function getHasBastAttribute()
    {
        return !empty($this->bast_number);
    }

    public function getProgressAttribute()
    {
        if (!$this->current_stage) {
            return 0;
        }

        $stages = self::stageWeights();
        $progress = 0;

        foreach ($stages as $stage => $percent) {
            $progress += $percent;
            if ($this->current_stage === $stage)
                break;
        }

        return $progress;
    }


    public function getTotalHargaAttribute()
    {
        $vendorProduk = $this->itemPekerjaan
            ->rabVendor
            ?->rabVendorProduks
            ->firstWhere('item_pekerjaan_produk_id', $this->id);


        return $vendorProduk?->harga_akhir ?? 0;
    }

    public function workplanItems(): HasMany
    {
        return $this->hasMany(WorkplanItem::class)->orderBy('urutan');
    }
}
