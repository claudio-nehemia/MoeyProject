<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskResponseExtendLog extends Model
{
    protected $fillable = [
        'task_response_id',
        'user_id',
        'extend_time',
        'extend_reason',
        'request_time',
        'status',
    ];
    
    public function taskResponse()
    {
        return $this->belongsTo(TaskResponse::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
