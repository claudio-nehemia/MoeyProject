<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Divisi extends Model
{
    protected $table = 'divisis';

    protected $fillable = [
        'nama_divisi',
    ];  
    public function roles()
    {
        return $this->hasMany(Role::class, 'divisi_id');
    }
}
