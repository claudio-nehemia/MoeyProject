<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['nama_role', 'divisi_id'];

    public function divisi()
    {
        return $this->belongsTo(Divisi::class, 'divisi_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
