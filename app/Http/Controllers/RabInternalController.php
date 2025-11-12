<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\RabInternal;
use App\Models\RabProduk;
use App\Models\RabAksesoris;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanProduk;
use App\Models\ItemPekerjaanJenisItem;
use App\Models\ItemPekerjaanItem;
use App\Models\JenisItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RabInternalController extends Controller
{
    public function index()
    {
        // Get item pekerjaan yang sudah ada
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'rabInternal.rabProduks'
        ])
        ->whereHas('produks') // Only show if has produks
        ->get()
        ->map(function ($itemPekerjaan) {
            return [
                'id' => $itemPekerjaan->id,
                'order' => [
                    'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                ],
                'rabInternal' => $itemPekerjaan->rabInternal ? [
                    'id' => $itemPekerjaan->rabInternal->id,
                    'response_by' => $itemPekerjaan->rabInternal->response_by,
                    'response_time' => $itemPekerjaan->rabInternal->response_time,
                    'total_produks' => $itemPekerjaan->rabInternal->rabProduks->count(),
                ] : null,
            ];
        });

        return Inertia::render('RabInternal/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function responseRabInternal(Request $request, $itemPekerjaanId)
    {
        try {
            $itemPekerjaan = ItemPekerjaan::findOrFail($itemPekerjaanId);

            if($itemPekerjaan->rabInternal) {
                return back()->with('error', 'RAB Internal sudah ada untuk item pekerjaan ini.');
            }

            $rabInternal = RabInternal::create([
                'item_pekerjaan_id' => $itemPekerjaanId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);

            return redirect()->route('rab-internal.create', $rabInternal->id)
                ->with('success', 'RAB Internal response berhasil dibuat. Silakan input markup dan aksesoris.');
        } catch (\Exception $e) {
            Log::error('Response RAB Internal error: ' . $e->getMessage());
            return back()->with('error', 'Gagal membuat response RAB Internal: ' . $e->getMessage());
        }
    }

    public function create($rabInternalId)
    {
        $rabInternal = RabInternal::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.produks.produk',
            'itemPekerjaan.produks.jenisItems.jenisItem',
            'itemPekerjaan.produks.jenisItems.items.item'
        ])->findOrFail($rabInternalId);

        // Get Aksesoris jenis_item_id
        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        return Inertia::render('RabInternal/Create', [
            'rabInternal' => [
                'id' => $rabInternal->id,
                'itemPekerjaan' => [
                    'order' => [
                        'nama_project' => $rabInternal->itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $rabInternal->itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $rabInternal->itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'produks' => $rabInternal->itemPekerjaan->produks->map(function ($produk) use ($aksesorisJenisItem) {
                        // Hitung harga items non-aksesoris
                        $hargaItemsNonAksesoris = 0;
                        $aksesorisList = [];

                        foreach ($produk->jenisItems as $jenisItem) {
                            if ($jenisItem->jenis_item_id === $aksesorisJenisItem->id) {
                                // Collect aksesoris
                                foreach ($jenisItem->items as $item) {
                                    $aksesorisList[] = [
                                        'item_pekerjaan_item_id' => $item->id,
                                        'nama' => $item->item->nama_item,
                                        'harga_satuan' => $item->item->harga,
                                        'qty_item_pekerjaan' => $item->quantity,
                                    ];
                                }
                            } else {
                                // Sum non-aksesoris items
                                foreach ($jenisItem->items as $item) {
                                    $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                                }
                            }
                        }

                        return [
                            'id' => $produk->id,
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_produk' => $produk->produk->nama_produk,
                            'qty_produk' => $produk->quantity,
                            'panjang' => $produk->panjang,
                            'lebar' => $produk->lebar,
                            'tinggi' => $produk->tinggi,
                            'harga_dasar' => $produk->produk->harga,
                            'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                            'aksesoris' => $aksesorisList,
                        ];
                    }),
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'rab_internal_id' => 'required|exists:rab_internals,id',
                'produks' => 'required|array',
                'produks.*.item_pekerjaan_produk_id' => 'required|exists:item_pekerjaan_produks,id',
                'produks.*.markup_satuan' => 'required|numeric|min:0|max:100',
                'produks.*.aksesoris' => 'nullable|array',
                'produks.*.aksesoris.*.item_pekerjaan_item_id' => 'required|exists:item_pekerjaan_items,id',
                'produks.*.aksesoris.*.qty_aksesoris' => 'required|integer|min:1',
                'produks.*.aksesoris.*.markup_aksesoris' => 'required|numeric|min:0|max:100',
            ]);

            DB::beginTransaction();

            foreach ($validated['produks'] as $produkData) {
                // Get item pekerjaan produk data
                $itemProduk = ItemPekerjaanProduk::with(['produk', 'jenisItems.items.item'])->findOrFail($produkData['item_pekerjaan_produk_id']);
                
                // Calculate harga items non-aksesoris
                $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
                $hargaItemsNonAksesoris = 0;
                
                foreach ($itemProduk->jenisItems as $jenisItem) {
                    if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id) {
                        foreach ($jenisItem->items as $item) {
                            $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                        }
                    }
                }

                // Calculate harga dimensi (P × L × T × Qty)
                $hargaDimensi = 0;
                if ($itemProduk->panjang && $itemProduk->lebar && $itemProduk->tinggi) {
                    $hargaDimensi = $itemProduk->panjang * $itemProduk->lebar * $itemProduk->tinggi * $itemProduk->quantity;
                }


                // Calculate harga satuan = (harga_dasar + harga_items_non_aksesoris) * (1 + markup/100) * harga_dimensi
                $markupSatuan = $produkData['markup_satuan'];
                $hargaSatuan = ($itemProduk->produk->harga + $hargaItemsNonAksesoris) * (1 + $markupSatuan / 100) * $hargaDimensi;

                // Create RAB Produk
                $rabProduk = RabProduk::create([
                    'rab_internal_id' => $validated['rab_internal_id'],
                    'item_pekerjaan_produk_id' => $produkData['item_pekerjaan_produk_id'],
                    'markup_satuan' => $markupSatuan,
                    'harga_dasar' => $itemProduk->produk->harga,
                    'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                    'harga_dimensi' => $hargaDimensi,
                    'harga_satuan' => $hargaSatuan,
                    'harga_total_aksesoris' => 0, // Will be updated after aksesoris
                    'harga_akhir' => $hargaSatuan, // Will be updated after aksesoris
                ]);

                // Process Aksesoris
                $totalHargaAksesoris = 0;
                if (isset($produkData['aksesoris']) && count($produkData['aksesoris']) > 0) {
                    foreach ($produkData['aksesoris'] as $aksesorisData) {
                        $itemPekerjaanItem = ItemPekerjaanItem::with('item')->findOrFail($aksesorisData['item_pekerjaan_item_id']);
                        
                        // Calculate: harga_total = harga_satuan × qty × (1 + markup/100)
                        $hargaSatuanAksesoris = $itemPekerjaanItem->item->harga;
                        $qtyAksesoris = $aksesorisData['qty_aksesoris'];
                        $markupAksesoris = $aksesorisData['markup_aksesoris'];
                        $hargaTotalAksesoris = $hargaSatuanAksesoris * $qtyAksesoris * (1 + $markupAksesoris / 100);

                        RabAksesoris::create([
                            'rab_produk_id' => $rabProduk->id,
                            'item_pekerjaan_item_id' => $aksesorisData['item_pekerjaan_item_id'],
                            'nama_aksesoris' => $itemPekerjaanItem->item->nama_item,
                            'qty_aksesoris' => $qtyAksesoris,
                            'markup_aksesoris' => $markupAksesoris,
                            'harga_satuan_aksesoris' => $hargaSatuanAksesoris,
                            'harga_total' => $hargaTotalAksesoris,
                        ]);

                        $totalHargaAksesoris += $hargaTotalAksesoris;
                    }
                }

                // Update RAB Produk with total aksesoris
                $rabProduk->update([
                    'harga_total_aksesoris' => $totalHargaAksesoris,
                    'harga_akhir' => $hargaSatuan + $totalHargaAksesoris,
                ]);
            }

            DB::commit();

            return redirect()->route('rab-internal.index')
                ->with('success', 'RAB Internal berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store RAB Internal error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan RAB Internal: ' . $e->getMessage());
        }
    }

    public function show($rabInternalId)
    {
                $rabInternal = RabInternal::with([
            'itemPekerjaan.moodboard.order',
            'rabProduks.itemPekerjaanProduk.produk',
            'rabProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabProduks.rabAksesoris'
        ])->findOrFail($rabInternalId);

        // Get Aksesoris jenis_item_id
        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        return Inertia::render('RabInternal/Show', [
            'rabInternal' => [
                'id' => $rabInternal->id,
                'response_by' => $rabInternal->response_by,
                'response_time' => $rabInternal->response_time,
                'is_submitted' => $rabInternal->is_submitted,
                'submitted_by' => $rabInternal->submitted_by,
                'submitted_at' => $rabInternal->submitted_at,
                'order' => [
                    'nama_project' => $rabInternal->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $rabInternal->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $rabInternal->itemPekerjaan->moodboard->order->customer_name,
                ],
                'produks' => $rabInternal->rabProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
                    // Collect jenis items & items (non-aksesoris)
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id) {
                            $itemsList = [];
                            foreach ($jenisItem->items as $item) {
                                $itemsList[] = [
                                    'nama_item' => $item->item->nama_item,
                                    'harga_satuan' => $item->item->harga,
                                    'qty' => $item->quantity,
                                    'harga_total' => $item->item->harga * $item->quantity,
                                ];
                            }
                            
                            $jenisItemsList[] = [
                                'nama_jenis' => $jenisItem->jenisItem->nama_jenis_item,
                                'items' => $itemsList,
                            ];
                        }
                    }
                    
                    return [
                        'id' => $rabProduk->id,
                        'nama_produk' => $rabProduk->itemPekerjaanProduk->produk->nama_produk,
                        'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                        'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                        'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                        'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                        'markup_satuan' => $rabProduk->markup_satuan,
                        'harga_dasar' => $rabProduk->harga_dasar,
                        'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'jenis_items' => $jenisItemsList,
                        'aksesoris' => $rabProduk->rabAksesoris->map(function ($aksesoris) {
                            return [
                                'id' => $aksesoris->id,
                                'item_pekerjaan_item_id' => $aksesoris->item_pekerjaan_item_id,
                                'nama_aksesoris' => $aksesoris->nama_aksesoris,
                                'qty_aksesoris' => $aksesoris->qty_aksesoris,
                                'markup_aksesoris' => $aksesoris->markup_aksesoris,
                                'harga_satuan_aksesoris' => $aksesoris->harga_satuan_aksesoris,
                                'harga_total' => $aksesoris->harga_total,
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    public function edit($rabInternalId)
    {
        $rabInternal = RabInternal::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.produks.produk',
            'itemPekerjaan.produks.jenisItems.jenisItem',
            'itemPekerjaan.produks.jenisItems.items.item',
            'rabProduks.rabAksesoris'
        ])->findOrFail($rabInternalId);

        // Check if RAB has been created
        if ($rabInternal->rabProduks->isEmpty()) {
            return redirect()->route('rab-internal.create', $rabInternalId)
                ->with('info', 'RAB belum dibuat. Silakan buat RAB terlebih dahulu.');
        }

        // Get Aksesoris jenis_item_id
        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        return Inertia::render('RabInternal/Edit', [
            'rabInternal' => [
                'id' => $rabInternal->id,
                'itemPekerjaan' => [
                    'order' => [
                        'nama_project' => $rabInternal->itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $rabInternal->itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $rabInternal->itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'produks' => $rabInternal->itemPekerjaan->produks->map(function ($produk) use ($aksesorisJenisItem, $rabInternal) {
                        // Get existing RAB Produk
                        $rabProduk = $rabInternal->rabProduks->firstWhere('item_pekerjaan_produk_id', $produk->id);
                        
                        // Hitung harga items non-aksesoris
                        $hargaItemsNonAksesoris = 0;
                        $aksesorisList = [];

                        foreach ($produk->jenisItems as $jenisItem) {
                            if ($jenisItem->jenis_item_id === $aksesorisJenisItem->id) {
                                // Collect aksesoris
                                foreach ($jenisItem->items as $item) {
                                    // Find existing aksesoris in RAB
                                    $existingAks = $rabProduk ? $rabProduk->rabAksesoris->firstWhere('item_pekerjaan_item_id', $item->id) : null;
                                    
                                    $aksesorisList[] = [
                                        'id' => $existingAks ? $existingAks->id : null,
                                        'item_pekerjaan_item_id' => $item->id,
                                        'nama_aksesoris' => $item->item->nama_item,
                                        'harga_satuan_aksesoris' => $item->item->harga,
                                        'qty_aksesoris' => $existingAks ? $existingAks->qty_aksesoris : 1,
                                        'markup_aksesoris' => $existingAks ? $existingAks->markup_aksesoris : 0,
                                    ];
                                }
                            } else {
                                // Sum non-aksesoris items
                                foreach ($jenisItem->items as $item) {
                                    $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                                }
                            }
                        }

                        return [
                            'id' => $rabProduk ? $rabProduk->id : null,
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_produk' => $produk->produk->nama_produk,
                            'qty_produk' => $produk->quantity,
                            'panjang' => $produk->panjang,
                            'lebar' => $produk->lebar,
                            'tinggi' => $produk->tinggi,
                            'harga_dasar' => $produk->produk->harga,
                            'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                            'markup_satuan' => $rabProduk ? $rabProduk->markup_satuan : 0,
                            'aksesoris' => $aksesorisList,
                        ];
                    }),
                ],
            ],
        ]);
    }

    public function update(Request $request, $rabInternalId)
    {
        try {
            $validated = $request->validate([
                'produks' => 'required|array|min:1',
                'produks.*.id' => 'required|exists:rab_produks,id',
                'produks.*.item_pekerjaan_produk_id' => 'required|exists:item_pekerjaan_produks,id',
                'produks.*.markup_satuan' => 'required|numeric|min:0|max:100',
                'produks.*.aksesoris' => 'nullable|array',
                'produks.*.aksesoris.*.item_pekerjaan_item_id' => 'required|exists:item_pekerjaan_items,id',
                'produks.*.aksesoris.*.qty_aksesoris' => 'required|integer|min:1',
                'produks.*.aksesoris.*.markup_aksesoris' => 'required|numeric|min:0|max:100',
            ]);

            DB::beginTransaction();

            foreach ($validated['produks'] as $produkData) {
                // Get RAB Produk
                $rabProduk = RabProduk::findOrFail($produkData['id']);
                
                // Get item pekerjaan produk data
                $itemProduk = ItemPekerjaanProduk::with(['produk', 'jenisItems.items.item'])->findOrFail($produkData['item_pekerjaan_produk_id']);
                
                // Calculate harga items non-aksesoris
                $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
                $hargaItemsNonAksesoris = 0;
                
                foreach ($itemProduk->jenisItems as $jenisItem) {
                    if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id) {
                        foreach ($jenisItem->items as $item) {
                            $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                        }
                    }
                }

                // Calculate harga dimensi (P × L × T × Qty)
                $hargaDimensi = 0;
                if ($itemProduk->panjang && $itemProduk->lebar && $itemProduk->tinggi) {
                    $hargaDimensi = $itemProduk->panjang * $itemProduk->lebar * $itemProduk->tinggi * $itemProduk->quantity;
                }

                // Calculate harga satuan
                $markupSatuan = $produkData['markup_satuan'];
                $hargaSatuan = ($itemProduk->produk->harga + $hargaItemsNonAksesoris) * (1 + $markupSatuan / 100) * $hargaDimensi;

                // Update RAB Produk
                $rabProduk->update([
                    'markup_satuan' => $markupSatuan,
                    'harga_dasar' => $itemProduk->produk->harga,
                    'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                    'harga_dimensi' => $hargaDimensi,
                    'harga_satuan' => $hargaSatuan,
                ]);

                // Delete existing aksesoris
                $rabProduk->rabAksesoris()->delete();

                // Process Aksesoris
                $totalHargaAksesoris = 0;
                if (isset($produkData['aksesoris']) && count($produkData['aksesoris']) > 0) {
                    foreach ($produkData['aksesoris'] as $aksesorisData) {
                        $itemPekerjaanItem = ItemPekerjaanItem::with('item')->findOrFail($aksesorisData['item_pekerjaan_item_id']);
                        
                        // Calculate: harga_total = harga_satuan × qty × (1 + markup/100)
                        $hargaSatuanAksesoris = $itemPekerjaanItem->item->harga;
                        $qtyAksesoris = $aksesorisData['qty_aksesoris'];
                        $markupAksesoris = $aksesorisData['markup_aksesoris'];
                        $hargaTotalAksesoris = $hargaSatuanAksesoris * $qtyAksesoris * (1 + $markupAksesoris / 100);

                        RabAksesoris::create([
                            'rab_produk_id' => $rabProduk->id,
                            'item_pekerjaan_item_id' => $aksesorisData['item_pekerjaan_item_id'],
                            'nama_aksesoris' => $itemPekerjaanItem->item->nama_item,
                            'qty_aksesoris' => $qtyAksesoris,
                            'markup_aksesoris' => $markupAksesoris,
                            'harga_satuan_aksesoris' => $hargaSatuanAksesoris,
                            'harga_total' => $hargaTotalAksesoris,
                        ]);

                        $totalHargaAksesoris += $hargaTotalAksesoris;
                    }
                }

                // Update RAB Produk with total aksesoris
                $rabProduk->update([
                    'harga_total_aksesoris' => $totalHargaAksesoris,
                    'harga_akhir' => $hargaSatuan + $totalHargaAksesoris,
                ]);
            }

            DB::commit();

            return redirect()->route('rab-internal.index')
                ->with('success', 'RAB Internal berhasil diupdate.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Update RAB Internal error: ' . $e->getMessage());
            return back()->with('error', 'Gagal mengupdate RAB Internal: ' . $e->getMessage());
        }
    }

    public function submit($rabInternalId)
    {
        $rabInternal = RabInternal::with(['itemPekerjaan'])->findOrFail($rabInternalId);

        // Check if already submitted
        if ($rabInternal->is_submitted) {
            return redirect()->back()
                ->with('info', 'RAB sudah di-submit sebelumnya.');
        }

        // Check if all RAB types exist
        $itemPekerjaan = $rabInternal->itemPekerjaan;
        
        if (!$itemPekerjaan->rabKontrak) {
            return redirect()->back()
                ->with('error', 'RAB Kontrak belum ada. Silakan generate RAB Kontrak terlebih dahulu.');
        }

        if (!$itemPekerjaan->rabVendor) {
            return redirect()->back()
                ->with('error', 'RAB Vendor belum ada. Silakan generate RAB Vendor terlebih dahulu.');
        }

        if (!$itemPekerjaan->rabJasa) {
            return redirect()->back()
                ->with('error', 'RAB Jasa belum ada. Silakan generate RAB Jasa terlebih dahulu.');
        }

        // Submit RAB
        $rabInternal->update([
            'is_submitted' => true,
            'submitted_by' => auth()->user()->name ?? 'System',
            'submitted_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'RAB berhasil di-submit! Semua RAB (Internal, Kontrak, Vendor, Jasa) telah ACC.');
    }
}
