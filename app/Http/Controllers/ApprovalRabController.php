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
        ->whereHas('moodboard.order.gambarKerja') // opsional, kalau mau hanya yg sudah ada RAB
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($ip) {

            $allItems = $ip->produks
                ->flatMap(fn ($produk) =>
                    $produk->jenisItems->flatMap(fn ($jenis) =>
                        $jenis->items
                    )
                );

            return [
                'id' => $ip->id,
                'project_name' => $ip->moodboard->order->nama_project,
                'company_name' => $ip->moodboard->order->company_name,
                'customer_name' => $ip->moodboard->order->customer_name,
                'total_items' => $allItems->count(),

                // ⚠️ INI PENTING → supaya items_preview TIDAK undefined
                'items_preview' => $allItems
                    ->map(fn ($item) => [
                        'id' => $item->id,
                        'item_name' => $item->item->nama_item,
                        'quantity' => $item->quantity,
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
     * EDIT
     * approval-material.edit
     * (masih bisa dipakai kalau mau halaman detail)
     * ======================================================
     */
    public function edit($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items.item',
            'produks.jenisItems.jenisItem.items', // 🔥 master items
        ])->findOrFail($itemPekerjaanId);

        $items = $itemPekerjaan->produks
            ->flatMap(fn ($produk) =>
                $produk->jenisItems->flatMap(fn ($jenis) =>
                    $jenis->items->map(fn ($item) => [
                        'id' => $item->id,

                        // 🔥 penting untuk select
                        'item_id' => $item->item_id,
                        'item_name' => $item->item->nama_item,

                        'produk' => $produk->produk->nama_produk,
                        'jenis_item' => $jenis->jenisItem->nama_jenis_item,
                        'quantity' => $item->quantity,
                        'keterangan_material' => $item->keterangan_material,

                        // 🔥 list dropdown
                        'available_items' => $jenis->jenisItem->items->map(fn ($i) => [
                            'id' => $i->id,
                            'name' => $i->nama_item,
                        ])->values(),
                    ])
                )
            )
            ->values();

        return Inertia::render('ApprovalRab/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'project_name' => $itemPekerjaan->moodboard->order->nama_project,
                'company_name' => $itemPekerjaan->moodboard->order->company_name,
                'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                'items' => $items,
            ],
        ]);
    }

    /**
     * ======================================================
     * UPDATE (MASS UPDATE KETERANGAN MATERIAL)
     * approval-material.update
     * ======================================================
     */
    public function update(Request $request, $itemPekerjaanId)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:item_pekerjaan_items,id',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.keterangan_material' => 'nullable|string|max:1000',
        ]);

        foreach ($validated['items'] as $row) {
            ItemPekerjaanItem::where('id', $row['id'])->update([
                'item_id' => $row['item_id'],
                'keterangan_material' => $row['keterangan_material'],
            ]);
        }

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'Keterangan material berhasil disimpan.');
    }

}
