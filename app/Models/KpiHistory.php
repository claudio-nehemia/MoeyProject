<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiHistory extends Model
{
    protected $table = 'kpi_histories';

    protected $fillable = [
        'user_id',
        'month',
        'base_score',
        'fast_responses',
        'fast_updates',
        'late_tasks',
        'completed_projects',
        'score',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
