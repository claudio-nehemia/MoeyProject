<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollPositionConfig extends Model
{
    protected $table = 'payroll_position_configs';

    protected $fillable = [
        'divisi',
        'jabatan',
        'kode_jabatan',
        'gaji_pokok',
        'gaji_pokok_harian',
        'tunjangan_jabatan',
        'tunjangan_jabatan_condition',
        'tunjangan_jabatan_min_omzet',
        'transportasi_harian',
        'makan_harian',
        'kehadiran_harian',
        'cf_per_client',
        'cf_max_per_bulan',
        'komisi_dp_persen_internal',
        'komisi_dp_persen_eksternal',
        'komisi_dp_bayar_persen',
        'min_omzet_komisi_dp',
        'komisi_pelunasan_persen_internal',
        'komisi_pelunasan_persen_eksternal',
        'komisi_pelunasan_bayar_persen',
        'achievement_rate',
        'min_omzet_achievement',
        'achievement_fixed',
        'min_success_project_persen',
        'komisi_success_persen_internal',
        'komisi_success_persen_eksternal',
        'komisi_success_bayar_persen',
        'achievement_pelaksanaan_persen',
        'hari_kerja_default',
        'is_active',
        'catatan',
    ];

    protected $casts = [
        'gaji_pokok' => 'integer',
        'gaji_pokok_harian' => 'integer',
        'tunjangan_jabatan' => 'integer',
        'tunjangan_jabatan_min_omzet' => 'integer',
        'transportasi_harian' => 'integer',
        'makan_harian' => 'integer',
        'kehadiran_harian' => 'integer',
        'cf_per_client' => 'integer',
        'cf_max_per_bulan' => 'integer',
        'komisi_dp_persen_internal' => 'float',
        'komisi_dp_persen_eksternal' => 'float',
        'komisi_dp_bayar_persen' => 'float',
        'min_omzet_komisi_dp' => 'integer',
        'komisi_pelunasan_persen_internal' => 'float',
        'komisi_pelunasan_persen_eksternal' => 'float',
        'komisi_pelunasan_bayar_persen' => 'float',
        'achievement_rate' => 'float',
        'min_omzet_achievement' => 'integer',
        'achievement_fixed' => 'integer',
        'min_success_project_persen' => 'float',
        'komisi_success_persen_internal' => 'float',
        'komisi_success_persen_eksternal' => 'float',
        'komisi_success_bayar_persen' => 'float',
        'achievement_pelaksanaan_persen' => 'float',
        'hari_kerja_default' => 'integer',
        'is_active' => 'boolean',
    ];

    public function kpiConfigs()
    {
        return $this->hasMany(PayrollKpiConfig::class)->orderBy('urutan');
    }

    public function jabatanRelation()
    {
        return $this->belongsTo(Jabatan::class, 'kode_jabatan', 'kode_jabatan');
    }

    public function payrollMonthly()
    {
        return $this->hasMany(PayrollMonthly::class);
    }
}
