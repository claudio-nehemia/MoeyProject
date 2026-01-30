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
        'notif_time',
        'deadline',
        'duration',
        'duration_actual',
        'extend_time',
        'extend_reason',
        'status',
        'is_marketing',
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
     * Cek apakah sudah lewat deadline (dan belum selesai / belum submit).
     * telat_submit = sudah submit terlambat, tidak dianggap "masih overdue".
     */
    public function isOverdue(): bool
    {
        return $this->deadline < now()
            && !in_array($this->status, ['selesai', 'telat_submit'], true);
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