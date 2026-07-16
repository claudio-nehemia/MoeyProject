<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'code',
        'phone',
        'address',
        'category',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function produks()
    {
        return $this->hasMany(Produk::class);
    }
}
