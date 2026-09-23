<?php

namespace App\Http\Controllers\Cashflow\Traits;

use App\Models\Order;
use App\Models\CashflowManualEntry;
use App\Models\CashflowVendorEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;

trait HasCashflowMutations
{
    public function storeManualEntry(Request $request, Order $order)
    {
        // Handle reset contract split
        if ($request->boolean('reset_kontrak_split')) {
            CashflowManualEntry::where('order_id', $order->id)
                ->whereIn('category', ['kontrak_internal', 'kontrak_fisik', 'kontrak_external'])
                ->delete();
        }

        $fields = [
            // Pembagian Kontrak Manual Override
            'kontrak_internal', 'kontrak_fisik', 'kontrak_external',
            // SPK
            'spk_internal', 'spk_fisik', 'spk_external',
            'spk_internal_fix', 'upgrade_material', 'spk_fisik_fix', 'spk_external_fix', 'biaya_tak_terduga',
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
            if ($request->boolean('reset_kontrak_split') && in_array($field, ['kontrak_internal', 'kontrak_fisik', 'kontrak_external'])) {
                continue;
            }

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
}
