<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kontrak extends Model
{
    protected $fillable = [
        'durasi_kontrak',
        'termin_id',
        'item_pekerjaan_id',
        'harga_kontrak',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'harga_kontrak' => 'decimal:0',
    ];

    public function termin()
    {
        return $this->belongsTo(Termin::class);
    }

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }
}
