<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyScheduleUser extends Model
{
    protected $table = 'survey_schedule_users';

    protected $fillable = [
        'order_id',
        'user_id',
    ];

    /**
     * Relasi ke Order
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relasi ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
