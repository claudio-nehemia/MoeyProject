<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Human readable labels for database fields.
     */
    protected static array $fieldLabels = [
        'nama_project' => 'Nama Project',
        'customer_name' => 'Nama Customer',
        'company_name' => 'Nama Perusahaan',
        'phone_number' => 'Nomor Telepon',
        'alamat' => 'Alamat',
        'nomor_unit' => 'Nomor Unit',
        'customer_additional_info' => 'Info Tambahan Customer',
        'project_status' => 'Status Project',
        'priority_level' => 'Prioritas',
        'payment_status' => 'Status Pembayaran',
        'tahapan_proyek' => 'Tahapan Proyek',
        'jenis_interior_id' => 'Jenis Interior',
        'tanggal_survey' => 'Tanggal Survey',
        'tanggal_masuk_customer' => 'Tanggal Masuk Customer',
        'feedback' => 'Catatan / Feedback',
        'catatan' => 'Catatan',
        'temuan' => 'Temuan Lapangan',
        'is_draft' => 'Status Draft',
    ];

    /**
     * Record a new activity log entry.
     */
    public static function log(
        ?int $orderId,
        $subject,
        string $action,
        string $title,
        ?string $description = null,
        array $properties = [],
        ?User $user = null
    ): ActivityLog {
        $currentUser = $user ?: Auth::user();

        $userName = $currentUser ? $currentUser->name : 'System';
        $userRole = '-';
        if ($currentUser) {
            if ($currentUser->role) {
                $userRole = $currentUser->role->nama_role;
            } elseif ($currentUser->roles && $currentUser->roles->isNotEmpty()) {
                $userRole = $currentUser->roles->first()->nama_role ?? $currentUser->roles->first()->name ?? '-';
            }
        }

        $subjectType = null;
        $subjectId = null;

        if ($subject instanceof Model) {
            $subjectType = class_basename($subject);
            $subjectId = $subject->getKey();
        } elseif (is_string($subject)) {
            $subjectType = $subject;
            $subjectId = $properties['subject_id'] ?? null;
        }

        return ActivityLog::create([
            'order_id' => $orderId,
            'user_id' => $currentUser?->id,
            'user_name' => $userName,
            'user_role' => $userRole,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'action' => $action,
            'title' => $title,
            'description' => $description,
            'properties' => !empty($properties) ? $properties : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Generate diff for changed model attributes.
     */
    public static function getChangedAttributes(Model $model, array $ignored = ['updated_at', 'created_at', 'deleted_at']): array
    {
        $changes = [];
        $dirty = $model->getDirty();
        $original = $model->getOriginal();

        foreach ($dirty as $key => $newValue) {
            if (in_array($key, $ignored)) {
                continue;
            }

            $oldValue = $original[$key] ?? null;
            $label = self::$fieldLabels[$key] ?? ucwords(str_replace('_', ' ', $key));

            $changes[] = [
                'field' => $key,
                'label' => $label,
                'old' => is_array($oldValue) ? json_encode($oldValue) : (string) $oldValue,
                'new' => is_array($newValue) ? json_encode($newValue) : (string) $newValue,
            ];
        }

        return $changes;
    }

    /**
     * Helper to build a readable summary of changed attributes.
     */
    public static function formatChangesSummary(array $changes): string
    {
        if (empty($changes)) {
            return 'Pembaruan data tanpa perubahan nilai atribut utama.';
        }

        $items = [];
        foreach ($changes as $change) {
            $label = $change['label'] ?? $change['field'];
            $old = $change['old'] !== '' && $change['old'] !== null ? $change['old'] : '(kosong)';
            $new = $change['new'] !== '' && $change['new'] !== null ? $change['new'] : '(kosong)';
            $items[] = "{$label}: \"{$old}\" → \"{$new}\"";
        }

        return implode(', ', $items);
    }
}
