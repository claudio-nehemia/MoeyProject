<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Inertia\Inertia;
use App\Models\Produk;
use App\Models\JenisItem;
use App\Models\Moodboard;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Models\ItemPekerjaanProduk;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use App\Models\ItemPekerjaanJenisItem;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\ItemPekerjaanProdukBahanBaku;

use App\Http\Controllers\ItemPekerjaan\Traits\HasItemPekerjaanMutations;
use App\Http\Controllers\ItemPekerjaan\Traits\HasItemPekerjaanPdf;

class ItemPekerjaanController extends Controller
{
    use HasItemPekerjaanMutations, HasItemPekerjaanPdf;

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
            ->orderBy('created_at', 'desc')

            ->get()
            ->map(function ($moodboard) {
                return [
                    'id' => $moodboard->id,
                    'pm_response_by' => $moodboard->pm_response_by,
                    'pm_response_time' => $moodboard->pm_response_time,
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
                        'pm_response_by' => $moodboard->itemPekerjaan->pm_response_by,
                        'pm_response_time' => $moodboard->itemPekerjaan->pm_response_time,
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

            if ($moodboard->itemPekerjaan) {
                Log::warning('Item Pekerjaan already exists for moodboard: ' . $moodboardId);
                return back()->with('error', 'Item Pekerjaan response sudah ada untuk moodboard ini.');
            }

            $itemPekerjaan = ItemPekerjaan::create([
                'moodboard_id' => $moodboardId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'item_pekerjaan')
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->where('is_marketing', false)
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
            } elseif ($taskResponse && $taskResponse->isOverdue()) {
                $taskResponse->update([
                    'user_id' => auth()->user()->id,
                    'response_time' => now(),
                ]);
            }

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
                'bast_number' => $itemPekerjaan->bast_number,
                'bast_date' => $itemPekerjaan->bast_date?->format('d M Y'),
                'bast_pdf_path' => $itemPekerjaan->bast_pdf_path,
                'has_bast' => $itemPekerjaan->has_bast,
                'is_all_produk_completed' => $itemPekerjaan->produks->every(fn($p) => $p->current_stage === 'Install QC'),
                'bast_foto_klien' => $itemPekerjaan->bast_foto_klien
                    ? \Illuminate\Support\Facades\Storage::url($itemPekerjaan->bast_foto_klien)
                    : null,
                'bast_foto_klien_uploaded_at' => $itemPekerjaan->bast_foto_klien_uploaded_at?->format('d M Y H:i'),
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


}
