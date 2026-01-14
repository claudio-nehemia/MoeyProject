<?php

namespace App\Http\Controllers\Api;

use App\Models\Kontrak;
use App\Models\Estimasi;
use App\Models\Moodboard;
use App\Models\GambarKerja;
use App\Models\RabInternal;
use App\Models\SurveyUlang;
use App\Models\Notification;
use App\Models\WorkplanItem;
use Illuminate\Http\Request;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\SurveyResults;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use App\Http\Controllers\WorkplanItemController;

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
                'order.surveyUlang',
                'order.moodboard.commitmentFee',
                'order.moodboard.estimasi',
                'order.moodboard.itemPekerjaans.produks.workplanItems',
                'order.itemPekerjaans.rabInternal',
                'order.itemPekerjaans.kontrak',
                'order.itemPekerjaans.produks.workplanItems',
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

        // 🔥 DEBUG: Log workplan data for workplan_request notifications
        foreach ($notifications->items() as $notif) {
            if ($notif->type === Notification::TYPE_WORKPLAN_REQUEST && $notif->order) {
                \Log::info('=== WORKPLAN NOTIFICATION DEBUG ===');
                \Log::info('Notification ID: ' . $notif->id);
                \Log::info('Order ID: ' . $notif->order->id);
                
                if ($notif->order->moodboard) {
                    \Log::info('Has Moodboard: YES');
                    \Log::info('Moodboard ItemPekerjaans count: ' . $notif->order->moodboard->itemPekerjaans->count());
                    
                    foreach ($notif->order->moodboard->itemPekerjaans as $ip) {
                        \Log::info('  ItemPekerjaan ID: ' . $ip->id);
                        \Log::info('  Produks count: ' . $ip->produks->count());
                        
                        foreach ($ip->produks as $produk) {
                            \Log::info('    Produk ID: ' . $produk->id);
                            \Log::info('    Workplan Items count: ' . $produk->workplanItems->count());
                            
                            if ($produk->workplanItems->count() > 0) {
                                $firstWorkplan = $produk->workplanItems->first();
                                \Log::info('    First Workplan response_time: ' . $firstWorkplan->response_time);
                                \Log::info('    First Workplan response_by: ' . $firstWorkplan->response_by);
                            }
                        }
                    }
                } else {
                    \Log::info('Has Moodboard: NO');
                }
                
                \Log::info('=== END DEBUG ===');
            }
        }

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
        // Check if survey ulang already exists
        if ($order->surveyUlang) {
            return [
                'success' => true,
                'message' => 'Survey ulang already exists',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        // Create empty survey ulang record with response info
        // User will fill in details (catatan, foto, temuan) later via store
        \App\Models\SurveyUlang::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update(['tahapan_proyek' => 'survey_ulang']);

        return [
            'success' => true,
            'message' => 'Response recorded. Survey ulang can now be created.',
            'action' => 'create',
            'data' => ['order_id' => $order->id],
        ];
    }

    private function handleGambarKerjaRequest($order)
    {
        // Check if gambar kerja exists
        if (!$order->gambarKerja) {
            return [
                'success' => false,
                'message' => 'Gambar Kerja belum dibuat. Silakan lengkapi survey ulang terlebih dahulu.',
            ];
        }

        // Check if already responded
        if ($order->gambarKerja->response_time) {
            return [
                'success' => true,
                'message' => 'Gambar Kerja sudah di-response sebelumnya',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        // Update existing gambar kerja with response info (tidak create baru)
        $order->gambarKerja->update([
            'response_time' => now(),
            'response_by' => auth()->user()->name,
            'status' => 'pending',
        ]);

        $order->update(['tahapan_proyek' => 'gambar_kerja']);

        return [
            'success' => true,
            'message' => 'Response berhasil. Silakan upload gambar kerja.',
            'action' => 'view',
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
        // Check if workplan exists
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        // If workplan exists and already responded
        if ($workplanItems->isNotEmpty() && WorkplanItem::hasAnyResponded($workplanItems)) {
            return [
                'success' => true,
                'message' => 'Workplan request already acknowledged',
                'action' => 'view',
                'data' => ['order_id' => $order->id],
            ];
        }

        // CREATE empty workplan items with response tracking
        DB::beginTransaction();
        try {
            foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                foreach ($itemPekerjaan->produks as $produk) {
                    // Skip if already has workplan items
                    if ($produk->workplanItems->count() > 0) {
                        continue;
                    }

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
                            'response_by' => auth()->user()->name ?? 'Admin',
                        ]);
                    }
                }
            }
            
            DB::commit();

            return [
                'success' => true,
                'message' => 'Workplan request acknowledged. Please fill in workplan details via web.',
                'action' => 'create',
                'data' => ['order_id' => $order->id],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
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

    /**
     * Handle PM Response for notification
     */
    public function handlePmResponse($notificationId)
    {
        try {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', auth()->id())
                ->with([
                    'order.moodboard',
                    'order.surveyUlang',
                    'order.gambarKerja',
                    'order.surveyResults',
                    'order.moodboard.itemPekerjaans.produks.workplanItems',
                    'order.itemPekerjaans.kontrak'
                ])
                ->firstOrFail();

            // Check if user is Project Manager
            $user = auth()->user()->load('role');
            if (!$user->role || $user->role->nama_role !== 'Project Manager') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Project Manager can perform PM response.',
                ], 403);
            }

            $order = $notification->order;
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found for this notification.',
                ], 404);
            }

            // Mark notification as read
            $this->notificationService->markAsRead($notificationId, auth()->id());

            // Handle PM response based on notification type
            $result = $this->processPmResponse($notification->type, $order);

            return response()->json($result);

        } catch (\Exception $e) {
            \Log::error('PM Response error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process PM response: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function processPmResponse($type, $order)
    {
        $pmName = auth()->user()->name;
        $pmTime = now();

        \Log::info("Processing PM Response - Type: {$type}, Order ID: {$order->id}");

        switch ($type) {
            case Notification::TYPE_MOODBOARD_REQUEST:
            case Notification::TYPE_ESTIMASI_REQUEST:
            case Notification::TYPE_COMMITMENT_FEE_REQUEST:
            case Notification::TYPE_FINAL_DESIGN_REQUEST:
            case Notification::TYPE_ITEM_PEKERJAAN_REQUEST:
                \Log::info("Checking moodboard: " . ($order->moodboard ? 'exists' : 'not found'));
                
                // Create or update moodboard (PM response only)
                if (!$order->moodboard) {
                    \Log::info("Creating new moodboard with PM response ONLY");
                    \App\Models\Moodboard::create([
                        'order_id' => $order->id,
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                        // DON'T set response_time or response_by - that's for staff!
                    ]);
                } else {
                    \Log::info("Updating existing moodboard with PM response");
                    $order->moodboard->update([
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                    ]);
                }
                
                return [
                    'success' => true,
                    'message' => 'PM Response recorded successfully. Staff can now work on moodboard.',
                ];
                break;

            case Notification::TYPE_SURVEY_ULANG_REQUEST:
                \Log::info("Checking surveyUlang: " . ($order->surveyUlang ? 'exists' : 'not found'));
                
                // Create or update surveyUlang (PM response only)
                if (!$order->surveyUlang) {
                    \Log::info("Creating new surveyUlang with PM response ONLY");
                    \App\Models\SurveyUlang::create([
                        'order_id' => $order->id,
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                        // DON'T set response_time or response_by - that's for staff!
                    ]);
                } else {
                    \Log::info("Updating existing surveyUlang with PM response");
                    $order->surveyUlang->update([
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                    ]);
                }
                
                return [
                    'success' => true,
                    'message' => 'PM Response recorded successfully. Staff can now complete survey ulang.',
                ];
                break;

            case Notification::TYPE_GAMBAR_KERJA_REQUEST:
                \Log::info("Checking gambarKerja: " . ($order->gambarKerja ? 'exists' : 'not found'));
                
                // Create or update gambarKerja (PM response only)
                if (!$order->gambarKerja) {
                    \Log::info("Creating new gambarKerja with PM response ONLY");
                    \App\Models\GambarKerja::create([
                        'order_id' => $order->id,
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                        'status' => 'pending',
                        // DON'T set response_time or response_by - that's for staff!
                    ]);
                } else {
                    \Log::info("Updating existing gambarKerja with PM response");
                    $order->gambarKerja->update([
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                    ]);
                }
                
                return [
                    'success' => true,
                    'message' => 'PM Response recorded successfully. Staff can now upload gambar kerja.',
                ];
                break;

            case Notification::TYPE_WORKPLAN_REQUEST:
                \Log::info("Checking workplan - has moodboard: " . ($order->moodboard ? 'yes' : 'no'));
                if ($order->moodboard && $order->moodboard->itemPekerjaans) {
                    $workplanItems = $order->moodboard->itemPekerjaans
                        ->flatMap(fn($ip) => $ip->produks ?? collect())
                        ->flatMap(fn($produk) => $produk->workplanItems ?? collect());

                    \Log::info("Workplan items count: " . $workplanItems->count());
                    
                    if ($workplanItems->count() > 0) {
                        foreach ($workplanItems as $item) {
                            $item->update([
                                'pm_response_time' => $pmTime,
                                'pm_response_by' => $pmName,
                            ]);
                        }
                        return [
                            'success' => true,
                            'message' => 'PM Response recorded successfully for Workplan.',
                        ];
                    }
                }
                break;

            case Notification::TYPE_KONTRAK_REQUEST:
                \Log::info("Checking kontrak");
                if ($order->itemPekerjaans && $order->itemPekerjaans->isNotEmpty()) {
                    $kontrak = $order->itemPekerjaans->first()?->kontrak;
                    \Log::info("Kontrak: " . ($kontrak ? 'exists' : 'not found'));
                    if ($kontrak) {
                        $kontrak->update([
                            'pm_response_time' => $pmTime,
                            'pm_response_by' => $pmName,
                        ]);
                        return [
                            'success' => true,
                            'message' => 'PM Response recorded successfully for Kontrak.',
                        ];
                    }
                }
                break;

            case Notification::TYPE_SURVEY_REQUEST:
                \Log::info("Checking surveyResults: " . ($order->surveyResults ? 'exists' : 'not found'));
                
                // Create or update surveyResults (PM response only, don't touch staff response)
                if (!$order->surveyResults) {
                    \Log::info("Creating new surveyResults with PM response ONLY");
                    \App\Models\SurveyResults::create([
                        'order_id' => $order->id,
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                        // DON'T set response_time or response_by - that's for staff!
                    ]);
                } else {
                    \Log::info("Updating existing surveyResults with PM response");
                    $order->surveyResults->update([
                        'pm_response_time' => $pmTime,
                        'pm_response_by' => $pmName,
                    ]);
                }
                
                return [
                    'success' => true,
                    'message' => 'PM Response recorded successfully. Staff can now complete the survey.',
                ];
                break;
        }

        \Log::warning("PM Response failed - No related record found for type: {$type}");
        return [
            'success' => false,
            'message' => 'Unable to record PM response. Related record not found.',
        ];
    }
}