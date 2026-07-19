<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Pph21SlipDetail extends Model
{
    use HasFactory;
    protected $table = 'pph21_slip_detail';
    protected $guarded = [];
    protected $casts = [
        'detail_komponen' => 'array',
    ];
    public function slipGaji()
    {
        return $this->belongsTo(Slipgaji::class, 'kode_slip_gaji', 'kode_slip_gaji');
    }
}
