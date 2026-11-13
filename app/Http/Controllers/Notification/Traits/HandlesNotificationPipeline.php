<?php

namespace App\Http\Controllers\Notification\Traits;

use App\Models\Order;
use App\Models\Invoice;
use App\Models\Kontrak;
use App\Models\Estimasi;
use App\Models\Moodboard;
use App\Models\GambarKerja;
use App\Models\RabInternal;
use App\Models\SurveyUlang;
use App\Models\Notification;
use App\Models\TaskResponse;
use App\Http\Controllers\WorkplanItemController;
use App\Models\WorkplanItem;
use App\Models\CommitmentFee;
use App\Models\ItemPekerjaan;
use App\Models\SurveyResults;
use Illuminate\Support\Facades\DB;

trait HandlesNotificationPipeline
{
    /**
     * Handle survey request notification
     * CREATES RECORD with response info
     */
    private function handleSurveyRequest($order)
    {
        $survey = $order->surveyResults;
        if ($survey) {
            if (!$survey->response_time) {
                $hasSurveyData = !empty($survey->feedback) || !empty($survey->layout_files) || !empty($survey->foto_lokasi_files);
                $survey->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                    'is_draft' => $hasSurveyData ? $survey->is_draft : true,
                ]);
            }
        } else {
            $survey = SurveyResults::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
                'is_draft' => true,
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey')
            ->where(function ($q) {
                $q->where('is_marketing', false)->orWhereNull('is_marketing');
            })
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } else if ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        $hasPublishedSurvey = !$survey->is_draft && (
            !empty($survey->feedback) ||
            !empty($survey->layout_files) ||
            !empty($survey->foto_lokasi_files)
        );

        if ($hasPublishedSurvey) {
            return redirect()->route('survey-results.show', $survey->id)
                ->with('success', 'Menampilkan detail hasil survey.');
        }

        return redirect()->route('survey-results.create', $order->id)
            ->with('success', 'Response recorded. Silakan isi detail hasil survey.');
    }

    /**
     * Handle moodboard request notification
     * CREATES RECORD with response info
     */
    private function handleMoodboardRequest($order)
    {
        // Check if moodboard already exists
        if ($order->moodboard) {
            if (!$order->moodboard->response_time) {
                $order->moodboard->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            }
        } else {
            Moodboard::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
                'status' => 'pending',
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'moodboard',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'moodboard')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('moodboard.index', ['order_id' => $order->id, 'action' => 'upload'])
            ->with('success', 'Response recorded. Silakan upload file moodboard untuk proyek ini.');
    }

    /**
     * Handle estimasi request notification
     * CREATES RECORD with response info
     */
    private function handleEstimasiRequest($order)
    {
        if (!$order->moodboard) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if estimasi already exists
        if ($order->estimasi) {
            if (!$order->estimasi->response_time) {
                $order->estimasi->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $estimasi = Estimasi::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'estimasi')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('estimasi.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Silakan kelola estimasi untuk proyek ini.');
    }

    /**
     * Handle design approval notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleDesignApproval($order)
    {
        return redirect()->route('moodboard.index', ['order_id' => $order->id])
            ->with('info', 'Silakan cek desain untuk approval di Moodboard.');
    }

    /**
     * Handle commitment fee request notification
     * CREATES RECORD with response info
     */
    private function handleCommitmentFeeRequest($order)
    {
        // Check if moodboard exists
        if (!$order->moodboard) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if commitment fee already exists
        if ($order->moodboard->commitmentFee) {
            if (!$order->moodboard->commitmentFee->response_time) {
                $order->moodboard->commitmentFee->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $commitmentFee = CommitmentFee::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
                'payment_status' => 'pending',
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'cm_fee',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'cm_fee')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to commitment fee detail view for this order
        return redirect()->route('commitment-fee.index', ['order_id' => $order->id])
            ->with('success', 'Silakan lengkapi commitment fee untuk project ini.');
    }

    /**
     * Handle final design request notification
     * CREATES RECORD with response info
     */
    private function handleFinalDesignRequest($order)
    {
        // Check if moodboard exists
        if (!$order->moodboard) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if final design already uploaded
        if ($order->moodboard->moodboard_final || $order->moodboard->finalFiles->count() > 0) {
            return redirect()->route('desain-final.index', ['order_id' => $order->id])
                ->with('info', 'Final design sudah ada untuk project ini.');
        }

        $order->moodboard->update([
            'response_final_time' => now(),
            'response_final_by' => auth()->user()->name,
        ]);

        // Update order tahapan
        $order->update([
            'tahapan_proyek' => 'desain_final',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'desain_final')
            ->where('is_marketing', false)
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to desain final detail view for this order
        return redirect()->route('desain-final.index', ['order_id' => $order->id, 'action' => 'upload'])
            ->with('success', 'Silakan upload final design untuk project ini.');
    }

    /**
     * Handle item pekerjaan request notification
     * CREATES RECORD with response info
     */
    private function handleItemPekerjaanRequest($order)
    {
        if (!$order->moodboard) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        $itemPekerjaan = $order->itemPekerjaans->first();
        if ($itemPekerjaan) {
            if (!$itemPekerjaan->response_time) {
                $itemPekerjaan->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $itemPekerjaan = ItemPekerjaan::create([
                'moodboard_id' => $order->moodboard->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'item_pekerjaan')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        if ($itemPekerjaan->produks()->exists()) {
            if ($itemPekerjaan->is_draft) {
                return redirect()->route('item-pekerjaan.edit', $itemPekerjaan->id)
                    ->with('success', 'Response recorded. Silakan lanjutkan pengisian item pekerjaan.');
            }
            return redirect()->route('item-pekerjaan.show', $itemPekerjaan->id)
                ->with('success', 'Menampilkan detail item pekerjaan.');
        }

        return redirect()->route('item-pekerjaan.create', $itemPekerjaan->id)
            ->with('success', 'Response recorded. Silakan isi item pekerjaan untuk proyek ini.');
    }

    /**
     * Handle RAB internal request notification
     * CREATES RECORD with response info
     */
    private function handleRabInternalRequest($order)
    {
        if (!$order->itemPekerjaans || $order->itemPekerjaans->isEmpty()) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        $itemPekerjaan = $order->itemPekerjaans->first();
        $rabInternal = $itemPekerjaan?->rabInternal;
        if ($rabInternal) {
            if (!$rabInternal->response_time) {
                $rabInternal->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            }
        } else {
            $rabInternal = RabInternal::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'rab',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'rab_internal')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        if ($rabInternal->rabProduks()->exists()) {
            return redirect()->route('rab-internal.show', $rabInternal->id)
                ->with('success', 'Menampilkan detail RAB Internal.');
        }

        return redirect()->route('rab-internal.create', $rabInternal->id)
            ->with('success', 'Response recorded. Silakan isi RAB Internal untuk proyek ini.');
    }

    /**
     * Handle kontrak request notification
     * CREATES RECORD with response info
     */
    private function handleKontrakRequest($order)
    {
        // Check if kontrak already exists
        $itemPekerjaan = $order->itemPekerjaans->first();
        if (!$itemPekerjaan) {
            return redirect()->route('item-pekerjaan.index', ['order_id' => $order->id])
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        if ($itemPekerjaan && $itemPekerjaan->kontrak) {
            if (!$itemPekerjaan->kontrak->response_time) {
                $itemPekerjaan->kontrak->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name,
                ]);
            }
        } else {
            Kontrak::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        }

        $order->update([
            'tahapan_proyek' => 'kontrak',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'kontrak')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->where('is_marketing', false)
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Kontrak page
        return redirect()->route('kontrak.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Please manage the Kontrak for this order.');
    }

    /**
     * Ensure the step-1 invoice has calculated termin amount & invoice number so invoice.show renders properly
     */
    protected function ensureFirstInvoiceInitialized(ItemPekerjaan $itemPekerjaan, Invoice $invoice): Invoice
    {
        if ($invoice->total_amount > 0 && !empty($invoice->invoice_number)) {
            return $invoice;
        }

        $itemPekerjaan->loadMissing([
            'rabKontrak.rabKontrakProduks',
            'kontrak.termin',
            'moodboard.commitmentFee',
        ]);

        $termin = $itemPekerjaan->kontrak?->termin;
        $tahapan = $termin?->tahapan ?? [];
        $tahap1 = $tahapan[0] ?? null;

        $hargaKontrak = (float) ($itemPekerjaan->kontrak?->harga_kontrak ?? 0);
        if ($hargaKontrak <= 0 && $itemPekerjaan->rabKontrak) {
            $hargaKontrak = (float) $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');
        }

        $commitmentFee = $itemPekerjaan->moodboard?->commitmentFee;
        $commitmentFeeAmount = (float) ($commitmentFee?->total_fee ?? 0);
        $commitmentFeePaid = $commitmentFee?->payment_status === 'completed';
        $sisaPembayaran = $commitmentFeePaid ? max(0, $hargaKontrak - $commitmentFeeAmount) : $hargaKontrak;

        $persentase = (float) ($tahap1['persentase'] ?? 100);
        $terminText = $tahap1['text'] ?? 'Tahap 1';
        $totalAmount = $sisaPembayaran * ($persentase / 100);

        $invoiceNumber = $invoice->invoice_number;
        if (empty($invoiceNumber)) {
            $year = date('Y');
            $month = date('m');
            $lastInvoice = Invoice::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->whereNotNull('invoice_number')
                ->where('invoice_number', '!=', '')
                ->orderBy('id', 'desc')
                ->first();

            $sequence = $lastInvoice ? (intval(substr($lastInvoice->invoice_number, -4)) + 1) : 1;
            $invoiceNumber = sprintf('INV/%s/%s/%04d', $year, $month, $sequence);
        }

        $invoice->update([
            'invoice_number' => $invoiceNumber,
            'termin_step' => $invoice->termin_step ?: 1,
            'termin_text' => $invoice->termin_text ?: $terminText,
            'termin_persentase' => $invoice->termin_persentase ?: $persentase,
            'total_amount' => $invoice->total_amount > 0 ? $invoice->total_amount : $totalAmount,
            'status' => $invoice->status ?: 'pending',
        ]);

        return $invoice->fresh();
    }

    /**
     * Handle invoice request notification
     * CREATES RECORD with response info
     */
    private function handleInvoiceRequest($order)
    {
        $itemPekerjaan = $order->itemPekerjaans->first();
        if (!$itemPekerjaan) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        // Check if invoice already exists and has response
        $invoice = $itemPekerjaan->invoices()->orderBy('termin_step')->first();
        if ($invoice && $invoice->response_time) {
            $invoice = $this->ensureFirstInvoiceInitialized($itemPekerjaan, $invoice);
            return redirect()->route('invoice.show', $invoice->id)
                ->with('info', 'Menampilkan detail invoice untuk order ini.');
        }

        // Update response info if invoice exists, or create it
        if ($invoice) {
            $invoice->update([
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        } else {
            if (!$itemPekerjaan->rabKontrak) {
                return redirect()->route('invoice.index', ['order_id' => $order->id])
                    ->with('error', 'RAB Kontrak belum ada untuk order ini.');
            }
            $invoice = Invoice::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'rab_kontrak_id' => $itemPekerjaan->rabKontrak->id,
                'termin_step' => 1,
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'status' => 'pending',
            ]);
        }

        $invoice = $this->ensureFirstInvoiceInitialized($itemPekerjaan, $invoice);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'invoice')
            ->where(function ($q) {
                $q->where('is_marketing', false)->orWhereNull('is_marketing');
            })
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'status' => 'menunggu_input',
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'response_at' => now(),
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'status' => 'telat',
            ]);
        }

        if (!$taskResponse) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'invoice',
                'start_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => 6,
                'extend_time' => 0,
                'status' => 'menunggu_input',
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'response_at' => now(),
            ]);
        }

        // Redirect directly to Invoice Show page
        return redirect()->route('invoice.show', $invoice->id)
            ->with('success', 'Response recorded. Menampilkan detail Invoice untuk order ini.');
    }

    /**
     * Handle survey schedule request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleSurveyScheduleRequest($order)
    {
        // Check if already responded
        if ($order->survey_response_time) {
            return redirect()->route('survey-schedule.index', ['order_id' => $order->id])
                ->with('info', 'Menampilkan jadwal survey untuk project ini.');
        }

        // Update order with response info
        $order->update([
            'survey_response_time' => now(),
            'survey_response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_schedule')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Survey Schedule page focused on this order
        return redirect()->route('survey-schedule.index', ['order_id' => $order->id])
            ->with('success', 'Response recorded. Silakan jadwalkan survey untuk project ini.');
    }


    /**
     * Handle survey ulang request notification
     * CREATES RECORD with response info (like moodboard)
     */
    private function handleSurveyUlangRequest($order)
    {
        // Check if survey ulang already exists
        $surveyUlang = $order->surveyUlang;
        if ($surveyUlang) {
            if (!$surveyUlang->response_time) {
                $surveyUlang->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            }
        } else {
            $surveyUlang = SurveyUlang::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
            ]);
        }

        $order->update(['tahapan_proyek' => 'survey_ulang']);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_ulang')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Tambah 3 hari (total 8 hari)
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        if ($surveyUlang->survey_time) {
            return redirect()->route('survey-ulang.show', $surveyUlang->id)
                ->with('success', 'Menampilkan detail hasil survey ulang.');
        }

        // Redirect to create page to fill in details
        return redirect()->route('survey-ulang.create', $order->id)
            ->with('success', 'Response recorded. Silakan isi detail survey ulang.');
    }

    /**
     * Handle gambar kerja request notification
     * CREATES RECORD with response info
     */
    private function handleGambarKerjaRequest($order)
    {
        // Check if gambar kerja already exists
        if (!$order->gambarKerja) {
            return redirect()->route('gambar-kerja.index', ['order_id' => $order->id])
                ->with('error', 'Gambar Kerja belum dibuat. Silakan lengkapi survey ulang terlebih dahulu.');
        }

        // Check if already responded
        if ($order->gambarKerja->response_time) {
            return redirect()->route('gambar-kerja.index', ['order_id' => $order->id])
                ->with('info', 'Menampilkan detail Gambar Kerja untuk proyek ini.');
        }

        // Update existing gambar kerja with response info (tidak create baru)
        $order->gambarKerja->update([
            'response_time' => now(),
            'response_by' => auth()->user()->name,
            'status' => 'pending',
        ]);

        $order->update([
            'tahapan_proyek' => 'gambar_kerja',
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'gambar_kerja')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(8), // Tambah 3 hari (total 8 hari)
                'duration' => 8,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        // Redirect to Gambar Kerja page focused on this order
        return redirect()->route('gambar-kerja.index', ['order_id' => $order->id])
            ->with('success', 'Response berhasil. Silakan upload gambar kerja.');
    }

    /**
     * Handle meeting vendor request notification
     * CREATES RECORD with response info
     */
    private function handleMeetingVendorRequest($order)
    {
        $meeting = $order->meetingVendor;
        if ($meeting) {
            if (!$meeting->response_time) {
                $meeting->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                    'status' => 'waiting_input',
                ]);
            }
        } else {
            \App\Models\MeetingVendor::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
                'status' => 'waiting_input',
            ]);
        }

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'meeting_vendor')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('meeting-vendor.index', ['order_id' => $order->id])
            ->with('success', 'Response berhasil dicatat. Silakan buat jadwal meeting vendor.');
    }

    private function handleMeetingApprovalRequest($order)
    {
        return $this->handleMeetingVendorRequest($order);
    }

    /**
     * Handle approval material request notification
     * CREATES RECORD with response info
     */
    private function handleApprovalMaterialRequest($order)
    {
        // Redirect to Approval Material edit/detail page
        if (!$order->itemPekerjaans || $order->itemPekerjaans->isEmpty()) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Item pekerjaan belum ada untuk order ini. Silakan buat item pekerjaan terlebih dahulu.');
        }

        $itemPekerjaan = $order->itemPekerjaans->first();

        // Check if already responded
        if ($itemPekerjaan->approval_rab_response_by) {
            return redirect()->route('approval-material.edit', $itemPekerjaan->id)
                ->with('info', 'Menampilkan detail gambar kerja final.');
        }

        // Update response record
        $itemPekerjaan->update([
            'approval_rab_response_time' => now(),
            'approval_rab_response_by' => auth()->user()->name,
        ]);

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'approval_material')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6),
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('approval-material.edit', $itemPekerjaan->id)
            ->with('success', 'Response berhasil dicatat. Silakan kelola gambar kerja final.');
    }

    /**
     * Handle workplan request notification
     * Logic: If workplan not exist -> create new with response info
     *        If workplan exist -> update response_time & response_by only
     */
    private function handleWorkplanRequest($order)
    {
        if (!$order->moodboard) {
            return redirect()->route('order.show', $order->id)
                ->with('error', 'Moodboard belum ada untuk order ini.');
        }

        // Check if workplan exists and already responded
        $workplanItems = $order->moodboard
            ->itemPekerjaans
            ->flatMap(fn($ip) => $ip->produks)
            ->flatMap(fn($produk) => $produk->workplanItems);

        // If workplan already exists and responded -> go straight to workplan.create (detail/editor page)
        if ($workplanItems->isNotEmpty() && WorkplanItem::hasAnyResponded($workplanItems)) {
            return redirect()->route('workplan.create', $order->id)
                ->with('info', 'Menampilkan detail workplan untuk proyek ini.');
        }

        DB::transaction(function () use ($order, $workplanItems) {
            if ($workplanItems->isEmpty()) {
                // CREATE new workplan items with response tracking
                foreach ($order->moodboard->itemPekerjaans as $itemPekerjaan) {
                    foreach ($itemPekerjaan->produks as $produk) {
                        // Create empty workplan items based on default breakdown
                        $defaultBreakdown = WorkplanItemController::defaultBreakdown();
                        foreach ($defaultBreakdown as $index => $stage) {
                            WorkplanItem::create([
                                'item_pekerjaan_produk_id' => $produk->id,
                                'nama_tahapan' => $stage['nama_tahapan'],
                                'start_date' => null,
                                'end_date' => null,
                                'duration_days' => null,
                                'urutan' => $index + 1,
                                'status' => 'planned',
                                'catatan' => null,
                                'response_time' => now(),
                                'response_by' => auth()->user()->name ?? 'System',
                            ]);
                        }
                    }
                }
            } else {
                // UPDATE existing workplan items - only response_time & response_by
                foreach ($workplanItems as $item) {
                    $item->update([
                        'response_time' => now(),
                        'response_by' => auth()->user()->name ?? 'System',
                    ]);
                }
            }
        });

        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'workplan')
            ->orderByDesc('extend_time')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->where('is_marketing', false)
            ->first();

        if ($taskResponse && $taskResponse->status === 'menunggu_response') {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
                'deadline' => now()->addDays(6), // Standard 6 hari untuk workplan
                'duration' => 6,
                'duration_actual' => $taskResponse->duration_actual,
                'status' => 'menunggu_input',
            ]);
        } elseif ($taskResponse && $taskResponse->isOverdue()) {
            $taskResponse->update([
                'user_id' => auth()->user()->id,
                'response_time' => now(),
            ]);
        }

        return redirect()->route('workplan.create', $order->id)
            ->with('success', 'Permintaan workplan berhasil diterima. Silakan lengkapi detail workplan.');
    }

    /**
     * Handle project management request notification
     * DIRECT REDIRECT - No record creation
     */
    private function handleProjectManagementRequest($order)
    {
        // Redirect directly to Project Management show/detail page
        return redirect()->route('project-management.show', $order->id)
            ->with('info', 'Menampilkan detail Project Management untuk proyek ini.');
    }


}
