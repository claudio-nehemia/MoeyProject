<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Moodboard;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\MoodboardFile;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class DesainFinalController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== DESAIN FINAL INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));

        $moodboards = Moodboard::with(['order', 'finalFiles', 'commitmentFee'])
            ->whereHas('order', function ($query) use ($user) {
                $query->visibleToUser($user);
            })
            ->whereHas('commitmentFee', function ($query) {
                $query->where('payment_status', 'completed');
            })
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($moodboard) {
                $moodboard->final_files = $moodboard->finalFiles->map(function ($file) {
                    $file->url = Storage::url($file->file_path);
                    return $file;
                });
                $moodboard->has_response_final = !empty($moodboard->response_final_time);
                return $moodboard;
            });

        return Inertia::render('DesainFinal/Index', [
            'moodboards' => $moodboards,
        ]);
    }

    public function responseDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== RESPONSE DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('User: ' . auth()->user()->name);

            $moodboard = Moodboard::with('commitmentFee')->findOrFail($moodboardId);
            Log::info('Moodboard found: ' . $moodboard->id);

            // Check if moodboard is approved
            if ($moodboard->status !== 'approved') {
                Log::warning('Moodboard status is not approved: ' . $moodboard->status);
                return back()->with('error', 'Moodboard harus disetujui terlebih dahulu.');
            }

            // Check if commitment fee is completed
            if (!$moodboard->commitmentFee || $moodboard->commitmentFee->payment_status !== 'completed') {
                Log::warning('Commitment fee not completed');
                return back()->with('error', 'Commitment Fee harus diselesaikan terlebih dahulu.');
            }

            // Check if already responded
            if ($moodboard->response_final_time) {
                Log::warning('Already responded for desain final');
                return back()->with('error', 'Sudah di-response untuk desain final.');
            }

            $moodboard->update([
                'response_final_time' => now(),
                'response_final_by' => auth()->user()->name,
            ]);

            // Update order tahapan
            $moodboard->order->update([
                'tahapan_proyek' => 'desain_final',
            ]);

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'desain_final')
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
            }

            Log::info('Desain final response created');
            Log::info('=== RESPONSE DESAIN FINAL END ===');

            return back()->with('success', 'Desain final berhasil di-response. Silahkan upload file desain final.');
        } catch (\Exception $e) {
            Log::error('Response desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal response desain final: ' . $e->getMessage());
        }
    }

    public function uploadDesainFinal(Request $request)
    {
        try {
            Log::info('=== UPLOAD DESAIN FINAL START ===');
            Log::info('Request data: ', $request->all());

            $validated = $request->validate([
                'moodboard_id' => 'required|exists:moodboards,id',
                'moodboard_final' => 'required|array',
                'moodboard_final.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            $moodboard = Moodboard::with('commitmentFee')->findOrFail($validated['moodboard_id']);
            $order = $moodboard->order;
            Log::info('Moodboard found: ' . $moodboard->id);

            // Check if moodboard is approved
            if ($moodboard->status !== 'approved') {
                Log::warning('Moodboard status is not approved: ' . $moodboard->status);
                return back()->with('error', 'Moodboard harus disetujui terlebih dahulu.');
            }

            // Check if commitment fee is completed
            if (!$moodboard->commitmentFee || $moodboard->commitmentFee->payment_status !== 'completed') {
                Log::warning('Commitment fee not completed');
                return back()->with('error', 'Commitment Fee harus diselesaikan terlebih dahulu.');
            }

            // Check if response final has been done
            if (!$moodboard->response_final_time) {
                Log::warning('Response final not done yet');
                return back()->with('error', 'Silahkan response terlebih dahulu sebelum upload file.');
            }
            if ($request->hasFile('moodboard_final')) {
                $files = $request->file('moodboard_final');
                Log::info('Number of files: ' . count($files));

                foreach ($files as $index => $file) {
                    Log::info("Processing file {$index}: " . $file->getClientOriginalName());

                    $path = $file->store('moodboards/final', 'public');
                    Log::info("File stored at: {$path}");

                    MoodboardFile::create([
                        'moodboard_id' => $moodboard->id,
                        'file_path' => $path,
                        'file_type' => 'final',
                        'original_name' => $file->getClientOriginalName(),
                    ]);

                    Log::info("MoodboardFile record created for file {$index}");
                }

                // JANGAN update moodboard_final di sini
                // Biarkan kosong sampai user pilih file untuk di-approve
            }

            $order->update([
                'tahapan_proyek' => 'desain_final',
            ]);

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'desain_final')
                ->first();

            if ($taskResponse) {
                $taskResponse->update([
                    'update_data_time' => now(), // Kapan data diisi
                    'status' => 'selesai',
                ]);

                // Create task response untuk tahap selanjutnya (cm_fee)
                $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                    ->where('tahap', 'item_pekerjaan')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'item_pekerjaan',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);
                }
            }

            Log::info('Desain final uploaded successfully');
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

    public function acceptDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== ACCEPT DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());

            $validated = $request->validate([
                'moodboard_file_id' => 'required|exists:moodboard_files,id',
            ]);

            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');

            // Get selected moodboard file
            $moodboardFile = MoodboardFile::where('id', $validated['moodboard_file_id'])
                ->where('file_type', 'final')
                ->firstOrFail();
            Log::info('Selected final file: ' . $moodboardFile->id);

            // Update moodboard with selected file
            $moodboard->moodboard_final = $moodboardFile->file_path;
            $moodboard->save();

            Log::info('Desain final accepted');
            Log::info('Moodboard final: ' . $moodboard->moodboard_final);
            Log::info('=== ACCEPT DESAIN FINAL END ===');

            $notificationService = new NotificationService();
            $notificationService->sendItemPekerjaanRequestNotification($moodboard->order);

            return back()->with('success', 'Desain final diterima.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Accept desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal approve desain final: ' . $e->getMessage());
        }
    }

    public function reviseDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== REVISE DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());

            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');

            $validated = $request->validate([
                'notes' => 'required|string|max:500',
            ]);

            Log::info('Validation passed');

            // Simpan ke kolom revisi_final, tidak perlu kosongkan moodboard_final
            $moodboard->revisi_final = $validated['notes'];
            $moodboard->save();

            Log::info('Desain final revision notes saved');
            Log::info('=== REVISE DESAIN FINAL END ===');

            return back()->with('success', 'Catatan revisi berhasil disimpan.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Revise desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal minta revisi: ' . $e->getMessage());
        }
    }

    public function deleteDesainFinalFile($fileId)
    {
        try {
            Log::info('=== DELETE DESAIN FINAL FILE START ===');
            Log::info('File ID: ' . $fileId);

            $file = MoodboardFile::where('id', $fileId)
                ->where('file_type', 'final')
                ->firstOrFail();

            Log::info('File found: ' . $file->original_name);

            $moodboard = Moodboard::findOrFail($file->moodboard_id);

            // If this file is the approved final, clear moodboard_final
            if ($moodboard->moodboard_final === $file->file_path) {
                Log::info('This is the approved final file, clearing moodboard_final');
                $moodboard->moodboard_final = null;
                $moodboard->save();
            }

            // Delete file from storage
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
                Log::info('File deleted from storage');
            }

            // Delete database record
            $file->delete();
            Log::info('File record deleted from database');
            Log::info('=== DELETE DESAIN FINAL FILE END ===');

            return back()->with('success', 'File berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete desain final file error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal hapus file: ' . $e->getMessage());
        }
    }

    public function replaceDesainFinalFile(Request $request, $fileId)
    {
        try {
            Log::info('=== REPLACE DESAIN FINAL FILE START ===');
            Log::info('File ID: ' . $fileId);
            Log::info('Request data: ', $request->all());

            $validated = $request->validate([
                'new_file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            $oldFile = MoodboardFile::where('id', $fileId)
                ->where('file_type', 'final')
                ->firstOrFail();

            Log::info('Old file found: ' . $oldFile->original_name);

            $moodboard = Moodboard::findOrFail($oldFile->moodboard_id);
            $wasApproved = ($moodboard->moodboard_final === $oldFile->file_path);

            // Delete old file from storage
            if (Storage::disk('public')->exists($oldFile->file_path)) {
                Storage::disk('public')->delete($oldFile->file_path);
                Log::info('Old file deleted from storage');
            }

            // Upload new file
            $newFile = $request->file('new_file');
            $newPath = $newFile->store('moodboards/final', 'public');
            Log::info('New file uploaded: ' . $newPath);

            // Update database record
            $oldFile->file_path = $newPath;
            $oldFile->original_name = $newFile->getClientOriginalName();
            $oldFile->save();

            // If the old file was approved, update moodboard_final to new path
            if ($wasApproved) {
                Log::info('Old file was approved, updating moodboard_final to new path');
                $moodboard->moodboard_final = $newPath;
                $moodboard->save();
            }

            Log::info('File replaced successfully');
            Log::info('=== REPLACE DESAIN FINAL FILE END ===');

            return back()->with('success', 'File berhasil diganti.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Replace desain final file error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal ganti file: ' . $e->getMessage());
        }
    }
}
