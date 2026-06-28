<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\CashflowManualEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashflowController extends Controller
{
    /**
     * Display list of all projects with cashflow summary
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $statusFilter = $request->input('status', '');

        $query = Order::with([
            'moodboard.itemPekerjaan.kontrak.termin',
            'moodboard.itemPekerjaan.invoices',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks',
            'moodboard.itemPekerjaan.rabVendor.rabVendorProduks',
            'moodboard.itemPekerjaan.rabJasa.rabJasaProduks',
            'moodboard.commitmentFee',
            'users',
        ])
        ->whereHas('moodboard.itemPekerjaan.kontrak');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_project', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        if ($statusFilter) {
            $query->where('payment_status', $statusFilter);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(function ($order) {
                $ip = $order->moodboard?->itemPekerjaan;
                $kontrak = $ip?->kontrak;
                $invoices = $ip?->invoices ?? collect();
                $rabKontrak = $ip?->rabKontrak;
                $rabVendor = $ip?->rabVendor;
                $rabJasa = $ip?->rabJasa;
                $commitmentFee = $order->moodboard?->commitmentFee;

                $hargaKontrak = (float) ($kontrak?->harga_kontrak ?? 0);
                if ($hargaKontrak <= 0 && $rabKontrak) {
                    $hargaKontrak = (float) $rabKontrak->rabKontrakProduks->sum('harga_akhir');
                }

                $totalRabVendor = $rabVendor ? (float) $rabVendor->rabVendorProduks->sum('harga_akhir') : 0;
                $totalRabJasa = $rabJasa ? (float) $rabJasa->rabJasaProduks->sum('harga_akhir') : 0;
                $totalRabKontrak = $rabKontrak ? (float) $rabKontrak->rabKontrakProduks->sum('harga_akhir') : 0;

                // Calculate split using robust helper
                $split = $this->calculateContractSplit($order, $hargaKontrak, $totalRabJasa, $totalRabVendor, $totalRabKontrak);

                $totalPaid = (float) $invoices->where('status', 'paid')->sum('total_amount');
                $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed')
                    ? (float) $commitmentFee->total_fee
                    : 0;
                $totalReceived = $totalPaid + $cmFeePaid;
                $sisaPiutang = $hargaKontrak - $totalReceived;

                $pm = $order->users->first();

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'company_name' => $order->company_name,
                    'payment_status' => $order->payment_status,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'pm_name' => $pm?->name ?? '-',
                    'harga_kontrak' => $hargaKontrak,
                    'kontrak_internal' => $split['internal'],
                    'kontrak_fisik' => $split['fisik'],
                    'kontrak_external' => $split['external'],
                    'total_received' => $totalReceived,
                    'sisa_piutang' => $sisaPiutang,
                    'has_bast' => !empty($ip?->bast_number),
                ];
            });

        return Inertia::render('Cashflow/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Show detailed cashflow for a single project/order
     */
    public function show(Order $order)
    {
        $order->load([
            'moodboard.itemPekerjaan.kontrak.termin',
            'moodboard.itemPekerjaan.invoices',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.itemPekerjaanProduk.produk',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.rabKontrakAksesoris',
            'moodboard.itemPekerjaan.rabVendor.rabVendorProduks.itemPekerjaanProduk.produk',
            'moodboard.itemPekerjaan.rabVendor.rabVendorProduks.rabVendorAksesoris',
            'moodboard.itemPekerjaan.rabJasa.rabJasaProduks.itemPekerjaanProduk.produk',
            'moodboard.itemPekerjaan.rabInternal.rabProduks.itemPekerjaanProduk.produk',
            'moodboard.commitmentFee',
            'users',
        ]);

        $ip = $order->moodboard?->itemPekerjaan;
        $kontrak = $ip?->kontrak;
        $termin = $kontrak?->termin;
        $invoices = $ip?->invoices ?? collect();
        $rabKontrak = $ip?->rabKontrak;
        $rabVendor = $ip?->rabVendor;
        $rabJasa = $ip?->rabJasa;
        $rabInternal = $ip?->rabInternal;
        $commitmentFee = $order->moodboard?->commitmentFee;

        // === KONTRAK VALUES ===
        $hargaKontrak = (float) ($kontrak?->harga_kontrak ?? 0);
        if ($hargaKontrak <= 0 && $rabKontrak) {
            $hargaKontrak = (float) $rabKontrak->rabKontrakProduks->sum('harga_akhir');
        }

        $totalRabKontrak = $rabKontrak ? (float) $rabKontrak->rabKontrakProduks->sum('harga_akhir') : 0;
        $totalRabVendor = $rabVendor ? (float) $rabVendor->rabVendorProduks->sum('harga_akhir') : 0;
        $totalRabJasa = $rabJasa ? (float) $rabJasa->rabJasaProduks->sum('harga_akhir') : 0;
        $totalRabInternal = $rabInternal ? (float) $rabInternal->rabProduks->sum('harga_akhir') : 0;

        // Calculate split using helper
        $split = $this->calculateContractSplit($order, $hargaKontrak, $totalRabJasa, $totalRabVendor, $totalRabKontrak);

        $kontrakInternal = $split['internal'];
        $kontrakFisik = $split['fisik'];
        $kontrakExternal = $split['external'];

        // === TERMIN SCHEDULE & INVOICES ===
        $tahapan = $termin?->tahapan ?? [];
        $cmFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed');
        $sisaPembayaran = $cmFeePaid ? max(0, $hargaKontrak - $cmFeeAmount) : $hargaKontrak;

        $terminSchedule = [];
        foreach ($tahapan as $index => $tahap) {
            $step = $index + 1;
            $invoice = $invoices->firstWhere('termin_step', $step);
            $persentase = (float) ($tahap['persentase'] ?? 0);
            $nominal = $sisaPembayaran * ($persentase / 100);

            $terminSchedule[] = [
                'step' => $step,
                'text' => $tahap['text'] ?? "Termin {$step}",
                'persentase' => $persentase,
                'nominal' => $nominal,
                'invoice' => $invoice ? [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'total_amount' => (float) $invoice->total_amount,
                    'status' => $invoice->status,
                    'paid_at' => $invoice->paid_at?->format('d M Y'),
                    'bukti_bayar' => $invoice->bukti_bayar,
                ] : null,
            ];
        }

        $totalPaidInvoices = (float) $invoices->where('status', 'paid')->sum('total_amount');
        $totalReceived = $totalPaidInvoices + ($cmFeePaid ? $cmFeeAmount : 0);
        $sisaPiutang = $hargaKontrak - $totalReceived;

        // === DETAIL ITEMS PER SECTION ===
        $internalItems = [];
        if ($rabKontrak) {
            foreach ($rabKontrak->rabKontrakProduks as $rkp) {
                $produk = $rkp->itemPekerjaanProduk?->produk;
                $vendorPrice = 0;
                $jasaPrice = 0;

                if ($rabVendor) {
                    $vp = $rabVendor->rabVendorProduks
                        ->firstWhere('item_pekerjaan_produk_id', $rkp->item_pekerjaan_produk_id);
                    $vendorPrice = $vp ? (float) $vp->harga_akhir : 0;
                }
                if ($rabJasa) {
                    $jp = $rabJasa->rabJasaProduks
                        ->firstWhere('item_pekerjaan_produk_id', $rkp->item_pekerjaan_produk_id);
                    $jasaPrice = $jp ? (float) $jp->harga_akhir : 0;
                }

                $kontrakPrice = (float) $rkp->harga_akhir;
                $internalPrice = $kontrakPrice - $vendorPrice - $jasaPrice;

                $internalItems[] = [
                    'produk_name' => $produk?->nama_produk ?? 'Unknown',
                    'harga_kontrak' => $kontrakPrice,
                    'harga_vendor' => $vendorPrice,
                    'harga_jasa' => $jasaPrice,
                    'harga_internal' => $internalPrice,
                ];
            }
        }

        $externalItems = [];
        if ($rabVendor) {
            foreach ($rabVendor->rabVendorProduks as $rvp) {
                $produk = $rvp->itemPekerjaanProduk?->produk;
                $aksesorisTotal = $rvp->rabVendorAksesoris
                    ? (float) $rvp->rabVendorAksesoris->sum('harga_total')
                    : 0;

                $externalItems[] = [
                    'produk_name' => $produk?->nama_produk ?? 'Unknown',
                    'harga_akhir' => (float) $rvp->harga_akhir,
                    'harga_aksesoris' => $aksesorisTotal,
                ];
            }
        }

        $fisikItems = [];
        if ($rabJasa) {
            foreach ($rabJasa->rabJasaProduks as $rjp) {
                $produk = $rjp->itemPekerjaanProduk?->produk;
                $fisikItems[] = [
                    'produk_name' => $produk?->nama_produk ?? 'Unknown',
                    'harga_akhir' => (float) $rjp->harga_akhir,
                ];
            }
        }

        // === MANUAL ENTRIES ===
        $manualEntries = CashflowManualEntry::where('order_id', $order->id)
            ->with('creator:id,name')
            ->orderBy('section')
            ->orderBy('category')
            ->orderBy('created_at')
            ->get()
            ->map(fn($entry) => [
                'id' => $entry->id,
                'category' => $entry->category,
                'label' => $entry->label,
                'amount_estimasi' => (float) $entry->amount_estimasi,
                'amount_realisasi' => (float) $entry->amount_realisasi,
                'tanggal' => $entry->tanggal?->format('Y-m-d'),
                'notes' => $entry->notes,
                'section' => $entry->section,
                'phase' => $entry->phase,
                'created_by_name' => $entry->creator?->name ?? '-',
                'created_at' => $entry->created_at->format('d M Y H:i'),
            ]);

        // Filter out contract overrides from the general list (since they are shown in contract breakdown)
        $displayManualEntries = $manualEntries->filter(function($entry) {
            return !in_array($entry['category'], ['kontrak_internal', 'kontrak_fisik', 'kontrak_external']);
        });

        // Calculate Realisasi Costs from Manual Entries (like SPK Fix / Pembayaran Vendor Fix)
        // SPK Internal Fix: manual entries under section internal
        // SPK Fisik Fix: manual entries under section fisik
        // SPK External Fix: manual entries under section external
        $realisasiInternal = $displayManualEntries->where('section', 'internal')->sum('amount_realisasi');
        $realisasiFisik = $displayManualEntries->where('section', 'fisik')->sum('amount_realisasi');
        $realisasiExternal = $displayManualEntries->where('section', 'external')->sum('amount_realisasi');
        $realisasiGeneral = $displayManualEntries->where('section', 'general')->sum('amount_realisasi');

        // Total Estimasi Cost
        $estimasiCostTotal = $totalRabVendor + $totalRabJasa + $displayManualEntries->sum('amount_estimasi');
        // Total Realisasi Cost
        $realisasiCostTotal = $realisasiInternal + $realisasiFisik + $realisasiExternal + $realisasiGeneral;

        // === MARGIN CALCULATIONS ===
        // Estimasi Margin = Total Kontrak - Estimasi Cost (RAB + Manual Estimasi)
        $estimasiMargin = $hargaKontrak - $estimasiCostTotal;
        $estimasiMarginPercentage = $hargaKontrak > 0 ? round(($estimasiMargin / $hargaKontrak) * 100, 2) : 0;

        // Realisasi Margin = Total Kontrak - Realisasi Cost
        $realisasiMargin = $hargaKontrak - $realisasiCostTotal;
        $realisasiMarginPercentage = $hargaKontrak > 0 ? round(($realisasiMargin / $hargaKontrak) * 100, 2) : 0;

        // Total Efisiensi = Estimasi Cost - Realisasi Cost
        $totalEfisiensi = $estimasiCostTotal - $realisasiCostTotal;

        // Group Manual Entries for UI display
        $manualBySection = [
            'internal' => $displayManualEntries->where('section', 'internal')->values(),
            'fisik' => $displayManualEntries->where('section', 'fisik')->values(),
            'external' => $displayManualEntries->where('section', 'external')->values(),
            'general' => $displayManualEntries->where('section', 'general')->values(),
        ];

        $manualTotalsEstimasi = [
            'internal' => $displayManualEntries->where('section', 'internal')->sum('amount_estimasi'),
            'fisik' => $displayManualEntries->where('section', 'fisik')->sum('amount_estimasi'),
            'external' => $displayManualEntries->where('section', 'external')->sum('amount_estimasi'),
            'general' => $displayManualEntries->where('section', 'general')->sum('amount_estimasi'),
        ];

        $manualTotalsRealisasi = [
            'internal' => $realisasiInternal,
            'fisik' => $realisasiFisik,
            'external' => $realisasiExternal,
            'general' => $realisasiGeneral,
        ];

        $pm = $order->users->first();

        return Inertia::render('Cashflow/Show', [
            'order' => [
                'id' => $order->id,
                'nama_project' => $order->nama_project,
                'customer_name' => $order->customer_name,
                'company_name' => $order->company_name,
                'payment_status' => $order->payment_status,
                'tahapan_proyek' => $order->tahapan_proyek,
                'pm_name' => $pm?->name ?? '-',
            ],
            'kontrak' => [
                'harga_kontrak' => $hargaKontrak,
                'kontrak_internal' => $kontrakInternal,
                'kontrak_fisik' => $kontrakFisik,
                'kontrak_external' => $kontrakExternal,
                'durasi' => $kontrak?->durasi_kontrak,
                'tanggal_mulai' => $kontrak?->tanggal_mulai?->format('d M Y'),
                'tanggal_selesai' => $kontrak?->tanggal_selesai?->format('d M Y'),
                'signed_at' => $kontrak?->signed_at?->format('d M Y'),
                'overrides' => $split['overrides'],
            ],
            'pembayaran' => [
                'commitment_fee' => [
                    'amount' => $cmFeeAmount,
                    'paid' => $cmFeePaid,
                ],
                'termin_schedule' => $terminSchedule,
                'total_received' => $totalReceived,
                'sisa_piutang' => $sisaPiutang,
                'sisa_pembayaran' => $sisaPembayaran,
            ],
            'margin_summary' => [
                'total_rab_kontrak' => $totalRabKontrak,
                'total_rab_vendor' => $totalRabVendor,
                'total_rab_jasa' => $totalRabJasa,
                'total_rab_internal' => $totalRabInternal,
                'estimasi_margin' => $estimasiMargin,
                'estimasi_margin_percentage' => $estimasiMarginPercentage,
                'realisasi_margin' => $realisasiMargin,
                'realisasi_margin_percentage' => $realisasiMarginPercentage,
                'total_efisiensi' => $totalEfisiensi,
            ],
            'detail_items' => [
                'internal' => $internalItems,
                'fisik' => $fisikItems,
                'external' => $externalItems,
            ],
            'manual_entries' => $manualBySection,
            'manual_totals_estimasi' => $manualTotalsEstimasi,
            'manual_totals_realisasi' => $manualTotalsRealisasi,
            'bast' => [
                'number' => $ip?->bast_number,
                'date' => $ip?->bast_date?->format('d M Y'),
                'has_bast' => !empty($ip?->bast_number),
            ],
        ]);
    }

    /**
     * Helper to calculate contract split dynamically or from manual overrides
     */
    private function calculateContractSplit($order, $hargaKontrak, $totalRabJasa, $totalRabVendor, $totalRabKontrak)
    {
        $overrides = CashflowManualEntry::where('order_id', $order->id)
            ->whereIn('category', ['kontrak_internal', 'kontrak_fisik', 'kontrak_external'])
            ->get();

        $kontrakFisikOverride = $overrides->firstWhere('category', 'kontrak_fisik');
        $kontrakExternalOverride = $overrides->firstWhere('category', 'kontrak_external');
        $kontrakInternalOverride = $overrides->firstWhere('category', 'kontrak_internal');

        $defaultFisik = $totalRabJasa;
        $defaultExternal = $totalRabVendor;
        $defaultInternal = max(0, $hargaKontrak - $defaultFisik - $defaultExternal);

        if ($defaultFisik + $defaultExternal > $hargaKontrak && $hargaKontrak > 0) {
            $ratioFisik = $totalRabJasa / ($totalRabJasa + $totalRabVendor ?: 1);
            $ratioExternal = $totalRabVendor / ($totalRabJasa + $totalRabVendor ?: 1);
            
            $defaultInternal = $hargaKontrak * 0.2;
            $remaining = $hargaKontrak * 0.8;
            $defaultFisik = $remaining * $ratioFisik;
            $defaultExternal = $remaining * $ratioExternal;
        }

        $kontrakFisik = $kontrakFisikOverride ? (float) $kontrakFisikOverride->amount_estimasi : $defaultFisik;
        $kontrakExternal = $kontrakExternalOverride ? (float) $kontrakExternalOverride->amount_estimasi : $defaultExternal;
        $kontrakInternal = $kontrakInternalOverride ? (float) $kontrakInternalOverride->amount_estimasi : $defaultInternal;

        return [
            'internal' => $kontrakInternal,
            'fisik' => $kontrakFisik,
            'external' => $kontrakExternal,
            'overrides' => [
                'internal' => $kontrakInternalOverride ? (float) $kontrakInternalOverride->amount_estimasi : null,
                'fisik' => $kontrakFisikOverride ? (float) $kontrakFisikOverride->amount_estimasi : null,
                'external' => $kontrakExternalOverride ? (float) $kontrakExternalOverride->amount_estimasi : null,
            ]
        ];
    }

    /**
     * Store a new manual entry
     */
    public function storeManualEntry(Request $request, Order $order)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'label' => 'required|string|max:255',
            'amount_estimasi' => 'required|numeric',
            'amount_realisasi' => 'required|numeric',
            'tanggal' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'section' => 'required|in:internal,fisik,external,general',
            'phase' => 'required|in:dp,termin,pelunasan,general',
        ]);

        $validated['order_id'] = $order->id;
        $validated['created_by'] = auth()->id();

        CashflowManualEntry::create($validated);

        return back()->with('success', 'Entry berhasil ditambahkan');
    }

    /**
     * Update a manual entry
     */
    public function updateManualEntry(Request $request, CashflowManualEntry $entry)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'label' => 'required|string|max:255',
            'amount_estimasi' => 'required|numeric',
            'amount_realisasi' => 'required|numeric',
            'tanggal' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'section' => 'required|in:internal,fisik,external,general',
            'phase' => 'required|in:dp,termin,pelunasan,general',
        ]);

        $entry->update($validated);

        return back()->with('success', 'Entry berhasil diupdate');
    }

    /**
     * Delete a manual entry
     */
    public function deleteManualEntry(CashflowManualEntry $entry)
    {
        $entry->delete();

        return back()->with('success', 'Entry berhasil dihapus');
    }
}
