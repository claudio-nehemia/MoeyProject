<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Invoice;
use App\Models\RabKontrak;
use App\Models\ItemPekerjaan;
use App\Models\JenisItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'moodboard.commitmentFee', // CommitmentFee is on Moodboard
            'rabKontrak.rabKontrakProduks',
            'kontrak.termin',
            'invoices',
            'produks' // For checking BAST status
        ])
            ->whereHas('rabKontrak')
            ->whereHas('kontrak') // Must have kontrak to generate invoices
            ->get()
            ->map(function ($itemPekerjaan) {
                // Get harga kontrak from Kontrak (this is the agreed contract price)
                $hargaKontrak = (float) ($itemPekerjaan->kontrak?->harga_kontrak ?? 0);

                // If no harga kontrak, calculate from RAB Kontrak as fallback
                if ($hargaKontrak <= 0 && $itemPekerjaan->rabKontrak && $itemPekerjaan->rabKontrak->rabKontrakProduks) {
                    $hargaKontrak = (float) $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
                }

                // Get commitment fee from Moodboard
                $commitmentFee = $itemPekerjaan->moodboard?->commitmentFee;
                $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
                $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';

                // Sisa pembayaran = Harga Kontrak - Commitment Fee (if paid)
                $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

                // Get termin info from kontrak
                $termin = $itemPekerjaan->kontrak?->termin;
                $tahapan = $termin?->tahapan ?? [];
                $totalTahap = count($tahapan);

                // Get invoices with status
                $allInvoices = $itemPekerjaan->invoices;
                $paidInvoices = $allInvoices->where('status', 'paid')->sortBy('termin_step');
                $lastPaidStep = $paidInvoices->max('termin_step') ?? 0;
                $currentStep = $lastPaidStep + 1;

                // Check if all products have BAST (required for final payment)
                $allProductsHaveBast = $itemPekerjaan->produks->every(fn($p) => $p->has_bast);

                // Calculate total paid from invoices
                $totalPaidFromInvoices = (float) $paidInvoices->sum('total_amount');

                // Determine which steps are available
                $stepsInfo = [];
                foreach ($tahapan as $index => $tahap) {
                    $step = $index + 1;
                    $invoice = $allInvoices->firstWhere('termin_step', $step);
                    $persentase = (float) ($tahap['persentase'] ?? 0);
                    
                    // Calculate nominal for this step based on sisa pembayaran
                    $nominal = $sisaPembayaran * ($persentase / 100);
                    
                    // Check if this is the last step
                    $isLastStep = $step === $totalTahap;
                    
                    // Determine status
                    $status = 'locked'; // default
                    $canPay = false;
                    $lockedReason = null;

                    if ($invoice) {
                        $status = $invoice->status;
                    } elseif ($step === $currentStep) {
                        // Current step - check if can pay
                        if ($isLastStep && !$allProductsHaveBast) {
                            $status = 'waiting_bast';
                            $lockedReason = 'Menunggu BAST selesai';
                        } else {
                            $status = 'available';
                            $canPay = true;
                        }
                    } elseif ($step < $currentStep) {
                        $status = 'paid'; // Previous steps should be paid
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
                            'bukti_bayar' => $invoice->bukti_bayar ? Storage::url($invoice->bukti_bayar) : null,
                            'paid_at' => $invoice->paid_at?->format('d M Y'),
                        ] : null,
                    ];
                }

                // Progress pembayaran calculation
                $progressPembayaran = $sisaPembayaran > 0 
                    ? round(($totalPaidFromInvoices / $sisaPembayaran) * 100, 2) 
                    : 0;

                // Determine payment status text from last paid termin
                $currentPaymentStatus = 'Belum Bayar';
                if ($currentStep > $totalTahap && $totalTahap > 0) {
                    // All steps completed - use last step text
                    $currentPaymentStatus = $tahapan[$totalTahap - 1]['text'] ?? "Tahap $totalTahap";
                } elseif ($lastPaidStep > 0) {
                    // Show last paid step text
                    $currentPaymentStatus = $tahapan[$lastPaidStep - 1]['text'] ?? "Tahap $lastPaidStep";
                }

                return [
                    'id' => $itemPekerjaan->id,
                    'order' => [
                        'id' => $itemPekerjaan->moodboard->order->id,
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'harga_kontrak' => $hargaKontrak,
                    'commitment_fee' => [
                        'amount' => $commitmentFeeAmount,
                        'paid' => $commitmentFeePaid,
                    ],
                    'sisa_pembayaran' => $sisaPembayaran,
                    'total_paid' => $totalPaidFromInvoices,
                    'remaining_to_pay' => max(0, $sisaPembayaran - $totalPaidFromInvoices),
                    'progress_pembayaran' => $progressPembayaran,
                    'current_payment_status' => $currentPaymentStatus,
                    'termin' => $termin ? [
                        'id' => $termin->id,
                        'nama' => $termin->nama_tipe,
                        'total_tahap' => $totalTahap,
                        'tahapan' => $tahapan,
                    ] : null,
                    'steps_info' => $stepsInfo,
                    'current_step' => $currentStep,
                    'all_products_have_bast' => $allProductsHaveBast,
                    'is_fully_paid' => $currentStep > $totalTahap && $totalTahap > 0,
                ];
            });

        return Inertia::render('Invoice/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function generate(Request $request, $itemPekerjaanId)
    {
        $request->validate([
            'termin_step' => 'required|integer|min:1',
        ]);

        $itemPekerjaan = ItemPekerjaan::with([
            'rabKontrak.rabKontrakProduks',
            'kontrak.termin',
            'moodboard.commitmentFee', // CommitmentFee from moodboard
            'invoices',
            'produks',
            'moodboard.order'
        ])->findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->rabKontrak) {
            return back()->with('error', 'RAB Kontrak belum ada.');
        }

        if (!$itemPekerjaan->kontrak) {
            return back()->with('error', 'Kontrak belum dibuat.');
        }

        $termin = $itemPekerjaan->kontrak->termin;
        if (!$termin) {
            return back()->with('error', 'Termin belum dipilih di kontrak.');
        }

        $tahapan = $termin->tahapan ?? [];
        $requestedStep = $request->termin_step;
        $totalSteps = count($tahapan);

        if ($requestedStep > $totalSteps) {
            return back()->with('error', 'Tahap tidak valid.');
        }

        // Check if invoice for this step already exists
        $existingInvoice = $itemPekerjaan->invoices->firstWhere('termin_step', $requestedStep);
        if ($existingInvoice) {
            return redirect()->route('invoice.show', $existingInvoice->id)
                ->with('info', 'Invoice untuk tahap ini sudah ada.');
        }

        // Check if previous steps are paid
        $paidSteps = $itemPekerjaan->invoices->where('status', 'paid')->pluck('termin_step')->toArray();
        for ($i = 1; $i < $requestedStep; $i++) {
            if (!in_array($i, $paidSteps)) {
                return back()->with('error', "Tahap $i harus dibayar terlebih dahulu.");
            }
        }

        // Check BAST requirement for final step
        $isLastStep = $requestedStep === $totalSteps;
        if ($isLastStep) {
            $allProductsHaveBast = $itemPekerjaan->produks->every(fn($p) => $p->has_bast);
            if (!$allProductsHaveBast) {
                return back()->with('error', 'Semua produk harus memiliki BAST untuk pembayaran tahap akhir.');
            }
        }

        // Calculate amounts using harga kontrak
        $hargaKontrak = (float) ($itemPekerjaan->kontrak->harga_kontrak ?? 0);
        
        // Fallback to RAB if no harga kontrak
        if ($hargaKontrak <= 0) {
            $hargaKontrak = (float) $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        }

        // Get commitment fee from moodboard
        $commitmentFee = $itemPekerjaan->moodboard?->commitmentFee;
        $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';

        // Sisa pembayaran = Harga Kontrak - Commitment Fee (if paid)
        $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

        $tahap = $tahapan[$requestedStep - 1] ?? null;
        $persentase = (float) ($tahap['persentase'] ?? 0);
        $terminText = $tahap['text'] ?? "Tahap $requestedStep";
        $totalAmount = $sisaPembayaran * ($persentase / 100);

        // Generate invoice number
        $year = date('Y');
        $month = date('m');
        $lastInvoice = Invoice::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastInvoice ? (intval(substr($lastInvoice->invoice_number, -4)) + 1) : 1;
        $invoiceNumber = sprintf('INV/%s/%s/%04d', $year, $month, $sequence);

        $invoice = Invoice::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
            'invoice_number' => $invoiceNumber,
            'termin_step' => $requestedStep,
            'termin_text' => $terminText,
            'termin_persentase' => $persentase,
            'total_amount' => $totalAmount,
            'status' => 'pending',
        ]);

        return redirect()->route('invoice.show', $invoice->id)
            ->with('success', "Invoice tahap $requestedStep berhasil di-generate!");
    }

    public function show($invoiceId)
    {
        $invoice = Invoice::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.moodboard.commitmentFee',
            'itemPekerjaan.kontrak.termin',
            'itemPekerjaan.invoices',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($invoiceId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        // Get termin info
        $termin = $invoice->itemPekerjaan->kontrak?->termin;
        $tahapan = $termin?->tahapan ?? [];
        $totalSteps = count($tahapan);

        // Get harga kontrak
        $hargaKontrak = (float) ($invoice->itemPekerjaan->kontrak?->harga_kontrak ?? 0);
        if ($hargaKontrak <= 0) {
            $hargaKontrak = (float) $invoice->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        }

        // Get commitment fee from moodboard
        $commitmentFee = $invoice->itemPekerjaan->moodboard?->commitmentFee;
        $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';

        // Calculate sisa pembayaran
        $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

        // Get all invoices for this item pekerjaan with payment details
        $allInvoices = $invoice->itemPekerjaan->invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'termin_step' => $inv->termin_step,
                'termin_text' => $inv->termin_text,
                'total_amount' => (float) $inv->total_amount,
                'status' => $inv->status,
                'paid_at' => $inv->paid_at?->format('d M Y'),
            ];
        })->sortBy('termin_step')->values();

        // Calculate totals
        $totalPaid = $allInvoices->where('status', 'paid')->sum('total_amount');

        return Inertia::render('Invoice/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'termin_step' => $invoice->termin_step,
                'termin_text' => $invoice->termin_text,
                'termin_persentase' => (float) $invoice->termin_persentase,
                'total_steps' => $totalSteps,
                'total_amount' => (float) $invoice->total_amount,
                'status' => $invoice->status,
                'bukti_bayar' => $invoice->bukti_bayar ? Storage::url($invoice->bukti_bayar) : null,
                'paid_at' => $invoice->paid_at,
                'notes' => $invoice->notes,
                'created_at' => $invoice->created_at,
                'order' => [
                    'nama_project' => $invoice->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $invoice->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $invoice->itemPekerjaan->moodboard->order->customer_name,
                ],
                // Payment summary
                'payment_summary' => [
                    'harga_kontrak' => $hargaKontrak,
                    'commitment_fee' => [
                        'amount' => $commitmentFeeAmount,
                        'paid' => $commitmentFeePaid,
                    ],
                    'sisa_pembayaran' => $sisaPembayaran,
                    'total_paid' => $totalPaid,
                    'remaining_to_pay' => max(0, $sisaPembayaran - $totalPaid),
                ],
                'termin_nama' => $termin?->nama_tipe,
                'all_invoices' => $allInvoices,
                'items' => $invoice->rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id) {
                            $itemsList = [];
                            foreach ($jenisItem->items as $item) {
                                $itemsList[] = [
                                    'nama_item' => $item->item->nama_item,
                                    'qty' => $item->quantity,
                                ];
                            }

                            if (!empty($itemsList)) {
                                $jenisItemsList[] = [
                                    'nama_jenis' => $jenisItem->jenisItem->nama_jenis_item,
                                    'items' => $itemsList,
                                ];
                            }
                        }
                    }

                    return [
                        'nama_produk' => $rabProduk->itemPekerjaanProduk->produk->nama_produk,
                        'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                        'dimensi' => [
                            'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                            'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                            'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                        ],
                        'harga_satuan' => (float) $rabProduk->harga_satuan,
                        'harga_akhir' => (float) $rabProduk->harga_akhir,
                        'jenis_items' => $jenisItemsList,
                        'aksesoris' => $rabProduk->rabKontrakAksesoris->map(function ($aksesoris) {
                            return [
                                'nama_aksesoris' => $aksesoris->itemPekerjaanItem->item->nama_item,
                                'qty_aksesoris' => $aksesoris->qty_aksesoris,
                                'harga_satuan_aksesoris' => (float) $aksesoris->harga_satuan_aksesoris,
                                'harga_total' => (float) $aksesoris->harga_total,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ],
        ]);
    }

    public function uploadBuktiBayar(Request $request, $invoiceId)
    {
        $invoice = Invoice::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.kontrak.termin'
        ])->findOrFail($invoiceId);

        $request->validate([
            'bukti_bayar' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120', // 5MB
        ]);

        DB::transaction(function () use ($request, $invoice) {
            // Delete old bukti bayar if exists
            if ($invoice->bukti_bayar) {
                Storage::delete($invoice->bukti_bayar);
            }

            // Store new bukti bayar
            $path = $request->file('bukti_bayar')->store('bukti-bayar', 'public');

            $invoice->update([
                'bukti_bayar' => $path,
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Update payment_status di Order sesuai tahapan termin
            $order = $invoice->itemPekerjaan->moodboard->order;
            $terminText = $invoice->termin_text;
            
            // Update payment status dengan nama tahapan termin
            $order->update([
                'payment_status' => $terminText,
            ]);
        });

        return back()->with('success', 'Bukti bayar berhasil diupload!');
    }

    public function exportPdf($invoiceId)
    {
        $invoice = Invoice::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.moodboard.commitmentFee',
            'itemPekerjaan.kontrak.termin',
            'itemPekerjaan.invoices',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($invoiceId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        // Get termin info
        $termin = $invoice->itemPekerjaan->kontrak?->termin;
        $tahapan = $termin?->tahapan ?? [];
        $totalSteps = count($tahapan);

        // Get harga kontrak
        $hargaKontrak = (float) ($invoice->itemPekerjaan->kontrak?->harga_kontrak ?? 0);
        if ($hargaKontrak <= 0) {
            $hargaKontrak = (float) $invoice->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        }

        // Get commitment fee from moodboard
        $commitmentFee = $invoice->itemPekerjaan->moodboard?->commitmentFee;
        $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';

        // Calculate sisa pembayaran
        $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

        // Get all invoices for this item pekerjaan
        $allInvoices = $invoice->itemPekerjaan->invoices->map(function ($inv) use ($tahapan) {
            $tahap = $tahapan[$inv->termin_step - 1] ?? null;
            return [
                'id' => $inv->id,
                'termin_step' => $inv->termin_step,
                'termin_text' => $inv->termin_text,
                'termin_persentase' => $inv->termin_persentase ?? ($tahap['persentase'] ?? 0),
                'total_amount' => (float) $inv->total_amount,
                'status' => $inv->status,
                'paid_at' => $inv->paid_at?->format('d M Y'),
            ];
        })->sortBy('termin_step')->values()->toArray();

        // Calculate totals
        $paidInvoices = collect($allInvoices)->where('status', 'paid');
        $totalPaid = $paidInvoices->sum('total_amount');

        // Payment summary data
        $paymentSummary = [
            'harga_kontrak' => $hargaKontrak,
            'commitment_fee' => $commitmentFeeAmount,
            'commitment_fee_paid' => $commitmentFeePaid,
            'sisa_pembayaran' => $sisaPembayaran,
            'total_paid' => $totalPaid,
            'remaining_to_pay' => max(0, $sisaPembayaran - $totalPaid),
        ];

        // Termin info
        $terminInfo = [
            'termin_nama' => $termin?->nama_tipe,
            'total_steps' => $totalSteps,
        ];

        // Prepare data for PDF
        $produks = $invoice->rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
            // NON AKSESORIS
            $jenisItemsList = [];
            $jenisItems = $rabProduk->itemPekerjaanProduk->jenisItems ?? collect([]);

            foreach ($jenisItems as $jenisItem) {
                if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id) {
                    $itemsList = [];
                    $items = $jenisItem->items ?? collect([]);

                    foreach ($items as $item) {
                        $itemsList[] = [
                            'nama_item' => $item->item->nama_item,
                            'qty' => $item->quantity,
                        ];
                    }

                    if (!empty($itemsList)) {
                        $jenisItemsList[] = [
                            'nama_jenis' => $jenisItem->jenisItem->nama_jenis_item,
                            'items' => $itemsList,
                        ];
                    }
                }
            }

            // AKSESORIS
            $aksesorisList = $rabProduk->rabKontrakAksesoris->map(function ($aks) {
                return [
                    'nama_aksesoris' => $aks->itemPekerjaanItem->item->nama_item,
                    'qty_aksesoris' => $aks->qty_aksesoris,
                    'harga_satuan_aksesoris' => (float) $aks->harga_satuan_aksesoris,
                    'harga_total' => (float) $aks->harga_total,
                ];
            });

            return [
                'nama_produk' => $rabProduk->itemPekerjaanProduk->produk->nama_produk,
                'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                'harga_satuan' => (float) $rabProduk->harga_satuan,
                'harga_akhir' => (float) $rabProduk->harga_akhir,
                'jenis_items' => $jenisItemsList,
                'aksesoris' => $aksesorisList,
            ];
        });

        $data = [
            'invoice' => $invoice,
            'produks' => $produks,
            'totalAmount' => (float) $invoice->total_amount,
            'paymentSummary' => $paymentSummary,
            'terminInfo' => $terminInfo,
            'allInvoices' => $allInvoices,
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data);
        $pdf->setPaper('a4', 'portrait');
        $safeInvoiceNumber = str_replace(['/', '\\'], '-', $invoice->invoice_number);

        $filename = 'Invoice-' . $safeInvoiceNumber . '-Tahap' . $invoice->termin_step . '-' . date('YmdHis') . '.pdf';

        return $pdf->download($filename);
    }

    public function destroy($invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        // Only allow deleting pending invoices
        if ($invoice->status === 'paid') {
            return back()->with('error', 'Invoice yang sudah dibayar tidak dapat dihapus.');
        }

        // Delete bukti bayar if exists
        if ($invoice->bukti_bayar) {
            Storage::delete($invoice->bukti_bayar);
        }

        $invoice->delete();

        return redirect()->route('invoice.index')
            ->with('success', 'Invoice berhasil dihapus');
    }
}
