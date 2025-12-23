<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\GambarKerja;
use App\Models\SurveyUlang;
use Illuminate\Http\Request;
use App\Models\GambarKerjaFile;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class GambarKerjaController extends Controller
{
    /* ================= INDEX ================= */
    public function index()
    {
        $orders = Order::whereHas('surveyUlang')
            ->orderByDesc('id')
            ->get()
            ->map(function ($order) {
                $gk = GambarKerja::with('files')
                    ->where('order_id', $order->id)
                    ->first();

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'gambar_kerja' => $gk ? [
                        'id' => $gk->id,
                        'status' => $gk->status,
                        'response_time' => $gk->response_time,
                        'response_by' => $gk->response_by,
                        'notes' => $gk->notes,
                        'files' => $gk->files->map(fn ($f) => [
                            'id' => $f->id,
                            'original_name' => $f->original_name,
                            'uploaded_by' => $f->uploaded_by,
                            'url' => Storage::url($f->file_path),
                        ]),
                    ] : null,
                ];
            });

        return Inertia::render('GambarKerja/Index', [
            'orders' => $orders,
        ]);
    }

    /* ================= RESPONSE ================= */
    public function response(Order $order)
    {
        if (!SurveyUlang::where('order_id', $order->id)->exists()) {
            return back()->with('error', 'Survey ulang belum tersedia.');
        }

        if (GambarKerja::where('order_id', $order->id)->exists()) {
            return back()->with('error', 'Gambar kerja sudah di-response.');
        }

        GambarKerja::create([
            'order_id'      => $order->id,
            'status'        => 'pending',
            'response_time' => now(),
            'response_by'   => auth()->user()->name,
        ]);

        $order->update([
            'tahapan_proyek' => 'gambar_kerja',
        ]);

        return back()->with('success', 'Response gambar kerja berhasil.');
    }

    /* ================= UPLOAD / EDIT ================= */
    public function upload(Request $request, Order $order)
    {
        $request->validate([
            'files.*' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'notes'   => 'nullable|string|max:500',
        ]);

        $gambarKerja = GambarKerja::where('order_id', $order->id)->firstOrFail();

        foreach ($request->file('files') as $file) {
            $path = $file->store('gambar-kerja', 'public');

            GambarKerjaFile::create([
                'gambar_kerja_id' => $gambarKerja->id,
                'file_path'       => $path,
                'original_name'   => $file->getClientOriginalName(),
                'uploaded_by'     => auth()->user()->name,
            ]);
        }

        $gambarKerja->update([
            'notes'  => $request->notes,
            'status' => 'uploaded',
        ]);

        $notificationService = new NotificationService(); 
        
        $notificationService->sendApprovalMaterialRequestNotification($order);

        return back()->with('success', 'Gambar kerja berhasil disimpan.');
    }

    /* ================= VIEW FILE ================= */
    public function showFile(GambarKerjaFile $file)
    {
        // pastikan file ada di storage
        if (!Storage::disk('public')->exists($file->file_path)) {
            abort(404, 'File tidak ditemukan');
        }

        $mime = Storage::disk('public')->mimeType($file->file_path);
        $path = Storage::disk('public')->path($file->file_path);

        // tampilkan langsung di browser (image / pdf)
        return response()->file($path, [
            'Content-Type' => $mime,
        ]);
    }

    /* ================= DELETE FILE ================= */
    public function deleteFile(GambarKerjaFile $file)
    {
        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return back()->with('success', 'File berhasil dihapus.');
    }
}
