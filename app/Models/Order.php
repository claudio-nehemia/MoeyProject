<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'nama_project',
        'company_name',
        'customer_name',
        'customer_additional_info',
        'nomor_unit',
        'phone_number',
        'tanggal_masuk_customer',
        'project_status',
        'priority_level',
        'jenis_interior_id',
        'mom_file',
        'tanggal_survey',
        'payment_status',
        'tahapan_proyek'
    ];

    public function jenisInterior()
    {
        return $this->belongsTo(JenisInterior::class, 'jenis_interior_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'order_teams')
            ->withTimestamps();
    }

    public function surveyResults()
    {
        return $this->hasOne(SurveyResults::class, 'order_id');
    }

    public function moodboard()
    {
        return $this->hasOne(Moodboard::class, 'order_id');
    }

    public function itemPekerjaans()
    {
        return $this->hasManyThrough(
            ItemPekerjaan::class,
            Moodboard::class,
            'order_id', // Foreign key on moodboard table
            'moodboard_id', // Foreign key on item_pekerjaans table
            'id', // Local key on orders table
            'id' // Local key on moodboard table
        );
    }

    public function getProgressAttribute()
    {
        $items = $this->itemPekerjaans;
        if ($items->count() === 0)
            return 0;


        return round($items->avg->progress, 2);
    }

    public function surveyUlang()
    {
        return $this->hasOne(SurveyUlang::class);
    }
}
