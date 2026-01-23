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
use App\Models\Order;

class PmResponseController extends Controller
{
    /**
     * Check if user is PM
     */
    private function checkPm()
    {
        $user = auth()->user();
        if (!$user->role || $user->role->nama_role !== 'Kepala Marketing') {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing can perform this action.');
        }
        return null;
    }

    /**
     * Record PM response untuk model
     */
    private function recordResponse($model)
    {
        \Log::info('=== RECORD PM RESPONSE ===');
        \Log::info('Model: ' . get_class($model));
        \Log::info('Before update - response_time: ' . ($model->response_time ?? 'null'));
        \Log::info('Before update - pm_response_time: ' . ($model->pm_response_time ?? 'null'));
        
        $model->update([
            'pm_response_time' => now(),
            'pm_response_by' => auth()->user()->name,
        ]);
        
        $model->refresh();
        \Log::info('After update - response_time: ' . ($model->response_time ?? 'null'));
        \Log::info('After update - pm_response_time: ' . $model->pm_response_time);
        \Log::info('=== END RECORD PM RESPONSE ===');
    }

    // Survey Schedule (Order)
    public function surveySchedule($id)
    {
        if ($check = $this->checkPm()) return $check;
        
        \Log::info('=== PM RESPONSE SURVEY SCHEDULE START ===');
        \Log::info('Order ID: ' . $id);
        
        $order = Order::findOrFail($id);
        
        $order->update([
            'pm_survey_response_time' => now(),
            'pm_survey_response_by' => auth()->user()->name,
        ]);
        
        \Log::info('Survey Schedule PM Response recorded for Order ID: ' . $order->id);
        \Log::info('=== PM RESPONSE SURVEY SCHEDULE END ===');
        
        return back()->with('success', 'PM Response berhasil dicatat untuk Survey Schedule.');
    }

    // Moodboard
    public function moodboard($id)
    {
        if ($check = $this->checkPm()) return $check;
        
        \Log::info('=== PM RESPONSE MOODBOARD START ===');
        \Log::info('ID received: ' . $id);
        
        $moodboard = Moodboard::find($id);
        
        if (!$moodboard) {
            \Log::info('Moodboard not found by ID, trying order_id');
            $moodboard = Moodboard::where('order_id', $id)->first();
        }
        
        if (!$moodboard) {
            \Log::info('Moodboard not found, creating new with order_id: ' . $id);
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
        
        \Log::info('=== PM RESPONSE SURVEY RESULT START ===');
        \Log::info('ID received: ' . $id);
        
        $surveyResult = SurveyResults::find($id);
        
        if (!$surveyResult) {
            \Log::info('Survey Result not found by ID, trying order_id');
            $surveyResult = SurveyResults::where('order_id', $id)->first();
        }
        
        if (!$surveyResult) {
            \Log::info('Survey Result not found, creating new with order_id: ' . $id);
            $surveyResult = SurveyResults::create([
                'order_id' => $id,
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
            ]);
            \Log::info('Survey Result created with ID: ' . $surveyResult->id);
            return back()->with('success', 'Survey Result dibuat dan Marketing Response berhasil dicatat.');
        }
        
        \Log::info('Survey Result found, ID: ' . $surveyResult->id . ', updating Marketing response');
        $this->recordResponse($surveyResult);
        \Log::info('=== PM RESPONSE SURVEY RESULT END ===');
        return back()->with('success', 'Marketing Response berhasil dicatat untuk Survey Result.');
    }

    // Workplan
    public function workplan($orderId)
    {
        if ($check = $this->checkPm()) return $check;
        
        $order = \App\Models\Order::with('moodboard.itemPekerjaans.produks.workplanItems')->findOrFail($orderId);
        
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);
        
        foreach ($workplanItems as $item) {
            $item->update([
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
            ]);
        }
        
        return back()->with('success', 'PM Response berhasil dicatat untuk Workplan.');
    }
}