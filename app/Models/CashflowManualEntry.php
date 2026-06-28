<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashflowManualEntry extends Model
{
    protected $fillable = [
        'order_id',
        'category',
        'label',
        'amount_estimasi',
        'amount_realisasi',
        'tanggal',
        'notes',
        'section',
        'phase',
        'created_by',
    ];

    protected $casts = [
        'amount_estimasi' => 'decimal:2',
        'amount_realisasi' => 'decimal:2',
        'tanggal' => 'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
