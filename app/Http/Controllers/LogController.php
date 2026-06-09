<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\TaskResponseExtendLog;

class LogController extends Controller
{
    /**
     * Display log page dengan filter
     */

    // public function __construct()
    // {
    //     // Middleware sudah handle di routes, tapi bisa tambahkan di sini juga untuk extra security
    //     $this->middleware('permission:log.index')->only(['index']);
    //     $this->middleware('permission:log.by-user')->only(['byUser']);
    //     $this->middleware('permission:log.by-order')->only(['byOrder']);
    // }
    public function index(Request $request)
    {
        $activeTab = $request->query('tab', 'tasks');

        // Get all users untuk filter dropdown
        $users = User::with('role')->orderBy('name')->get();

        // Get all orders untuk filter dropdown
        $orders = Order::select('id', 'nama_project', 'company_name', 'customer_name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Tahap options (harus sinkron dengan CheckTaskDeadlines + task_responses)
        $tahapOptions = [
            'survey' => 'Survey',
            'moodboard' => 'Moodboard',
            'estimasi' => 'Estimasi',
            'cm_fee' => 'Commitment Fee',
            'approval_design' => 'Approval Design',
            'desain_final' => 'Desain Final',
            'item_pekerjaan' => 'Item Pekerjaan',
            'rab_internal' => 'RAB Internal',
            'kontrak' => 'Kontrak',
            'invoice' => 'Invoice',
            'survey_schedule' => 'Survey Schedule',
            'survey_ulang' => 'Survey Ulang',
            'gambar_kerja' => 'Gambar Kerja',
            'approval_material' => 'Approval Material',
            'workplan' => 'Workplan',
            'produksi' => 'Produksi',
        ];

        // Status options
        $statusOptions = [
            'menunggu_response' => 'Menunggu Response',
            'menunggu_input' => 'Menunggu Input',
            'selesai' => 'Selesai',
            'telat' => 'Telat',
            'telat_submit' => 'Telat Submit',
        ];

        $taskResponses = null;
        $pmProgress = null;

        if ($activeTab === 'pm') {
            $pmQuery = Order::with([
                'moodboard.itemPekerjaans.produks.produk',
            ])
                ->whereHas('moodboard.itemPekerjaans.produks');

            if ($request->has('order_id') && $request->order_id) {
                $pmQuery->where('id', $request->order_id);
            }

            if ($request->has('search') && $request->search) {
                $searchTerm = $request->search;
                $pmQuery->where(function($q) use ($searchTerm) {
                    $q->where('nama_project', 'like', "%{$searchTerm}%")
                      ->orWhere('company_name', 'like', "%{$searchTerm}%")
                      ->orWhere('customer_name', 'like', "%{$searchTerm}%");
                });
            }

            $ordersPaginated = $pmQuery->orderBy('created_at', 'desc')->paginate(10);
            
            $pmProgress = $ordersPaginated->through(function ($order) {
                $totalProducts = 0;
                if ($order->moodboard && $order->moodboard->itemPekerjaans) {
                    foreach ($order->moodboard->itemPekerjaans as $ip) {
                        $totalProducts += $ip->produks->count();
                    }
                }
                
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'company_name' => $order->company_name,
                    'total_products' => $totalProducts,
                ];
            });

            // Set empty taskResponses to prevent React crashes
            $taskResponses = ['data' => [], 'links' => null, 'meta' => null];
        } else {
            $query = TaskResponse::with(['order', 'user.role']);

            // Filter berdasarkan user_id
            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }

            // Filter berdasarkan order_id
            if ($request->has('order_id') && $request->order_id) {
                $query->where('order_id', $request->order_id);
            }

            // Filter berdasarkan tahap
            if ($request->has('tahap') && $request->tahap) {
                $query->where('tahap', $request->tahap);
            }

            // Filter berdasarkan status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Search berdasarkan query (nama project atau nama user)
            if ($request->has('search') && $request->search) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->whereHas('order', function($q) use ($searchTerm) {
                        $q->where('nama_project', 'like', "%{$searchTerm}%");
                    })->orWhereHas('user', function($q) use ($searchTerm) {
                        $q->where('name', 'like', "%{$searchTerm}%");
                    });
                });
            }

            // Sort by created_at desc
            $taskResponses = $query->orderBy('created_at', 'desc')->paginate(50);
            
            // Set empty pmProgress to prevent React crashes
            $pmProgress = ['data' => [], 'links' => null, 'meta' => null];
        }

        return Inertia::render('Log/Index', [
            'taskResponses' => $taskResponses,
            'pmProgress' => $pmProgress,
            'activeTab' => $activeTab,
            'users' => $users,
            'orders' => $orders,
            'tahapOptions' => $tahapOptions,
            'statusOptions' => $statusOptions,
            'filters' => [
                'user_id' => $request->user_id,
                'order_id' => $request->order_id,
                'tahap' => $request->tahap,
                'status' => $request->status,
                'search' => $request->search,
                'tab' => $activeTab,
            ],
        ]);
    }

    /**
     * Get task responses by user (untuk API atau detail view)
     */
    public function byUser($userId)
    {
        $user = User::with('role')->findOrFail($userId);

        $taskResponses = TaskResponse::with(['order', 'user.role'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'order_id' => $task->order_id,
                    'order_name' => $task->order->nama_project,
                    'customer_name' => $task->order->customer_name,
                    'tahap' => $task->tahap,
                    'status' => $task->status,
                    'start_time' => $task->start_time,
                    'response_time' => $task->response_time,
                    'update_data_time' => $task->update_data_time,
                    'deadline' => $task->deadline,
                    'duration' => $task->duration,
                    'duration_actual' => $task->duration_actual,
                    'extend_time' => $task->extend_time,
                    'is_overdue' => $task->isOverdue(),
                ];
            });

        return Inertia::render('Log/ByUser', [
            'user' => $user,
            'taskResponses' => $taskResponses,
        ]);
    }

    /**
     * Get task responses by order (untuk API atau detail view)
     */
    public function byOrder($orderId)
    {
        $order = Order::with(['users.role', 'jenisInterior'])->findOrFail($orderId);

        $taskResponses = TaskResponse::with(['user.role'])
            ->where('order_id', $orderId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'user_id' => $task->user_id,
                    'user_name' => $task->user ? $task->user->name : '-',
                    'user_role' => $task->user && $task->user->role ? $task->user->role->nama_role : '-',
                    'tahap' => $task->tahap,
                    'status' => $task->status,
                    'start_time' => $task->start_time,
                    'response_time' => $task->response_time,
                    'update_data_time' => $task->update_data_time,
                    'deadline' => $task->deadline,
                    'duration' => $task->duration,
                    'duration_actual' => $task->duration_actual,
                    'extend_time' => $task->extend_time,
                    'extend_reason' => $task->extend_reason,
                    'is_overdue' => $task->isOverdue(),
                ];
            });

        return Inertia::render('Log/ByOrder', [
            'order' => $order,
            'taskResponses' => $taskResponses,
        ]);
    }

    /**
     * Halaman log perpanjangan (extend) untuk suatu task response.
     * Diakses per baris dari halaman Log Index.
     */
    public function extendLog($taskResponseId)
    {
        $taskResponse = TaskResponse::with(['order', 'user.role'])
            ->findOrFail($taskResponseId);

        $extendLogs = TaskResponseExtendLog::with('user')
            ->where('task_response_id', $taskResponseId)
            ->orderBy('created_at', 'desc')
            ->get();

        $tahapOptions = [
            'survey' => 'Survey',
            'moodboard' => 'Moodboard',
            'estimasi' => 'Estimasi',
            'cm_fee' => 'Commitment Fee',
            'approval_design' => 'Approval Design',
            'desain_final' => 'Desain Final',
            'item_pekerjaan' => 'Item Pekerjaan',
            'rab_internal' => 'RAB Internal',
            'kontrak' => 'Kontrak',
            'invoice' => 'Invoice',
            'survey_schedule' => 'Survey Schedule',
            'survey_ulang' => 'Survey Ulang',
            'gambar_kerja' => 'Gambar Kerja',
            'approval_material' => 'Approval Material',
            'workplan' => 'Workplan',
            'produksi' => 'Produksi',
        ];

        return Inertia::render('Log/ExtendLog', [
            'taskResponse' => $taskResponse,
            'extendLogs' => $extendLogs,
            'tahapOptions' => $tahapOptions,
        ]);
    }

    /**
     * Show Project Management Progress detail per project
     */
    public function pmShow($orderId)
    {
        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.produks.stageEvidences',
        ])->findOrFail($orderId);

        $productsData = [];
        if ($order->moodboard && $order->moodboard->itemPekerjaans) {
            foreach ($order->moodboard->itemPekerjaans as $ip) {
                foreach ($ip->produks as $produk) {
                    $stagesData = [];
                    $stagesConfig = config('stage.stages', []);
                    
                    foreach ($stagesConfig as $stageName => $weight) {
                        $wpItem = $produk->workplanItems->firstWhere('nama_tahapan', $stageName);
                        $evidence = $produk->stageEvidences->firstWhere('stage', $stageName);
                        
                        $startDate = $wpItem?->start_date?->format('Y-m-d');
                        $endDate = $wpItem?->end_date?->format('Y-m-d');
                        $actualDate = $evidence?->created_at?->format('Y-m-d H:i:s');
                        
                        $delayDays = null;
                        $status = 'planned'; // planned, in_progress, done_on_time, done_early, done_late, overdue
                        
                        if ($evidence) {
                            // Completed
                            $actualTime = \Carbon\Carbon::parse($evidence->created_at)->startOfDay();
                            if ($wpItem && $wpItem->end_date) {
                                $deadlineTime = \Carbon\Carbon::parse($wpItem->end_date)->startOfDay();
                                $diff = $deadlineTime->diffInDays($actualTime, false);
                                
                                if ($diff > 0) {
                                    $delayDays = $diff;
                                    $status = 'done_late';
                                } elseif ($diff < 0) {
                                    $delayDays = abs($diff);
                                    $status = 'done_early';
                                } else {
                                    $delayDays = 0;
                                    $status = 'done_on_time';
                                }
                            } else {
                                $status = 'done_on_time';
                            }
                        } else {
                            // Not yet completed
                            if ($wpItem && $wpItem->end_date) {
                                $deadlineTime = \Carbon\Carbon::parse($wpItem->end_date)->startOfDay();
                                $today = \Carbon\Carbon::today();
                                $diff = $deadlineTime->diffInDays($today, false);
                                
                                if ($diff > 0) {
                                    $delayDays = $diff;
                                    $status = 'overdue';
                                } else {
                                    $status = ($produk->current_stage === $stageName) ? 'in_progress' : 'planned';
                                }
                            } else {
                                $status = ($produk->current_stage === $stageName) ? 'in_progress' : 'planned';
                            }
                        }
                        
                        $stagesData[] = [
                            'nama_tahapan' => $stageName,
                            'start_date' => $startDate,
                            'end_date' => $endDate,
                            'actual_date' => $actualDate,
                            'delay_days' => $delayDays,
                            'status' => $status,
                            'notes' => $evidence?->notes,
                            'uploaded_by' => $evidence?->uploaded_by,
                            'evidence_path' => $evidence?->evidence_path,
                        ];
                    }
                    
                    $productsData[] = [
                        'id' => $produk->id,
                        'nama_produk' => $produk->produk->nama_produk,
                        'nama_ruangan' => $produk->nama_ruangan,
                        'current_stage' => $produk->current_stage,
                        'progress' => $produk->progress,
                        'stages' => $stagesData,
                    ];
                }
            }
        }

        $projectDetails = [
            'id' => $order->id,
            'nama_project' => $order->nama_project,
            'customer_name' => $order->customer_name,
            'company_name' => $order->company_name,
            'products' => $productsData,
        ];

        return Inertia::render('Log/PmDetail', [
            'project' => $projectDetails,
        ]);
    }
}