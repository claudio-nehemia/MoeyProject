<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\JenisItem;
use App\Models\RabKontrak;
use App\Models\RabInternal;
use App\Models\ItemPekerjaan;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\RabKontrakProduk;
use Illuminate\Support\Facades\DB;
use App\Models\RabKontrakAksesoris;
use Illuminate\Support\Facades\Log;

class RabKontrakController extends Controller
{
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'rabInternal',
            'rabKontrak.rabKontrakProduks'
        ])
            ->whereHas('produks')
            ->whereHas('rabInternal')
            ->orderBy('created_at', 'desc')

            ->get()
            ->map(function ($itemPekerjaan) {
                return [
                    'id' => $itemPekerjaan->id,
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'rabKontrak' => $itemPekerjaan->rabKontrak ? [
                        'id' => $itemPekerjaan->rabKontrak->id,
                        'response_by' => $itemPekerjaan->rabKontrak->response_by,
                        'response_time' => $itemPekerjaan->rabKontrak->response_time,
                        'total_produks' => $itemPekerjaan->rabKontrak->rabKontrakProduks->count(),
                    ] : null,
                ];
            });

        return Inertia::render('RabKontrak/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function generate($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'rabInternal.rabProduks.rabAksesoris',
            'rabInternal.rabProduks.itemPekerjaanProduk.jenisItems.items.item'
        ])->findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->rabInternal) {
            return redirect()->route('rab-kontrak.index')
                ->with('error', 'RAB Internal belum ada.');
        }

        if ($itemPekerjaan->rabKontrak) {
            return redirect()->route('rab-kontrak.show', $itemPekerjaan->rabKontrak->id)
                ->with('info', 'RAB Kontrak sudah ada.');
        }

        DB::transaction(function () use ($itemPekerjaan) {
            $rabInternal = $itemPekerjaan->rabInternal;

            $rabKontrak = RabKontrak::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'response_by' => $rabInternal->response_by,
                'response_time' => $rabInternal->response_time,
            ]);

            foreach ($rabInternal->rabProduks as $rabProduk) {
                // ✅ RAB KONTRAK: Apply PEMBAGIAN dengan (1 - markup/100) pada harga_dasar & harga_items
                // Rumus: (BB + Finishing) ÷ (1 - Markup/100) × Dimensi × Qty
                // Contoh: Markup 20% → (1-0.2) = 0.8, harga DIBAGI 0.8 (bukan dikali)
                $markupDivider = 1 - ($rabProduk->markup_satuan / 100); // 20% → 1-0.2 = 0.8

                // Setiap kolom harga DIBAGI dengan markupDivider agar langsung di-markup
                $hargaDasarKontrak = $markupDivider > 0 ? $rabProduk->harga_dasar / $markupDivider : $rabProduk->harga_dasar;
                $hargaItemsKontrak = $markupDivider > 0 ? $rabProduk->harga_items_non_aksesoris / $markupDivider : $rabProduk->harga_items_non_aksesoris;
                
                // Hitung finishing dalam dan luar secara terpisah (sudah di-markup)
                $hargaFinishingDalam = 0;
                $hargaFinishingLuar = 0;
                $itemPekerjaanProduk = $rabProduk->itemPekerjaanProduk;
                
                foreach ($itemPekerjaanProduk->jenisItems as $jenisItem) {
                    $namaJenis = strtolower($jenisItem->jenisItem->nama_jenis_item);
                    
                    if ($namaJenis === 'finishing dalam') {
                        foreach ($jenisItem->items as $item) {
                            $hargaOriginal = $item->item->harga * $item->quantity;
                            $hargaFinishingDalam += $markupDivider > 0 ? $hargaOriginal / $markupDivider : $hargaOriginal;
                        }
                    } elseif ($namaJenis === 'finishing luar') {
                        foreach ($jenisItem->items as $item) {
                            $hargaOriginal = $item->item->harga * $item->quantity;
                            $hargaFinishingLuar += $markupDivider > 0 ? $hargaOriginal / $markupDivider : $hargaOriginal;
                        }
                    }
                }
                
                // Hitung ulang harga_satuan dengan nilai yang sudah di-markup
                $hargaSatuanKontrak = ($hargaDasarKontrak + $hargaItemsKontrak) * $rabProduk->harga_dimensi;

                // Hitung total aksesoris yang sudah di-markup
                $totalHargaAksesorisKontrak = 0;
                $aksesorisData = [];
                foreach ($rabProduk->rabAksesoris as $rabAksesoris) {
                    $hargaSatuanAksKontrak = $markupDivider > 0 
                        ? $rabAksesoris->harga_satuan_aksesoris / $markupDivider 
                        : $rabAksesoris->harga_satuan_aksesoris;
                    $hargaTotalAks = $hargaSatuanAksKontrak * $rabAksesoris->qty_aksesoris;
                    $totalHargaAksesorisKontrak += $hargaTotalAks;
                    
                    $aksesorisData[] = [
                        'item_pekerjaan_item_id' => $rabAksesoris->item_pekerjaan_item_id,
                        'harga_satuan_aksesoris' => $hargaSatuanAksKontrak,
                        'qty_aksesoris' => $rabAksesoris->qty_aksesoris,
                        'harga_total' => $hargaTotalAks,
                    ];
                }

                // Hitung harga_akhir = harga_satuan + aksesoris - diskon
                $diskonPerProduk = $rabProduk->diskon_per_produk ?? 0;
                $hargaAkhirKontrak = ($hargaSatuanKontrak + $totalHargaAksesorisKontrak) - $diskonPerProduk;

                $rabKontrakProduk = RabKontrakProduk::create([
                    'rab_kontrak_id' => $rabKontrak->id,
                    'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                    'harga_dasar' => $hargaDasarKontrak, // Sudah di-markup (dibagi markupDivider)
                    'harga_finishing_dalam' => $hargaFinishingDalam, // Sudah di-markup
                    'harga_finishing_luar' => $hargaFinishingLuar, // Sudah di-markup
                    'harga_items_non_aksesoris' => $hargaItemsKontrak, // Sudah di-markup (total finishing)
                    'harga_dimensi' => $rabProduk->harga_dimensi,
                    'harga_satuan' => $hargaSatuanKontrak, // Dihitung ulang dari nilai yang sudah di-markup
                    'harga_total_aksesoris' => $totalHargaAksesorisKontrak, // Total aksesoris yang sudah di-markup
                    'diskon_per_produk' => $diskonPerProduk,
                    'harga_akhir' => $hargaAkhirKontrak, // Harga akhir dengan markup
                ]);

                // Simpan aksesoris dengan harga yang sudah di-markup
                foreach ($aksesorisData as $aks) {
                    RabKontrakAksesoris::create([
                        'rab_kontrak_produk_id' => $rabKontrakProduk->id,
                        'item_pekerjaan_item_id' => $aks['item_pekerjaan_item_id'],
                        'harga_satuan_aksesoris' => $aks['harga_satuan_aksesoris'], // Sudah di-markup
                        'qty_aksesoris' => $aks['qty_aksesoris'],
                        'harga_total' => $aks['harga_total'], // Sudah di-markup
                    ]);
                }
            }
        });

        return redirect()->route('rab-kontrak.index')
            ->with('success', 'RAB Kontrak berhasil di-generate');
    }

    public function show($rabKontrakId)
    {
        $rabKontrak = RabKontrak::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.rabInternal.rabProduks',
            'rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrakProduks.itemPekerjaanProduk.bahanBakus.item', // Selected bahan baku
            'rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($rabKontrakId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        // Create mapping of item_pekerjaan_produk_id to markup_satuan
        $markupMap = [];
        foreach ($rabKontrak->itemPekerjaan->rabInternal->rabProduks as $rabProduk) {
            $markupMap[$rabProduk->item_pekerjaan_produk_id] = 1 + ($rabProduk->markup_satuan / 100);
        }

        return Inertia::render('RabKontrak/Show', [
            'rabKontrak' => [
                'id' => $rabKontrak->id,
                'response_by' => $rabKontrak->response_by,
                'response_time' => $rabKontrak->response_time,
                'order' => [
                    'nama_project' => $rabKontrak->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $rabKontrak->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $rabKontrak->itemPekerjaan->moodboard->order->customer_name,
                ],
                'produks' => $rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem, $markupMap) {
                    $markupMultiplier = $markupMap[$rabProduk->item_pekerjaan_produk_id] ?? 1;

                    // Get selected bahan baku names
                    $selectedBahanBakus = $rabProduk->itemPekerjaanProduk->bahanBakus;
                    $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                    // Collect jenis items (Finishing only, exclude Aksesoris & Bahan Baku)
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                            $itemsList = [];
                            foreach ($jenisItem->items as $item) {
                                $hargaSatuanWithMarkup = $item->item->harga * $markupMultiplier;
                                $itemsList[] = [
                                    'nama_item' => $item->item->nama_item,
                                    'harga_satuan' => $hargaSatuanWithMarkup,
                                    'qty' => $item->quantity,
                                    'harga_total' => $hargaSatuanWithMarkup * $item->quantity,
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
                        'harga_dasar' => $rabProduk->harga_dasar,
                        'harga_finishing_dalam' => $rabProduk->harga_finishing_dalam ?? 0,
                        'harga_finishing_luar' => $rabProduk->harga_finishing_luar ?? 0,
                        'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'bahan_baku_names' => $bahanBakuNames,
                        'jenis_items' => $jenisItemsList,
                        'aksesoris' => $rabProduk->rabKontrakAksesoris->map(function ($aksesoris) {
                            // Calculate harga satuan from harga total (already includes markup)
                            $hargaSatuanWithMarkup = $aksesoris->qty_aksesoris > 0
                                ? $aksesoris->harga_total / $aksesoris->qty_aksesoris
                                : $aksesoris->harga_satuan_aksesoris;

                            return [
                                'id' => $aksesoris->id,
                                'nama_aksesoris' => $aksesoris->itemPekerjaanItem->item->nama_item,
                                'qty_aksesoris' => $aksesoris->qty_aksesoris,
                                'harga_satuan_aksesoris' => $hargaSatuanWithMarkup,
                                'harga_total' => $aksesoris->harga_total,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ],
        ]);
    }

    public function exportPdf($rabKontrakId)
    {
        $rabKontrak = RabKontrak::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.rabInternal.rabProduks',
            'rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrakProduks.itemPekerjaanProduk.bahanBakus.item',
            'rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($rabKontrakId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        // Create mapping of item_pekerjaan_produk_id to markup_satuan
        $markupMap = [];
        foreach ($rabKontrak->itemPekerjaan->rabInternal->rabProduks as $rabProduk) {
            $markupMap[$rabProduk->item_pekerjaan_produk_id] = 1 + ($rabProduk->markup_satuan / 100);
        }

        // Prepare data
        $produks = $rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem, $markupMap) {
            $markupMultiplier = $markupMap[$rabProduk->item_pekerjaan_produk_id] ?? 1;

            // Get bahan baku names from selected bahan baku
            $bahanBakuNames = $rabProduk->itemPekerjaanProduk->bahanBakus
                ->map(fn($bb) => $bb->item->nama_item)
                ->toArray();

            $jenisItemsList = [];
            foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                // Exclude Aksesoris and Bahan Baku jenis
                if (
                    $jenisItem->jenis_item_id !== $aksesorisJenisItem->id &&
                    ($bahanBakuJenisItem === null || $jenisItem->jenis_item_id !== $bahanBakuJenisItem->id)
                ) {
                    $itemsList = [];
                    foreach ($jenisItem->items as $item) {
                        $hargaSatuanWithMarkup = $item->item->harga * $markupMultiplier;
                        $itemsList[] = [
                            'nama_item' => $item->item->nama_item,
                            'harga_satuan' => $hargaSatuanWithMarkup,
                            'qty' => $item->quantity,
                            'harga_total' => $hargaSatuanWithMarkup * $item->quantity,
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
                'harga_dasar' => $rabProduk->harga_dasar,
                'harga_finishing_dalam' => $rabProduk->harga_finishing_dalam ?? 0,
                'harga_finishing_luar' => $rabProduk->harga_finishing_luar ?? 0,
                'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                'harga_dimensi' => $rabProduk->harga_dimensi,
                'harga_satuan' => $rabProduk->harga_satuan,
                'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                'harga_akhir' => $rabProduk->harga_akhir,
                'diskon_per_produk' => $rabProduk->diskon_per_produk,
                'jenis_items' => $jenisItemsList,
                'bahan_baku_names' => $bahanBakuNames,
                'aksesoris' => $rabProduk->rabKontrakAksesoris->map(function ($aksesoris) {
                    // Calculate harga satuan from harga total (already includes markup)
                    $hargaSatuanWithMarkup = $aksesoris->qty_aksesoris > 0
                        ? $aksesoris->harga_total / $aksesoris->qty_aksesoris
                        : $aksesoris->harga_satuan_aksesoris;

                    return [
                        'id' => $aksesoris->id,
                        'nama_aksesoris' => $aksesoris->itemPekerjaanItem->item->nama_item,
                        'qty_aksesoris' => $aksesoris->qty_aksesoris,
                        'harga_satuan_aksesoris' => $hargaSatuanWithMarkup,
                        'harga_total' => $aksesoris->harga_total,
                    ];
                })->toArray(),
            ];
        });

        $totalSemuaProduk = $produks->sum('harga_akhir');

        $data = [
            'rabKontrak' => $rabKontrak,
            'produks' => $produks,
            'totalSemuaProduk' => $totalSemuaProduk,
        ];

        $pdf = PDF::loadView('pdf.rab-kontrak', $data);
        $pdf->setPaper('a4', 'landscape');

        $filename = 'RAB-Kontrak-' . $rabKontrak->itemPekerjaan->moodboard->order->nama_project . '-' . date('YmdHis') . '.pdf';

        return $pdf->download($filename);
    }

    public function destroy($rabKontrakId)
    {
        $rabKontrak = RabKontrak::findOrFail($rabKontrakId);
        $rabKontrak->delete();

        return redirect()->route('rab-kontrak.index')
            ->with('success', 'RAB Kontrak berhasil dihapus');
    }

    public function regenerate($rabKontrakId)
    {
        try {
            $rabKontrak = RabKontrak::with([
                'itemPekerjaan.rabInternal.rabProduks.rabAksesoris',
            ])->findOrFail($rabKontrakId);

            $rabInternal = $rabKontrak->itemPekerjaan->rabInternal;

            if (!$rabInternal) {
                return redirect()->back()
                    ->with('error', 'RAB Internal tidak ditemukan.');
            }

            DB::transaction(function () use ($rabKontrak, $rabInternal) {
                // Delete old data
                foreach ($rabKontrak->rabKontrakProduks as $produk) {
                    $produk->rabKontrakAksesoris()->delete();
                }
                $rabKontrak->rabKontrakProduks()->delete();

                // Regenerate from RAB Internal (same logic as generate())
                foreach ($rabInternal->rabProduks as $rabProduk) {
                    // ✅ RAB KONTRAK: Apply PEMBAGIAN dengan (1 - markup/100) pada harga_dasar & harga_items
                    // Rumus: (BB + Finishing) ÷ (1 - Markup/100) × Dimensi × Qty
                    // Contoh: Markup 20% → (1-0.2) = 0.8, harga DIBAGI 0.8 (bukan dikali)
                    $markupDivider = 1 - ($rabProduk->markup_satuan / 100); // 20% → 1-0.2 = 0.8

                    // Setiap kolom harga DIBAGI dengan markupDivider agar langsung di-markup
                    $hargaDasarKontrak = $markupDivider > 0 ? $rabProduk->harga_dasar / $markupDivider : $rabProduk->harga_dasar;
                    $hargaItemsKontrak = $markupDivider > 0 ? $rabProduk->harga_items_non_aksesoris / $markupDivider : $rabProduk->harga_items_non_aksesoris;
                    
                    // Hitung finishing dalam dan luar secara terpisah (sudah di-markup)
                    $hargaFinishingDalam = 0;
                    $hargaFinishingLuar = 0;
                    $itemPekerjaanProduk = $rabProduk->itemPekerjaanProduk;
                    
                    foreach ($itemPekerjaanProduk->jenisItems as $jenisItem) {
                        $namaJenis = strtolower($jenisItem->jenisItem->nama_jenis_item);
                        
                        if ($namaJenis === 'finishing dalam') {
                            foreach ($jenisItem->items as $item) {
                                $hargaOriginal = $item->item->harga * $item->quantity;
                                $hargaFinishingDalam += $markupDivider > 0 ? $hargaOriginal / $markupDivider : $hargaOriginal;
                            }
                        } elseif ($namaJenis === 'finishing luar') {
                            foreach ($jenisItem->items as $item) {
                                $hargaOriginal = $item->item->harga * $item->quantity;
                                $hargaFinishingLuar += $markupDivider > 0 ? $hargaOriginal / $markupDivider : $hargaOriginal;
                            }
                        }
                    }
                    
                    // Hitung ulang harga_satuan dengan nilai yang sudah di-markup
                    $hargaSatuanKontrak = ($hargaDasarKontrak + $hargaItemsKontrak) * $rabProduk->harga_dimensi;

                    // Hitung total aksesoris yang sudah di-markup
                    $totalHargaAksesorisKontrak = 0;
                    $aksesorisData = [];
                    foreach ($rabProduk->rabAksesoris as $rabAksesoris) {
                        $hargaSatuanAksKontrak = $markupDivider > 0 
                            ? $rabAksesoris->harga_satuan_aksesoris / $markupDivider 
                            : $rabAksesoris->harga_satuan_aksesoris;
                        $hargaTotalAks = $hargaSatuanAksKontrak * $rabAksesoris->qty_aksesoris;
                        $totalHargaAksesorisKontrak += $hargaTotalAks;
                        
                        $aksesorisData[] = [
                            'item_pekerjaan_item_id' => $rabAksesoris->item_pekerjaan_item_id,
                            'harga_satuan_aksesoris' => $hargaSatuanAksKontrak,
                            'qty_aksesoris' => $rabAksesoris->qty_aksesoris,
                            'harga_total' => $hargaTotalAks,
                        ];
                    }

                    // Hitung harga_akhir = harga_satuan + aksesoris - diskon
                    $diskonPerProduk = $rabProduk->diskon_per_produk ?? 0;
                    $hargaAkhirKontrak = ($hargaSatuanKontrak + $totalHargaAksesorisKontrak) - $diskonPerProduk;

                    $rabKontrakProduk = RabKontrakProduk::create([
                        'rab_kontrak_id' => $rabKontrak->id,
                        'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                        'harga_dasar' => $hargaDasarKontrak, // Sudah di-markup (dibagi markupDivider)
                        'harga_finishing_dalam' => $hargaFinishingDalam, // Sudah di-markup
                        'harga_finishing_luar' => $hargaFinishingLuar, // Sudah di-markup
                        'harga_items_non_aksesoris' => $hargaItemsKontrak, // Sudah di-markup (total finishing)
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $hargaSatuanKontrak, // Dihitung ulang dari nilai yang sudah di-markup
                        'harga_total_aksesoris' => $totalHargaAksesorisKontrak, // Total aksesoris yang sudah di-markup
                        'diskon_per_produk' => $diskonPerProduk,
                        'harga_akhir' => $hargaAkhirKontrak, // Harga akhir dengan markup
                    ]);

                    // Simpan aksesoris dengan harga yang sudah di-markup
                    foreach ($aksesorisData as $aks) {
                        RabKontrakAksesoris::create([
                            'rab_kontrak_produk_id' => $rabKontrakProduk->id,
                            'item_pekerjaan_item_id' => $aks['item_pekerjaan_item_id'],
                            'harga_satuan_aksesoris' => $aks['harga_satuan_aksesoris'], // Sudah di-markup
                            'qty_aksesoris' => $aks['qty_aksesoris'],
                            'harga_total' => $aks['harga_total'], // Sudah di-markup
                        ]);
                    }
                }

                // Update timestamp
                $rabKontrak->update([
                    'response_by' => auth()->user()->name ?? $rabInternal->response_by,
                    'response_time' => now(),
                ]);
            });

            return redirect()->route('rab-kontrak.show', $rabKontrakId)
                ->with('success', 'RAB Kontrak berhasil di-regenerate dengan harga terbaru.');
        } catch (\Exception $e) {
            Log::error('Regenerate RAB Kontrak error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Gagal regenerate RAB Kontrak: ' . $e->getMessage());
        }
    }
}
