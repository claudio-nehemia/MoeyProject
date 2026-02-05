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

    /**
     * Handle survey request notification
     * CREATES RECORD with response info
     */
    private function handleSurveyRequest($order)
    {
        $survey = $order->surveyResults;
        if ($survey) {
            if (!$survey->response_time) {
                $survey->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            }
        } else {
            SurveyResults::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey')
            ->where(function ($q) {
                $q->where('is_marketing', false)->orWhereNull('is_marketing');
            })
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } else if ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('survey-results.index')
            ->with('success', 'Response recorded. You can now create the survey.');
    }

    /**
     * Handle moodboard request notification
     * CREATES RECORD with response info
     */
    private function handleMoodboardRequest($order)
    {
        // Check if moodboard already exists
        if ($order->moodboard) {
            if (!$order->moodboard->response_time) {
                $order->moodboard->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            }
            return redirect()->route('moodboard.index', $order->moodboard->id);
        }

        // Create empty moodboard with response info
        Moodboard::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update([
            'tahapan_proyek' => 'moodboard',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'moodboard')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('moodboard.index')
            ->with('success', 'Response recorded. You can now create the moodboard.');
    }

    /**
     * Handle estimasi request notification
     * CREATES RECORD with response info
     */
    private function handleEstimasiRequest($order)
    {
        // Check if estimasi already exists
        if ($order->estimasi) {
            if (!$order->estimasi->response_time) {
                $order->estimasi->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $estimasi = Estimasi::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'estimasi')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('estimasi.index')
            ->with('success', 'Response recorded. You can now create the estimasi.');
    }

    /**
     * Handle design approval notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleDesignApproval($order)
    {
        return redirect()->route('moodboard.index')
            ->with('info', 'Silakan cek desain untuk approval di Moodboard.');
    }

    /**
     * Handle commitment fee request notification
     * CREATES RECORD with response info
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
            if (!$order->moodboard->commitmentFee->response_time) {
                $order->moodboard->commitmentFee->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $commitmentFee = CommitmentFee::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
                'payment_status' => 'pending',
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'cm_fee',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'cm_fee')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to commitment fee index to respond
        return redirect()->route('commitment-fee.index')
            ->with('success', 'Silakan respond dan isi commitment fee untuk project ini.');
    }

    /**
     * Handle final design request notification
     * CREATES RECORD with response info
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

        $order->moodboard->update([
            'response_final_time' => now(),
            'response_final_by' => auth()->user()->name,
        ]);

        // Update order tahapan
        $order->update([
            'tahapan_proyek' => 'desain_final',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'desain_final')
            ->where('is_marketing', false)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to moodboard index to upload final design
        return redirect()->route('desain-final.index')
            ->with('success', 'Silakan upload final design untuk project ini.');
    }

    /**
     * Handle item pekerjaan request notification
     * CREATES RECORD with response info
     */
    private function handleItemPekerjaanRequest($order)
    {
        $existingItem = $order->itemPekerjaans->first();
        if ($existingItem) {
            if (!$existingItem->response_time) {
                $existingItem->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            ItemPekerjaan::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'item_pekerjaan')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to item pekerjaan page
        return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the item pekerjaan for this order.');
    }

    /**
     * Handle RAB internal request notification
     * CREATES RECORD with response info
     */
    private function handleRabInternalRequest($order)
    {
        if (!$order->itemPekerjaans || $order->itemPekerjaans->isEmpty()) {
            return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        $existingRab = $order->itemPekerjaans->first()?->rabInternal;
        if ($existingRab) {
            if (!$existingRab->response_time) {
                $existingRab->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            RabInternal::create([
                'item_pekerjaan_id' => $order->itemPekerjaans->first()->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'rab',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'rab_internal')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to RAB Internal page
        return redirect()->route('rab-internal.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the RAB Internal for this order.');
    }

    /**
     * Handle kontrak request notification
     * CREATES RECORD with response info
     */
    private function handleKontrakRequest($order)
    {
        // Check if kontrak already exists
        $itemPekerjaan = $order->itemPekerjaans->first();
        if (!$itemPekerjaan) {
            return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        if ($itemPekerjaan && $itemPekerjaan->kontrak) {
            if (!$itemPekerjaan->kontrak->response_time) {
                $itemPekerjaan->kontrak->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name,
                ]);
            }
        } else {
            Kontrak::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'kontrak',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'kontrak')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->where('is_marketing', false)
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Kontrak page
        return redirect()->route('kontrak.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the Kontrak for this order.');
    }

    /**
     * Handle invoice request notification
     * CREATES RECORD with response info
     */
    private function handleInvoiceRequest($order)
    {
        $itemPekerjaan = $order->itemPekerjaans->first();
        if (!$itemPekerjaan) {
            return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        // Check if invoice already exists and has response
        $invoice = $itemPekerjaan->invoices()->first();
        if ($invoice && $invoice->response_time) {
            return redirect()->route('invoice.index', ['order_id' => $order->id])
                ->with('info', 'Invoice untuk order ini sudah di-respond.');
        }

        // Update response info if invoice exists, or it will be set when creating invoice
        if ($invoice) {
            $invoice->update([
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        } else {
            Invoice::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'invoice')
            ->where(function ($q) {
                $q->where('is_marketing', false)->orWhereNull('is_marketing');
            })
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'status' => 'menunggu_input',
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'response_at' => now(),
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'status' => 'telat',
            ]);
        }

        if (!$taskResponse) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'invoice',
                'start_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => 6,
                'extend_time' => 0,
                'status' => 'menunggu_input',
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'response_at' => now(),
            ]);
        }

        // Redirect to Invoice page
        return redirect()->route('invoice.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the Invoice for this order.');
    }

    /**
     * Handle survey schedule request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleSurveyScheduleRequest($order)
    {
        // Check if already responded
        if ($order->survey_response_time) {
            return redirect()->route('survey-schedule.index')
                ->with('info', 'Survey schedule sudah di-response sebelumnya.');
        }

        // Update order with response info
        $order->update([
            'survey_response_time' => now(),
            'survey_response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_schedule')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Survey Schedule page to fill details
        return redirect()->route('survey-schedule.index')
            ->with('success', 'Response recorded. Silakan jadwalkan survey untuk project ini.');
    }


    /**
     * Handle survey ulang request notification
     * CREATES RECORD with response info (like moodboard)
     */
    private function handleSurveyUlangRequest($order)
    {
        // Check if survey ulang already exists
        if ($order->surveyUlang) {
            if (!$order->surveyUlang->response_time) {
                $order->surveyUlang->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            }
        } else {
            SurveyUlang::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
            ]);
        }

        $order->update(['tahapan_proyek' => 'survey_ulang']);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_ulang')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to create page to fill in details
        return redirect()->route('survey-ulang.create', $order->id)
            ->with('success', 'Response recorded. Silakan isi detail survey ulang.');
    }

    /**
     * Handle gambar kerja request notification
     * CREATES RECORD with response info
     */
    private function handleGambarKerjaRequest($order)
    {
        // Check if gambar kerja already exists
        if (!$order->gambarKerja) {
            return redirect()->route('gambar-kerja.index')
                ->with('error', 'Gambar Kerja belum dibuat. Silakan lengkapi survey ulang terlebih dahulu.');
        }

        // Check if already responded
        if ($order->gambarKerja->response_time) {
            return redirect()->route('gambar-kerja.index')
                ->with('info', 'Gambar Kerja sudah di-response sebelumnya.');
        }

        // Update existing gambar kerja with response info (tidak create baru)
        $order->gambarKerja->update([
            'response_time' => now(),
            'response_by' => auth()->user()->name,
            'status' => 'pending',
        ]);

        $order->update([
            'tahapan_proyek' => 'gambar_kerja',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'gambar_kerja')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(8), // Tambah 3 hari (total 8 hari)
                'duration' => 8,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Gambar Kerja page
        return redirect()->route('gambar-kerja.index', ['order_id' => $order->id])
            ->with('success', 'Response berhasil. Silakan upload gambar kerja.');
    }

    /**
     * Handle approval material request notification
     * CREATES RECORD with response info
     */
    private function handleApprovalMaterialRequest($order)
    {
        // Redirect to Approval Material page
        if (!$order->itemPekerjaans || $order->itemPekerjaans->isEmpty()) {
            return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        $itemPekerjaan = $order->itemPekerjaans->first();
        
        // Check if already responded
        if ($itemPekerjaan->approval_rab_response_by) {
            return redirect()->route('approval-material.index')
                ->with('info', 'Approval material sudah pernah direspon.');
        }

        // Update response record
        $itemPekerjaan->update([
            'approval_rab_response_time' => now(),
            'approval_rab_response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'approval_material')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('approval-material.index')
            ->with('success', 'Response berhasil dicatat. Silakan kelola approval material.');
    }
    /**
     * Handle workplan request notification
     * Logic: If workplan not exist -> create new with response info
     *        If workplan exist -> update response_time & response_by only
     */
    private function handleWorkplanRequest($order)
    {
        // Check if workplan exists and already responded
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        // If workplan already exists and responded
        if ($workplanItems->isNotEmpty() && WorkplanItem::hasAnyResponded($workplanItems)) {
            return redirect()->route('workplan.index')
                ->with('info', 'Permintaan workplan sudah diterima sebelumnya.');
        }

        DB::transaction(function () use ($order, $workplanItems) {
            if ($workplanItems->isEmpty()) {
                // CREATE new workplan items with response tracking
                foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                    foreach ($itemPekerjaan->produks as $produk) {
                        // Create empty workplan items based on default breakdown
                        $defaultBreakdown = WorkplanItemController::defaultBreakdown();
                        foreach ($defaultBreakdown as $index => $stage) {
                            WorkplanItem::create([
                                'item_pekerjaan_produk_id' => $produk->id,
                                'nama_tahapan' => $stage['nama_tahapan'],
                                'start_date' => null,
                                'end_date' => null,
                                'duration_days' => null,
                                'urutan' => $index + 1,
                                'status' => 'planned',
                                'catatan' => null,
                                'response_time' => now(),
                                'response_by' => auth()->user()->name ?? 'System',
                            ]);
                        }
                    }
                }
            } else {
                // UPDATE existing workplan items - only response_time & response_by
                foreach ($workplanItems as $item) {
                    $item->update([
                        'response_time' => now(),
                        'response_by' => auth()->user()->name ?? 'System',
                    ]);
                }
            }
        });

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'workplan')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Standard 6 hari untuk workplan
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('workplan.index')
            ->with('success', 'Permintaan workplan berhasil diterima. Silakan lengkapi detail workplan.');
    }

    /**
     * Handle project management request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleProjectManagementRequest($order)
    {
        // Redirect to Project Management page
        return redirect()->route('project-management.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the Project Management for this order.');
    }

    /**
     * Authorization: any Kepala Marketing assigned to the order can respond marketing.
     */
    private function ensureOriginalKepalaMarketing(Order $order)
    {
        $user = auth()->user();
        if (!$user || !$user->role || $user->role->nama_role !== 'Kepala Marketing') {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing can perform marketing response.');
        }

        $isAssignedKepalaMarketing = $order->users()
            ->whereHas('role', fn($q) => $q->where('nama_role', 'Kepala Marketing'))
            ->where('users.id', $user->id)
            ->exists();

        if (!$isAssignedKepalaMarketing) {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing assigned to this order can respond.');
        }

        return null;
    }

    private function markMarketingTaskResponseDone(Order $order, string $tahap): void
    {
        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', $tahap)
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->id(),
            ]);
        }
    }

    /**
     * Handle marketing response based on notification type.
     */
    private function handleMarketingResponse(Notification $notification, Order $order)
    {
        switch ($notification->type) {
            case Notification::TYPE_SURVEY_REQUEST: {
                $survey = $order->surveyResults;
                if (!$survey) {
                    $survey = SurveyResults::create([
                        'order_id' => $order->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                        'is_draft' => true,
                    ]);
                } else {
                    $survey->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'survey');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey).');
            }

            case Notification::TYPE_SURVEY_SCHEDULE_REQUEST: {
                $order->update([
                    'pm_survey_response_time' => now(),
                    'pm_survey_response_by' => auth()->user()->name ?? 'Admin',
                ]);

                // Marketing task for early stage uses tahap 'survey'
                $this->markMarketingTaskResponseDone($order, 'survey_schedule');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey Schedule).');
            }

            case Notification::TYPE_FINAL_DESIGN_REQUEST: {
                // No record creation, just mark task as done
                $order->moodboard->update([
                    'pm_response_final_time' => now(),
                    'pm_response_final_by' => auth()->user()->name ?? 'Admin',
                ]);
                $this->markMarketingTaskResponseDone($order, 'desain_final');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Design Approval).');
            }

            case Notification::TYPE_MOODBOARD_REQUEST: {
                $moodboard = $order->moodboard;
                if (!$moodboard) {
                    $moodboard = Moodboard::create([
                        'order_id' => $order->id,
                        'status' => 'pending',
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $moodboard->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'moodboard');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Moodboard).');
            }

            case Notification::TYPE_ESTIMASI_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                // Create placeholder estimasi if not exists.
                $estimasi = $order->estimasi;
                if (!$estimasi) {
                    Estimasi::create([
                        'moodboard_id' => $order->moodboard->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $estimasi->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'estimasi');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Estimasi).');
            }

            case Notification::TYPE_COMMITMENT_FEE_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                $commitmentFee = $order->moodboard->commitmentFee;
                if (!$commitmentFee) {
                    CommitmentFee::create([
                        'moodboard_id' => $order->moodboard->id,
                        'payment_status' => 'pending',
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $commitmentFee->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'cm_fee');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Commitment Fee).');
            }

            case Notification::TYPE_SURVEY_ULANG_REQUEST: {
                $surveyUlang = $order->surveyUlang;
                if (!$surveyUlang) {
                    SurveyUlang::create([
                        'order_id' => $order->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $surveyUlang->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'survey_ulang');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Survey Ulang).');
            }

            case Notification::TYPE_GAMBAR_KERJA_REQUEST: {
                $gambarKerja = $order->gambarKerja;
                if ($gambarKerja) {
                    $gambarKerja->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'gambar_kerja');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Gambar Kerja).');
            }

            case Notification::TYPE_ITEM_PEKERJAAN_REQUEST: {
                if (!$order->moodboard) {
                    return redirect()->route('notifications.index')->with('error', 'Moodboard belum ada untuk order ini.');
                }

                $existingItem = $order->itemPekerjaans->first();
                if (!$existingItem) {
                    ItemPekerjaan::create([
                        'moodboard_id' => $order->moodboard->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    $existingItem->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'item_pekerjaan');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Item Pekerjaan).');
            }

            case Notification::TYPE_RAB_INTERNAL_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    if ($itemPekerjaan->rabInternal) {
                        $itemPekerjaan->rabInternal->update([
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    } else {
                        RabInternal::create([
                            'item_pekerjaan_id' => $itemPekerjaan->id,
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    }
                }

                $taskResponse = TaskResponse::where('order_id', $order->id)
                    ->where('tahap', 'rab_internal')
                    ->where('is_marketing', true)
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if (!$taskResponse) {
                    $taskResponse = TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'rab_internal',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }

                $taskResponse->update([
                    'response_time' => now(),
                    'status' => 'selesai',
                    'user_id' => auth()->id(),
                ]);

                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (RAB Internal).');
            }

            case Notification::TYPE_INVOICE_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    $invoice = $itemPekerjaan->invoices?->sortBy('termin_step')->first();
                    if ($invoice) {
                        $invoice->update([
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    } else {
                        Invoice::create([
                            'item_pekerjaan_id' => $itemPekerjaan->id,
                            'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
                            'pm_response_time' => now(),
                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    }
                }

                $taskResponse = TaskResponse::where('order_id', $order->id)
                    ->where('tahap', 'invoice')
                    ->where('is_marketing', true)
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if (!$taskResponse) {
                    $taskResponse = TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'invoice',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }

                $taskResponse->update([
                    'response_time' => now(),
                    'status' => 'selesai',
                    'user_id' => auth()->id(),
                ]);

                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Invoice).');
            }

            case Notification::TYPE_KONTRAK_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if (!$itemPekerjaan) {
                    return redirect()->route('notifications.index')->with('error', 'Item pekerjaan belum ada untuk order ini.');
                }

                if ($itemPekerjaan->kontrak) {
                    $itemPekerjaan->kontrak->update([
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                } else {
                    Kontrak::create([
                        'item_pekerjaan_id' => $itemPekerjaan->id,
                        'pm_response_time' => now(),
                        'pm_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'kontrak');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Kontrak).');
            }

            case Notification::TYPE_WORKPLAN_REQUEST: {
                if ($order->moodboard) {
                    $workplanItems = $order->moodboard
                        ->itemPekerjaans
                        ->flatMap(fn($ip) => $ip->produks)
                        ->flatMap(fn($produk) => $produk->workplanItems);

                    DB::transaction(function () use ($order, $workplanItems) {
                        if ($workplanItems->isEmpty()) {
                            // CREATE new workplan items with PM response tracking
                            foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                                foreach ($itemPekerjaan->produks as $produk) {
                                    // Create empty workplan items based on default breakdown
                                    $defaultBreakdown = WorkplanItemController::defaultBreakdown();
                                    foreach ($defaultBreakdown as $index => $stage) {
                                        WorkplanItem::create([
                                            'item_pekerjaan_produk_id' => $produk->id,
                                            'nama_tahapan' => $stage['nama_tahapan'],
                                            'start_date' => null,
                                            'end_date' => null,
                                            'duration_days' => null,
                                            'urutan' => $index + 1,
                                            'status' => 'planned',
                                            'catatan' => null,
                                            'pm_response_time' => now(),
                                            'pm_response_by' => auth()->user()->name ?? 'Admin',
                                        ]);
                                    }
                                }
                            }
                        } else {
                            // UPDATE existing workplan items - only pm_response_time & pm_response_by
                            foreach ($workplanItems as $item) {
                                $item->update([
                                    'pm_response_time' => now(),
                                    'pm_response_by' => auth()->user()->name ?? 'Admin',
                                ]);
                            }
                        }
                    });
                }

                $this->markMarketingTaskResponseDone($order, 'workplan');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Workplan).');
            }

            case Notification::TYPE_APPROVAL_MATERIAL_REQUEST: {
                $itemPekerjaan = $order->itemPekerjaans->first();
                if ($itemPekerjaan) {
                    $itemPekerjaan->update([
                        'pm_approval_rab_response_time' => now(),
                        'pm_approval_rab_response_by' => auth()->user()->name ?? 'Admin',
                    ]);
                }

                $this->markMarketingTaskResponseDone($order, 'approval_material');
                return redirect()->route('notifications.index')->with('success', 'Marketing response berhasil dicatat (Approval Material).');
            }

            default:
                return redirect()->route('notifications.index')
                    ->with('error', 'Notification type tidak mendukung marketing response.');
        }
    }
}