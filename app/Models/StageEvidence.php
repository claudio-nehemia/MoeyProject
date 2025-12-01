<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StageEvidence extends Model
{
    protected $table = 'stage_evidences';

    protected $fillable = [
        'item_pekerjaan_produk_id',
        'stage',
        'evidence_path',
        'notes',
        'uploaded_by',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }
}
