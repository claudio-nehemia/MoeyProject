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
use App\Http\Controllers\Cashflow\Traits\HasCashflowCalculations;
use App\Http\Controllers\Cashflow\Traits\HasCashflowMutations;
use App\Http\Controllers\Cashflow\Traits\HasCashflowExports;

class CashflowController extends Controller
{
    use HasCashflowCalculations;
    use HasCashflowMutations;
    use HasCashflowExports;
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
        $biayaTakTerduga = $getManual('biaya_tak_terduga');

        $saldoEfisiensiInternal = $spkInternalFix > 0 ? $spkInternal - $spkInternalFix : 0;
        $saldoEfisiensiFisik = $spkFisikFix > 0 ? $spkFisik - $spkFisikFix : 0;
        $saldoEfisiensiExternal = $spkExternalFix > 0 ? $spkExternal - $spkExternalFix : 0;

        $totalSpkFix = $spkInternalFix + $spkFisikFix + $spkExternalFix;
        $totalSaldoEfisiensi = $saldoEfisiensiInternal + $saldoEfisiensiFisik + $saldoEfisiensiExternal;
        $angkaFinal = $totalSaldoEfisiensi - $biayaTakTerduga;

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
        // BAGIAN 2: PEMBAYARAN (Dinamis per Tahapan)
        // ═══════════════════════════════════════
        $tahapan = $termin?->tahapan ?? [];
        if (!is_array($tahapan) || empty($tahapan)) {
            $tahapan = [
                ['tahapan' => 'DP', 'persentase' => 40],
                ['tahapan' => 'Termin II', 'persentase' => 30],
                ['tahapan' => 'Pelunasan', 'persentase' => 30],
            ];
        }

        // Build tahapan list for frontend
        $tahapanList = [];
        foreach ($tahapan as $idx => $t) {
            $tahapanList[] = [
                'index' => $idx,
                'nama' => $t['tahapan'] ?? 'Tahap ' . ($idx + 1),
                'persentase' => isset($t['persentase']) ? (float) $t['persentase'] : 0,
                'is_dp' => $idx === 0,
                'is_pelunasan' => $idx === count($tahapan) - 1,
            ];
        }

        // Paid invoices sorted by date
        $paidInvoices = $invoices->where('status', 'paid')->sortBy('paid_at');
        $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed') ? (float) $commitmentFee->total_fee : 0;
        $paidInvoicesList = $paidInvoices->values();

        // Build dynamic pembayaran phases
        $pembayaranPhases = [];
        $totalDiterima = 0;
        foreach ($tahapanList as $idx => $fase) {
            $pct = $fase['persentase'];
            $proyeksi = $split['total'] * ($pct / 100);
            $amount = 0;
            $tanggal = null;

            if ($paidInvoicesList->count() > $idx) {
                $amount = (float) ($paidInvoicesList->get($idx)?->total_amount ?? 0);
                $tanggal = $paidInvoicesList->get($idx)?->paid_at;
            }

            // Add commitment fee to first phase (DP)
            if ($idx === 0) {
                $amount += $cmFeePaid;
            }

            $totalDiterima += $amount;

            $pembayaranPhases[] = [
                'index' => $idx,
                'nama' => $fase['nama'],
                'pct' => $pct,
                'proyeksi' => round($proyeksi),
                'amount' => round($amount),
                'tanggal' => $tanggal,
                'is_dp' => $fase['is_dp'],
                'is_pelunasan' => $fase['is_pelunasan'],
            ];
        }

        $sisaPiutang = $split['total'] - $totalDiterima;

        // Legacy variables for RPK compatibility
        $pembayaranDp = $pembayaranPhases[0]['amount'] ?? 0;
        $pembayaranTermin = 0;
        $pembayaranPelunasan = 0;
        foreach ($pembayaranPhases as $phase) {
            if (!$phase['is_dp'] && !$phase['is_pelunasan']) {
                $pembayaranTermin += $phase['amount'];
            }
            if ($phase['is_pelunasan']) {
                $pembayaranPelunasan = $phase['amount'];
            }
        }
        $pctDp = $pembayaranPhases[0]['pct'] ?? 0;
        $pctTermin = 0;
        $pctPelunasan = 0;
        foreach ($tahapanList as $fase) {
            if (!$fase['is_dp'] && !$fase['is_pelunasan']) $pctTermin += $fase['persentase'];
            if ($fase['is_pelunasan']) $pctPelunasan = $fase['persentase'];
        }

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
        $kontrakInternal = $split['internal'];
        $kontrakFisikExt = $split['fisik'] + $split['eksternal'];

