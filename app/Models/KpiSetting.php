<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiSetting extends Model
{
    protected $table = 'kpi_settings';

    protected $fillable = [
        'base_points',
        'points_fast_response',
        'points_fast_update',
        'penalty_late',
        'points_completed_project',
        'bonus_type',
    ];
}
