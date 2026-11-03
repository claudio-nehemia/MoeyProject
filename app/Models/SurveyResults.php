<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResults extends Model
{
    protected $fillable = [
        'order_id',
        'feedback',
        'layout_files',
        'foto_lokasi_files',
        'response_time',
        'response_by',
        'pm_response_time',
        'pm_response_by',
        'is_draft',
    ];

    protected $casts = [
        'layout_files' => 'array',
        'foto_lokasi_files' => 'array',
    ];

    protected function normalizeStoredFiles($value): ?array
    {
        if (empty($value)) {
            return null;
        }
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return null;
        }

        return array_values(array_map(function ($entry) {
            if (is_string($entry)) {
                $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                $mime = match ($ext) {
                    'pdf' => 'application/pdf',
                    'jpg', 'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'gif' => 'image/gif',
                    'webp' => 'image/webp',
                    default => 'application/octet-stream',
                };
                return [
                    'path' => $entry,
                    'original_name' => basename($entry),
                    'mime_type' => $mime,
                    'size' => 0,
                ];
            }
            if (is_array($entry)) {
                $path = $entry['path'] ?? '';
                $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                $defaultMime = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image/jpeg' : ($ext === 'pdf' ? 'application/pdf' : 'application/octet-stream');
                return array_merge([
                    'path' => $path,
                    'original_name' => $entry['original_name'] ?? basename($path),
                    'mime_type' => $entry['mime_type'] ?? $defaultMime,
                    'size' => $entry['size'] ?? 0,
                ], $entry);
            }
            return $entry;
        }, $decoded));
    }

    public function getLayoutFilesAttribute($value): ?array
    {
        return $this->normalizeStoredFiles($value);
    }

    public function getFotoLokasiFilesAttribute($value): ?array
    {
        return $this->normalizeStoredFiles($value);
    }

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

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'order_id', 'order_id')
            ->where(function ($q) {
                $q->where('subject_type', 'SurveyResults')
                    ->orWhere('action', 'like', '%survey%');
            })
            ->orderBy('created_at', 'desc');
    }
}

