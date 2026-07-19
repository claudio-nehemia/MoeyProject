<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Pph21FormulaKomponen extends Model
{
    use HasFactory;
    protected $table = 'pph21_formula_komponen';
    protected $guarded = [];
    protected $casts = [
        'status_aktif' => 'boolean',
    ];
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true)->orderBy('urutan');
    }
    public function scopePenambah($query)
    {
        return $query->where('tipe', 'penambah');
    }
    public function scopePengurang($query)
    {
        return $query->where('tipe', 'pengurang');
    }
}
