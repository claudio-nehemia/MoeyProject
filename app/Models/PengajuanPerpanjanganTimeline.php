<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanPerpanjanganTimeline extends Model
{
    protected $table = 'pengajuan_perpanjangan_timelines';

    protected $fillable = [
        'item_pekerjaan_id',
        'status',
        'reason',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class, 'item_pekerjaan_id');
    }
}
