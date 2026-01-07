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
    ];

    protected $casts = [
        'foto' => 'array',
        'temuan' => 'array',
        'survey_time' => 'datetime',
        'response_time' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
