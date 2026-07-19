<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class SlipgajiHarian extends Model
{
    use HasFactory;
    protected $table = 'slip_gaji_harian';
    protected $guarded = [];
    protected $primaryKey = 'kode_slip_gaji_harian';
    public $incrementing = false;
    protected $keyType = 'string';
    public function detail()
    {
        return $this->hasMany(SlipgajiHarianDetail::class, 'kode_slip_gaji_harian', 'kode_slip_gaji_harian');
    }
}
