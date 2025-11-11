<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Estimasi;
use App\Models\Moodboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EstimasiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $moodboards = Moodboard::with('estimasi', 'order')
            ->whereNotNull('moodboard_kasar')
            ->get()
            ->map(function ($moodboard) {
                return [
                    'id' => $moodboard->id,
                    'order_id' => $moodboard->order_id,
                    'moodboard_kasar' => $moodboard->moodboard_kasar,
                    'moodboard_final' => $moodboard->moodboard_final,
                    'status' => $moodboard->status,
                    'notes' => $moodboard->notes,
                    'response_by' => $moodboard->response_by,
                    'response_time' => $moodboard->response_time,
                    'order' => $moodboard->order ? [
                        'id' => $moodboard->order->id,
                        'nama_project' => $moodboard->order->nama_project,
                        'company_name' => $moodboard->order->company_name,
                        'customer_name' => $moodboard->order->customer_name,
                    ] : null,
                    'estimasi' => $moodboard->estimasi ? [
                        'id' => $moodboard->estimasi->id,
                        'estimated_cost' => $moodboard->estimasi->estimated_cost,
                        'response_by' => $moodboard->estimasi->response_by,
                        'response_time' => $moodboard->estimasi->response_time,
                    ] : null,
                ];
            });

        return Inertia::render('Estimasi/Index', [
            'moodboards' => $moodboards,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            \Log::info('=== ESTIMASI STORE START ===');
            \Log::info('Request data: ', $request->all());
            \Log::info('Has file: ' . ($request->hasFile('estimated_cost') ? 'YES' : 'NO'));
            
            $validated = $request->validate([
                'moodboard_id' => 'required|exists:moodboards,id',
                'estimated_cost' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);
            
            \Log::info('Validation passed');
            
            // Check if estimasi already exists
            $estimasi = Estimasi::where('moodboard_id', $validated['moodboard_id'])->first();
            
            if (!$estimasi) {
                \Log::error('Estimasi record not found for moodboard_id: ' . $validated['moodboard_id']);
                return back()->with('error', 'Response estimasi belum dibuat. Silakan buat response terlebih dahulu.');
            }
            
            if($request->hasFile('estimated_cost')) {
                // Delete old file if exists
                if ($estimasi->estimated_cost && Storage::disk('public')->exists($estimasi->estimated_cost)) {
                    Storage::disk('public')->delete($estimasi->estimated_cost);
                    \Log::info('Old file deleted: ' . $estimasi->estimated_cost);
                }
                
                $file = $request->file('estimated_cost');
                $filePath = $file->store('estimasi', 'public');
                \Log::info('File stored at: ' . $filePath);
                
                $estimasi->update(['estimated_cost' => $filePath]);
            }

            \Log::info('Estimasi updated with ID: ' . $estimasi->id);
            \Log::info('=== ESTIMASI STORE END ===');

            return back()->with('success', 'File estimasi berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Store estimasi error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload estimasi: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $estimasi = Estimasi::with('moodboard.order')->findOrFail($id);

        return Inertia::render('Estimasi/Show', [
            'estimasi' => $estimasi,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Estimasi $estimasi)
    {
        return response()->json($estimasi);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Estimasi $estimasi)
    {
        $validated = $request->validate([
            'estimated_cost' => 'required|file|mimes:jpg,jpeg,png,pdf',
        ]);
        
        if($request->hasFile('estimated_cost')) {
            // Delete old file
            if ($estimasi->estimated_cost && Storage::disk('public')->exists($estimasi->estimated_cost)) {
                Storage::disk('public')->delete($estimasi->estimated_cost);
            }
            $file = $request->file('estimated_cost');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('estimasi_files', $filename, 'public');
            $validated['estimated_cost'] = $filePath;
        }

        $estimasi->update($validated);

        return redirect()->back()->with('success', 'Estimasi updated successfully.');
    }

    public function responseEstimasi(Request $request, $moodboardId)
    {
        try {
            \Log::info('=== ESTIMASI RESPONSE START ===');
            \Log::info('Moodboard ID: ' . $moodboardId);
            
            $moodboard = Moodboard::findOrFail($moodboardId);

            if($moodboard->estimasi) {
                \Log::warning('Estimasi already exists for moodboard: ' . $moodboardId);
                return back()->with('error', 'Estimasi response sudah ada untuk moodboard ini.');
            }
            
            \Log::info('Creating estimasi with auto user and time');

            $estimasi = Estimasi::create([
                'moodboard_id' => $moodboardId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
            
            \Log::info('Estimasi response created with ID: ' . $estimasi->id);
            \Log::info('=== ESTIMASI RESPONSE END ===');

            return back()->with('success', 'Response estimasi berhasil dibuat.');
        } catch (\Exception $e) {
            \Log::error('Response estimasi error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal membuat response estimasi: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Estimasi $estimasi)
    {
        $estimasi->delete();

        return redirect()->back()->with('success', 'Estimasi deleted successfully.');
    }
}
