<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kontrak extends Model
{
    protected $fillable = [
        'tanggal_mulai',
        'tanggal_selesai',
        'termin_id',
        'item_pekerjaan_id',
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
