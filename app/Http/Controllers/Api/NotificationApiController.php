<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Estimasi;
use App\Models\GambarKerja;
use App\Models\RabInternal;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\Kontrak;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationApiController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $filter = $request->get('filter', 'all'); // all, unread, read

        $query = Notification::where('user_id', auth()->id())
            ->with([
                'order.surveyResults',
                'order.moodboard.commitmentFee',
                'order.moodboard.estimasi',
                'order.itemPekerjaans.rabInternal',
                'order.itemPekerjaans.kontrak',
                'order.gambarKerja',
            ])
            ->orderBy('created_at', 'desc');

        // Apply filter
        if ($filter === 'unread') {
            $query->where('is_read', false);
        } elseif ($filter === 'read') {
            $query->where('is_read', true);
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        $count = $this->notificationService->getUnreadCount(auth()->id());

        return response()->json([
            'success' => true,
            'count' => $count,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        try {
            $this->notificationService->markAsRead($id, auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $this->notificationService->markAllAsRead(auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Handle notification response
     */
    public function handleResponse($id)
    {
        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', auth()->id())
                ->with([
                    'order.surveyResults',
                    'order.moodboard.commitmentFee',
                    'order.moodboard.estimasi',
                    'order.itemPekerjaans.rabInternal',
                    'order.itemPekerjaans.kontrak',
                    'order.gambarKerja',
                ])
                ->firstOrFail();

            // Mark as read
            $this->notificationService->markAsRead($id, auth()->id());

            $order = $notification->order;

            // Handle different notification types
            switch ($notification->type) {
                case Notification::TYPE_SURVEY_REQUEST:
                    $result = $this->handleSurveyRequest($order);
                    break;
                
                case Notification::TYPE_MOODBOARD_REQUEST:
                    $result = $this->handleMoodboardRequest($order);
                    break;
                
                case Notification::TYPE_ESTIMASI_REQUEST:
                    $result = $this->handleEstimasiRequest($order);
                    break;
                
                case Notification::TYPE_DESIGN_APPROVAL:
                    $result = $this->handleDesignApproval($order);
                    break;
                
                case Notification::TYPE_COMMITMENT_FEE_REQUEST:
                    $result = $this->handleCommitmentFeeRequest($order);
                    break;
                
                case Notification::TYPE_FINAL_DESIGN_REQUEST:
                    $result = $this->handleFinalDesignRequest($order);
                    break;

                case Notification::TYPE_ITEM_PEKERJAAN_REQUEST:
                    $result = $this->handleItemPekerjaanRequest($order);
                    break;

                case Notification::TYPE_RAB_INTERNAL_REQUEST:
                    $result = $this->handleRabInternalRequest($order);
                    break;

                case Notification::TYPE_KONTRAK_REQUEST:
                    $result = $this->handleKontrakRequest($order);
                    break;

                case Notification::TYPE_INVOICE_REQUEST:
                    $result = $this->handleInvoiceRequest($order);
                    break;

                case Notification::TYPE_SURVEY_SCHEDULE_REQUEST:
                    $result = $this->handleSurveyScheduleRequest($order);
                    break;

                case Notification::TYPE_SURVEY_ULANG_REQUEST:
                    $result = $this->handleSurveyUlangRequest($order);
                    break;

                case Notification::TYPE_GAMBAR_KERJA_REQUEST:
                    $result = $this->handleGambarKerjaRequest($order);
                    break;

                case Notification::TYPE_APPROVAL_MATERIAL_REQUEST:
                    $result = $this->handleApprovalMaterialRequest($order);
                    break;
                
                case Notification::TYPE_WORKPLAN_REQUEST:
                    $result = $this->handleWorkplanRequest($order);
                    break;

                case Notification::TYPE_PROJECT_MANAGEMENT_REQUEST:
                    $result = $this->handleProjectManagementRequest($order);
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unknown notification type',
                    ], 400);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Handler methods
    private function handleSurveyRequest($order)
    {
        if ($order->surveyResults) {
            return [
                'success' => true,
                'message' => 'Survey already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        \App\Models\SurveyResults::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update([
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        return [
            'success' => true,
            'message' => 'Response recorded. Survey can now be created.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleMoodboardRequest($order)
    {
        if ($order->moodboard) {
            return [
                'success' => true,
                'message' => 'Moodboard already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        \App\Models\Moodboard::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update(['tahapan_proyek' => 'moodboard']);

        return [
            'success' => true,
            'message' => 'Response recorded. Moodboard can now be created.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleEstimasiRequest($order)
    {
        if ($order->estimasi) {
            return [
                'success' => true,
                'message' => 'Estimasi already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        if (!$order->moodboard) {
            return [
                'success' => false,
                'message' => 'Moodboard not found for this order',
            ];
        }

        Estimasi::create([
            'moodboard_id' => $order->moodboard->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
        ]);

        $order->update(['tahapan_proyek' => 'estimasi']);

        return [
            'success' => true,
            'message' => 'Response recorded. Estimasi can now be created.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleDesignApproval($order)
    {
        return [
            'success' => true,
            'message' => 'Check the design for approval',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleCommitmentFeeRequest($order)
    {
        if (!$order->moodboard) {
            return [
                'success' => false,
                'message' => 'Moodboard not found for this order',
            ];
        }

        if ($order->moodboard->commitmentFee) {
            return [
                'success' => true,
                'message' => 'Commitment fee already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        CommitmentFee::create([
            'moodboard_id' => $order->moodboard->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
            'payment_status' => 'pending',
        ]);

        $order->update(['tahapan_proyek' => 'cm_fee']);

        return [
            'success' => true,
            'message' => 'Response recorded. Please create commitment fee.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleFinalDesignRequest($order)
    {
        if (!$order->moodboard) {
            return [
                'success' => false,
                'message' => 'Moodboard not found for this order',
            ];
        }

        if ($order->moodboard->moodboard_final || $order->moodboard->finalFiles->count() > 0) {
            return [
                'success' => true,
                'message' => 'Final design already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        $order->moodboard->update([
            'response_final_time' => now(),
            'response_final_by' => auth()->user()->name,
        ]);

        $order->update(['tahapan_proyek' => 'desain_final']);

        return [
            'success' => true,
            'message' => 'Response recorded. Please upload final design.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleItemPekerjaanRequest($order)
    {
        ItemPekerjaan::create([
            'moodboard_id' => $order->moodboard->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Response recorded. Please manage item pekerjaan.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleRabInternalRequest($order)
    {
        $itemPekerjaan = $order->itemPekerjaans->first();
        
        if (!$itemPekerjaan) {
            return [
                'success' => false,
                'message' => 'Item pekerjaan not found',
            ];
        }

        RabInternal::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'response_by' => auth()->user()->name,
            'response_time' => now(),
        ]);

        $order->update(['tahapan_proyek' => 'rab']);

        return [
            'success' => true,
            'message' => 'Response recorded. Please manage RAB Internal.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleKontrakRequest($order)
    {
        $itemPekerjaan = $order->itemPekerjaans->first();
        
        if (!$itemPekerjaan) {
            return [
                'success' => false,
                'message' => 'Item pekerjaan not found',
            ];
        }

        if ($itemPekerjaan->kontrak) {
            return [
                'success' => true,
                'message' => 'Kontrak already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        Kontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name,
        ]);

        $order->update(['tahapan_proyek' => 'kontrak']);

        return [
            'success' => true,
            'message' => 'Response recorded. Please manage Kontrak.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleInvoiceRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please manage Invoice for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleSurveyScheduleRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please schedule survey for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleSurveyUlangRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please schedule re-survey for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleGambarKerjaRequest($order)
    {
        if ($order->gambarKerja) {
            return [
                'success' => true,
                'message' => 'Gambar Kerja already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        GambarKerja::create([
            'order_id' => $order->id,
            'status' => 'pending',
            'response_time' => now(),
            'response_by' => auth()->user()->name,
        ]);

        $order->update(['tahapan_proyek' => 'gambar_kerja']);

        return [
            'success' => true,
            'message' => 'Response recorded. Please manage Gambar Kerja.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleApprovalMaterialRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please manage Approval Material for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleWorkplanRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please manage Workplan for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleProjectManagementRequest($order)
    {
        return [
            'success' => true,
            'message' => 'Please manage Project Management for this order',
            'action' => 'view',
            'data' => ['order_id' => $order->id],
        ];
    }
}