<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ItemPekerjaan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class CustomerPortalController extends Controller
{
    /**
     * Display the Customer Portal dashboard.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Cari semua order milik customer ini
        $orders = Order::where(function ($q) use ($user) {
            $q->where('customer_user_id', $user->id);
            if (!empty($user->email)) {
                $q->orWhere('customer_email', $user->email);
            }
            if (!empty($user->name)) {
                $q->orWhereRaw('LOWER(customer_name) = ?', [strtolower(trim($user->name))]);
            }
        })
        ->orderBy('created_at', 'desc')
        ->get(['id', 'nama_project', 'company_name', 'customer_name', 'project_status', 'tahapan_proyek']);

        // Jika customer belum punya order tertaut, tampilkan state kosong
        if ($orders->isEmpty()) {
            return Inertia::render('Customer/Portal', [
                'hasOrders' => false,
                'ordersList' => [],
                'selectedOrder' => null,
                'customer' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
        }

        // Tentukan order mana yang aktif dipilih
        $selectedOrderId = $request->query('order_id', $orders->first()->id);
        $order = Order::with([
            'jenisInterior',
            'moodboard.kasarFiles',
            'moodboard.finalFiles',
            'moodboard.commitmentFee',
            'moodboard.itemPekerjaans.produks.stageEvidences',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.produks.defects.defectItems.repairs',
            'moodboard.itemPekerjaans.kontrak',
            'gambarKerja.files',
        ])
        ->where(function ($q) use ($user) {
            $q->where('customer_user_id', $user->id);
            if (!empty($user->email)) {
                $q->orWhere('customer_email', $user->email);
            }
            if (!empty($user->name)) {
                $q->orWhereRaw('LOWER(customer_name) = ?', [strtolower(trim($user->name))]);
            }
        })
        ->find($selectedOrderId);

        // Jika order_id di parameter tidak valid/bukan miliknya, gunakan order pertama
        if (!$order) {
            $order = Order::with([
                'jenisInterior',
                'moodboard.kasarFiles',
                'moodboard.finalFiles',
                'moodboard.commitmentFee',
                'moodboard.itemPekerjaans.produks.stageEvidences',
                'moodboard.itemPekerjaans.produks.workplanItems',
                'moodboard.itemPekerjaans.produks.defects.defectItems.repairs',
                'moodboard.itemPekerjaans.kontrak',
                'gambarKerja.files',
            ])->find($orders->first()->id);
        }

        // Auto link customer_user_id jika belum terisi
        if ($order && empty($order->customer_user_id)) {
            $order->update(['customer_user_id' => $user->id]);
        }

        // Format data 6 Modul Utama
        $orderDetail = $this->formatOrderDetail($order);

        return Inertia::render('Customer/Portal', [
            'hasOrders' => true,
            'ordersList' => $orders,
            'selectedOrder' => $orderDetail,
            'customer' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Format data proyek untuk tampilan customer
     */
    private function formatOrderDetail(Order $order): array
    {
        $moodboard = $order->moodboard;
        $commitmentFee = $moodboard?->commitmentFee;
        $gambarKerja = $order->gambarKerja;

        // 1. COMMITMENT FEE
        $cfData = [
            'total_fee' => (float) ($commitmentFee?->total_fee ?? 0),
            'payment_status' => $commitmentFee?->payment_status ?? $order->payment_status,
            'payment_proof' => $commitmentFee?->payment_proof ? asset('storage/' . $commitmentFee->payment_proof) : null,
            'verified_at' => $commitmentFee?->response_time ? \Carbon\Carbon::parse($commitmentFee->response_time)->format('d M Y H:i') : null,
        ];

        // 2. MOODBOARD
        $mbData = [
            'status' => $moodboard?->status ?? 'pending',
            'notes' => $moodboard?->notes,
            'revisi_final' => $moodboard?->revisi_final,
            'kasar_files' => $moodboard ? $moodboard->kasarFiles->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name ?? 'Moodboard Kasar',
                'url' => asset('storage/' . $f->file_path),
            ]) : [],
            'final_files' => $moodboard ? $moodboard->finalFiles->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name ?? 'Desain Final',
                'url' => asset('storage/' . $f->file_path),
            ]) : [],
        ];

        // 3. GAMBAR KERJA
        $gkData = [
            'status' => $gambarKerja?->status ?? 'pending',
            'approved_by' => $gambarKerja?->approved_by,
            'approved_time' => $gambarKerja?->approved_time ? \Carbon\Carbon::parse($gambarKerja->approved_time)->format('d M Y H:i') : null,
            'files' => $gambarKerja ? $gambarKerja->files->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name,
                'url' => asset('storage/' . $f->file_path),
                'is_pdf' => strtolower(pathinfo($f->original_name, PATHINFO_EXTENSION)) === 'pdf',
            ]) : [],
        ];

        // 4. TIMELINE & PROGRESS PRODUKSI
        $itemPekerjaans = $moodboard?->itemPekerjaans ?? collect();
        $produksList = [];
        $defectsList = [];
        $primaryItemPekerjaan = $itemPekerjaans->first();

        foreach ($itemPekerjaans as $ip) {
            foreach ($ip->produks as $p) {
                // Stage Evidences
                $evidences = $p->stageEvidences->map(fn($e) => [
                    'stage' => $e->stage,
                    'notes' => $e->notes,
                    'url' => asset('storage/' . $e->evidence_path),
                    'uploaded_at' => $e->created_at ? \Carbon\Carbon::parse($e->created_at)->format('d M Y H:i') : '',
                ]);

                $produksList[] = [
                    'id' => $p->id,
                    'nama_produk' => $p->produk?->nama_produk ?? 'Custom Furniture',
                    'nama_ruangan' => $p->nama_ruangan ?? 'Ruangan Utama',
                    'quantity' => $p->quantity,
                    'current_stage' => $p->current_stage ?? 'Antrian Produksi',
                    'progress' => $p->progress ?? 0,
                    'is_completed' => (bool) $p->is_completed,
                    'evidences' => $evidences,
                ];

                // Defects
                foreach ($p->defects as $d) {
                    $items = $d->defectItems->map(fn($di) => [
                        'id' => $di->id,
                        'notes' => $di->notes,
                        'photo_url' => asset('storage/' . $di->photo_path),
                        'repairs' => $di->repairs->map(fn($r) => [
                            'id' => $r->id,
                            'notes' => $r->notes,
                            'photo_url' => asset('storage/' . $r->photo_path),
                            'is_approved' => (bool) $r->is_approved,
                            'repaired_at' => $r->repaired_at ? \Carbon\Carbon::parse($r->repaired_at)->format('d M Y H:i') : null,
                        ]),
                    ]);

                    $defectsList[] = [
                        'id' => $d->id,
                        'product_name' => $p->produk?->nama_produk ?? 'Produk',
                        'qc_stage' => $d->qc_stage,
                        'status' => $d->status,
                        'reported_at' => $d->reported_at ? \Carbon\Carbon::parse($d->reported_at)->format('d M Y H:i') : null,
                        'items' => $items,
                    ];
                }
            }
        }

        // 5. BAST (Berita Acara Serah Terima)
        $bastData = [
            'has_bast' => (bool) ($primaryItemPekerjaan?->has_bast ?? false),
            'bast_number' => $primaryItemPekerjaan?->bast_number,
            'bast_date' => $primaryItemPekerjaan?->bast_date ? \Carbon\Carbon::parse($primaryItemPekerjaan->bast_date)->format('d F Y') : null,
            'bast_foto_klien' => $primaryItemPekerjaan?->bast_foto_klien ? asset('storage/' . $primaryItemPekerjaan->bast_foto_klien) : null,
            'item_pekerjaan_id' => $primaryItemPekerjaan?->id,
            'download_url' => $primaryItemPekerjaan && $primaryItemPekerjaan->has_bast ? route('customer.bast.download', $primaryItemPekerjaan->id) : null,
        ];

        return [
            'id' => $order->id,
            'nama_project' => $order->nama_project,
            'company_name' => $order->company_name,
            'customer_name' => $order->customer_name,
            'nomor_unit' => $order->nomor_unit,
            'alamat' => $order->alamat,
            'tanggal_masuk' => $order->tanggal_masuk_customer,
            'tahapan_proyek' => $order->tahapan_proyek,
            'project_status' => $order->project_status,
            'progress' => $order->progress,
            'commitment_fee' => $cfData,
            'moodboard' => $mbData,
            'gambar_kerja' => $gkData,
            'timeline' => [
                'progress' => $order->progress,
                'tahapan_proyek' => $order->tahapan_proyek,
                'produks' => $produksList,
                'standard_stages' => [
                    'Potong',
                    'Rangkai',
                    'Finishing',
                    'Finishing QC',
                    'Packing',
                    'Pengiriman',
                    'Trap',
                    'Install',
                    'Install QC',
                ],
            ],
            'defects' => $defectsList,
            'bast' => $bastData,
        ];
    }

    /**
     * Download dokumen BAST khusus customer
     */
    public function downloadBast($itemPekerjaanId)
    {
        $user = auth()->user();

        $itemPekerjaan = ItemPekerjaan::with('moodboard.order')->findOrFail($itemPekerjaanId);
        $order = $itemPekerjaan->moodboard?->order;

        if (!$order) {
            abort(404, 'Proyek tidak ditemukan');
        }

        // Verifikasi kepemilikan order oleh customer
        $isOwner = $order->customer_user_id === $user->id 
            || strtolower(trim($order->customer_name)) === strtolower(trim($user->name));

        if (!$isOwner && !$user->hasAnyPermission(['order.show', 'project-management.bast'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengunduh dokumen ini.');
        }

        if (!$itemPekerjaan->bast_pdf_path) {
            return back()->with('error', 'Dokumen BAST belum siap diunduh.');
        }

        $filePath = storage_path('app/public/' . $itemPekerjaan->bast_pdf_path);

        if (!file_exists($filePath)) {
            // Generate PDF jika belum tersimpan secara fisik
            $allStageEvidences = collect();
            foreach ($itemPekerjaan->produks as $produk) {
                $grouped = $produk->stageEvidences->groupBy('stage');
                foreach ($grouped as $stage => $evidences) {
                    if (!$allStageEvidences->has($stage)) {
                        $allStageEvidences[$stage] = collect();
                    }
                    $allStageEvidences[$stage] = $allStageEvidences[$stage]->merge($evidences);
                }
            }

            $data = [
                'bast_number' => $itemPekerjaan->bast_number,
                'bast_date' => $itemPekerjaan->bast_date ? \Carbon\Carbon::parse($itemPekerjaan->bast_date)->format('d F Y') : now()->format('d F Y'),
                'order' => $order,
                'item_pekerjaan' => $itemPekerjaan,
                'produks' => $itemPekerjaan->produks,
                'stage_evidences' => $allStageEvidences,
                'kop_path' => public_path('kop-moey.jpeg'),
                'companyName' => "PT. Moey Living Indonesia",
                'companyAddress' => "Tangerang",
                'direkturName' => "Aniq Infanuddin",
            ];

            $pdf = Pdf::loadView('pdf.bast', $data);
            $pdf->setPaper('a4', 'portrait');

            Storage::disk('public')->put($itemPekerjaan->bast_pdf_path, $pdf->output());
        }

        return response()->download($filePath, 'BAST_' . str_replace(' ', '_', $order->nama_project) . '.pdf');
    }
}
