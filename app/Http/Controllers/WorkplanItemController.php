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
            //menampilkan yang sudah isi itempekerjaan kolom keterangan material
            ->get()
            ->map(function ($order) {
                $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($ip) {
                    $totalProduks = $ip->produks->count();
                    $hasTimeline = $ip->workplan_start_date && $ip->workplan_end_date;
                    
                    // Count produks yang workplan items-nya sudah LENGKAP (ada start_date & end_date)
                    // Bukan hanya count yang punya workplan items kosong
                    $produksWithWorkplan = $ip->produks->filter(function($p) {
                        // Cek apakah ada minimal 1 workplan item yang sudah diisi timeline
                        $hasFilledWorkplan = $p->workplanItems->filter(function($wi) {
                            return $wi->start_date !== null && $wi->end_date !== null;
                        })->count() > 0;
                        
                        return $hasFilledWorkplan;
                    })->count();
                    
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

                // Check if any workplan item has been responded
                $workplanItems = $order->moodboard->itemPekerjaans
                    ->flatMap(fn($ip) => $ip->produks)
                    ->flatMap(fn($produk) => $produk->workplanItems);
                
                // Use model method to check if any item has response_time
                $hasResponded = WorkplanItem::hasAnyResponded($workplanItems);
                $responseBy = null;
                $responseTime = null;
                
                if ($hasResponded) {
                    // Get first responded item's info
                    $respondedItem = $workplanItems->first(fn($item) => $item->response_time !== null);
                    if ($respondedItem) {
                        $responseBy = $respondedItem->response_by;
                        $responseTime = $respondedItem->response_time;
                    }
                }

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'total_produks' => $totalProduks,
                    'produks_with_workplan' => $produksWithWorkplan,
                    'has_timeline' => $hasAnyTimeline,
                    'has_responded' => $hasResponded,
                    'response_by' => $responseBy,
                    'response_time' => $responseTime?->toIso8601String(),
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
     * Response notification - CREATE empty workplan items with response tracking
     * User must respond first before they can fill the workplan details
     */
    public function response(Order $order)
    {
        // Check if already has workplan items with response
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        // If workplan already exists and responded
        if ($workplanItems->isNotEmpty() && WorkplanItem::hasAnyResponded($workplanItems)) {
            return back()->with('info', 'Permintaan workplan sudah diterima sebelumnya.');
        }

        // CREATE empty workplan items with response tracking
        // This marks the response and prepares the structure for filling
        DB::transaction(function () use ($order) {
            foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                foreach ($itemPekerjaan->produks as $produk) {
                    // Skip if already has workplan items
                    if ($produk->workplanItems->count() > 0) {
                        continue;
                    }

                    // Create empty workplan items based on default breakdown
                    $defaultBreakdown = self::defaultBreakdown();
                    foreach ($defaultBreakdown as $index => $stage) {
                        WorkplanItem::create([
                            'item_pekerjaan_produk_id' => $produk->id,
                            'nama_tahapan' => $stage['nama_tahapan'],
                            'start_date' => null,
                            'end_date' => null,
                            'duration_days' => null,
                            'urutan' => $index + 1,
                            'status' => 'planned',
                            'catatan' => null,
                            'response_time' => now(),
                            'response_by' => auth()->user()->name ?? 'System',
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'Permintaan workplan berhasil diterima. Silakan lengkapi detail workplan.');
    }

    /**
     * Create: Form untuk membuat workplan per order
     * GUARD: User must respond first before accessing this page
     */
    public function create($orderId)
    {
        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.kontrak',
        ])->findOrFail($orderId);

        // GUARD: Check if user has responded
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        if ($workplanItems->isEmpty() || !WorkplanItem::hasAnyResponded($workplanItems)) {
            return redirect()->route('workplan.index')
                ->with('error', 'Anda harus merespons permintaan workplan terlebih dahulu sebelum mengisi detail.');
        }

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
     * Store: Update workplan details for all products in order
     * This updates the empty workplan items created during response
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

        DB::transaction(function () use ($validated, $orderId) {
            $order = Order::findOrFail($orderId);
            
            // GUARD: Ensure workplan items exist and have response_time
            $workplanItems = $order->moodboard
                ->itemPekerjaans
                ->flatMap(fn($ip) => $ip->produks)
                ->flatMap(fn($produk) => $produk->workplanItems);
            
            if ($workplanItems->isEmpty() || !WorkplanItem::hasAnyResponded($workplanItems)) {
                throw new \Exception('Workplan belum direspons. Silakan respons terlebih dahulu.');
            }
            
            $lastItemPekerjaan = null;
            
            foreach ($validated['item_pekerjaans'] as $ipData) {
                // Update timeline di ItemPekerjaan
                $itemPekerjaan = ItemPekerjaan::find($ipData['id']);
                $itemPekerjaan->update([
                    'workplan_start_date' => $ipData['workplan_start_date'],
                    'workplan_end_date' => $ipData['workplan_end_date'],
                ]);
                
                $lastItemPekerjaan = $itemPekerjaan;

                // UPDATE workplan items per produk (bukan create baru)
                foreach ($ipData['produks'] as $produkData) {
                    $produk = ItemPekerjaanProduk::find($produkData['id']);
                    
                    // Hapus workplan lama dan buat baru dengan preserve response info
                    $existingWorkplans = $produk->workplanItems;
                    $responseTime = $existingWorkplans->first()?->response_time;
                    $responseBy = $existingWorkplans->first()?->response_by;
                    
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
                            'response_time' => $responseTime, // Preserve response tracking
                            'response_by' => $responseBy,
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
     * GUARD: User must have responded first
     */
    public function edit($orderId)
    {
        // Same as create, but for edit - includes same guard
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
