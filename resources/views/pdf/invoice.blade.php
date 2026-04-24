<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 1.5cm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
        }

        .page-break {
            page-break-after: always;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }

        .kop-surat { display:block; width:100%; max-width: 100%; height:auto; margin-bottom:6px; }
        hr.kop-divider { border:0; border-top:1px solid #d0d0d0; margin:8px 0 12px 0; }

        /* Cover Letter Styles */
        .letter-header {
            margin-bottom: 20px;
        }

        .letter-body {
            margin-top: 30px;
        }

        .signature-block {
            margin-top: 50px;
            float: right;
            width: 250px;
            page-break-inside: avoid;
        }

        /* Kwitansi Styles */
        .kwitansi-container {
            border: 1px solid #000;
            padding: 20px;
            position: relative;
        }

        .kwitansi-header {
            font-size: 14pt;
            margin-bottom: 20px;
        }

        .kwitansi-row {
            margin-bottom: 15px;
            display: block;
            clear: both;
        }

        .kwitansi-label {
            float: left;
            width: 150px;
            font-style: italic;
        }

        .kwitansi-colon {
            float: left;
            width: 20px;
        }

        .kwitansi-value {
            float: left;
            width: 450px;
            border-bottom: 1px dotted #000;
            min-height: 20px;
        }

        .kwitansi-amount-box {
            border: 1px solid #000;
            padding: 10px;
            font-size: 14pt;
            font-weight: bold;
            display: inline-block;
            margin-top: 20px;
        }

        /* Invoice Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        table, th, td {
            border: 1px solid black;
        }

        th {
            background-color: #f2f2f2;
            padding: 8px;
        }

        td {
            padding: 8px;
        }

        .no-border table, .no-border th, .no-border td {
            border: none;
        }

        .bank-info {
            margin-top: 30px;
        }

        .stamp-area {
            position: relative;
            height: 100px;
        }

        .stamp-img {
            position: absolute;
            top: -20px;
            left: 0;
            width: 150px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    @php
        function getRomanMonth($month) {
            $romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            return $romans[intval($month)];
        }

        $date = \Carbon\Carbon::parse($invoice->created_at);
        $day = $date->format('d');
        $monthName = $date->translatedFormat('F');
        $year = $date->format('Y');
        $romanMonth = getRomanMonth($date->format('m'));
        
        $sequence = str_pad(explode('/', $invoice->invoice_number)[3] ?? '001', 3, '0', STR_PAD_LEFT);
        
        $nomorPDP = "{$sequence}/MJA/PDP/{$romanMonth}/{$year}";
        $nomorKWT = "{$sequence}/MJA/KWT/{$romanMonth}/{$year}";
        $nomorINV = "{$sequence}/MJA/INV/{$romanMonth}/{$year}";
        
        $terbilangTotal = trim(terbilang($totalAmount)) . " Rupiah";
        $terbilangKontrak = trim(terbilang($paymentSummary['harga_kontrak'])) . " Rupiah";
    @endphp

    <!-- PAGE 1: SURAT PENGAJUAN PEMBAYARAN -->
    <div class="page-break">
        @if(isset($kopPath) && file_exists($kopPath))
            <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
        @endif
        <hr class="kop-divider">

        <div class="text-right">
            Tangerang, {{ $day }} {{ $monthName }} {{ $year }}
        </div>

        <div class="letter-header">
            <table class="no-border" style="width: 100%; border: none;">
                <tr style="border: none;">
                    <td style="width: 80px; border: none; padding: 0;">Nomor</td>
                    <td style="width: 20px; border: none; padding: 0;">:</td>
                    <td style="border: none; padding: 0;">{{ $nomorPDP }}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 0;">Hal</td>
                    <td style="border: none; padding: 0;">:</td>
                    <td style="border: none; padding: 0;" class="font-bold">Pengajuan Pembayaran {{ $invoice->termin_text }}</td>
                </tr>
            </table>
        </div>

        <div class="letter-body">
            <p class="font-bold">Kepada Yth,</p>
            <p class="font-bold" style="margin: 0;">{{ $invoice->itemPekerjaan->moodboard->order->customer_name }}</p>
            <p style="margin: 0;">Di {{ $invoice->itemPekerjaan->moodboard->order->company_name }}</p>

            <p style="margin-top: 30px;">Dengan Hormat,</p>
            <p class="text-justify">
                Sehubungan dengan <span class="font-bold">Pelaksanaan Pekerjaan Interior Rumah Tinggal</span> yang sudah selesai dilaksanakan, bersama ini Kami bermaksud mengajukan <span class="font-bold">Permohonan Pembayaran {{ $invoice->termin_text }}</span> sebesar <span class="font-bold">Rp. {{ number_format($totalAmount, 0, ',', '.') }},- ({{ $terbilangTotal }})</span>, dari jumlah harga yang disetujui yaitu <span class="font-bold">Rp. {{ number_format($paymentSummary['harga_kontrak'], 0, ',', '.') }},- ({{ $terbilangKontrak }})</span>.
            </p>

            <p>Berikut ini Kami lampirkan <span class="font-bold">Invoice {{ $invoice->termin_text }}</span>.</p>
            <p>Demikian Kami sampaikan, atas perhatian dan kerjasama Bapak, Kami ucapkan terima kasih.</p>
        </div>

        <table class="no-border" style="width: 100%; border: none; margin-top: 50px;">
            <tr style="border: none;">
                <td style="border: none; width: 60%;"></td>
                <td style="border: none; width: 40%; text-align: left;">
                    <p style="margin: 0;">Hormat Kami,</p>
                    <p class="font-bold" style="margin: 0;">PT. Moey Jaya Abadi</p>
                    <div style="height: 80px;"></div>
                    <p class="font-bold" style="margin: 0;">Aniq Arifuddin</p>
                    <p style="margin: 0;">Direktur</p>
                </td>
            </tr>
        </table>
    </div>

    <!-- PAGE 2: KWITANSI -->
    <div class="page-break">
        @if(isset($kopPath) && file_exists($kopPath))
            <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
        @endif
        <hr class="kop-divider">

        <div class="kwitansi-container">
            <div class="text-center">
                <span class="kwitansi-header font-bold underline">KWITANSI</span><br>
                <span>No. {{ $nomorKWT }}</span>
            </div>

            <div class="letter-body">
                <div class="kwitansi-row">
                    <div class="kwitansi-label">Sudah terima dari</div>
                    <div class="kwitansi-colon">:</div>
                    <div class="kwitansi-value font-bold">{{ $invoice->itemPekerjaan->moodboard->order->customer_name }}</div>
                </div>

                <div class="kwitansi-row">
                    <div class="kwitansi-label">Uang Sebesar</div>
                    <div class="kwitansi-colon">:</div>
                    <div class="kwitansi-value" style="background: repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #ffffff 10px, #ffffff 20px); padding: 5px;">
                        <span class="font-bold">" {{ $terbilangTotal }} "</span>
                    </div>
                </div>

                <div class="kwitansi-row">
                    <div class="kwitansi-label">Untuk Pembayaran</div>
                    <div class="kwitansi-colon">:</div>
                    <div class="kwitansi-value font-bold">{{ $invoice->termin_text }} Project Interior Rumah Tinggal</div>
                </div>
            </div>

            <table class="no-border" style="width: 100%; border: none; margin-top: 40px;">
                <tr style="border: none;">
                    <td style="border: none; width: 50%; vertical-align: top;">
                        <div class="kwitansi-amount-box">
                            Rp {{ number_format($totalAmount, 0, ',', '.') }},-
                        </div>
                    </td>
                    <td style="border: none; width: 50%; text-align: left; vertical-align: top;">
                        <p style="margin: 0;">Tangerang, {{ $day }} {{ $monthName }} {{ $year }}</p>
                        <div class="stamp-area">
                            <!-- stamp image placeholder -->
                        </div>
                        <p style="margin-bottom: 0;">Nama : <span class="font-bold">Aniq Arifuddin</span></p>
                        <p style="margin-top: 0;">Jabatan : <span class="font-bold">Direktur Utama</span></p>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- PAGE 3: INVOICE -->
    <div>
        @if(isset($kopPath) && file_exists($kopPath))
            <img src="{{ $kopPath }}" class="kop-surat" alt="kop surat">
        @endif
        <hr class="kop-divider">

        <div class="text-center">
            <span class="kwitansi-header font-bold underline">INVOICE</span><br>
            <span>No. {{ $nomorINV }}</span>
        </div>

        <div class="text-right" style="margin-top: -40px;">
            Tangerang, {{ $day }} {{ $monthName }} {{ $year }}
        </div>

        <div style="margin-top: 40px;">
            <table class="no-border" style="width: 100%; border: none;">
                <tr style="border: none;">
                    <td style="width: 80px; border: none; padding: 2px;">Kepada</td>
                    <td style="width: 20px; border: none; padding: 2px;">:</td>
                    <td style="border: none; padding: 2px;">{{ $invoice->itemPekerjaan->moodboard->order->customer_name }}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 2px;">Hal</td>
                    <td style="border: none; padding: 2px;">:</td>
                    <td style="border: none; padding: 2px;">Pelaksanaan Project Interior Rumah Tinggal</td>
                </tr>
            </table>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 70%;">Uraian</th>
                    <th class="text-center" style="width: 30%;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="font-bold">Total Pembuatan Interior</td>
                    <td class="text-right">Rp {{ number_format($paymentSummary['harga_kontrak'], 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="font-bold">Commitment Fee</td>
                    <td class="text-right">Rp {{ number_format($paymentSummary['commitment_fee'], 0, ',', '.') }}</td>
                </tr>
                <tr style="background-color: #f2f2f2;">
                    <td class="font-bold">- Total</td>
                    <td class="text-right font-bold">Rp {{ number_format($paymentSummary['harga_kontrak'] - $paymentSummary['commitment_fee'], 0, ',', '.') }}</td>
                </tr>
                
                @foreach($allInvoices as $inv)
                    <tr>
                        <td>- {{ $inv['termin_text'] }}, Pembayaran {{ $inv['termin_persentase'] }}%</td>
                        <td class="text-right">Rp {{ number_format($inv['total_amount'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach

                <tr style="background-color: #f2f2f2;">
                    <td class="text-center font-bold">
                        Jumlah Tagihan {{ $invoice->termin_text }}, Rp. {{ number_format($totalAmount, 0, ',', '.') }},-
                    </td>
                    <td class="text-center font-bold"></td>
                </tr>
            </tbody>
        </table>

        <div class="text-center font-bold" style="border: 1px solid #000; border-top: none; padding: 10px;">
            " {{ $terbilangTotal }} "
        </div>

        <div class="bank-info">
            <p class="font-bold underline" style="margin-bottom: 5px;">Pembayaran ditransfer melalui rekening:</p>
            <table class="no-border" style="border: none;">
                <tr style="border: none;">
                    <td style="width: 100px; border: none; padding: 2px;">Bank</td>
                    <td style="width: 20px; border: none; padding: 2px;">:</td>
                    <td style="border: none; padding: 2px;" class="font-bold">Mandiri</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 2px;">No. Rekening</td>
                    <td style="border: none; padding: 2px;">:</td>
                    <td style="border: none; padding: 2px;" class="font-bold">1550007495610</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 2px;">Atas Nama</td>
                    <td style="border: none; padding: 2px;">:</td>
                    <td style="border: none; padding: 2px;" class="font-bold">PT. Moey Jaya Abadi</td>
                </tr>
            </table>
        </div>

        <table class="no-border" style="width: 100%; border: none; margin-top: 50px;">
            <tr style="border: none;">
                <td style="border: none; width: 60%;"></td>
                <td style="border: none; width: 40%; text-align: left;">
                    <p style="margin: 0;">Hormat Kami,</p>
                    <p class="font-bold" style="margin: 0;">PT. Moey Jaya Abadi</p>
                    <div style="height: 80px;"></div>
                    <p class="font-bold" style="margin: 0;">Aniq Arifuddin</p>
                    <p style="margin: 0;">Direktur</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
