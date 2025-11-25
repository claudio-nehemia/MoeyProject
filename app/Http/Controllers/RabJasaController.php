<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\RabJasa;
use App\Models\JenisItem;
use App\Models\RabInternal;
use App\Models\ItemPekerjaan;
use App\Models\RabJasaProduk;
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
            'rabInternal.rabProduks',
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
                // RAB Internal already stores ORIGINAL prices (before markup)
                // So we just copy them directly - NO need to divide by markup
                $hargaDasarOriginal = $rabProduk->harga_dasar;
                $hargaItemsOriginal = $rabProduk->harga_items_non_aksesoris;

                // Calculate harga_satuan WITHOUT markup
                $hargaSatuanJasa = ($hargaDasarOriginal + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                // NO AKSESORIS - harga_akhir = harga_satuan only
                RabJasaProduk::create([
                    'rab_jasa_id' => $rabJasa->id,
                    'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                    'harga_dasar' => $hargaDasarOriginal,
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
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabJasaProduks.itemPekerjaanProduk.jenisItems.items.item',
        ])->findOrFail($rabJasaId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

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
                'produks' => $rabJasa->rabJasaProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        // NO AKSESORIS - Skip aksesoris items
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
                        'harga_dasar' => $rabProduk->harga_dasar,
                        'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_akhir' => $rabProduk->harga_akhir,
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
        ])->findOrFail($rabJasaId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        // Prepare data
        $produks = $rabJasa->rabJasaProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
            $jenisItemsList = [];
            foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                // NO AKSESORIS - Skip aksesoris items
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
                'harga_dasar' => $rabProduk->harga_dasar,
                'harga_items_non_aksesoris' => $rabProduk->harga_items_non_aksesoris,
                'harga_dimensi' => $rabProduk->harga_dimensi,
                'harga_satuan' => $rabProduk->harga_satuan,
                'harga_akhir' => $rabProduk->harga_akhir,
                'jenis_items' => $jenisItemsList,
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
                    $hargaDasarOriginal = $rabProduk->harga_dasar;
                    $hargaItemsOriginal = $rabProduk->harga_items_non_aksesoris;
                    $hargaSatuanJasa = ($hargaDasarOriginal + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                    RabJasaProduk::create([
                        'rab_jasa_id' => $rabJasa->id,
                        'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                        'harga_dasar' => $hargaDasarOriginal,
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
