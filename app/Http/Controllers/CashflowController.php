<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\JenisItem;
use App\Models\CashflowManualEntry;
use App\Models\CashflowVendorEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DailyPaymentsExport;
use App\Exports\ProjectVendorPaymentsExport;

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
            'moodboard.itemPekerjaan.rabInternal.rabProduks.itemPekerjaanProduk.bahanBakus.item',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item',
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
                $invoices = $ip?->invoices ?? collect();
                $commitmentFee = $order->moodboard?->commitmentFee;

                $split = $this->getContractSplit($order);

                $totalPaid = (float) $invoices->where('status', 'paid')->sum('total_amount');
                $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed')
                    ? (float) $commitmentFee->total_fee
                    : 0;
                $totalReceived = $totalPaid + $cmFeePaid;
                $sisaPiutang = $split['total'] - $totalReceived;

                $pm = $order->users->first();

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'company_name' => $order->company_name,
                    'payment_status' => $order->payment_status,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'pm_name' => $pm?->name ?? '-',
                    'harga_kontrak' => $split['total'],
                    'kontrak_internal' => $split['internal'],
                    'kontrak_fisik' => $split['fisik'],
                    'kontrak_external' => $split['eksternal'],
                    'total_received' => $totalReceived,
                    'sisa_piutang' => $sisaPiutang,
                    'has_bast' => !empty($ip?->bast_number),
                    'status_project' => round($this->calculateStatusProject($order, $split['total'], $totalReceived)),
                ];
            });

        $totalHutang = 0;
        $vendorEntries = CashflowVendorEntry::all();
        foreach ($vendorEntries as $entry) {
            if ($entry->section === 'pembayaran_vendor') {
                $totalHutang += max(0, $entry->nilai - $entry->pembayaran - $entry->pembayaran_termin);
            } elseif ($entry->section === 'item_external') {
                $totalHutang += max(0, $entry->spk_amount - $entry->pembayaran - $entry->pembayaran_termin);
            } else {
                $totalVal = $entry->spk_amount > 0 ? $entry->spk_amount : $entry->nilai;
                $totalHutang += max(0, $totalVal - $entry->pembayaran);
            }
        }

        $rawEntries = CashflowVendorEntry::with('order')
            ->whereNotNull('tanggal_pembayaran')
            ->orWhereNotNull('tanggal_pembayaran_termin')
            ->get();

        $dailyPayments = [];
        foreach ($rawEntries as $entry) {
            if (!$entry->order) continue;

            if ($entry->tanggal_pembayaran) {
                $dailyPayments[] = [
                    'id' => $entry->id . '-dp',
                    'entry_id' => $entry->id,
                    'project_id' => $entry->order_id,
                    'project_name' => $entry->order->nama_project,
                    'vendor_type' => $entry->vendor_type,
                    'category' => $entry->section,
                    'label' => $entry->label ?: 'DP / Pembayaran Utama',
                    'vendor_name' => $entry->vendor_name ?: '-',
                    'type' => 'DP / Pembayaran',
                    'amount' => (float) $entry->pembayaran,
                    'date' => $entry->tanggal_pembayaran->format('Y-m-d'),
                    'flag_af' => $entry->flag_af,
                    'flag_fb' => $entry->flag_fb,
                    'flag_jw' => $entry->flag_jw,
                ];
            }

            if ($entry->tanggal_pembayaran_termin) {
                $dailyPayments[] = [
                    'id' => $entry->id . '-termin',
                    'entry_id' => $entry->id,
                    'project_id' => $entry->order_id,
                    'project_name' => $entry->order->nama_project,
                    'vendor_type' => $entry->vendor_type,
                    'category' => $entry->section,
                    'label' => $entry->label ?: 'Termin Pembayaran',
                    'vendor_name' => $entry->vendor_name ?: '-',
                    'type' => 'Termin',
                    'amount' => (float) $entry->pembayaran_termin,
                    'date' => $entry->tanggal_pembayaran_termin->format('Y-m-d'),
                    'flag_af' => $entry->flag_af_termin,
                    'flag_fb' => $entry->flag_fb_termin,
                    'flag_jw' => $entry->flag_jw_termin,
                ];
            }
        }

        usort($dailyPayments, function($a, $b) {
            return strcmp($b['date'], $a['date']);
        });

        $upcomingPayments = [];
        foreach ($dailyPayments as $item) {
            if (empty($item['flag_fb']) || empty($item['flag_jw'])) {
                $upcomingPayments[] = $item;
            }
        }
        usort($upcomingPayments, function($a, $b) {
            return strcmp($a['date'], $b['date']);
        });

        return Inertia::render('Cashflow/Index', [
            'orders' => $orders,
            'total_hutang' => round($totalHutang),
            'daily_payments' => $dailyPayments,
            'upcoming_payments' => $upcomingPayments,
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
            'moodboard.itemPekerjaan.rabInternal.rabProduks.itemPekerjaanProduk.bahanBakus.item',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'moodboard.itemPekerjaan.rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item',
            'moodboard.commitmentFee',
            'users',
        ]);

        $ip = $order->moodboard?->itemPekerjaan;
        $kontrak = $ip?->kontrak;
        $termin = $kontrak?->termin;
        $invoices = $ip?->invoices ?? collect();
        $commitmentFee = $order->moodboard?->commitmentFee;

        // Initialize defaults if they do not exist
        $this->initializeDefaultVendorEntries($order);

        // Fetch all vendor entries
        $vendorEntries = CashflowVendorEntry::where('order_id', $order->id)->orderBy('sort_order')->orderBy('id')->get();

        // ═══════════════════════════════════════
        // BAGIAN 1: CUSTOMER (Kontrak split)
        // ═══════════════════════════════════════
        $split = $this->getContractSplit($order);

        // ═══════════════════════════════════════
        // FETCH ALL MANUAL ENTRIES for this order
        // ═══════════════════════════════════════
        $manualEntries = CashflowManualEntry::where('order_id', $order->id)->get()->keyBy('category');

        $getManual = function ($category, $field = 'amount_estimasi') use ($manualEntries) {
            $entry = $manualEntries->get($category);
            return $entry ? (float) $entry->{$field} : 0;
        };

        // ═══════════════════════════════════════
        // BAGIAN 3: SPK VENDOR
        // ═══════════════════════════════════════
        $spkInternal = $getManual('spk_internal');
        $spkFisik = $getManual('spk_fisik');
        $spkExternal = $getManual('spk_external');

        $spkInternalFix = $getManual('spk_internal_fix');
        $upgradeMaterial = $getManual('upgrade_material');
        $spkFisikFix = $getManual('spk_fisik_fix');
        $spkExternalFix = $getManual('spk_external_fix');

        $saldoEfisiensiInternal = $spkInternalFix > 0 ? $spkInternal - $spkInternalFix : 0;
        $saldoEfisiensiFisik = $spkFisikFix > 0 ? $spkFisik - $spkFisikFix : 0;
        $saldoEfisiensiExternal = $spkExternalFix > 0 ? $spkExternal - $spkExternalFix : 0;

        $totalSpkFix = $spkInternalFix + $spkFisikFix + $spkExternalFix;
        $totalSaldoEfisiensi = $saldoEfisiensiInternal + $saldoEfisiensiFisik + $saldoEfisiensiExternal;

        // ═══════════════════════════════════════
        // DYNAMIC VENDOR ENTRIES & CALCULATIONS
        // ═══════════════════════════════════════
        // A. Vendor Internal Main Entries
        $internalMain = $vendorEntries->where('vendor_type', 'internal')->where('section', 'pembayaran_vendor')->sortBy('sort_order');
        $totalMaterialInternalNilai = $vendorEntries->where('vendor_type', 'internal')->where('section', 'material_hutang')->sum('nilai');
        $totalMaterialInternalPembayaran = $vendorEntries->where('vendor_type', 'internal')->where('section', 'material_hutang')->sum('pembayaran');

        $internalMainFormatted = [];
        $sumMainNilaiExceptPelunasan = 0;
        $sumMainPembayaranExceptPelunasan = 0;

        foreach ($internalMain as $entry) {
            if ($entry->notes !== 'pelunasan') {
                if ($entry->persentase !== null && $entry->persentase > 0) {
                    $entryNilai = $spkInternalFix * ($entry->persentase / 100);
                } else {
                    $entryNilai = $entry->nilai;
                }
                $sumMainNilaiExceptPelunasan += $entryNilai;
                $sumMainPembayaranExceptPelunasan += $entry->pembayaran;
            }
        }

        $pelunasanInternalNilai = $spkInternalFix - $sumMainNilaiExceptPelunasan - $totalMaterialInternalNilai;
        if ($pelunasanInternalNilai < 0) $pelunasanInternalNilai = 0;

        foreach ($internalMain as $entry) {
            $entryNilai = 0;
            $calculatedPct = 0;
            if ($entry->notes === 'pelunasan') {
                $entryNilai = $pelunasanInternalNilai;
                $calculatedPct = $spkInternalFix > 0 ? ($pelunasanInternalNilai / $spkInternalFix) * 100 : 0;
            } else {
                if ($entry->persentase !== null && $entry->persentase > 0) {
                    $entryNilai = $spkInternalFix * ($entry->persentase / 100);
                    $calculatedPct = $entry->persentase;
                } else {
                    $entryNilai = $entry->nilai;
                    $calculatedPct = $spkInternalFix > 0 ? ($entry->nilai / $spkInternalFix) * 100 : 0;
                }
            }
            $internalMainFormatted[] = [
                'id' => $entry->id,
                'label' => $entry->label,
                'persentase' => round($calculatedPct, 2),
                'nilai' => round($entryNilai),
                'pembayaran' => $entry->pembayaran,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'pembayaran_termin' => $entry->pembayaran_termin,
                'tanggal_pembayaran_termin' => $entry->tanggal_pembayaran_termin ? $entry->tanggal_pembayaran_termin->format('Y-m-d') : null,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
                'flag_af_termin' => $entry->flag_af_termin,
                'flag_fb_termin' => $entry->flag_fb_termin,
                'flag_jw_termin' => $entry->flag_jw_termin,
                'notes' => $entry->notes ?: 'dp',
            ];
        }

        $totalPembayaranMainInternal = $internalMain->sum('pembayaran') + $internalMain->sum('pembayaran_termin');
        $realisasiInternal = $totalPembayaranMainInternal + $totalMaterialInternalPembayaran;
        $statusPoInternal = ($totalMaterialInternalNilai < $spkInternalFix * 0.35) ? 'Bisa PO' : 'Tidak Bisa PO';

        // B. Vendor Fisik Main Entries
        $fisikMain = $vendorEntries->where('vendor_type', 'fisik')->where('section', 'pembayaran_vendor')->sortBy('sort_order');
        $totalMaterialFisikNilai = $vendorEntries->where('vendor_type', 'fisik')->where('section', 'material_hutang')->sum('nilai');
        $totalMaterialFisikPembayaran = $vendorEntries->where('vendor_type', 'fisik')->where('section', 'material_hutang')->sum('pembayaran');

        $fisikMainFormatted = [];
        $totalFisikMainPembayaran = 0;
        $dpFisik = 0;
        $terminFisik = 0;
        $pelunasanFisik = 0;

        foreach ($fisikMain as $entry) {
            $entryNilai = $spkFisikFix * ($entry->persentase / 100);
            $totalFisikMainPembayaran += ($entry->pembayaran + $entry->pembayaran_termin);

            if ($entry->notes === 'dp' || ($entry->notes === null && $entry->label === 'DP')) {
                $dpFisik += $entry->pembayaran;
            } 
            
            // Add pembayaran_termin to termin phase
            $terminFisik += $entry->pembayaran_termin;

            if ($entry->notes === 'termin' || ($entry->notes === null && $entry->label === 'Termin II')) {
                $terminFisik += $entry->pembayaran;
            } elseif ($entry->notes === 'pelunasan' || ($entry->notes === null && $entry->label === 'Pelunasan')) {
                $pelunasanFisik += $entry->pembayaran;
            }

            $fisikMainFormatted[] = [
                'id' => $entry->id,
                'label' => $entry->label,
                'persentase' => $entry->persentase,
                'nilai' => round($entryNilai),
                'pembayaran' => $entry->pembayaran,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'pembayaran_termin' => $entry->pembayaran_termin,
                'tanggal_pembayaran_termin' => $entry->tanggal_pembayaran_termin ? $entry->tanggal_pembayaran_termin->format('Y-m-d') : null,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
                'flag_af_termin' => $entry->flag_af_termin,
                'flag_fb_termin' => $entry->flag_fb_termin,
                'flag_jw_termin' => $entry->flag_jw_termin,
                'notes' => $entry->notes ?: 'dp',
            ];
        }

        $budgetMaterialFisik = $spkFisikFix - $totalFisikMainPembayaran;
        $sisaBudgetMaterialFisik = $budgetMaterialFisik - $totalMaterialFisikPembayaran;
        $realisasiFisik = $totalFisikMainPembayaran + $totalMaterialFisikPembayaran;

        // C. Vendor External
        $externalItems = $this->getExternalEntries($order, 'item_external');
        $externalAddendums = $this->getExternalEntries($order, 'addendum_external');
        $externalPengeluaranLuar = $this->getExternalEntries($order, 'pengeluaran_luar');

        $totalDpExternal = $vendorEntries->where('vendor_type', 'external')->where('section', 'item_external')->sum('pembayaran');
        $totalTerminExternal = $vendorEntries->where('vendor_type', 'external')->where('section', 'item_external')->sum('pembayaran_termin');
        $totalAddendumExternalPembayaran = $vendorEntries->where('vendor_type', 'external')->where('section', 'addendum_external')->sum('pembayaran');
        $totalPengeluaranLuarPembayaran = $vendorEntries->where('vendor_type', 'external')->where('section', 'pengeluaran_luar')->sum('pembayaran');

        $realisasiExternal = $totalDpExternal + $totalTerminExternal;
        $realisasiAddendum = $totalAddendumExternalPembayaran + $totalPengeluaranLuarPembayaran;

        // ═══════════════════════════════════════
        // REALISASI SUMMARY & PROJECT STATUS
        // ═══════════════════════════════════════
        $sisaSaldoInternal = $spkInternal - $realisasiInternal;
        $sisaSaldoFisik = $spkFisik - $realisasiFisik;
        $sisaSaldoExternal = $spkExternal - $realisasiExternal;
        $totalRealisasi = $realisasiInternal + $realisasiFisik + $realisasiExternal + $realisasiAddendum;

        // ═══════════════════════════════════════
        // BAGIAN 2: PEMBAYARAN (DP, Termin, Pelunasan)
        // ═══════════════════════════════════════
        $tahapan = $termin?->tahapan ?? [];
        $pembayaranDp = 0;
        $pembayaranTermin = 0;
        $pembayaranPelunasan = 0;
        $pctDp = 0;
        $pctTermin = 0;
        $pctPelunasan = 0;
        $tglDp = null;
        $tglTermin = null;
        $tglPelunasan = null;

        // Paid invoices sorted by date
        $paidInvoices = $invoices->where('status', 'paid')->sortBy('paid_at');
        $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed') ? (float) $commitmentFee->total_fee : 0;

        if (is_array($tahapan)) {
            foreach ($tahapan as $idx => $t) {
                $pct = isset($t['persentase']) ? (float) $t['persentase'] : 0;
                if ($idx === 0) {
                    $pctDp = $pct;
                } elseif ($idx === count($tahapan) - 1) {
                    $pctPelunasan = $pct;
                } else {
                    $pctTermin += $pct;
                }
            }
        }

        // If we have percentages, calculate projections
        $proyeksiDp = $split['total'] * ($pctDp / 100);
        $proyeksiTermin = $split['total'] * ($pctTermin / 100);
        $proyeksiPelunasan = $split['total'] * ($pctPelunasan / 100);

        // Actual payments from invoices
        $paidInvoicesList = $paidInvoices->values();
        if ($paidInvoicesList->count() > 0) {
            $pembayaranDp = (float) $paidInvoicesList->get(0)?->total_amount ?? 0;
            $tglDp = $paidInvoicesList->get(0)?->paid_at;
        }
        if ($paidInvoicesList->count() > 1) {
            $pembayaranTermin = (float) $paidInvoicesList->get(1)?->total_amount ?? 0;
            $tglTermin = $paidInvoicesList->get(1)?->paid_at;
        }
        if ($paidInvoicesList->count() > 2) {
            $pembayaranPelunasan = (float) $paidInvoicesList->get(2)?->total_amount ?? 0;
            $tglPelunasan = $paidInvoicesList->get(2)?->paid_at;
        }

        $pembayaranDp += $cmFeePaid;
        $totalDiterima = $pembayaranDp + $pembayaranTermin + $pembayaranPelunasan;
        $sisaPiutang = $split['total'] - $totalDiterima;

        // ═══════════════════════════════════════
        // BAGIAN 5: ESTIMASI MARGIN
        // ═══════════════════════════════════════
        $targetInternal = $split['internal'] - $spkInternal;
        $targetFisik = $split['fisik'] - $spkFisik;
        $targetExternal = $split['eksternal'] - $spkExternal;
        $totalTargetMargin = $targetInternal + $targetFisik + $targetExternal;

        $pctTargetInternal = $split['internal'] > 0 ? $targetInternal / $split['internal'] : 0;
        $pctTargetFisik = $split['fisik'] > 0 ? $targetFisik / $split['fisik'] : 0;
        $pctTargetExternal = $split['eksternal'] > 0 ? $targetExternal / $split['eksternal'] : 0;
        $pctTotalMargin = $split['total'] > 0 ? $totalTargetMargin / $split['total'] : 0;

        $marginBase = ($pctTargetInternal <= 0.30) ? $targetInternal : (0.30 * $split['internal']);

        // Load dynamic Margin Breakdown entries
        $breakdownEntries = CashflowManualEntry::where('order_id', $order->id)
            ->where('category', 'margin_breakdown')
            ->orderBy('id')
            ->get();

        $breakdownData = [];
        if ($breakdownEntries->isEmpty()) {
            $breakdownData = [
                ['label' => 'Budget Digital Marketing', 'pct' => 10.0, 'base' => 'internal_margin'],
                ['label' => 'Operasional', 'pct' => 6.0, 'base' => 'internal_margin'],
                ['label' => 'Cadangan Overhead', 'pct' => 17.0, 'base' => 'internal_margin'],
                ['label' => 'Entertaint', 'pct' => 2.0, 'base' => 'internal_margin'],
                ['label' => 'Gaji', 'pct' => 5.0, 'base' => 'fisik_eksternal'],
                ['label' => 'Cadangan Problem Proyek', 'pct' => 3.0, 'base' => 'fisik_eksternal'],
            ];
        } else {
            foreach ($breakdownEntries as $entry) {
                $breakdownData[] = [
                    'label' => $entry->label,
                    'pct' => (float) $entry->amount_estimasi,
                    'base' => $entry->notes ?: 'internal_margin',
                ];
            }
        }

        $totalBreakdownAmount = 0;
        foreach ($breakdownData as &$item) {
            $amount = 0;
            $pctVal = $item['pct'];
            $baseVal = $item['base'];

            if ($baseVal === 'internal_margin') {
                $amount = $marginBase * ($pctVal / 100);
            } elseif ($baseVal === 'fisik_eksternal') {
                $amount = ($split['fisik'] + $split['eksternal']) * ($pctVal / 100);
            } elseif ($baseVal === 'total_kontrak') {
                $amount = $split['total'] * ($pctVal / 100);
            } elseif ($baseVal === 'fixed') {
                $amount = $pctVal;
            }
            $item['amount'] = round($amount);
            $totalBreakdownAmount += $amount;
        }
        unset($item);

        // Fee Team
        $feeTeamMembers = CashflowManualEntry::where('order_id', $order->id)
            ->where('category', 'fee_team')
            ->orderBy('id')
            ->get();

        $totalFeeTeam = 0;
        $feeTeamData = [];
        if ($feeTeamMembers->isEmpty()) {
            $defaultFees = [
                ['label' => 'Designer 1', 'pct' => 7.35, 'type' => 'percentage'],
                ['label' => 'Lead Designer', 'pct' => 0, 'formula' => 'designer1/4', 'type' => 'formula'],
                ['label' => 'Estimator', 'pct' => 4.85, 'type' => 'percentage'],
                ['label' => 'PM', 'pct' => 3.10, 'type' => 'percentage'],
                ['label' => 'SPV1', 'pct' => 4.40, 'type' => 'percentage'],
                ['label' => 'Transport SPV', 'pct' => 1.00, 'type' => 'percentage'],
                ['label' => 'Drafter', 'pct' => 2.13, 'type' => 'percentage'],
                ['label' => 'Fibri', 'pct' => 3.00, 'type' => 'percentage'],
                ['label' => 'Surveyor As Marketing', 'pct' => 0, 'fixed' => 1000000, 'type' => 'fixed'],
                ['label' => 'Fee External', 'pct' => 0, 'formula' => 'target_ext_10pct', 'type' => 'formula'],
                ['label' => 'Manager Marketing', 'pct' => 1.83, 'type' => 'percentage'],
                ['label' => 'Fee Marketing', 'pct' => 6.67, 'type' => 'percentage'],
            ];

            foreach ($defaultFees as $fee) {
                $amount = 0;
                if ($fee['type'] === 'fixed') {
                    $amount = $fee['fixed'];
                } elseif ($fee['type'] === 'formula') {
                    if ($fee['formula'] === 'designer1/4') {
                        $designer1 = $marginBase * (7.35 / 100);
                        $amount = $designer1 / 4;
                    } elseif ($fee['formula'] === 'target_ext_10pct') {
                        $amount = $targetExternal * 0.10;
                    }
                } elseif ($fee['type'] === 'percentage') {
                    $amount = $marginBase * ($fee['pct'] / 100);
                }
                $feeTeamData[] = [
                    'label' => $fee['label'],
                    'amount' => round($amount),
                    'type' => $fee['type'],
                    'pct' => $fee['pct'] ?? 0,
                    'fixed' => $fee['fixed'] ?? 0,
                    'formula' => $fee['formula'] ?? '',
                ];
                $totalFeeTeam += $amount;
            }
        } else {
            foreach ($feeTeamMembers as $member) {
                $notes = json_decode($member->notes, true) ?? [];
                $type = $notes['type'] ?? 'fixed';
                $pct = isset($notes['pct']) ? (float) $notes['pct'] : 0;
                $fixed = isset($notes['fixed']) ? (float) $notes['fixed'] : 0;
                $formula = $notes['formula'] ?? '';

                $amount = 0;
                if ($type === 'fixed') {
                    $amount = (float) $member->amount_estimasi;
                } elseif ($type === 'percentage') {
                    $amount = $marginBase * ($pct / 100);
                } elseif ($type === 'formula') {
                    if ($formula === 'designer1/4') {
                        $d1Pct = 7.35;
                        foreach ($feeTeamMembers as $m) {
                            $mNotes = json_decode($m->notes, true) ?? [];
                            if ($m->label === 'Designer 1' && isset($mNotes['pct'])) {
                                $d1Pct = (float) $mNotes['pct'];
                            }
                        }
                        $designer1 = $marginBase * ($d1Pct / 100);
                        $amount = $designer1 / 4;
                    } elseif ($formula === 'target_ext_10pct') {
                        $amount = $targetExternal * 0.10;
                    }
                }

                $feeTeamData[] = [
                    'label' => $member->label,
                    'amount' => round($amount),
                    'type' => $type,
                    'pct' => $pct,
                    'fixed' => $fixed,
                    'formula' => $formula,
                ];
                $totalFeeTeam += $amount;
            }
        }

        $pctFeeTeam = $split['internal'] > 0 ? $totalFeeTeam / $split['internal'] : 0;

        $sisaMargin = $totalTargetMargin - $totalBreakdownAmount - $totalFeeTeam;
        $pctSisaMargin = $split['total'] > 0 ? $sisaMargin / $split['total'] : 0;

        // ═══════════════════════════════════════
        // BAGIAN 6: RENCANA PELAKSANAAN KEUANGAN (RPK)
        // ═══════════════════════════════════════
        // Fase DP
        $rpkDp = $pembayaranDp;
        $dpVendor = $internalMain->where('notes', 'dp')->sum('pembayaran');
        $cadanganVendorDp = $internalMain->where('notes', 'cadangan')->sum('pembayaran');

        // Fallback to labels for backwards compatibility / static seeder data
        if ($dpVendor == 0 && $cadanganVendorDp == 0) {
            $sdmWorkshopPembayaran = $internalMain->where('label', 'SDM Workshop')->first()?->pembayaran ?? 0;
            $cadanganVendorPembayaran = $internalMain->where('label', 'Cadangan Vendor')->first()?->pembayaran ?? 0;
            $dpVendor = $sdmWorkshopPembayaran;
            $cadanganVendorDp = $cadanganVendorPembayaran;
        }

        $totalPengeluaranDp = $dpVendor + $cadanganVendorDp + $dpFisik + $totalDpExternal + $totalFeeTeam + $totalBreakdownAmount;
        $sisaCashSebelumMgmtDp = $rpkDp - $totalPengeluaranDp;
        $managementDp = ($sisaCashSebelumMgmtDp > $sisaMargin) ? $sisaMargin : $sisaCashSebelumMgmtDp;
        if ($managementDp < 0) $managementDp = 0;
        $sisaCashDp = $sisaCashSebelumMgmtDp - $managementDp;

        // Fase Termin
        $rpkTermin = $pembayaranTermin;
        $sisaCashSebelumnya = $sisaCashDp;
        $totalCashTermin = $rpkTermin + $sisaCashSebelumnya;

        $terminVendor = $internalMain->where('notes', 'termin')->sum('pembayaran') + $internalMain->sum('pembayaran_termin');
        if ($terminVendor == 0) {
            $kasbonIPembayaran = $internalMain->where('label', 'Kasbon I')->first()?->pembayaran ?? 0;
            $kasbonIIPembayaran = $internalMain->where('label', 'Kasbon II')->first()?->pembayaran ?? 0;
            $sdmWorkshop2Pembayaran = $internalMain->where('label', 'SDM Workshop 2')->first()?->pembayaran ?? 0;
            $terminVendor = $kasbonIPembayaran + $kasbonIIPembayaran + $sdmWorkshop2Pembayaran;
        }
        $materialHutangVendor = $totalMaterialInternalPembayaran;

        $sisaCashSebelumMgmtTermin = $totalCashTermin - $terminVendor - $materialHutangVendor - $terminFisik - $totalTerminExternal;
        $managementTermin = 0;
        if (($managementDp + $sisaCashSebelumMgmtTermin) > $sisaMargin) {
            $managementTermin = $sisaMargin - $managementDp;
        } else {
            $managementTermin = $rpkTermin - $terminVendor - $materialHutangVendor - $terminFisik - $totalTerminExternal;
        }
        if ($managementTermin < 0) $managementTermin = 0;
        $sisaCashTermin = $sisaCashSebelumMgmtTermin - $managementTermin;

        // Fase Pelunasan
        $sisaCashSebelumnyaPelunasan = $sisaCashTermin;
        $totalCashPelunasan = $pembayaranPelunasan + $sisaCashSebelumnyaPelunasan;

        $pelunasanVendor = $internalMain->where('notes', 'pelunasan')->sum('pembayaran');
        if ($pelunasanVendor == 0) {
            $pelunasanVendor = $internalMain->where('label', 'Pelunasan')->first()?->pembayaran ?? 0;
        }
        $materialHutangVendorPel = $totalMaterialFisikPembayaran;

        // Status sisa external items
        $totalStatusExternal = $vendorEntries->where('vendor_type', 'external')->where('section', 'item_external')->sum(function($entry) {
            return $entry->spk_amount - $entry->pembayaran - $entry->pembayaran_termin;
        });

        $sisaCashSebelumMgmtPelunasan = $totalCashPelunasan - $pelunasanVendor - $materialHutangVendorPel - $pelunasanFisik - $totalStatusExternal;
        $managementPelunasan = 0;
        if ($pembayaranPelunasan > 0) {
            $managementPelunasan = $sisaMargin - $managementDp - $managementTermin;
        }
        if ($managementPelunasan < 0) $managementPelunasan = 0;
        $addendumCadanganGaji = $totalAddendumExternalPembayaran;
        $pengeluaranLainLain = $totalPengeluaranLuarPembayaran;

        // ═══════════════════════════════════════
        // BAGIAN 7: STATUS PROJECT
        // ═══════════════════════════════════════
        $statusProject = $sisaSaldoInternal + $sisaSaldoFisik + $sisaSaldoExternal;

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
            'split' => $split,
            'pembayaran' => [
                'amount_dp' => $pembayaranDp,
                'amount_termin' => $pembayaranTermin,
                'amount_pelunasan' => $pembayaranPelunasan,
                'dp' => ['amount' => $pembayaranDp, 'pct' => $pctDp, 'proyeksi' => $proyeksiDp, 'tanggal' => $tglDp],
                'termin' => ['amount' => $pembayaranTermin, 'pct' => $pctTermin, 'proyeksi' => $proyeksiTermin, 'tanggal' => $tglTermin],
                'pelunasan' => ['amount' => $pembayaranPelunasan, 'pct' => $pctPelunasan, 'proyeksi' => $proyeksiPelunasan, 'tanggal' => $tglPelunasan],
                'total_diterima' => $totalDiterima,
                'sisa_piutang' => $sisaPiutang,
            ],
            'spk' => [
                'internal' => $spkInternal,
                'fisik' => $spkFisik,
                'external' => $spkExternal,
                'internal_fix' => $spkInternalFix,
                'upgrade_material' => $upgradeMaterial,
                'fisik_fix' => $spkFisikFix,
                'external_fix' => $spkExternalFix,
                'saldo_efisiensi_internal' => $saldoEfisiensiInternal,
                'saldo_efisiensi_fisik' => $saldoEfisiensiFisik,
                'saldo_efisiensi_external' => $saldoEfisiensiExternal,
                'total_fix' => $totalSpkFix,
                'total_saldo_efisiensi' => $totalSaldoEfisiensi,
            ],
            'realisasi' => [
                'internal' => $realisasiInternal,
                'fisik' => $realisasiFisik,
                'external' => $realisasiExternal,
                'addendum' => $realisasiAddendum,
                'sisa_saldo_internal' => $sisaSaldoInternal,
                'sisa_saldo_fisik' => $sisaSaldoFisik,
                'sisa_saldo_external' => $sisaSaldoExternal,
                'total' => $totalRealisasi,
            ],
            'margin' => [
                'target_internal' => $targetInternal,
                'target_fisik' => $targetFisik,
                'target_external' => $targetExternal,
                'total_target' => $totalTargetMargin,
                'pct_internal' => $pctTargetInternal,
                'pct_fisik' => $pctTargetFisik,
                'pct_external' => $pctTargetExternal,
                'pct_total' => $pctTotalMargin,
                'fee_team' => round($totalFeeTeam),
                'pct_fee_team' => round($pctFeeTeam * 100, 1),
                'fee_team_detail' => $feeTeamData,
                'breakdown_items' => $breakdownData,
                'sisa_margin' => round($sisaMargin),
                'pct_sisa_margin' => round($pctSisaMargin * 100, 1),
            ],
            'rpk' => [
                'dp' => [
                    'cash_in' => $rpkDp,
                    'dp_vendor' => $dpVendor,
                    'cadangan_vendor' => $cadanganVendorDp,
                    'dp_fisik' => $dpFisik,
                    'dp_external' => $totalDpExternal,
                    'fee_team_detail' => $feeTeamData,
                    'breakdown_items' => $breakdownData,
                    'sisa_cash_sebelum_mgmt' => round($sisaCashSebelumMgmtDp),
                    'management' => round($managementDp),
                    'sisa_cash' => round($sisaCashDp),
                ],
                'termin' => [
                    'cash_in' => $rpkTermin,
                    'sisa_cash_sebelumnya' => round($sisaCashSebelumnya),
                    'total_cash' => round($totalCashTermin),
                    'termin_vendor' => $terminVendor,
                    'material_hutang_vendor' => $materialHutangVendor,
                    'termin_fisik' => $terminFisik,
                    'termin_external' => $totalTerminExternal,
                    'sisa_cash_sebelum_mgmt' => round($sisaCashSebelumMgmtTermin),
                    'management' => round($managementTermin),
                    'sisa_cash' => round($sisaCashTermin),
                ],
                'pelunasan' => [
                    'sisa_cash_sebelumnya' => round($sisaCashSebelumnyaPelunasan),
                    'total_cash' => round($totalCashPelunasan),
                    'pelunasan_vendor' => $pelunasanVendor,
                    'material_hutang_vendor' => $materialHutangVendorPel,
                    'pelunasan_fisik' => $pelunasanFisik,
                    'pelunasan_external' => $totalStatusExternal,
                    'sisa_cash_sebelum_mgmt' => round($sisaCashSebelumMgmtPelunasan),
                    'management' => round($managementPelunasan),
                    'addendum_cadangan_gaji' => $addendumCadanganGaji,
                    'pengeluaran_lain_lain' => $pengeluaranLainLain,
                ],
            ],
            'status_project' => round($statusProject),
            'vendor_internal' => [
                'main_entries' => $internalMainFormatted,
                'material_groups' => $this->getGroupedMaterials($order, 'internal'),
                'total_material_nilai' => $totalMaterialInternalNilai,
                'total_material_pembayaran' => $totalMaterialInternalPembayaran,
                'status_po' => $statusPoInternal,
            ],
            'vendor_fisik' => [
                'main_entries' => $fisikMainFormatted,
                'material_groups' => $this->getGroupedMaterials($order, 'fisik'),
                'budget_material' => $budgetMaterialFisik,
                'total_material_pembayaran' => $totalMaterialFisikPembayaran,
                'sisa_budget' => $sisaBudgetMaterialFisik,
            ],
            'vendor_external' => [
                'items' => $externalItems,
                'addendums' => $externalAddendums,
                'pengeluaran_luar' => $externalPengeluaranLuar,
            ],
        ]);
    }

    /**
     * Store/update all manual cashflow entries
     */
    public function storeManualEntry(Request $request, Order $order)
    {
        $fields = [
            // SPK
            'spk_internal', 'spk_fisik', 'spk_external',
            'spk_internal_fix', 'upgrade_material', 'spk_fisik_fix', 'spk_external_fix',
            // Realisasi
            'realisasi_internal', 'realisasi_fisik', 'realisasi_external', 'realisasi_addendum',
            // Fee percentages
            'pct_budget_dm', 'pct_operasional', 'pct_cadangan_overhead',
            'pct_entertaint', 'pct_deposit_gaji', 'pct_cadangan_problem',
            // RPK DP
            'dp_vendor', 'cadangan_vendor_dp', 'dp_fisik', 'dp_external',
            // RPK Termin
            'termin_vendor', 'material_hutang_vendor', 'termin_fisik', 'termin_external',
            // RPK Pelunasan
            'pelunasan_vendor', 'material_hutang_vendor_pel', 'pelunasan_fisik', 'pelunasan_external',
            'addendum_cadangan_gaji', 'pengeluaran_lain_lain',
        ];

        foreach ($fields as $field) {
            $value = $request->input($field);
            if ($value !== null && $value !== '') {
                CashflowManualEntry::updateOrCreate(
                    ['order_id' => $order->id, 'category' => $field],
                    [
                        'amount_estimasi' => (float) $value,
                        'label' => ucwords(str_replace('_', ' ', $field)),
                        'section' => 'general',
                        'phase' => 'general',
                        'created_by' => auth()->id(),
                    ]
                );
            }
        }

        // Handle dynamic Fee Team members
        if ($request->has('fee_team_items')) {
            $items = $request->input('fee_team_items');
            if (is_array($items)) {
                // Delete old fee_team entries for this order first
                CashflowManualEntry::where('order_id', $order->id)
                    ->where('category', 'fee_team')
                    ->delete();

                foreach ($items as $item) {
                    if (isset($item['label']) && !empty($item['label'])) {
                        CashflowManualEntry::create([
                            'order_id' => $order->id,
                            'category' => 'fee_team',
                            'label' => $item['label'],
                            'amount_estimasi' => (float) ($item['amount'] ?? 0),
                            'notes' => json_encode([
                                'type' => $item['type'] ?? 'fixed',
                                'pct' => (float) ($item['pct'] ?? 0),
                                'fixed' => (float) ($item['fixed'] ?? 0),
                                'formula' => $item['formula'] ?? '',
                            ]),
                            'section' => 'general',
                            'phase' => 'general',
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }
        }

        // Handle dynamic Margin Breakdown items
        if ($request->has('margin_breakdown_items')) {
            $breakdown = $request->input('margin_breakdown_items');
            if (is_array($breakdown)) {
                // Delete old margin_breakdown entries for this order first
                CashflowManualEntry::where('order_id', $order->id)
                    ->where('category', 'margin_breakdown')
                    ->delete();

                foreach ($breakdown as $item) {
                    if (isset($item['label']) && !empty($item['label'])) {
                        CashflowManualEntry::create([
                            'order_id' => $order->id,
                            'category' => 'margin_breakdown',
                            'label' => $item['label'],
                            'amount_estimasi' => (float) ($item['pct'] ?? 0),
                            'notes' => $item['base'] ?? 'internal_margin',
                            'section' => 'general',
                            'phase' => 'general',
                            'created_by' => auth()->id(),
                        ]);
                    }
                }
            }
        }

        return back()->with('success', 'Data cashflow berhasil disimpan');
    }

    /**
     * Helper to calculate contract split dynamically based on item categories
     */
    private function getContractSplit(Order $order)
    {
        $kontrakInternal = 0;
        $kontrakFisik = 0;
        $kontrakExternal = 0;

        $itemPekerjaan = $order->moodboard?->itemPekerjaan;
        $rabKontrak = $itemPekerjaan?->rabKontrak;

        if ($rabKontrak) {
            foreach ($rabKontrak->rabKontrakProduks as $rkp) {
                $hargaAkhir = (float) $rkp->harga_akhir;

                $internalRaw = 0;
                $fisikRaw = 0;
                $externalRaw = 0;

                $itemProduk = $rkp->itemPekerjaanProduk;
                if ($itemProduk) {
                    foreach ($itemProduk->bahanBakus as $bb) {
                        $itemObj = $bb->item;
                        if ($itemObj) {
                            $kategori = strtolower($itemObj->kategori);
                            $priceBb = (float) $bb->harga_dasar;
                            if ($kategori === 'internal') $internalRaw += $priceBb;
                            elseif ($kategori === 'fisik') $fisikRaw += $priceBb;
                            elseif ($kategori === 'eksternal') $externalRaw += $priceBb;
                        }
                    }

                    $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
                    $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

                    foreach ($itemProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                            foreach ($jenisItem->items as $item) {
                                $itemObj = $item->item;
                                if ($itemObj) {
                                    $kategori = strtolower($itemObj->kategori);
                                    $priceItem = (float) $itemObj->harga * $item->quantity;
                                    if ($kategori === 'internal') $internalRaw += $priceItem;
                                    elseif ($kategori === 'fisik') $fisikRaw += $priceItem;
                                    elseif ($kategori === 'eksternal') $externalRaw += $priceItem;
                                }
                            }
                        }
                    }
                }

                foreach ($rkp->rabKontrakAksesoris as $rka) {
                    $itemObj = $rka->itemPekerjaanItem?->item;
                    if ($itemObj) {
                        $kategori = strtolower($itemObj->kategori);
                        $priceAks = (float) $rka->harga_total;
                        if ($kategori === 'internal') $internalRaw += $priceAks;
                        elseif ($kategori === 'fisik') $fisikRaw += $priceAks;
                        elseif ($kategori === 'eksternal') $externalRaw += $priceAks;
                    }
                }

                $totalRaw = $internalRaw + $fisikRaw + $externalRaw;
                if ($totalRaw > 0) {
                    $kontrakInternal += ($internalRaw / $totalRaw) * $hargaAkhir;
                    $kontrakFisik += ($fisikRaw / $totalRaw) * $hargaAkhir;
                    $kontrakExternal += ($externalRaw / $totalRaw) * $hargaAkhir;
                } else {
                    $kontrakInternal += $hargaAkhir;
                }
            }
        }

        return [
            'internal' => $kontrakInternal,
            'fisik' => $kontrakFisik,
            'eksternal' => $kontrakExternal,
            'total' => $kontrakInternal + $kontrakFisik + $kontrakExternal,
        ];
    }

    /**
     * Store/update all cashflow vendor entries
     */
    public function storeVendorEntries(Request $request, Order $order)
    {
        // 1. Save Pembayaran Vendor Utama Internal
        if ($request->has('pembayaran_vendor_internal')) {
            $items = $request->input('pembayaran_vendor_internal');
            if (is_array($items)) {
                $incomingIds = array_filter(array_column($items, 'id'));
                CashflowVendorEntry::where('order_id', $order->id)
                    ->where('vendor_type', 'internal')
                    ->where('section', 'pembayaran_vendor')
                    ->whereNotIn('id', $incomingIds)
                    ->delete();

                foreach ($items as $idx => $item) {
                    $oldDate = null;
                    $oldTerminDate = null;
                    if (isset($item['id'])) {
                        $entry = CashflowVendorEntry::find($item['id']);
                        if ($entry) {
                            $oldDate = $entry->tanggal_pembayaran;
                            $oldTerminDate = $entry->tanggal_pembayaran_termin;
                        }
                    }

                    $data = [
                        'order_id' => $order->id,
                        'vendor_type' => 'internal',
                        'section' => 'pembayaran_vendor',
                        'label' => $item['label'] ?? '',
                        'persentase' => isset($item['persentase']) ? (float)$item['persentase'] : null,
                        'nilai' => isset($item['nilai']) ? (float)$item['nilai'] : 0,
                        'pembayaran' => (float)($item['pembayaran'] ?? 0),
                        'tanggal_pembayaran' => $item['tanggal_pembayaran'] ?: null,
                        'pembayaran_termin' => (float)($item['pembayaran_termin'] ?? 0),
                        'tanggal_pembayaran_termin' => $item['tanggal_pembayaran_termin'] ?: null,
                        'flag_af' => $item['flag_af'] ?: null,
                        'flag_fb' => $item['flag_fb'] ?: null,
                        'flag_jw' => $item['flag_jw'] ?: null,
                        'flag_af_termin' => $item['flag_af_termin'] ?: null,
                        'flag_fb_termin' => $item['flag_fb_termin'] ?: null,
                        'flag_jw_termin' => $item['flag_jw_termin'] ?: null,
                        'notes' => $item['notes'] ?? 'dp',
                        'sort_order' => $idx + 1,
                    ];

                    if (isset($item['id'])) {
                        $entry = CashflowVendorEntry::find($item['id']);
                        $entry->update($data);
                    } else {
                        $entry = CashflowVendorEntry::create($data);
                    }

                    if ($entry->tanggal_pembayaran && (!$oldDate || $oldDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran)->format('Y-m-d'))) {
                        $entry->update(['reminder_sent' => false, 'reminder_h7_sent' => false]);
                    }

                    if ($entry->tanggal_pembayaran_termin && (!$oldTerminDate || $oldTerminDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran_termin)->format('Y-m-d'))) {
                        $entry->update(['reminder_termin_sent' => false, 'reminder_h7_termin_sent' => false]);
                    }
                }
            }
        }

        // 2. Save Pembayaran Vendor Utama Fisik
        if ($request->has('pembayaran_vendor_fisik')) {
            $items = $request->input('pembayaran_vendor_fisik');
            if (is_array($items)) {
                $incomingIds = array_filter(array_column($items, 'id'));
                CashflowVendorEntry::where('order_id', $order->id)
                    ->where('vendor_type', 'fisik')
                    ->where('section', 'pembayaran_vendor')
                    ->whereNotIn('id', $incomingIds)
                    ->delete();

                foreach ($items as $idx => $item) {
                    $oldDate = null;
                    $oldTerminDate = null;
                    if (isset($item['id'])) {
                        $entry = CashflowVendorEntry::find($item['id']);
                        if ($entry) {
                            $oldDate = $entry->tanggal_pembayaran;
                            $oldTerminDate = $entry->tanggal_pembayaran_termin;
                        }
                    }

                    $data = [
                        'order_id' => $order->id,
                        'vendor_type' => 'fisik',
                        'section' => 'pembayaran_vendor',
                        'label' => $item['label'] ?? '',
                        'persentase' => isset($item['persentase']) ? (float)$item['persentase'] : null,
                        'nilai' => isset($item['nilai']) ? (float)$item['nilai'] : 0,
                        'pembayaran' => (float)($item['pembayaran'] ?? 0),
                        'tanggal_pembayaran' => $item['tanggal_pembayaran'] ?: null,
                        'pembayaran_termin' => (float)($item['pembayaran_termin'] ?? 0),
                        'tanggal_pembayaran_termin' => $item['tanggal_pembayaran_termin'] ?: null,
                        'flag_af' => $item['flag_af'] ?: null,
                        'flag_fb' => $item['flag_fb'] ?: null,
                        'flag_jw' => $item['flag_jw'] ?: null,
                        'flag_af_termin' => $item['flag_af_termin'] ?: null,
                        'flag_fb_termin' => $item['flag_fb_termin'] ?: null,
                        'flag_jw_termin' => $item['flag_jw_termin'] ?: null,
                        'notes' => $item['notes'] ?? 'dp',
                        'sort_order' => $idx + 1,
                    ];

                    if (isset($item['id'])) {
                        $entry = CashflowVendorEntry::find($item['id']);
                        $entry->update($data);
                    } else {
                        $entry = CashflowVendorEntry::create($data);
                    }

                    if ($entry->tanggal_pembayaran && (!$oldDate || $oldDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran)->format('Y-m-d'))) {
                        $entry->update(['reminder_sent' => false, 'reminder_h7_sent' => false]);
                    }

                    if ($entry->tanggal_pembayaran_termin && (!$oldTerminDate || $oldTerminDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran_termin)->format('Y-m-d'))) {
                        $entry->update(['reminder_termin_sent' => false, 'reminder_h7_termin_sent' => false]);
                    }
                }
            }
        }

        // 3. Save Material Hutang (Internal & Fisik)
        $materialHutangTypes = ['internal', 'fisik'];
        foreach ($materialHutangTypes as $type) {
            $inputKey = "material_groups_{$type}";
            if ($request->has($inputKey)) {
                $groups = $request->input($inputKey);
                if (is_array($groups)) {
                    $incomingIds = [];
                    foreach ($groups as $group) {
                        if (isset($group['items']) && is_array($group['items'])) {
                            foreach ($group['items'] as $item) {
                                if (isset($item['id'])) {
                                    $incomingIds[] = $item['id'];
                                }
                            }
                        }
                    }

                    CashflowVendorEntry::where('order_id', $order->id)
                        ->where('vendor_type', $type)
                        ->where('section', 'material_hutang')
                        ->whereNotIn('id', $incomingIds)
                        ->delete();

                    foreach ($groups as $group) {
                        $groupName = $group['name'];
                        if (isset($group['items']) && is_array($group['items'])) {
                            foreach ($group['items'] as $item) {
                                $oldDate = null;
                                if (isset($item['id'])) {
                                    $entry = CashflowVendorEntry::find($item['id']);
                                    if ($entry) {
                                        $oldDate = $entry->tanggal_pembayaran;
                                    }
                                }

                                $data = [
                                    'order_id' => $order->id,
                                    'vendor_type' => $type,
                                    'section' => 'material_hutang',
                                    'vendor_group' => $groupName,
                                    'label' => $item['label'] ?? '',
                                    'nilai' => (float)($item['nilai'] ?? 0),
                                    'pembayaran' => (float)($item['pembayaran'] ?? 0),
                                    'tanggal_inv' => $item['tanggal_inv'] ?: null,
                                    'tanggal_pembayaran' => $item['tanggal_pembayaran'] ?: null,
                                    'flag_af' => $item['flag_af'] ?: null,
                                    'flag_fb' => $item['flag_fb'] ?: null,
                                    'flag_jw' => $item['flag_jw'] ?: null,
                                ];

                                if (isset($item['id'])) {
                                    $entry = CashflowVendorEntry::find($item['id']);
                                    $entry->update($data);
                                } else {
                                    $entry = CashflowVendorEntry::create($data);
                                }

                                if ($entry->tanggal_pembayaran && (!$oldDate || $oldDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran)->format('Y-m-d'))) {
                                    $entry->update(['reminder_sent' => false, 'reminder_h7_sent' => false]);
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. Save External Items
        $externalSections = [
            'item_external' => 'external_items',
            'addendum_external' => 'external_addendums',
            'pengeluaran_luar' => 'external_pengeluaran_luar'
        ];

        foreach ($externalSections as $section => $inputKey) {
            if ($request->has($inputKey)) {
                $items = $request->input($inputKey);
                if (is_array($items)) {
                    $incomingIds = array_filter(array_column($items, 'id'));
                    CashflowVendorEntry::where('order_id', $order->id)
                        ->where('vendor_type', 'external')
                        ->where('section', $section)
                        ->whereNotIn('id', $incomingIds)
                        ->delete();

                    foreach ($items as $item) {
                        $oldDate = null;
                        $oldTerminDate = null;
                        if (isset($item['id'])) {
                            $entry = CashflowVendorEntry::find($item['id']);
                            if ($entry) {
                                $oldDate = $entry->tanggal_pembayaran;
                                $oldTerminDate = $entry->tanggal_pembayaran_termin;
                            }
                        }

                        $data = [
                            'order_id' => $order->id,
                            'vendor_type' => 'external',
                            'section' => $section,
                            'label' => $item['label'] ?? '',
                            'vendor_name' => $item['vendor_name'] ?? '',
                            'nilai' => (float)($item['nilai'] ?? 0),
                            'spk_amount' => (float)($item['spk_amount'] ?? 0),
                            'tanggal_perencanaan' => $item['tanggal_perencanaan'] ?: null,
                            'pembayaran' => (float)($item['pembayaran'] ?? 0),
                            'tanggal_pembayaran' => $item['tanggal_pembayaran'] ?: null,
                            'pembayaran_termin' => (float)($item['pembayaran_termin'] ?? 0),
                            'tanggal_pembayaran_termin' => $item['tanggal_pembayaran_termin'] ?: null,
                            'flag_af' => $item['flag_af'] ?: null,
                            'flag_fb' => $item['flag_fb'] ?: null,
                            'flag_jw' => $item['flag_jw'] ?: null,
                            'flag_af_termin' => $item['flag_af_termin'] ?: null,
                            'flag_fb_termin' => $item['flag_fb_termin'] ?: null,
                            'flag_jw_termin' => $item['flag_jw_termin'] ?: null,
                        ];

                        if (isset($item['id'])) {
                            $entry = CashflowVendorEntry::find($item['id']);
                            $entry->update($data);
                        } else {
                            $entry = CashflowVendorEntry::create($data);
                        }

                        if ($entry->tanggal_pembayaran && (!$oldDate || $oldDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran)->format('Y-m-d'))) {
                            $entry->update(['reminder_sent' => false, 'reminder_h7_sent' => false]);
                        }
                        if ($entry->tanggal_pembayaran_termin && (!$oldTerminDate || $oldTerminDate->format('Y-m-d') !== Carbon::parse($entry->tanggal_pembayaran_termin)->format('Y-m-d'))) {
                            $entry->update(['reminder_termin_sent' => false, 'reminder_h7_termin_sent' => false]);
                        }
                    }
                }
            }
        }

        return back()->with('success', 'Detail pembayaran vendor berhasil disimpan');
    }

    private function initializeDefaultVendorEntries(Order $order)
    {
        $count = CashflowVendorEntry::where('order_id', $order->id)->count();
        if ($count > 0) {
            return;
        }

        $kontrak = $order->moodboard?->itemPekerjaan?->kontrak;
        $startDate = $kontrak?->tanggal_mulai;
        $endDate = $kontrak?->tanggal_selesai;
        
        $midDate = null;
        if ($startDate && $endDate) {
            $diff = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate));
            $midDate = Carbon::parse($startDate)->addDays(round($diff / 2));
        }

        // Default Internal Main Entries
        $defaultInternal = [
            ['label' => 'DP', 'persentase' => 50, 'notes' => 'dp', 'tanggal_pembayaran' => $startDate],
            ['label' => 'Termin II', 'persentase' => 30, 'notes' => 'termin', 'tanggal_pembayaran' => $midDate],
            ['label' => 'Pelunasan', 'persentase' => 20, 'notes' => 'pelunasan', 'tanggal_pembayaran' => $endDate],
        ];

        foreach ($defaultInternal as $idx => $item) {
            CashflowVendorEntry::create([
                'order_id' => $order->id,
                'vendor_type' => 'internal',
                'section' => 'pembayaran_vendor',
                'label' => $item['label'],
                'persentase' => $item['persentase'],
                'nilai' => 0,
                'pembayaran' => 0,
                'pembayaran_termin' => 0,
                'tanggal_pembayaran' => $item['tanggal_pembayaran'],
                'sort_order' => $idx + 1,
                'notes' => $item['notes'],
            ]);
        }

        // Default Fisik Main Entries
        $defaultFisik = [
            ['label' => 'DP', 'persentase' => 50, 'notes' => 'dp', 'tanggal_pembayaran' => $startDate],
            ['label' => 'Termin II', 'persentase' => 30, 'notes' => 'termin', 'tanggal_pembayaran' => $midDate],
            ['label' => 'Pelunasan', 'persentase' => 20, 'notes' => 'pelunasan', 'tanggal_pembayaran' => $endDate],
        ];

        foreach ($defaultFisik as $idx => $item) {
            CashflowVendorEntry::create([
                'order_id' => $order->id,
                'vendor_type' => 'fisik',
                'section' => 'pembayaran_vendor',
                'label' => $item['label'],
                'persentase' => $item['persentase'],
                'nilai' => 0,
                'pembayaran' => 0,
                'pembayaran_termin' => 0,
                'tanggal_pembayaran' => $item['tanggal_pembayaran'],
                'sort_order' => $idx + 1,
                'notes' => $item['notes'],
            ]);
        }
    }

    private function getGroupedMaterials(Order $order, string $type)
    {
        $entries = CashflowVendorEntry::where('order_id', $order->id)
            ->where('vendor_type', $type)
            ->where('section', 'material_hutang')
            ->orderBy('id')
            ->get();

        $grouped = [];
        foreach ($entries as $entry) {
            $groupName = $entry->vendor_group ?: 'Uncategorized';
            if (!isset($grouped[$groupName])) {
                $grouped[$groupName] = [
                    'name' => $groupName,
                    'items' => [],
                ];
            }
            $grouped[$groupName]['items'][] = [
                'id' => $entry->id,
                'label' => $entry->label,
                'nilai' => $entry->nilai,
                'pembayaran' => $entry->pembayaran,
                'tanggal_inv' => $entry->tanggal_inv ? $entry->tanggal_inv->format('Y-m-d') : null,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'umur_inv' => $entry->umur_inv,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
            ];
        }

        return array_values($grouped);
    }

    private function getExternalEntries(Order $order, string $section)
    {
        $entries = CashflowVendorEntry::where('order_id', $order->id)
            ->where('vendor_type', 'external')
            ->where('section', $section)
            ->orderBy('id')
            ->get();

        $formatted = [];
        foreach ($entries as $entry) {
            $formatted[] = [
                'id' => $entry->id,
                'label' => $entry->label,
                'vendor_name' => $entry->vendor_name,
                'nilai' => $entry->nilai,
                'spk_amount' => $entry->spk_amount,
                'tanggal_perencanaan' => $entry->tanggal_perencanaan ? $entry->tanggal_perencanaan->format('Y-m-d') : null,
                'pembayaran' => $entry->pembayaran,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'pembayaran_termin' => $entry->pembayaran_termin,
                'tanggal_pembayaran_termin' => $entry->tanggal_pembayaran_termin ? $entry->tanggal_pembayaran_termin->format('Y-m-d') : null,
                'status_sisa' => $entry->status_sisa,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
                'flag_af_termin' => $entry->flag_af_termin,
                'flag_fb_termin' => $entry->flag_fb_termin,
                'flag_jw_termin' => $entry->flag_jw_termin,
            ];
        }

        return $formatted;
    }

    private function calculateStatusProject(Order $order, float $totalContract = 0, float $totalReceived = 0)
    {
        if ($totalContract > 0) {
            return min(100, max(0, round(($totalReceived / $totalContract) * 100)));
        }

        $manualEntries = CashflowManualEntry::where('order_id', $order->id)->get()->keyBy('category');
        $spkInternal = (float) ($manualEntries->get('spk_internal')->amount_estimasi ?? 0);
        $spkFisik = (float) ($manualEntries->get('spk_fisik')->amount_estimasi ?? 0);
        $spkExternal = (float) ($manualEntries->get('spk_external')->amount_estimasi ?? 0);
        $totalSpk = $spkInternal + $spkFisik + $spkExternal;

        $vendorEntries = CashflowVendorEntry::where('order_id', $order->id)->get();

        // Realisasi Internal (include termin)
        $totalPembayaranMainInternal = (float) $vendorEntries
            ->where('vendor_type', 'internal')
            ->where('section', 'pembayaran_vendor')
            ->sum('pembayaran')
            + (float) $vendorEntries
            ->where('vendor_type', 'internal')
            ->where('section', 'pembayaran_vendor')
            ->sum('pembayaran_termin');
        $totalMaterialInternalPembayaran = (float) $vendorEntries
            ->where('vendor_type', 'internal')
            ->where('section', 'material_hutang')
            ->sum('pembayaran');
        $realisasiInternal = $totalPembayaranMainInternal + $totalMaterialInternalPembayaran;

        // Realisasi Fisik (include termin)
        $totalFisikMainPembayaran = (float) $vendorEntries
            ->where('vendor_type', 'fisik')
            ->where('section', 'pembayaran_vendor')
            ->sum('pembayaran')
            + (float) $vendorEntries
            ->where('vendor_type', 'fisik')
            ->where('section', 'pembayaran_vendor')
            ->sum('pembayaran_termin');
        $totalMaterialFisikPembayaran = (float) $vendorEntries
            ->where('vendor_type', 'fisik')
            ->where('section', 'material_hutang')
            ->sum('pembayaran');
        $realisasiFisik = $totalFisikMainPembayaran + $totalMaterialFisikPembayaran;

        // Realisasi External
        $totalDpExternal = (float) $vendorEntries
            ->where('vendor_type', 'external')
            ->where('section', 'item_external')
            ->sum('pembayaran');
        $totalTerminExternal = (float) $vendorEntries
            ->where('vendor_type', 'external')
            ->where('section', 'item_external')
            ->sum('pembayaran_termin');
        $realisasiExternal = $totalDpExternal + $totalTerminExternal;

        $totalRealisasi = $realisasiInternal + $realisasiFisik + $realisasiExternal;

        if ($totalSpk > 0) {
            return min(100, max(0, round(($totalRealisasi / $totalSpk) * 100)));
        }

        return 0;
    }

    public function toggleVendorFlag(Request $request, CashflowVendorEntry $entry)
    {
        $validated = $request->validate([
            'flag' => 'required|string|in:flag_af,flag_fb,flag_jw,flag_af_termin,flag_fb_termin,flag_jw_termin',
            'value' => 'nullable|string|max:10',
        ]);

        $entry->update([
            $validated['flag'] => $validated['value'],
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'entry' => $entry]);
        }
        return back()->with('success', 'Status approval berhasil diperbarui');
    }

    public function exportDailyPayments()
    {
        $rawEntries = CashflowVendorEntry::with('order')
            ->whereNotNull('tanggal_pembayaran')
            ->orWhereNotNull('tanggal_pembayaran_termin')
            ->get();

        $dailyPayments = [];
        foreach ($rawEntries as $entry) {
            if (!$entry->order) continue;

            if ($entry->tanggal_pembayaran) {
                $dailyPayments[] = [
                    'id' => $entry->id . '-dp',
                    'project_name' => $entry->order->nama_project,
                    'vendor_type' => $entry->vendor_type,
                    'category' => $entry->section,
                    'label' => $entry->label ?: 'DP / Pembayaran Utama',
                    'vendor_name' => $entry->vendor_name ?: '-',
                    'type' => 'DP / Pembayaran',
                    'amount' => (float) $entry->pembayaran,
                    'date' => $entry->tanggal_pembayaran->format('Y-m-d'),
                    'flag_af' => $entry->flag_af,
                    'flag_fb' => $entry->flag_fb,
                    'flag_jw' => $entry->flag_jw,
                ];
            }

            if ($entry->tanggal_pembayaran_termin) {
                $dailyPayments[] = [
                    'id' => $entry->id . '-termin',
                    'project_name' => $entry->order->nama_project,
                    'vendor_type' => $entry->vendor_type,
                    'category' => $entry->section,
                    'label' => $entry->label ?: 'Termin Pembayaran',
                    'vendor_name' => $entry->vendor_name ?: '-',
                    'type' => 'Termin',
                    'amount' => (float) $entry->pembayaran_termin,
                    'date' => $entry->tanggal_pembayaran_termin->format('Y-m-d'),
                    'flag_af' => $entry->flag_af_termin,
                    'flag_fb' => $entry->flag_fb_termin,
                    'flag_jw' => $entry->flag_jw_termin,
                ];
            }
        }

        usort($dailyPayments, function($a, $b) {
            return strcmp($b['date'], $a['date']);
        });

        return Excel::download(new DailyPaymentsExport($dailyPayments), 'pembayaran_harian.xlsx');
    }

    public function exportProjectVendorPayments(Order $order)
    {
        $order->load([
            'moodboard.itemPekerjaan.kontrak.termin',
            'moodboard.itemPekerjaan.invoices',
            'moodboard.commitmentFee',
        ]);

        $this->initializeDefaultVendorEntries($order);
        $vendorEntries = CashflowVendorEntry::where('order_id', $order->id)->orderBy('sort_order')->orderBy('id')->get();
        $manualEntries = CashflowManualEntry::where('order_id', $order->id)->get()->keyBy('category');

        $getManual = function ($category) use ($manualEntries) {
            $entry = $manualEntries->get($category);
            return $entry ? (float) $entry->amount_estimasi : 0;
        };

        $spkInternalFix = $getManual('spk_internal_fix');
        $spkFisikFix = $getManual('spk_fisik_fix');

        // Internal Main Entries
        $internalMain = $vendorEntries->where('vendor_type', 'internal')->where('section', 'pembayaran_vendor')->sortBy('sort_order');
        $totalMaterialInternalNilai = $vendorEntries->where('vendor_type', 'internal')->where('section', 'material_hutang')->sum('nilai');
        
        $internalMainFormatted = [];
        $sumMainNilaiExceptPelunasan = 0;
        foreach ($internalMain as $entry) {
            if ($entry->notes !== 'pelunasan') {
                $entryNilai = ($entry->persentase !== null && $entry->persentase > 0) ? ($spkInternalFix * ($entry->persentase / 100)) : $entry->nilai;
                $sumMainNilaiExceptPelunasan += $entryNilai;
            }
        }
        $pelunasanInternalNilai = max(0, $spkInternalFix - $sumMainNilaiExceptPelunasan - $totalMaterialInternalNilai);

        foreach ($internalMain as $entry) {
            $entryNilai = ($entry->notes === 'pelunasan') ? $pelunasanInternalNilai : (($entry->persentase !== null && $entry->persentase > 0) ? ($spkInternalFix * ($entry->persentase / 100)) : $entry->nilai);
            $internalMainFormatted[] = [
                'label' => $entry->label,
                'notes' => $entry->notes,
                'persentase' => $entry->persentase ?: 0,
                'nilai' => $entryNilai,
                'pembayaran' => $entry->pembayaran,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
                'pembayaran_termin' => $entry->pembayaran_termin,
                'tanggal_pembayaran_termin' => $entry->tanggal_pembayaran_termin ? $entry->tanggal_pembayaran_termin->format('Y-m-d') : null,
                'flag_af_termin' => $entry->flag_af_termin,
                'flag_fb_termin' => $entry->flag_fb_termin,
                'flag_jw_termin' => $entry->flag_jw_termin,
            ];
        }

        // Fisik Main Entries
        $fisikMain = $vendorEntries->where('vendor_type', 'fisik')->where('section', 'pembayaran_vendor')->sortBy('sort_order');
        $fisikMainFormatted = [];
        foreach ($fisikMain as $entry) {
            $entryNilai = $spkFisikFix * (($entry->persentase ?: 0) / 100);
            $fisikMainFormatted[] = [
                'label' => $entry->label,
                'notes' => $entry->notes,
                'persentase' => $entry->persentase ?: 0,
                'nilai' => $entryNilai,
                'pembayaran' => $entry->pembayaran,
                'tanggal_pembayaran' => $entry->tanggal_pembayaran ? $entry->tanggal_pembayaran->format('Y-m-d') : null,
                'flag_af' => $entry->flag_af,
                'flag_fb' => $entry->flag_fb,
                'flag_jw' => $entry->flag_jw,
                'pembayaran_termin' => $entry->pembayaran_termin,
                'tanggal_pembayaran_termin' => $entry->tanggal_pembayaran_termin ? $entry->tanggal_pembayaran_termin->format('Y-m-d') : null,
                'flag_af_termin' => $entry->flag_af_termin,
                'flag_fb_termin' => $entry->flag_fb_termin,
                'flag_jw_termin' => $entry->flag_jw_termin,
            ];
        }

        $data = [
            'vendor_internal' => [
                'main_entries' => $internalMainFormatted,
                'material_groups' => $this->getGroupedMaterials($order, 'internal'),
            ],
            'vendor_fisik' => [
                'main_entries' => $fisikMainFormatted,
                'material_groups' => $this->getGroupedMaterials($order, 'fisik'),
            ],
            'vendor_external' => [
                'items' => $this->getExternalEntries($order, 'item_external'),
                'addendums' => $this->getExternalEntries($order, 'addendum_external'),
                'pengeluaran_luar' => $this->getExternalEntries($order, 'pengeluaran_luar'),
            ]
        ];

        $filename = 'vendor_pembayaran_' . strtolower(str_replace(' ', '_', $order->nama_project)) . '.xlsx';
        return Excel::download(new ProjectVendorPaymentsExport($order, $data), $filename);
    }
}
