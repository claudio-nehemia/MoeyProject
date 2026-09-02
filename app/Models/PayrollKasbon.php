<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollKasbon extends Model
{
    protected $table = 'payroll_kasbon';

    protected $fillable = [
        'nik',
        'total_kasbon',
        'cicilan_per_bulan',
        'sisa_kasbon',
        'keterangan',
        'status',
    ];

    protected $casts = [
        'total_kasbon' => 'integer',
        'cicilan_per_bulan' => 'integer',
        'sisa_kasbon' => 'integer',
    ];

    public function getNikAttribute($value)
    {
        return trim($value);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }
}
