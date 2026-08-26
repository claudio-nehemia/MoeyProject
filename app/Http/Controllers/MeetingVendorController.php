<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\MeetingVendor;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use App\Services\ActivityLogService;

class MeetingVendorController extends Controller
{
    /**
     * Display a listing of orders for Meeting Vendor.
     */
    public function index()
    {
        $user = auth()->user();
        $isKepalaMarketing = $user->role_id == \App\Models\Role::getKepalaMarketingRoleId() || ($user->role && $user->role->nama_role === 'Kepala Marketing');
        $isProjectManager = $user->role_id == \App\Models\Role::getProjectManagerRoleId() || ($user->role && $user->role->nama_role === 'Project Manager');
        $isAdmin = $user->role && $user->role->nama_role === 'Admin';
        $isDrafter = $user->role && $user->role->nama_role === 'Drafter';

        $items = Order::with(['meetingVendor', 'gambarKerja', 'jenisInterior'])
            ->whereHas('gambarKerja', function ($q) {
                $q->where('status', 'approved');
            })
            ->visibleToSurveyUser($user)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $meeting = $order->meetingVendor;
                $status = 'pending'; // Belum response

                if ($meeting) {
                    if ($meeting->tanggal_meeting) {
                        $status = 'scheduled'; // Jadwal meeting sudah diset
                    } elseif ($meeting->response_time) {
                        $status = 'waiting_input'; // Sudah response, belum set jadwal
                    }
                }

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'jenis_interior' => optional($order->jenisInterior)->nama_interior ?? '-',
                    'payment_status' => $order->payment_status,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'status_meeting' => $status,
                    'meeting_vendor_id' => $meeting?->id,
                    'tanggal_meeting' => $meeting?->tanggal_meeting ? $meeting->tanggal_meeting->format('Y-m-d') : null,
                    'jam_meeting' => $meeting?->jam_meeting,
                    'lokasi' => $meeting?->lokasi,
                    'catatan' => $meeting?->catatan,
                    'response_by' => $meeting?->response_by,
                    'response_time' => $meeting?->response_time?->toIso8601String(),
                    'pm_response_by' => $meeting?->pm_response_by,
                    'pm_response_time' => $meeting?->pm_response_time?->toIso8601String(),
                ];
            });

        return Inertia::render('MeetingVendor/Index', [
            'items' => $items,
            'isKepalaMarketing' => $isKepalaMarketing,
            'isProjectManager' => $isProjectManager,
            'isAdmin' => $isAdmin,
            'isDrafter' => $isDrafter,
        ]);
    }

    /**
     * Regular Response (Accept notification / start scheduling)
     */
    public function response(Order $order)
    {
        $meeting = $order->meetingVendor;

        if ($meeting && $meeting->response_time) {
            return back()->with('error', 'Meeting vendor sudah di-response.');
        }

        if ($meeting) {
            $meeting->update([
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'System',
                'status' => 'waiting_input',
            ]);
        } else {
            $meeting = MeetingVendor::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'System',
                'status' => 'waiting_input',
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'meeting_vendor')
            ->where('is_marketing', false)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        ActivityLogService::log(
            $order->id,
            $meeting,
            'response_meeting_vendor',
            'Response Jadwal Meeting Vendor',
            auth()->user()->name . ' telah merespons tahapan Meeting Vendor untuk project ' . $order->nama_project
        );

        return back()->with('success', 'Jadwal meeting vendor berhasil di-response.');
    }

    /**
     * Store or update meeting vendor schedule (Date & Time)
     */
    public function storeSchedule(Request $request, Order $order)
    {
        $validated = $request->validate([
            'tanggal_meeting' => 'required|date',
            'jam_meeting' => 'required|string',
            'lokasi' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $meeting = $order->meetingVendor;

        if ($meeting) {
            $meeting->update([
                'tanggal_meeting' => $validated['tanggal_meeting'],
                'jam_meeting' => $validated['jam_meeting'],
                'lokasi' => $validated['lokasi'] ?? null,
                'catatan' => $validated['catatan'] ?? null,
                'status' => 'scheduled',
                'created_by' => auth()->id(),
            ]);
        } else {
            $meeting = MeetingVendor::create([
                'order_id' => $order->id,
                'tanggal_meeting' => $validated['tanggal_meeting'],
                'jam_meeting' => $validated['jam_meeting'],
                'lokasi' => $validated['lokasi'] ?? null,
                'catatan' => $validated['catatan'] ?? null,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'System',
                'status' => 'scheduled',
                'created_by' => auth()->id(),
            ]);
        }

        // Selesaikan task response meeting_vendor
        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'meeting_vendor')
            ->where('is_marketing', false)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse) {
            if ($taskResponse->isOverdue()) {
                $taskResponse->update([
                    'status' => 'telat_submit',
                    'update_data_time' => now(),
                ]);
            } else {
                $taskResponse->update([
                    'update_data_time' => now(),
                    'status' => 'selesai',
                ]);
            }
        }

        // Majukan tahapan project ke approval_material
        $order->update([
            'tahapan_proyek' => 'approval_material',
        ]);

        // Buat task response untuk approval_material jika belum ada
        $nextTaskExists = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'approval_material')
            ->exists();

        if (!$nextTaskExists) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'approval_material',
                'start_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => 6,
                'extend_time' => 0,
                'status' => 'menunggu_response',
            ]);

            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'approval_material',
                'start_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => 6,
                'extend_time' => 0,
                'status' => 'menunggu_response',
                'is_marketing' => true,
            ]);
        }

        // Kirim notifikasi approval material
        $notificationService = new NotificationService();
        $notificationService->sendApprovalMaterialRequestNotification($order);

        ActivityLogService::log(
            $order->id,
            $meeting,
            'scheduled_meeting_vendor',
            'Jadwal Meeting Vendor Disimpan',
            'Jadwal meeting diatur pada ' . $validated['tanggal_meeting'] . ' ' . $validated['jam_meeting'] . ' oleh ' . auth()->user()->name . '. Tahapan berlanjut ke Approval Material.'
        );

        return redirect()->route('meeting-vendor.index')->with('success', 'Jadwal Meeting Vendor berhasil disimpan. Notifikasi Approval Material telah dikirim.');
    }
}
