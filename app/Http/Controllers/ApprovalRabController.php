<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\GambarKerjaFinalFile;
use App\Services\NotificationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ApprovalRabController extends Controller
{
    /**
     * ======================================================
     * INDEX
     * approval-material.index (Gambar Kerja Final)
     * ======================================================
     */
    public function index()
    {
        $user = auth()->user();

        $items = ItemPekerjaan::with([
            'moodboard.order',
            'gambarKerjaFinalFiles',
        ])
            ->whereHas('moodboard.order', function ($query) use ($user) {
                $query->visibleToSurveyUser($user);
            })
            ->whereHas('moodboard.order.gambarKerja', function ($query) {
                $query->whereNotNull('approved_time')
                    ->whereNotNull('approved_by');
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ip) {
                $files = $ip->gambarKerjaFinalFiles->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'original_name' => $file->original_name,
                        'file_path' => $file->file_path,
                        'file_size' => $file->file_size,
                        'url' => Storage::url($file->file_path),
                        'uploaded_by' => $file->uploaded_by,
                        'created_at' => $file->created_at?->toIso8601String(),
                    ];
                });

                $isCompleted = $files->count() > 0;

                return [
                    'id' => $ip->id,
                    'order_id' => $ip->moodboard->order->id,
                    'project_name' => $ip->moodboard->order->nama_project,
                    'company_name' => $ip->moodboard->order->company_name,
                    'customer_name' => $ip->moodboard->order->customer_name,
                    'files' => $files,
                    'total_files' => $files->count(),
                    'is_completed' => $isCompleted,

                    // Response tracking
                    'approval_rab_response_time' => $ip->approval_rab_response_time,
                    'approval_rab_response_by' => $ip->approval_rab_response_by,
                    'pm_approval_rab_response_time' => $ip->pm_approval_rab_response_time,
                    'pm_approval_rab_response_by' => $ip->pm_approval_rab_response_by,

                    // Backward compatibility placeholders
                    'total_items' => 0,
                    'total_bahan_baku' => 0,
                    'items_preview' => [],
                    'bahan_baku_preview' => [],
                ];
            });

        return Inertia::render('ApprovalRab/Index', [
            'items' => $items,
        ]);
    }

    /**
     * ======================================================
     * EDIT / DETAIL FILE MANAGEMENT
     * approval-material.edit
     * ======================================================
     */
    public function edit($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'gambarKerjaFinalFiles',
        ])->findOrFail($itemPekerjaanId);

        $order = $itemPekerjaan->moodboard->order;

        $files = $itemPekerjaan->gambarKerjaFinalFiles->map(function ($file) {
            return [
                'id' => $file->id,
                'original_name' => $file->original_name,
                'file_path' => $file->file_path,
                'file_size' => $file->file_size,
                'url' => Storage::url($file->file_path),
                'uploaded_by' => $file->uploaded_by,
                'created_at' => $file->created_at?->toIso8601String(),
            ];
        });

        return Inertia::render('ApprovalRab/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'order_id' => $order->id,
                'project_name' => $order->nama_project,
                'company_name' => $order->company_name,
                'customer_name' => $order->customer_name,
                'files' => $files,
                'total_files' => $files->count(),
                'approval_rab_response_time' => $itemPekerjaan->approval_rab_response_time,
                'approval_rab_response_by' => $itemPekerjaan->approval_rab_response_by,
            ],
        ]);
    }

    /**
     * ======================================================
     * UPLOAD FILES (Gambar Kerja Final)
     * approval-material.upload
     * ======================================================
     */
    public function uploadFiles(Request $request, $itemPekerjaanId)
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'file|max:51200', // max 50MB per file
        ]);

        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        $order = $itemPekerjaan->moodboard->order;

        foreach ($request->file('files') as $file) {
            $path = $file->store('gambar-kerja-final/' . $itemPekerjaan->id, 'public');

            GambarKerjaFinalFile::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'order_id' => $order ? $order->id : null,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->user()->name ?? 'System',
            ]);
        }

        // Complete task response for approval_material and advance to workplan
        if ($order) {
            $taskResponse = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'approval_material')
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

                // Create task response untuk tahap selanjutnya (workplan) jika belum ada
                $nextTaskExists = TaskResponse::where('order_id', $order->id)
                    ->where('tahap', 'workplan')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'workplan',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);

                    TaskResponse::create([
                        'order_id' => $order->id,
                        'user_id' => null,
                        'tahap' => 'workplan',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3),
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }
            }

            // Update order stage if applicable
            $order->update(['tahapan_proyek' => 'workplan']);

            // Send notification to PM and Estimator
            $notificationService = new NotificationService();
            $notificationService->sendWorkplanRequestNotification($order);
        }

        return back()->with('success', 'Berkas gambar kerja final berhasil diunggah.');
    }

    /**
     * ======================================================
     * DELETE FILE
     * approval-material.delete-file
     * ======================================================
     */
    public function deleteFile($fileId)
    {
        $file = GambarKerjaFinalFile::findOrFail($fileId);

        if (Storage::disk('public')->exists($file->file_path)) {
            Storage::disk('public')->delete($file->file_path);
        }

        $file->delete();

        return back()->with('success', 'Berkas berhasil dihapus.');
    }

    /**
     * ======================================================
     * DOWNLOAD SINGLE FILE
     * approval-material.download-file
     * ======================================================
     */
    public function downloadFile($fileId)
    {
        $file = GambarKerjaFinalFile::findOrFail($fileId);

        if (!Storage::disk('public')->exists($file->file_path)) {
            return back()->with('error', 'File tidak ditemukan di server.');
        }

        $filename = $file->original_name ?: basename($file->file_path);
        return Storage::disk('public')->download($file->file_path, $filename);
    }

    /**
     * ======================================================
     * DOWNLOAD ALL (ZIP)
     * approval-material.download-all
     * ======================================================
     */
    public function downloadAllFiles($itemPekerjaanId)
    {
        try {
            $itemPekerjaan = ItemPekerjaan::with(['gambarKerjaFinalFiles', 'moodboard.order'])
                ->findOrFail($itemPekerjaanId);
            $files = $itemPekerjaan->gambarKerjaFinalFiles;

            if ($files->isEmpty()) {
                return back()->with('error', 'Tidak ada berkas gambar kerja final untuk didownload.');
            }

            // Single file: direct download
            if ($files->count() === 1) {
                $file = $files->first();
                if (!Storage::disk('public')->exists($file->file_path)) {
                    return back()->with('error', 'File tidak ditemukan di server.');
                }
                $filename = $file->original_name ?: basename($file->file_path);
                return Storage::disk('public')->download($file->file_path, $filename);
            }

            // Multiple files: ZIP
            $projectName = $itemPekerjaan->moodboard?->order?->nama_project ?? 'Project';
            $sanitizedProjectName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $projectName);
            $zipName = 'Gambar_Kerja_Final_' . $sanitizedProjectName . '_' . date('YmdHis') . '.zip';
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            $zipPath = $tempDir . '/' . $zipName;

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                return back()->with('error', 'Gagal membuat file ZIP.');
            }

            $addedCount = 0;
            foreach ($files as $index => $file) {
                if (Storage::disk('public')->exists($file->file_path)) {
                    $fullPath = Storage::disk('public')->path($file->file_path);
                    $originalName = $file->original_name ?: basename($file->file_path);
                    $entryName = ($index + 1) . '_' . $originalName;
                    $zip->addFile($fullPath, $entryName);
                    $addedCount++;
                }
            }
            $zip->close();

            if ($addedCount === 0) {
                if (file_exists($zipPath)) {
                    @unlink($zipPath);
                }
                return back()->with('error', 'Tidak ada berkas valid di server.');
            }

            return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            \Log::error('Download All Gambar Kerja Final Error: ' . $e->getMessage());
            return back()->with('error', 'Terjadi kesalahan saat memproses download ZIP.');
        }
    }

    /**
     * ======================================================
     * UPDATE FROM EDIT PAGE
     * approval-material.update
     * ======================================================
     */
    public function update(Request $request, $itemPekerjaanId)
    {
        if ($request->hasFile('files')) {
            return $this->uploadFiles($request, $itemPekerjaanId);
        }

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'Data gambar kerja final tersimpan.');
    }

    /**
     * ======================================================
     * RESPONSES
     * approval-material.responses
     * ======================================================
     */
    public function responses(Request $request, $itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        if ($itemPekerjaan->approval_rab_response_by) {
            return redirect()
                ->route('approval-material.index')
                ->with('error', 'Gambar kerja final sudah pernah direspon.');
        }

        $itemPekerjaan->update([
            'approval_rab_response_by' => auth()->user()->name,
            'approval_rab_response_time' => now(),
        ]);

        $taskResponse = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
            ->where('tahap', 'approval_material')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
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

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'Gambar kerja final berhasil direspon.');
    }

    /**
     * ======================================================
     * EXPORT PDF
     * ======================================================
     */
    public function exportPdf($itemPekerjaanId)
    {
        $data = $this->getExportData($itemPekerjaanId);

        $pdf = Pdf::loadView('pdf.approval-material', $data);
        $pdf->setPaper('A4', 'landscape');

        $filename = 'Gambar_Kerja_Final_' . str_replace(' ', '_', $data['project']) . '.pdf';
        return $pdf->stream($filename);
    }

    /**
     * Export as Word
     */
    public function exportWord($itemPekerjaanId)
    {
        $data = $this->getExportData($itemPekerjaanId);
        $html = view('pdf.approval-material', $data)->render();
        $filename = 'Gambar_Kerja_Final_' . str_replace(' ', '_', $data['project']) . '.doc';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-word')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    private function getExportData($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk',
            'produks.jenisItems.items.item',
            'produks.jenisItems.jenisItem',
            'produks.bahanBakus.item',
            'gambarKerjaFinalFiles',
        ])->findOrFail($itemPekerjaanId);

        $order = $itemPekerjaan->moodboard->order;

        $finishingItems = $itemPekerjaan->produks
            ->flatMap(
                fn($produk) =>
                $produk->jenisItems->flatMap(
                    fn($jenis) =>
                    $jenis->items->map(fn($item) => (object) [
                        'nama_ruangan' => $produk->nama_ruangan ?: 'Tanpa Ruangan',
                        'produk' => $produk->produk->nama_produk ?? '-',
                        'item_name' => $item->item->nama_item ?? '-',
                        'jenis_item' => $jenis->jenisItem->nama_jenis_item ?? '-',
                        'brand_spek' => $item->brand_spek ?? [],
                        'kode_material' => $item->kode_material ?? [],
                        'area' => $item->area ?: ($produk->nama_ruangan ?: '-'),
                        'keterangan_material' => $item->keterangan_material ?? '',
                        'foto' => $item->foto,
                    ])
                )
            )
            ->values();

        $bahanBakuItems = $itemPekerjaan->produks
            ->flatMap(
                fn($produk) =>
                $produk->bahanBakus->map(fn($bahan) => (object) [
                    'nama_ruangan' => $produk->nama_ruangan ?: 'Tanpa Ruangan',
                    'produk' => $produk->produk->nama_produk ?? '-',
                    'item_name' => $bahan->item->nama_item ?? '-',
                    'brand_spek' => $bahan->brand_spek ?? [],
                    'kode_material' => $bahan->kode_material ?? [],
                    'area' => $bahan->area ?: ($produk->nama_ruangan ?: '-'),
                    'keterangan_material' => $bahan->keterangan_bahan_baku ?? '',
                    'foto' => $bahan->foto,
                ])
            )
            ->values();

        return [
            'owner' => $order->customer_name,
            'project' => $order->nama_project,
            'lokasi' => $order->alamat ?? '-',
            'tanggal' => now()->translatedFormat('d F Y'),
            'bahanBakuItems' => $bahanBakuItems,
            'finishingItems' => $finishingItems,
            'files' => $itemPekerjaan->gambarKerjaFinalFiles,
        ];
    }
}
