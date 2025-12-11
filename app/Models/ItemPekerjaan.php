<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaan extends Model
{
    protected $fillable = [
        'moodboard_id',
        'response_by',
        'response_time',
        'status',
        'workplan_start_date',
        'workplan_end_date',
        'unlocked_step',
        'bast_number',
        'bast_date',
        'bast_pdf_path',
    ];

    protected $casts = [
        'workplan_start_date' => 'date',
        'workplan_end_date' => 'date',
        'bast_date' => 'datetime',
    ];

    // Accessor: Check if all produks completed Install QC
    public function getIsCompletedAttribute()
    {
        if ($this->produks->isEmpty()) {
            return false;
        }
        return $this->produks->every(fn($p) => $p->current_stage === 'Install QC');
    }

    // Accessor: Check if BAST exists
    public function getHasBastAttribute()
    {
        return !empty($this->bast_number);
    }

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }

    public function produks()
    {
        return $this->hasMany(ItemPekerjaanProduk::class);
    }

    public function rabInternal()
    {
        return $this->hasOne(RabInternal::class);
    }

    public function rabKontrak()
    {
        return $this->hasOne(RabKontrak::class);
    }

    public function rabVendor()
    {
        return $this->hasOne(RabVendor::class);
    }

    public function rabJasa()
    {
        return $this->hasOne(RabJasa::class);
    }


    public function kontrak()
    {
        return $this->hasOne(Kontrak::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function getProgressAttribute()
    {
        $produks = $this->produks;
        if ($produks->count() === 0)
            return 0;


        $totalHarga = $produks->sum->total_harga;
        if ($totalHarga == 0)
            return 0;


        $progress = 0;


        foreach ($produks as $produk) {
            $bobot = $produk->total_harga / $totalHarga;
            $progress += $bobot * ($produk->progress / 100);
        }


        return round($progress * 100, 2);
    }
}
