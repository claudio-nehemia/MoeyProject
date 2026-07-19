<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Pph21Setting extends Model
{
    use HasFactory;
    protected $table = 'pph21_settings';
    protected $guarded = [];
    protected $casts = [
        'status_aktif' => 'boolean',
    ];
    public static function getSetting(): self
    {
        return self::firstOrCreate(['id' => 1], [
            'status_aktif'            => false,
            'metode'                  => 'TER',
            'metode_tanggungan'       => 'GROSS',
            'biaya_jabatan_persen'    => 5.00,
            'biaya_jabatan_max_bulan' => 500000,
        ]);
    }
}
