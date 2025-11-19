<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Invoice;
use App\Models\RabKontrak;
use App\Models\ItemPekerjaan;
use App\Models\JenisItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'rabKontrak.rabKontrakProduks',
            'invoice'
        ])
            ->whereHas('rabKontrak')
            ->get()
            ->map(function ($itemPekerjaan) {
                // Calculate total from RAB Kontrak
                $totalAmount = 0;
                if ($itemPekerjaan->rabKontrak && $itemPekerjaan->rabKontrak->rabKontrakProduks) {
                    $totalAmount = $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
                }

                return [
                    'id' => $itemPekerjaan->id,
                    'order' => [
                        'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                        'company_name' => $itemPekerjaan->moodboard->order->company_name,
                        'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                    ],
                    'total_amount' => $totalAmount,
                    'invoice' => $itemPekerjaan->invoice ? [
                        'id' => $itemPekerjaan->invoice->id,
                        'invoice_number' => $itemPekerjaan->invoice->invoice_number,
                        'total_amount' => $itemPekerjaan->invoice->total_amount,
                        'status' => $itemPekerjaan->invoice->status,
                        'created_at' => $itemPekerjaan->invoice->created_at,
                        'paid_at' => $itemPekerjaan->invoice->paid_at,
                    ] : null,
                ];
            });

        return Inertia::render('Invoice/Index', [
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    public function generate($itemPekerjaanId)
    {
        $itemPekerjaan = ItemPekerjaan::with([
            'rabKontrak.rabKontrakProduks',
            'moodboard.order'
        ])->findOrFail($itemPekerjaanId);

        if (!$itemPekerjaan->rabKontrak) {
            return back()->with('error', 'RAB Kontrak belum ada.');
        }

        if ($itemPekerjaan->invoice) {
            return redirect()->route('invoice.show', $itemPekerjaan->invoice->id)
                ->with('info', 'Invoice sudah ada.');
        }

        // Calculate total
        $totalAmount = $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');

        // Generate invoice number (format: INV/YYYY/MM/XXXX)
        $year = date('Y');
        $month = date('m');
        $lastInvoice = Invoice::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastInvoice ? (intval(substr($lastInvoice->invoice_number, -4)) + 1) : 1;
        $invoiceNumber = sprintf('INV/%s/%s/%04d', $year, $month, $sequence);

        $invoice = Invoice::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
            'invoice_number' => $invoiceNumber,
            'total_amount' => $totalAmount,
            'status' => 'pending',
        ]);

        return redirect()->route('invoice.show', $invoice->id)
            ->with('success', 'Invoice berhasil di-generate!');
    }

    public function show($invoiceId)
    {
        $invoice = Invoice::with([
            'itemPekerjaan.moodboard.order',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($invoiceId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        return Inertia::render('Invoice/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'total_amount' => $invoice->total_amount,
                'status' => $invoice->status,
                'bukti_bayar' => $invoice->bukti_bayar ? Storage::url($invoice->bukti_bayar) : null,
                'paid_at' => $invoice->paid_at,
                'notes' => $invoice->notes,
                'created_at' => $invoice->created_at,
                'order' => [
                    'nama_project' => $invoice->itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $invoice->itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $invoice->itemPekerjaan->moodboard->order->customer_name,
                ],
                'items' => $invoice->rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
                    $jenisItemsList = [];
                    foreach ($rabProduk->itemPekerjaanProduk->jenisItems as $jenisItem) {
                        if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id) {
                            $itemsList = [];
                            foreach ($jenisItem->items as $item) {
                                $itemsList[] = [
                                    'nama_item' => $item->item->nama_item,
                                    'qty' => $item->quantity,
                                ];
                            }

                            if (!empty($itemsList)) {
                                $jenisItemsList[] = [
                                    'nama_jenis' => $jenisItem->jenisItem->nama_jenis_item,
                                    'items' => $itemsList,
                                ];
                            }
                        }
                    }

                    return [
                        'nama_produk' => $rabProduk->itemPekerjaanProduk->produk->nama_produk,
                        'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                        'dimensi' => [
                            'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                            'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                            'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                        ],
                        'harga_satuan' => $rabProduk->harga_satuan,
                        'harga_akhir' => $rabProduk->harga_akhir,
                        'jenis_items' => $jenisItemsList,
                        'aksesoris' => $rabProduk->rabKontrakAksesoris->map(function ($aksesoris) {
                            return [
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

    public function uploadBuktiBayar(Request $request, $invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $request->validate([
            'bukti_bayar' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120', // 5MB
        ]);

        DB::transaction(function () use ($request, $invoice) {
            // Delete old bukti bayar if exists
            if ($invoice->bukti_bayar) {
                Storage::delete($invoice->bukti_bayar);
            }

            // Store new bukti bayar
            $path = $request->file('bukti_bayar')->store('bukti-bayar', 'public');

            $invoice->update([
                'bukti_bayar' => $path,
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        });

        return back()->with('success', 'Bukti bayar berhasil diupload!');
    }

    public function exportPdf($invoiceId)
    {
        $invoice = Invoice::with([
            'itemPekerjaan.moodboard.order',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.produk',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.jenisItem',
            'rabKontrak.rabKontrakProduks.itemPekerjaanProduk.jenisItems.items.item',
            'rabKontrak.rabKontrakProduks.rabKontrakAksesoris.itemPekerjaanItem.item'
        ])->findOrFail($invoiceId);

        $aksesorisJenisItem = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        // Prepare data for PDF
        $produks = $invoice->rabKontrak->rabKontrakProduks->map(function ($rabProduk) use ($aksesorisJenisItem) {
            // NON AKSESORIS
            $jenisItemsList = [];
            $jenisItems = $rabProduk->itemPekerjaanProduk->jenisItems ?? collect([]);

            foreach ($jenisItems as $jenisItem) {
                if ($jenisItem->jenis_item_id !== $aksesorisJenisItem->id) {
                    $itemsList = [];
                    $items = $jenisItem->items ?? collect([]);

                    foreach ($items as $item) {
                        $itemsList[] = [
                            'nama_item' => $item->item->nama_item,
                            'qty' => $item->quantity,
                        ];
                    }

                    if (!empty($itemsList)) {
                        $jenisItemsList[] = [
                            'nama_jenis' => $jenisItem->jenisItem->nama_jenis_item,
                            'items' => $itemsList,
                        ];
                    }
                }
            }

            // AKSESORIS
            $aksesorisList = $rabProduk->rabKontrakAksesoris->map(function ($aks) {
                return [
                    'nama_aksesoris' => $aks->itemPekerjaanItem->item->nama_item,
                    'qty_aksesoris' => $aks->qty_aksesoris,
                    'harga_satuan_aksesoris' => $aks->harga_satuan_aksesoris,
                    'harga_total' => $aks->harga_total,
                ];
            });

            return [
                'nama_produk' => $rabProduk->itemPekerjaanProduk->produk->nama_produk,
                'qty_produk' => $rabProduk->itemPekerjaanProduk->quantity,
                'panjang' => $rabProduk->itemPekerjaanProduk->panjang,
                'lebar' => $rabProduk->itemPekerjaanProduk->lebar,
                'tinggi' => $rabProduk->itemPekerjaanProduk->tinggi,
                'harga_satuan' => $rabProduk->harga_satuan,
                'harga_akhir' => $rabProduk->harga_akhir,
                'jenis_items' => $jenisItemsList,
                'aksesoris' => $aksesorisList,
            ];
        });

        $totalAmount = $produks->sum('harga_akhir');

        $data = [
            'invoice' => $invoice,
            'produks' => $produks,
            'totalAmount' => $totalAmount,
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data);
        $pdf->setPaper('a4', 'portrait');
        $safeInvoiceNumber = str_replace(['/', '\\'], '-', $invoice->invoice_number);

        $filename = 'Invoice-' . $safeInvoiceNumber . '-' . date('YmdHis') . '.pdf';


        return $pdf->download($filename);
    }

    public function destroy($invoiceId)
    {
        $invoice = Invoice::findOrFail($invoiceId);

        // Delete bukti bayar if exists
        if ($invoice->bukti_bayar) {
            Storage::delete($invoice->bukti_bayar);
        }

        $invoice->delete();

        return redirect()->route('invoice.index')
            ->with('success', 'Invoice berhasil dihapus');
    }
}
