<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Services\NotificationService;
use App\Models\ItemPekerjaanProdukBahanBaku;

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
        $user = auth()->user();

        $items = ItemPekerjaan::with([
            'moodboard.order',
            'produks.jenisItems.items.item',
            'produks.bahanBakus.item', // 🔥 eager load bahan baku
        ])
            ->whereHas('moodboard.order', function ($query) use ($user) {
                $query->visibleToSurveyUser($user);
            })
            ->whereHas('moodboard.order.gambarKerja', function ($query) {
                $query->whereNotNull('approved_time')
                    ->whereNotNull('approved_by');
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($ip) {

                $allItems = $ip->produks
                    ->flatMap(
                        fn($produk) =>
                        $produk->jenisItems->flatMap(
                            fn($jenis) =>
                            $jenis->items
                        )
                    );

                // 🔥 Ambil semua bahan baku dari semua produk
                $allBahanBaku = $ip->produks
                    ->flatMap(fn($produk) => $produk->bahanBakus);

                return [
                    'id' => $ip->id,
                    'order_id' => $ip->moodboard->order->id,
                    'project_name' => $ip->moodboard->order->nama_project,
                    'company_name' => $ip->moodboard->order->company_name,
                    'customer_name' => $ip->moodboard->order->customer_name,
                    'total_items' => $allItems->count(),
                    'total_bahan_baku' => $allBahanBaku->count(), // 🔥 tambahan
                    
                    // Response tracking
                    'approval_rab_response_time' => $ip->approval_rab_response_time,
                    'approval_rab_response_by' => $ip->approval_rab_response_by,
                    'pm_approval_rab_response_time' => $ip->pm_approval_rab_response_time,
                    'pm_approval_rab_response_by' => $ip->pm_approval_rab_response_by,
    
                    // ⚠️ INI PENTING → supaya items_preview TIDAK undefined
                    'items_preview' => $allItems
                        ->map(fn($item) => [
                            'id' => $item->id,
                            'item_name' => $item->item->nama_item,
                            'quantity' => $item->quantity,
                            'keterangan_material' => $item->keterangan_material,
                        ])
                        ->values(),

                    // 🔥 tambahan preview bahan baku
                    'bahan_baku_preview' => $allBahanBaku
                        ->map(fn($bahan) => [
                            'id' => $bahan->id,
                            'item_name' => $bahan->item->nama_item,
                            'harga_dasar' => $bahan->harga_dasar,
                            'harga_jasa' => $bahan->harga_jasa,
                            'keterangan_bahan_baku' => $bahan->keterangan_bahan_baku,
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
            'produks.produk',
            'produks.jenisItems.items.item',
            'produks.jenisItems.jenisItem.items', // 🔥 master items
            'produks.bahanBakus.item', // 🔥 eager load bahan baku
        ])->findOrFail($itemPekerjaanId);

        $items = $itemPekerjaan->produks
            ->flatMap(
                fn($produk) =>
                $produk->jenisItems->flatMap(
                    fn($jenis) =>
                    $jenis->items->map(fn($item) => [
                        'id' => $item->id,

                        // 🔥 penting untuk select
                        'item_id' => $item->item_id,
                        'item_name' => $item->item->nama_item,

                        'produk' => $produk->produk->nama_produk,
                        'jenis_item' => $jenis->jenisItem->nama_jenis_item,
                        'quantity' => $item->quantity,
                        'keterangan_material' => $item->keterangan_material,

                        // 🔥 list dropdown
                        'available_items' => $jenis->jenisItem->items->map(fn($i) => [
                            'id' => $i->id,
                            'name' => $i->nama_item,
                        ])->values(),
                    ])
                )
            )
            ->values();

        // 🔥 Ambil bahan baku dari semua produk
        $bahanBakus = $itemPekerjaan->produks
            ->flatMap(
                fn($produk) =>
                $produk->bahanBakus->map(fn($bahan) => [
                    'id' => $bahan->id,
                    'item_name' => $bahan->item->nama_item,
                    'produk' => $produk->produk->nama_produk,
                    'harga_dasar' => $bahan->harga_dasar,
                    'harga_jasa' => $bahan->harga_jasa,
                    'keterangan_bahan_baku' => $bahan->keterangan_bahan_baku,
                ])
            )
            ->values();

        return Inertia::render('ApprovalRab/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'project_name' => $itemPekerjaan->moodboard->order->nama_project,
                'company_name' => $itemPekerjaan->moodboard->order->company_name,
                'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                'items' => $items,
                'bahan_bakus' => $bahanBakus, // 🔥 tambahan
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
            'bahan_bakus' => 'nullable|array',
            'bahan_bakus.*.id' => 'required|exists:item_pekerjaan_produk_bahan_bakus,id',
            'bahan_bakus.*.keterangan_bahan_baku' => 'nullable|string|max:1000',
        ]);

        foreach ($validated['items'] as $row) {
            ItemPekerjaanItem::where('id', $row['id'])->update([
                'item_id' => $row['item_id'],
                'keterangan_material' => $row['keterangan_material'],
            ]);
        }

        // Update bahan baku jika ada
        if (isset($validated['bahan_bakus'])) {
            foreach ($validated['bahan_bakus'] as $bahan) {
                ItemPekerjaanProdukBahanBaku::where('id', $bahan['id'])->update([
                    'keterangan_bahan_baku' => $bahan['keterangan_bahan_baku'],
                ]);
            }
        }

        // Get Order from ItemPekerjaan to send notification
        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        $order = $itemPekerjaan->moodboard->order;

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'approval_material')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse) {
            if ($taskResponse->isOverdue()) {
                $taskResponse->update([
                    'status' => 'telat_submit',
                    'update_data_time' => now(),
                ]);
            } else {
                $taskResponse->update([
                    'update_data_time' => now(),
                    'status' => 'selesai',
                ]);
            }

            // Create task response untuk tahap selanjutnya (cm_fee)
            $nextTaskExists = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'workplan')
                ->exists();

            if (!$nextTaskExists) {
                TaskResponse::create([
                    'order_id' => $order->id,
                    'user_id' => null,
                    'tahap' => 'workplan',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk workplan
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                ]);

                TaskResponse::create([
                    'order_id' => $order->id,
                    'user_id' => null,
                    'tahap' => 'workplan',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk workplan
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                    'is_marketing' => true,
                ]);
            }
        }

        // Send notification to PM and Estimator
        $notificationService = new NotificationService();
        $notificationService->sendWorkplanRequestNotification($order);

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'Keterangan material dan bahan baku berhasil disimpan dan notifikasi telah dikirim.');
    }

    public function responses(Request $request, $itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        if($itemPekerjaan->approval_rab_response_by) {
            return redirect()
                ->route('approval-material.index')
                ->with('error', 'RAB sudah pernah direspon.');
        }
        $itemPekerjaan->update([
            'approval_rab_response_by' => auth()->user()->name,
            'approval_rab_response_time' => now(),
        ]);

        $taskResponse = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
            ->where('tahap', 'approval_material')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()
            ->route('approval-material.index')
            ->with('success', 'RAB berhasil Diresponses.');
    }

}
