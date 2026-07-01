<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\JenisItem;
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

        // Try to get payment amounts from actual invoices / CM Fee
        $cmFeePaid = ($commitmentFee && $commitmentFee->payment_status === 'completed')
            ? (float) $commitmentFee->total_fee
            : 0;

        // Parse termin structure for percentages
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

        // Add CM Fee to DP if applicable
        $pembayaranDp += $cmFeePaid;

        $totalDiterima = $pembayaranDp + $pembayaranTermin + $pembayaranPelunasan;
        $sisaPiutang = $split['total'] - $totalDiterima;

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
        // BAGIAN 4: REALISASI PENGELUARAN (manual input)
        // ═══════════════════════════════════════
        $realisasiInternal = $getManual('realisasi_internal');
        $realisasiFisik = $getManual('realisasi_fisik');
        $realisasiExternal = $getManual('realisasi_external');
        $realisasiAddendum = $getManual('realisasi_addendum');

        $sisaSaldoInternal = $spkInternal - $realisasiInternal;
        $sisaSaldoFisik = $spkFisik - $realisasiFisik;
        $sisaSaldoExternal = $spkExternal - $realisasiExternal;

        $totalRealisasi = $realisasiInternal + $realisasiFisik + $realisasiExternal + $realisasiAddendum;

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

        // Logic: if target internal margin % <= 30%, use target internal as base
        // Otherwise, use 30% * kontrak internal as base
        $marginBase = ($pctTargetInternal <= 0.30) ? $targetInternal : (0.30 * $split['internal']);

        // Load dynamic Margin Breakdown entries
        $breakdownEntries = CashflowManualEntry::where('order_id', $order->id)
            ->where('category', 'margin_breakdown')
            ->orderBy('id')
            ->get();

        $breakdownData = [];
        if ($breakdownEntries->isEmpty()) {
            // Default breakdown list
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

        // Fee Team — get individual fee percentages from manual entries
        $feeTeamMembers = CashflowManualEntry::where('order_id', $order->id)
            ->where('category', 'fee_team')
            ->orderBy('id')
            ->get();

        // If no fee team entries exist, calculate total fee team from default percentages
        $totalFeeTeam = 0;
        $feeTeamData = [];
        if ($feeTeamMembers->isEmpty()) {
            // Default fee team structure from spreadsheet
            $defaultFees = [
                ['label' => 'Designer 1', 'pct' => 7.35],
                ['label' => 'Lead Designer', 'pct' => 0, 'formula' => 'designer1/4'],
                ['label' => 'Estimator', 'pct' => 4.85],
                ['label' => 'PM', 'pct' => 3.10],
                ['label' => 'SPV1', 'pct' => 4.40],
                ['label' => 'Transport SPV', 'pct' => 1.00],
                ['label' => 'Drafter', 'pct' => 2.13],
                ['label' => 'Fibri', 'pct' => 3.00],
                ['label' => 'Surveyor As Marketing', 'pct' => 0, 'fixed' => 1000000],
                ['label' => 'Fee External', 'pct' => 0, 'formula' => 'target_ext_10pct'],
                ['label' => 'Manager Marketing', 'pct' => 1.83],
                ['label' => 'Fee Marketing', 'pct' => 6.67],
            ];

            foreach ($defaultFees as $fee) {
                $amount = 0;
                if (isset($fee['fixed'])) {
                    $amount = $fee['fixed'];
                } elseif (isset($fee['formula'])) {
                    if ($fee['formula'] === 'designer1/4') {
                        $designer1 = $marginBase * (7.35 / 100);
                        $amount = $designer1 / 4;
                    } elseif ($fee['formula'] === 'target_ext_10pct') {
                        $amount = $targetExternal * 0.10;
                    }
                } elseif ($fee['pct'] > 0) {
                    $amount = $marginBase * ($fee['pct'] / 100);
                }
                $feeTeamData[] = ['label' => $fee['label'], 'amount' => round($amount)];
                $totalFeeTeam += $amount;
            }
        } else {
            foreach ($feeTeamMembers as $member) {
                $amount = (float) $member->amount_estimasi;
                $feeTeamData[] = ['label' => $member->label, 'amount' => $amount];
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
        $dpVendor = $getManual('dp_vendor') ?: round($spkInternalFix * 0.20);
        $cadanganVendorDp = $getManual('cadangan_vendor_dp') ?: round($spkInternalFix * 0.15);
        $dpFisik = $getManual('dp_fisik');
        $dpExternal = $getManual('dp_external');

        $totalPengeluaranDp = $dpVendor + $cadanganVendorDp + $dpFisik + $dpExternal + $totalFeeTeam + $totalBreakdownAmount;
        $sisaCashSebelumMgmtDp = $rpkDp - $totalPengeluaranDp;
        $managementDp = ($sisaCashSebelumMgmtDp > $sisaMargin) ? $sisaMargin : $sisaCashSebelumMgmtDp;
        if ($managementDp < 0) $managementDp = 0;
        $sisaCashDp = $sisaCashSebelumMgmtDp - $managementDp;

        // Fase Termin
        $rpkTermin = $pembayaranTermin;
        $sisaCashSebelumnya = $sisaCashDp;
        $totalCashTermin = $rpkTermin + $sisaCashSebelumnya;

        $terminVendor = $getManual('termin_vendor');
        $materialHutangVendor = $getManual('material_hutang_vendor');
        $terminFisik = $getManual('termin_fisik');
        $terminExternal = $getManual('termin_external');

        $sisaCashSebelumMgmtTermin = $totalCashTermin - $terminVendor - $materialHutangVendor - $terminFisik - $terminExternal;
        $managementTermin = 0;
        if (($managementDp + $sisaCashSebelumMgmtTermin) > $sisaMargin) {
            $managementTermin = $sisaMargin - $managementDp;
        } else {
            $managementTermin = $rpkTermin - $terminVendor - $materialHutangVendor - $terminFisik - $terminExternal;
        }
        if ($managementTermin < 0) $managementTermin = 0;
        $sisaCashTermin = $sisaCashSebelumMgmtTermin - $managementTermin;

        // Fase Pelunasan
        $sisaCashSebelumnyaPelunasan = $sisaCashTermin;
        $totalCashPelunasan = $pembayaranPelunasan + $sisaCashSebelumnyaPelunasan;

        $pelunasanVendor = $getManual('pelunasan_vendor');
        $materialHutangVendorPel = $getManual('material_hutang_vendor_pel');
        $pelunasanFisik = $getManual('pelunasan_fisik');
        $pelunasanExternal = $getManual('pelunasan_external');

        $sisaCashSebelumMgmtPelunasan = $totalCashPelunasan - $pelunasanVendor - $materialHutangVendorPel - $pelunasanFisik - $pelunasanExternal;
        $managementPelunasan = 0;
        if ($pembayaranPelunasan > 0) {
            $managementPelunasan = $sisaMargin - $managementDp - $managementTermin;
        }
        if ($managementPelunasan < 0) $managementPelunasan = 0;
        $addendumCadanganGaji = $getManual('addendum_cadangan_gaji');
        $pengeluaranLainLain = $getManual('pengeluaran_lain_lain');

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
                    'dp_external' => $dpExternal,
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
                    'termin_external' => $terminExternal,
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
                    'pelunasan_external' => $pelunasanExternal,
                    'sisa_cash_sebelum_mgmt' => round($sisaCashSebelumMgmtPelunasan),
                    'management' => round($managementPelunasan),
                    'addendum_cadangan_gaji' => $addendumCadanganGaji,
                    'pengeluaran_lain_lain' => $pengeluaranLainLain,
                ],
            ],
            'status_project' => round($statusProject),
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
}
