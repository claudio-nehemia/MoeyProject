<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResults extends Model
{
    protected $fillable = [
        'order_id',
        'feedback',
        'layout',
        'foto_lokasi',
        'response_time',
        'response_by',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }   

    public function jenisPengukuran()
    {
        return $this->belongsToMany(
            JenisPengukuran::class,
            'survey_pengukuran',
            'survey_result_id',
            'jenis_pengukuran_id'
        );
    }
}
