<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Inertia\Inertia;
use App\Models\Produk;
use App\Models\JenisItem;
use App\Models\Moodboard;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Models\ItemPekerjaanProduk;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\ItemPekerjaanJenisItem;

class ItemPekerjaanController extends Controller
{
    public function index()
    {
        // Get moodboards where moodboard_final exists
        $moodboards = Moodboard::with([
            'order',
            'itemPekerjaan.produks.produk',
            'itemPekerjaan.produks.jenisItems.jenisItem',
            'itemPekerjaan.produks.jenisItems.items.item'
        ])
        ->whereNotNull('moodboard_final')
        ->get()
        ->map(function ($moodboard) {
            return [
                'id' => $moodboard->id,
                'order' => [
                    'id' => $moodboard->order->id,
                    'nama_project' => $moodboard->order->nama_project,
                    'company_name' => $moodboard->order->company_name,
                    'customer_name' => $moodboard->order->customer_name,
                ],
                'itemPekerjaan' => $moodboard->itemPekerjaan ? [
                    'id' => $moodboard->itemPekerjaan->id,
                    'response_by' => $moodboard->itemPekerjaan->response_by,
                    'response_time' => $moodboard->itemPekerjaan->response_time,
                    'produks' => $moodboard->itemPekerjaan->produks->map(function ($produk) {
                        return [
                            'id' => $produk->id,
                            'produk_id' => $produk->produk_id,
                            'produk_name' => $produk->produk->nama_produk,
                            'quantity' => $produk->quantity,
                            'panjang' => $produk->panjang,
                            'lebar' => $produk->lebar,
                            'tinggi' => $produk->tinggi,
                            'jenisItems' => $produk->jenisItems->map(function ($jenisItem) {
                                return [
                                    'id' => $jenisItem->id,
                                    'jenis_item_id' => $jenisItem->jenis_item_id,
                                    'jenis_item_name' => $jenisItem->jenisItem->nama_jenis_item,
                                    'items' => $jenisItem->items->map(function ($item) {
                                        return [
                                            'id' => $item->id,
                                            'item_id' => $item->item_id,
                                            'item_name' => $item->item->nama_item,
                                            'quantity' => $item->quantity,
                                        ];
                                    }),
                                ];
                            }),
                        ];
                    }),
                ] : null,
            ];
        });

        return Inertia::render('ItemPekerjaan/index', [
            'moodboards' => $moodboards,
        ]);
    }

