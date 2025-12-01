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
        'tanggal_mulai',
        'tanggal_selesai',
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

    // Accessor: Sisa hari deadline
    public function getSisaHariAttribute()
    {
        if (!$this->tanggal_selesai) {
            return null;
        }
        return now()->startOfDay()->diffInDays($this->tanggal_selesai, false);
    }

    // Accessor: Status deadline
    public function getDeadlineStatusAttribute()
    {
        $sisaHari = $this->sisa_hari;
        if ($sisaHari === null) return 'unknown';
        if ($sisaHari < 0) return 'overdue';
        if ($sisaHari <= 7) return 'urgent';
        if ($sisaHari <= 14) return 'warning';
        return 'normal';
    }
}
