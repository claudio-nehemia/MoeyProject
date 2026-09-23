<?php

namespace App\Http\Controllers\ItemPekerjaan\Traits;

use App\Models\Item;
use App\Models\Produk;
use App\Models\JenisItem;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Models\ItemPekerjaanProduk;
use App\Models\ItemPekerjaanJenisItem;
use App\Models\ItemPekerjaanProdukBahanBaku;
use App\Models\TaskResponse;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

trait HasItemPekerjaanMutations
{
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
                'status' => 'required|in:draft,published',
                'produks' => 'required|array|min:1',
                'produks.*.produk_id' => 'required|exists:produks,id',
                'produks.*.nama_ruangan' => 'nullable|string|max:255',
                'produks.*.quantity' => 'required|integer|min:1',
                'produks.*.panjang' => 'nullable|numeric|min:0',
                'produks.*.lebar' => 'nullable|numeric|min:0',
                'produks.*.tinggi' => 'nullable|numeric|min:0',
                'produks.*.bahan_bakus' => 'nullable|array', // Selected bahan baku IDs
                'produks.*.bahan_bakus.*' => 'exists:items,id',
                'produks.*.jenisItems' => 'array',
                'produks.*.jenisItems.*.jenis_item_id' => 'required|exists:jenis_items,id',
                'produks.*.jenisItems.*.items' => 'array',
                'produks.*.jenisItems.*.items.*.item_id' => 'required|exists:items,id',
                'produks.*.jenisItems.*.items.*.quantity' => 'required|numeric|min:0.01',
            ]);

            $itemPekerjaan = ItemPekerjaan::findOrFail($validated['item_pekerjaan_id']);
            $isDraft = $validated['status'] === 'draft';

            // Wrap in database transaction to ensure data integrity
            \DB::beginTransaction();

            // Update item pekerjaan status
            $itemPekerjaan->update(['status' => $validated['status']]);

            // Save produks and nested data
            foreach ($validated['produks'] as $produkData) {
                // Set dimensi - gunakan nilai yang diinput, atau null jika kosong
                $panjang = isset($produkData['panjang']) && is_numeric($produkData['panjang'])
                    ? (float) $produkData['panjang']
                    : null;
                $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar'])
                    ? (float) $produkData['lebar']
                    : null;
                $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi'])
                    ? (float) $produkData['tinggi']
                    : null;

                $produk = ItemPekerjaanProduk::create([
                    'item_pekerjaan_id' => $validated['item_pekerjaan_id'],
                    'nama_ruangan' => $produkData['nama_ruangan'] ?? null,
                    'produk_id' => $produkData['produk_id'],
                    'quantity' => $produkData['quantity'],
                    'panjang' => $panjang,
                    'lebar' => $lebar,
                    'tinggi' => $tinggi,
                ]);

                // Save selected bahan baku ke tabel item_pekerjaan_produk_bahan_bakus
                if (isset($produkData['bahan_bakus']) && count($produkData['bahan_bakus']) > 0) {
                    $masterProduk = Produk::with('bahanBakus')->find($produkData['produk_id']);

                    // DEBUG: Log master produk bahan bakus
                    Log::info('ItemPekerjaan Store - Produk ID: ' . $produkData['produk_id']);
                    Log::info('ItemPekerjaan Store - Master Produk BahanBakus: ' . json_encode($masterProduk->bahanBakus->map(function ($b) {
                        return [
                            'id' => $b->id,
                            'nama_item' => $b->nama_item,
                            'pivot_harga_dasar' => $b->pivot->harga_dasar ?? 'NULL',
                            'pivot_harga_jasa' => $b->pivot->harga_jasa ?? 'NULL',
                        ];
                    })->toArray()));
                    Log::info('ItemPekerjaan Store - Selected BahanBaku IDs: ' . json_encode($produkData['bahan_bakus']));

                    foreach ($produkData['bahan_bakus'] as $bahanBakuId) {
                        // Get harga_dasar and harga_jasa from produk_items pivot
                        $bahanBakuItem = $masterProduk->bahanBakus->firstWhere('id', $bahanBakuId);

                        Log::info('ItemPekerjaan Store - BahanBaku ID: ' . $bahanBakuId . ', Found: ' . ($bahanBakuItem ? 'YES' : 'NO'));
                        if ($bahanBakuItem) {
                            Log::info('ItemPekerjaan Store - BahanBaku pivot data: ' . json_encode([
                                'harga_dasar' => $bahanBakuItem->pivot->harga_dasar ?? 'NULL',
                                'harga_jasa' => $bahanBakuItem->pivot->harga_jasa ?? 'NULL',
                            ]));
                        }

                        $hargaDasar = $bahanBakuItem?->pivot?->harga_dasar ?? 0;
                        $hargaJasa = $bahanBakuItem?->pivot?->harga_jasa ?? 0;

                        ItemPekerjaanProdukBahanBaku::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'item_id' => $bahanBakuId,
                            'harga_dasar' => $hargaDasar,
                            'harga_jasa' => $hargaJasa,
                        ]);
                    }
                }

                // Save jenis items lainnya (Finishing Dalam, Finishing Luar, Aksesoris, dll)
                if (isset($produkData['jenisItems']) && count($produkData['jenisItems']) > 0) {
                    foreach ($produkData['jenisItems'] as $jenisItemData) {
                        $jenisItem = ItemPekerjaanJenisItem::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'jenis_item_id' => $jenisItemData['jenis_item_id'],
                        ]);

                        // Save items
                        if (isset($jenisItemData['items']) && count($jenisItemData['items']) > 0) {
                            foreach ($jenisItemData['items'] as $itemData) {
                                ItemPekerjaanItem::create([
                                    'item_pekerjaan_jenis_item_id' => $jenisItem->id,
                                    'item_id' => $itemData['item_id'],
                                    'quantity' => $itemData['quantity'],
                                    'notes' => $itemData['notes'] ?? null,
                                ]);
                            }
                        }
                    }
                }
            }

            // Commit transaction before sending notifications
            \DB::commit();

            $statusMessage = $validated['status'] === 'draft'
                ? 'Data item pekerjaan berhasil disimpan sebagai draft.'
                : 'Data item pekerjaan berhasil dipublish.';

            // Only send notification and update task response when publishing (not draft)
            if (!$isDraft) {
                // Send notification to RAB Internal
                $notificationService = new NotificationService();
                $notificationService->sendRabInternalRequestNotification($itemPekerjaan->moodboard->order);

                $taskResponse = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
                    ->where('tahap', 'item_pekerjaan')
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->where('is_marketing', false)
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

                    // Create task response untuk tahap selanjutnya (rab_internal)
                    $nextTaskExists = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
                        ->where('tahap', 'rab_internal')
                        ->exists();

                    if (!$nextTaskExists) {
                        TaskResponse::create([
                            'order_id' => $itemPekerjaan->moodboard->order->id,
                            'user_id' => null,
                            'tahap' => 'rab_internal',
                            'start_time' => now(),
                            'deadline' => now()->addDays(3),
                            'duration' => 3,
                            'duration_actual' => 3,
                            'extend_time' => 0,
                            'status' => 'menunggu_response',
                        ]);

                        TaskResponse::create([
                            'order_id' => $itemPekerjaan->moodboard->order->id,
                            'user_id' => null,
                            'tahap' => 'rab_internal',
                            'start_time' => now(),
                            'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                            'duration' => 3,
                            'duration_actual' => 3,
                            'extend_time' => 0,
                            'status' => 'menunggu_response',
                            'is_marketing' => true,
                        ]);
                    }
                }
            }

            return redirect()->route('item-pekerjaan.index')
                ->with('success', $statusMessage);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Store item pekerjaan error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $itemPekerjaanId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:draft,published',
                'produks' => 'required|array|min:1',
                'produks.*.id' => 'nullable|exists:item_pekerjaan_produks,id',
                'produks.*.produk_id' => 'required|exists:produks,id',
                'produks.*.nama_ruangan' => 'nullable|string|max:255',
                'produks.*.quantity' => 'required|integer|min:1',
                'produks.*.panjang' => 'nullable|numeric|min:0',
                'produks.*.lebar' => 'nullable|numeric|min:0',
                'produks.*.tinggi' => 'nullable|numeric|min:0',
                'produks.*.bahan_bakus' => 'nullable|array', // Selected bahan baku IDs
                'produks.*.bahan_bakus.*' => 'exists:items,id',
                'produks.*.jenisItems' => 'array',
                'produks.*.jenisItems.*.id' => 'nullable|exists:item_pekerjaan_jenis_items,id',
                'produks.*.jenisItems.*.jenis_item_id' => 'required|exists:jenis_items,id',
                'produks.*.jenisItems.*.items' => 'array',
                'produks.*.jenisItems.*.items.*.id' => 'nullable|exists:item_pekerjaan_items,id',
                'produks.*.jenisItems.*.items.*.item_id' => 'required|exists:items,id',
                'produks.*.jenisItems.*.items.*.quantity' => 'required|numeric|min:0.01',
                'produks.*.jenisItems.*.items.*.notes' => 'nullable|string',
            ]);

            $itemPekerjaan = ItemPekerjaan::findOrFail($itemPekerjaanId);
            $isDraft = $validated['status'] === 'draft';

            // Wrap in database transaction to ensure data integrity
            \DB::beginTransaction();

            // Update status
            $itemPekerjaan->update(['status' => $validated['status']]);

            // Get existing IDs for deletion
            $existingProdukIds = $itemPekerjaan->produks->pluck('id')->toArray();
            $submittedProdukIds = [];

            // Update or create produks
            foreach ($validated['produks'] as $produkData) {
                if (isset($produkData['id'])) {
                    // Update existing
                    $produk = ItemPekerjaanProduk::find($produkData['id']);
                    // Set dimensi - gunakan nilai yang diinput, atau null jika kosong
                    $panjang = isset($produkData['panjang']) && is_numeric($produkData['panjang'])
                        ? (float) $produkData['panjang']
                        : null;
                    $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar'])
                        ? (float) $produkData['lebar']
                        : null;
                    $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi'])
                        ? (float) $produkData['tinggi']
                        : null;

                    $produk->update([
                        'produk_id' => $produkData['produk_id'],
                        'nama_ruangan' => $produkData['nama_ruangan'] ?? null,
                        'quantity' => $produkData['quantity'],
                        'panjang' => $panjang,
                        'lebar' => $lebar,
                        'tinggi' => $tinggi,
                    ]);
                    $submittedProdukIds[] = $produk->id;
                } else {
                    // Create new
                    // Set dimensi - gunakan nilai yang diinput, atau null jika kosong
                    $panjang = isset($produkData['panjang']) && is_numeric($produkData['panjang'])
                        ? (float) $produkData['panjang']
                        : null;
                    $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar'])
                        ? (float) $produkData['lebar']
                        : null;
                    $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi'])
                        ? (float) $produkData['tinggi']
                        : null;

                    $produk = ItemPekerjaanProduk::create([
                        'item_pekerjaan_id' => $itemPekerjaanId,
                        'nama_ruangan' => $produkData['nama_ruangan'] ?? null,
                        'produk_id' => $produkData['produk_id'],
                        'quantity' => $produkData['quantity'],
                        'panjang' => $panjang,
                        'lebar' => $lebar,
                        'tinggi' => $tinggi,
                    ]);
                    $submittedProdukIds[] = $produk->id;
                }

                // Update selected bahan baku
                // Delete old bahan baku dan create new
                $produk->bahanBakus()->delete();

                if (isset($produkData['bahan_bakus']) && count($produkData['bahan_bakus']) > 0) {
                    $masterProduk = Produk::with('bahanBakus')->find($produkData['produk_id']);

                    // DEBUG: Log master produk bahan bakus
                    Log::info('ItemPekerjaan Update - Produk ID: ' . $produkData['produk_id']);
                    Log::info('ItemPekerjaan Update - Master Produk BahanBakus: ' . json_encode($masterProduk->bahanBakus->map(function ($b) {
                        return [
                            'id' => $b->id,
                            'nama_item' => $b->nama_item,
                            'pivot_harga_dasar' => $b->pivot->harga_dasar ?? 'NULL',
                            'pivot_harga_jasa' => $b->pivot->harga_jasa ?? 'NULL',
                        ];
                    })->toArray()));
                    Log::info('ItemPekerjaan Update - Selected BahanBaku IDs: ' . json_encode($produkData['bahan_bakus']));

                    foreach ($produkData['bahan_bakus'] as $bahanBakuId) {
                        // Get harga_dasar and harga_jasa from produk_items pivot
                        $bahanBakuItem = $masterProduk->bahanBakus->firstWhere('id', $bahanBakuId);

                        Log::info('ItemPekerjaan Update - BahanBaku ID: ' . $bahanBakuId . ', Found: ' . ($bahanBakuItem ? 'YES' : 'NO'));
                        if ($bahanBakuItem) {
                            Log::info('ItemPekerjaan Update - BahanBaku pivot data: ' . json_encode([
                                'harga_dasar' => $bahanBakuItem->pivot->harga_dasar ?? 'NULL',
                                'harga_jasa' => $bahanBakuItem->pivot->harga_jasa ?? 'NULL',
                            ]));
                        }

                        $hargaDasar = $bahanBakuItem?->pivot?->harga_dasar ?? 0;
                        $hargaJasa = $bahanBakuItem?->pivot?->harga_jasa ?? 0;

                        ItemPekerjaanProdukBahanBaku::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'item_id' => $bahanBakuId,
                            'harga_dasar' => $hargaDasar,
                            'harga_jasa' => $hargaJasa,
                        ]);
                    }
                }

                // Handle jenis items
                if (isset($produkData['jenisItems'])) {
                    $existingJenisIds = $produk->jenisItems()->pluck('id')->toArray();
                    $submittedJenisIds = [];

                    foreach ($produkData['jenisItems'] as $jenisItemData) {
                        if (isset($jenisItemData['id'])) {
                            // Update existing
                            $jenisItem = ItemPekerjaanJenisItem::find($jenisItemData['id']);
                            $submittedJenisIds[] = $jenisItem->id;
                        } else {
                            // Create new
                            $jenisItem = ItemPekerjaanJenisItem::create([
                                'item_pekerjaan_produk_id' => $produk->id,
                                'jenis_item_id' => $jenisItemData['jenis_item_id'],
                            ]);
                            $submittedJenisIds[] = $jenisItem->id;
                        }

                        // Handle items
                        if (isset($jenisItemData['items'])) {
                            $existingItemIds = $jenisItem->items->pluck('id')->toArray();
                            $submittedItemIds = [];

                            foreach ($jenisItemData['items'] as $itemData) {
                                if (isset($itemData['id'])) {
                                    // Update existing
                                    $item = ItemPekerjaanItem::find($itemData['id']);
                                    $item->update([
                                        'quantity' => $itemData['quantity'],
                                        'notes' => $itemData['notes'] ?? null,
                                    ]);
                                    $submittedItemIds[] = $item->id;
                                } else {
                                    // Create new
                                    $item = ItemPekerjaanItem::create([
                                        'item_pekerjaan_jenis_item_id' => $jenisItem->id,
                                        'item_id' => $itemData['item_id'],
                                        'quantity' => $itemData['quantity'],
                                        'notes' => $itemData['notes'] ?? null,
                                    ]);
                                    $submittedItemIds[] = $item->id;
                                }
                            }

                            // Delete removed items
                            $itemsToDelete = array_diff($existingItemIds, $submittedItemIds);
                            ItemPekerjaanItem::whereIn('id', $itemsToDelete)->delete();
                        }
                    }

                    // Delete removed jenis items
                    $jenisToDelete = array_diff($existingJenisIds, $submittedJenisIds);
                    ItemPekerjaanJenisItem::whereIn('id', $jenisToDelete)->delete();
                }
            }

            // Delete removed produks
            $produksToDelete = array_diff($existingProdukIds, $submittedProdukIds);
            ItemPekerjaanProduk::whereIn('id', $produksToDelete)->delete();

            // Commit transaction before sending notifications
            \DB::commit();

            $statusMessage = $validated['status'] === 'draft'
                ? 'Data item pekerjaan berhasil disimpan sebagai draft.'
                : 'Data item pekerjaan berhasil dipublish.';

            // Only send notification and update task response when publishing (not draft)
            if (!$isDraft) {
                // Send notification to RAB Internal
                $notificationService = new NotificationService();
                $notificationService->sendRabInternalRequestNotification($itemPekerjaan->moodboard->order);

                $taskResponse = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
                    ->where('tahap', 'item_pekerjaan')
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->where('is_marketing', false)
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

                    // Create task response untuk tahap selanjutnya (rab_internal)
                    $nextTaskExists = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
                        ->where('tahap', 'rab_internal')
                        ->exists();

                    if (!$nextTaskExists) {
                        TaskResponse::create([
                            'order_id' => $itemPekerjaan->moodboard->order->id,
                            'user_id' => null,
                            'tahap' => 'rab_internal',
                            'start_time' => now(),
                            'deadline' => now()->addDays(3),
                            'duration' => 3,
                            'duration_actual' => 3,
                            'extend_time' => 0,
                            'status' => 'menunggu_response',
                        ]);

                        TaskResponse::create([
                            'order_id' => $itemPekerjaan->moodboard->order->id,
                            'user_id' => null,
                            'tahap' => 'rab_internal',
                            'start_time' => now(),
                            'deadline' => now()->addDays(3),
                            'duration' => 3,
                            'duration_actual' => 3,
                            'extend_time' => 0,
                            'status' => 'menunggu_response',
                            'is_marketing' => true,
                        ]);
                    }
                }
            }
            return redirect()->route('item-pekerjaan.index')
                ->with('success', $statusMessage);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Update item pekerjaan error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal update data: ' . $e->getMessage());
        }
    }

    // Delete methods - tetap terpisah untuk flexibility
    public function deleteProduk($produkId)
    {
        try {
            $produk = ItemPekerjaanProduk::findOrFail($produkId);
            $produk->delete();

            return back()->with('success', 'Produk berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete produk error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus produk: ' . $e->getMessage());
        }
    }

    public function deleteJenisItem($jenisItemId)
    {
        try {
            $jenisItem = ItemPekerjaanJenisItem::findOrFail($jenisItemId);
            $jenisItem->delete();

            return back()->with('success', 'Jenis item berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete jenis item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus jenis item: ' . $e->getMessage());
        }
    }

    public function deleteItem($itemId)
    {
        try {
            $item = ItemPekerjaanItem::findOrFail($itemId);
            $item->delete();

            return back()->with('success', 'Item berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus item: ' . $e->getMessage());
        }
    }

}
