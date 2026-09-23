<?php

namespace App\Http\Controllers\Moodboard\Traits;

use App\Models\Moodboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait HasDesainFinal
{
    public function uploadDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== UPLOAD DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Has file: ' . ($request->hasFile('moodboard_final') ? 'YES' : 'NO'));

            $moodboard = Moodboard::with('commitmentFee')->findOrFail($moodboardId);
            Log::info('Moodboard found, status: ' . $moodboard->status);

            if ($moodboard->status !== 'approved') {
                Log::warning('Moodboard not approved, status: ' . $moodboard->status);
                return back()->with('error', 'Moodboard harus di-approve terlebih dahulu sebelum upload desain final.');
            }

            // Check if commitment fee exists and completed
            if (!$moodboard->commitmentFee || $moodboard->commitmentFee->payment_status !== 'completed') {
                Log::warning('Commitment fee not completed for moodboard: ' . $moodboardId);
                return back()->with('error', 'Commitment Fee harus diselesaikan (completed) terlebih dahulu sebelum upload desain final.');
            }

            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf,cad,dwg,dxf,skp|max:10240',
            ]);

            Log::info('Validation passed');

            if ($request->hasFile('moodboard_final')) {
                Log::info('Processing file upload');
                // Delete old file if exists
                if ($moodboard->moodboard_final) {
                    Log::info('Deleting old file: ' . $moodboard->moodboard_final);
                    Storage::disk('public')->delete($moodboard->moodboard_final);
                }
                $filePath = $request->file('moodboard_final')->store('moodboards', 'public');
                Log::info('File stored at: ' . $filePath);
                $moodboard->moodboard_final = $filePath;
            }

            $moodboard->save();
            Log::info('Moodboard saved successfully');
            Log::info('=== UPLOAD DESAIN FINAL END ===');

            return back()->with('success', 'Desain final berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Upload desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload desain final: ' . $e->getMessage());
        }
    }

    public function editDesainFinal($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return response()->json([
            'moodboard' => $moodboard,
        ]);
    }

    public function updateDesainFinal(Request $request, $moodboardId)
    {
        $moodboard = Moodboard::findOrFail($moodboardId);
        if ($moodboard->status === 'approved') {
            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf,cad,dwg,dxf,skp',
            ]);

            if ($request->hasFile('moodboard_final')) {
                $moodboard->moodboard_final = $request->file('moodboard_final')->store('moodboards', 'public');
            }

            $moodboard->update($validated);
        } else {
            return redirect()->back()->with('error', 'Cannot upload final design. Moodboard not approved yet.');
        }

        return redirect()->back()->with('success', 'Final design uploaded successfully.');
    }
}
