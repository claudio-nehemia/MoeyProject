<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class MeetingVendor extends Model
{
    use HasFactory;

    protected $table = 'meeting_vendors';

    protected $fillable = [
        'order_id',
        'tanggal_meeting',
        'jam_meeting',
        'lokasi',
        'catatan',
        'response_time',
        'response_by',
        'pm_response_time',
        'pm_response_by',
        'status',
        'created_by',
    ];

    protected $casts = [
        'tanggal_meeting' => 'date',
        'response_time' => 'datetime',
        'pm_response_time' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'subject')
            ->orWhere(function ($query) {
                $query->where('subject_type', 'Order')
                    ->where('subject_id', $this->order_id)
                    ->where(function ($q) {
                        $q->where('subject_type', 'MeetingVendor')
                            ->orWhere('action', 'like', '%meeting_vendor%');
                    });
            });
    }
}
