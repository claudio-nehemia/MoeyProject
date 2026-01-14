<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use App\Services\FCMService;

class NotificationService
{
    private FCMService $fcmService;

    public function __construct()
    {
        $this->fcmService = new FCMService();
    }

    /**
     * Send survey request notification to drafter/surveyor AND project managers
     */
    public function sendSurveyRequestNotification(Order $order)
    {
        // Get drafter/surveyor from order team
        $surveyors = $order->users()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get();

        foreach ($surveyors as $surveyor) {
            $notification = Notification::create([
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

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($surveyor->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_REQUEST,
                'title' => 'Survey Request - ' . $order->nama_project,
                'message' => 'Survey dimulai untuk project "' . $order->nama_project . '". Team survey telah ditugaskan.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'tanggal_survey' => $order->tanggal_survey,
                    'action_url' => '/survey-results',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
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

        \Log::info('=== SEND MOODBOARD NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Designers found: ' . $designers->count());
        
        if ($designers->isEmpty()) {
            \Log::warning('No designers found in order team for order: ' . $order->id);
            \Log::warning('Please add a designer to the order team first.');
        }

        foreach ($designers as $designer) {
            \Log::info('Sending notification to designer: ' . $designer->name . ' (ID: ' . $designer->id . ')');
            
            $notification = Notification::create([
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

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($designer->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
            
            \Log::info('Notification sent successfully to designer: ' . $designer->name);
        }
        
        \Log::info('=== END SEND MOODBOARD NOTIFICATION ===');

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_MOODBOARD_REQUEST,
                'title' => 'Moodboard Request - ' . $order->nama_project,
                'message' => 'Survey telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat moodboard.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    /**
     * Send estimasi request notification to ALL estimators AND project managers
     */
    public function sendEstimasiRequestNotification(Order $order)
    {
        // Get ALL users with Estimator role
        $estimators = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Estimator');
        })->get();

        foreach ($estimators as $estimator) {
            $notification = Notification::create([
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

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($estimator->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_ESTIMASI_REQUEST,
                'title' => 'Estimasi Request - ' . $order->nama_project,
                'message' => 'Moodboard telah selesai untuk project "' . $order->nama_project . '". Team estimator sedang membuat estimasi.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/estimasi',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    /**
     * Send commitment fee request notification to ALL legal admin AND project managers
     */
    public function sendCommitmentFeeRequestNotification(Order $order)
    {
        // Get ALL users with Legal Admin role
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin');
        })->get();

        foreach ($legalAdmins as $legalAdmin) {
            $notification = Notification::create([
                'user_id' => $legalAdmin->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_COMMITMENT_FEE_REQUEST,
                'title' => 'Commitment Fee Request - ' . $order->nama_project,
                'message' => 'Moodboard kasar telah di-approve untuk project "' . $order->nama_project . '". Silakan isi commitment fee.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/commitment-fee',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($legalAdmin->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_COMMITMENT_FEE_REQUEST,
                'title' => 'Commitment Fee Request - ' . $order->nama_project,
                'message' => 'Moodboard kasar telah di-approve untuk project "' . $order->nama_project . '". Legal admin sedang mengisi commitment fee.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/commitment-fee',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    /**
     * Send design approval notification to designer AND project managers
     */
    public function sendDesignApprovalNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            $notification = Notification::create([
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

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($designer->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_DESIGN_APPROVAL,
                'title' => 'Design Approval - ' . $order->nama_project,
                'message' => 'Estimasi telah selesai untuk project "' . $order->nama_project . '". Designer sedang review dan approve design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    /**
     * Send final design request notification to designer AND project managers
     */
    public function sendFinalDesignRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            $notification = Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_FINAL_DESIGN_REQUEST,
                'title' => 'Final Design Request - ' . $order->nama_project,
                'message' => 'Commitment fee telah selesai untuk project "' . $order->nama_project . '". Silakan buat final design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($designer->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_FINAL_DESIGN_REQUEST,
                'title' => 'Final Design Request - ' . $order->nama_project,
                'message' => 'Commitment fee telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat final design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/moodboard',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendItemPekerjaanRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            $notification = Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_ITEM_PEKERJAAN_REQUEST,
                'title' => 'Item Pekerjaan Request - ' . $order->nama_project,
                'message' => 'Desain Final telah selesai untuk project "' . $order->nama_project . '". Silakan buat Item Pekerjaan.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/item-pekerjaan',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($designer->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_ITEM_PEKERJAAN_REQUEST,
                'title' => 'Item Pekerjaan Request - ' . $order->nama_project,
                'message' => 'Desain Final telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat Item Pekerjaan.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/item-pekerjaan',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendRabInternalRequestNotification(Order $order)
    {
        // Get estimator from order team
        $estimators = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Estimator');
        })->get();

        foreach ($estimators as $estimator) {
            $notification = Notification::create([
                'user_id' => $estimator->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_RAB_INTERNAL_REQUEST,
                'title' => 'RAB Internal Request - ' . $order->nama_project,
                'message' => 'Item Pekerjaan telah selesai untuk project "' . $order->nama_project . '". Silakan buat RAB Internal.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/rab-internal',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($estimator->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_RAB_INTERNAL_REQUEST,
                'title' => 'RAB Internal Request - ' . $order->nama_project,
                'message' => 'Item Pekerjaan telah selesai untuk project "' . $order->nama_project . '". Estimator sedang membuat RAB Internal.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/rab-internal',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendKontrakRequestNotification(Order $order)
    {
        // Get legal admin from order team
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin');
        })->get();

        foreach ($legalAdmins as $legalAdmin) {
            $notification = Notification::create([
                'user_id' => $legalAdmin->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_KONTRAK_REQUEST,
                'title' => 'Kontrak Request - ' . $order->nama_project,
                'message' => 'RAB Internal telah submit untuk project "' . $order->nama_project . '". Silakan buat Kontrak.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/kontrak',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($legalAdmin->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_KONTRAK_REQUEST,
                'title' => 'Kontrak Request - ' . $order->nama_project,
                'message' => 'RAB Internal telah submit untuk project "' . $order->nama_project . '". Legal admin sedang membuat Kontrak.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/kontrak',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendInvoiceRequestNotification(Order $order)
    {
        // Get finance team from order team
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin');
        })->get();

        foreach ($legalAdmins as $financeUser) {
            $notification = Notification::create([
                'user_id' => $financeUser->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_INVOICE_REQUEST,
                'title' => 'Invoice Request - ' . $order->nama_project,
                'message' => 'Kontrak telah submit untuk project "' . $order->nama_project . '". Silakan buat Invoice.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/invoice',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($financeUser->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_INVOICE_REQUEST,
                'title' => 'Invoice Request - ' . $order->nama_project,
                'message' => 'Kontrak telah submit untuk project "' . $order->nama_project . '". Finance sedang membuat Invoice.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/invoice',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendSurveyScheduleRequestNotification(Order $order)
    {
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_SCHEDULE_REQUEST,
                'title' => 'Survey Schedule Request - ' . $order->nama_project,
                'message' => 'Anda ditugaskan untuk menjadwalkan ulang survey pada project "' . $order->nama_project . '". Silakan atur jadwal survey.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/survey-schedule',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendSurveyUlangRequestNotification(Order $order)
    {
        // Get drafter/surveyor from order team
        $teams = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter', 'Desainer']);
        })->get();

        foreach ($teams as $team) {
            $notification = Notification::create([
                'user_id' => $team->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_ULANG_REQUEST,
                'title' => 'Re-Survey Request - ' . $order->nama_project,
                'message' => 'Anda ditugaskan untuk melakukan survey ulang setelah customer DP pada project "' . $order->nama_project . '". Silakan lengkapi hasil survey ulang.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'tanggal_survey' => $order->tanggal_survey,
                    'action_url' => '/survey-ulang',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($team->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_ULANG_REQUEST,
                'title' => 'Re-Survey Request - ' . $order->nama_project,
                'message' => 'Customer telah DP untuk project "' . $order->nama_project . '". Team survey sedang melakukan survey ulang.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'tanggal_survey' => $order->tanggal_survey,
                    'action_url' => '/survey-ulang',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendGambarKerjaRequestNotification(Order $order)
    {
        $teams = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter', 'Desainer']);
        })->get();
        
        foreach ($teams as $team) {
            $notification = Notification::create([
                'user_id' => $team->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_GAMBAR_KERJA_REQUEST,
                'title' => 'Gambar Kerja Request - ' . $order->nama_project,
                'message' => 'Survey ulang telah selesai untuk project "' . $order->nama_project . '". Silakan buat gambar kerja.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/gambar-kerja',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($team->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_GAMBAR_KERJA_REQUEST,
                'title' => 'Gambar Kerja Request - ' . $order->nama_project,
                'message' => 'Survey ulang telah selesai untuk project "' . $order->nama_project . '". Team drafter sedang membuat gambar kerja.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/gambar-kerja',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendApprovalMaterialRequestNotification(Order $order)
    {
        $drafters = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Drafter');
        })->get();

        foreach ($drafters as $drafter) {
            $notification = Notification::create([
                'user_id' => $drafter->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_APPROVAL_MATERIAL_REQUEST,
                'title' => 'Approval Material Request - ' . $order->nama_project,
                'message' => 'Gambar kerja telah selesai untuk project "' . $order->nama_project . '". Silakan lakukan approval material.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/approval-material',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($drafter->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }

        // Also send to ALL Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_APPROVAL_MATERIAL_REQUEST,
                'title' => 'Approval Material Request - ' . $order->nama_project,
                'message' => 'Gambar kerja telah selesai untuk project "' . $order->nama_project . '". Drafter sedang melakukan approval material.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/approval-material',
                ],
            ]);

            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
        }
    }

    public function sendWorkplanRequestNotification(Order $order)
    {
        // Get all Project Managers
        $pms = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        \Log::info('=== SEND WORKPLAN NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Project Managers found: ' . $pms->count());

        foreach ($pms as $pm) {
            \Log::info('Sending notification to PM: ' . $pm->name . ' (ID: ' . $pm->id . ')');
            
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_WORKPLAN_REQUEST,
                'title' => 'Workplan Request - ' . $order->nama_project,
                'message' => 'Survey ulang telah selesai untuk project "' . $order->nama_project . '". Silakan buat workplan.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/workplan',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($pm->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
            
            \Log::info('Notification sent successfully to PM: ' . $pm->name);
        }
        
        \Log::info('=== END SEND WORKPLAN NOTIFICATION ===');
    }

    public function sendApprovalRabUpdateNotification(Order $order)
    {
        // Get all Project Managers and Estimators
        $users = User::whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Project Manager', 'Estimator']);
        })->get();

        \Log::info('=== SEND APPROVAL RAB UPDATE NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('PMs & Estimators found: ' . $users->count());

        foreach ($users as $user) {
            \Log::info('Sending notification to: ' . $user->name . ' (ID: ' . $user->id . ')');
            
            $notification = Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'approval_rab_update',
                'title' => 'Approval RAB Updated - ' . $order->nama_project,
                'message' => 'Keterangan material dan bahan baku telah diupdate untuk project "' . $order->nama_project . '". Silakan review perubahan.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/approval-material',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($user->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
            
            \Log::info('Notification sent successfully to: ' . $user->name);
        }
        
        \Log::info('=== END SEND APPROVAL RAB UPDATE NOTIFICATION ===');
    }

    public function sendProjectManagementRequestNotification(Order $order)
    {
        // Get all Supervisors and Project Managers
        $users = User::whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Supervisor', 'Project Manager']);
        })->get();

        \Log::info('=== SEND PROJECT MANAGEMENT NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Supervisors & PMs found: ' . $users->count());

        foreach ($users as $user) {
            \Log::info('Sending notification to: ' . $user->name . ' (ID: ' . $user->id . ') - Role: ' . $user->role->nama_role);
            
            $notification = Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_PROJECT_MANAGEMENT_REQUEST,
                'title' => 'Project Management Request - ' . $order->nama_project,
                'message' => 'Workplan telah selesai untuk project "' . $order->nama_project . '". Silakan mulai project management.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/project-management',
                ],
            ]);

            // 🔥 Send FCM push notification
            $this->fcmService->sendToUser($user->id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'data' => [
                    'notification_id' => $notification->id,
                    'type' => $notification->type,
                    'order_id' => $order->id,
                ],
            ]);
            
            \Log::info('Notification sent successfully to: ' . $user->name);
        }
        
        \Log::info('=== END SEND PROJECT MANAGEMENT NOTIFICATION ===');
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