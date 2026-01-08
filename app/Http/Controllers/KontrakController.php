<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Termin;
use App\Models\Kontrak;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class KontrakController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $itemPekerjaans = ItemPekerjaan::with([
            'moodboard.order',
            'moodboard.commitmentFee',
            'rabInternal',
            'rabKontrak.rabKontrakProduks',
            'kontrak.termin'
        ])
        ->whereHas('rabInternal', function ($query) {
            $query->where('is_submitted', true);
        })
        ->whereHas('rabKontrak') // Must have RAB Kontrak
        ->get()
        ->map(function ($itemPekerjaan) {
            // Calculate grand total from RAB Kontrak
            $grandTotalRabKontrak = $itemPekerjaan->rabKontrak 
                ? $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir')
                : 0;
            
            $commitmentFee = $itemPekerjaan->moodboard->commitmentFee?->total_fee ?? 0;
            $sisaPembayaran = $grandTotalRabKontrak - $commitmentFee;

            return [
                'id' => $itemPekerjaan->id,
                'order' => [
                    'nama_project' => $itemPekerjaan->moodboard->order->nama_project,
                    'company_name' => $itemPekerjaan->moodboard->order->company_name,
                    'customer_name' => $itemPekerjaan->moodboard->order->customer_name,
                ],
                'commitment_fee' => $itemPekerjaan->moodboard->commitmentFee ? [
                    'id' => $itemPekerjaan->moodboard->commitmentFee->id,
                    'jumlah' => $itemPekerjaan->moodboard->commitmentFee->total_fee,
                    'status' => $itemPekerjaan->moodboard->commitmentFee->payment_status === 'completed' ? 'Paid' : 'Pending',
                ] : null,
                'rab_kontrak' => [
                    'id' => $itemPekerjaan->rabKontrak->id,
                    'grand_total' => $grandTotalRabKontrak,
                ],
                'sisa_pembayaran' => $sisaPembayaran,
                'kontrak' => $itemPekerjaan->kontrak ? [
                    'id' => $itemPekerjaan->kontrak->id,
                    'durasi_kontrak' => $itemPekerjaan->kontrak->durasi_kontrak,
                    'harga_kontrak' => $itemPekerjaan->kontrak->harga_kontrak,
                    'signed_contract_path' => $itemPekerjaan->kontrak->signed_contract_path 
                        ? Storage::url($itemPekerjaan->kontrak->signed_contract_path) 
                        : null,
                    'signed_at' => $itemPekerjaan->kontrak->signed_at?->format('d M Y H:i'),
                    'response_time' => $itemPekerjaan->kontrak->response_time?->format('d M Y H:i'),
                    'response_by' => $itemPekerjaan->kontrak->response_by,
                    'pm_response_time' => $itemPekerjaan->kontrak->pm_response_time?->format('d M Y H:i'),
                    'pm_response_by' => $itemPekerjaan->kontrak->pm_response_by,
                    'termin' => $itemPekerjaan->kontrak->termin ? [
                        'id' => $itemPekerjaan->kontrak->termin->id,
                        'nama' => $itemPekerjaan->kontrak->termin->nama_tipe,
                        'tahapan' => $itemPekerjaan->kontrak->termin->tahapan ?? [],
                    ] : null,
                ] : null,
            ];
        });

        return Inertia::render('Kontrak/Index', [
            'itemPekerjaans' => $itemPekerjaans,
            'termins' => Termin::all(['id', 'kode_tipe', 'nama_tipe', 'tahapan']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Log incoming request untuk debug
        \Log::info('Kontrak Store Request:', $request->all());

        $validated = $request->validate([
            'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
            'durasi_kontrak' => 'required|integer|min:1',
            'termin_id' => 'required|integer|exists:termins,id',
        ], [
            'item_pekerjaan_id.required' => 'Item Pekerjaan harus dipilih.',
            'durasi_kontrak.required' => 'Durasi kontrak harus diisi.',
            'durasi_kontrak.integer' => 'Durasi kontrak harus berupa angka.',
            'durasi_kontrak.min' => 'Durasi kontrak minimal 1 hari.',
            'termin_id.required' => 'Termin harus dipilih.',
            'termin_id.integer' => 'Termin tidak valid.',
            'termin_id.exists' => 'Termin yang dipilih tidak ditemukan.',
        ]);

        // Get existing kontrak (yang sudah dibuat di response())
        $kontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();
        
        if (!$kontrak) {
            return back()->withErrors(['error' => 'Kontrak belum di-response. Silakan response terlebih dahulu.']);
        }

        // Get harga_kontrak from RAB Kontrak grand total
        $itemPekerjaan = ItemPekerjaan::with('rabKontrak.rabKontrakProduks')->find($validated['item_pekerjaan_id']);
        if (!$itemPekerjaan->rabKontrak) {
            return back()->withErrors(['error' => 'RAB Kontrak belum ada untuk Item Pekerjaan ini.']);
        }
        
        $hargaKontrak = $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        
        // Set tanggal mulai dan tanggal selesai berdasarkan durasi kontrak
        $validated['harga_kontrak'] = $hargaKontrak;
        $validated['tanggal_mulai'] = now();
        $validated['tanggal_selesai'] = now()->addDays($validated['durasi_kontrak']);

        try {
            // UPDATE kontrak yang sudah ada (bukan create baru)
            $kontrak->update($validated);
            \Log::info('Kontrak Updated:', $kontrak->fresh()->toArray());

            // Update tahapan_proyek to 'kontrak'
            $itemPekerjaan->moodboard->order->update([
                'tahapan_proyek' => 'kontrak',
                'project_status' => 'deal',
            ]);
            
            return redirect()->route('kontrak.index')->with('success', 'Kontrak berhasil dilengkapi!');
        } catch (\Exception $e) {
            \Log::error('Kontrak Update Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Gagal melengkapi kontrak: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function response(Request $request)
    {
        $validated = $request->validate([
            'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
        ]);

        // Check if kontrak sudah ada
        $existingKontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();
        if ($existingKontrak) {
            return back()->withErrors(['error' => 'Kontrak sudah pernah di-response.']);
        }

        Kontrak::create([
            'item_pekerjaan_id' => $validated['item_pekerjaan_id'],
            'response_time' => now(),
            'response_by' => auth()->user()->name,
        ]);

        return back()->with('success', 'Response kontrak berhasil.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Kontrak $kontrak)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kontrak $kontrak)
    {
        //
    }

    /**
     * Export kontrak as PDF.
     */
    public function exportPdf($kontrakId)
    {
        $kontrak = Kontrak::with([
            'itemPekerjaan.moodboard.order',
            'termin'
        ])->findOrFail($kontrakId);

        $data = [
            'kontrak' => $kontrak,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.kontrak', $data);
        $pdf->setPaper('a4', 'portrait');

        $filename = 'Kontrak-' . $kontrak->itemPekerjaan->moodboard->order->nama_project . '-' . date('YmdHis') . '.pdf';

        return $pdf->download($filename);
    }

    public function print($kontrakId)
    {
        $kontrak = Kontrak::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.moodboard.commitmentFee',
            'termin'
        ])->findOrFail($kontrakId);

        $itemPekerjaan = $kontrak->itemPekerjaan;
        $order = $itemPekerjaan->moodboard->order;
        $fee = $itemPekerjaan->moodboard->commitmentFee;

        // path kop surat
        $kopPath = public_path('kop-moey.png');

        $contractData = [
            // ======================================
            // CUSTOMER / PROJECT DATA
            // ======================================
            'customer_name' => $order->customer_name,
            'alamat' => $order->alamat ?? '-',
            'project' => [
                'nama' => $order->nama_project,
            ],
            'company_name' => $order->company_name,

            // ======================================
            // KONTRAK DATA
            // ======================================
            'nominal_kontrak' => $kontrak->harga_kontrak,
            'tanggal' => now()->format('d F Y'),
            'nomor' => 'PNW-' . $kontrak->id,
            'nomor_kontrak' => 'KTR-' . $kontrak->id,
            'today' => now()->format('d F Y'),

            // ======================================
            // COMMITMENT FEE DATA
            // ======================================
            'nominal_fee' => $fee ? number_format($fee->total_fee, 0, ',', '.') : '0',
            'status_fee' => $fee ? ($fee->payment_status === 'completed' ? 'Paid' : 'Pending') : '-',
            'nomor_surat_fee' => $fee ? "SPC-" . now()->format('Ymd') . "-" . $fee->id : null,
            'nomor_invoice_fee' => $fee ? "INV-" . now()->format('Ymd') . "-" . $fee->id : null,
            'nomor_kwitansi_fee' => $fee ? "KW-" . now()->format('Ymd') . "-" . $fee->id : null,
        ];

        // company moey
        $companyName = "PT. Moey Jaya Abadi";
        $companyAddress = "Tangerang";
        $direkturName = "Aniq Infanuddin";
        $jabatanDirektur = "Direktur Utama";
        $nameBank = "Mandiri";
        $norekBank = "1550007495610";
        $atasNamaBank = "PT. Moey Jaya Abadi";

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', [
            'kontrak' => $kontrak,
            'contractData' => $contractData,
            'companyName' => $companyName,
            'companyAddress' => $companyAddress,
            'direkturName' => $direkturName,
            'jabatanDirektur' => $jabatanDirektur,
            'nameBank' => $nameBank,
            'norekBank' => $norekBank,
            'atasNamaBank' => $atasNamaBank,
            'kopPath' => file_exists($kopPath) ? $kopPath : null,
        ])->setPaper('A4', 'portrait');

        return $pdf->stream('Kontrak-' . $order->nama_project . '.pdf');
    }

    /**
     * Upload signed contract PDF.
     */
    public function uploadSignedContract(Request $request, $kontrakId)
    {
        $kontrak = Kontrak::with('itemPekerjaan.moodboard.order')->findOrFail($kontrakId);

        $request->validate([
            'signed_contract' => 'required|file|mimes:pdf|max:10240', // Max 10MB
        ], [
            'signed_contract.required' => 'File kontrak harus diupload.',
            'signed_contract.mimes' => 'File harus berformat PDF.',
            'signed_contract.max' => 'Ukuran file maksimal 10MB.',
        ]);

        // Delete old signed contract if exists
        if ($kontrak->signed_contract_path) {
            Storage::disk('public')->delete($kontrak->signed_contract_path);
        }

        // Store the new signed contract
        $projectName = str_replace(' ', '_', $kontrak->itemPekerjaan->moodboard->order->nama_project);
        $filename = 'Kontrak_TTD_' . $projectName . '_' . now()->format('YmdHis') . '.pdf';
        $path = $request->file('signed_contract')->storeAs('signed-contracts', $filename, 'public');

        $kontrak->update([
            'signed_contract_path' => $path,
            'signed_at' => now(),
        ]);

        $notificationService = new NotificationService();
        $notificationService->sendInvoiceRequestNotification($kontrak->itemPekerjaan->moodboard->order);

        return back()->with('success', 'Kontrak yang sudah ditandatangani berhasil diupload!');
    }

    /**
     * Download signed contract PDF.
     */
    public function downloadSignedContract($kontrakId)
    {
        $kontrak = Kontrak::with('itemPekerjaan.moodboard.order')->findOrFail($kontrakId);

        if (!$kontrak->signed_contract_path) {
            return back()->with('error', 'Kontrak yang sudah ditandatangani belum diupload.');
        }

        $projectName = $kontrak->itemPekerjaan->moodboard->order->nama_project;
        $filename = 'Kontrak_TTD_' . $projectName . '.pdf';

        return Storage::disk('public')->download($kontrak->signed_contract_path, $filename);
    }

    /**
     * Delete signed contract.
     */
    public function deleteSignedContract($kontrakId)
    {
        $kontrak = Kontrak::findOrFail($kontrakId);

        if ($kontrak->signed_contract_path) {
            Storage::disk('public')->delete($kontrak->signed_contract_path);
            $kontrak->update([
                'signed_contract_path' => null,
                'signed_at' => null,
            ]);
        }

        return back()->with('success', 'Kontrak yang sudah ditandatangani berhasil dihapus.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kontrak $kontrak)
    {
        //
    }
}