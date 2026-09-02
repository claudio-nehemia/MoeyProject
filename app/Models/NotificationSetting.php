<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class NotificationSetting extends Model
{
    protected $fillable = [
        'event_key',
        'category',
        'nama_pengaturan',
        'deskripsi',
        'is_active',
        'send_database',
        'send_fcm',
        'recipient_type',
        'target_role_ids',
        'send_to_management',
        'management_role_ids',
        'days_offset',
        'title_template',
        'message_template',
        'action_url',
        'available_placeholders',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'send_database' => 'boolean',
        'send_fcm' => 'boolean',
        'send_to_management' => 'boolean',
        'target_role_ids' => 'array',
        'management_role_ids' => 'array',
        'available_placeholders' => 'array',
        'days_offset' => 'integer',
    ];

    /**
     * Cache key prefix
     */
    const CACHE_KEY_PREFIX = 'notification_setting_';

    /**
     * Get setting by event key with cache
     */
    public static function getByKey(string $eventKey): ?self
    {
        return Cache::remember(self::CACHE_KEY_PREFIX . $eventKey, 3600, function () use ($eventKey) {
            return self::where('event_key', $eventKey)->first();
        });
    }

    /**
     * Clear cache for this setting
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY_PREFIX . $this->event_key);
    }

    protected static function booted()
    {
        static::saved(function ($setting) {
            $setting->clearCache();
        });

        static::deleted(function ($setting) {
            $setting->clearCache();
        });
    }

    /**
     * Format title with replacements
     */
    public function formatTitle(array $replacements = []): string
    {
        $title = $this->title_template ?? '';
        foreach ($replacements as $key => $val) {
            $search = str_starts_with($key, '{') ? $key : '{' . $key . '}';
            $title = str_replace($search, (string) $val, $title);
        }
        return $title;
    }

    /**
     * Format message with replacements
     */
    public function formatMessage(array $replacements = []): string
    {
        $message = $this->message_template ?? '';
        foreach ($replacements as $key => $val) {
            $search = str_starts_with($key, '{') ? $key : '{' . $key . '}';
            $message = str_replace($search, (string) $val, $message);
        }
        return $message;
    }
}
