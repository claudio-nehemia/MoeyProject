<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class SlipgajiHarianDetail extends Model
{
    use HasFactory;
    protected $table = 'slip_gaji_harian_detail';
    protected $guarded = [];
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'nik', 'nik');
    }
    public function slipgajiHarian()
    {
        return $this->belongsTo(SlipgajiHarian::class, 'kode_slip_gaji_harian', 'kode_slip_gaji_harian');
    }
}
