<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefectItem extends Model
{
    protected $fillable = [
        'defect_id',
        'photo_path',
        'notes',
        'order',
    ];

    public function defect()
    {
        return $this->belongsTo(Defect::class);
    }

    public function repairs()
    {
        return $this->hasMany(DefectRepair::class);
    }

    // Accessor: URL foto
    public function getPhotoUrlAttribute()
    {
        return asset('storage/' . $this->photo_path);
    }
}
