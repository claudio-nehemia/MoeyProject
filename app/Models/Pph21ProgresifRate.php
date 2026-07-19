<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Pph21ProgresifRate extends Model
{
    use HasFactory;
    protected $table = 'pph21_progresif_rates';
    protected $guarded = [];
    protected $casts = [
        'status_aktif' => 'boolean',
    ];
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true)->orderBy('pkp_dari');
    }
}
