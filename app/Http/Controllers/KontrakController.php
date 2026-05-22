<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Termin;
use App\Models\Kontrak;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\ItemPekerjaan;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

class KontrakController extends Controller
{
    private function getRomanMonth($month)
    {
        $romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return $romans[intval($month)];
    }

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
            ->orderBy('created_at', 'desc')

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
                        'id' => $itemPekerjaan->moodboard->order->id,
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
                        'signed_contract_path' => $itemPekerjaan->kontrak->signed_contract_path
                            ? Storage::url($itemPekerjaan->kontrak->signed_contract_path)
                            : null,
                        'signed_at' => $itemPekerjaan->kontrak->signed_at?->format('d M Y H:i'),
                        'response_time' => $itemPekerjaan->kontrak->response_time?->format('d M Y H:i'),
                        'response_by' => $itemPekerjaan->kontrak->response_by,
                        'pm_response_time' => $itemPekerjaan->kontrak->pm_response_time?->format('d M Y H:i'),
                        'pm_response_by' => $itemPekerjaan->kontrak->pm_response_by,
                        'termin' => $itemPekerjaan->kontrak->termin ? [
                            'id' => $itemPekerjaan->kontrak->termin->id,
                            'nama' => $itemPekerjaan->kontrak->termin->nama_tipe,
                            'tahapan' => $itemPekerjaan->kontrak->termin->tahapan ?? [],
                        ] : null,
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

        // Get existing kontrak (yang sudah dibuat di response())
        $kontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();

        if (!$kontrak) {
            return back()->withErrors(['error' => 'Kontrak belum di-response. Silakan response terlebih dahulu.']);
        }

        // Get harga_kontrak from RAB Kontrak grand total
        $itemPekerjaan = ItemPekerjaan::with('rabKontrak.rabKontrakProduks')->find($validated['item_pekerjaan_id']);
        if (!$itemPekerjaan->rabKontrak) {
            return back()->withErrors(['error' => 'RAB Kontrak belum ada untuk Item Pekerjaan ini.']);
        }

        $hargaKontrak = $itemPekerjaan->rabKontrak->rabKontrakProduks->sum('harga_akhir');

        // Set tanggal mulai dan tanggal selesai berdasarkan durasi kontrak
        $validated['harga_kontrak'] = $hargaKontrak;
        $validated['tanggal_mulai'] = now();
        $validated['tanggal_selesai'] = now()->addDays($validated['durasi_kontrak']);

        try {
            // UPDATE kontrak yang sudah ada (bukan create baru)
            $kontrak->update($validated);
            \Log::info('Kontrak Updated:', $kontrak->fresh()->toArray());

            // Update tahapan_proyek to 'kontrak'
            $itemPekerjaan->moodboard->order->update([
                'tahapan_proyek' => 'kontrak',
                'project_status' => 'deal',
            ]);

            return redirect()->route('kontrak.index')->with('success', 'Kontrak berhasil dilengkapi!');
        } catch (\Exception $e) {
            \Log::error('Kontrak Update Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Gagal melengkapi kontrak: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function response(Request $request)
    {
        $validated = $request->validate([
            'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
        ]);

        // Check if kontrak sudah ada
        $existingKontrak = Kontrak::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])->first();
        if ($existingKontrak) {
            $existingKontrak->update([
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);
        } else {
            Kontrak::create([
                'item_pekerjaan_id' => $validated['item_pekerjaan_id'],
                'response_time' => now(),
                'response_by' => auth()->user()->name,
            ]);

        }

        $itempekerjaan = ItemPekerjaan::with('moodboard.order')->find($validated['item_pekerjaan_id']);
        $order = $itempekerjaan->moodboard->order;
        $taskResponse = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'kontrak')
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

        return back()->with('success', 'Response kontrak berhasil.');
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

    public function print($kontrakId)
    {
        $kontrak = Kontrak::with([
            'itemPekerjaan.moodboard.order',
            'itemPekerjaan.moodboard.commitmentFee',
            'termin'
        ])->findOrFail($kontrakId);

        $itemPekerjaan = $kontrak->itemPekerjaan;
        $order = $itemPekerjaan->moodboard->order;
        $fee = $itemPekerjaan->moodboard->commitmentFee;

        // path kop surat
        $kopPath = public_path('kop-moey.jpeg');

        $contractData = [
            // ======================================
            // CUSTOMER / PROJECT DATA
            // ======================================
            'customer_name' => $order->customer_name,
            'alamat' => $order->alamat ?? '-',
            'project' => [
                'nama' => $order->nama_project,
            ],
            'company_name' => $order->company_name,

            // ======================================
            // KONTRAK DATA
            // ======================================
            'nominal_kontrak' => $kontrak->harga_kontrak,
            'tanggal' => now()->format('d F Y'),
            'nomor' => str_pad($kontrak->id, 3, '0', STR_PAD_LEFT) . '/MJA/PNW/' . $this->getRomanMonth(now()->format('m')) . '/' . now()->format('Y'),
            'nomor_kontrak' => str_pad($kontrak->id, 3, '0', STR_PAD_LEFT) . '/MJA/KTK/' . $this->getRomanMonth(now()->format('m')) . '/' . now()->format('Y'),
            'today' => now()->translatedFormat('d F Y'),
            'hari_ini' => now()->translatedFormat('l'),
            'tgl_angka' => now()->format('d-m-Y'),
            'tgl_terbilang' => terbilang((int)now()->format('d')),
            'bln_terbilang' => now()->translatedFormat('F'),
            'thn_terbilang' => terbilang((int)now()->format('Y')),
            'nominal_terbilang' => terbilang((int)$kontrak->harga_kontrak) . ' Rupiah',

            // ======================================
            // COMMITMENT FEE DATA
            // ======================================
            'nominal_fee' => $fee ? number_format($fee->total_fee, 0, ',', '.') : '0',
            'status_fee' => $fee ? ($fee->payment_status === 'completed' ? 'Paid' : 'Pending') : '-',
            'nomor_surat_fee' => $fee ? "SPC-" . now()->format('Ymd') . "-" . $fee->id : null,
            'nomor_invoice_fee' => $fee ? "INV-" . now()->format('Ymd') . "-" . $fee->id : null,
            'nomor_kwitansi_fee' => $fee ? "KW-" . now()->format('Ymd') . "-" . $fee->id : null,
        ];

        // company moey
        $companyName = "PT Moey Living Indonesia";
        $companyAddress = "Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang";
        $direkturName = "Aniq Irfanuddin Yusuf";
        $jabatanDirektur = "Direktur";
        $nameBank = "Mandiri";
        $norekBank = "1550007495610";
        $atasNamaBank = "PT. Moey Living Indonesia";

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', [
            'kontrak' => $kontrak,
            'contractData' => $contractData,
            'companyName' => $companyName,
            'companyAddress' => $companyAddress,
            'direkturName' => $direkturName,
            'jabatanDirektur' => $jabatanDirektur,
            'nameBank' => $nameBank,
            'norekBank' => $norekBank,
            'atasNamaBank' => $atasNamaBank,
            'kopPath' => file_exists($kopPath) ? $kopPath : null,
        ])->setPaper('A4', 'portrait');

