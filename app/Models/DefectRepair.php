<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefectRepair extends Model
{
    protected $fillable = [
        'defect_item_id',
        'photo_path',
        'notes',
        'repaired_by',
        'repaired_at',
        'is_approved',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'repaired_at' => 'datetime',
        'approved_at' => 'datetime',
        'is_approved' => 'boolean',
    ];

    public function defectItem()
    {
        return $this->belongsTo(DefectItem::class);
    }

    // Accessor: URL foto
    public function getPhotoUrlAttribute()
    {
        return asset('storage/' . $this->photo_path);
    }
}
