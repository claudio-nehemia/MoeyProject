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
use App\Services\NotificationService;
use App\Models\ItemPekerjaanJenisItem;
use App\Models\ItemPekerjaanProdukBahanBaku;

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
                    'status' => $moodboard->itemPekerjaan->status,
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
        $produks = Produk::with('bahanBakus')->select('id', 'nama_produk')->get();
        $jenisItems = JenisItem::where('nama_jenis_item', '!=', 'Bahan Baku')
            ->select('id', 'nama_jenis_item')
            ->get();
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
            'produks' => $produks->map(function ($produk) {
                return [
                    'id' => $produk->id,
                    'nama_produk' => $produk->nama_produk,
                    'harga_dasar' => $produk->harga_dasar,
                    'harga_jasa' => $produk->harga_jasa,
                    'bahan_bakus' => $produk->bahanBakus->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'nama_item' => $item->nama_item,
                            'harga' => $item->harga,
                            'pivot' => [
                                'harga_dasar' => $item->pivot->harga_dasar ?? 0,
                                'harga_jasa' => $item->pivot->harga_jasa ?? 0,
                            ],
                        ];
                    }),
                ];
            }),
            'jenisItems' => $jenisItems,
            'items' => $items,
        ]);
    }

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
                'produks.*.jenisItems.*.items.*.quantity' => 'required|integer|min:1',
            ]);

            // Update item pekerjaan status
            $itemPekerjaan = ItemPekerjaan::findOrFail($validated['item_pekerjaan_id']);
            $itemPekerjaan->update(['status' => $validated['status']]);

            // Save produks and nested data
            foreach ($validated['produks'] as $produkData) {
                // Set dimensi - gunakan nilai yang diinput, atau null jika kosong
                $panjang = isset($produkData['panjang']) && is_numeric($produkData['panjang']) 
                    ? (float)$produkData['panjang'] 
                    : null;
                $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar']) 
                    ? (float)$produkData['lebar'] 
                    : null;
                $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi']) 
                    ? (float)$produkData['tinggi'] 
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
                    Log::info('ItemPekerjaan Store - Master Produk BahanBakus: ' . json_encode($masterProduk->bahanBakus->map(function($b) {
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

            $statusMessage = $validated['status'] === 'draft' 
                ? 'Data item pekerjaan berhasil disimpan sebagai draft.' 
                : 'Data item pekerjaan berhasil dipublish.';

            $notificationService = new NotificationService();
            $notificationService->sendRabInternalRequestNotification($itemPekerjaan->moodboard->order);

            return redirect()->route('item-pekerjaan.index')
                ->with('success', $statusMessage);
        } catch (\Exception $e) {
            Log::error('Store item pekerjaan error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    public function edit($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'moodboard.order',
            'produks.produk.bahanBakus',
            'produks.bahanBakus.item',
            'produks.jenisItems.jenisItem',
            'produks.jenisItems.items.item'
        ])->findOrFail($itemPekerjaanId);
        
        // Get master data
        $produks = Produk::with('bahanBakus')->select('id', 'nama_produk')->get();
        $jenisItems = JenisItem::where('nama_jenis_item', '!=', 'Bahan Baku')
            ->select('id', 'nama_jenis_item')
            ->get();
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
                        'nama_ruangan' => $produk->nama_ruangan,
                        'quantity' => $produk->quantity,
                        'panjang' => $produk->panjang,
                        'lebar' => $produk->lebar,
                        'tinggi' => $produk->tinggi,
                        // Selected bahan baku IDs
                        'selected_bahan_bakus' => $produk->bahanBakus->pluck('item_id')->toArray(),
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
                                        'notes' => $item->notes,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),
            ],
            'produks' => $produks->map(function ($produk) {
                return [
                    'id' => $produk->id,
                    'nama_produk' => $produk->nama_produk,
                    'harga_dasar' => $produk->harga_dasar,
                    'harga_jasa' => $produk->harga_jasa,
                    'bahan_bakus' => $produk->bahanBakus->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'nama_item' => $item->nama_item,
                            'harga' => $item->harga,
                            'pivot' => [
                                'harga_dasar' => $item->pivot->harga_dasar ?? 0,
                                'harga_jasa' => $item->pivot->harga_jasa ?? 0,
                            ],
                        ];
                    }),
                ];
            }),
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
                        'nama_ruangan' => $produk->nama_ruangan,
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
                'produks.*.jenisItems.*.items.*.quantity' => 'required|integer|min:1',
                'produks.*.jenisItems.*.items.*.notes' => 'nullable|string',
            ]);

            $itemPekerjaan = ItemPekerjaan::findOrFail($itemPekerjaanId);
            
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
                        ? (float)$produkData['panjang'] 
                        : null;
                    $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar']) 
                        ? (float)$produkData['lebar'] 
                        : null;
                    $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi']) 
                        ? (float)$produkData['tinggi'] 
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
                        ? (float)$produkData['panjang'] 
                        : null;
                    $lebar = isset($produkData['lebar']) && is_numeric($produkData['lebar']) 
                        ? (float)$produkData['lebar'] 
                        : null;
                    $tinggi = isset($produkData['tinggi']) && is_numeric($produkData['tinggi']) 
                        ? (float)$produkData['tinggi'] 
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
                    Log::info('ItemPekerjaan Update - Master Produk BahanBakus: ' . json_encode($masterProduk->bahanBakus->map(function($b) {
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

            $statusMessage = $validated['status'] === 'draft' 
                ? 'Data item pekerjaan berhasil disimpan sebagai draft.' 
                : 'Data item pekerjaan berhasil dipublish.';

            return redirect()->route('item-pekerjaan.index')
                ->with('success', $statusMessage);
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
