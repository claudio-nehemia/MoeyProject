<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Moodboard;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\CommitmentFee;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

class CommitmentFeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $moodboards = Moodboard::with('commitmentFee', 'order', 'estimasi')
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($moodboard) {
                return [
                    'id' => $moodboard->id,
                    'order_id' => $moodboard->order_id,
                    'status' => $moodboard->status,
                    'pm_response_by' => $moodboard->pm_response_by,
                    'pm_response_time' => $moodboard->pm_response_time,
                    'order' => $moodboard->order ? [
                        'id' => $moodboard->order->id,
                        'nama_project' => $moodboard->order->nama_project,
                        'company_name' => $moodboard->order->company_name,
                        'customer_name' => $moodboard->order->customer_name,
                        'alamat' => $moodboard->order->alamat,
                    ] : null,
                    'commitmentFee' => $moodboard->commitmentFee ? [
                        'id' => $moodboard->commitmentFee->id,
                        'total_fee' => $moodboard->commitmentFee->total_fee,
                        'payment_proof' => $moodboard->commitmentFee->payment_proof,
                        'payment_status' => $moodboard->commitmentFee->payment_status,
                        'response_by' => $moodboard->commitmentFee->response_by,
                        'response_time' => $moodboard->commitmentFee->response_time,
                        'pm_response_by' => $moodboard->commitmentFee->pm_response_by,
                        'pm_response_time' => $moodboard->commitmentFee->pm_response_time,
                    ] : null,
                    'moodboard_kasar' => $moodboard->moodboard_kasar,
                    'estimasi' => $moodboard->estimasi ? [
                        'id' => $moodboard->estimasi->id,
                        'estimated_cost' => $moodboard->estimasi->estimated_cost,
                    ] : null,
                ];
            });

        return Inertia::render('CommitmentFee/Index', [
            'moodboards' => $moodboards,
        ]);
    }

    public function responseFee(Request $request, $moodboardId)
    {
        try {
            Log::info('=== COMMITMENT FEE RESPONSE START ===');
            Log::info('Moodboard ID: ' . $moodboardId);

            $moodboard = Moodboard::findOrFail($moodboardId);
            $commitmentFee = CommitmentFee::where('moodboard_id', $moodboardId)->first();

            if ($moodboard->commitmentFee) {
                $commitmentFee->update([
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                ]);
            } else {
                $commitmentFee = CommitmentFee::create([
                    'moodboard_id' => $moodboard->id,
                    'response_by' => auth()->user()->name,
                    'response_time' => now(),
                    'payment_status' => 'pending',
                ]);
            }

            $moodboard->order->update([
                'tahapan_proyek' => 'cm_fee',
            ]);

            $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
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

            Log::info('Commitment Fee created with ID: ' . $commitmentFee->id);
            Log::info('=== COMMITMENT FEE RESPONSE END ===');

            return back()->with('success', 'Commitment Fee response berhasil dibuat.');
        } catch (\Exception $e) {
            Log::error('Response commitment fee error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal membuat response commitment fee: ' . $e->getMessage());
        }
    }

    public function updateFee(Request $request, $commitmentFeeId)
    {
        try {
            Log::info('=== UPDATE FEE START ===');
            Log::info('Commitment Fee ID: ' . $commitmentFeeId);

            $commitmentFee = CommitmentFee::findOrFail($commitmentFeeId);

            $validated = $request->validate([
                'total_fee' => 'required|numeric|min:0',
            ]);

            Log::info('Validation passed, total_fee: ' . $validated['total_fee']);

            $commitmentFee->update([
                'total_fee' => $validated['total_fee'],
            ]);

            Log::info('Commitment Fee updated');
            Log::info('=== UPDATE FEE END ===');

            return back()->with('success', 'Total fee berhasil disimpan.');
        } catch (\Exception $e) {
            Log::error('Update fee error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal update fee: ' . $e->getMessage());
        }
    }

    public function uploadPayment(Request $request, $commitmentFeeId)
    {
        try {
            Log::info('=== UPLOAD PAYMENT PROOF START ===');
            Log::info('Commitment Fee ID: ' . $commitmentFeeId);

            $commitmentFee = CommitmentFee::findOrFail($commitmentFeeId);

            $validated = $request->validate([
                'payment_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            if ($request->hasFile('payment_proof')) {
                // Delete old file if exists
                if ($commitmentFee->payment_proof && Storage::disk('public')->exists($commitmentFee->payment_proof)) {
                    Storage::disk('public')->delete($commitmentFee->payment_proof);
                    Log::info('Old file deleted');
                }

                $filePath = $request->file('payment_proof')->store('payment_proofs', 'public');
                Log::info('File stored at: ' . $filePath);

                $commitmentFee->update([
                    'payment_proof' => $filePath,
                    'payment_status' => 'completed',
                ]);

                $commitmentFee->moodboard->order->update([
                    'payment_status' => 'Commitment Fee',
                ]);

                // Send notification to designer for final design
                $notificationService = new NotificationService();
                $notificationService->sendFinalDesignRequestNotification($commitmentFee->moodboard->order);
            }

            $taskResponse = TaskResponse::where('order_id', $commitmentFee->moodboard->order->id)
                ->where('tahap', 'cm_fee')
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->where('is_marketing', false)
                ->first();

            if ($taskResponse) {
                if ($taskResponse->isOverdue()) {
                    $taskResponse->update([
                        'status' => 'telat_submit',
                        'update_data_time' => now(),
                    ]);
                } else {
                    $taskResponse->update([
                        'update_data_time' => now(),
                        'status' => 'selesai',
                    ]);
                }

                // Create task response untuk tahap selanjutnya (desain_final)
                $nextTaskExists = TaskResponse::where('order_id', $commitmentFee->moodboard->order->id)
                    ->where('tahap', 'desain_final')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $commitmentFee->moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'desain_final',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk desain final
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);

                    TaskResponse::create([
                        'order_id' => $commitmentFee->moodboard->order->id,
                        'user_id' => null,
                        'tahap' => 'desain_final',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Deadline untuk desain final
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }
            }

            Log::info('Payment proof uploaded, status: completed');
            Log::info('=== UPLOAD PAYMENT PROOF END ===');

            return back()->with('success', 'Bukti pembayaran berhasil diupload.');
        } catch (\Exception $e) {
            Log::error('Upload payment proof error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload bukti pembayaran: ' . $e->getMessage());
        }
    }

    public function resetFee(Request $request, CommitmentFee $commitmentFee)
    {
        try {
            \Log::info('=== RESET FEE START (MAYOR REVISION) ===');

            // 1. Hapus file payment_proof di storage jika ada
            if ($commitmentFee->payment_proof) {
                if (Storage::disk('public')->exists($commitmentFee->payment_proof)) {
                    Storage::disk('public')->delete($commitmentFee->payment_proof);
                    \Log::info('Old payment proof file deleted.');
                }
            }

            // 2. Reset data di database
            $commitmentFee->update([
                'total_fee' => null,          // Direset ke null
                'payment_proof' => null,      // Direset ke null
                'payment_status' => 'pending', // Kembalikan status ke pending
            ]);

            // 3. Opsional: Update status pembayaran di tabel Order
            if ($commitmentFee->moodboard && $commitmentFee->moodboard->order) {
                $commitmentFee->moodboard->order->update([
                    'payment_status' => null, // Kembali ke status sebelum CM Fee dibayar
                ]);
            }

            \Log::info('Commitment Fee successfully reset.');
            \Log::info('=== RESET FEE END ===');

            return back()->with('success', 'Commitment Fee berhasil direset dan siap untuk direvisi ulang.');

        } catch (\Exception $e) {
            \Log::error('Reset fee error: ' . $e->getMessage());
            return back()->with('error', 'Gagal mereset commitment fee: ' . $e->getMessage());
        }
    }

    /**
     * Revisi Total Fee untuk Commitment Fee yang belum dibayar.
     */
    public function reviseFee(Request $request, $commitmentFeeId)
    {
        try {
            Log::info('=== REVISE FEE START ===');
            Log::info('Commitment Fee ID: ' . $commitmentFeeId);

            $commitmentFee = CommitmentFee::findOrFail($commitmentFeeId);

            // 1. Cek Kondisi Revisi Kritis
            // Revisi hanya diizinkan jika status masih 'pending' dan payment_proof masih null.
            if (
                $commitmentFee->payment_status !== 'pending' ||
                $commitmentFee->payment_proof !== null
            ) {
                Log::warning('Revision denied for ID: ' . $commitmentFeeId . '. Status: ' . $commitmentFee->payment_status . ', Proof: ' . ($commitmentFee->payment_proof ? 'Exists' : 'Null'));
                return back()->with('error', 'Revisi Total Fee tidak diizinkan karena pembayaran telah dilakukan atau sedang dalam proses upload bukti pembayaran.');
            }

            // 2. Validasi Input
            $validated = $request->validate([
                'total_fee' => 'required|numeric|min:0',
            ]);

            Log::info('Validation passed, new total_fee: ' . $validated['total_fee']);

            // 3. Update Data
            $commitmentFee->update([
                'total_fee' => $validated['total_fee'],
                // Tidak perlu update response_time/response_by kecuali ada kebijakan khusus
            ]);

            Log::info('Commitment Fee successfully revised');
            Log::info('=== REVISE FEE END ===');

            return back()->with('success', 'Total Fee Commitment Fee berhasil direvisi.');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Commitment Fee not found: ' . $commitmentFeeId);
            return back()->with('error', 'Data Commitment Fee tidak ditemukan.');
        } catch (\Exception $e) {
            Log::error('Revise fee error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Terjadi kesalahan saat merevisi Total Fee: ' . $e->getMessage());
        }
    }

    public function print($id)
    {
        $fee = CommitmentFee::with('moodboard.order')->findOrFail($id);
        $order = $fee->moodboard->order;

        // Semua variabel untuk view
        $data = [
            'customerName' => $order->customer_name,
            'alamat' => $order->alamat ?? '-',
            'projectName' => $order->nama_project,

            'companyName' => "PT. Moey Living Indonesia",
            'companyAddress' => "Tangerang",
            'direkturName' => "Aniq Infanuddin",
            'jabatanDirektur' => "Direktur Utama",

            'nominal' => number_format($fee->total_fee, 0, ',', '.'),
            'today' => now()->format('d F Y'),

            'nomor_surat' => "SPC-" . now()->format('Ymd') . "-" . $fee->id,
            'nomor_invoice' => "INV-" . now()->format('Ymd') . "-" . $fee->id,
            'nomor_kwitansi' => "KW-" . now()->format('Ymd') . "-" . $fee->id,

            'nameBank' => "Mandiri",
            'norekBank' => "1550007495610",
            'atasNamaBank' => "PT. Moey Living Indonesia",

            'logoUrl' => public_path('kop-moey.jpeg'),
            'signatureUrl' => public_path('assets/signature.png'),
            'stampUrl' => public_path('assets/stamp.png'),
        ];

        $pdf = Pdf::loadView('pdf.commitment_fee', $data)
            ->setPaper('A4', 'portrait');

        return $pdf->stream('Commitment Fee - ' . $order->nama_project . '.pdf');
    }

    public function exportWord($id)
    {
        $fee = CommitmentFee::with('moodboard.order')->findOrFail($id);
        $order = $fee->moodboard->order;

        // Semua variabel untuk view
        $data = [
            'customerName' => $order->customer_name,
            'alamat' => $order->alamat ?? '-',
            'projectName' => $order->nama_project,

            'companyName' => "PT. Moey Living Indonesia",
            'companyAddress' => "Tangerang",
            'direkturName' => "Aniq Infanuddin",
            'jabatanDirektur' => "Direktur Utama",

            'nominal' => number_format($fee->total_fee, 0, ',', '.'),
            'today' => now()->format('d F Y'),

            'nomor_surat' => "SPC-" . now()->format('Ymd') . "-" . $fee->id,
            'nomor_invoice' => "INV-" . now()->format('Ymd') . "-" . $fee->id,
            'nomor_kwitansi' => "KW-" . now()->format('Ymd') . "-" . $fee->id,

            'nameBank' => "Mandiri",
            'norekBank' => "1550007495610",
            'atasNamaBank' => "PT. Moey Living Indonesia",
        ];

        $logoPath = public_path('kop-moey.jpeg');
        \PhpOffice\PhpWord\Settings::setOutputEscapingEnabled(true);
        $phpWord = $this->buildCommitmentFeeWord($data, $logoPath);

        $filename = 'Commitment-Fee-' . str_replace(' ', '-', $order->nama_project) . '.docx';
            $writer = IOFactory::createWriter($phpWord, 'Word2007');

        $tempPath = tempnam(sys_get_temp_dir(), 'commitment_fee_');
        $tempFile = $tempPath . '.docx';
        rename($tempPath, $tempFile);
        $writer->save($tempFile);

        if (ob_get_length()) {
            ob_end_clean();
        }

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }

    private function buildCommitmentFeeWord(array $data, string $logoPath): PhpWord
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Times New Roman');
        $phpWord->setDefaultFontSize(11);

        $section = $phpWord->addSection([
            'marginTop' => 720,
            'marginBottom' => 720,
            'marginLeft' => 1134,
            'marginRight' => 1134,
        ]);

        if (file_exists($logoPath)) {
            $header = $section->addHeader();
            $header->addImage($logoPath, [
                'width' => 460,
                'alignment' => Jc::CENTER,
            ]);
                }

        $this->addRightAlignedText($section, $data['companyAddress'] . ', ' . $data['today']);

        $section->addText('No: ' . $data['nomor_surat']);
        $section->addText('Hal: Pengajuan Commitment Fee Project Interior');
        $section->addTextBreak(1);

        $section->addText('Kepada Yth,');
        $section->addText($data['customerName'], ['bold' => true]);
        $section->addText('Di ' . $data['alamat']);

        $section->addText('Dengan hormat,');
        $section->addText(
            'Sehubungan dengan rencana pelaksanaan project interior ' . $data['projectName'] .
            ', kami mengajukan Commitment Fee sebesar Rp ' . $data['nominal'] . ',-.'
        );
        $section->addText(
            'Commitment Fee ini sebagai tanda keseriusan dan komitmen awal, serta akan diperhitungkan ' .
            'pada nilai kontrak setelah project disetujui.'
        );
        $section->addTextBreak(1);

        $section->addText('Pembayaran dapat dilakukan melalui rekening berikut:');
        $this->addKeyValueTable($section, [
            ['Bank', $data['nameBank']],
            ['No. Rekening', $data['norekBank']],
            ['Atas Nama', $data['atasNamaBank']],
        ]);
        $section->addTextBreak(1);

        $section->addText('Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.');

        $section->addText('Hormat Kami,');
        $section->addText($data['companyName'], ['bold' => true]);
        $section->addTextBreak(1);
        $section->addText($data['direkturName'], ['bold' => true]);
        $section->addText($data['jabatanDirektur']);

        $section->addPageBreak();

        $section->addText('INVOICE', ['bold' => true], ['alignment' => Jc::CENTER]);
        $this->addTwoColumnRow($section, 'No: ' . $data['nomor_invoice'], $data['companyAddress'] . ', ' . $data['today']);
        $section->addTextBreak(1);

        $this->addKeyValueTable($section, [
            ['Kepada', $data['customerName']],
            ['Di', $data['alamat']],
            ['Hal', 'Pembayaran Commitment Fee Interior'],
        ]);
        $section->addTextBreak(1);

        $invoiceTable = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '000000',
            'cellMargin' => 50,
        ]);
        $invoiceTable->addRow();
        $invoiceTable->addCell(6500)->addText('URAIAN', ['bold' => true]);
        $invoiceTable->addCell(2500)->addText('JUMLAH', ['bold' => true]);
        $invoiceTable->addRow();
        $invoiceTable->addCell(6500)->addText('Total Pembayaran Commitment Fee');
        $invoiceTable->addCell(2500)->addText('Rp. ' . $data['nominal']);

        $section->addTextBreak(1);
        $section->addText('Pembayaran melalui:', ['bold' => true]);
        $this->addKeyValueTable($section, [
            ['Bank', $data['nameBank']],
            ['No. Rekening', $data['norekBank']],
            ['Atas Nama', $data['atasNamaBank']],
        ]);

        $section->addTextBreak(2);
        $section->addText('Hormat Kami,');
        $section->addText($data['companyName'], ['bold' => true]);
        $section->addTextBreak(3);
        $section->addText($data['direkturName'], ['bold' => true]);
        $section->addText($data['jabatanDirektur']);

        $section->addPageBreak();

        $section->addText('KWITANSI', ['bold' => true], ['alignment' => Jc::CENTER]);
        $section->addText('No. ' . $data['nomor_kwitansi'], [], ['alignment' => Jc::CENTER]);
        $section->addTextBreak(1);

        $this->addKeyValueTable($section, [
            ['Sudah terima dari', $data['customerName']],
            ['Uang Sebesar', 'Rp ' . $data['nominal'] . ',-'],
            ['Untuk Pembayaran', 'Commitment Fee Desain Interior'],
        ]);

        $section->addTextBreak(1);
        $footerTable = $section->addTable([
            'cellMargin' => 50,
        ]);
        $footerTable->addRow();
        $leftCell = $footerTable->addCell(4000, [
            'borderSize' => 6,
            'borderColor' => '000000',
        ]);
        $leftCell->addText('Rp ' . $data['nominal'] . ',-', ['bold' => true], ['alignment' => Jc::CENTER]);
        $rightCell = $footerTable->addCell(5000);
        $rightCell->addText($data['companyAddress'] . ', ' . $data['today'], [], ['alignment' => Jc::CENTER]);
        $rightCell->addTextBreak(2);
        $rightCell->addText($data['direkturName'], ['bold' => true], ['alignment' => Jc::CENTER]);
        $rightCell->addText('Direktur Utama', [], ['alignment' => Jc::CENTER]);

        return $phpWord;
    }

    private function addKeyValueTable($section, array $rows): void
    {
        $table = $section->addTable([
            'cellMargin' => 50,
        ]);

        foreach ($rows as $row) {
            $table->addRow();
            $table->addCell(2000)->addText($row[0]);
            $table->addCell(200)->addText(':');
            $table->addCell(6500)->addText($row[1]);
        }
    }

    private function addRightAlignedText($section, string $text): void
    {
        $section->addText($text, [], ['alignment' => Jc::END]);
    }

    private function addTwoColumnRow($section, string $left, string $right): void
    {
        $table = $section->addTable([
            'cellMargin' => 50,
        ]);
        $table->addRow();
        $table->addCell(4500)->addText($left);
        $table->addCell(4500)->addText($right, [], ['alignment' => Jc::END]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CommitmentFee $commitmentFee)
    {
        $commitmentFee->delete();

        return back()->with('success', 'Commitment Fee deleted successfully.');
    }
}