<?php

namespace App\Http\Controllers\Cashflow\Traits;

use App\Models\Order;
use App\Models\CashflowManualEntry;
use App\Models\CashflowVendorEntry;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DailyPaymentsExport;
use App\Exports\ProjectVendorPaymentsExport;

trait HasCashflowExports
{
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
