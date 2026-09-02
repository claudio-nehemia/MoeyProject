<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\Role;
use App\Services\FCMService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationSettingController extends Controller
{
    /**
     * Tampilkan halaman daftar dan konfigurasi notifikasi dinamis
     */
    public function index()
    {
        $settings = NotificationSetting::orderBy('category')
            ->orderBy('id')
            ->get();

        $roles = Role::select('id', 'nama_role')->get();

        return Inertia::render('PengaturanNotifikasi/Index', [
            'settings' => $settings,
            'roles' => $roles,
        ]);
    }

    /**
     * Perbarui pengaturan notifikasi tertentu
     */
    public function update(Request $request, $id)
    {
        $setting = NotificationSetting::findOrFail($id);

        $validated = $request->validate([
            'nama_pengaturan' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'is_active' => 'required|boolean',
            'send_database' => 'required|boolean',
            'send_fcm' => 'required|boolean',
            'recipient_type' => 'required|string|in:order_team,all_by_role',
            'target_role_ids' => 'nullable|array',
            'target_role_ids.*' => 'integer',
            'send_to_management' => 'required|boolean',
            'management_role_ids' => 'nullable|array',
            'management_role_ids.*' => 'integer',
            'days_offset' => 'nullable|integer|min:0|max:60',
            'title_template' => 'required|string|max:255',
            'message_template' => 'required|string',
            'action_url' => 'nullable|string|max:255',
        ]);

        $setting->update($validated);

        return back()->with('success', "Pengaturan \"{$setting->nama_pengaturan}\" berhasil diperbarui.");
    }

    /**
     * Toggle cepat status aktif/nonaktif atau kanal pengiriman
     */
    public function quickToggle(Request $request, $id)
    {
        $setting = NotificationSetting::findOrFail($id);

        $validated = $request->validate([
            'field' => 'required|string|in:is_active,send_database,send_fcm,send_to_management',
            'value' => 'required|boolean',
        ]);

        $setting->update([
            $validated['field'] => $validated['value'],
        ]);

        return back()->with('success', "Status {$validated['field']} untuk \"{$setting->nama_pengaturan}\" berhasil diubah.");
    }

    /**
     * Uji coba pengiriman notifikasi preview ke user yang sedang login
     */
    public function testSend(Request $request, $id)
    {
        $setting = NotificationSetting::findOrFail($id);
        $user = auth()->user();

        if (!$user) {
            return back()->with('error', 'User tidak terautentikasi.');
        }

        $sampleReplacements = [
            'nama_project' => 'Project Renovasi Villa Bali (Uji Coba)',
            'customer_name' => 'Bpk. Hendra Gunawan',
            'tanggal_survey' => now()->addDays(2)->format('d-m-Y'),
            'tahap' => 'Survey Lapangan',
            'deadline' => now()->addDays(1)->format('d-m-Y'),
            'status_waktu' => 'besok',
            'status_aksi' => 'Input Data',
            'payment_type' => 'DP/Pembayaran',
            'vendor_label' => 'Mitra Kayu Sejahtera',
            'nominal' => 'Rp 25.000.000',
            'days_offset' => $setting->days_offset ?: 1,
            'tanggal_jatuh_tempo' => now()->addDays($setting->days_offset ?: 1)->format('d-m-Y'),
        ];

        $title = $setting->formatTitle($sampleReplacements);
        $message = $setting->formatMessage($sampleReplacements);

        $createdNotification = null;
        if ($setting->send_database) {
            $createdNotification = Notification::create([
                'user_id' => $user->id,
                'order_id' => null,
                'type' => 'test_notification',
                'title' => '[TEST] ' . $title,
                'message' => $message,
                'data' => [
                    'is_test' => true,
                    'event_key' => $setting->event_key,
                    'action_url' => $setting->action_url ?: '/dashboard',
                ],
            ]);
        }

        if ($setting->send_fcm) {
            try {
                $fcm = new FCMService();
                $fcm->sendToUser($user->id, [
                    'title' => '[TEST] ' . $title,
                    'body' => $message,
                    'data' => [
                        'notification_id' => $createdNotification ? $createdNotification->id : 0,
                        'type' => 'test_notification',
                    ],
                ]);
            } catch (\Throwable $e) {
                // Ignore FCM error during test if device not registered
            }
        }

        return back()->with('success', "Tes notifikasi berhasil dikirimkan ke akun Anda.");
    }
}
