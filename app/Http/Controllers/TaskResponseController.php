<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\TaskResponseExtendLog;

class TaskResponseController extends Controller
{
    /**
     * Request extension untuk task
     */
    public function requestExtension(Request $request, $orderId, $tahap)
    {
        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:30',
            'reason' => 'required|string|max:500',
            'is_marketing' => 'nullable|boolean',
        ]);

        try {
            DB::beginTransaction();

            // PENTING: Filter berdasarkan is_marketing
            // NOTE: In some environments there may be multiple rows for the same (order_id, tahap, is_marketing)
            // due to legacy logic. Always target the "active" one (highest extend_time, then most recently updated).
            $taskResponse = TaskResponse::where('order_id', $orderId)
                ->where('tahap', $tahap)
                ->where('is_marketing', (bool) ($validated['is_marketing'] ?? false))
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->firstOrFail();

            $newDeadline = $taskResponse->deadline->copy()->addDays($validated['days']);

            $taskResponse->update([
                'deadline' => $newDeadline,
                'duration' => $taskResponse->duration + $validated['days'],
                'extend_time' => $taskResponse->extend_time + 1,
                'extend_reason' => ($taskResponse->extend_reason ? $taskResponse->extend_reason . "\n\n" : '')
                    . "Perpanjangan #{$taskResponse->extend_time}: {$validated['reason']}",
            ]);

            TaskResponseExtendLog::create([
                'task_response_id' => $taskResponse->id,
                'user_id' => auth()->user()->id,
                'extend_time' => $taskResponse->extend_time,
                'extend_reason' => $validated['reason'],
                'request_time' => $validated['days'],
                'status' => 'pending',
            ]);

            DB::commit();

            $type = $validated['is_marketing'] ? 'marketing' : 'regular';
            return back()->with('success', "Perpanjangan {$type} {$validated['days']} hari berhasil diajukan.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error requesting extension: ' . $e->getMessage());
            return back()->with('error', 'Gagal mengajukan perpanjangan.');
        }
    }

    /**
     * Get task response untuk order dan tahap tertentu
     */
    public function getTaskResponse(Request $request, $orderId, $tahap)
    {
        $isMarketing = $request->query('is_marketing');
        $query = TaskResponse::where('order_id', $orderId)
            ->where('tahap', $tahap);
        if (!is_null($isMarketing)) {
            $query->where('is_marketing', (int)$isMarketing);
        }
        // Pick the most relevant record if duplicates exist.
        $taskResponse = $query
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if (!$taskResponse) {
            return response()->json(null);
        }

        // Normalize date serialization so frontend can reliably parse deadlines.
        return response()->json([
            'id' => $taskResponse->id,
            'order_id' => $taskResponse->order_id,
            'tahap' => $taskResponse->tahap,
            'status' => $taskResponse->status,
            'deadline' => $taskResponse->deadline ? $taskResponse->deadline->toIso8601String() : null,
            'extend_time' => (int) ($taskResponse->extend_time ?? 0),
            'is_marketing' => (int) ($taskResponse->is_marketing ?? 0),
        ]);
    }

}