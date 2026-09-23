<?php

namespace App\Http\Controllers\Cashflow\Traits;

use App\Models\Order;
use App\Models\JenisItem;
use App\Models\CashflowManualEntry;
use App\Models\CashflowVendorEntry;
use Carbon\Carbon;

trait HasCashflowCalculations
{
    /**
     * Helper to calculate contract split dynamically based on item categories
     */
    private function getContractSplit(Order $order)
    {
        // Check for manual split entries first
        $manualEntries = CashflowManualEntry::where('order_id', $order->id)
            ->whereIn('category', ['kontrak_internal', 'kontrak_fisik', 'kontrak_external'])
            ->pluck('amount_estimasi', 'category');

        if ($manualEntries->isNotEmpty()) {
            $internal = (float) ($manualEntries->get('kontrak_internal') ?? 0);
            $fisik = (float) ($manualEntries->get('kontrak_fisik') ?? 0);
            $eksternal = (float) ($manualEntries->get('kontrak_external') ?? 0);

            return [
                'internal' => $internal,
                'fisik' => $fisik,
                'eksternal' => $eksternal,
                'total' => $internal + $fisik + $eksternal,
                'is_manual' => true,
            ];
        }

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
            'is_manual' => false,
        ];
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

        if ($entries->isEmpty()) {
            $rabMaterials = $this->getRabMaterialsByCategory($order, $type);
            foreach ($rabMaterials as $idx => $mat) {
                CashflowVendorEntry::create([
                    'order_id' => $order->id,
                    'vendor_type' => $type,
                    'section' => 'material_hutang',
                    'vendor_group' => $mat['vendor_name'],
                    'label' => $mat['label'],
                    'nilai' => $mat['nilai'],
                    'pembayaran' => 0,
                    'sort_order' => $idx + 1,
                ]);
            }
            if (!empty($rabMaterials)) {
                $entries = CashflowVendorEntry::where('order_id', $order->id)
                    ->where('vendor_type', $type)
                    ->where('section', 'material_hutang')
                    ->orderBy('id')
                    ->get();
            }
        }

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

    private function getRabMaterialsByCategory(Order $order, string $type)
    {
        $targetCategory = strtolower($type);
        $items = [];
        $itemPekerjaan = $order->moodboard?->itemPekerjaan;
        if (!$itemPekerjaan) return $items;

        $rabKontrak = $itemPekerjaan->rabKontrak;
        if ($rabKontrak) {
            foreach ($rabKontrak->rabKontrakProduks as $rkp) {
                $itemProduk = $rkp->itemPekerjaanProduk;
                if (!$itemProduk) continue;

                $prodObj = $itemProduk->produk;
                $vendorName = $prodObj?->supplier?->name ?? 'Vendor Umum';

                if (strtolower($prodObj?->kategori ?? 'internal') === $targetCategory) {
                    $items[] = [
                        'label' => $prodObj->nama_produk,
                        'vendor_name' => $vendorName,
                        'nilai' => (float) $rkp->harga_akhir,
                    ];
                }

                foreach ($itemProduk->bahanBakus as $bb) {
                    $itemObj = $bb->item;
                    if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                        $items[] = [
                            'label' => $itemObj->nama_item,
                            'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                            'nilai' => (float) $bb->harga_dasar,
                        ];
                    }
                }

                foreach ($itemProduk->jenisItems as $jenisItem) {
                    foreach ($jenisItem->items as $item) {
                        $itemObj = $item->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => (float) ($itemObj->harga * $item->quantity),
                            ];
                        }
                    }
                }

