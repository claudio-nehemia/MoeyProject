<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\RabJasa;
use App\Models\JenisItem;
use App\Models\RabInternal;
use App\Models\ItemPekerjaan;
use App\Models\RabJasaProduk;
use App\Models\ItemPekerjaanProduk;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RabJasaController extends Controller
{
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'rabInternal',
            'rabJasa.rabJasaProduks'
        ])
            ->whereHas('produks')
            ->whereHas('rabInternal')
            ->get()
            ->map(function ($itemPekerjaan) {
                return [
                    'id' => $itemPekerjaan->id,
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'rabJasa' => $itemPekerjaan->rabJasa ? [
                        'id' => $itemPekerjaan->rabJasa->id,
                        'response_by' => $itemPekerjaan->rabJasa->response_by,
                        'response_time' => $itemPekerjaan->rabJasa->response_time,
                        'total_produks' => $itemPekerjaan->rabJasa->rabJasaProduks->count(),
                    ] : null,
                ];
            });

        return Inertia::render('RabJasa/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function generate($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'rabInternal.rabProduks.itemPekerjaanProduk.produk',
            'rabInternal.rabProduks.itemPekerjaanProduk.bahanBakus', // Selected bahan baku with harga_jasa
        ])->findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->rabInternal) {
            return redirect()->route('rab-jasa.index')
                ->with('error', 'RAB Internal belum ada.');
        }

        if ($itemPekerjaan->rabJasa) {
            return redirect()->route('rab-jasa.show', $itemPekerjaan->rabJasa->id)
                ->with('info', 'RAB Jasa sudah ada.');
        }

        DB::transaction(function () use ($itemPekerjaan) {
            $rabInternal = $itemPekerjaan->rabInternal;

            $rabJasa = RabJasa::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'response_by' => $rabInternal->response_by,
                'response_time' => $rabInternal->response_time,
            ]);

            foreach ($rabInternal->rabProduks as $rabProduk) {
                // Reload itemPekerjaanProduk with bahanBakus to ensure we get fresh data
                $itemPekerjaanProduk = ItemPekerjaanProduk::with('bahanBakus')
                    ->find($rabProduk->item_pekerjaan_produk_id);
                
                // DEBUG: Log the bahan baku data
                Log::info('RAB Jasa Generate - ItemPekerjaanProduk ID: ' . $rabProduk->item_pekerjaan_produk_id);
                Log::info('RAB Jasa Generate - BahanBakus count: ' . $itemPekerjaanProduk->bahanBakus->count());
                Log::info('RAB Jasa Generate - BahanBakus data: ' . json_encode($itemPekerjaanProduk->bahanBakus->toArray()));
                
                // Get harga_jasa from selected bahan baku (sum of all selected bahan baku harga_jasa)
                $hargaJasa = $itemPekerjaanProduk->bahanBakus->sum('harga_jasa') ?: 0;
                
                Log::info('RAB Jasa Generate - Harga Jasa Sum: ' . $hargaJasa);
                
                // Keep harga_items_non_aksesoris from RAB Internal
                $hargaItemsOriginal = $rabProduk->harga_items_non_aksesoris;

                // Calculate harga_satuan using harga_jasa instead of harga
                // Formula: (harga_jasa + harga_items_non_aksesoris) * harga_dimensi
                $hargaSatuanJasa = ($hargaJasa + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                // NO AKSESORIS - harga_akhir = harga_satuan only
                RabJasaProduk::create([
                    'rab_jasa_id' => $rabJasa->id,
                    'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                    'harga_dasar' => $hargaJasa, // Store harga_jasa as harga_dasar
                    'harga_items_non_aksesoris' => $hargaItemsOriginal,
                    'harga_dimensi' => $rabProduk->harga_dimensi,
                    'harga_satuan' => $hargaSatuanJasa,
                    'harga_akhir' => $hargaSatuanJasa, // NO aksesoris, just harga_satuan
                ]);
            }
        });

        return redirect()->route('rab-jasa.index')
            ->with('success', 'RAB Jasa berhasil di-generate');
    }

    public function show($rabJasaId)
    {
        $rabJasa = RabJasa::with([
            'itemPekerjaan.moodboard.order',
            'rabJasaProduks.itemPekerjaanProduk.produk',
            'rabJasaProduks.itemPekerjaanProduk.bahanBakus.item', // Selected bahan baku
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.items.item',
        ])->findOrFail($rabJasaId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        return Inertia::render('RabJasa/Show', [
            'rabJasa' => [
                'id' => $rabJasa->id,
                'response_by' => $rabJasa->response_by,
                'response_time' => $rabJasa->response_time,
                'order' => [
                    'nama_project' => $rabJasa->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $rabJasa->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $rabJasa->itemPekerjaan->moodboard->order->customer_name,
                ],
                'produks' => $rabJasa->rabJasaProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {
                    // Get selected bahan baku names
                    $selectedBahanBakus = $rabProduk->itemPekerjaanProduk->bahanBakus;
                    $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                    // Collect jenis items (Finishing only, NO AKSESORIS, exclude Bahan Baku)
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
                        'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                        'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                        'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                        'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                        'harga_dasar' => $rabProduk->harga_dasar, // harga_jasa for RAB Jasa
                        'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'bahan_baku_names' => $bahanBakuNames,
                        'jenis_items' => $jenisItemsList,
                    ];
                })->toArray(),
            ],
        ]);
    }

    public function exportPdf($rabJasaId)
    {
        $rabJasa = RabJasa::with([
            'itemPekerjaan.moodboard.order',
            'rabJasaProduks.itemPekerjaanProduk.produk',
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabJasaProduks.itemPekerjaanProduk.bahanBakus.item',
        ])->findOrFail($rabJasaId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        // Prepare data
        $produks = $rabJasa->rabJasaProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {
            // Get bahan baku names from selected bahan baku
            $bahanBakuNames = $rabProduk->itemPekerjaanProduk->bahanBakus
                ->map(fn($bb) => $bb->item->nama_item)
                ->toArray();

            $jenisItemsList = [];
            foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                // NO AKSESORIS and NO BAHAN BAKU - Skip aksesoris and bahan baku items
                if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id &&
                    ($bahanBakuJenisItem === null || $jenisItem->jenis_item_id !== $bahanBakuJenisItem->id)) {
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
                'harga_dasar' => $rabProduk->harga_dasar,
                'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                'harga_dimensi' => $rabProduk->harga_dimensi,
                'harga_satuan' => $rabProduk->harga_satuan,
                'harga_akhir' => $rabProduk->harga_akhir,
                'jenis_items' => $jenisItemsList,
                'bahan_baku_names' => $bahanBakuNames,
            ];
        });

        $totalSemuaProduk = $produks->sum('harga_akhir');

        $data = [
            'rabJasa' => $rabJasa,
            'produks' => $produks,
            'totalSemuaProduk' => $totalSemuaProduk,
        ];

        $pdf = PDF::loadView('pdf.rab-jasa', $data);
        $pdf->setPaper('a4', 'landscape');

        $filename = 'RAB-Jasa-' . $rabJasa->itemPekerjaan->moodboard->order->nama_project . '-' . date('YmdHis') . '.pdf';

        return $pdf->download($filename);
    }

    public function destroy($rabJasaId)
    {
        $rabJasa = RabJasa::findOrFail($rabJasaId);
        $rabJasa->delete();

        return redirect()->route('rab-jasa.index')
            ->with('success', 'RAB Jasa berhasil dihapus');
    }

    public function regenerate($rabJasaId)
    {
        try {
            $rabJasa = RabJasa::with([
                'itemPekerjaan.rabInternal.rabProduks',
            ])->findOrFail($rabJasaId);

            $rabInternal = $rabJasa->itemPekerjaan->rabInternal;

            if (!$rabInternal) {
                return redirect()->back()
                    ->with('error', 'RAB Internal tidak ditemukan.');
            }

            DB::transaction(function () use ($rabJasa, $rabInternal) {
                // Delete old data
                $rabJasa->rabJasaProduks()->delete();

                // Regenerate from RAB Internal
                foreach ($rabInternal->rabProduks as $rabProduk) {
                    // Reload itemPekerjaanProduk with bahanBakus to ensure we get fresh data
                    $itemPekerjaanProduk = ItemPekerjaanProduk::with('bahanBakus')
                        ->find($rabProduk->item_pekerjaan_produk_id);
                    
                    // Get harga_jasa from selected bahan baku (sum of all selected bahan baku harga_jasa)
                    $hargaJasa = $itemPekerjaanProduk->bahanBakus->sum('harga_jasa') ?: 0;
                    
                    // Keep harga_items_non_aksesoris from RAB Internal
                    $hargaItemsOriginal = $rabProduk->harga_items_non_aksesoris;
                    
                    // Calculate harga_satuan using harga_jasa instead of harga
                    // Formula: (harga_jasa + harga_items_non_aksesoris) * harga_dimensi
                    $hargaSatuanJasa = ($hargaJasa + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                    RabJasaProduk::create([
                        'rab_jasa_id' => $rabJasa->id,
                        'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                        'harga_dasar' => $hargaJasa, // Store harga_jasa as harga_dasar
                        'harga_items_non_aksesoris' => $hargaItemsOriginal,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $hargaSatuanJasa,
                        'harga_akhir' => $hargaSatuanJasa,
                    ]);
                }

                // Update timestamp
                $rabJasa->update([
                    'response_by' => auth()->user()->name ?? $rabInternal->response_by,
                    'response_time' => now(),
                ]);
            });

            return redirect()->route('rab-jasa.show', $rabJasaId)
                ->with('success', 'RAB Jasa berhasil di-regenerate dengan harga terbaru.');
        } catch (\Exception $e) {
            Log::error('Regenerate RAB Jasa error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Gagal regenerate RAB Jasa: ' . $e->getMessage());
        }
    }
}
