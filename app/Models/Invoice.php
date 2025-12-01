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
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'termin_persentase' => 'decimal:2',
        'paid_at' => 'datetime',
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
