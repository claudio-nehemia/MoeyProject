<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\GambarKerja;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\GambarKerjaFile;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class GambarKerjaController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== GAMBAR KERJA INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));

        $items = GambarKerja::with(['order.surveyUlang', 'files'])
            ->whereHas('order', function ($query) use ($user) {
                $query->visibleToSurveyUser($user);
            })
            ->whereHas('order.surveyUlang')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) {
                $item->files = $item->files->map(function ($file) {
                    $file->url = Storage::url($file->file_path);
                    return $file;
                });

                $item->has_response = !empty($item->response_time);
                return $item;
            });

        return Inertia::render('GambarKerja/Index', [
            'items' => $items,
        ]);
    }

    /* ================= RESPONSE ================= */

    public function response($id)
    {
        $gambarKerja = GambarKerja::findOrFail($id);

        if ($gambarKerja->response_time) {
            return back()->with('error', 'Sudah di-response.');
        }

        $gambarKerja->update([
            'response_time' => now(),
            'response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $gambarKerja->order->id)
            ->where('tahap', 'gambar_kerja')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->where('is_marketing', false)
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(8), // Tambah 3 hari (total 8 hari)
                'duration' => 8,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return back()->with('success', 'Gambar kerja di-response.');
    }

    /* ================= UPLOAD ================= */

    public function upload(Request $request)
    {
        $validated = $request->validate([
            'gambar_kerja_id' => 'required|exists:gambar_kerjas,id',
            'files' => 'required|array',
            'files.*' => 'file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $gambarKerja = GambarKerja::findOrFail($validated['gambar_kerja_id']);

        foreach ($request->file('files') as $file) {
            $path = $file->store('gambar-kerja', 'public');

            GambarKerjaFile::create([
                'gambar_kerja_id' => $gambarKerja->id,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'uploaded_by' => auth()->user()->name,
            ]);
        }

        $gambarKerja->update([
            'status' => 'uploaded',
        ]);

        return back()->with('success', 'File gambar kerja berhasil diupload.');
    }

    /* ================= APPROVE ================= */

    public function approve($id)
    {
        $gambarKerja = GambarKerja::findOrFail($id);

        if ($gambarKerja->files()->count() === 0) {
            return back()->with('error', 'Belum ada file.');
        }

        $gambarKerja->update([
            'status' => 'approved',
            'approved_time' => now(),
            'approved_by' => auth()->user()->name,
        ]);

        $order = $gambarKerja->order;
        $order->update([
            'tahapan_proyek' => 'meeting_vendor',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'gambar_kerja')
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

            // Create task response untuk tahap selanjutnya (meeting_vendor)
            $nextTaskExists = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'meeting_vendor')
                ->exists();

            if (!$nextTaskExists) {
                TaskResponse::create([
                    'order_id' => $order->id,
                    'user_id' => null,
                    'tahap' => 'meeting_vendor',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk meeting_vendor
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                ]);

                TaskResponse::create([
                    'order_id' => $order->id,
                    'user_id' => null,
                    'tahap' => 'meeting_vendor',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk meeting_vendor
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                    'is_marketing' => true,
                ]);
            }
        }

        // Send notification to Drafter and PM/Marketing to set meeting schedule
        $notificationService = new NotificationService();
        $notificationService->sendMeetingVendorRequestNotification($order);

        \App\Services\ActivityLogService::log(
            $order->id,
            $gambarKerja,
            'approved_gambar_kerja',
            'Approve Gambar Kerja',
            'Gambar kerja project ' . $order->nama_project . ' telah disetujui. Tahapan berlanjut ke Jadwal Meeting Vendor.'
        );

        return back()->with('success', 'Gambar kerja disetujui. Notifikasi Jadwal Meeting Approval telah dikirim ke drafter.');
    }

    /* ================= REVISI ================= */

    public function revisi(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $gambarKerja = GambarKerja::findOrFail($id);

        $gambarKerja->update([
            'revisi_notes' => $validated['notes'],
            'status' => 'pending',
        ]);

        return back()->with('success', 'Catatan revisi disimpan.');
    }

    /* ================= DELETE FILE ================= */

    public function deleteFile($id)
    {
        $file = GambarKerjaFile::findOrFail($id);

        if (Storage::disk('public')->exists($file->file_path)) {
            Storage::disk('public')->delete($file->file_path);
        }

        $file->delete();

        return back()->with('success', 'File berhasil dihapus.');
    }
}
