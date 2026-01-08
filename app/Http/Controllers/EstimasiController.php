<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Estimasi;
use App\Models\Moodboard;
use Illuminate\Http\Request;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class EstimasiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== ESTIMASI INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));
        
        $moodboards = Moodboard::with('estimasi.files.moodboardFile', 'order', 'kasarFiles')
            ->whereHas('order', function($query) use ($user) {
                $query->visibleToUser($user);
            })
            ->whereHas('kasarFiles')
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
                    'pm_response_by' => $moodboard->pm_response_by,
                    'pm_response_time' => $moodboard->pm_response_time,
                    'kasar_files' => $moodboard->kasarFiles->map(function ($file) use ($moodboard) {
                        $estimasiFile = null;
                        if ($moodboard->estimasi) {
                            $estimasiFile = $moodboard->estimasi->files()
                                ->where('moodboard_file_id', $file->id)
                                ->first();
                        }

                        return [
                            'id' => $file->id,
                            'file_path' => $file->file_path,
                            'original_name' => $file->original_name,
                            'url' => asset('storage/' . $file->file_path),
                            'estimasi_file' => $estimasiFile ? [
                                'id' => $estimasiFile->id,
                                'file_path' => $estimasiFile->file_path,
                                'original_name' => $estimasiFile->original_name,
                                'url' => asset('storage/' . $estimasiFile->file_path),
                            ] : null,
                        ];
                    }),
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
                        'pm_response_by' => $moodboard->estimasi->pm_response_by,
                        'pm_response_time' => $moodboard->estimasi->pm_response_time,
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
                'estimasi_id' => 'required|exists:estimasis,id',
                'moodboard_file_id' => 'required|exists:moodboard_files,id',
                'estimated_cost' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            \Log::info('Validation passed');

            $estimasi = Estimasi::findOrFail($validated['estimasi_id']);

            // Check if estimasi file already exists for this moodboard file
            $estimasiFile = \App\Models\EstimasiFile::where('estimasi_id', $estimasi->id)
                ->where('moodboard_file_id', $validated['moodboard_file_id'])
                ->first();

            if ($request->hasFile('estimated_cost')) {
                $file = $request->file('estimated_cost');
                $filePath = $file->store('estimasi', 'public');
                $originalName = $file->getClientOriginalName();

                \Log::info('File stored at: ' . $filePath);

                if ($estimasiFile) {
                    // Update existing
                    if ($estimasiFile->file_path && Storage::disk('public')->exists($estimasiFile->file_path)) {
                        Storage::disk('public')->delete($estimasiFile->file_path);
                        \Log::info('Old file deleted: ' . $estimasiFile->file_path);
                    }

                    $estimasiFile->update([
                        'file_path' => $filePath,
                        'original_name' => $originalName,
                    ]);

                    \Log::info('EstimasiFile updated with ID: ' . $estimasiFile->id);
                } else {
                    // Create new
                    $estimasiFile = \App\Models\EstimasiFile::create([
                        'estimasi_id' => $estimasi->id,
                        'moodboard_file_id' => $validated['moodboard_file_id'],
                        'file_path' => $filePath,
                        'original_name' => $originalName,
                    ]);

                    \Log::info('EstimasiFile created with ID: ' . $estimasiFile->id);

                    // Send notification to designer untuk approval design
                    $notificationService = new NotificationService();
                    $notificationService->sendDesignApprovalNotification($estimasi->moodboard->order);
                }

                // Update legacy field for backward compatibility (use first uploaded file)
                if (!$estimasi->estimated_cost) {
                    $estimasi->update(['estimated_cost' => $filePath]);
                }
            }

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

        if ($request->hasFile('estimated_cost')) {
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

            if ($moodboard->estimasi) {
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
