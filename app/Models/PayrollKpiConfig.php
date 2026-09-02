<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollKpiConfig extends Model
{
    protected $table = 'payroll_kpi_configs';

    protected $fillable = [
        'payroll_position_config_id',
        'komponen',
        'bobot',
        'urutan',
    ];

    protected $casts = [
        'bobot' => 'float',
        'urutan' => 'integer',
    ];

    public function positionConfig()
    {
        return $this->belongsTo(PayrollPositionConfig::class, 'payroll_position_config_id');
    }
}
