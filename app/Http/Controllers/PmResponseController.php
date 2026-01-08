<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Moodboard;
use App\Models\Estimasi;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\SurveyUlang;
use App\Models\GambarKerja;
use App\Models\Kontrak;
use App\Models\SurveyResults;

class PmResponseController extends Controller
{
    /**
     * Check if user is PM
     */
    private function checkPm()
    {
        $user = auth()->user();
        if (!$user->role || $user->role->nama_role !== 'Project Manager') {
            return redirect()->back()->with('error', 'Unauthorized. Only Project Manager can perform this action.');
        }
        return null;
    }

    /**
     * Record PM response untuk model
     */
    private function recordResponse($model)
    {
        $model->update([
            'pm_response_time' => now(),
            'pm_response_by' => auth()->user()->name,
        ]);
    }

    // Moodboard
    public function moodboard($id)
    {
        if ($check = $this->checkPm()) return $check;
        
        \Log::info('=== PM RESPONSE MOODBOARD START ===');
        \Log::info('ID received: ' . $id);
        
        // Try to find moodboard by ID first
        $moodboard = Moodboard::find($id);
        
        if (!$moodboard) {
            \Log::info('Moodboard not found by ID, trying order_id');
            // If not found, assume $id is order_id and try to find by order_id
            $moodboard = Moodboard::where('order_id', $id)->first();
        }
        
        if (!$moodboard) {
            \Log::info('Moodboard not found, creating new with order_id: ' . $id);
            // Buat moodboard baru untuk PM response (assume $id is order_id)
            $moodboard = Moodboard::create([
                'order_id' => $id,
                'status' => 'pending',
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
            ]);
            \Log::info('Moodboard created with ID: ' . $moodboard->id);
            return back()->with('success', 'Moodboard dibuat dan PM Response berhasil dicatat.');
        }
        
        \Log::info('Moodboard found, ID: ' . $moodboard->id . ', updating PM response');
        $this->recordResponse($moodboard);
        \Log::info('=== PM RESPONSE MOODBOARD END ===');
        return back()->with('success', 'PM Response berhasil dicatat untuk Moodboard.');
    }

    // Estimasi
    public function estimasi($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(Estimasi::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Estimasi.');
    }

    // Commitment Fee
    public function commitmentFee($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(CommitmentFee::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Commitment Fee.');
    }

    // Item Pekerjaan
    public function itemPekerjaan($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(ItemPekerjaan::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Item Pekerjaan.');
    }

    // Survey Ulang
    public function surveyUlang($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(SurveyUlang::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Survey Ulang.');
    }

    // Gambar Kerja
    public function gambarKerja($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(GambarKerja::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Gambar Kerja.');
    }

    // Kontrak
    public function kontrak($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(Kontrak::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Kontrak.');
    }

    // Survey Result
    public function surveyResult($id)
    {
        if ($check = $this->checkPm()) return $check;
        $this->recordResponse(SurveyResults::findOrFail($id));
        return back()->with('success', 'PM Response berhasil dicatat untuk Survey Result.');
    }
}
