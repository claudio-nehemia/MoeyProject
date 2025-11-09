<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisItem extends Model
{

    protected $table = 'jenis_items';
    protected $fillable = ['nama_jenis_item'];

    public function items()
    {
        return $this->hasMany(Item::class, 'jenis_item_id');
    }   
}
