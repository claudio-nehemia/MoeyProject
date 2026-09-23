<?php

namespace App\Http\Controllers\Moodboard\Traits;

use App\Models\Moodboard;
use App\Models\MoodboardFile;
use App\Models\TaskResponse;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait HasDesainKasar
{
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
                'moodboard_kasar.*' => 'required|file|mimes:jpg,jpeg,png,pdf,cad,dwg,dxf,skp',
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
                ->where('is_marketing', false)
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

                    TaskResponse::create([
                        'order_id' => $moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'estimasi',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk survey_ulang
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
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
                'moodboard_kasar.*' => 'required|file|mimes:jpg,jpeg,png,pdf,cad,dwg,dxf,skp|max:10240',
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
                'file' => 'required|file|mimes:jpg,jpeg,png,pdf,cad,dwg,dxf,skp|max:10240',
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
}
