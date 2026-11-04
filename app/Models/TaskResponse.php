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

    protected static function booted(): void
    {
        static::saving(function (TaskResponse $taskResponse) {
            // Preserve original response_time if already set so fast response timestamp is never overwritten
            if ($taskResponse->exists && !empty($taskResponse->getOriginal('response_time')) && $taskResponse->isDirty('response_time')) {
                $taskResponse->response_time = $taskResponse->getOriginal('response_time');
            }

            // Auto-assign authenticated user when responding or updating task data if user_id is still null
            if (empty($taskResponse->user_id) && auth()->check()) {
                if (
                    $taskResponse->isDirty('response_time') ||
                    $taskResponse->isDirty('update_data_time') ||
                    in_array($taskResponse->status, ['menunggu_input', 'selesai', 'telat_submit'], true)
                ) {
                    $taskResponse->user_id = auth()->id();
                }
            }
        });

        $syncKpiCallback = function (TaskResponse $taskResponse) {
            try {
                $settings = KpiSetting::first();
                if (!$settings) {
                    return;
                }
                $kpiService = app(\App\Services\KpiService::class);
                $userIds = collect([$taskResponse->user_id]);

                if ($taskResponse->tahap === 'invoice' && $taskResponse->order_id) {
                    $teamUserIds = \Illuminate\Support\Facades\DB::table('order_teams')
                        ->where('order_id', $taskResponse->order_id)
                        ->pluck('user_id');
                    $taskUserIds = \Illuminate\Support\Facades\DB::table('task_responses')
                        ->where('order_id', $taskResponse->order_id)
                        ->whereNotNull('user_id')
                        ->pluck('user_id');
                    $userIds = $userIds->merge($teamUserIds)->merge($taskUserIds);
                }

                $userIds = $userIds->filter()->unique();
                $months = collect([
                    now()->format('Y-m'),
                    $taskResponse->response_time ? \Carbon\Carbon::parse($taskResponse->response_time)->format('Y-m') : null,
                    $taskResponse->update_data_time ? \Carbon\Carbon::parse($taskResponse->update_data_time)->format('Y-m') : null,
                    $taskResponse->deadline ? \Carbon\Carbon::parse($taskResponse->deadline)->format('Y-m') : null,
                ])->filter()->unique();

                foreach ($userIds as $uid) {
                    $user = User::find($uid);
                    if ($user) {
                        foreach ($months as $month) {
                            $kpiService->syncAndCalculateMonthlyKpi($user, $month, $settings);
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('KPI auto-sync failed on TaskResponse change: ' . $e->getMessage());
            }
        };

        static::saved($syncKpiCallback);
        static::deleted($syncKpiCallback);
    }

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