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
    ];

    public function jenisInterior()
    {
        return $this->belongsTo(JenisInterior::class, 'jenis_interior_id');
    }

    public function users() {
        return $this->belongsToMany(User::class, 'order_teams')
                    ->withTimestamps();
    }

    public function surveyResults()
    {
        return $this->hasOne(SurveyResults::class, 'order_id');
    }
}
