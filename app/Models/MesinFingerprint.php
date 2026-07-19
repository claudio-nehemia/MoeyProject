<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MesinFingerprint extends Model
{
    use HasFactory;
    
    protected $table = 'mesin_fingerprints';
    protected $guarded = [];
}
