<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class CashflowVendorEntry extends Model
{
    protected $fillable = [
        'order_id',
        'vendor_type',
        'section',
        'vendor_group',
        'label',
        'vendor_name',
        'persentase',
        'nilai',
        'pembayaran',
        'spk_amount',
        'tanggal_inv',
        'tanggal_pembayaran',
        'tanggal_perencanaan',
        'tanggal_pembayaran_termin',
        'pembayaran_termin',
        'flag_af',
        'flag_fb',
        'flag_jw',
        'flag_af_termin',
        'flag_fb_termin',
        'flag_jw_termin',
        'reminder_sent',
        'reminder_termin_sent',
        'sort_order',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'persentase' => 'float',
        'nilai' => 'float',
        'pembayaran' => 'float',
        'spk_amount' => 'float',
        'pembayaran_termin' => 'float',
        'tanggal_inv' => 'date',
        'tanggal_pembayaran' => 'date',
        'tanggal_perencanaan' => 'date',
        'tanggal_pembayaran_termin' => 'date',
        'reminder_sent' => 'boolean',
        'reminder_termin_sent' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // ── Scopes ──

    public function scopeInternal($query)
    {
        return $query->where('vendor_type', 'internal');
    }

    public function scopeFisik($query)
    {
        return $query->where('vendor_type', 'fisik');
    }

    public function scopeExternal($query)
    {
        return $query->where('vendor_type', 'external');
    }

    public function scopeVendorGroup($query, string $group)
    {
        return $query->where('vendor_group', $group);
    }

    public function scopePembayaranVendor($query)
    {
        return $query->where('section', 'pembayaran_vendor');
    }

    public function scopeMaterialHutang($query)
    {
        return $query->where('section', 'material_hutang');
    }

    public function scopeItemExternal($query)
    {
        return $query->where('section', 'item_external');
    }

    public function scopeAddendumExternal($query)
    {
        return $query->where('section', 'addendum_external');
    }

    public function scopePengeluaranLuar($query)
    {
        return $query->where('section', 'pengeluaran_luar');
    }

    // ── Accessors ──

    /**
     * Umur INV in days (TODAY - tanggal_inv)
     */
    public function getUmurInvAttribute(): ?int
    {
        if (!$this->tanggal_inv) return null;
        return Carbon::now()->diffInDays($this->tanggal_inv);
    }

    /**
     * Status for external items: SPK - Pembayaran DP - Pembayaran Termin
     */
    public function getStatusSisaAttribute(): float
    {
        return $this->spk_amount - $this->pembayaran - $this->pembayaran_termin;
    }
}