    public function responseItemPekerjaan(Request $request, $moodboardId)
    {
        try {
            Log::info('=== ITEM PEKERJAAN RESPONSE START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            
            $moodboard = Moodboard::findOrFail($moodboardId);

            if($moodboard->itemPekerjaan) {
                Log::warning('Item Pekerjaan already exists for moodboard: ' . $moodboardId);
                return back()->with('error', 'Item Pekerjaan response sudah ada untuk moodboard ini.');
            }

            $itemPekerjaan = ItemPekerjaan::create([
                'moodboard_id' => $moodboardId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
            
            Log::info('Item Pekerjaan created with ID: ' . $itemPekerjaan->id);
            Log::info('=== ITEM PEKERJAAN RESPONSE END ===');

            // Redirect to create page
            return redirect()->route('item-pekerjaan.create', $itemPekerjaan->id)
                ->with('success', 'Item Pekerjaan response berhasil dibuat. Silakan input produk dan item.');
        } catch (\Exception $e) {
            Log::error('Response item pekerjaan error: ' . $e->getMessage());
            return back()->with('error', 'Gagal membuat response item pekerjaan: ' . $e->getMessage());
        }
    }

    public function create($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        
        // Get master data
        $produks = Produk::select('id', 'nama_produk')->get();
        $jenisItems = JenisItem::select('id', 'nama_jenis_item')->get();
        $items = Item::select('id', 'nama_item', 'jenis_item_id')->get();

        return Inertia::render('ItemPekerjaan/Create', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'moodboard' => [
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                ],
            ],
            'produks' => $produks,
            'jenisItems' => $jenisItems,
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
                'produks' => 'required|array|min:1',
                'produks.*.produk_id' => 'required|exists:produks,id',
                'produks.*.quantity' => 'required|integer|min:1',
                'produks.*.panjang' => 'nullable|numeric|min:0',
                'produks.*.lebar' => 'nullable|numeric|min:0',
                'produks.*.tinggi' => 'nullable|numeric|min:0',
                'produks.*.jenisItems' => 'array',
                'produks.*.jenisItems.*.jenis_item_id' => 'required|exists:jenis_items,id',
                'produks.*.jenisItems.*.items' => 'array',
                'produks.*.jenisItems.*.items.*.item_id' => 'required|exists:items,id',
                'produks.*.jenisItems.*.items.*.quantity' => 'required|integer|min:1',
            ]);

            // Save produks and nested data
            foreach ($validated['produks'] as $produkData) {
                $produk = ItemPekerjaanProduk::create([
                    'item_pekerjaan_id' => $validated['item_pekerjaan_id'],
                    'produk_id' => $produkData['produk_id'],
                    'quantity' => $produkData['quantity'],
                    'panjang' => $produkData['panjang'] ?? null,
                    'lebar' => $produkData['lebar'] ?? null,
                    'tinggi' => $produkData['tinggi'] ?? null,
                ]);

                // Save jenis items
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
                                ]);
                            }
                        }
                    }
                }
            }

            return redirect()->route('item-pekerjaan.index')
                ->with('success', 'Data item pekerjaan berhasil disimpan.');
        } catch (\Exception $e) {
            Log::error('Store item pekerjaan error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    public function edit($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk',
            'produks.jenisItems.jenisItem',
            'produks.jenisItems.items.item'
        ])->findOrFail($itemPekerjaanId);
        
        // Get master data
        $produks = Produk::select('id', 'nama_produk')->get();
        $jenisItems = JenisItem::select('id', 'nama_jenis_item')->get();
        $items = Item::select('id', 'nama_item', 'jenis_item_id')->get();

        return Inertia::render('ItemPekerjaan/Edit', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'moodboard' => [
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                ],
                'produks' => $itemPekerjaan->produks->map(function ($produk) {
                    return [
                        'id' => $produk->id,
                        'produk_id' => $produk->produk_id,
                        'produk_name' => $produk->produk->nama_produk,
                        'quantity' => $produk->quantity,
                        'panjang' => $produk->panjang,
                        'lebar' => $produk->lebar,
                        'tinggi' => $produk->tinggi,
                        'jenisItems' => $produk->jenisItems->map(function ($jenisItem) {
                            return [
                                'id' => $jenisItem->id,
                                'jenis_item_id' => $jenisItem->jenis_item_id,
                                'jenis_item_name' => $jenisItem->jenisItem->nama_jenis_item,
                                'items' => $jenisItem->items->map(function ($item) {
                                    return [
                                        'id' => $item->id,
                                        'item_id' => $item->item_id,
                                        'item_name' => $item->item->nama_item,
                                        'quantity' => $item->quantity,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),
            ],
            'produks' => $produks,
            'jenisItems' => $jenisItems,
            'items' => $items,
        ]);
    }

    public function show($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk',
            'produks.jenisItems.jenisItem',
            'produks.jenisItems.items.item'
        ])->findOrFail($itemPekerjaanId);

        return Inertia::render('ItemPekerjaan/Show', [
            'itemPekerjaan' => [
                'id' => $itemPekerjaan->id,
                'response_by' => $itemPekerjaan->response_by,
                'response_time' => $itemPekerjaan->response_time,
                'moodboard' => [
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                ],
                'produks' => $itemPekerjaan->produks->map(function ($produk) {
                    return [
                        'id' => $produk->id,
                        'produk_id' => $produk->produk_id,
                        'produk_name' => $produk->produk->nama_produk,
                        'quantity' => $produk->quantity,
                        'panjang' => $produk->panjang,
                        'lebar' => $produk->lebar,
                        'tinggi' => $produk->tinggi,
                        'jenisItems' => $produk->jenisItems->map(function ($jenisItem) {
                            return [
                                'id' => $jenisItem->id,
                                'jenis_item_id' => $jenisItem->jenis_item_id,
                                'jenis_item_name' => $jenisItem->jenisItem->nama_jenis_item,
                                'items' => $jenisItem->items->map(function ($item) {
                                    return [
                                        'id' => $item->id,
                                        'item_id' => $item->item_id,
                                        'item_name' => $item->item->nama_item,
                                        'quantity' => $item->quantity,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    public function update(Request $request, $itemPekerjaanId)
    {
        try {
            $validated = $request->validate([
                'produks' => 'required|array|min:1',
                'produks.*.id' => 'nullable|exists:item_pekerjaan_produks,id',
                'produks.*.produk_id' => 'required|exists:produks,id',
                'produks.*.quantity' => 'required|integer|min:1',
                'produks.*.panjang' => 'nullable|numeric|min:0',
                'produks.*.lebar' => 'nullable|numeric|min:0',
                'produks.*.tinggi' => 'nullable|numeric|min:0',
                'produks.*.jenisItems' => 'array',
                'produks.*.jenisItems.*.id' => 'nullable|exists:item_pekerjaan_jenis_items,id',
                'produks.*.jenisItems.*.jenis_item_id' => 'required|exists:jenis_items,id',
                'produks.*.jenisItems.*.items' => 'array',
                'produks.*.jenisItems.*.items.*.id' => 'nullable|exists:item_pekerjaan_items,id',
                'produks.*.jenisItems.*.items.*.item_id' => 'required|exists:items,id',
                'produks.*.jenisItems.*.items.*.quantity' => 'required|integer|min:1',
            ]);

            $itemPekerjaan = ItemPekerjaan::findOrFail($itemPekerjaanId);

            // Get existing IDs for deletion
            $existingProdukIds = $itemPekerjaan->produks->pluck('id')->toArray();
            $submittedProdukIds = [];

            // Update or create produks
            foreach ($validated['produks'] as $produkData) {
                if (isset($produkData['id'])) {
                    // Update existing
                    $produk = ItemPekerjaanProduk::find($produkData['id']);
                    $produk->update([
                        'quantity' => $produkData['quantity'],
                        'panjang' => $produkData['panjang'] ?? null,
                        'lebar' => $produkData['lebar'] ?? null,
                        'tinggi' => $produkData['tinggi'] ?? null,
                    ]);
                    $submittedProdukIds[] = $produk->id;
                } else {
                    // Create new
                    $produk = ItemPekerjaanProduk::create([
                        'item_pekerjaan_id' => $itemPekerjaanId,
                        'produk_id' => $produkData['produk_id'],
                        'quantity' => $produkData['quantity'],
                        'panjang' => $produkData['panjang'] ?? null,
                        'lebar' => $produkData['lebar'] ?? null,
                        'tinggi' => $produkData['tinggi'] ?? null,
                    ]);
                    $submittedProdukIds[] = $produk->id;
                }

                // Handle jenis items
                if (isset($produkData['jenisItems'])) {
                    $existingJenisIds = $produk->jenisItems->pluck('id')->toArray();
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
                                    ]);
                                    $submittedItemIds[] = $item->id;
                                } else {
                                    // Create new
                                    $item = ItemPekerjaanItem::create([
                                        'item_pekerjaan_jenis_item_id' => $jenisItem->id,
                                        'item_id' => $itemData['item_id'],
                                        'quantity' => $itemData['quantity'],
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

            return redirect()->route('item-pekerjaan.index')
                ->with('success', 'Data item pekerjaan berhasil diupdate.');
        } catch (\Exception $e) {
            Log::error('Update item pekerjaan error: ' . $e->getMessage());
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
