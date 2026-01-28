<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\JenisItem;
use App\Models\RabProduk;
use App\Models\RabInternal;
use App\Models\RabAksesoris;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use Illuminate\Support\Facades\DB;
use App\Models\ItemPekerjaanProduk;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use App\Models\ItemPekerjaanJenisItem;

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
                    'status' => $itemPekerjaan->status,
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

            // Check if item pekerjaan status is published
            if ($itemPekerjaan->status !== 'published') {
                return back()->with('error', 'Item Pekerjaan masih dalam status draft. Harap publish terlebih dahulu.');
            }

            if ($itemPekerjaan->rabInternal) {
                return back()->with('error', 'RAB Internal sudah ada untuk item pekerjaan ini.');
            }

            $rabInternal = RabInternal::create([
                'item_pekerjaan_id' => $itemPekerjaanId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);

            $itemPekerjaan->moodboard->order->update([
                'tahapan_proyek' => 'rab',
            ]);

            $taskResponse = TaskResponse::where('order_id', $itemPekerjaan->moodboard->order->id)
                ->where('tahap', 'rab_internal')
                ->first();

            if ($taskResponse && $taskResponse->status === 'menunggu_response') {
                $taskResponse->update([
                    'user_id' => auth()->user()->id,
                    'response_time' => now(),
                    'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                    'duration' => 6,
                    'duration_actual' => $taskResponse->duration_actual,
                    'status' => 'menunggu_input',
                ]);
            }

            Log::info('RAB Internal created with ID: ' . $rabInternal->id);

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
            'itemPekerjaan.produks.produk.bahanBakus',
            'itemPekerjaan.produks.bahanBakus.item', // Selected bahan baku
            'itemPekerjaan.produks.jenisItems.jenisItem',
            'itemPekerjaan.produks.jenisItems.items.item'
        ])->findOrFail($rabInternalId);

        // Get Aksesoris jenis_item_id
        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        return Inertia::render('RabInternal/Create', [
            'rabInternal' => [
                'id' => $rabInternal->id,
                'itemPekerjaan' => [
                    'order' => [
                        'nama_project' => $rabInternal->itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $rabInternal->itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $rabInternal->itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'produks' => $rabInternal->itemPekerjaan->produks->map(function ($produk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {
                        // Hitung harga items non-aksesoris (Finishing Dalam/Luar)
                        $hargaItemsNonAksesoris = 0;
                        $aksesorisList = [];
                        $nonAksesorisList = [];

                        // Get selected bahan baku from item_pekerjaan_produk_bahan_bakus
                        $selectedBahanBakus = $produk->bahanBakus;
                        $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                        // Hitung harga dasar produk = total harga_dasar dari selected bahan baku
                        $hargaDasarProduk = $selectedBahanBakus->sum('harga_dasar');

                        foreach ($produk->jenisItems as $jenisItem) {
                            if ($jenisItem->jenis_item_id === $aksesorisJenisItem?->id) {
                                // Collect aksesoris
                                foreach ($jenisItem->items as $item) {
                                    $aksesorisList[] = [
                                        'id' => $item->id,
                                        'item_pekerjaan_item_id' => $item->id,
                                        'nama' => $item->item->nama_item,
                                        'harga_satuan' => $item->item->harga,
                                        'qty_item_pekerjaan' => $item->quantity,
                                    ];
                                }
                            } elseif ($jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                                // Collect non-aksesoris items (Finishing Dalam/Luar only, exclude Bahan Baku)
                                foreach ($jenisItem->items as $item) {
                                    $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                                    $nonAksesorisList[] = [
                                        'id' => $item->id,
                                        'nama' => $item->item->nama_item,
                                        'harga_satuan' => $item->item->harga * $item->quantity,
                                    ];
                                }
                            }
                        }

                        return [
                            'id' => $produk->id,
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_produk' => $produk->produk->nama_produk,
                            'nama_ruangan' => $produk->nama_ruangan,
                            'qty_produk' => $produk->quantity,
                            'panjang' => $produk->panjang,
                            'lebar' => $produk->lebar,
                            'tinggi' => $produk->tinggi,
                            'harga_dasar' => $hargaDasarProduk, // Total harga_dasar dari selected bahan baku
                            'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                            'non_aksesoris_items' => $nonAksesorisList,
                            'bahan_baku_names' => $bahanBakuNames, // Nama bahan baku yang dipilih
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
                // Get item pekerjaan produk data with selected bahan bakus
                $itemProduk = ItemPekerjaanProduk::with(['produk', 'bahanBakus', 'jenisItems.items.item'])->findOrFail($produkData['item_pekerjaan_produk_id']);

                // Calculate harga dasar dari selected bahan baku
                $hargaDasarProduk = $itemProduk->bahanBakus->sum('harga_dasar');

                // Calculate harga items non-aksesoris (exclude Bahan Baku)
                $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
                $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();
                $hargaItemsNonAksesoris = 0;

                foreach ($itemProduk->jenisItems as $jenisItem) {
                    if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                        foreach ($jenisItem->items as $item) {
                            $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                        }
                    }
                }

                // Calculate harga dimensi (P × L × T × Qty)
                // If all dimensions exist and are not null, use them with minimum value of 1 each
                // Otherwise default to qty only
                $hargaDimensi = 1;
                if ($itemProduk->panjang !== null && $itemProduk->lebar !== null && $itemProduk->tinggi !== null) {
                    // Use max(1, value) to ensure minimum 1 for calculation
                    $panjangCalc = max(1, (float) $itemProduk->panjang);
                    $lebarCalc = max(1, (float) $itemProduk->lebar);
                    $tinggiCalc = max(1, (float) $itemProduk->tinggi);
                    $hargaDimensi = $panjangCalc * $lebarCalc * $tinggiCalc * $itemProduk->quantity;
                } else {
                    $hargaDimensi = $itemProduk->quantity;
                }

                // ✅ RUMUS RAB INTERNAL (Sesuai Permintaan Klien):
                // Harga Satuan = (Harga Bahan Baku + Harga Finishing) / (Markup / 100) × Dimensi × Qty
                // Contoh: Markup 150% → 150/100 = 1.5, terus harga dibagi 1.5
                // Note: hargaDimensi sudah include qty
                $markupSatuan = $produkData['markup_satuan'];
                $markupDivider = $markupSatuan / 100; // 150 → 1.5
                $hargaSatuan = ($hargaDasarProduk + $hargaItemsNonAksesoris) / $markupDivider * $hargaDimensi;

                // Create RAB Produk
                $rabProduk = RabProduk::create([
                    'rab_internal_id' => $validated['rab_internal_id'],
                    'item_pekerjaan_produk_id' => $produkData['item_pekerjaan_produk_id'],
                    'markup_satuan' => $markupSatuan,
                    'harga_dasar' => $hargaDasarProduk, // Total harga_dasar dari selected bahan baku
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

                        // ✅ RUMUS AKSESORIS (Sesuai Permintaan Klien):
                        // Harga Total = (Harga Satuan Aks ÷ (1 - markup/100)) × Qty
                        $hargaSatuanAksesoris = $itemPekerjaanItem->item->harga;
                        $qtyAksesoris = $aksesorisData['qty_aksesoris'];
                        $markupAksesoris = $aksesorisData['markup_aksesoris'];
                        $markupDivider = 1 - ($markupAksesoris / 100); // 20% → 1-0.2 = 0.8
                        $hargaTotalAksesoris = ($hargaSatuanAksesoris / $markupDivider) * $qtyAksesoris;

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
                // ✅ APPLY DISKON: Harga Diskon = Harga Jual - (diskon/100 × Harga Jual)
                $diskonPerProduk = $produkData['diskon_per_produk'] ?? 0;
                $hargaSebelumDiskon = $hargaSatuan + $totalHargaAksesoris;
                $hargaAkhir = $hargaSebelumDiskon - ($hargaSebelumDiskon * $diskonPerProduk / 100);

                $rabProduk->update([
                    'harga_total_aksesoris' => $totalHargaAksesoris,
                    'diskon_per_produk' => $diskonPerProduk,
                    'harga_akhir' => $hargaAkhir,
                ]);
            }

            $rabInternal = RabInternal::with('itemPekerjaan.moodboard.order')
                ->findOrFail($validated['rab_internal_id']);

            // Get Order dari relasi
            $order = $rabInternal->itemPekerjaan->moodboard->order;

            $taskResponse = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'rab_internal')
                ->first();

            if ($taskResponse) {
                $taskResponse->update([
                    'update_data_time' => now(), // Kapan data diisi
                    'status' => 'selesai',
                ]);
                
                // Catatan: Task response untuk kontrak akan dibuat saat submit RAB
                // (di method submit() setelah semua RAB type sudah ada)
                // Jadi tidak perlu create di sini
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
            'rabProduks.itemPekerjaanProduk.produk.bahanBakus',
            'rabProduks.itemPekerjaanProduk.bahanBakus.item', // Selected bahan baku
            'rabProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabProduks.rabAksesoris'
        ])->findOrFail($rabInternalId);

        // Get Aksesoris jenis_item_id
        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

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
                'produks' => $rabInternal->rabProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {
                    // Get selected bahan baku names
                    $selectedBahanBakus = $rabProduk->itemPekerjaanProduk->bahanBakus;
                    $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                    // Collect jenis items & items (Finishing Dalam/Luar only, exclude Aksesoris & Bahan Baku)
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
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
                        'nama_ruangan' => $rabProduk->itemPekerjaanProduk->nama_ruangan,
                        'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                        'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                        'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                        'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                        'markup_satuan' => $rabProduk->markup_satuan,
                        'harga_dasar' => $rabProduk->harga_dasar, // Already saved from selected bahan baku total
                        'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'bahan_baku_names' => $bahanBakuNames,
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
            'itemPekerjaan.produks.produk.bahanBakus',
            'itemPekerjaan.produks.bahanBakus.item', // Selected bahan baku
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
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        return Inertia::render('RabInternal/Edit', [
            'rabInternal' => [
                'id' => $rabInternal->id,
                'itemPekerjaan' => [
                    'order' => [
                        'nama_project' => $rabInternal->itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $rabInternal->itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $rabInternal->itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'produks' => $rabInternal->itemPekerjaan->produks->map(function ($produk) use ($aksesorisJenisItem, $bahanBakuJenisItem, $rabInternal) {
                        // Get existing RAB Produk
                        $rabProduk = $rabInternal->rabProduks->firstWhere('item_pekerjaan_produk_id', $produk->id);

                        // Get selected bahan baku
                        $selectedBahanBakus = $produk->bahanBakus;
                        $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                        // Hitung harga dasar produk = total harga_dasar dari selected bahan baku
                        $hargaDasarProduk = $selectedBahanBakus->sum('harga_dasar');

                        // Hitung harga items non-aksesoris (Finishing Dalam/Luar)
                        $hargaItemsNonAksesoris = 0;
                        $aksesorisList = [];
                        $nonAksesorisList = [];

                        foreach ($produk->jenisItems as $jenisItem) {
                            if ($jenisItem->jenis_item_id === $aksesorisJenisItem?->id) {
                                // Collect aksesoris
                                foreach ($jenisItem->items as $item) {
                                    // Find existing aksesoris in RAB
                                    $existingAks = $rabProduk ? $rabProduk->rabAksesoris->firstWhere('item_pekerjaan_item_id', $item->id) : null;

                                    $aksesorisList[] = [
                                        'id' => $existingAks ? $existingAks->id : null,
                                        'item_pekerjaan_item_id' => $item->id,
                                        'nama_aksesoris' => $item->item->nama_item,
                                        'harga_satuan_aksesoris' => $item->item->harga,
                                        'qty_aksesoris' => $existingAks ? $existingAks->qty_aksesoris : $item->quantity,
                                        'markup_aksesoris' => $existingAks ? $existingAks->markup_aksesoris : 0,
                                    ];
                                }
                            } elseif ($jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                                // Sum non-aksesoris items (Finishing Dalam/Luar only, exclude Bahan Baku)
                                foreach ($jenisItem->items as $item) {
                                    $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                                    $nonAksesorisList[] = [
                                        'id' => $item->id,
                                        'nama' => $item->item->nama_item,
                                        'harga_satuan' => $item->item->harga * $item->quantity,
                                    ];
                                }
                            }
                        }

                        return [
                            'id' => $rabProduk ? $rabProduk->id : null,
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_produk' => $produk->produk->nama_produk,
                            'nama_ruangan' => $produk->nama_ruangan, // 🔥 tambahkan nama_ruangan
                            'qty_produk' => $produk->quantity,
                            'panjang' => $produk->panjang,
                            'lebar' => $produk->lebar,
                            'tinggi' => $produk->tinggi,
                            'harga_dasar' => $hargaDasarProduk, // Total harga_dasar dari selected bahan baku
                            'harga_items_non_aksesoris' => $hargaItemsNonAksesoris,
                            'non_aksesoris_items' => $nonAksesorisList ?? [],
                            'bahan_baku_names' => $bahanBakuNames,
                            'markup_satuan' => $rabProduk ? $rabProduk->markup_satuan : 0,
                            'diskon_per_produk' => $rabProduk ? $rabProduk->diskon_per_produk : 0,
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
                'produks.*.id' => 'nullable|exists:rab_produks,id', // 🔥 nullable untuk produk baru
                'produks.*.item_pekerjaan_produk_id' => 'required|exists:item_pekerjaan_produks,id',
                'produks.*.markup_satuan' => 'required|numeric|min:0|max:100',
                'produks.*.diskon_per_produk' => 'nullable|numeric|min:0|max:100',
                'produks.*.aksesoris' => 'nullable|array',
                'produks.*.aksesoris.*.item_pekerjaan_item_id' => 'required|exists:item_pekerjaan_items,id',
                'produks.*.aksesoris.*.qty_aksesoris' => 'required|integer|min:1',
                'produks.*.aksesoris.*.markup_aksesoris' => 'required|numeric|min:0|max:100',
            ]);

            DB::beginTransaction();

            foreach ($validated['produks'] as $produkData) {
                // 🔥 Check if produk baru (id = null) atau existing
                if (empty($produkData['id'])) {
                    // Create new RAB Produk untuk produk yang baru ditambahkan
                    $rabProduk = new RabProduk();
                    $rabProduk->rab_internal_id = $rabInternalId;
                    $rabProduk->item_pekerjaan_produk_id = $produkData['item_pekerjaan_produk_id'];
                } else {
                    // Get existing RAB Produk
                    $rabProduk = RabProduk::findOrFail($produkData['id']);
                }

                // Get item pekerjaan produk data with selected bahan bakus
                $itemProduk = ItemPekerjaanProduk::with(['produk', 'bahanBakus', 'jenisItems.items.item'])->findOrFail($produkData['item_pekerjaan_produk_id']);

                // Calculate harga dasar dari selected bahan baku
                $hargaDasarProduk = $itemProduk->bahanBakus->sum('harga_dasar');

                // Calculate harga items non-aksesoris (exclude Bahan Baku)
                $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
                $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();
                $hargaItemsNonAksesoris = 0;

                foreach ($itemProduk->jenisItems as $jenisItem) {
                    if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                        foreach ($jenisItem->items as $item) {
                            $hargaItemsNonAksesoris += ($item->item->harga * $item->quantity);
                        }
                    }
                }

                // Calculate harga dimensi (P × L × T × Qty)
                // If all dimensions exist and are not null, use them with minimum value of 1 each
                // Otherwise default to qty only
                $hargaDimensi = 1;
                if ($itemProduk->panjang !== null && $itemProduk->lebar !== null && $itemProduk->tinggi !== null) {
                    // Use max(1, value) to ensure minimum 1 for calculation
                    $panjangCalc = max(1, (float) $itemProduk->panjang);
                    $lebarCalc = max(1, (float) $itemProduk->lebar);
                    $tinggiCalc = max(1, (float) $itemProduk->tinggi);
                    $hargaDimensi = $panjangCalc * $lebarCalc * $tinggiCalc * $itemProduk->quantity;
                } else {
                    $hargaDimensi = $itemProduk->quantity;
                }

                // ✅ RUMUS RAB INTERNAL (Sesuai Permintaan Klien):
                // Harga Satuan = (Harga Bahan Baku + Harga Finishing) ÷ (1 - markup/100) × Dimensi × Qty
                // Contoh: Markup 20% → (100) / (1-0.2) = 100/0.8 = 125
                // Note: hargaDimensi sudah include qty
                $markupSatuan = $produkData['markup_satuan'];
                $markupDivider = 1 - ($markupSatuan / 100); // 20% → 1-0.2 = 0.8
                $hargaSatuan = ($hargaDasarProduk + $hargaItemsNonAksesoris) / $markupDivider * $hargaDimensi;

                // Save RAB Produk (create atau update)
                $rabProduk->markup_satuan = $markupSatuan;
                $rabProduk->harga_dasar = $hargaDasarProduk; // Total harga_dasar dari selected bahan baku
                $rabProduk->harga_items_non_aksesoris = $hargaItemsNonAksesoris;
                $rabProduk->harga_dimensi = $hargaDimensi;
                $rabProduk->harga_satuan = $hargaSatuan;
                $rabProduk->save(); // 🔥 save() untuk handle create & update

                // Delete existing aksesoris
                $rabProduk->rabAksesoris()->delete();

                // Process Aksesoris
                $totalHargaAksesoris = 0;
                if (isset($produkData['aksesoris']) && count($produkData['aksesoris']) > 0) {
                    foreach ($produkData['aksesoris'] as $aksesorisData) {
                        $itemPekerjaanItem = ItemPekerjaanItem::with('item')->findOrFail($aksesorisData['item_pekerjaan_item_id']);

                        // ✅ RUMUS AKSESORIS (Sesuai Permintaan Klien):
                        // Harga Total = (Harga Satuan Aks ÷ (1 - markup/100)) × Qty
                        $hargaSatuanAksesoris = $itemPekerjaanItem->item->harga;
                        $qtyAksesoris = $aksesorisData['qty_aksesoris'];
                        $markupAksesoris = $aksesorisData['markup_aksesoris'];
                        $markupDivider = 1 - ($markupAksesoris / 100); // 20% → 1-0.2 = 0.8
                        $hargaTotalAksesoris = ($hargaSatuanAksesoris / $markupDivider) * $qtyAksesoris;

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
                // ✅ APPLY DISKON: Harga Diskon = Harga Jual - (diskon/100 × Harga Jual)
                $diskonPerProduk = $produkData['diskon_per_produk'] ?? 0;
                $hargaSebelumDiskon = $hargaSatuan + $totalHargaAksesoris;
                $hargaAkhir = $hargaSebelumDiskon - ($hargaSebelumDiskon * $diskonPerProduk / 100);

                $rabProduk->update([
                    'harga_total_aksesoris' => $totalHargaAksesoris,
                    'diskon_per_produk' => $diskonPerProduk,
                    'harga_akhir' => $hargaAkhir,
                ]);
            }

            // Update task response: data sudah diisi
            $rabInternal = RabInternal::with('itemPekerjaan.moodboard.order')
                ->findOrFail($rabInternalId);
            $order = $rabInternal->itemPekerjaan->moodboard->order;

            $taskResponse = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'rab_internal')
                ->first();

            if ($taskResponse) {
                $taskResponse->update([
                    'update_data_time' => now(),
                    'status' => 'selesai',
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

        $notificationService = new NotificationService();
        $notificationService->sendKontrakRequestNotification($itemPekerjaan->moodboard->order);

        // Create task response untuk kontrak (setelah semua RAB submit)
        $order = $itemPekerjaan->moodboard->order;
        $nextTaskExists = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'kontrak')
            ->exists();

        if (!$nextTaskExists) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'kontrak',
                'start_time' => now(),
                'deadline' => now()->addDays(3), // Deadline untuk kontrak
                'duration' => 3,
                'duration_actual' => 3,
                'extend_time' => 0,
                'status' => 'menunggu_response',
            ]);
        }

        return redirect()->back()
            ->with('success', 'RAB berhasil di-submit! Semua RAB (Internal, Kontrak, Vendor, Jasa) telah ACC.');
    }
}
