<?php

namespace App\Http\Controllers;

use App\Models\TaskResponse;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        ]);

        try {
            DB::beginTransaction();

            $taskResponse = TaskResponse::where('order_id', $orderId)
                ->where('tahap', $tahap)
                ->firstOrFail();

            // Update deadline dengan tambahan hari
            $newDeadline = $taskResponse->deadline->copy()->addDays($validated['days']);
            
            $taskResponse->update([
                'deadline' => $newDeadline,
                'duration' => $taskResponse->duration + $validated['days'],
                'extend_time' => $taskResponse->extend_time + 1,
                'extend_reason' => ($taskResponse->extend_reason ? $taskResponse->extend_reason . "\n\n" : '') 
                    . "Perpanjangan #{$taskResponse->extend_time}: {$validated['reason']}",
            ]);

            DB::commit();

            return back()->with('success', "Perpanjangan {$validated['days']} hari berhasil diajukan.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error requesting extension: ' . $e->getMessage());
            return back()->with('error', 'Gagal mengajukan perpanjangan.');
        }
    }

    /**
     * Get task response untuk order dan tahap tertentu
     */
    public function getTaskResponse($orderId, $tahap)
    {
        $taskResponse = TaskResponse::where('order_id', $orderId)
            ->where('tahap', $tahap)
            ->first();

        return response()->json($taskResponse);
    }
}