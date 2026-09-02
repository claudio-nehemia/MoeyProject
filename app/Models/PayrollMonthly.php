<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollMonthly extends Model
{
    protected $table = 'payroll_monthly';

    protected $fillable = [
        'nik',
        'bulan',
        'tahun',
        'payroll_position_config_id',
        'hari_kerja',
        'hari_hadir',
        'capaian_omzet_internal',
        'capaian_omzet_eksternal',
        'gaji_pokok',
        'tunjangan_jabatan',
        'transportasi',
        'makan',
        'kehadiran',
        'komisi_cf',
        'komisi_dp',
        'komisi_pelunasan',
        'komisi_success_project',
        'achievement_omzet',
        'achievement_pelaksanaan',
        'total_pendapatan_diluar_komisi',
        'total_pendapatan_cf',
        'total_pendapatan_komisi_achievement',
        'kasbon',
        'total_diterima',
        'kpi_skor',
        'kpi_status',
        'kpi_detail',
        'status',
        'generated_by',
    ];

    protected $casts = [
        'bulan' => 'integer',
        'tahun' => 'integer',
        'hari_kerja' => 'integer',
        'hari_hadir' => 'integer',
        'capaian_omzet_internal' => 'integer',
        'capaian_omzet_eksternal' => 'integer',
        'gaji_pokok' => 'integer',
        'tunjangan_jabatan' => 'integer',
        'transportasi' => 'integer',
        'makan' => 'integer',
        'kehadiran' => 'integer',
        'komisi_cf' => 'integer',
        'komisi_dp' => 'integer',
        'komisi_pelunasan' => 'integer',
        'komisi_success_project' => 'integer',
        'achievement_omzet' => 'integer',
        'achievement_pelaksanaan' => 'integer',
        'total_pendapatan_diluar_komisi' => 'integer',
        'total_pendapatan_cf' => 'integer',
        'total_pendapatan_komisi_achievement' => 'integer',
        'kasbon' => 'integer',
        'total_diterima' => 'integer',
        'kpi_skor' => 'float',
        'kpi_detail' => 'array',
    ];

    public function getNikAttribute($value)
    {
        return trim($value);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }

    public function positionConfig()
    {
        return $this->belongsTo(PayrollPositionConfig::class, 'payroll_position_config_id');
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Get KPI status label based on score
     */
    public static function getKpiStatus(float $skor): string
    {
        if ($skor >= 80) return 'Sangat Baik';
        if ($skor >= 60) return 'Baik';
        if ($skor >= 40) return 'Cukup';
        if ($skor >= 20) return 'Buruk';
        return 'Sangat Buruk';
    }
}
