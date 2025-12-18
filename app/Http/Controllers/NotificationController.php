<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Estimasi;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class NotificationController extends Controller
{
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
        $notifications = Notification::where('user_id', auth()->id())
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

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
                return $this->handleInvoceRequest($order);

            case Notification::TYPE_SURVEY_ULANG_REQUEST:
                return $this->handleSurveyUlangRequest($order);
            
            default:
                return redirect()->route('notifications.index')
                    ->with('error', 'Unknown notification type.');
        }
    }

    /**
     * Handle survey request notification
     */
    private function handleSurveyRequest($order)
    {
        // Check if survey already exists
        if ($order->surveyResults) {
            return redirect()->route('survey-results.edit', $order->surveyResults->id);
        }

        // Create empty survey with response info
        \App\Models\SurveyResults::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update([
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        return redirect()->route('survey-results.index')
            ->with('success', 'Response recorded. You can now create the survey.');
    }

    /**
     * Handle moodboard request notification
     */
    private function handleMoodboardRequest($order)
    {
        // Check if moodboard already exists
        if ($order->moodboard) {
            return redirect()->route('moodboard.edit', $order->moodboard->id);
        }

        // Create empty moodboard with response info
        \App\Models\Moodboard::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update([
            'tahapan_proyek' => 'moodboard',
        ]);

        return redirect()->route('moodboard.index')
            ->with('success', 'Response recorded. You can now create the moodboard.');
    }

    /**
     * Handle estimasi request notification
     */
    private function handleEstimasiRequest($order)
    {
        // Check if estimasi already exists
        if ($order->estimasi) {
            return redirect()->route('estimasi.edit', $order->estimasi->id);
        }

        // Create empty estimasi with response info
        $estimasi = Estimasi::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);

        $order->update([
            'tahapan_proyek' => 'estimasi',
        ]);

        return redirect()->route('estimasi.index')
            ->with('success', 'Response recorded. You can now create the estimasi.');
    }

    /**
     * Handle design approval notification
     */
    private function handleDesignApproval($order)
    {
        // Redirect to design approval page
        if ($order->moodboard) {
            return redirect()->route('moodboard.show', $order->moodboard->id);
        }

        return redirect()->route('orders.show', $order->id)
            ->with('info', 'Check the design for approval.');
    }

    /**
     * Handle commitment fee request notification
     */
    private function handleCommitmentFeeRequest($order)
    {
        // Check if moodboard exists
        if (!$order->moodboard) {
            return redirect()->route('orders.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if commitment fee already exists
        if ($order->moodboard->commitmentFee) {
            return redirect()->route('commitment-fee.index')
                ->with('info', 'Commitment fee sudah ada untuk project ini.');
        }

        // Redirect to commitment fee index to respond
        return redirect()->route('commitment-fee.index')
            ->with('success', 'Silakan respond dan isi commitment fee untuk project ini.');
    }

    /**
     * Handle final design request notification
     */
    private function handleFinalDesignRequest($order)
    {
        // Check if moodboard exists
        if (!$order->moodboard) {
            return redirect()->route('orders.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if final design already uploaded
        if ($order->moodboard->moodboard_final || $order->moodboard->finalFiles->count() > 0) {
            return redirect()->route('moodboard.index')
                ->with('info', 'Final design sudah ada untuk project ini.');
        }

        // Redirect to moodboard index to upload final design
        return redirect()->route('moodboard.index')
            ->with('success', 'Silakan upload final design untuk project ini.');
    }

    private function handleItemPekerjaanRequest($order)
    {
        // Redirect to item pekerjaan page
        return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the item pekerjaan for this order.');
    }

    private function handleRabInternalRequest($order)
    {
        // Redirect to RAB Internal page
        return redirect()->route('rab-internal.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the RAB Internal for this order.');
    }

    private function handleKontrakRequest($order)
    {
        // Redirect to Kontrak page
        return redirect()->route('kontrak.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the Kontrak for this order.');
    }

    private function handleInvoceRequest($order)
    {
        // Redirect to Invoice page
        return redirect()->route('invoice.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the Invoice for this order.');
    }

    private function handleSurveyUlangRequest($order)
    {
        // Redirect to Survey Schedule page
        return redirect()->route('survey-ulang.index', ['order_id' => $order->id])
            ->with('info', 'Please schedule a re-survey for this order.');
    }

}
