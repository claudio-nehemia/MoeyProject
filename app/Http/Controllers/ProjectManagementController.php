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
            'moodboard.itemPekerjaans.kontrak',
        ])
            ->whereHas('moodboard.itemPekerjaans.invoice', function ($q) {
                $q->whereNotNull('bukti_bayar');
            })
            ->get()
            ->map(function ($order) {
                // Get deadline status from kontrak
                $deadlineStatus = null;
                $sisaHari = null;
                foreach ($order->moodboard->itemPekerjaans as $ip) {
                    if ($ip->kontrak) {
                        $deadlineStatus = $ip->kontrak->deadline_status;
                        $sisaHari = $ip->kontrak->sisa_hari;
                        break;
                    }
                }
                
                return [
                    'id'              => $order->id,
                    'nama_project'    => $order->nama_project,
                    'company_name'    => $order->company_name,
                    'customer_name'   => $order->customer_name,
                    'progress'        => $order->progress,
                    'deadline_status' => $deadlineStatus,
                    'sisa_hari'       => $sisaHari,
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
            'moodboard.itemPekerjaans.kontrak.termin',
            'moodboard.itemPekerjaans.invoices',
            'moodboard.commitmentFee',
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

        $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($itemPekerjaan) use ($order) {
            // Total harga untuk 1 item pekerjaan
            $totalHargaItem = $itemPekerjaan->produks->sum('total_harga');

            // Calculate workplan duration if both dates exist
            $workplanDuration = null;
            if ($itemPekerjaan->workplan_start_date && $itemPekerjaan->workplan_end_date) {
                $workplanDuration = $itemPekerjaan->workplan_start_date->diffInDays($itemPekerjaan->workplan_end_date) + 1;
            }

            // ================================
            // 💰 Payment Info for this Item Pekerjaan
            // ================================
            $paymentInfo = $this->getPaymentInfo($itemPekerjaan, $order);

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
                'id'                   => $itemPekerjaan->id,
                'produks'              => $produks,
                'progress'             => $itemPekerjaan->progress,
                'total_harga'          => $totalHargaItem,
                'workplan_start_date'  => $itemPekerjaan->workplan_start_date?->format('Y-m-d'),
                'workplan_end_date'    => $itemPekerjaan->workplan_end_date?->format('Y-m-d'),
                'workplan_duration'    => $workplanDuration,
                'payment_info'         => $paymentInfo,
                // BAST per Item Pekerjaan (bukan per produk)
                'is_completed'         => $itemPekerjaan->is_completed,
                'has_bast'             => $itemPekerjaan->has_bast,
                'bast_number'          => $itemPekerjaan->bast_number,
                'bast_date'            => $itemPekerjaan->bast_date?->format('d M Y'),
                'bast_pdf_path'        => $itemPekerjaan->bast_pdf_path,
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

    public function generateBast($itemPekerjaanId)
    {
        $itemPekerjaan = \App\Models\ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk',
            'produks.stageEvidences',
        ])->findOrFail($itemPekerjaanId);

        // Check if all produks completed Install QC
        $allCompleted = $itemPekerjaan->produks->every(fn($p) => $p->current_stage === 'Install QC');
        if (!$allCompleted) {
            return back()->withErrors(['bast' => 'Semua produk harus selesai Install QC terlebih dahulu']);
        }

        // Check if BAST already exists
        if ($itemPekerjaan->has_bast) {
            return back()->withErrors(['bast' => 'BAST sudah dibuat sebelumnya']);
        }

        // Generate BAST number
        $bastNumber = 'BAST/' . date('Y') . '/' . str_pad($itemPekerjaan->id, 5, '0', STR_PAD_LEFT);

        // Get order info
        $order = $itemPekerjaan->moodboard->order;

        // Get all stage evidences from all produks
        $allStageEvidences = collect();
        foreach ($itemPekerjaan->produks as $produk) {
            $grouped = $produk->stageEvidences->groupBy('stage');
            foreach ($grouped as $stage => $evidences) {
                if (!$allStageEvidences->has($stage)) {
                    $allStageEvidences[$stage] = collect();
                }
                $allStageEvidences[$stage] = $allStageEvidences[$stage]->merge($evidences);
            }
        }

        // Generate PDF
        $data = [
            'bast_number' => $bastNumber,
            'bast_date' => now()->format('d F Y'),
            'order' => $order,
            'item_pekerjaan' => $itemPekerjaan,
            'produks' => $itemPekerjaan->produks,
            'stage_evidences' => $allStageEvidences,
        ];

        $pdf = PDF::loadView('pdf.bast', $data);
        $pdf->setPaper('a4', 'portrait');

        $filename = 'BAST-' . str_replace('/', '-', $bastNumber) . '-' . date('YmdHis') . '.pdf';
        $pdfPath = 'bast/' . $filename;

        // Save PDF to storage
        Storage::disk('public')->put($pdfPath, $pdf->output());

        // Update item pekerjaan with BAST info
        $itemPekerjaan->update([
            'bast_number' => $bastNumber,
            'bast_date' => now(),
            'bast_pdf_path' => $pdfPath,
        ]);

        return back()->with('success', 'BAST berhasil dibuat');
    }

    public function downloadBast($itemPekerjaanId)
    {
        $itemPekerjaan = \App\Models\ItemPekerjaan::findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->bast_pdf_path) {
            return back()->withErrors(['bast' => 'BAST belum dibuat']);
        }

        $filePath = storage_path('app/public/' . $itemPekerjaan->bast_pdf_path);
        
        return response()->download($filePath);
    }

    /**
     * Get payment info for an item pekerjaan
     */
    private function getPaymentInfo($itemPekerjaan, $order)
    {
        $kontrak = $itemPekerjaan->kontrak;
        if (!$kontrak) {
            return null;
        }

        $termin = $kontrak->termin;
        if (!$termin) {
            return null;
        }

        $tahapan = $termin->tahapan ?? [];
        $totalSteps = count($tahapan);

        if ($totalSteps === 0) {
            return null;
        }

        // Get harga kontrak
        $hargaKontrak = (float) ($kontrak->harga_kontrak ?? 0);

        // Get commitment fee from moodboard
        $commitmentFee = $order->moodboard?->commitmentFee;
        $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';

        // Sisa pembayaran = Harga Kontrak - Commitment Fee (if paid)
        $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

        // Get invoices
        $allInvoices = $itemPekerjaan->invoices;
        $paidInvoices = $allInvoices->where('status', 'paid')->sortBy('termin_step');
        $lastPaidStep = $paidInvoices->max('termin_step') ?? 0;
        $totalPaid = (float) $paidInvoices->sum('total_amount');

        // Get unlocked step (default 1 if not set)
        $unlockedStep = $itemPekerjaan->unlocked_step ?? 1;

        // Check if item pekerjaan has BAST (now at item level, not per product)
        $hasBast = $itemPekerjaan->has_bast;

        // Build steps info
        $stepsInfo = [];
        foreach ($tahapan as $index => $tahap) {
            $step = $index + 1;
            $invoice = $allInvoices->firstWhere('termin_step', $step);
            $persentase = (float) ($tahap['persentase'] ?? 0);
            $nominal = $sisaPembayaran * ($persentase / 100);
            $isLastStep = $step === $totalSteps;

            // Determine status
            $status = 'locked';
            $canPay = false;
            $lockedReason = null;

            if ($invoice && $invoice->status === 'paid') {
                $status = 'paid';
            } elseif ($invoice && $invoice->status === 'pending') {
                $status = 'pending';
            } elseif ($isLastStep) {
                // TAHAP TERAKHIR: Otomatis available jika BAST sudah ada & tahap sebelumnya sudah dibayar
                if (!$hasBast) {
                    $status = 'waiting_bast';
                    $lockedReason = 'Menunggu BAST Item Pekerjaan dibuat';
                } elseif ($lastPaidStep < $totalSteps - 1) {
                    // Previous steps not all paid
                    $status = 'locked';
                    $lockedReason = 'Bayar tahap sebelumnya dulu';
                } else {
                    // BAST ada & semua tahap sebelumnya sudah dibayar
                    $status = 'available';
                    $canPay = true;
                }
            } elseif ($step <= $unlockedStep) {
                // Step is unlocked (tahap 1 sampai n-1)
                if ($step > 1 && $lastPaidStep < $step - 1) {
                    // Previous step not paid yet
                    $status = 'locked';
                    $lockedReason = 'Bayar tahap sebelumnya dulu';
                } else {
                    $status = 'available';
                    $canPay = true;
                }
            } else {
                // Step is still locked
                $lockedReason = 'Belum di-unlock';
            }

            $stepsInfo[] = [
                'step' => $step,
                'text' => $tahap['text'] ?? "Tahap $step",
                'persentase' => $persentase,
                'nominal' => $nominal,
                'status' => $status,
                'can_pay' => $canPay,
                'is_last_step' => $isLastStep,
                'locked_reason' => $lockedReason,
                'invoice' => $invoice ? [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'total_amount' => (float) $invoice->total_amount,
                    'status' => $invoice->status,
                    'paid_at' => $invoice->paid_at?->format('d M Y'),
                ] : null,
            ];
        }

        // Determine next step to unlock
        // Tahap terakhir TIDAK perlu di-unlock manual (otomatis setelah BAST)
        $canUnlockNext = false;
        $nextStepToUnlock = null;
        
        // Can unlock next if current unlocked step is paid and next step is NOT the last step
        if ($lastPaidStep >= $unlockedStep && $unlockedStep < $totalSteps - 1) {
            // Next step bukan tahap terakhir, bisa di-unlock manual
            $canUnlockNext = true;
            $nextStepToUnlock = $unlockedStep + 1;
        }

        return [
            'termin_nama' => $termin->nama_tipe ?? 'Termin',
            'total_steps' => $totalSteps,
            'unlocked_step' => $unlockedStep,
            'last_paid_step' => $lastPaidStep,
            'harga_kontrak' => $hargaKontrak,
            'sisa_pembayaran' => $sisaPembayaran,
            'total_paid' => $totalPaid,
            'remaining' => max(0, $sisaPembayaran - $totalPaid),
            'is_fully_paid' => $lastPaidStep >= $totalSteps,
            'has_bast' => $hasBast,
            'can_unlock_next' => $canUnlockNext,
            'next_step_to_unlock' => $nextStepToUnlock,
            'steps' => $stepsInfo,
        ];
    }

    /**
     * Unlock the next payment step (Tagih Pembayaran Selanjutnya)
     */
    public function unlockNextStep(Request $request, $itemPekerjaanId)
    {
        $itemPekerjaan = \App\Models\ItemPekerjaan::with([
            'kontrak.termin',
            'invoices',
            'produks'
        ])->findOrFail($itemPekerjaanId);

        $kontrak = $itemPekerjaan->kontrak;
        if (!$kontrak || !$kontrak->termin) {
            return back()->withErrors(['error' => 'Kontrak atau termin tidak ditemukan']);
        }

        $tahapan = $kontrak->termin->tahapan ?? [];
        $totalSteps = count($tahapan);
        $currentUnlockedStep = $itemPekerjaan->unlocked_step ?? 1;

        // Check if we can unlock next
        if ($currentUnlockedStep >= $totalSteps) {
            return back()->withErrors(['error' => 'Semua tahap sudah di-unlock']);
        }

        // Check if current step is paid
        $paidInvoices = $itemPekerjaan->invoices->where('status', 'paid');
        $lastPaidStep = $paidInvoices->max('termin_step') ?? 0;

        if ($lastPaidStep < $currentUnlockedStep) {
            return back()->withErrors(['error' => 'Tahap saat ini belum dibayar']);
        }

        $nextStep = $currentUnlockedStep + 1;
        $isNextLastStep = $nextStep === $totalSteps;

        // For last step, require BAST (now at item level)
        if ($isNextLastStep) {
            if (!$itemPekerjaan->has_bast) {
                return back()->withErrors(['error' => 'Tahap terakhir memerlukan BAST Item Pekerjaan']);
            }
        }

        // Unlock next step
        $itemPekerjaan->update(['unlocked_step' => $nextStep]);

        $stepText = $tahapan[$nextStep - 1]['text'] ?? "Tahap $nextStep";

        return back()->with('success', "Pembayaran \"$stepText\" berhasil dibuka!");
    }
}
