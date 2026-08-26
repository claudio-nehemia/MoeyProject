<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyUlang extends Model
{
    protected $fillable = [
        'order_id',
        'catatan',
        'foto',
        'temuan',
        'survey_time',
        'survey_by',
        'response_time',
        'response_by',
        'pm_response_time',
        'pm_response_by',
    ];

    protected $casts = [
        'foto' => 'array',
        'temuan' => 'array',
        'survey_time' => 'datetime',
        'response_time' => 'datetime',
        'pm_response_time' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'order_id', 'order_id')
            ->where(function ($q) {
                $q->where('subject_type', 'SurveyUlang')
                    ->orWhere('action', 'like', '%survey_ulang%');
            })
            ->orderBy('created_at', 'desc');
    }
}

