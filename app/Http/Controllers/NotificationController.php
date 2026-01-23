<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Kontrak;
use App\Models\Estimasi;
use App\Models\GambarKerja;
use App\Models\RabInternal;
use App\Models\Notification;
use Illuminate\Http\Request;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
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
            ->with([
                'order.surveyResults',
                'order.surveyUlang',
                'order.surveyUsers', // TAMBAH INI untuk Survey Schedule
                'order.moodboard.commitmentFee',
                'order.moodboard.estimasi',
                'order.moodboard.itemPekerjaans.produks.workplanItems',
                'order.itemPekerjaans.rabInternal',
                'order.itemPekerjaans.kontrak',
                'order.gambarKerja',
            ])
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
     * CREATES RECORD with response info
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
     * CREATES RECORD with response info
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
     * DIRECT REDIRECT - No record creation
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
            return redirect()->route('commitment-fee.index')
                ->with('info', 'Commitment fee sudah ada untuk project ini.');
        }

        $commitmentFee = CommitmentFee::create([
            'moodboard_id' => $order->moodboard->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
            'payment_status' => 'pending',
        ]);

        $order->update([
            'tahapan_proyek' => 'cm_fee',
        ]);

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

        // Redirect to moodboard index to upload final design
        return redirect()->route('moodboard.index')
            ->with('success', 'Silakan upload final design untuk project ini.');
    }

    /**
     * Handle item pekerjaan request notification
     * CREATES RECORD with response info
     */
    private function handleItemPekerjaanRequest($order)
    {
        $itemPekerjaan = ItemPekerjaan::create([
            'moodboard_id' => $order->moodboard->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
        ]);

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
        $rabInternal = RabInternal::create([
            'item_pekerjaan_id' => $order->itemPekerjaans->first()->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
        ]);

        $order->update([
            'tahapan_proyek' => 'rab',
        ]);

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
        if ($itemPekerjaan && $itemPekerjaan->kontrak) {
            return redirect()->route('kontrak.index')
                ->with('info', 'Kontrak sudah ada untuk project ini.');
        }

        Kontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name,
        ]);

        $order->update([
            'tahapan_proyek' => 'kontrak',
        ]);

        // Redirect to Kontrak page
        return redirect()->route('kontrak.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the Kontrak for this order.');
    }

    /**
     * Handle invoice request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleInvoiceRequest($order)
    {
        // Redirect to Invoice page
        return redirect()->route('invoice.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the Invoice for this order.');
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
            return redirect()->route('survey-ulang.index', ['order_id' => $order->id])
                ->with('info', 'Survey ulang sudah ada untuk project ini.');
        }

        // Create empty survey ulang record with response info
        // User will fill in details (catatan, foto, temuan) later
        \App\Models\SurveyUlang::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update(['tahapan_proyek' => 'survey_ulang']);

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

        // Redirect to Gambar Kerja page
        return redirect()->route('gambar-kerja.index', ['order_id' => $order->id])
            ->with('success', 'Response berhasil. Silakan upload gambar kerja.');
    }

    /**
     * Handle approval material request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleApprovalMaterialRequest($order)
    {
        // Redirect to Approval Material page
        return redirect()->route('approval-material.index', ['order_id' => $order->id])
            ->with('info', 'Please manage the Approval Material for this order.');
    }

    /**
     * Handle workplan request notification
     * Workplan created during store, response acknowledges the request
     */
    private function handleWorkplanRequest($order)
    {
        // Check if workplan exists and already responded
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        // If workplan already exists and responded
        if ($workplanItems->isNotEmpty() && \App\Models\WorkplanItem::hasAnyResponded($workplanItems)) {
            return redirect()->route('workplan.index')
                ->with('info', 'Permintaan workplan sudah diterima sebelumnya.');
        }

        // CREATE empty workplan items with response tracking
        // This marks the response and prepares the structure for filling
        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                foreach ($itemPekerjaan->produks as $produk) {
                    // Skip if already has workplan items
                    if ($produk->workplanItems->count() > 0) {
                        continue;
                    }

                    // Create empty workplan items based on default breakdown
                    $defaultBreakdown = \App\Http\Controllers\WorkplanItemController::defaultBreakdown();
                    foreach ($defaultBreakdown as $index => $stage) {
                        \App\Models\WorkplanItem::create([
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
        });

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
}