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
            ->with([
                'order.surveyResults',
                'order.surveyUlang',
                'order.surveyUsers', // TAMBAH INI untuk Survey Schedule
                'order.estimasi', // TAMBAH INI untuk direct estimasi access
                'order.moodboard.commitmentFee',
                'order.moodboard.estimasi',
                'order.moodboard.itemPekerjaans.produks.workplanItems',
                'order.itemPekerjaans', // Load item pekerjaan for approval_rab response
                'order.itemPekerjaans.rabInternal',
                'order.itemPekerjaans.kontrak',
                'order.itemPekerjaans.invoices',
                'order.gambarKerja',
                'order.users.role',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Add flag for frontend: any Kepala Marketing assigned to the order can do marketing response
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
    public function destroy($id)
    {
        $this->notificationService->deleteNotification($id, auth()->id());

        return redirect()->back()->with('success', 'Notification deleted successfully.');
    }

    /**
     * Handle notification response based on type
     */
    public function handleResponse(Request $request, $id)
    {
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
                return $this->handleMeetingVendorRequest($order);

            case Notification::TYPE_APPROVAL_MATERIAL_REQUEST:
                return $this->handleApprovalMaterialRequest($order);

            case Notification::TYPE_WORKPLAN_REQUEST:
                return $this->handleWorkplanRequest($order);

            case Notification::TYPE_PROJECT_MANAGEMENT_REQUEST:
                return $this->handleProjectManagementRequest($order);

            default:
                return redirect()->route('notifications.index')
                    ->with('error', 'Unknown notification type.');
        }
    }

}
