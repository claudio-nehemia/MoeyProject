<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\Moodboard;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\MoodboardFile;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class MoodboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== MOODBOARD INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));

        $orders = Order::with(['moodboard.estimasi', 'moodboard.itemPekerjaan', 'moodboard.commitmentFee', 'moodboard.kasarFiles.estimasiFile', 'moodboard.finalFiles', 'jenisInterior', 'users.role'])
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->where('tahapan_proyek', 'moodboard') // Only orders with in_progress status
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'jenis_interior' => $order->jenisInterior->nama_interior ?? '-',
                    'tanggal_masuk_customer' => $order->tanggal_masuk_customer,
                    'project_status' => $order->project_status,
                    'moodboard' => $order->moodboard ? [
                        'id' => $order->moodboard->id,
                        'moodboard_kasar' => $order->moodboard->moodboard_kasar,
                        'moodboard_final' => $order->moodboard->moodboard_final,
                        'kasar_files' => $order->moodboard->kasarFiles->map(function ($file) {
                            return [
                                'id' => $file->id,
                                'file_path' => $file->file_path,
                                'original_name' => $file->original_name,
                                'url' => asset('storage/' . $file->file_path),
                                'estimasi_file' => $file->estimasiFile ? [
                                    'id' => $file->estimasiFile->id,
                                    'file_path' => $file->estimasiFile->file_path,
                                    'original_name' => $file->estimasiFile->original_name,
                                    'url' => asset('storage/' . $file->estimasiFile->file_path),
                                ] : null,
                            ];
                        }),
                        'final_files' => $order->moodboard->finalFiles->map(function ($file) {
                            return [
                                'id' => $file->id,
                                'file_path' => $file->file_path,
                                'original_name' => $file->original_name,
                                'url' => asset('storage/' . $file->file_path),
                            ];
                        }),
                        'has_item_pekerjaan' => $order->moodboard->itemPekerjaan ? true : false,
                        'response_time' => $order->moodboard->response_time,
                        'response_by' => $order->moodboard->response_by,
                        'pm_response_time' => $order->moodboard->pm_response_time,
                        'pm_response_by' => $order->moodboard->pm_response_by,
                        'status' => $order->moodboard->status,
                        'notes' => $order->moodboard->notes,
                        'has_estimasi' => $order->moodboard->estimasi ? true : false,
                        'has_commitment_fee_completed' => $order->moodboard->commitmentFee && $order->moodboard->commitmentFee->payment_status === 'completed' ? true : false,
                    ] : null,
                    // Team members
                    'team' => $order->users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'role' => $user->role->nama_role ?? 'No Role',
                        ];
                    }),
                ];
            });

        return Inertia::render('Moodboard/Index', [
            'orders' => $orders,
        ]);
    }

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

    /**
     * Store a newly created resource in storage.
     */
    public function uploadDesainKasar(Request $request)
    {
        try {
            Log::info('=== UPLOAD DESAIN KASAR START ===');
            Log::info('Request method: ' . $request->method());
            Log::info('Request headers: ', $request->headers->all());
            Log::info('Request data: ', $request->all());
            Log::info('Has files: ' . ($request->hasFile('moodboard_kasar') ? 'YES' : 'NO'));
            Log::info('Has token: ' . ($request->has('_token') ? 'YES' : 'NO'));

            $validated = $request->validate([
                'moodboard_id' => 'required|exists:moodboards,id',
                'moodboard_kasar' => 'required|array',
                'moodboard_kasar.*' => 'required|file|mimes:jpg,jpeg,png,pdf',
            ]);

            Log::info('Validation passed');

            $moodboard = Moodboard::findOrFail($validated['moodboard_id']);
            Log::info('Moodboard found: ' . $moodboard->id);

            if ($request->hasFile('moodboard_kasar')) {
                Log::info('Processing file uploads');

                foreach ($request->file('moodboard_kasar') as $file) {
                    $filePath = $file->store('moodboards', 'public');
                    $originalName = $file->getClientOriginalName();

                    MoodboardFile::create([
                        'moodboard_id' => $moodboard->id,
                        'file_path' => $filePath,
                        'file_type' => 'kasar',
                        'original_name' => $originalName,
                    ]);

                    Log::info('File stored: ' . $filePath . ' (' . $originalName . ')');
                }

                // Update legacy field for backward compatibility
                if (!$moodboard->moodboard_kasar) {
                    $firstFile = $request->file('moodboard_kasar')[0];
                    $moodboard->moodboard_kasar = $firstFile->store('moodboards', 'public');
                }

                $notificationService = new NotificationService();
                $notificationService->sendEstimasiRequestNotification($moodboard->order);
            }

            $moodboard->status = 'pending';
            $moodboard->save();

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'moodboard')
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

                // Create task response untuk tahap selanjutnya (cm_fee)
                $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                    ->where('tahap', 'estimasi')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'estimasi',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);
                }
            }


            Log::info('Moodboard saved successfully');
            Log::info('=== UPLOAD DESAIN KASAR END ===');

            return back()->with('success', 'Desain kasar berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Upload desain kasar error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload desain kasar: ' . $e->getMessage());
        }
    }

    public function uploadDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== UPLOAD DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Has file: ' . ($request->hasFile('moodboard_final') ? 'YES' : 'NO'));

            $moodboard = Moodboard::with('commitmentFee')->findOrFail($moodboardId);
            Log::info('Moodboard found, status: ' . $moodboard->status);

            if ($moodboard->status !== 'approved') {
                Log::warning('Moodboard not approved, status: ' . $moodboard->status);
                return back()->with('error', 'Moodboard harus di-approve terlebih dahulu sebelum upload desain final.');
            }

            // Check if commitment fee exists and completed
            if (!$moodboard->commitmentFee || $moodboard->commitmentFee->payment_status !== 'completed') {
                Log::warning('Commitment fee not completed for moodboard: ' . $moodboardId);
                return back()->with('error', 'Commitment Fee harus diselesaikan (completed) terlebih dahulu sebelum upload desain final.');
            }

            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            if ($request->hasFile('moodboard_final')) {
                Log::info('Processing file upload');
                // Delete old file if exists
                if ($moodboard->moodboard_final) {
                    Log::info('Deleting old file: ' . $moodboard->moodboard_final);
                    \Storage::disk('public')->delete($moodboard->moodboard_final);
                }
                $filePath = $request->file('moodboard_final')->store('moodboards', 'public');
                Log::info('File stored at: ' . $filePath);
                $moodboard->moodboard_final = $filePath;
            }

            $moodboard->save();
            Log::info('Moodboard saved successfully');
            Log::info('=== UPLOAD DESAIN FINAL END ===');

            return back()->with('success', 'Desain final berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Upload desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload desain final: ' . $e->getMessage());
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

    public function show($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return Inertia::render('Moodboard/Show', [
            'moodboard' => $moodboard,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function editDesainKasar($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return response()->json([
            'moodboard' => $moodboard,
        ]);
    }

    public function editDesainFinal($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return response()->json([
            'moodboard' => $moodboard,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function updateDesainKasar(Request $request, $moodboardId)
    {
        try {
            Log::info('=== UPDATE DESAIN KASAR START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());

            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');

            $validated = $request->validate([
                'moodboard_kasar' => 'nullable|array',
                'moodboard_kasar.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'delete_file_ids' => 'nullable|array',
                'delete_file_ids.*' => 'exists:moodboard_files,id',
            ]);

            // Handle file deletion
            if (!empty($validated['delete_file_ids'])) {
                Log::info('Deleting files: ', $validated['delete_file_ids']);

                foreach ($validated['delete_file_ids'] as $fileId) {
                    $file = MoodboardFile::where('id', $fileId)
                        ->where('moodboard_id', $moodboardId)
                        ->where('file_type', 'kasar')
                        ->first();

                    if ($file) {
                        // Delete physical file
                        Storage::disk('public')->delete($file->file_path);
                        // Delete database record
                        $file->delete();
                        Log::info('File deleted: ' . $fileId);
                    }
                }
            }

            // Handle new file uploads
            if ($request->hasFile('moodboard_kasar')) {
                Log::info('Adding new files');

                foreach ($request->file('moodboard_kasar') as $file) {
                    $filePath = $file->store('moodboards', 'public');
                    $originalName = $file->getClientOriginalName();

                    MoodboardFile::create([
                        'moodboard_id' => $moodboard->id,
                        'file_path' => $filePath,
                        'file_type' => 'kasar',
                        'original_name' => $originalName,
                    ]);

                    Log::info('New file added: ' . $filePath . ' (' . $originalName . ')');
                }
            }

            // Update legacy field jika ada file kasar
            $firstKasarFile = $moodboard->kasarFiles()->first();
            if ($firstKasarFile) {
                $moodboard->moodboard_kasar = $firstKasarFile->file_path;
                $moodboard->save();
            }

            Log::info('Desain kasar updated successfully');
            Log::info('=== UPDATE DESAIN KASAR END ===');

            return back()->with('success', 'Desain kasar berhasil diupdate.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Update desain kasar error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal update desain kasar: ' . $e->getMessage());
        }
    }

    /**
     * Delete single file kasar
     */
    public function deleteFileKasar($fileId)
    {
        try {
            Log::info('=== DELETE FILE KASAR START ===');
            Log::info('File ID: ' . $fileId);

            $file = MoodboardFile::where('id', $fileId)
                ->where('file_type', 'kasar')
                ->firstOrFail();

            Log::info('File found: ' . $file->file_path);

            $moodboardId = $file->moodboard_id;

            // Delete physical file
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
                Log::info('Physical file deleted');
            }

            // Delete database record
            $file->delete();
            Log::info('Database record deleted');

            // Update legacy field jika diperlukan
            $moodboard = Moodboard::find($moodboardId);
            if ($moodboard && $moodboard->moodboard_kasar === $file->file_path) {
                $firstKasarFile = $moodboard->kasarFiles()->first();
                $moodboard->moodboard_kasar = $firstKasarFile ? $firstKasarFile->file_path : null;
                $moodboard->save();
                Log::info('Legacy field updated');
            }

            Log::info('=== DELETE FILE KASAR END ===');

            return back()->with('success', 'File berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete file kasar error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal menghapus file: ' . $e->getMessage());
        }
    }

    /**
     * Replace specific file kasar
     */
    public function replaceFileKasar(Request $request, $fileId)
    {
        try {
            Log::info('=== REPLACE FILE KASAR START ===');
            Log::info('File ID: ' . $fileId);

            $validated = $request->validate([
                'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            $oldFile = MoodboardFile::where('id', $fileId)
                ->where('file_type', 'kasar')
                ->firstOrFail();

            Log::info('Old file found: ' . $oldFile->file_path);

            $moodboardId = $oldFile->moodboard_id;
            $oldPath = $oldFile->file_path;

            // Store new file
            $newFilePath = $request->file('file')->store('moodboards', 'public');
            $originalName = $request->file('file')->getClientOriginalName();

            Log::info('New file stored: ' . $newFilePath);

            // Update database record
            $oldFile->file_path = $newFilePath;
            $oldFile->original_name = $originalName;
            $oldFile->save();

            // Delete old physical file
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
                Log::info('Old physical file deleted');
            }

            // Update legacy field if necessary
            $moodboard = Moodboard::find($moodboardId);
            if ($moodboard && $moodboard->moodboard_kasar === $oldPath) {
                $moodboard->moodboard_kasar = $newFilePath;
                $moodboard->save();
                Log::info('Legacy field updated');
            }

            Log::info('=== REPLACE FILE KASAR END ===');

            return back()->with('success', 'File berhasil diganti.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Replace file kasar error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal mengganti file: ' . $e->getMessage());
        }
    }
    public function updateDesainFinal(Request $request, $moodboardId)
    {
        $moodboard = Moodboard::findOrFail($moodboardId);
        if ($moodboard->status === 'approved') {
            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf',
            ]);

            if ($request->hasFile('moodboard_final')) {
                $moodboard->moodboard_final = $request->file('moodboard_final')->store('moodboards', 'public');
            }

            $moodboard->update($validated);
        } else {
            return redirect()->back()->with('error', 'Cannot upload final design. Moodboard not approved yet.');
        }

        return redirect()->back()->with('success', 'Final design uploaded successfully.');
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

                // Create task response untuk tahap selanjutnya (cm_fee)
                $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                    ->where('tahap', 'desain_final')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'desain_final',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);
                }
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
