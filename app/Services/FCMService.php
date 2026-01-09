<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FCMService
{
    /**
     * Firebase Messaging instance using Service Account JSON
     * 
     * Configuration in config/services.php:
     * 'fcm' => [
     *     'service_account' => storage_path('firebase/service-account.json'),
     *     'project_id' => env('FCM_PROJECT_ID'),
     * ]
     */
    private $messaging;

    public function __construct()
    {
        try {
            $serviceAccountPath = config('services.fcm.service_account');
            
            if (!file_exists($serviceAccountPath)) {
                Log::error('⚠️  [FCM] Service Account JSON not found', [
                    'path' => $serviceAccountPath
                ]);
                return;
            }

            // Initialize Firebase with Service Account
            $factory = (new Factory)->withServiceAccount($serviceAccountPath);
            $this->messaging = $factory->createMessaging();
            
            Log::info('✅ [FCM] Firebase Messaging initialized successfully');
            
        } catch (\Exception $e) {
            Log::error('❌ [FCM] Failed to initialize Firebase', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 🔥 SEND PUSH NOTIFICATION TO SINGLE USER
     * ═══════════════════════════════════════════════════════════════
     * 
     * @param User|int $user - User model or user ID
     * @param array $data - Notification data
     * @return bool Success status
     * 
     * Example:
     * $fcmService->sendToUser($user, [
     *     'title' => 'New Survey Request',
     *     'body' => 'Please complete the survey for Project ABC',
     *     'data' => ['notification_id' => 123, 'type' => 'survey']
     * ]);
     */
    public function sendToUser($user, array $data): bool
    {
        // Get User model if integer ID provided
        if (is_int($user)) {
            $user = User::find($user);
        }

        // Validate user has FCM token
        if (!$user || !$user->fcm_token) {
            Log::info("❌ [FCM] User {$user?->id} has no FCM token");
            return false;
        }

        return $this->sendToToken($user->fcm_token, $data);
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 🔥 SEND PUSH NOTIFICATION TO MULTIPLE USERS
     * ═══════════════════════════════════════════════════════════════
     * 
     * @param array $userIds - Array of user IDs
     * @param array $data - Notification data
     * @return int Number of successful sends
     */
    public function sendToUsers(array $userIds, array $data): int
    {
        $users = User::whereIn('id', $userIds)
            ->whereNotNull('fcm_token')
            ->get();

        $successCount = 0;

        foreach ($users as $user) {
            if ($this->sendToUser($user, $data)) {
                $successCount++;
            }
        }

        Log::info("📤 [FCM] Sent to {$successCount}/{$users->count()} users");

        return $successCount;
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 🔥 SEND TO FCM TOKEN DIRECTLY (V1 API)
     * ═══════════════════════════════════════════════════════════════
     * 
     * @param string $fcmToken - Firebase Cloud Messaging token
     * @param array $data - Notification data with title, body, data
     * @return bool Success status
     */
    public function sendToToken(string $fcmToken, array $data): bool
    {
        try {
            // Validate Firebase Messaging is initialized
            if (!$this->messaging) {
                Log::error('❌ [FCM] Firebase Messaging not initialized');
                return false;
            }

            // Build notification
            $notification = Notification::create(
                $data['title'] ?? 'MOEY Notification',
                $data['body'] ?? 'You have a new notification'
            );

            // Build message with data payload
            $messageData = array_merge([
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ], $data['data'] ?? []);

            // Create cloud message
            $message = CloudMessage::withTarget('token', $fcmToken)
                ->withNotification($notification)
                ->withData($messageData);

            // Send message
            $this->messaging->send($message);

            Log::info('✅ [FCM] Push notification sent', [
                'token' => substr($fcmToken, 0, 20) . '...',
                'title' => $data['title'] ?? 'No title',
            ]);

            return true;

        } catch (\Kreait\Firebase\Exception\Messaging\InvalidArgument $e) {
            // Invalid token - remove from database
            Log::warning('⚠️  [FCM] Invalid FCM token', [
                'error' => $e->getMessage(),
                'token' => substr($fcmToken, 0, 20) . '...',
            ]);
            
            $this->removeInvalidToken($fcmToken);
            return false;

        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            // Token not registered or expired
            Log::warning('⚠️  [FCM] Token not found or expired', [
                'error' => $e->getMessage(),
                'token' => substr($fcmToken, 0, 20) . '...',
            ]);
            
            $this->removeInvalidToken($fcmToken);
            return false;

        } catch (\Kreait\Firebase\Exception\MessagingException $e) {
            // Other Firebase messaging errors
            Log::error('❌ [FCM] Firebase messaging error', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            
            return false;

        } catch (\Exception $e) {
            // Generic errors
            Log::error('❌ [FCM] Exception occurred', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return false;
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 🗑️  REMOVE INVALID FCM TOKEN
     * ═══════════════════════════════════════════════════════════════
     */
    private function removeInvalidToken(string $fcmToken): void
    {
        User::where('fcm_token', $fcmToken)
            ->update([
                'fcm_token' => null,
                'device_platform' => null,
                'fcm_token_updated_at' => null,
            ]);

        Log::info('🗑️  [FCM] Removed invalid token', [
            'token' => substr($fcmToken, 0, 20) . '...',
        ]);
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 📊 GET STATISTICS
     * ═══════════════════════════════════════════════════════════════
     */
    public function getStats(): array
    {
        return [
            'total_users' => User::count(),
            'users_with_fcm_token' => User::whereNotNull('fcm_token')->count(),
            'android_devices' => User::where('device_platform', 'android')->count(),
            'ios_devices' => User::where('device_platform', 'ios')->count(),
        ];
    }

    /**
     * ═══════════════════════════════════════════════════════════════
     * 📤 SEND MULTICAST (TO MULTIPLE TOKENS)
     * ═══════════════════════════════════════════════════════════════
     * 
     * More efficient for sending same message to multiple devices
     * 
     * @param array $fcmTokens - Array of FCM tokens
     * @param array $data - Notification data
     * @return array ['success' => int, 'failure' => int]
     */
    public function sendMulticast(array $fcmTokens, array $data): array
    {
        try {
            if (!$this->messaging) {
                Log::error('❌ [FCM] Firebase Messaging not initialized');
                return ['success' => 0, 'failure' => count($fcmTokens)];
            }

            // Build notification
            $notification = Notification::create(
                $data['title'] ?? 'MOEY Notification',
                $data['body'] ?? 'You have a new notification'
            );

            // Build message data
            $messageData = array_merge([
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ], $data['data'] ?? []);

            // Create multicast message
            $message = CloudMessage::new()
                ->withNotification($notification)
                ->withData($messageData);

            // Send to multiple tokens
            $report = $this->messaging->sendMulticast($message, $fcmTokens);

            Log::info('📤 [FCM] Multicast sent', [
                'success' => $report->successes()->count(),
                'failure' => $report->failures()->count(),
            ]);

            // Remove invalid tokens
            foreach ($report->invalidTokens() as $invalidToken) {
                $this->removeInvalidToken($invalidToken);
            }

            return [
                'success' => $report->successes()->count(),
                'failure' => $report->failures()->count(),
            ];

        } catch (\Exception $e) {
            Log::error('❌ [FCM] Multicast failed', [
                'error' => $e->getMessage(),
            ]);
            
            return ['success' => 0, 'failure' => count($fcmTokens)];
        }
    }
}
