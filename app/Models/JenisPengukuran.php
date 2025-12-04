<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisPengukuran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jenis_pengukuran';

    protected $fillable = [
        'nama_pengukuran',
    ];


    public function surveyResults()
    {
        return $this->belongsToMany(
            SurveyResults::class,
            'survey_pengukuran',
            'jenis_pengukuran_id',
            'survey_result_id'
        );
    }
}
