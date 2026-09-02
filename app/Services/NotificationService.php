<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\TaskResponse;
use App\Services\FCMService;

class NotificationService
{
    private FCMService $fcmService;

    public function __construct()
    {
        $this->fcmService = new FCMService();
    }

    /**
     * Dispatch notification dynamically using NotificationSetting if available.
     * Returns true if handled dynamically, false if caller should use fallback.
     */
    public function dispatchDynamicNotification(string $eventKey, Order $order, string $defaultType, array $customData = []): bool
    {
        $setting = NotificationSetting::getByKey($eventKey);
        if (!$setting) {
            return false;
        }

        // If explicitly deactivated by admin, skip sending
        if (!$setting->is_active) {
            \Log::info("[NotificationService] Notification '{$eventKey}' is disabled in settings.");
            return true;
        }

        $replacements = array_merge([
            'nama_project' => $order->nama_project ?? '-',
            'customer_name' => $order->customer_name ?? '-',
            'tanggal_survey' => $order->tanggal_survey ?? '-',
        ], $customData);

        $title = $setting->formatTitle($replacements);
        $message = $setting->formatMessage($replacements);
        $actionUrl = $setting->action_url ?: ($customData['action_url'] ?? '/order');

        $notificationData = array_merge([
            'order_name' => $order->nama_project,
            'customer_name' => $order->customer_name,
            'action_url' => $actionUrl,
        ], $customData);

        $sendDb = $setting->send_database;
        $sendFcm = $setting->send_fcm;

        // 1. Resolve primary recipients
        $recipients = collect();
        if (!empty($setting->target_role_ids)) {
            $roleIds = $setting->target_role_ids;
            if ($setting->recipient_type === 'all_by_role') {
                $recipients = User::where(function ($query) use ($roleIds) {
                    $query->whereIn('role_id', $roleIds)
                        ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds));
                })->get();
            } else {
                // 'order_team'
                $recipients = $order->users()->where(function ($query) use ($roleIds) {
                    $query->whereIn('role_id', $roleIds)
                        ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds));
                })->get();

                if ($recipients->isEmpty() && method_exists($order, 'surveyUsers')) {
                    $recipients = $order->surveyUsers()->where(function ($query) use ($roleIds) {
                        $query->whereIn('role_id', $roleIds)
                            ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds));
                    })->get();
                }
            }
        }

        foreach ($recipients as $user) {
            $notif = null;
            if ($sendDb) {
                $notif = Notification::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'type' => $defaultType,
                    'title' => $title,
                    'message' => $message,
                    'data' => $notificationData,
                ]);
            }

            if ($sendFcm) {
                $this->fcmService->sendToUser($user->id, [
                    'title' => $title,
                    'body' => $message,
                    'data' => [
                        'notification_id' => $notif ? $notif->id : 0,
                        'type' => $defaultType,
                        'order_id' => $order->id,
                    ],
                ]);
            }
        }

        // 2. Management copy
        if ($setting->send_to_management) {
            $mgmtRoleIds = !empty($setting->management_role_ids)
                ? $setting->management_role_ids
                : [
                    \App\Models\Role::getKepalaMarketingRoleId(),
                    \App\Models\Role::getProjectManagerRoleId(),
                    \App\Models\Role::getSupervisorRoleId(),
                ];

            $managers = $order->users()->where(function ($query) use ($mgmtRoleIds) {
                $query->whereIn('role_id', $mgmtRoleIds)
                    ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $mgmtRoleIds));
            })->get();

            foreach ($managers as $manager) {
                if ($recipients->contains('id', $manager->id)) {
                    continue;
                }

                $notif = null;
                if ($sendDb) {
                    $notif = Notification::create([
                        'user_id' => $manager->id,
                        'order_id' => $order->id,
                        'type' => $defaultType,
                        'title' => $title,
                        'message' => $message,
                        'data' => $notificationData,
                    ]);
                }

                if ($sendFcm) {
                    $this->fcmService->sendToUser($manager->id, [
                        'title' => $title,
                        'body' => $message,
                        'data' => [
                            'notification_id' => $notif ? $notif->id : 0,
                            'type' => $defaultType,
                            'order_id' => $order->id,
                        ],
                    ]);
                }
            }
        }

        return true;
    }

    /**
     * Send notification copy to management team members (Kepala Marketing, Project Manager, Supervisor) assigned to order
     */
    private function sendToManagementTeam(Order $order, string $type, string $title, string $message, array $data = [])
    {
        $roleIds = [
            \App\Models\Role::getKepalaMarketingRoleId(),
            \App\Models\Role::getProjectManagerRoleId(),
            \App\Models\Role::getSupervisorRoleId(),
        ];

        $managers = $order->users()->where(function ($query) use ($roleIds) {
            $query->whereIn('role_id', $roleIds)
                ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds));
        })->get();

        foreach ($managers as $manager) {
            $notification = Notification::create([
                'user_id' => $manager->id,
                'order_id' => $order->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
            ]);

            $this->fcmService->sendToUser($manager->id, [
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
     * Send survey request notification to drafter/surveyor AND management team (KM, PM, Supervisor)
     */
    public function sendSurveyRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_survey', $order, Notification::TYPE_SURVEY_REQUEST, ['action_url' => '/survey-results'])) return;
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_SURVEY_REQUEST,
            'Survey Request - ' . $order->nama_project,
            'Survey dimulai untuk project "' . $order->nama_project . '". Team survey telah ditugaskan.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'tanggal_survey' => $order->tanggal_survey,
                'action_url' => '/survey-results',
            ]
        );
    }

    /**
     * Send moodboard request notification to designer
     */
    public function sendMoodboardRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_moodboard', $order, Notification::TYPE_MOODBOARD_REQUEST, ['action_url' => '/moodboard'])) return;
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getDesainerRoleId());
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_MOODBOARD_REQUEST,
            'Moodboard Request - ' . $order->nama_project,
            'Survey telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat moodboard.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/moodboard',
            ]
        );
    }

    /**
     * Send estimasi request notification to ALL estimators AND project managers
     */
    public function sendEstimasiRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_estimasi', $order, Notification::TYPE_ESTIMASI_REQUEST, ['action_url' => '/estimasi'])) return;
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_ESTIMASI_REQUEST,
            'Estimasi Request - ' . $order->nama_project,
            'Moodboard telah selesai untuk project "' . $order->nama_project . '". Team estimator sedang membuat estimasi.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/estimasi',
            ]
        );
    }

    /**
     * Send commitment fee request notification to ALL legal admin AND project managers
     */
    public function sendCommitmentFeeRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_commitment_fee', $order, Notification::TYPE_COMMITMENT_FEE_REQUEST, ['action_url' => '/commitment-fee'])) return;
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_COMMITMENT_FEE_REQUEST,
            'Commitment Fee Request - ' . $order->nama_project,
            'Moodboard kasar telah di-approve untuk project "' . $order->nama_project . '". Legal admin sedang mengisi commitment fee.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/commitment-fee',
            ]
        );
    }

    /**
     * Send design approval notification to designer AND project managers
     */
    public function sendDesignApprovalNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_design_approval', $order, Notification::TYPE_DESIGN_APPROVAL, ['action_url' => '/moodboard'])) return;
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getDesainerRoleId());
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_DESIGN_APPROVAL,
            'Design Approval - ' . $order->nama_project,
            'Estimasi telah selesai untuk project "' . $order->nama_project . '". Designer sedang review dan approve design.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/moodboard',
            ]
        );
    }

    /**
     * Send final design request notification to designer AND project managers
     */
    public function sendFinalDesignRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_final_design', $order, Notification::TYPE_FINAL_DESIGN_REQUEST, ['action_url' => '/desain-final'])) return;
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getDesainerRoleId());
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_FINAL_DESIGN_REQUEST,
            'Final Design Request - ' . $order->nama_project,
            'Commitment fee telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat final design.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/moodboard',
            ]
        );
    }

    public function sendItemPekerjaanRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_item_pekerjaan', $order, Notification::TYPE_ITEM_PEKERJAAN_REQUEST, ['action_url' => '/item-pekerjaan'])) return;
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getDesainerRoleId());
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_ITEM_PEKERJAAN_REQUEST,
            'Item Pekerjaan Request - ' . $order->nama_project,
            'Desain Final telah selesai untuk project "' . $order->nama_project . '". Designer sedang membuat Item Pekerjaan.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/item-pekerjaan',
            ]
        );
    }

    public function sendRabInternalRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_rab_internal', $order, Notification::TYPE_RAB_INTERNAL_REQUEST, ['action_url' => '/rab-internal'])) return;
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_RAB_INTERNAL_REQUEST,
            'RAB Internal Request - ' . $order->nama_project,
            'Item Pekerjaan telah selesai untuk project "' . $order->nama_project . '". Estimator sedang membuat RAB Internal.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/rab-internal',
            ]
        );
    }

    public function sendKontrakRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_kontrak', $order, Notification::TYPE_KONTRAK_REQUEST, ['action_url' => '/kontrak'])) return;
        // Get legal admin from order team
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin')->orWhere('nama_role', 'LIKE', '%Legal%');
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_KONTRAK_REQUEST,
            'Kontrak Request - ' . $order->nama_project,
            'RAB Internal telah submit untuk project "' . $order->nama_project . '". Legal admin sedang membuat Kontrak.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/kontrak',
            ]
        );
    }

    public function sendInvoiceRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_invoice', $order, Notification::TYPE_INVOICE_REQUEST, ['action_url' => '/invoice'])) return;
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

        // Also send to management team in order teams (KM, PM, Supervisor)
        $this->sendToManagementTeam(
            $order,
            Notification::TYPE_INVOICE_REQUEST,
            'Invoice Request - ' . $order->nama_project,
            'Kontrak telah submit untuk project "' . $order->nama_project . '". Finance sedang membuat Invoice.',
            [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'action_url' => '/invoice',
            ]
        );
    }

    public function sendSurveyScheduleRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_survey_schedule', $order, Notification::TYPE_SURVEY_SCHEDULE_REQUEST, ['action_url' => '/survey-schedule'])) return;
        $projectManagers = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
        })->get();

        foreach ($projectManagers as $pm) {
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

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_SCHEDULE_REQUEST,
                'title' => 'Survey Schedule Request - ' . $order->nama_project,
                'message' => 'Project manager telah dijadwalkan ulang untuk survey pada project "' . $order->nama_project . '".',
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
        if ($this->dispatchDynamicNotification('stage_survey_ulang', $order, Notification::TYPE_SURVEY_ULANG_REQUEST, ['action_url' => '/survey-ulang'])) return;
        // Get drafter/surveyor from order team
        $teams = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->where(function ($q) {
                $q->whereIn('nama_role', ['Surveyor', 'Drafter'])
                  ->orWhere('id', \App\Models\Role::getDesainerRoleId());
            });
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

        // Also send to Kepala Marketing in order teams
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
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
        if ($this->dispatchDynamicNotification('stage_gambar_kerja', $order, Notification::TYPE_GAMBAR_KERJA_REQUEST, ['action_url' => '/gambar-kerja'])) return;
        $teams = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->where(function ($q) {
                $q->whereIn('nama_role', ['Surveyor', 'Drafter'])
                  ->orWhere('id', \App\Models\Role::getDesainerRoleId());
            });
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

        // Also send to Kepala Marketing in order teams
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
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

    public function sendMeetingVendorRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_meeting_vendor', $order, Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST, ['action_url' => '/meeting-vendor'])) return;
        $drafters = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Drafter', 'Surveyor']);
        })->get();

        if ($drafters->isEmpty()) {
            $drafters = $order->users()->whereHas('role', function ($query) {
                $query->whereIn('nama_role', ['Drafter', 'Surveyor']);
            })->get();
        }

        foreach ($drafters as $drafter) {
            $notification = Notification::create([
                'user_id' => $drafter->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST,
                'title' => 'Buat Jadwal Meeting Vendor - ' . $order->nama_project,
                'message' => 'Gambar kerja telah disetujui untuk project "' . $order->nama_project . '". Silakan buat Jadwal Meeting Vendor.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/meeting-vendor',
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

        // Also send to Kepala Marketing and PM in order teams
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->whereIn('id', [
                \App\Models\Role::getKepalaMarketingRoleId(),
                \App\Models\Role::getProjectManagerRoleId(),
            ]);
        })->get();

        foreach ($pms as $pm) {
            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST,
                'title' => 'Buat Jadwal Meeting Vendor - ' . $order->nama_project,
                'message' => 'Gambar kerja telah disetujui untuk project "' . $order->nama_project . '". Drafter sedang membuat Jadwal Meeting Vendor.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/meeting-vendor',
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

    public function sendMeetingApprovalRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_meeting_vendor', $order, Notification::TYPE_JADWAL_MEETING_APPROVAL_REQUEST, ['action_url' => '/meeting-vendor'])) return;
        $this->sendMeetingVendorRequestNotification($order);
    }

    public function sendApprovalMaterialRequestNotification(Order $order)
    {
        if ($this->dispatchDynamicNotification('stage_approval_material', $order, Notification::TYPE_APPROVAL_MATERIAL_REQUEST, ['action_url' => '/approval-material'])) return;
        $drafters = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Drafter', 'Surveyor']);
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

        // Also send to Kepala Marketing in order teams
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
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
        if ($this->dispatchDynamicNotification('stage_workplan', $order, Notification::TYPE_WORKPLAN_REQUEST, ['action_url' => '/workplan'])) return;
        // Get project managers in survey teams
        $projectManagers = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();
        $pms = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
        })->get();

        \Log::info('=== SEND WORKPLAN NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Kepala Marketing in team found: ' . $pms->count());

        foreach ($projectManagers as $pm) {
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

        foreach ($pms as $pm) {
            \Log::info('Sending notification to Kepala Marketing: ' . $pm->name . ' (ID: ' . $pm->id . ')');

            $notification = Notification::create([
                'user_id' => $pm->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_WORKPLAN_REQUEST,
                'title' => 'Workplan Request - ' . $order->nama_project,
                'message' => 'Survey ulang telah selesai untuk project "' . $order->nama_project . '". Project manager sedang membuat workplan.',
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

            \Log::info('Notification sent successfully to Kepala Marketing: ' . $pm->name);
        }

        \Log::info('=== END SEND WORKPLAN NOTIFICATION ===');
    }

    public function sendApprovalRabUpdateNotification(Order $order)
    {
        // Get Kepala Marketing from order teams and all Estimators
        $kepalaMarketingInTeam = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
        })->get();

        $estimators = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Estimator');
        })->get();

        // Merge both collections
        $users = $kepalaMarketingInTeam->merge($estimators);

        \Log::info('=== SEND APPROVAL RAB UPDATE NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Kepala Marketing in team & Estimators found: ' . $users->count());

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
        if ($this->dispatchDynamicNotification('stage_project_management', $order, Notification::TYPE_PROJECT_MANAGEMENT_REQUEST, ['action_url' => '/project-management'])) return;
        // Get Kepala Marketing from order teams and all Supervisors
        $kepalaMarketingInTeam = $order->users()->whereHas('role', function ($query) {
            $query->where('id', \App\Models\Role::getKepalaMarketingRoleId());
        })->get();

        $supervisors = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Supervisor');
        })->get();

        // project manager dari survey teams
        $projectManagers = $order->surveyUsers()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Project Manager');
        })->get();

        // Merge both collections
        $users = $kepalaMarketingInTeam->merge($supervisors)->merge($projectManagers);

        \Log::info('=== SEND PROJECT MANAGEMENT NOTIFICATION ===');
        \Log::info('Order ID: ' . $order->id);
        \Log::info('Order Name: ' . $order->nama_project);
        \Log::info('Kepala Marketing in team & Supervisors found: ' . $users->count());

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

    public function sendTaskDeadlineReminderNotification(Order $order, TaskResponse $taskResponse, User $user)
    {
        $setting = NotificationSetting::getByKey('reminder_task_deadline');
        if ($setting && !$setting->is_active) {
            return;
        }
        $tahapNames = [
            'survey' => 'Survey',
            'moodboard' => 'Moodboard',
            'estimasi' => 'Estimasi',
            'cm_fee' => 'Commitment Fee',
            'approval_design' => 'Approval Desain',
            'desain_final' => 'Desain Final',
            'item-pekerjaan' => 'Item Pekerjaan',
            'rab_internal' => 'Rab Internal',
            'kontrak' => 'Kontrak',
            'invoice' => 'Invoice',
            'survey_schedule' => 'Jadwal Survey',
            'survey_ulang' => 'Survey Ulang',
            'gambar_kerja' => 'Gambar Kerja',
            'meeting_vendor' => 'Meeting Vendor',
            'meeting_approval' => 'Meeting Vendor',
            'approval_material' => 'Approval Material',
            'workplan' => 'Workplan',
            'produksi' => 'Produksi',
        ];

        $tahapName = $tahapNames[$taskResponse->tahap] ?? $taskResponse->tahap;
        $statusText = $taskResponse->status === 'menunggu_response'
            ? 'Response'
            : 'Input Data';

        $notification = Notification::create([
            'user_id' => $user->id,
            'order_id' => $order->id,
            'type' => 'task_deadline_reminder',
            'title' => "Reminder: {$tahapName} - {$order->nama_project}",
            'message' => "Deadline {$tahapName} untuk project \"{$order->nama_project}\" besok. Segera {$statusText}.",
            'data' => [
                'order_name' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'tahap' => $taskResponse->tahap,
                'deadline' => $taskResponse->deadline->toDateString(),
                'action_url' => $this->getActionUrlForTahap($taskResponse->tahap),
            ],
        ]);

        // Send FCM push notification
        $this->fcmService->sendToUser($user->id, [
            'title' => $notification->title,
            'body' => $notification->message,
            'data' => [
                'notification_id' => $notification->id,
                'type' => $notification->type,
                'order_id' => $order->id,
            ],
        ]);
    }

    /**
     * Get action URL berdasarkan tahap
     */
    private function getActionUrlForTahap(string $tahap): string
    {
        // disamakan dengan send task remindeer notification
        $urls = [
            'survey' => '/survey-results',
            'moodboard' => '/moodboard',
            'estimasi' => '/estimasi',
            'cm_fee' => '/commitment-fee',
            'approval_design' => '/moodboard',
            'desain_final' => '/desain-final',
            'item-pekerjaan' => '/item-pekerjaan',
            'rab' => '/rab-internal',
            'kontrak' => '/kontrak',
            'invoice' => '/invoice',
            'survey_schedule' => '/survey-schedule',
            'survey_ulang' => '/survey-ulang',
            'gambar_kerja' => '/gambar-kerja',
            'meeting_vendor' => '/meeting-vendor',
            'meeting_approval' => '/meeting-vendor',
            'approval_material' => '/approval-material',
            'workplan' => '/workplan',
            'produksi' => '/project-management',
        ];

        return $urls[$tahap] ?? '/order';
    }

    /**
     * Send payment reminder notification to Legal Admin users
     */
    public function sendPaymentReminderNotification(Order $order, \App\Models\CashflowVendorEntry $entry, string $paymentType = 'dp')
    {
        $setting = NotificationSetting::getByKey('reminder_payment_due');
        if ($setting && !$setting->is_active) {
            return;
        }
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin');
        })->get();

        $amount = $paymentType === 'termin' ? $entry->pembayaran_termin : $entry->pembayaran;
        $formattedAmount = 'Rp ' . number_format($amount, 0, ',', '.');
        $label = $entry->label ?: $entry->vendor_name ?: 'Vendor';
        $typeLabel = $paymentType === 'termin' ? 'Termin' : 'DP/Pembayaran';

        foreach ($legalAdmins as $legalAdmin) {
            $notification = Notification::create([
                'user_id' => $legalAdmin->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_PAYMENT_REMINDER,
                'title' => "💰 Reminder Pembayaran - {$order->nama_project}",
                'message' => "Pembayaran {$typeLabel} untuk \"{$label}\" sebesar {$formattedAmount} pada project \"{$order->nama_project}\" jatuh tempo hari ini.",
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'vendor_entry_id' => $entry->id,
                    'vendor_type' => $entry->vendor_type,
                    'payment_type' => $paymentType,
                    'amount' => $amount,
                    'action_url' => '/cashflow/' . $order->id,
                ],
            ]);

            // 🔥 Send FCM push notification to mobile
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
    }

    public function sendPaymentReminderH7Notification(Order $order, \App\Models\CashflowVendorEntry $entry, string $paymentType = 'dp')
    {
        $setting = NotificationSetting::getByKey('reminder_payment_h_min');
        if ($setting && !$setting->is_active) {
            return;
        }
        $legalAdmins = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Legal Admin');
        })->get();

        $amount = $paymentType === 'termin' ? $entry->pembayaran_termin : $entry->pembayaran;
        $formattedAmount = 'Rp ' . number_format($amount, 0, ',', '.');
        $label = $entry->label ?: $entry->vendor_name ?: 'Vendor';
        $typeLabel = $paymentType === 'termin' ? 'Termin' : 'DP/Pembayaran';

        foreach ($legalAdmins as $legalAdmin) {
            $notification = Notification::create([
                'user_id' => $legalAdmin->id,
                'order_id' => $order->id,
                'type' => 'payment_reminder_h7',
                'title' => "⚠️ Reminder H-7 Pembayaran - {$order->nama_project}",
                'message' => "Pembayaran {$typeLabel} untuk \"{$label}\" sebesar {$formattedAmount} pada project \"{$order->nama_project}\" jatuh tempo dalam 7 hari.",
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'vendor_entry_id' => $entry->id,
                    'vendor_type' => $entry->vendor_type,
                    'payment_type' => $paymentType,
                    'amount' => $amount,
                    'action_url' => '/cashflow/' . $order->id,
                ],
            ]);

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
    }

    public function sendFeeReminderNotification(Order $order)
    {
        $setting = NotificationSetting::getByKey('reminder_material_fee');
        if ($setting && !$setting->is_active) {
            return;
        }
        $pmUsers = $order->users;

        foreach ($pmUsers as $user) {
            $notification = Notification::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => 'fee_reminder',
                'title' => "💰 Reminder Fee Proyek - {$order->nama_project}",
                'message' => "Fee Team/PM untuk project \"{$order->nama_project}\" harus segera disetujui (3 hari setelah Meeting Approval Material).",
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'action_url' => '/cashflow/' . $order->id,
                ],
            ]);

            $this->fcmService->sendToUser($user->id, [
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
}
