<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\Invoice;
use App\Models\Kontrak;
use App\Models\Estimasi;
use App\Models\Moodboard;
use App\Models\GambarKerja;
use App\Models\RabInternal;
use App\Models\SurveyUlang;
use App\Models\Notification;
use App\Models\TaskResponse;
use App\Models\WorkplanItem;
use Illuminate\Http\Request;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\SurveyResults;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Http\Controllers\Notification\Traits\HandlesNotificationPipeline;
use App\Http\Controllers\Notification\Traits\HandlesMarketingResponse;

class NotificationController extends Controller
{
    use HandlesNotificationPipeline;
    use HandlesMarketingResponse;
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of user's notifications
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isKepalaMarketing = $user && $user->role && $user->role->nama_role === 'Kepala Marketing';

        $notifications = Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->with([
                'order.surveyResults',
                'order.surveyUlang',
                'order.surveyUsers',
                'order.estimasi',
                'order.moodboard.commitmentFee',
                'order.moodboard.estimasi',
                'order.moodboard.itemPekerjaans.produks.workplanItems',
                'order.itemPekerjaans',
                'order.itemPekerjaans.rabInternal',
                'order.itemPekerjaans.kontrak',
                'order.itemPekerjaans.invoices',
                'order.gambarKerja',
                'order.meetingVendor',
                'order.users.role',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add flags for frontend:
        // - can_marketing_response: any Kepala Marketing assigned to the order can do marketing response
        // - can_update_data: whether the current user is the action role responsible for updating data on this stage
        $notifications->getCollection()->transform(function ($notification) use ($isKepalaMarketing, $user) {
            $canMarketingResponse = false;

            if ($isKepalaMarketing && $notification->order) {
                $assignedKepalaMarketing = $notification->order
                    ->users()
                    ->whereHas('role', fn($q) => $q->where('nama_role', 'Kepala Marketing'))
                    ->where('users.id', $user?->id)
                    ->exists();

                $canMarketingResponse = $assignedKepalaMarketing;
            }

            $notification->can_marketing_response = $canMarketingResponse;
            $notification->can_update_data = $this->canUserUpdateStageData($user, $notification->type, $notification->data ?? []);
            return $notification;
        });

        return Inertia::render('Notification/Index', [
            'notifications' => $notifications,
            'unreadCount' => $this->notificationService->getUnreadCount(auth()->id()),
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        return response()->json([
            'count' => $this->notificationService->getUnreadCount(auth()->id()),
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $this->notificationService->markAsRead($id, auth()->id());

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $this->notificationService->markAllAsRead(auth()->id());

        return response()->json(['success' => true]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, $id)
    {
        $this->notificationService->deleteNotification($id, auth()->id());

        if (!$request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('notifications.index')->with('success', 'Notification deleted successfully.');
    }

    /**
     * Check whether the given user is an action role responsible for performing data updates on this notification stage.
     * Marketing (Kepala Marketing) and management/monitoring roles that do not perform data updates return false.
     */
    public function canUserUpdateStageData($user, string $type, array $data = []): bool
    {
        if (!$user) {
            return false;
        }

        if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return true;
        }

        $roleName = $user->role?->nama_role ?? '';

        if (in_array($roleName, ['Kepala Marketing', 'Owner', 'Customer Service', 'Customer'], true)) {
            return false;
        }

        switch ($type) {
            case Notification::TYPE_SURVEY_REQUEST:
                return $user->hasPermission('survey-results.index')
                    && $user->hasAnyPermission(['survey-results.create', 'survey-results.edit']);

            case Notification::TYPE_SURVEY_SCHEDULE_REQUEST:
                return $user->hasPermission('survey-schedule.index')
                    && $user->hasAnyPermission(['survey-schedule.store', 'survey-schedule.create', 'survey-schedule.edit']);

            case Notification::TYPE_MOODBOARD_REQUEST:
                return $user->hasPermission('moodboard.index')
                    && $user->hasAnyPermission(['moodboard.upload-kasar', 'moodboard.edit']);

            case Notification::TYPE_DESIGN_APPROVAL:
                return $user->hasPermission('moodboard.index')
                    && $user->hasAnyPermission(['moodboard.accept', 'moodboard.revise', 'moodboard.upload-kasar', 'moodboard.edit']);

            case Notification::TYPE_ESTIMASI_REQUEST:
                return $user->hasPermission('estimasi.index')
                    && $user->hasAnyPermission(['estimasi.create', 'estimasi.edit']);

            case Notification::TYPE_COMMITMENT_FEE_REQUEST:
                return $user->hasPermission('commitment-fee.index')
                    && $user->hasAnyPermission(['commitment-fee.create', 'commitment-fee.edit']);

            case Notification::TYPE_FINAL_DESIGN_REQUEST:
                return $user->hasPermission('desain-final.index')
                    && $user->hasAnyPermission(['desain-final.create', 'desain-final.edit', 'moodboard.upload-final']);

            case Notification::TYPE_ITEM_PEKERJAAN_REQUEST:
                return $user->hasPermission('item-pekerjaan.index')
                    && $user->hasAnyPermission(['item-pekerjaan.create', 'item-pekerjaan.edit']);

            case Notification::TYPE_RAB_INTERNAL_REQUEST:
            case 'approval_rab_update':
                return $user->hasPermission('rab-internal.index')
                    && $user->hasAnyPermission(['rab-internal.create', 'rab-internal.edit']);

            case Notification::TYPE_KONTRAK_REQUEST:
                return $user->hasPermission('kontrak.index')
                    && $user->hasAnyPermission(['kontrak.create', 'kontrak.edit']);

            case Notification::TYPE_INVOICE_REQUEST:
                return $user->hasPermission('invoice.index')
                    && $user->hasAnyPermission(['invoice.create', 'invoice.edit']);

            case Notification::TYPE_SURVEY_ULANG_REQUEST:
                return $user->hasPermission('survey-ulang.index')
                    && $user->hasAnyPermission(['survey-ulang.create', 'survey-ulang.store', 'survey-ulang.edit', 'survey-ulang.update']);

            case Notification::TYPE_GAMBAR_KERJA_REQUEST:
                return $user->hasPermission('gambar-kerja.index')
                    && $user->hasAnyPermission(['gambar-kerja.upload', 'gambar-kerja.response'])
                    && in_array($roleName, ['Drafter', 'Desainer', 'Surveyor'], true);

            case Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST:
            case Notification::TYPE_JADWAL_MEETING_APPROVAL_REQUEST:
                return $user->hasPermission('meeting-vendor.index')
                    && $user->hasAnyPermission(['meeting-vendor.store', 'meeting-vendor.response']);

            case Notification::TYPE_APPROVAL_MATERIAL_REQUEST:
                return $user->hasPermission('approval-material.index')
                    && $user->hasAnyPermission(['approval-material.edit', 'approval-material.update']);

            case Notification::TYPE_WORKPLAN_REQUEST:
                return $user->hasPermission('workplan.index')
                    && $user->hasAnyPermission(['workplan.create', 'workplan.edit']);

            case Notification::TYPE_PROJECT_MANAGEMENT_REQUEST:
                return $user->hasPermission('project-management.index')
                    && $user->hasAnyPermission(['project-management.update-stage', 'project-management.show']);

            default:
                $actionUrl = $data['action_url'] ?? '';
                if (is_string($actionUrl) && str_starts_with($actionUrl, '/cashflow')) {
                    return $user->hasPermission('cashflow.index') && $user->hasAnyPermission(['cashflow.create', 'cashflow.edit']);
                }
                return false;
        }
    }

    /**
     * Handle notification response based on type
     */
    public function handleResponse(Request $request, $id)
    {
        $user = auth()->user();
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        // Mark as read
        $this->notificationService->markAsRead($id, auth()->id());

        $order = $notification->order;

        // Marketing response (Kepala Marketing assigned from start only)
        if ($request->boolean('is_marketing')) {
            if (!$order) {
                return redirect()->route('notifications.index')
                    ->with('error', 'Order not found for this notification.');
            }

            if ($authError = $this->ensureOriginalKepalaMarketing($order)) {
                return $authError;
            }

            return $this->handleMarketingResponse($notification, $order);
        }

        // Direct redirect for notifications without order (e.g., test_notification) or reminder notifications
        if (!$order) {
            $actionUrl = $notification->data['action_url'] ?? '/dashboard';
            if ($actionUrl === '/cashflow-manual') {
                $actionUrl = '/cashflow';
            }
            return redirect($actionUrl);
        }

        // Explicit "Detail Order" click OR user is Marketing / non-action role (bukan melakukan aksi terhadap update data)
        $canUpdateData = $this->canUserUpdateStageData($user, $notification->type, $notification->data ?? []);
        if ($request->boolean('is_detail_only') || !$canUpdateData) {
            // If Kepala Marketing is assigned to this order, also record Marketing Response automatically so KPI/TaskResponse is fulfilled
            if ($user && $user->role && $user->role->nama_role === 'Kepala Marketing' && $this->ensureOriginalKepalaMarketing($order) === null) {
                return $this->handleMarketingResponse($notification, $order);
            }

            return redirect()->route('order.show', $order->id)
                ->with('info', 'Menampilkan detail order.');
        }

        // Handle different notification types
        switch ($notification->type) {
            case Notification::TYPE_SURVEY_REQUEST:
                return $this->handleSurveyRequest($order);

            case Notification::TYPE_MOODBOARD_REQUEST:
                return $this->handleMoodboardRequest($order);

            case Notification::TYPE_ESTIMASI_REQUEST:
                return $this->handleEstimasiRequest($order);

            case Notification::TYPE_DESIGN_APPROVAL:
                return $this->handleDesignApproval($order);

            case Notification::TYPE_COMMITMENT_FEE_REQUEST:
                return $this->handleCommitmentFeeRequest($order);

            case Notification::TYPE_FINAL_DESIGN_REQUEST:
                return $this->handleFinalDesignRequest($order);

            case Notification::TYPE_ITEM_PEKERJAAN_REQUEST:
                return $this->handleItemPekerjaanRequest($order);

            case Notification::TYPE_RAB_INTERNAL_REQUEST:
            case 'approval_rab_update':
                return $this->handleRabInternalRequest($order);

            case Notification::TYPE_KONTRAK_REQUEST:
                return $this->handleKontrakRequest($order);

            case Notification::TYPE_INVOICE_REQUEST:
                return $this->handleInvoiceRequest($order);

            case Notification::TYPE_SURVEY_SCHEDULE_REQUEST:
                return $this->handleSurveyScheduleRequest($order);

            case Notification::TYPE_SURVEY_ULANG_REQUEST:
                return $this->handleSurveyUlangRequest($order);

            case Notification::TYPE_GAMBAR_KERJA_REQUEST:
                return $this->handleGambarKerjaRequest($order);

            case Notification::TYPE_JADWAL_MEETING_VENDOR_REQUEST:
            case Notification::TYPE_JADWAL_MEETING_APPROVAL_REQUEST:
                return $this->handleMeetingVendorRequest($order);

            case Notification::TYPE_APPROVAL_MATERIAL_REQUEST:
                return $this->handleApprovalMaterialRequest($order);

            case Notification::TYPE_WORKPLAN_REQUEST:
                return $this->handleWorkplanRequest($order);

            case Notification::TYPE_PROJECT_MANAGEMENT_REQUEST:
                return $this->handleProjectManagementRequest($order);

            default:
                $actionUrl = $notification->data['action_url'] ?? null;
                if ($actionUrl) {
                    if ($actionUrl === '/cashflow-manual') {
                        $actionUrl = '/cashflow/' . $order->id;
                    }
                    return redirect($actionUrl);
                }
                return redirect()->route('order.show', $order->id)
                    ->with('info', 'Menampilkan detail order.');
        }
    }
}
