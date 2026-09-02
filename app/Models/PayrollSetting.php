<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    protected $table = 'payroll_settings';

    protected $fillable = [
        'tanggal_gajian',
        'tipe_hitung',
        'auto_generate_on_payday',
        'cutoff_tanggal',
        'catatan',
    ];

    protected $casts = [
        'tanggal_gajian' => 'integer',
        'cutoff_tanggal' => 'integer',
        'auto_generate_on_payday' => 'boolean',
    ];

    public static function getActive(): self
    {
        return static::firstOrCreate([], [
            'tanggal_gajian' => 25,
            'tipe_hitung' => 'tanggal_gajian',
            'auto_generate_on_payday' => true,
            'cutoff_tanggal' => 20,
            'catatan' => 'Penggajian otomatis setiap tanggal 25. Setiap hari dapat memonitor gaji sementara.',
        ]);
    }
}
