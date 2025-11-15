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
            'kontrak.termin'
        ])
        ->whereHas('rabInternal', function ($query) {
            $query->where('is_submitted', true);
        })
        ->get()
        ->map(function ($itemPekerjaan) {
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
                'kontrak' => $itemPekerjaan->kontrak ? [
                    'id' => $itemPekerjaan->kontrak->id,
                    'durasi_kontrak' => $itemPekerjaan->kontrak->durasi_kontrak,
                    'harga_kontrak' => $itemPekerjaan->kontrak->harga_kontrak,
                    'termin' => [
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
            'harga_kontrak' => 'required|numeric|min:0',
        ], [
            'item_pekerjaan_id.required' => 'Item Pekerjaan harus dipilih.',
            'durasi_kontrak.required' => 'Durasi kontrak harus diisi.',
            'durasi_kontrak.integer' => 'Durasi kontrak harus berupa angka.',
            'durasi_kontrak.min' => 'Durasi kontrak minimal 1 hari.',
            'termin_id.required' => 'Termin harus dipilih.',
            'termin_id.integer' => 'Termin tidak valid.',
            'termin_id.exists' => 'Termin yang dipilih tidak ditemukan.',
            'harga_kontrak.required' => 'Harga kontrak harus diisi.',
            'harga_kontrak.numeric' => 'Harga kontrak harus berupa angka.',
            'harga_kontrak.min' => 'Harga kontrak tidak boleh negatif.',
        ]);

        // Check if kontrak already exists
        $existingKontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();
        if ($existingKontrak) {
            return back()->withErrors(['error' => 'Kontrak untuk Item Pekerjaan ini sudah ada.']);
        }

        try {
            $kontrak = Kontrak::create($validated);
            \Log::info('Kontrak Created:', $kontrak->toArray());
            
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
     * Remove the specified resource from storage.
     */
    public function destroy(Kontrak $kontrak)
    {
        //
    }
}