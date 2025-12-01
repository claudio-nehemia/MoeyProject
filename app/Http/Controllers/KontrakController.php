<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Kontrak;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Models\Termin;

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
                    'termin' => [
                        'id' => $itemPekerjaan->kontrak->termin->id ?? null,
                        'nama' => $itemPekerjaan->kontrak->termin->nama_tipe ?? null,
                        'tahapan' => $itemPekerjaan->kontrak->termin->tahapan ?? [],
                    ],
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

        // Check if kontrak already exists
        $existingKontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();
        if ($existingKontrak) {
            return back()->withErrors(['error' => 'Kontrak untuk Item Pekerjaan ini sudah ada.']);
        }

        // Get harga_kontrak from RAB Kontrak grand total
        $itemPekerjaan = ItemPekerjaan::with('rabKontrak.rabKontrakProduks')->find($validated['item_pekerjaan_id']);
        if (!$itemPekerjaan->rabKontrak) {
            return back()->withErrors(['error' => 'RAB Kontrak belum ada untuk Item Pekerjaan ini.']);
        }
        
        $hargaKontrak = $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        $validated['harga_kontrak'] = $hargaKontrak;
        
        // Set tanggal mulai dan tanggal selesai berdasarkan durasi kontrak
        $validated['tanggal_mulai'] = now();
        $validated['tanggal_selesai'] = now()->addDays($validated['durasi_kontrak']);

        try {
            $kontrak = Kontrak::create($validated);
            \Log::info('Kontrak Created:', $kontrak->toArray());

            // Update tahapan_proyek to 'kontrak'
            $itemPekerjaan->moodboard->order->update([
                'tahapan_proyek' => 'kontrak',
            ]);
            
            return redirect()->route('kontrak.index')->with('success', 'Kontrak berhasil dibuat!');
        } catch (\Exception $e) {
            \Log::error('Kontrak Creation Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Gagal membuat kontrak: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Kontrak $kontrak)
    {
        //
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kontrak $kontrak)
    {
        //
    }
}