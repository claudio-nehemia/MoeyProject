<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskResponse extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'tahap',
        'start_time',
        'response_time',
        'update_data_time',
        'deadline',
        'duration',
        'duration_actual',
        'extend_time',
        'extend_reason',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'response_time' => 'datetime',
        'update_data_time' => 'datetime',
        'deadline' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Cek apakah sudah lewat deadline
     */
    public function isOverdue(): bool
    {
        return $this->deadline < now() && $this->status !== 'selesai';
    }

    /**
     * Cek apakah H-1 deadline
     */
    public function isOneDayBeforeDeadline(): bool
    {
        $oneDayBefore = $this->deadline->copy()->subDay();
        return now()->isSameDay($oneDayBefore) || 
               (now()->isAfter($oneDayBefore) && now()->isBefore($this->deadline));
    }
}