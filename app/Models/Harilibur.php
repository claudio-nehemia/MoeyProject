<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Harilibur extends Model
{
    use HasFactory;
    protected $table = 'hari_libur';
    protected $primaryKey = 'kode_libur';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];

    public function detail()
    {
        return $this->hasMany(Detailharilibur::class, 'kode_libur', 'kode_libur');
    }
}