        return $pdf->stream('Kontrak-' . $order->nama_project . '.pdf');
    }

    public function exportWord($kontrakId)
    {
        try {
            \PhpOffice\PhpWord\Settings::setOutputEscapingEnabled(true);
            $kontrak = Kontrak::with([
                'itemPekerjaan.moodboard.order',
                'itemPekerjaan.moodboard.commitmentFee',
                'termin'
            ])->findOrFail($kontrakId);

            $itemPekerjaan = $kontrak->itemPekerjaan;
            $order = $itemPekerjaan->moodboard->order;
            $fee = $itemPekerjaan->moodboard->commitmentFee;

            // ===== FIX #1: Sanitize project name untuk filename =====
            $projectName = preg_replace('/[^a-zA-Z0-9-_]/', '', 
                                       str_replace(' ', '-', $order->nama_project));
            $projectName = preg_replace('/-+/', '-', $projectName); // Remove double dashes
            $projectName = trim($projectName, '-');

            // ===== FIX #2: Gunakan JPG instead of PNG =====
            $kopPath = public_path('kop-moey.jpg');

            // ===== FIX #3: Ensure all contract data memiliki default values =====
            $nominalKontrak = (float)($kontrak->harga_kontrak ?? 0);
            $nominalTerbilang = terbilang((int)$nominalKontrak) ?? 'Nol';

            $contractData = [
                // ======================================
                // CUSTOMER / PROJECT DATA
                // ======================================
                'customer_name' => $this->sanitizeWordText($order->customer_name ?? ''),
                'alamat' => $this->sanitizeWordText($order->alamat ?? 'Alamat tidak tersedia'),
                'project' => [
                    'nama' => $this->sanitizeWordText($order->nama_project ?? 'Project Tanpa Nama'),
                ],
                'company_name' => $this->sanitizeWordText($order->company_name ?? 'PT. Unnamed'),

                // ======================================
                // KONTRAK DATA
                // ======================================
                'nominal_kontrak' => $nominalKontrak,
                'tanggal' => now()->format('d F Y'),
                'nomor' => str_pad($kontrak->id, 3, '0', STR_PAD_LEFT) . '/MJA/PNW/' . 
                           $this->getRomanMonth(now()->format('m')) . '/' . now()->format('Y'),
                'nomor_kontrak' => str_pad($kontrak->id, 3, '0', STR_PAD_LEFT) . '/MJA/KTK/' . 
                                   $this->getRomanMonth(now()->format('m')) . '/' . now()->format('Y'),
                'today' => now()->translatedFormat('d F Y'),
                'hari_ini' => now()->translatedFormat('l'),
                'tgl_angka' => now()->format('d-m-Y'),
                'tgl_terbilang' => terbilang((int)now()->format('d')) ?? '1',
                'bln_terbilang' => now()->translatedFormat('F'),
                'thn_terbilang' => terbilang((int)now()->format('Y')) ?? '2024',
                'nominal_terbilang' => $nominalTerbilang . ' Rupiah',

                // ======================================
                // COMMITMENT FEE DATA
                // ======================================
                'nominal_fee' => $fee ? number_format($fee->total_fee, 0, ',', '.') : '0',
                'status_fee' => $fee ? ($fee->payment_status === 'completed' ? 'Paid' : 'Pending') : '-',
                'nomor_surat_fee' => $fee ? "SPC-" . now()->format('Ymd') . "-" . $fee->id : 'N/A',
                'nomor_invoice_fee' => $fee ? "INV-" . now()->format('Ymd') . "-" . $fee->id : 'N/A',
                'nomor_kwitansi_fee' => $fee ? "KW-" . now()->format('Ymd') . "-" . $fee->id : 'N/A',
            ];

            // company moey
            $companyName = "PT Moey Living Indonesia";
            $companyAddress = "Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang";
            $direkturName = "Aniq Irfanuddin Yusuf";
            $jabatanDirektur = "Direktur";
            $nameBank = "Mandiri";
            $norekBank = "1550007495610";
            $atasNamaBank = "PT. Moey Living Indonesia";

            $phpWord = $this->buildContractWord(
                $kontrak,
                $contractData,
                $companyName,
                $companyAddress,
                $direkturName,
                $jabatanDirektur,
                $nameBank,
                $norekBank,
                $atasNamaBank,
                $kopPath
            );

            $filename = 'Kontrak-' . $projectName . '-' . date('YmdHis') . '.docx';
            $writer = IOFactory::createWriter($phpWord, 'Word2007');

            $tempFile = storage_path('app/temp-kontrak-' . uniqid() . '.docx');
            $writer->save($tempFile);

            \Log::info('Word export successful', [
                'kontrak_id' => $kontrakId,
                'filename' => $filename,
                'file_size' => filesize($tempFile),
            ]);

            if (ob_get_length()) {
                ob_end_clean();
            }

            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('Export Word Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'kontrakId' => $kontrakId
            ]);
            return back()->withErrors(['error' => 'Gagal membuat file Word: ' . $e->getMessage()]);
        }
    }

    private function buildContractWord(
        Kontrak $kontrak,
        array $contractData,
        string $companyName,
        string $companyAddress,
        string $direkturName,
        string $jabatanDirektur,
        string $nameBank,
        string $norekBank,
        string $atasNamaBank,
        string $logoPath
    ): PhpWord {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Times New Roman');
        $phpWord->setDefaultFontSize(11);

        $contractData = $this->sanitizeContractData($contractData);

        $section = $phpWord->addSection([
            'marginTop' => 720,
            'marginBottom' => 720,
            'marginLeft' => 1134,
            'marginRight' => 1134,
        ]);

        // ===== FIX #4: Better image handling =====
        if (file_exists($logoPath)) {
            try {
                $imageInfo = @getimagesize($logoPath);
                if ($imageInfo !== false) {
                    $header = $section->addHeader();
                    $header->addImage($logoPath, [
                        'width' => 460,
                        'alignment' => Jc::CENTER,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Could not add header image: ' . $e->getMessage());
            }
        }

        $this->addRightAlignedText($section, 'Tangerang, ' . ($contractData['tanggal'] ?? ''));

        $this->addKeyValueTable($section, [
            ['No', $contractData['nomor'] ?? ''],
            ['Lamp', '1 Berkas Perjanjian Kerjasama Project Interior ' . ($contractData['project']['nama'] ?? '')],
        ]);

        $section->addText('Kepada Yth,');
        $section->addText($contractData['customer_name'] ?? '', ['bold' => true]);
        $section->addText('Di ' . ($contractData['alamat'] ?? '-'));

        $section->addText('Dengan Hormat,');

        $textRun = $section->addTextRun();
        $textRun->addText('Bersama surat ini kami bermaksud memperkenalkan perusahaan kami ');
        $textRun->addText($companyName, ['bold' => true]);
        $textRun->addText(' yang beralamat di ');
        $textRun->addText('Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang', ['bold' => true]);
        $textRun->addText('.');

        $section->addText('Kami adalah perusahaan yang bergerak di bidang Interior dan telah bekerjasama dengan berbagai perusahaan ternama di Jakarta dan kota-kota besar lainnya di Indonesia.');

        $textRun = $section->addTextRun();
        $textRun->addText('Berdasarkan pertemuan yang sudah kita lakukan sebelumnya, ');
        $textRun->addText($contractData['customer_name'] ?? '', ['bold' => true]);
        $textRun->addText(' saat ini sedang membutukan jasa pembuatan interior untuk ;');

        $order = $kontrak->itemPekerjaan->moodboard->order;
        $jenisInterior = strtolower($order->jenisInterior?->nama_interior ?? '');
        $isRumah = str_contains($jenisInterior, 'rumah');
        $isHotel = str_contains($jenisInterior, 'hotel');
        $isKitchen = str_contains($jenisInterior, 'kitchen');
        $isApartemen = str_contains($jenisInterior, 'apartemen');
        $isResto = str_contains($jenisInterior, 'restauran');
        $isKantor = str_contains($jenisInterior, 'kantor');
        $isBooth = str_contains($jenisInterior, 'booth');
        $isOthers = !$isRumah && !$isApartemen && !$isKantor && !$isHotel && !$isResto && !$isBooth && !$isKitchen;

        $checkTable = $section->addTable(['cellMargin' => 50]);
        $checkTable->addRow();
        $checkTable->addCell(3000)->addText('(' . ($isRumah ? 'V' : ' ') . ') Rumah Tinggal');
        $checkTable->addCell(3000)->addText('(' . ($isHotel ? 'V' : ' ') . ') Hotel');
        $checkTable->addCell(3000)->addText('(' . ($isKitchen ? 'V' : ' ') . ') Kitchen Set');
        $checkTable->addRow();
        $checkTable->addCell(3000)->addText('(' . ($isApartemen ? 'V' : ' ') . ') Apartemen');
        $checkTable->addCell(3000)->addText('(' . ($isResto ? 'V' : ' ') . ') Restaurant/Cafe');
        $checkTable->addCell(3000)->addText('(' . ($isOthers ? 'V' : ' ') . ') Others');
        $checkTable->addRow();
        $checkTable->addCell(3000)->addText('(' . ($isKantor ? 'V' : ' ') . ') Kantor');
        $checkTable->addCell(3000)->addText('(' . ($isBooth ? 'V' : ' ') . ') Booth');
        $checkTable->addCell(3000)->addText('');

        $section->addTextBreak(1);
        $section->addText('Sehubungan dengan hal tersebut kami bermaksud mengajukan penawaran untuk menjadi kotraktor pembuatan interior dengan kualitas bahan terjamin, harga bersaing dan bergaransi.');
        $section->addText('Besar Harapan kami, penawaran ini dapat diwujudkan dalam bentuk kerjasama. Berikut kami lampirkan dokumen Perjanjian kerjasama, invoice dan kwitansi.');
        $section->addText('Demikian surat penawaran ini kami buat, atas perhatian dan kerjasama baiknya kami sampaikan ucapakan terimakasih.');

        $section->addTextBreak(1);
        $section->addText('Hormat Kami,');
        $section->addText($companyName, ['bold' => true]);
        $section->addTextBreak(1);
        $section->addText($direkturName, ['bold' => true]);
        $section->addText($jabatanDirektur);

        $section->addPageBreak();

        $this->addCenteredText($section, 'PERJANJIAN KERJASAMA (PKS)', ['bold' => true, 'size' => 13]);
        $this->addCenteredText($section, strtoupper($companyName), ['bold' => true, 'size' => 13]);
        $this->addCenteredText($section, 'Nomor : ' . ($contractData['nomor_kontrak'] ?? ''), []);
        $section->addTextBreak(1);

        $textRun = $section->addTextRun();
        $textRun->addText('Perjanjian Kerjasama (selanjutnya disebut Perjanjian) ini dibuat dan ditandatangani pada hari ini ');
        $textRun->addText($contractData['hari_ini'] ?? '', ['bold' => true]);
        $textRun->addText(', tanggal ');
        $textRun->addText('(' . ($contractData['tgl_angka'] ?? '') . ' (Tanggal ' . ($contractData['tgl_terbilang'] ?? '') . ', Bulan ' . ($contractData['bln_terbilang'] ?? '') . ', Tahun ' . ($contractData['thn_terbilang'] ?? '') . '))', ['bold' => true]);
        $textRun->addText(', kami yang bertanda tangan dibawah ini :');

        $partyTable = $section->addTable(['cellMargin' => 50]);
        $partyTable->addRow();
        $partyTable->addCell(1500)->addText('1. Nama');
        $partyTable->addCell(200)->addText(':');
        $partyTable->addCell(6500)->addText($direkturName, ['bold' => true]);
        $partyTable->addRow();
        $partyTable->addCell(1500)->addText('   Jabatan');
        $partyTable->addCell(200)->addText(':');
        $partyTable->addCell(6500)->addText('Direktur ' . $companyName);
        $partyTable->addRow();
        $partyTable->addCell(1500)->addText('   Alamat');
        $partyTable->addCell(200)->addText(':');
        $partyTable->addCell(6500)->addText('Ruko Arcadia Blok B 6, Jl Kelapa Lilin Utara II No 6, Kelapa Dua-Tangerang.');

        $section->addText('Dalam hal ini bertindak untuk dan atas nama ' . $companyName . ', Perseroan Terbatas yang didirikan menurut Hukum Indonesia, selanjutnya disebut sebagai PIHAK PERTAMA :');

        $partyTable = $section->addTable(['cellMargin' => 50]);
        $partyTable->addRow();
        $partyTable->addCell(1500)->addText('2. Nama');
        $partyTable->addCell(200)->addText(':');
        $partyTable->addCell(6500)->addText($contractData['customer_name'] ?? '', ['bold' => true]);
        if (!empty($contractData['nik'])) {
            $partyTable->addRow();
            $partyTable->addCell(1500)->addText('   NIK');
            $partyTable->addCell(200)->addText(':');
            $partyTable->addCell(6500)->addText($contractData['nik']);
        }
        $partyTable->addRow();
        $partyTable->addCell(1500)->addText('   Alamat');
        $partyTable->addCell(200)->addText(':');
        $partyTable->addCell(6500)->addText($contractData['alamat'] ?? '-');

        $section->addText('Dalam hal ini bertindak untuk dan atas nama sendiri, selanjutnya dalam perjanjian ini disebut sebagai PIHAK KEDUA.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 1', 'RUANG LINGKUP KERJASAMA');
        $section->addText('1. PIHAK PERTAMA melaksanakan pekerjaan atas dasar dokumen kontrak yang terdiri dari dokumen dokumen sebagai berikut :');
        $section->addText('   1.1. Surat Perjanjian Kontrak & Penawaran beserta lampirannya.');
        $section->addText('   1.2. Spesifikasi yang dicantumkan di penawaran.');
        $section->addText('   1.3. Gambar kerja');
        $section->addText('2. PIHAK KEDUA memberikan pekerjaan Pelaksanaan Jasa Interior.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 2', 'PELAKSANAAN PEKERJAAN');
        $section->addText('Untuk melaksanakan pekerjaan tersebut dalam Pasal 2 kontrak ini, PIHAK PERTAMA :');
        $section->addText('1. Wajib menyediakan tenaga kerja yang cukup serta mempunyai keahlian sesuai dengan bidangnya.');
        $section->addText('2. Tidak dibenarkan menyimpan material di area di luar lingkup kerja.');
        $section->addText('3. Tidak dibenarkan meninggalkan sampah di area kerja ketika pekerjaan selesai.');
        $section->addText('4. PARA PIHAK melakukan komunikasi ketika project berjalan hanya melalui WhatApp Group Project, komunikasi selain di WhatApp Grup tersebut dianggap tidak berlaku.');
        $section->addText('5. PIHAK KEDUA tidak bisa mengajukan keluhan atas segala bentuk pekerjaan yang sudah sesuai dengan Gambar kerja yang sudah disepakati PARA PIHAK.');
        $section->addText('6. PIHAK PERTAMA tidak diperkenankan meninggalkan barang-barang yang tidak ada kaitannya dengan pelaksanaan pekerjaan interior.');
        $section->addText('7. PIHAK PERTAMA tidak bertanggung jawab atas hilang atau rusaknya barang-barang dilokasi tempat pekerjaan, kecuali ada surat tanda terima yang disepakati PARA PIHAK.');
        $section->addText('8. Apabila dalam pelaksanaan pekerjaan interior melakukan kesalahan untuk area atau barang-barang yang tidak bisa terprediksi atau terlihat, maka biaya itu akan ditanggung oleh PARA PIHAK.');
        $section->addText('9. Pekerjaan diluar kontrak atau jenis penawaran sifatnya adalah bantuan dari PIHAK PERTAMA.');
        $section->addText('10. Batas Toleransi Pembuatan interior adalah 5 cm, untuk mengantisipasi kemiringan dinding dan lantai lokasi project, toleransi tersebut tidak mempengaruhi biaya pembuatan interior.');
        $section->addText('11. Contoh atau katalog material diluar yang kami berikan, akan dikenakan biaya sesuai dengan biaya material yang diminta.');
        $section->addText('12. Perubahan Material Finishing yang sudah kami rekomendasikan di Form Approval, akan dikenakan biaya dan dengan pembayaran secara tunai.');
        $section->addText('13. Segala biaya Fitout atau ijin lokasi proyek yang membutuhkan biaya di bebankan kepada PIHAK KEDUA dan untuk pembuatan ataupun koordinasi dokumen akan dibantu oleh PIHAK PERTAMA.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 3', 'HAK DAN KEWAJIBAN');
        $section->addText('HAK DAN KEWAJIBAN PIHAK PERTAMA', ['bold' => true]);
        $section->addText('1. Apabila batas waktu penyelesaian pekerjaan (penyerahan pertama) sebagaimana yang telah ditentukan tidak dapat dipenuhi maka, PIHAK PERTAMA harus segera melaporkan pada PIHAK KEDUA sebab-sebab keterlambatan penyelesaian pekerjaan terebut dan PIHAK PERTAMA akan mengajuan perpanjangan masa kontrak.');
        $section->addText('2. Atas keterlambatan, PIHAK PERTAMA dikenakan denda maksimal 3% dari nilai kontrak setelah mencapai 45 (Empat puluh lima) hari keterlambatan.');
        $section->addText('3. PIHAK PERTAMA berhak mendapat kenyamanan dilokasi kerja yang berkaitan dengan lingkungan atau perizinan dilingkunangan.');
        $section->addText('4. PIHAK PERTAMA berhak mengganti material sesuai atau setara dengan material yang sudah disetujui, jika material tersebut sudah discontinue atau sulit ditemukan dipasaran atau berlaku pekerjaan kurang dan wajib diterima PIHAK KEDUA.');
        $section->addTextBreak(1);
        $section->addText('HAK DAN KEWAJIBAN PIHAK KEDUA', ['bold' => true]);
        $section->addText('1. PIHAK KEDUA bertanggung jawab atas lingkungan yang kondusif atau yang berkaitan dengan izin lingkungan.');
        $section->addText('2. Jika PIHAK KEDUA dalam melakukan pembayaran terjadi keterlambatan, akan dikenakan denda sebesar maksimal 3% (tiga persen) dari kontrak yang harus dibayarkan setelah mencapai 45 (Empat puluh lima) hari keterlambatan.');
        $section->addText('3. PIHAK KEDUA berhak mendapatkan garansi aksesoris selama 1 (satu) tahun sejak berita acara serah terima ditanda tangani.');
        $section->addText('4. PIHAK KEDUA berhak mengajukan keluhan apabila pekerjaan yang dilaksanakan PIHAK PERTAMA tidak sesuai design dan gambar kerja.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 4', 'JANGKA WAKTU PELAKSANAAN');
        $section->addText('1. Pelaksanaan pada Pasal 2 diatas dimulai setelah Surat Perjanjian ini ditandatangani oleh kedua belah pihak, Gambar kerja & Persetujuan Material sudah disetujui oleh PIHAK KEDUA dan area kerja dinyatakan sudah siap oleh PARA PIHAK.');
        $section->addText('2. Terhitung pelaksanaan pekerjaan dimulai H+7, setelah Gambar kerja & tanda tangan approval material oleh PIHAK KEDUA.');
        $section->addText('3. Pelaksanaan pekerjaan, harus sudah selesai 100% paling lambat 90 (Sembilah Puluh Hari Kerja) setelah pekerjaan dimulai ( sesuai poin pertama ).');
        $section->addText('4. Waktu penyelesaian tersebut tidak dapat dirubah oleh PIHAK KEDUA kecuali dalam keadaan memaksa.');
        $section->addText('5. Masa kontrak adalah diluar penyelesaian keluhan/complaint, pekerjaan free dan pekerjaan tambah.');
        $section->addText('6. Masa kontrak berjalan berjalan normal sesuai dengan pasal 4 point 2 apabila :');
        $section->addText('   a. Sudah ada pembayaran Down payment (DP).');
        $section->addText('   b. Gambar kerja sudah di setujui oleh PARA PIHAK melalui grup WhastApp.');
        $section->addText('   c. Pembayaran dilakukan maksimal 3 (hari) hari sejak invoice diterbitkan.');
        $section->addText('   d. Tidak ada perubahan design, dimensi, spesifikasi dan lain lain yang tercantum di dalam gambar kerja yang telah disetujui.');
        $section->addText('   e. Tidak ada pekerjaan pihak lain yang menghambat proses instalasi dilapangan.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 5', 'SPESIFIKASI MATERIAL UMUM');
        $section->addText('1. Standar Material Finishing ;');
        $section->addText('   a. Finishing Luar HPL, PVC, Cat Duco dan melamin.');
        $section->addText('   b. Finishing dalam untuk kabinet menggunakan melamin putih. Selain melamin putih akan disesuaikan dengan dokumen penawaran.');
        $section->addText('2. Dimensi Material Finishing ;');
        $section->addText('   a. Ukuran dimensi 240 cm x 120 cm, selain ukuran dimensi 240 cm x 120 cm, menggunakan sambungan material.');
        $section->addText('   b. Finishing pinggiran panel, pintu, pintu kabinet menggunakan PVC edging dengan maximal lebar 4 cm, jika melebihi ukuran tersebut, maka menggunakan HPL.');
        $section->addText('3. Pembuatan panel dinding menggunakan material multiplek 9 mm dengan rangka 18 mm dengan material Finishing HPL Maksimal ketinggian 2,4 meter. Selain ukuran tersebut menggunakan sambungan Finishing HPL.');
        $section->addText('4. Pembuatan kabinet menggunakan material kombinasi ukuran sesuai dengan fungsi dan kebutuhan, mulai dari 18 mm, 15 mm, 12 mm, 9 mm, 6 mm dan 3 mm.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 6', 'NILAI KONTRAK DAN PERUBAHAN NILAI KONTRAK');
        $section->addText('1. Nilai kontrak adalah sebesar Rp. ' . number_format($contractData['nominal_kontrak'] ?? 0, 0, ',', '.') . ',- (' . ($contractData['nominal_terbilang'] ?? 'Nol Rupiah') . '). Harga tidak termasuk PPN.');
        $section->addText('2. Apabila ada perubahan nilai kontrak karena ada pengurangan atau penambahan item pekerjaan yang tercantum di penawaran atau berdasarkan negosiasi harga, maka perwakilan dari PIHAK PERTAMA (Direktur atau Marketing) cukup tanda tangan di perubahan yang dimaksud & dinyatakan sah berlaku.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 7', 'CARA PEMBAYARAN');
        $section->addText('Pembayaran dilaksanakan sesuai termin pembayaran dan sesuai dengan prestasi pekerjaan yang telah disepakati dalam proses terhadap kontrak dengan ketentuan sebagai berikut :');
        
        // ===== FIX #5: Better handling for empty termin tahapan =====
        if ($kontrak->termin && $kontrak->termin->tahapan && count($kontrak->termin->tahapan) > 0) {
            foreach ($kontrak->termin->tahapan as $idx => $tahap) {
                $persentase = (int)($tahap['persentase'] ?? 0);
                $text = trim($tahap['text'] ?? '');
                
                if ($persentase > 0) {
                    $tahapText = !empty($text) ? ' (' . $text . ')' : '';
                    $section->addText(($idx + 1) . '. Pembayaran ke-' . ($idx + 1) . ' sebesar ' . $persentase . '% dari nilai kontrak' . $tahapText . '.');
                }
            }
        } else {
            $section->addText('1. Pembayaran I (Pertama) sebesar 50% dari nilai kontrak yang berlaku sebagai Down Payment.');
            $section->addText('2. Pembayaran II (Kedua) sebesar 40% dari nilai kontrak, dibayarkan paling lambat 3 (tiga) hari setelah pengiriman barang.');
            $section->addText('3. Pembayaran III (Ketiga) sebesar 10 % dari nilai kontrak yang akan dibayarkan paling lambat 3 (tiga) hari setelah serah terima.');
        }
        $section->addText('4. Jika ada penambahan pekerjaan/adendum, maka pembayaran nilai pekerjaan tambah dibayarkan lunas (tanpa termin pembayaran), sebelum pekerjaan tambah dimulai.');
        $section->addText('5. Segala bentuk pembayaran yang dilakukan diluar rekening yang tercantum di invoice, PIHAK PERTAMA tidak bertanggung jawab.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 8', 'PENYERAHAN PEKERJAAN');
        $section->addText('1. Setelah seluruh pekerjaan diselesaikan, PIHAK PERTAMA dapat meminta secara tertulis untuk melaksanakan Penyerahan Pekerjaan');
        $section->addText('2. PIHAK KEDUA, berdasarkan Berita Acara Pemeriksaan Penyelesaian Pekerjaan wajib menyetujui/tanda tangan Berita Acara penyerahan pekerjaan.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 9', 'KEADAAN MEMAKSA');
        $section->addText('1. Bila dalam waktu pelaksanaan pekerjaan terjadi keadaan memaksa maka PIHAK PERTAMA dapat mengajukan permohonan perpanjangan waktu penyelesaian pekerjaan seperti yang telah ditetapkan dan dianggap berlaku.');
        $section->addText('2. Apabila PIHAK KEDUA mengajukan perubahan design, dimensi, spesifikasi dan lain lain atau penambahan pekerjaan di tengah kontrak ini berlangsung, maka jadwal penyelesaian di kontrak ini dianggap batal dan akan disepakati jadwal baru yang ditanda tangani PARA PIHAK.');
        $section->addText('3. Apabali tidak ada kesepakatan dalam masa kontrak, maka masa kontrak dengan tanpa persetujuan, menambah 1x (satu) kali Masa kontrak sesuai dengan masa kontrak yang telah di sepakati.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 10', 'PENYELESAIAN SENGKETA');
        $section->addText('1. Bila terjadi sengketa antara kedua belah pihak diutamakan penyelesaiannya secara musyawarah.');
        $section->addText('2. Jika musyawarah tidak ada penyelesaian maka semua sengketa yang timbul dari perjanjian ini, akan diselesaikan oleh kedua belah pihak yang mewakili tempat kedudukan hukum yang sah dan tidak berubah di Kantor Pegadilan Negeri di Kota Tangerang.');
        $section->addTextBreak(1);

        $this->addArticleTitle($section, 'Pasal 11', 'PENUTUP');
        $section->addText('Demikian Surat Perjanjian pelaksanaan pekerjaan ini dibuat dan ditandatangani oleh kedua belah pihak pada hari, tanggal, bulan dan tahun tersebut diatas.');
        $section->addText('Demikian perjanjian ini dibuat dalam rangkap 2 (dua), masing-masing bermeterai cukup dan mempunyai kekuatan hukum yang sama.');

        $signatureTable = $section->addTable(['cellMargin' => 50]);
        $signatureTable->addRow();
        $leftSig = $signatureTable->addCell(4500);
        $leftSig->addText('PIHAK PERTAMA', ['bold' => true], ['alignment' => Jc::CENTER]);
        $leftSig->addTextBreak(2);
        $leftSig->addText($direkturName, ['bold' => true], ['alignment' => Jc::CENTER]);
        $leftSig->addText($jabatanDirektur, [], ['alignment' => Jc::CENTER]);

        $rightSig = $signatureTable->addCell(4500);
        $rightSig->addText('PIHAK KEDUA', ['bold' => true], ['alignment' => Jc::CENTER]);
        $rightSig->addTextBreak(2);
        $rightSig->addText($contractData['customer_name'] ?? '', ['bold' => true], ['alignment' => Jc::CENTER]);

        $section->addPageBreak();

        $dpPersentase = 50;
        $dpText = 'DP 50%';
        if ($kontrak->termin && $kontrak->termin->tahapan && count($kontrak->termin->tahapan) > 0) {
            $dpPersentase = $kontrak->termin->tahapan[0]['persentase'] ?? 50;
            $dpText = $kontrak->termin->tahapan[0]['text'] ?? ('DP ' . $dpPersentase . '%');
        }

        $nominalKontrak = (float) ($contractData['nominal_kontrak'] ?? 0);
        $dpNominal = $nominalKontrak * ($dpPersentase / 100);
        $dpTerbilangValue = terbilang((int)$dpNominal);
        $totalTerbilangValue = terbilang((int)$nominalKontrak);

        $this->addRightAlignedText($section, 'Tangerang, ' . ($contractData['tanggal'] ?? ''));
        $section->addTextBreak(1);

        $this->addKeyValueTable($section, [
            ['Nomor', $contractData['nomor_surat_fee'] ?? ''],
            ['Hal', 'Pengajuan ' . $dpText],
        ]);
        $section->addTextBreak(1);

        $section->addText('Kepada Yth,');
        $section->addText($contractData['customer_name'] ?? '', ['bold' => true]);
        $section->addText('Di ' . ($contractData['alamat'] ?? '-'));
        $section->addTextBreak(1);

        $section->addText('Dengan Hormat,');

        $textRun = $section->addTextRun();
        $textRun->addText('Sehubungan dengan rencana Kerjasama Pelaksanaan Project Interior ');
        $textRun->addText($contractData['project']['nama'] ?? '', ['bold' => true]);
        $textRun->addText(', bersama ini Kami bermaksud mengajukan permohonan pembayaran ' . $dpText . ' sebesar ');
        $textRun->addText('Rp. ' . number_format($dpNominal, 0, ',', '.') . ',-', ['bold' => true]);
        $textRun->addText(' (' . $dpTerbilangValue . ') dari jumlah harga yang disetujui yaitu ');
        $textRun->addText('Rp. ' . number_format($nominalKontrak, 0, ',', '.') . ',-', ['bold' => true]);
        $textRun->addText(' (' . $totalTerbilangValue . ').');

        $section->addText('Berikut ini Kami lampirkan Kwitansi, Quotation, Invoice dan Kelengkapan Administrasi.');
        $section->addText('Demikian Kami sampaikan, atas perhatian dan kerjasama ' . ($contractData['customer_name'] ?? '') . ', Kami ucapkan terima kasih.');

        $section->addTextBreak(2);
        $section->addText('Hormat Kami,');
        $section->addText($companyName, ['bold' => true]);
        $section->addTextBreak(3);
        $section->addText($direkturName, ['bold' => true]);
        $section->addText($jabatanDirektur);

        $section->addPageBreak();

        $this->addCenteredText($section, 'INVOICE', ['bold' => true, 'underline' => 'single']);
        $section->addText('No. ' . ($contractData['nomor_invoice_fee'] ?? ''));
        $section->addTextBreak(1);

        $this->addKeyValueTable($section, [
            ['Kepada', $contractData['customer_name'] ?? ''],
            ['Hal', 'Pelaksanaan Project Interior ' . ($contractData['project']['nama'] ?? '')],
        ]);
        $section->addTextBreak(1);

        $section->addText('Pembayaran ditransfer melalui rekening :');
        $this->addKeyValueTable($section, [
            ['Bank', strtoupper($nameBank)],
            ['No Rekening', $norekBank],
            ['Atas Nama', strtoupper($atasNamaBank)],
        ]);

        $section->addTextBreak(2);
        $section->addText('Hormat Kami,');
        $section->addText($companyName, ['bold' => true]);
        $section->addTextBreak(3);
        $section->addText($direkturName, ['bold' => true]);
        $section->addText($jabatanDirektur);

        $section->addPageBreak();

        $this->addCenteredText($section, 'KWITANSI', ['bold' => true, 'underline' => 'single']);
        $this->addCenteredText($section, 'No. ' . ($contractData['nomor_kwitansi_fee'] ?? ''));
        $section->addTextBreak(1);

        $this->addKeyValueTable($section, [
            ['Sudah terima dari', $contractData['customer_name'] ?? ''],
            ['Uang Sebesar', 'Rp ' . number_format($dpNominal, 0, ',', '.') . ',-'],
            ['Untuk Pembayaran', $dpText . ' untuk Pelaksanaan Project Interior ' . ($contractData['project']['nama'] ?? '')],
        ]);

        $section->addTextBreak(1);
        $kwitansiTable = $section->addTable(['cellMargin' => 50]);
        $kwitansiTable->addRow();
        $amountCell = $kwitansiTable->addCell(4000, [
            'borderSize' => 6,
            'borderColor' => '000000',
        ]);
        $amountCell->addText('Rp ' . number_format($dpNominal, 0, ',', '.') . ',-', ['bold' => true], ['alignment' => Jc::CENTER]);
        $signCell = $kwitansiTable->addCell(5000);
        $signCell->addText('Tangerang, ' . ($contractData['today'] ?? $contractData['tanggal'] ?? ''), [], ['alignment' => Jc::CENTER]);
        $signCell->addTextBreak(2);
        $signCell->addText($direkturName, ['bold' => true], ['alignment' => Jc::CENTER]);
        $signCell->addText('Direktur', [], ['alignment' => Jc::CENTER]);

        return $phpWord;
    }

    private function addKeyValueTable($section, array $rows): void
    {
        $table = $section->addTable([
            'cellMargin' => 50,
        ]);

        foreach ($rows as $row) {
            $table->addRow();
            $table->addCell(2000)->addText($this->sanitizeWordText($row[0] ?? ''));
            $table->addCell(200)->addText(':');
            $table->addCell(6500)->addText($this->sanitizeWordText($row[1] ?? ''));
        }
    }

    private function addRightAlignedText($section, string $text): void
    {
        $section->addText($this->sanitizeWordText($text), [], ['alignment' => Jc::END]);
    }

    private function addCenteredText($section, string $text, array $fontStyle = []): void
    {
        $section->addText($this->sanitizeWordText($text), $fontStyle, ['alignment' => Jc::CENTER]);
    }

    private function addArticleTitle($section, string $title, string $subtitle): void
    {
        $section->addText($this->sanitizeWordText($title), ['bold' => true, 'underline' => 'single'], ['alignment' => Jc::CENTER]);
        $section->addText($this->sanitizeWordText($subtitle), ['bold' => true, 'underline' => 'single'], ['alignment' => Jc::CENTER]);
        $section->addTextBreak(1);
    }

    private function sanitizeContractData(array $contractData): array
    {
        $stringKeys = [
            'customer_name',
            'alamat',
            'company_name',
            'tanggal',
            'nomor',
            'nomor_kontrak',
            'today',
            'hari_ini',
            'tgl_angka',
            'tgl_terbilang',
            'bln_terbilang',
            'thn_terbilang',
            'nominal_terbilang',
            'nomor_surat_fee',
            'nomor_invoice_fee',
            'nomor_kwitansi_fee',
            'nik',
        ];

        foreach ($stringKeys as $key) {
            if (array_key_exists($key, $contractData)) {
                $contractData[$key] = $this->sanitizeWordText($contractData[$key]);
            }
        }

        if (isset($contractData['project']['nama'])) {
            $contractData['project']['nama'] = $this->sanitizeWordText($contractData['project']['nama']);
        }

        return $contractData;
    }

    private function sanitizeWordText($text): string
    {
        if (empty($text)) {
            return '';
        }

        $text = (string) $text;

        // Detect encoding and convert to UTF-8
        $currentEncoding = mb_detect_encoding($text, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($currentEncoding !== 'UTF-8') {
            $text = mb_convert_encoding($text, 'UTF-8', $currentEncoding);
        }

        // Replace problematic characters
        $replacements = [
            '‘' => "'",      // Curly single quote
            '’' => "'",      // Curly single quote
            '“' => '"',      // Curly double quote
            '”' => '"',      // Curly double quote
            '–' => '-',      // En dash
            '—' => '-',      // Em dash
            '…' => '...',    // Ellipsis
            "\u{00A0}" => ' ', // Non-breaking space
        ];

        foreach ($replacements as $find => $replace) {
            $text = str_replace($find, $replace, $text);
        }

        // Remove control characters except basic whitespace
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);

        // Normalize whitespace
        $text = str_replace(["\r\n", "\r", "\n", "\t"], ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }

    /**
     * Upload signed contract PDF.
     */
    public function uploadSignedContract(Request $request, $kontrakId)
    {
        $kontrak = Kontrak::with('itemPekerjaan.moodboard.order')->findOrFail($kontrakId);

        $request->validate([
            'signed_contract' => 'required|file|mimes:pdf|max:10240', // Max 10MB
        ], [
            'signed_contract.required' => 'File kontrak harus diupload.',
            'signed_contract.mimes' => 'File harus berformat PDF.',
            'signed_contract.max' => 'Ukuran file maksimal 10MB.',
        ]);

        // Delete old signed contract if exists
        if ($kontrak->signed_contract_path) {
            Storage::disk('public')->delete($kontrak->signed_contract_path);
        }

        // Store the new signed contract
        $projectName = str_replace(' ', '_', $kontrak->itemPekerjaan->moodboard->order->nama_project);
        $filename = 'Kontrak_TTD_' . $projectName . '_' . now()->format('YmdHis') . '.pdf';
        $path = $request->file('signed_contract')->storeAs('signed-contracts', $filename, 'public');

        $kontrak->update([
            'signed_contract_path' => $path,
            'signed_at' => now(),
        ]);

        $moodboard = $kontrak->itemPekerjaan->moodboard;

        $taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
            ->where('tahap', 'kontrak')
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

            // Create task response untuk tahap selanjutnya (cm_fee)
            $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
                ->where('tahap', 'invoice')
                ->exists();

            if (!$nextTaskExists) {
                TaskResponse::create([
                    'order_id' => $moodboard->order->id,
                    'user_id' => null,
                    'tahap' => 'invoice',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                ]);

                TaskResponse::create([
                    'order_id' => $moodboard->order->id,
                    'user_id' => null,
                    'tahap' => 'invoice',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk cm_fee
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                    'is_marketing' => true,
                ]);
            }
        }

        $notificationService = new NotificationService();
        $notificationService->sendInvoiceRequestNotification($kontrak->itemPekerjaan->moodboard->order);

        // Update project_status to 'deal' when signed contract is uploaded
        $order = $kontrak->itemPekerjaan->moodboard->order;
        if ($order->project_status !== 'deal') {
            $order->update(['project_status' => 'deal']);
        }

        return back()->with('success', 'Kontrak yang sudah ditandatangani berhasil diupload!');
    }

    /**
     * Download signed contract PDF.
     */
    public function downloadSignedContract($kontrakId)
    {
        $kontrak = Kontrak::with('itemPekerjaan.moodboard.order')->findOrFail($kontrakId);

        if (!$kontrak->signed_contract_path) {
            return back()->with('error', 'Kontrak yang sudah ditandatangani belum diupload.');
        }

        $projectName = $kontrak->itemPekerjaan->moodboard->order->nama_project;
        $filename = 'Kontrak_TTD_' . $projectName . '.pdf';

        return Storage::disk('public')->download($kontrak->signed_contract_path, $filename);
    }

    /**
     * Delete signed contract.
     */
    public function deleteSignedContract($kontrakId)
    {
        $kontrak = Kontrak::findOrFail($kontrakId);

        if ($kontrak->signed_contract_path) {
            Storage::disk('public')->delete($kontrak->signed_contract_path);
            $kontrak->update([
                'signed_contract_path' => null,
                'signed_at' => null,
            ]);
        }

        return back()->with('success', 'Kontrak yang sudah ditandatangani berhasil dihapus.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kontrak $kontrak)
    {
        //
    }
}