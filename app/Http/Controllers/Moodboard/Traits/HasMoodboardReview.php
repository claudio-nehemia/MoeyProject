<?php

namespace App\Http\Controllers\Moodboard\Traits;

use App\Models\Moodboard;
use App\Models\MoodboardFile;
use App\Models\Order;
use App\Models\TaskResponse;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait HasMoodboardReview
{
    public function responseMoodboard(Request $request, $orderId)
    {
        try {
            Log::info('=== RESPONSE MOODBOARD START ===');
            Log::info('Order ID: ' . $orderId);
            Log::info('User: ' . auth()->user()->name);

            $order = Order::findOrFail($orderId);
            Log::info('Order found: ' . $order->id);

            // Check if moodboard already exists
            if ($order->moodboard) {
                Log::info('Moodboard already exists, updating response data');

                // Update existing moodboard with response data
                $order->moodboard->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name,
                ]);

                $moodboard = $order->moodboard;
            } else {
                // Create new moodboard
                $moodboard = Moodboard::create([
                    'order_id' => $order->id,
                    'response_time' => now(),
                    'response_by' => auth()->user()->name,
                    'status' => 'pending',
                ]);
            }

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

            Log::info('Moodboard processed with ID: ' . $moodboard->id);
            Log::info('=== RESPONSE MOODBOARD END ===');

            return back()->with('success', 'Response moodboard berhasil dicatat.');
        } catch (\Exception $e) {
            Log::error('Response moodboard error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal response moodboard: ' . $e->getMessage());
        }
    }

    public function reviseMoodboard(Request $request, $moodboardId)
    {
        try {
            Log::info('=== REVISE MOODBOARD START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());

            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');

            // Check if estimasi exists
            if (!$moodboard->estimasi) {
                Log::warning('No estimasi found for moodboard: ' . $moodboardId);
                return back()->with('error', 'Estimasi harus dibuat terlebih dahulu sebelum revisi.');
            }

            $validated = $request->validate([
                'notes' => 'required|string|max:500',
            ]);

            Log::info('Validation passed');

            $moodboard->status = 'revisi';
            $moodboard->notes = $validated['notes'];
            $moodboard->save();

            Log::info('Moodboard updated, status: revisi');
            Log::info('=== REVISE MOODBOARD END ===');

            return back()->with('success', 'Moodboard diminta untuk revisi.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Revise moodboard error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal minta revisi: ' . $e->getMessage());
        }
    }

    public function acceptDesain(Request $request, $moodboardId)
    {
        try {
            Log::info('=== ACCEPT DESAIN START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());

            $validated = $request->validate([
                'moodboard_file_id' => 'required|exists:moodboard_files,id',
            ]);

            $moodboard = Moodboard::with('estimasi.files')->findOrFail($moodboardId);
            Log::info('Moodboard found');

            // Check if estimasi exists
            if (!$moodboard->estimasi) {
                Log::warning('No estimasi found for moodboard: ' . $moodboardId);
                return back()->with('error', 'Estimasi harus dibuat terlebih dahulu sebelum accept desain.');
            }

            // Get selected moodboard file
            $moodboardFile = MoodboardFile::findOrFail($validated['moodboard_file_id']);
            Log::info('Selected moodboard file: ' . $moodboardFile->id);

            // Find corresponding estimasi file
            $estimasiFile = $moodboard->estimasi->files()
                ->where('moodboard_file_id', $moodboardFile->id)
                ->first();

            if (!$estimasiFile) {
                Log::warning('No estimasi file found for selected moodboard file: ' . $moodboardFile->id);
                return back()->with('error', 'File estimasi untuk desain kasar yang dipilih belum diupload.');
            }

            Log::info('Found estimasi file: ' . $estimasiFile->id);

            // Update moodboard with selected files
            $moodboard->moodboard_kasar = $moodboardFile->file_path;
            $moodboard->estimasi->estimated_cost = $estimasiFile->file_path;
            $moodboard->status = 'approved';

            $moodboard->save();
            $moodboard->estimasi->save();

            Log::info('Moodboard approved with selected file');
            Log::info('Moodboard kasar: ' . $moodboard->moodboard_kasar);
            Log::info('Estimated cost: ' . $moodboard->estimasi->estimated_cost);
            Log::info('=== ACCEPT DESAIN END ===');

            $notificationService = new NotificationService();
            $notificationService->sendCommitmentFeeRequestNotification($moodboard->order);

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'approval_design')
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->where('is_marketing', false)
                ->first();

            $lastMarketingTask = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'estimasi')
                ->where('is_marketing', true)
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->first();

            if ($taskResponse) {
                if ($taskResponse->isOverdue()) {
                    $taskResponse->update([
                        'user_id' => auth()->user()->id,
                        'status' => 'telat_submit',
                        'update_data_time' => now(),
                        'response_time' => now(),
                    ]);
                } else {
                    $taskResponse->update([
                        'update_data_time' => now(),
                        'status' => 'selesai',
                    ]);
                }

                // Create task response untuk tahap selanjutnya (cm_fee)
                $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                    ->where('tahap', 'cm_fee')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'cm_fee',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);
                }
            }

            if ($lastMarketingTask && $lastMarketingTask->status !== 'selesai') {
                if ($lastMarketingTask->isOverdue()) {
                    $lastMarketingTask->update([
                        'status' => 'telat_submit',
                        'update_data_time' => now(),
                    ]);
                } else {
                    $lastMarketingTask->update([
                        'update_data_time' => now(),
                        'status' => 'selesai',
                    ]);
                }
            }
            $nextMarketingTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'cm_fee')
                ->where('is_marketing', true)
                ->exists();

            if (!$nextMarketingTaskExists) {
                TaskResponse::create([
                    'order_id' => $moodboard->order->id,
                    'user_id' => null,
                    'tahap' => 'cm_fee',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                    'is_marketing' => true,
                ]);
            }

            return back()->with('success', 'Desain kasar diterima. Menunggu commitment fee.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Accept desain error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal approve desain: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Moodboard $moodboard)
    {
        $moodboard->delete();

        return redirect()->back()->with('success', 'Moodboard deleted successfully.');
    }
}
