<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Notification Types Constants
    const TYPE_SURVEY_REQUEST = 'survey_request';
    const TYPE_MOODBOARD_REQUEST = 'moodboard_request';
    const TYPE_ESTIMASI_REQUEST = 'estimasi_request';
    const TYPE_DESIGN_APPROVAL = 'design_approval';
    const TYPE_FINAL_DESIGN_REQUEST = 'final_design_request';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
