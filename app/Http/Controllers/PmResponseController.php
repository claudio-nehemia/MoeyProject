<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Kontrak;
use App\Models\Estimasi;
use App\Models\Moodboard;
use App\Models\GambarKerja;
use App\Models\SurveyUlang;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\SurveyResults;

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

    private function checkOriginalKepalaMarketing(Order $order)
    {
        $user = auth()->user();
        if (!$user || !$user->role || $user->role->nama_role !== 'Kepala Marketing') {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing can perform this action.');
        }

        $isAssignedKepalaMarketing = $order->users()
            ->whereHas('role', fn($q) => $q->where('nama_role', 'Kepala Marketing'))
            ->where('users.id', $user->id)
            ->exists();

        if (!$isAssignedKepalaMarketing) {
            return redirect()->back()->with('error', 'Unauthorized. Only Kepala Marketing assigned to this order can respond.');
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
        if ($check = $this->checkPm())
            return $check;

        \Log::info('=== PM RESPONSE SURVEY SCHEDULE START ===');
        \Log::info('Order ID: ' . $id);

        $order = Order::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($order))
            return $check;

        $order->update([
            'pm_survey_response_time' => now(),
            'pm_survey_response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskResponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . $order->id);
        }

        \Log::info('Survey Schedule PM Response recorded for Order ID: ' . $order->id);
        \Log::info('=== PM RESPONSE SURVEY SCHEDULE END ===');

        return back()->with('success', 'PM Response berhasil dicatat untuk Survey Schedule.');
    }

    // Moodboard (Tahap Moodboard - setelah survey)
    public function moodboard($id)
    {
        if ($check = $this->checkPm())
            return $check;

        \Log::info('=== PM RESPONSE MOODBOARD START ===');
        \Log::info('ID received: ' . $id);

        $moodboard = Moodboard::find($id);

        if (!$moodboard) {
            \Log::info('Moodboard not found by ID, trying order_id');
            $moodboard = Moodboard::where('order_id', $id)->first();
        }

        if ($moodboard) {
            if ($check = $this->checkOriginalKepalaMarketing($moodboard->order))
                return $check;
        } else {
            $order = Order::findOrFail($id);
            if ($check = $this->checkOriginalKepalaMarketing($order))
                return $check;
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
        $taskresponse = TaskResponse::where('order_id', $moodboard->order->id)
            ->where('tahap', 'moodboard')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . $moodboard->order->id);
        }
        \Log::info('=== PM RESPONSE MOODBOARD END ===');
        return back()->with('success', 'PM Response berhasil dicatat untuk Moodboard.');
    }

    // Desain Final (Tahap Desain Final - setelah commitment fee)
    public function desainFinal($id)
    {
        if ($check = $this->checkPm())
            return $check;

        \Log::info('=== PM RESPONSE DESAIN FINAL START ===');
        \Log::info('Moodboard ID: ' . $id);

        $moodboard = Moodboard::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($moodboard->order))
            return $check;
        \Log::info('Moodboard found, ID: ' . $moodboard->id);

        // Check if already has pm_response_final for desain final
        if ($moodboard->pm_response_final_time) {
            \Log::info('PM Response Final already exists for desain final');
            return back()->with('info', 'PM Response sudah pernah dicatat untuk Desain Final.');
        }

        // Update moodboard dengan pm_response_final
        $moodboard->update([
            'pm_response_final_time' => now(),
            'pm_response_final_by' => auth()->user()->name,
        ]);

        // Update task response marketing untuk desain_final
        $taskresponse = TaskResponse::where('order_id', $moodboard->order->id)
            ->where('tahap', 'desain_final')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . $moodboard->order->id);
        }

        \Log::info('=== PM RESPONSE DESAIN FINAL END ===');
        return back()->with('success', 'PM Response berhasil dicatat untuk Desain Final.');
    }

    // Estimasi
    public function estimasi($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $estimasi = Estimasi::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($estimasi->moodboard->order))
            return $check;
        if (!$estimasi) {
            Estimasi::create([
                'moodboard_id' => $estimasi->moodboard_id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        } else {
            $this->recordResponse($estimasi);

        }
        $taskresponse = TaskResponse::where('order_id', Estimasi::findOrFail($id)->moodboard->order->id)
            ->where('tahap', 'estimasi')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . Estimasi::findOrFail($id)->moodboard->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Estimasi.');
    }

    // Commitment Fee
    public function commitmentFee($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $commitmentFee = CommitmentFee::find($id);
        $moodboard = null;

        if ($commitmentFee) {
            $moodboard = $commitmentFee->moodboard;
        } else {
            $moodboard = Moodboard::find($id);
        }

        if (!$moodboard) {
            return redirect()->back()->with('error', 'Moodboard tidak ditemukan untuk commitment fee.');
        }

        if ($check = $this->checkOriginalKepalaMarketing($moodboard->order))
            return $check;

        if (!$commitmentFee) {
            $commitmentFee = CommitmentFee::create([
                'moodboard_id' => $moodboard->id,
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
                'payment_status' => 'pending',
            ]);
        } else {
            $this->recordResponse($commitmentFee);
        }

        $taskresponse = TaskResponse::where('order_id', $moodboard->order->id)
            ->where('tahap', 'cm_fee')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . $moodboard->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Commitment Fee.');
    }

    // Item Pekerjaan
    public function itemPekerjaan($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $itemPekerjaan = ItemPekerjaan::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($itemPekerjaan->moodboard->order))
            return $check;
        $this->recordResponse($itemPekerjaan);
        $taskresponse = TaskResponse::where('order_id', ItemPekerjaan::findOrFail($id)->moodboard->order->id)
            ->where('tahap', 'item_pekerjaan')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . ItemPekerjaan::findOrFail($id)->moodboard->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Item Pekerjaan.');
    }

    // Survey Ulang
    public function surveyUlang($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $surveyUlang = SurveyUlang::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($surveyUlang->order))
            return $check;
        $this->recordResponse($surveyUlang);
        $taskresponse = TaskResponse::where('order_id', SurveyUlang::findOrFail($id)->order->id)
            ->where('tahap', 'survey_ulang')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . SurveyUlang::findOrFail($id)->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Survey Ulang.');
    }

    // Gambar Kerja
    public function gambarKerja($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $gambarKerja = GambarKerja::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($gambarKerja->order))
            return $check;
        $this->recordResponse($gambarKerja);
        $taskresponse = TaskResponse::where('order_id', GambarKerja::findOrFail($id)->order->id)
            ->where('tahap', 'gambar_kerja')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskresponse) {
            $taskresponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskresponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . GambarKerja::findOrFail($id)->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Gambar Kerja.');
    }

    // Kontrak
    public function kontrak($id)
    {
        if ($check = $this->checkPm())
            return $check;
        $kontrak = Kontrak::findOrFail($id);
        if ($check = $this->checkOriginalKepalaMarketing($kontrak->itemPekerjaan->moodboard->order))
            return $check;
        $this->recordResponse($kontrak);
        $taskResponse = TaskResponse::where('order_id', Kontrak::findOrFail($id)->itemPekerjaan->moodboard->order->id)
            ->where('tahap', 'kontrak')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskResponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . Kontrak::findOrFail($id)->itemPekerjaan->moodboard->order->id);
        }
        return back()->with('success', 'PM Response berhasil dicatat untuk Kontrak.');
    }

    // Survey Result
    public function surveyResult($id)
    {
        if ($check = $this->checkPm())
            return $check;

        \Log::info('=== PM RESPONSE SURVEY RESULT START ===');
        \Log::info('ID received: ' . $id);

        $surveyResult = SurveyResults::find($id);

        if (!$surveyResult) {
            \Log::info('Survey Result not found by ID, trying order_id');
            $surveyResult = SurveyResults::where('order_id', $id)->first();
        }

        if ($surveyResult) {
            if ($check = $this->checkOriginalKepalaMarketing($surveyResult->order))
                return $check;
        } else {
            $order = Order::findOrFail($id);
            if ($check = $this->checkOriginalKepalaMarketing($order))
                return $check;
        }

        if (!$surveyResult) {
            \Log::info('Survey Result not found, creating new with order_id: ' . $id);
            $surveyResult = SurveyResults::create([
                'order_id' => $id,
                'pm_response_time' => now(),
                'pm_response_by' => auth()->user()->name,
            ]);
            \Log::info('Survey Result created with ID: ' . $surveyResult->id);
        } else {
            $this->recordResponse($surveyResult);
        }

        \Log::info('Survey Result found, ID: ' . $surveyResult->id . ', updating Marketing response');
        \Log::info('=== PM RESPONSE SURVEY RESULT END ===');
        $taskResponse = TaskResponse::where('order_id', $surveyResult->order->id)
            ->where('tahap', 'survey')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
            \Log::info('Associated TaskResponse ID: ' . $taskResponse->id . ' response_time updated.');
        } else {
            \Log::info('No associated TaskResponse found for Order ID: ' . $surveyResult->order->id);
        }
        return back()->with('success', 'Marketing Response berhasil dicatat untuk Survey Result.');
    }

    // Workplan
    public function workplan($orderId)
    {
        if ($check = $this->checkPm())
            return $check;

        $orderForAuth = Order::findOrFail($orderId);
        if ($check = $this->checkOriginalKepalaMarketing($orderForAuth))
            return $check;

        $order = Order::with('moodboard.itemPekerjaans.produks.workplanItems')->findOrFail($orderId);

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

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'workplan')
            ->where('is_marketing', true)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();
        if ($taskResponse) {
            $taskResponse->update([
                'response_time' => now(),
                'status' => 'selesai',
                'user_id' => auth()->user()->id,
            ]);
        }

        return back()->with('success', 'PM Response berhasil dicatat untuk Workplan.');
    }
}