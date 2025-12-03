<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ItemPekerjaanProduk;
use App\Models\StageEvidence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class ProjectManagementController extends Controller
{
    public function index()
    {
        $orders = Order::with([
            'moodboard.itemPekerjaans.produks.itemPekerjaan.rabVendor.rabVendorProduks',
        ])
            ->whereHas('moodboard.itemPekerjaans.invoice', function ($q) {
                $q->whereNotNull('bukti_bayar');
            })
            ->get()
            ->map(function ($order) {
                return [
                    'id'            => $order->id,
                    'nama_project'  => $order->nama_project,
                    'company_name'  => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'progress'      => $order->progress,
                ];
            });

        return inertia('ProjectManagement/Index', [
            'orders' => $orders,
        ]);
    }

    public function show($id)
    {
        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.stageEvidences',
            'moodboard.itemPekerjaans.produks.defects.defectItems.repairs',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.rabVendor.rabVendorProduks',
            'moodboard.itemPekerjaans.kontrak'
        ])->findOrFail($id);

        // Get kontrak info from the first itemPekerjaan that has kontrak
        $kontrakInfo = null;
        foreach ($order->moodboard->itemPekerjaans as $ip) {
            if ($ip->kontrak) {
                $kontrak = $ip->kontrak;
                $kontrakInfo = [
                    'id' => $kontrak->id,
                    'durasi_kontrak' => $kontrak->durasi_kontrak,
                    'tanggal_mulai' => $kontrak->tanggal_mulai?->format('d M Y'),
                    'tanggal_selesai' => $kontrak->tanggal_selesai?->format('d M Y'),
                    'sisa_hari' => $kontrak->sisa_hari,
                    'deadline_status' => $kontrak->deadline_status,
                ];
                break;
            }
        }

        $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($itemPekerjaan) {
            // Total harga untuk 1 item pekerjaan
            $totalHargaItem = $itemPekerjaan->produks->sum('total_harga');

            $produks = $itemPekerjaan->produks->map(function ($produk) use ($totalHargaItem) {
                // ================================
                // 🔢 Perhitungan bobot & progress
                // ================================
                $weightPercentage = $totalHargaItem > 0
                    ? ($produk->total_harga / $totalHargaItem) * 100
                    : 0;

                $actualContribution = ($weightPercentage * $produk->progress) / 100;

                $canReportDefect = in_array($produk->current_stage, ['Finishing QC', 'Install QC']);

                $hasActiveDefect = $produk->defects()
                    ->whereIn('status', ['pending', 'in_repair'])
                    ->exists();

                // Check if defect has pending approval (repaired but not approved)
                $hasPendingApproval = $produk->defects()
                    ->whereIn('status', ['pending', 'in_repair'])
                    ->get()
                    ->some(fn($defect) => $defect->has_pending_approval);

                // Get stage evidences
                $stageEvidences = $produk->stageEvidences->groupBy('stage')->map(function ($evidences) {
                    return $evidences->map(function ($evidence) {
                        return [
                            'id' => $evidence->id,
                            'evidence_path' => $evidence->evidence_path,
                            'notes' => $evidence->notes,
                            'uploaded_by' => $evidence->uploaded_by,
                            'created_at' => $evidence->created_at->format('d M Y H:i'),
                        ];
                    });
                })->toArray();

                $activeDefect = $hasActiveDefect
                    ? $produk->defects()
                        ->whereIn('status', ['pending', 'in_repair'])
                        ->first()
                    : null;

                // ================================
                // 🗓  Workplan per produk
                // ================================
                // (sebenernya sudah eager loaded, tapi load() aman kalau dipanggil lagi)
                $produk->loadMissing('workplanItems');

                $workplan = $produk->workplanItems;

                // Kalau belum punya workplan → generate default breakdown
                if ($workplan->count() === 0) {
                    $workplan = collect(
                        WorkplanItemController::defaultBreakdown()
                    )->map(function ($row, $i) {
                        return (object)[
                            'id' => null,
                            'nama_tahapan' => $row['nama_tahapan'],
                            'start_date' => null,
                            'end_date' => null,
                            'duration_days' => null,
                            'urutan' => $i + 1,
                            'status' => 'planned',
                            'catatan' => null,
                        ];
                    });
                }

                // ================================
                // 🔁 Data yang dikirim ke FE
                // ================================
                return [
                    'id'                  => $produk->id,
                    'nama_produk'         => $produk->produk->nama_produk,
                    'quantity'            => $produk->quantity,
                    'dimensi'             => "{$produk->panjang}×{$produk->lebar}×{$produk->tinggi}",
                    'total_harga'         => $produk->total_harga,
                    'progress'            => $produk->progress,
                    'current_stage'       => $produk->current_stage,
                    'weight_percentage'   => round($weightPercentage, 2),
                    'actual_contribution' => round($actualContribution, 2),
                    'can_report_defect'   => $canReportDefect,
                    'has_active_defect'   => $hasActiveDefect,
                    'has_pending_approval' => $hasPendingApproval,
                    'defect_id'           => $activeDefect?->id,
                    'is_completed'        => $produk->is_completed,
                    'has_bast'            => $produk->has_bast,
                    'bast_number'         => $produk->bast_number,
                    'bast_date'           => $produk->bast_date?->format('d M Y'),
                    'bast_pdf_path'       => $produk->bast_pdf_path,
                    'stage_evidences'     => $stageEvidences,

                    // 🔥 kirim workplan ke FE dalam format bersih
                    'workplan_items' => $workplan->map(function ($wp) {
                        return [
                            'id' => $wp->id,
                            'nama_tahapan' => $wp->nama_tahapan,
                            'start_date' => $wp->start_date?->format('Y-m-d'),
                            'end_date' => $wp->end_date?->format('Y-m-d'),
                            'duration_days' => $wp->duration_days,
                            'status' => $wp->status,
                            'catatan' => $wp->catatan,
                            'urutan' => $wp->urutan,
                        ];
                    }),
                ];
            });

            return [
                'id'          => $itemPekerjaan->id,
                'produks'     => $produks,
                'progress'    => $itemPekerjaan->progress,
                'total_harga' => $totalHargaItem,
            ];
        });

        return inertia('ProjectManagement/Detail', [
            'order' => [
                'id'              => $order->id,
                'nama_project'    => $order->nama_project,
                'company_name'    => $order->company_name,
                'customer_name'   => $order->customer_name,
                'progress'        => $order->progress,
                'item_pekerjaans' => $itemPekerjaans,
            ],
            'kontrak' => $kontrakInfo,
            'stages' => config('stage.stages'),
        ]);
    }

    public function updateStage(Request $request, $id)
    {
        $request->validate([
            'current_stage' => 'required|string',
            'evidence' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'notes' => 'nullable|string|max:500',
        ]);

        $produk = ItemPekerjaanProduk::with([
            'itemPekerjaan.moodboard.order',
            'defects.defectItems.repairs'
        ])->findOrFail($id);

        $allowed = array_keys(config('stage.stages'));
        if (!in_array($request->current_stage, $allowed)) {
            return back()->withErrors(['stage' => 'Tahap tidak valid']);
        }

        // Check if there's any defect with pending approval (repaired but not approved)
        $hasPendingApproval = $produk->defects()
            ->whereIn('status', ['pending', 'in_repair'])
            ->get()
            ->some(fn($defect) => $defect->has_pending_approval);

        if ($hasPendingApproval) {
            return back()->withErrors(['stage' => 'Tidak dapat melanjutkan ke tahap berikutnya. Ada perbaikan defect yang belum di-approve.']);
        }

        // Check if there's any active defect (not completed)
        $hasActiveDefect = $produk->defects()
            ->whereIn('status', ['pending', 'in_repair'])
            ->exists();

        if ($hasActiveDefect) {
            return back()->withErrors(['stage' => 'Tidak dapat melanjutkan ke tahap berikutnya. Ada defect yang belum selesai diperbaiki.']);
        }

        // Upload evidence
        $evidencePath = $request->file('evidence')->store('stage-evidences', 'public');

        // Create stage evidence record
        StageEvidence::create([
            'item_pekerjaan_produk_id' => $produk->id,
            'stage' => $request->current_stage,
            'evidence_path' => $evidencePath,
            'notes' => $request->notes,
            'uploaded_by' => auth()->user()->name ?? 'System',
        ]);

        // Update produk stage
        $produk->update(['current_stage' => $request->current_stage]);

        // Update tahapan_proyek to 'produksi' when first stage (Potong) starts
        $stages = array_keys(config('stage.stages'));
        $firstStage = $stages[0] ?? 'Potong';
        if ($request->current_stage === $firstStage) {
            $order = $produk->itemPekerjaan->moodboard->order;
            if ($order->tahapan_proyek !== 'produksi') {
                $order->update(['tahapan_proyek' => 'produksi']);
            }
        }

        return back()->with('success', 'Tahap berhasil diperbarui dengan bukti');
    }

    public function generateBast($id)
    {
        $produk = ItemPekerjaanProduk::with([
            'produk',
            'itemPekerjaan.moodboard.order',
            'stageEvidences'
        ])->findOrFail($id);

        // Check if already completed (Install QC)
        if ($produk->current_stage !== 'Install QC') {
            return back()->withErrors(['bast' => 'Produk belum selesai Install QC']);
        }

        // Check if BAST already exists
        if ($produk->has_bast) {
            return back()->withErrors(['bast' => 'BAST sudah dibuat sebelumnya']);
        }

        // Generate BAST number
        $bastNumber = 'BAST/' . date('Y') . '/' . str_pad($produk->id, 5, '0', STR_PAD_LEFT);

        // Get order info
        $order = $produk->itemPekerjaan->moodboard->order;

        // Generate PDF
        $data = [
            'bast_number' => $bastNumber,
            'bast_date' => now()->format('d F Y'),
            'order' => $order,
            'produk' => $produk,
            'stage_evidences' => $produk->stageEvidences->groupBy('stage'),
        ];

        $pdf = PDF::loadView('pdf.bast', $data);
        $pdf->setPaper('a4', 'portrait');

        $filename = 'BAST-' . $bastNumber . '-' . date('YmdHis') . '.pdf';
        $pdfPath = 'bast/' . $filename;

        // Save PDF to storage
        Storage::disk('public')->put($pdfPath, $pdf->output());

        // Update produk with BAST info
        $produk->update([
            'bast_number' => $bastNumber,
            'bast_date' => now(),
            'bast_pdf_path' => $pdfPath,
        ]);

        return back()->with('success', 'BAST berhasil dibuat');
    }

    public function downloadBast($id)
    {
        $produk = ItemPekerjaanProduk::findOrFail($id);

        if (!$produk->bast_pdf_path) {
            return back()->withErrors(['bast' => 'BAST belum dibuat']);
        }

        $filePath = storage_path('app/public/' . $produk->bast_pdf_path);
        
        return response()->download($filePath);
    }
}