                foreach ($rkp->rabKontrakAksesoris as $rka) {
                    $itemObj = $rka->itemPekerjaanItem?->item;
                    if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                        $items[] = [
                            'label' => $itemObj->nama_item,
                            'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                            'nilai' => (float) $rka->harga_total,
                        ];
                    }
                }
            }
        } else {
            $rabInternal = $itemPekerjaan->rabInternal;
            if ($rabInternal) {
                foreach ($rabInternal->rabProduks as $rp) {
                    $itemProduk = $rp->itemPekerjaanProduk;
                    if (!$itemProduk) continue;

                    $prodObj = $itemProduk->produk;
                    $vendorName = $prodObj?->supplier?->name ?? 'Vendor Umum';

                    if (strtolower($prodObj?->kategori ?? 'internal') === $targetCategory) {
                        $items[] = [
                            'label' => $prodObj->nama_produk,
                            'vendor_name' => $vendorName,
                            'nilai' => (float) $rp->harga_akhir,
                        ];
                    }

                    foreach ($itemProduk->bahanBakus as $bb) {
                        $itemObj = $bb->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => (float) $bb->harga_dasar,
                            ];
                        }
                    }

                    foreach ($itemProduk->jenisItems as $jenisItem) {
                        foreach ($jenisItem->items as $item) {
                            $itemObj = $item->item;
                            if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                                $items[] = [
                                    'label' => $itemObj->nama_item,
                                    'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                    'nilai' => (float) ($itemObj->harga * $item->quantity),
                                ];
                            }
                        }
                    }

                    foreach ($rp->rabAksesoris as $ra) {
                        $itemObj = $ra->itemPekerjaanItem?->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? 'internal') === $targetCategory) {
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => (float) $ra->harga_total,
                            ];
                        }
                    }
                }
            }
        }

        return $items;
    }

    private function getExternalEntries(Order $order, string $section)
    {
        $entries = CashflowVendorEntry::where('order_id', $order->id)
            ->where('vendor_type', 'external')
            ->where('section', $section)
            ->orderBy('id')
            ->get();

        if ($entries->isEmpty() && $section === 'item_external') {
            $rabExternalItems = $this->getExternalRabItems($order);
            foreach ($rabExternalItems as $idx => $extItem) {
                CashflowVendorEntry::create([
                    'order_id' => $order->id,
                    'vendor_type' => 'external',
                    'section' => 'item_external',
                    'label' => $extItem['label'],
                    'vendor_name' => $extItem['vendor_name'],
                    'nilai' => $extItem['nilai'],
                    'spk_amount' => $extItem['spk_amount'],
                    'sort_order' => $idx + 1,
                ]);
            }
            if (!empty($rabExternalItems)) {
                $entries = CashflowVendorEntry::where('order_id', $order->id)
                    ->where('vendor_type', 'external')
                    ->where('section', $section)
                    ->orderBy('id')
                    ->get();
            }
        }

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

    private function getExternalRabItems(Order $order)
    {
        $items = [];
        $itemPekerjaan = $order->moodboard?->itemPekerjaan;
        if (!$itemPekerjaan) return $items;

        $rabKontrak = $itemPekerjaan->rabKontrak;
        if ($rabKontrak) {
            foreach ($rabKontrak->rabKontrakProduks as $rkp) {
                $itemProduk = $rkp->itemPekerjaanProduk;
                if (!$itemProduk) continue;

                $prodObj = $itemProduk->produk;
                $vendorName = $prodObj?->supplier?->name ?? '';

                if (strtolower($prodObj?->kategori ?? '') === 'eksternal') {
                    $items[] = [
                        'label' => $prodObj->nama_produk,
                        'vendor_name' => $vendorName,
                        'nilai' => (float) $rkp->harga_akhir,
                        'spk_amount' => (float) $rkp->harga_akhir,
                    ];
                }

                foreach ($itemProduk->bahanBakus as $bb) {
                    $itemObj = $bb->item;
                    if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                        $items[] = [
                            'label' => $itemObj->nama_item,
                            'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                            'nilai' => (float) $bb->harga_dasar,
                            'spk_amount' => (float) $bb->harga_dasar,
                        ];
                    }
                }

                foreach ($itemProduk->jenisItems as $jenisItem) {
                    foreach ($jenisItem->items as $item) {
                        $itemObj = $item->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                            $priceItem = (float) $itemObj->harga * $item->quantity;
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => $priceItem,
                                'spk_amount' => $priceItem,
                            ];
                        }
                    }
                }

                foreach ($rkp->rabKontrakAksesoris as $rka) {
                    $itemObj = $rka->itemPekerjaanItem?->item;
                    if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                        $items[] = [
                            'label' => $itemObj->nama_item,
                            'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                            'nilai' => (float) $rka->harga_total,
                            'spk_amount' => (float) $rka->harga_total,
                        ];
                    }
                }
            }
        } else {
            $rabInternal = $itemPekerjaan->rabInternal;
            if ($rabInternal) {
                foreach ($rabInternal->rabProduks as $rp) {
                    $itemProduk = $rp->itemPekerjaanProduk;
                    if (!$itemProduk) continue;

                    $prodObj = $itemProduk->produk;
                    $vendorName = $prodObj?->supplier?->name ?? '';

                    if (strtolower($prodObj?->kategori ?? '') === 'eksternal') {
                        $items[] = [
                            'label' => $prodObj->nama_produk,
                            'vendor_name' => $vendorName,
                            'nilai' => (float) $rp->harga_akhir,
                            'spk_amount' => (float) $rp->harga_akhir,
                        ];
                    }

                    foreach ($itemProduk->bahanBakus as $bb) {
                        $itemObj = $bb->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => (float) $bb->harga_dasar,
                                'spk_amount' => (float) $bb->harga_dasar,
                            ];
                        }
                    }

                    foreach ($itemProduk->jenisItems as $jenisItem) {
                        foreach ($jenisItem->items as $item) {
                            $itemObj = $item->item;
                            if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                                $priceItem = (float) $itemObj->harga * $item->quantity;
                                $items[] = [
                                    'label' => $itemObj->nama_item,
                                    'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                    'nilai' => $priceItem,
                                    'spk_amount' => $priceItem,
                                ];
                            }
                        }
                    }

                    foreach ($rp->rabAksesoris as $ra) {
                        $itemObj = $ra->itemPekerjaanItem?->item;
                        if ($itemObj && strtolower($itemObj->kategori ?? '') === 'eksternal') {
                            $items[] = [
                                'label' => $itemObj->nama_item,
                                'vendor_name' => $itemObj->supplier?->name ?? $vendorName,
                                'nilai' => (float) $ra->harga_total,
                                'spk_amount' => (float) $ra->harga_total,
                            ];
                        }
                    }
                }
            }
        }

        return $items;
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
}
