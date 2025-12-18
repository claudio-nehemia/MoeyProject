<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\WorkplanItem;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use Illuminate\Support\Facades\DB;
use App\Models\ItemPekerjaanProduk;
use App\Models\PengajuanPerpanjanganTimeline;
use App\Services\NotificationService;

class WorkplanItemController extends Controller
{
    public static function defaultBreakdown()
    {
        // Ambil dari config/stage.php
        $stages = config('stage.stages', []);
        $breakdown = [];
        foreach ($stages as $nama => $bobot) {
            $breakdown[] = ['nama_tahapan' => $nama];
        }
        return $breakdown;
    }

    /**
     * Index: Tampilkan project yang sudah bayar minimal 1 termin (setelah commitment fee)
     */
    public function index()
    {
        $orders = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.invoices',
            'moodboard.itemPekerjaans.kontrak',
            'moodboard.itemPekerjaans.pengajuanPerpanjanganTimelines',
        ])
            ->whereHas('moodboard.itemPekerjaans.invoices', function ($q) {
                // Sudah ada pembayaran termin (bukan commitment fee, tahap >= 1)
                $q->whereNotNull('paid_at')->where('termin_step', '>=', 1);
            })
            ->get()
            ->map(function ($order) {
                $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($ip) {
                    $totalProduks = $ip->produks->count();
                    $hasTimeline = $ip->workplan_start_date && $ip->workplan_end_date;
                    $produksWithWorkplan = $ip->produks->filter(fn($p) => 
                        $p->workplanItems->count() > 0
                    )->count();
                    
                    // Get latest pengajuan perpanjangan
                    $latestPengajuan = $ip->pengajuanPerpanjanganTimelines
                        ->sortByDesc('created_at')
                        ->first();

                    return [
                        'id' => $ip->id,
                        'total_produks' => $totalProduks,
                        'produks_with_workplan' => $produksWithWorkplan,
                        'has_timeline' => $hasTimeline,
                        'workplan_start_date' => $ip->workplan_start_date?->format('Y-m-d'),
                        'workplan_end_date' => $ip->workplan_end_date?->format('Y-m-d'),
                        'has_kontrak' => $ip->kontrak !== null,
                        'kontrak_durasi' => $ip->kontrak?->durasi_kontrak,
                        'pengajuan_perpanjangans' => $latestPengajuan ? [[
                            'id' => $latestPengajuan->id,
                            'item_pekerjaan_id' => $latestPengajuan->item_pekerjaan_id,
                            'status' => $latestPengajuan->status,
                            'reason' => $latestPengajuan->reason,
                        ]] : [],
                    ];
                });

                $totalProduks = $itemPekerjaans->sum('total_produks');
                $produksWithWorkplan = $itemPekerjaans->sum('produks_with_workplan');
                $hasAnyTimeline = $itemPekerjaans->contains('has_timeline', true);

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'total_produks' => $totalProduks,
                    'produks_with_workplan' => $produksWithWorkplan,
                    'has_timeline' => $hasAnyTimeline,
                    'workplan_progress' => $totalProduks > 0 
                        ? round(($produksWithWorkplan / $totalProduks) * 100) 
                        : 0,
                    'item_pekerjaans' => $itemPekerjaans,
                ];
            });

        return Inertia::render('Workplan/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Create: Form untuk membuat workplan per order
     */
    public function create($orderId)
    {
        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.kontrak',
        ])->findOrFail($orderId);

        $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($ip) {
            return [
                'id' => $ip->id,
                'nama_item' => $ip->nama_item ?? "Item Pekerjaan #{$ip->id}",
                'workplan_start_date' => $ip->workplan_start_date?->format('Y-m-d'),
                'workplan_end_date' => $ip->workplan_end_date?->format('Y-m-d'),
                'kontrak' => $ip->kontrak ? [
                    'durasi_kontrak' => $ip->kontrak->durasi_kontrak,
                    'tanggal_mulai' => $ip->kontrak->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_selesai' => $ip->kontrak->tanggal_selesai?->format('Y-m-d'),
                ] : null,
                'produks' => $ip->produks->map(function ($produk) {
                    $workplanItems = $produk->workplanItems->count() > 0
                        ? $produk->workplanItems
                        : collect(self::defaultBreakdown())->map(function ($row, $i) {
                            return (object)[
                                'id' => null,
                                'nama_tahapan' => $row['nama_tahapan'],
                                'start_date' => null,
                                'end_date' => null,
                                'duration_days' => null,
                                'urutan' => $i + 1,
                                'status' => 'planned',
                                'catatan' => null,
                            ];
                        });

                    return [
                        'id' => $produk->id,
                        'nama_produk' => $produk->produk->nama_produk,
                        'nama_ruangan' => $produk->nama_ruangan,
                        'quantity' => $produk->quantity,
                        'dimensi' => "{$produk->panjang}×{$produk->lebar}×{$produk->tinggi}",
                        'workplan_items' => $workplanItems->map(fn($wp) => [
                            'id' => $wp->id,
                            'nama_tahapan' => $wp->nama_tahapan,
                            'start_date' => $wp->start_date?->format('Y-m-d') ?? ($wp->start_date ?? null),
                            'end_date' => $wp->end_date?->format('Y-m-d') ?? ($wp->end_date ?? null),
                            'duration_days' => $wp->duration_days,
                            'urutan' => $wp->urutan,
                            'status' => $wp->status,
                            'catatan' => $wp->catatan,
                        ])->toArray(),
                    ];
                }),
            ];
        });

        return Inertia::render('Workplan/Create', [
            'order' => [
                'id' => $order->id,
                'nama_project' => $order->nama_project,
                'company_name' => $order->company_name,
                'customer_name' => $order->customer_name,
            ],
            'itemPekerjaans' => $itemPekerjaans,
        ]);
    }

    /**
     * Store: Simpan workplan untuk semua produk dalam order
     */
    public function store(Request $request, $orderId)
    {
        $validated = $request->validate([
            'item_pekerjaans' => 'required|array',
            'item_pekerjaans.*.id' => 'required|exists:item_pekerjaans,id',
            'item_pekerjaans.*.workplan_start_date' => 'required|date',
            'item_pekerjaans.*.workplan_end_date' => 'required|date|after_or_equal:item_pekerjaans.*.workplan_start_date',
            'item_pekerjaans.*.produks' => 'required|array',
            'item_pekerjaans.*.produks.*.id' => 'required|exists:item_pekerjaan_produks,id',
            'item_pekerjaans.*.produks.*.workplan_items' => 'required|array|min:1',
            'item_pekerjaans.*.produks.*.workplan_items.*.nama_tahapan' => 'required|string|max:255',
            'item_pekerjaans.*.produks.*.workplan_items.*.start_date' => 'nullable|date',
            'item_pekerjaans.*.produks.*.workplan_items.*.end_date' => 'nullable|date',
            'item_pekerjaans.*.produks.*.workplan_items.*.status' => 'required|string|in:planned,in_progress,done,cancelled',
            'item_pekerjaans.*.produks.*.workplan_items.*.catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $lastItemPekerjaan = null;
            
            foreach ($validated['item_pekerjaans'] as $ipData) {
                // Update timeline di ItemPekerjaan
                $itemPekerjaan = ItemPekerjaan::find($ipData['id']);
                $itemPekerjaan->update([
                    'workplan_start_date' => $ipData['workplan_start_date'],
                    'workplan_end_date' => $ipData['workplan_end_date'],
                ]);
                
                $lastItemPekerjaan = $itemPekerjaan;

                // Update workplan items per produk
                foreach ($ipData['produks'] as $produkData) {
                    $produk = ItemPekerjaanProduk::find($produkData['id']);
                    
                    // Hapus workplan lama dan buat baru
                    $produk->workplanItems()->delete();

                    foreach ($produkData['workplan_items'] as $index => $item) {
                        $start = !empty($item['start_date']) ? Carbon::parse($item['start_date']) : null;
                        $end = !empty($item['end_date']) ? Carbon::parse($item['end_date']) : null;

                        $duration = null;
                        if ($start && $end) {
                            $duration = $start->diffInDays($end) + 1;
                        }

                        WorkplanItem::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_tahapan' => $item['nama_tahapan'],
                            'start_date' => $start,
                            'end_date' => $end,
                            'duration_days' => $duration,
                            'urutan' => $index + 1,
                            'status' => $item['status'],
                            'catatan' => $item['catatan'] ?? null,
                        ]);
                    }
                }
            }

            // Create pengajuan perpanjangan timeline untuk store (create baru)
            if ($lastItemPekerjaan) {
                PengajuanPerpanjanganTimeline::create([
                    'item_pekerjaan_id' => $lastItemPekerjaan->id,
                    'status' => 'none',
                    'reason' => null,
                ]);
            }
        });

        // Kirim notifikasi project management request ke Supervisor & PM
        $order = Order::findOrFail($orderId);
        $notificationService = new NotificationService();
        $notificationService->sendProjectManagementRequestNotification($order);

        return redirect()->route('workplan.index')
            ->with('success', 'Workplan berhasil disimpan. Notifikasi project management telah dikirim ke Supervisor dan Project Manager.');
    }

    /**
     * Edit: Form untuk edit workplan
     */
    public function edit($orderId)
    {
        // Sama seperti create, tapi untuk edit
        return $this->create($orderId);
    }

    /**
     * Update: Update workplan
     */
    public function update(Request $request, $orderId)
    {
        $validated = $request->validate([
            'item_pekerjaans' => 'required|array',
            'item_pekerjaans.*.id' => 'required|exists:item_pekerjaans,id',
            'item_pekerjaans.*.workplan_start_date' => 'required|date',
            'item_pekerjaans.*.workplan_end_date' => 'required|date|after_or_equal:item_pekerjaans.*.workplan_start_date',
            'item_pekerjaans.*.produks' => 'required|array',
            'item_pekerjaans.*.produks.*.id' => 'required|exists:item_pekerjaan_produks,id',
            'item_pekerjaans.*.produks.*.workplan_items' => 'required|array|min:1',
            'item_pekerjaans.*.produks.*.workplan_items.*.nama_tahapan' => 'required|string|max:255',
            'item_pekerjaans.*.produks.*.workplan_items.*.start_date' => 'nullable|date',
            'item_pekerjaans.*.produks.*.workplan_items.*.end_date' => 'nullable|date',
            'item_pekerjaans.*.produks.*.workplan_items.*.status' => 'required|string|in:planned,in_progress,done,cancelled',
            'item_pekerjaans.*.produks.*.workplan_items.*.catatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $lastItemPekerjaan = null;
            
            foreach ($validated['item_pekerjaans'] as $ipData) {
                // Update timeline di ItemPekerjaan
                $itemPekerjaan = ItemPekerjaan::find($ipData['id']);
                $itemPekerjaan->update([
                    'workplan_start_date' => $ipData['workplan_start_date'],
                    'workplan_end_date' => $ipData['workplan_end_date'],
                ]);
                
                $lastItemPekerjaan = $itemPekerjaan;

                // Update workplan items per produk
                foreach ($ipData['produks'] as $produkData) {
                    $produk = ItemPekerjaanProduk::find($produkData['id']);
                    
                    // Hapus workplan lama dan buat baru
                    $produk->workplanItems()->delete();

                    foreach ($produkData['workplan_items'] as $index => $item) {
                        $start = !empty($item['start_date']) ? Carbon::parse($item['start_date']) : null;
                        $end = !empty($item['end_date']) ? Carbon::parse($item['end_date']) : null;

                        $duration = null;
                        if ($start && $end) {
                            $duration = $start->diffInDays($end) + 1;
                        }

                        WorkplanItem::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_tahapan' => $item['nama_tahapan'],
                            'start_date' => $start,
                            'end_date' => $end,
                            'duration_days' => $duration,
                            'urutan' => $index + 1,
                            'status' => $item['status'],
                            'catatan' => $item['catatan'] ?? null,
                        ]);
                    }
                }
            }

            // Update pengajuan perpanjangan timeline untuk update (update existing)
            if ($lastItemPekerjaan) {
                $existingPengajuan = PengajuanPerpanjanganTimeline::where('item_pekerjaan_id', $lastItemPekerjaan->id)
                    ->latest()
                    ->first();
                
                if ($existingPengajuan) {
                    // Update pengajuan yang sudah ada
                    $existingPengajuan->update([
                        'status' => 'none',
                        'reason' => null,
                    ]);
                } else {
                    // Jika belum ada, buat baru
                    PengajuanPerpanjanganTimeline::create([
                        'item_pekerjaan_id' => $lastItemPekerjaan->id,
                        'status' => 'none',
                        'reason' => null,
                    ]);
                }
            }
        });

        // Kirim notifikasi project management request ke Supervisor & PM
        $order = Order::findOrFail($orderId);
        $notificationService = new NotificationService();
        $notificationService->sendProjectManagementRequestNotification($order);

        return redirect()->route('workplan.index')
            ->with('success', 'Workplan berhasil diperbarui. Notifikasi project management telah dikirim ke Supervisor dan Project Manager.');
    }

    /**
     * Update status workplan item
     */
    public function updateStatus(Request $request, WorkplanItem $workplan)
    {
        $request->validate([
            'status' => 'required|in:planned,in_progress,done,cancelled',
        ]);

        $workplan->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status workplan diperbarui.');
    }
}
