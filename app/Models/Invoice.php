<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'rab_kontrak_id',
        'invoice_number',
        'termin_step',
        'termin_text',
        'termin_persentase',
        'total_amount',
        'status',
        'bukti_bayar',
        'paid_at',
        'response_time',
        'response_by',
        'pm_response_time',
        'pm_response_by',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'termin_persentase' => 'decimal:2',
        'paid_at' => 'datetime',
        'response_time' => 'datetime',
        'pm_response_time' => 'datetime',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function rabKontrak()
    {
        return $this->belongsTo(RabKontrak::class);
    }
}