        $digitalMarketingVal = 0.025 * $kontrakInternal;
        $feeMarketingVal = (0.01 * $kontrakInternal) + (0.01 * $kontrakFisikExt / 2);
        $overheadGajiVal = 0.05 * $kontrakInternal;
        $overheadOperasionalVal = 0.04 * $kontrakInternal;
        $cadanganEkspansiVal = 0.079 * $kontrakInternal;
        $cadanganProblemVal = 0.035 * $kontrakInternal;

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

        $feeTeamHalf = $totalFeeTeam / 2;
        $totalPengeluaranDp = $dpVendor + $cadanganVendorDp + $dpFisik + $totalDpExternal + $feeMarketingVal + $overheadGajiVal + $overheadOperasionalVal + $cadanganEkspansiVal + $feeTeamHalf;
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

        $totalPengeluaranTermin = $terminVendor + $materialHutangVendor + $terminFisik + $totalTerminExternal + $digitalMarketingVal + $feeTeamHalf + $cadanganProblemVal;
        $sisaCashSebelumMgmtTermin = $totalCashTermin - $totalPengeluaranTermin;
        $managementTermin = 0;
        if (($managementDp + $sisaCashSebelumMgmtTermin) > $sisaMargin) {
            $managementTermin = $sisaMargin - $managementDp;
        } else {
            $managementTermin = $totalCashTermin - $totalPengeluaranTermin;
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

        $totalPengeluaranPelunasan = $pelunasanVendor + $materialHutangVendorPel + $pelunasanFisik + $totalStatusExternal + $feeTeamHalf;
        $sisaCashSebelumMgmtPelunasan = $totalCashPelunasan - $totalPengeluaranPelunasan;
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
            'tahapan_list' => $tahapanList,
            'pembayaran_phases' => $pembayaranPhases,
            'pembayaran' => [
                'amount_dp' => $pembayaranDp,
                'amount_termin' => $pembayaranTermin,
                'amount_pelunasan' => $pembayaranPelunasan,
                'phases' => $pembayaranPhases,
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
                'biaya_tak_terduga' => $biayaTakTerduga,
                'saldo_efisiensi_internal' => $saldoEfisiensiInternal,
                'saldo_efisiensi_fisik' => $saldoEfisiensiFisik,
                'saldo_efisiensi_external' => $saldoEfisiensiExternal,
                'total_fix' => $totalSpkFix,
                'total_saldo_efisiensi' => $totalSaldoEfisiensi,
                'angka_final' => $angkaFinal,
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
                    'fee_marketing' => round($feeMarketingVal),
                    'overhead_gaji' => round($overheadGajiVal),
                    'overhead_operasional' => round($overheadOperasionalVal),
                    'cadangan_ekspansi' => round($cadanganEkspansiVal),
                    'fee_team' => round($feeTeamHalf),
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
                    'digital_marketing' => round($digitalMarketingVal),
                    'fee_team' => round($feeTeamHalf),
                    'cadangan_problem' => round($cadanganProblemVal),
                    'sisa_cash_sebelum_mgmt' => round($sisaCashSebelumMgmtTermin),
                    'management' => round($managementTermin),
                    'sisa_cash' => round($sisaCashTermin),
                ],
                'pelunasan' => [
                    'cash_in' => $pembayaranPelunasan,
                    'sisa_cash_sebelumnya' => round($sisaCashSebelumnyaPelunasan),
                    'total_cash' => round($totalCashPelunasan),
                    'pelunasan_vendor' => $pelunasanVendor,
                    'material_hutang_vendor' => $materialHutangVendorPel,
                    'pelunasan_fisik' => $pelunasanFisik,
                    'pelunasan_external' => $totalStatusExternal,
                    'fee_team' => round($feeTeamHalf),
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
            'suppliers' => \App\Models\Supplier::orderBy('name')->get(['id', 'name', 'code', 'category', 'phone', 'address']),
        ]);
    }

    /**
     * Store/update all manual cashflow entries
     */
}
