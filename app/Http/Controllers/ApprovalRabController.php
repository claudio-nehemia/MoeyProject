<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Services\NotificationService;

class ApprovalRabController extends Controller
{
    public function index()
    {
        $items = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items'
        ])->get()->map(function ($ip) {

            $hasKeterangan = false;
            $totalItems = 0;

            foreach ($ip->produks as $produk) {
                foreach ($produk->jenisItems as $jenis) {
                    foreach ($jenis->items as $item) {
                        $totalItems++;
                        if (!empty($item->keterangan_material)) {
                            $hasKeterangan = true;
                        }
                    }
                }
            }

            return [
                'id' => $ip->id,
                'order' => [
                    'nama_project' => $ip->moodboard->order->nama_project,
                    'company_name' => $ip->moodboard->order->company_name,
                    'customer_name' => $ip->moodboard->order->customer_name,
                ],
                'total_items' => $totalItems,
                'has_keterangan' => $hasKeterangan,
            ];
        });

        return Inertia::render('ApprovalRab/Index', [
            'items' => $items,
        ]);
    }

    public function edit($id)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items.item'
        ])->findOrFail($id);

        return Inertia::render('ApprovalRab/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'order' => [
                    'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $itemPekerjaan->moodboard->order->company_name,
                ],
                'produks' => $itemPekerjaan->produks->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'nama_produk' => $p->produk->nama_produk,
                        'jenisItems' => $p->jenisItems->map(function ($j) {
                            return [
                                'id' => $j->id,
                                'jenis_item_name' => $j->jenisItem->nama_jenis_item,
                                'items' => $j->items->map(function ($i) {
                                    return [
                                        'id' => $i->id,
                                        'nama_item' => $i->item->nama_item,
                                        'quantity' => $i->quantity,
                                        'keterangan_material' => $i->keterangan_material,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:item_pekerjaan_items,id',
            'items.*.keterangan_material' => 'nullable|string',
        ]);

        foreach ($request->items as $item) {
            ItemPekerjaanItem::where('id', $item['id'])->update([
                'keterangan_material' => $item['keterangan_material'],
            ]);
        }

        $notificationService = new NotificationService();
        $notificationService->sendWorkplanRequestNotification(
            ItemPekerjaan::find($id)->moodboard->order
        );

        return redirect()->route('approval-material.index')
            ->with('success', 'Approval material berhasil disimpan');
    }
}
