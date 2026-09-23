<?php

namespace App\Http\Controllers\ItemPekerjaan\Traits;

use App\Models\ItemPekerjaan;
use Barryvdh\DomPDF\Facade\Pdf;

trait HasItemPekerjaanPdf
{
    /**
     * Export PDF Item Pekerjaan grouped by Ruangan
     */
    public function exportPdf($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk',
            'produks.jenisItems.jenisItem',
            'produks.jenisItems.items.item',
            'produks.bahanBakus.item',
        ])->findOrFail($itemPekerjaanId);

        $order = $itemPekerjaan->moodboard->order;

        // Group produks by nama_ruangan
        $ruanganGroups = [];

        $formatSpek = function ($spekRaw) {
            if (is_array($spekRaw)) {
                return implode(', ', array_filter($spekRaw));
            }
            return is_string($spekRaw) ? trim($spekRaw) : '';
        };

        foreach ($itemPekerjaan->produks as $produkItem) {
            $ruanganName = $produkItem->nama_ruangan ?: 'Tanpa Ruangan';

            if (!isset($ruanganGroups[$ruanganName])) {
                $ruanganGroups[$ruanganName] = [];
            }

            // Extract Finishing Dalam items
            $finishingDalam = [];
            // Extract Finishing Luar items
            $finishingLuar = [];
            // Extract Aksesoris items
            $aksesoris = [];

            foreach ($produkItem->jenisItems as $jenisItemRel) {
                $namaJenis = strtolower(trim($jenisItemRel->jenisItem->nama_jenis_item ?? ''));

                foreach ($jenisItemRel->items as $itemDetail) {
                    $itemName = $itemDetail->item->nama_item ?? '-';
                    $qty = $itemDetail->quantity ?? null;
                    $spekRaw = $itemDetail->brand_spek ?? $itemDetail->keterangan_material ?? '';
                    $spek = $formatSpek($spekRaw);

                    $formatted = $itemName;
                    if (!empty($spek)) {
                        $formatted .= ' (' . $spek . ')';
                    }

                    if ($namaJenis === 'finishing dalam') {
                        $finishingDalam[] = $formatted;
                    } elseif ($namaJenis === 'finishing luar') {
                        $finishingLuar[] = $formatted;
                    } elseif ($namaJenis === 'aksesoris') {
                        $accText = $itemName;
                        if ($qty && $qty > 0) {
                            $accText .= ' - ' . $qty . ' pcs';
                        }
                        if (!empty($spek)) {
                            $accText .= ' (' . $spek . ')';
                        }
                        $aksesoris[] = $accText;
                    } else {
                        if (str_contains($namaJenis, 'dalam')) {
                            $finishingDalam[] = $formatted;
                        } elseif (str_contains($namaJenis, 'luar')) {
                            $finishingLuar[] = $formatted;
                        } else {
                            $aksesoris[] = $formatted;
                        }
                    }
                }
            }

            // Extract Bahan Baku
            $bahanBaku = [];
            foreach ($produkItem->bahanBakus as $bahan) {
                $bName = $bahan->item->nama_item ?? '-';
                $bSpek = $formatSpek($bahan->brand_spek ?? $bahan->keterangan_bahan_baku ?? '');
                if (!empty($bSpek)) {
                    $bName .= ' (' . $bSpek . ')';
                }
                $bahanBaku[] = $bName;
            }

            $ruanganGroups[$ruanganName][] = [
                'nama_produk' => $produkItem->produk->nama_produk ?? 'Produk #' . $produkItem->produk_id,
                'quantity' => $produkItem->quantity ?? 1,
                'panjang' => $produkItem->panjang,
                'lebar' => $produkItem->lebar,
                'tinggi' => $produkItem->tinggi,
                'finishing_dalam' => $finishingDalam,
                'finishing_luar' => $finishingLuar,
                'aksesoris' => $aksesoris,
                'bahan_baku' => $bahanBaku,
            ];
        }

        $pdf = Pdf::loadView('pdf.item-pekerjaan', [
            'itemPekerjaan' => $itemPekerjaan,
            'order' => $order,
            'ruanganGroups' => $ruanganGroups,
            'tanggal' => now()->translatedFormat('d F Y'),
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'Item_Pekerjaan_' . str_replace(' ', '_', $order->nama_project) . '.pdf';
        return $pdf->stream($filename);
    }

}
