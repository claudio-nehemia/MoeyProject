<?php

namespace App\Http\Controllers;

use App\Models\TaskResponse;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        // Sort by created_at desc
        $taskResponses = $query->orderBy('created_at', 'desc')->paginate(50);

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
        ];

        return Inertia::render('Log/Index', [
            'taskResponses' => $taskResponses,
            'users' => $users,
            'orders' => $orders,
            'tahapOptions' => $tahapOptions,
            'statusOptions' => $statusOptions,
            'filters' => [
                'user_id' => $request->user_id,
                'order_id' => $request->order_id,
                'tahap' => $request->tahap,
                'status' => $request->status,
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
}