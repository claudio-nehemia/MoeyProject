<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;

class ApprovalRabController extends Controller
{
    /**
     * ======================================================
     * INDEX
     * approval-material.index
     * ======================================================
     */
    public function index()
    {
        $items = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items.item',
        ])
        ->whereHas('rabInternal') // optional
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($ip) {

            $allItems = $ip->produks
                ->flatMap(fn ($p) => $p->jenisItems)
                ->flatMap(fn ($j) => $j->items);

            return [
                'id' => $ip->id,
                'project_name' => $ip->moodboard->order->nama_project,
                'company_name' => $ip->moodboard->order->company_name,
                'customer_name' => $ip->moodboard->order->customer_name,

                'total_items' => $allItems->count(),

                // 🔥 INI YANG KURANG
                'items_preview' => $allItems
                    ->take(5) // biar ringan
                    ->map(fn ($item) => [
                        'item_name' => $item->item->nama_item,
                        'keterangan_material' => $item->keterangan_material,
                    ])
                    ->values(),
            ];
        });

        return Inertia::render('ApprovalRab/Index', [
            'items' => $items,
        ]);
    }

    /**
     * ======================================================
     * EDIT – HALAMAN KETERANGAN RAB
     * approval-material.edit
     * ======================================================
     */
    public function edit($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items.item',
        ])->findOrFail($itemPekerjaanId);

        return Inertia::render('ApprovalRab/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'project_name' => $itemPekerjaan->moodboard->order->nama_project,
                'company_name' => $itemPekerjaan->moodboard->order->company_name,
                'customer_name' => $itemPekerjaan->moodboard->order->customer_name,

                // flatten ke item-level
                'items' => $itemPekerjaan->produks
                    ->flatMap(fn ($produk) =>
                        $produk->jenisItems->flatMap(fn ($jenis) =>
                            $jenis->items->map(fn ($item) => [
                                'id' => $item->id,
                                'ruangan' => $produk->nama_ruangan,
                                'produk' => $produk->produk->nama_produk,
                                'jenis_item' => $jenis->jenisItem->nama_jenis_item,
                                'item_name' => $item->item->nama_item,
                                'quantity' => $item->quantity,
                                'keterangan_material' => $item->keterangan_material,
                            ])
                        )
                    )
                    ->values(),
            ],
        ]);
    }

    /**
     * ======================================================
     * UPDATE – SIMPAN KETERANGAN MATERIAL
     * approval-material.update
     * ======================================================
     */
    public function update(Request $request, $itemPekerjaanId)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:item_pekerjaan_items,id',
            'items.*.keterangan_material' => 'nullable|string|max:1000',
        ]);

        foreach ($validated['items'] as $row) {
            ItemPekerjaanItem::where('id', $row['id'])->update([
                'keterangan_material' => $row['keterangan_material'],
            ]);
        }

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'Keterangan material berhasil disimpan.');
    }
}
