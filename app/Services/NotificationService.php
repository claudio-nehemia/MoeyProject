<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Order;
use App\Models\User;

class NotificationService
{
    /**
     * Send survey request notification to drafter/surveyor
     */
    public function sendSurveyRequestNotification(Order $order)
    {
        // Get drafter/surveyor from order team
        $surveyors = $order->users()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get();

        foreach ($surveyors as $surveyor) {
            Notification::create([
                'user_id' => $surveyor->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_REQUEST,
                'title' => 'Survey Request - ' . $order->nama_project,
                'message' => 'Anda ditugaskan untuk melakukan survey pada project "' . $order->nama_project . '". Silakan lengkapi data survey.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'tanggal_survey' => $order->tanggal_survey,
                    'action_url' => '/survey-results',
                ],
            ]);
        }
    }

    /**
     * Send moodboard request notification to designer
     */
    public function sendMoodboardRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_MOODBOARD_REQUEST,
                'title' => 'Moodboard Request - ' . $order->nama_project,
                'message' => 'Survey telah selesai untuk project "' . $order->nama_project . '". Silakan buat moodboard.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);
        }
    }

    /**
     * Send estimasi request notification to ALL estimators
     */
    public function sendEstimasiRequestNotification(Order $order)
    {
        // Get ALL users with Estimator role
        $estimators = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Estimator');
        })->get();

        foreach ($estimators as $estimator) {
            Notification::create([
                'user_id' => $estimator->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_ESTIMASI_REQUEST,
                'title' => 'Estimasi Request - ' . $order->nama_project,
                'message' => 'Moodboard telah selesai untuk project "' . $order->nama_project . '". Silakan buat estimasi.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/estimasi',
                ],
            ]);
        }
    }

    /**
     * Send design approval notification to designer
     */
    public function sendDesignApprovalNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_DESIGN_APPROVAL,
                'title' => 'Design Approval - ' . $order->nama_project,
                'message' => 'Estimasi telah selesai untuk project "' . $order->nama_project . '". Silakan review dan approve design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);
        }
    }

    /**
     * Send final design request notification to designer
     */
    public function sendFinalDesignRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_FINAL_DESIGN_REQUEST,
                'title' => 'Final Design Request - ' . $order->nama_project,
                'message' => 'Design telah di-approve untuk project "' . $order->nama_project . '". Silakan buat final design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId)
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId)
    {
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Delete notification
     */
    public function deleteNotification($notificationId, $userId)
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->delete();
    }
}