<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Pph21TerRate extends Model
{
    use HasFactory;
    protected $table = 'pph21_ter_rates';
    protected $guarded = [];
    protected $casts = [
        'status_aktif' => 'boolean',
    ];
    public function scopeAktif($query)
    {
        return $query->where('status_aktif', true);
    }
    public function scopeKategori($query, string $kategori)
    {
        return $query->where('kategori', strtoupper($kategori));
    }
}
