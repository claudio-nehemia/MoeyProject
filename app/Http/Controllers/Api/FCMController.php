<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FCMService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class FCMController extends Controller
{
    private FCMService $fcmService;

    public function __construct()
    {
        $this->fcmService = new FCMService();
    }

    /**
     * Update FCM token for authenticated user
     * 
     * POST /api/mobile/fcm-token
     * Body: { fcm_token: string, platform: 'android'|'ios' }
     */
    public function updateToken(Request $request)
    {
        $validated = $request->validate([
            'fcm_token' => 'required|string|max:255',
            'platform' => ['required', Rule::in(['android', 'ios'])],
        ]);

        $user = Auth::user();
        
        // Update user's FCM token
        $user->update([
            'fcm_token' => $validated['fcm_token'],
            'device_platform' => $validated['platform'],
            'fcm_token_updated_at' => now(),
        ]);

        \Log::info('FCM token updated', [
            'user_id' => $user->id,
            'platform' => $validated['platform'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token updated successfully',
            'data' => [
                'fcm_token' => $user->fcm_token,
                'device_platform' => $user->device_platform,
                'updated_at' => $user->fcm_token_updated_at,
            ],
        ]);
    }

    /**
     * Remove FCM token (on logout)
     * 
     * DELETE /api/mobile/fcm-token
     */
    public function removeToken(Request $request)
    {
        $user = Auth::user();
        
        // Clear user's FCM token
        $user->update([
            'fcm_token' => null,
            'device_platform' => null,
            'fcm_token_updated_at' => null,
        ]);

        \Log::info('FCM token removed', [
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token removed successfully',
        ]);
    }

    /**
     * Get FCM statistics (Admin only)
     * 
     * GET /api/admin/fcm/stats
     */
    public function getStats()
    {
        $stats = $this->fcmService->getStats();
        
        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Test FCM notification (Admin/Development only)
     * 
     * POST /api/admin/fcm/test
     * Body: { user_id: int, title: string, body: string }
     */
    public function testNotification(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        try {
            $success = $this->fcmService->sendToUser($validated['user_id'], [
                'title' => $validated['title'],
                'body' => $validated['body'],
                'data' => [
                    'test' => true,
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test notification sent successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send test notification',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('FCM test failed', [
                'error' => $e->getMessage(),
                'user_id' => $validated['user_id'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Test notification failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
