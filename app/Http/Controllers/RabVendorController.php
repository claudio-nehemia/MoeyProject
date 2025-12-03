<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\JenisItem;
use App\Models\RabVendor;
use App\Models\RabInternal;
use App\Models\ItemPekerjaan;
use App\Models\RabVendorProduk;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\RabVendorAksesoris;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RabVendorController extends Controller
{
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'rabInternal',
            'rabVendor.rabVendorProduks'
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
                    'rabVendor' => $itemPekerjaan->rabVendor ? [
                        'id' => $itemPekerjaan->rabVendor->id,
                        'response_by' => $itemPekerjaan->rabVendor->response_by,
                        'response_time' => $itemPekerjaan->rabVendor->response_time,
                        'total_produks' => $itemPekerjaan->rabVendor->rabVendorProduks->count(),
                    ] : null,
                ];
            });

        return Inertia::render('RabVendor/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function generate($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'rabInternal.rabProduks.rabAksesoris',
        ])->findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->rabInternal) {
            return redirect()->route('rab-vendor.index')
                ->with('error', 'RAB Internal belum ada.');
        }

        if ($itemPekerjaan->rabVendor) {
            return redirect()->route('rab-vendor.show', $itemPekerjaan->rabVendor->id)
                ->with('info', 'RAB Vendor sudah ada.');
        }

        DB::transaction(function () use ($itemPekerjaan) {
            $rabInternal = $itemPekerjaan->rabInternal;

            $rabVendor = RabVendor::create([
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
                $hargaSatuanVendor = ($hargaDasarOriginal + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                $rabVendorProduk = RabVendorProduk::create([
                    'rab_vendor_id' => $rabVendor->id,
                    'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                    'harga_dasar' => $hargaDasarOriginal,
                    'harga_items_non_aksesoris' => $hargaItemsOriginal,
                    'harga_dimensi' => $rabProduk->harga_dimensi,
                    'harga_satuan' => $hargaSatuanVendor,
                    'harga_total_aksesoris' => 0,
                    'harga_akhir' => $hargaSatuanVendor,
                ]);

                // Aksesoris - Also stored as ORIGINAL prices in RAB Internal
                $totalAksesoris = 0;
                foreach ($rabProduk->rabAksesoris as $rabAksesoris) {
                    // Items in ItemPekerjaan already have original prices
                    $hargaSatuanAksOriginal = $rabAksesoris->itemPekerjaanItem->item->harga;
                    $hargaTotalOriginal = $hargaSatuanAksOriginal * $rabAksesoris->qty_aksesoris;

                    RabVendorAksesoris::create([
                        'rab_vendor_produk_id' => $rabVendorProduk->id,
                        'item_pekerjaan_item_id' => $rabAksesoris->item_pekerjaan_item_id,
                        'harga_satuan_aksesoris' => $hargaSatuanAksOriginal,
                        'qty_aksesoris' => $rabAksesoris->qty_aksesoris,
                        'harga_total' => $hargaTotalOriginal,
                    ]);

                    $totalAksesoris += $hargaTotalOriginal;
                }

                // Update with aksesoris
                $rabVendorProduk->update([
                    'harga_total_aksesoris' => $totalAksesoris,
                    'harga_akhir' => $hargaSatuanVendor + $totalAksesoris,
                ]);
            }
        });

        return redirect()->route('rab-vendor.index')
            ->with('success', 'RAB Vendor berhasil di-generate');
    }

    public function show($rabVendorId)
    {
        $rabVendor = RabVendor::with([
            'itemPekerjaan.moodboard.order',
            'rabVendorProduks.itemPekerjaanProduk.produk',
            'rabVendorProduks.itemPekerjaanProduk.bahanBakus.item', // Selected bahan baku
            'rabVendorProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabVendorProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabVendorProduks.rabVendorAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($rabVendorId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        return Inertia::render('RabVendor/Show', [
            'rabVendor' => [
                'id' => $rabVendor->id,
                'response_by' => $rabVendor->response_by,
                'response_time' => $rabVendor->response_time,
                'order' => [
                    'nama_project' => $rabVendor->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $rabVendor->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $rabVendor->itemPekerjaan->moodboard->order->customer_name,
                ],
                'produks' => $rabVendor->rabVendorProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {
                    // Get selected bahan baku names
                    $selectedBahanBakus = $rabProduk->itemPekerjaanProduk->bahanBakus;
                    $bahanBakuNames = $selectedBahanBakus->map(fn($bb) => $bb->item->nama_item)->toArray();

                    // Collect jenis items (Finishing only, exclude Aksesoris & Bahan Baku)
                    $jenisItemsList = [];
                    $jenisItems = $rabProduk->itemPekerjaanProduk->jenisItems ?? collect([]);
                    
                    foreach ($jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem?->id && $jenisItem->jenis_item_id !== $bahanBakuJenisItem?->id) {
                            $itemsList = [];
                            $items = $jenisItem->items ?? collect([]);
                            
                            foreach ($items as $item) {
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
                        'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'bahan_baku_names' => $bahanBakuNames,
                        'jenis_items' => $jenisItemsList,
                        'aksesoris' => $rabProduk->rabVendorAksesoris->map(function ($aksesoris) {
                            return [
                                'id' => $aksesoris->id,
                                'nama_aksesoris' => $aksesoris->itemPekerjaanItem->item->nama_item,
                                'qty_aksesoris' => $aksesoris->qty_aksesoris,
                                'harga_satuan_aksesoris' => $aksesoris->harga_satuan_aksesoris,
                                'harga_total' => $aksesoris->harga_total,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ],
        ]);
    }

    public function exportPdf($rabVendorId)
    {
        $rabVendor = RabVendor::with([
            'itemPekerjaan.moodboard.order',
            'rabVendorProduks.itemPekerjaanProduk.produk',
            'rabVendorProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabVendorProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabVendorProduks.itemPekerjaanProduk.bahanBakus.item',
            'rabVendorProduks.rabVendorAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($rabVendorId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $bahanBakuJenisItem = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        // Prepare data for PDF
        $produks = $rabVendor->rabVendorProduks->map(function ($rabProduk) use ($aksesorisJenisItem, $bahanBakuJenisItem) {

            // Get bahan baku names from selected bahan baku
            $bahanBakuNames = $rabProduk->itemPekerjaanProduk->bahanBakus
                ->map(fn($bb) => $bb->item->nama_item)
                ->toArray();

            // NON AKSESORIS - Exclude Bahan Baku jenis
            $jenisItemsList = [];
            $jenisItems = $rabProduk->itemPekerjaanProduk->jenisItems ?? collect([]);
            
            foreach ($jenisItems as $jenisItem) {
                // Exclude Aksesoris and Bahan Baku jenis
                if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id &&
                    ($bahanBakuJenisItem === null || $jenisItem->jenis_item_id !== $bahanBakuJenisItem->id)) {

                    $itemsList = [];
                    $items = $jenisItem->items ?? collect([]);
                    
                    foreach ($items as $item) {
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

            // AKSESORIS
            $aksesorisList = $rabProduk->rabVendorAksesoris->map(function ($aks) {
                return [
                    'nama_aksesoris' => $aks->itemPekerjaanItem->item->nama_item,
                    'qty_aksesoris' => $aks->qty_aksesoris,
                    'harga_satuan_aksesoris' => $aks->harga_satuan_aksesoris,
                    'harga_total' => $aks->harga_total,
                ];
            });

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
                'harga_total_aksesoris' => $rabProduk->harga_total_aksesoris,
                'harga_akhir' => $rabProduk->harga_akhir,
                'jenis_items' => $jenisItemsList,
                'bahan_baku_names' => $bahanBakuNames,
                'aksesoris' => $aksesorisList,
            ];
        });

        // Calculate total semua produk
        $totalSemuaProduk = $produks->sum('harga_akhir');

        // FINAL PDF DATA
        $data = [
            'rabVendor' => $rabVendor, 
            'id' => $rabVendor->id,
            'response_by' => $rabVendor->response_by,
            'response_time' => $rabVendor->response_time,
            'order' => [
                'nama_project' => $rabVendor->itemPekerjaan->moodboard->order->nama_project,
                'company_name' => $rabVendor->itemPekerjaan->moodboard->order->company_name,
                'customer_name' => $rabVendor->itemPekerjaan->moodboard->order->customer_name,
            ],
            'produks' => $produks,
            'totalSemuaProduk' => $totalSemuaProduk,
        ];

        $pdf = Pdf::loadView('pdf.rab-vendor', $data)->setPaper('a4', 'landscape');

        return $pdf->stream("RAB-Vendor-{$rabVendor->id}.pdf");
    }

    public function destroy($rabVendorId)
    {
        $rabVendor = RabVendor::findOrFail($rabVendorId);
        $rabVendor->delete();

        return redirect()->route('rab-vendor.index')
            ->with('success', 'RAB Vendor berhasil dihapus');
    }

    public function regenerate($rabVendorId)
    {
        try {
            $rabVendor = RabVendor::with([
                'itemPekerjaan.rabInternal.rabProduks.rabAksesoris',
            ])->findOrFail($rabVendorId);

            $rabInternal = $rabVendor->itemPekerjaan->rabInternal;

            if (!$rabInternal) {
                return redirect()->back()
                    ->with('error', 'RAB Internal tidak ditemukan.');
            }

            DB::transaction(function () use ($rabVendor, $rabInternal) {
                // Delete old data
                foreach ($rabVendor->rabVendorProduks as $produk) {
                    $produk->rabVendorAksesoris()->delete();
                }
                $rabVendor->rabVendorProduks()->delete();

                // Regenerate from RAB Internal
                foreach ($rabInternal->rabProduks as $rabProduk) {
                    $hargaDasarOriginal = $rabProduk->harga_dasar;
                    $hargaItemsOriginal = $rabProduk->harga_items_non_aksesoris;
                    $hargaSatuanVendor = ($hargaDasarOriginal + $hargaItemsOriginal) * $rabProduk->harga_dimensi;

                    $rabVendorProduk = RabVendorProduk::create([
                        'rab_vendor_id' => $rabVendor->id,
                        'item_pekerjaan_produk_id' => $rabProduk->item_pekerjaan_produk_id,
                        'harga_dasar' => $hargaDasarOriginal,
                        'harga_items_non_aksesoris' => $hargaItemsOriginal,
                        'harga_dimensi' => $rabProduk->harga_dimensi,
                        'harga_satuan' => $hargaSatuanVendor,
                        'harga_total_aksesoris' => 0,
                        'harga_akhir' => $hargaSatuanVendor,
                    ]);

                    $totalAksesoris = 0;
                    foreach ($rabProduk->rabAksesoris as $rabAksesoris) {
                        $hargaSatuanAksOriginal = $rabAksesoris->itemPekerjaanItem->item->harga;
                        $hargaTotalOriginal = $hargaSatuanAksOriginal * $rabAksesoris->qty_aksesoris;

                        RabVendorAksesoris::create([
                            'rab_vendor_produk_id' => $rabVendorProduk->id,
                            'item_pekerjaan_item_id' => $rabAksesoris->item_pekerjaan_item_id,
                            'harga_satuan_aksesoris' => $hargaSatuanAksOriginal,
                            'qty_aksesoris' => $rabAksesoris->qty_aksesoris,
                            'harga_total' => $hargaTotalOriginal,
                        ]);

                        $totalAksesoris += $hargaTotalOriginal;
                    }

                    $rabVendorProduk->update([
                        'harga_total_aksesoris' => $totalAksesoris,
                        'harga_akhir' => $hargaSatuanVendor + $totalAksesoris,
                    ]);
                }

                // Update timestamp
                $rabVendor->update([
                    'response_by' => auth()->user()->name ?? $rabInternal->response_by,
                    'response_time' => now(),
                ]);
            });

            return redirect()->route('rab-vendor.show', $rabVendorId)
                ->with('success', 'RAB Vendor berhasil di-regenerate dengan harga terbaru.');
        } catch (\Exception $e) {
            Log::error('Regenerate RAB Vendor error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Gagal regenerate RAB Vendor: ' . $e->getMessage());
        }
    }
}
