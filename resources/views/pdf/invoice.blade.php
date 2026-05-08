<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        /* 1. Global Page Settings (Absolute Units for DomPDF) */
        @page {
            margin-top: 140pt;
            margin-bottom: 50pt;
            margin-left: 70pt;
            margin-right: 70pt;
        }

        /* 2. Fixed Header (Kop Surat) */
        #header {
            position: fixed;
            top: -120pt;
            left: 0pt;
            right: 0pt;
            height: 120pt;
            text-align: center;
        }

        /* 3. Typography & Body */
        body {
            margin: 0;
            padding: 0;
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
        }

        .kop-img {
            width: 450pt;
            height: auto;
        }

        /* 4. Utilities */
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        .center { text-align: center; }
        .right { text-align: right; }
        .justify { text-align: justify; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }

        /* Tabel Dasar */
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 2pt 0; }
        
        .fee-table { border: 1px solid #000; margin-top: 15pt; }
        .fee-table th, .fee-table td { border: 1px solid #000; padding: 8pt; text-align: left; }
        
        .box-nominal { 
            border: 1px solid #000; 
            padding: 10pt; 
            font-weight: bold; 
            width: 180pt; 
            text-align: center;
            background-color: #f9f9f9;
        }

    </style>
</head>
<body>

    @php
        // Helper Fungsi Terbilang (Indonesian)
        if (!function_exists('penyebut')) {
            function penyebut($nilai) {
                $nilai = abs($nilai);
                $huruf = array("", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas");
                $temp = "";
                if ($nilai < 12) { $temp = " ". $huruf[$nilai]; }
                else if ($nilai < 20) { $temp = penyebut($nilai - 10). " Belas"; }
                else if ($nilai < 100) { $temp = penyebut($nilai/10)." Puluh". penyebut($nilai % 10); }
                else if ($nilai < 200) { $temp = " Seratus" . penyebut($nilai - 100); }
                else if ($nilai < 1000) { $temp = penyebut($nilai/100) . " Ratus" . penyebut($nilai % 100); }
                else if ($nilai < 2000) { $temp = " Seribu" . penyebut($nilai - 1000); }
                else if ($nilai < 1000000) { $temp = penyebut($nilai/1000) . " Ribu" . penyebut($nilai % 1000); }
                else if ($nilai < 1000000000) { $temp = penyebut($nilai/1000000) . " Juta" . penyebut($nilai % 1000000); }
                else if ($nilai < 1000000000000) { $temp = penyebut($nilai/1000000000) . " Milyar" . penyebut(fmod($nilai,1000000000)); }
                return $temp;
            }
        }

        if (!function_exists('terbilang')) {
            function terbilang($nilai) {
                if($nilai<0) { $hasil = "Minus ". trim(penyebut($nilai)); }
                else { $hasil = trim(penyebut($nilai)); }     		
                return $hasil . " Rupiah";
            }
        }

        if (!function_exists('getRomanMonth')) {
            function getRomanMonth($month) {
                $romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                return $romans[intval($month)];
            }
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
        
        $terbilangTotal = terbilang($totalAmount);
        $terbilangKontrak = terbilang($paymentSummary['harga_kontrak']);

        $terminText = $invoice->termin_text; // e.g. "DP", "Termin 2", "Pelunasan"
        $customerName = $invoice->itemPekerjaan->moodboard->order->customer_name;
        $projectName = $invoice->itemPekerjaan->moodboard->order->project_name ?? "Project Interior";
    @endphp

    <!-- Header Fixed (Kop Surat) -->
    <div id="header">
        @if(isset($kopPath) && file_exists($kopPath))
            <img src="{{ $kopPath }}" class="kop-img">
        @else
            <div style="color: red; border: 1px solid red; padding: 10pt;">[ KOP SURAT TIDAK DITEMUKAN ]</div>
        @endif
    </div>

    <!-- ======================================================
         HALAMAN 1: SURAT PENGAJUAN PEMBAYARAN
         ====================================================== -->
    <div class="justify">
        <table width="100%">
            <tr><td align="right">Tangerang, {{ $day }} {{ $monthName }} {{ $year }}</td></tr>
        </table>

        <div style="margin-top: 10pt;">
            <table width="100%">
                <tr><td width="60">Nomor</td><td width="15">:</td><td>{{ $nomorPDP }}</td></tr>
                <tr><td>Hal</td><td>:</td><td>Pengajuan Pembayaran {{ $terminText }}</td></tr>
            </table>
        </div>

        <div style="margin-top: 20pt;">
            <strong>Kepada Yth,</strong><br/>
            <strong>{{ $customerName }}</strong><br/>
            Di {{ $invoice->itemPekerjaan->moodboard->order->company_name ?? 'Tempat' }}
        </div>

        <p style="margin-top: 20pt;">Dengan Hormat,</p>

        <p class="justify">
            Sehubungan dengan rencana Kerjasama Pelaksanaan Project Interior <strong>{{ $projectName }}</strong>, bersama ini Kami bermaksud mengajukan permohonan pembayaran {{ $terminText }} sebesar <strong>Rp. {{ number_format($totalAmount, 0, ',', '.') }},- ({{ $terbilangTotal }})</strong> dari jumlah harga yang disetujui yaitu <strong>Rp. {{ number_format($paymentSummary['harga_kontrak'], 0, ',', '.') }},- ({{ $terbilangKontrak }})</strong>.
        </p>

        <p>Berikut ini Kami lampirkan Kwitansi, Quotation, Invoice dan Kelengkapan Administrasi.</p>
        
        <p>Demikian Kami sampaikan, atas perhatian dan kerjasama {{ $customerName }}, Kami ucapkan terima kasih.</p>

        <div style="margin-top: 30pt;">
            Hormat Kami,<br/>
            <strong>PT. Moey Living Indonesia</strong>
            <div style="height: 50pt;"></div>
            <strong>Aniq Arifuddin</strong><br/>
            Direktur
        </div>
    </div>

    <!-- ======================================================
         HALAMAN 2: INVOICE
         ====================================================== -->
    <div class="page-break justify">
        <h2 class="center underline">INVOICE</h2>
        <p class="center" style="margin-top: -10pt;">No. {{ $nomorINV }}</p>

        <div style="margin-top: 20pt;">
            <table width="100%">
                <tr><td width="80">Kepada</td><td width="15">:</td><td><strong>{{ $customerName }}</strong></td></tr>
                <tr><td>Hal</td><td>:</td><td>Pelaksanaan Project Interior {{ $projectName }}</td></tr>
            </table>
        </div>

        <table class="fee-table" style="margin-top: 10pt;">
            <thead>
                <tr>
                    <th class="text-center" style="width: 70%;">URAIAN</th>
                    <th class="text-center" style="width: 30%;">JUMLAH</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="bold">Total Pembuatan Interior</td>
                    <td class="right">Rp {{ number_format($paymentSummary['harga_kontrak'], 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Commitment Fee</td>
                    <td class="right">Rp {{ number_format($paymentSummary['commitment_fee'], 0, ',', '.') }}</td>
                </tr>
                <tr style="background-color: #f2f2f2;">
                    <td class="bold">- Total</td>
                    <td class="right bold">Rp {{ number_format($paymentSummary['harga_kontrak'] - $paymentSummary['commitment_fee'], 0, ',', '.') }}</td>
                </tr>
                
                @foreach($allInvoices as $inv)
                    <tr>
                        <td>- {{ $inv['termin_text'] }}, Pembayaran {{ $inv['termin_persentase'] }}%</td>
                        <td class="right">Rp {{ number_format($inv['total_amount'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach

                <tr style="background-color: #f2f2f2;">
                    <td class="center bold" colspan="2" style="padding: 5pt;">
                        Jumlah Tagihan {{ $terminText }}, Rp. {{ number_format($totalAmount, 0, ',', '.') }},-
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="center bold" style="border: 1px solid #000; border-top: none; padding: 5pt; background-color: #e8e8e8; font-size: 10pt;">
            " {{ strtoupper($terbilangTotal) }} "
        </div>

        <div class="no-break">
            <div style="margin-top: 10pt;">
                <p>Pembayaran ditransfer melalui rekening :</p>
                <table style="margin-top: -5pt;">
                    <tr><td width="100">Bank</td><td width="15">:</td><td><strong>MANDIRI</strong></td></tr>
                    <tr><td>No Rekening</td><td>:</td><td><strong>1550007495610</strong></td></tr>
                    <tr><td>Atas Nama</td><td>:</td><td><strong>PT. MOEY LIVING INDONESIA</strong></td></tr>
                </table>
            </div>

            <table width="100%" style="margin-top: 15pt;">
                <tr>
                    <td width="60%"></td>
                    <td align="center">
                        Hormat Kami,<br/>
                        <strong>PT. Moey Living Indonesia</strong>
                        <div style="height: 45pt;"></div>
                        <strong><u>Aniq Arifuddin</u></strong><br/>
                        Direktur
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <!-- ======================================================
         HALAMAN 3: KWITANSI (STYLE BARU)
         ====================================================== -->
    <div class="page-break">
        <h2 class="center underline"><u>KWITANSI</u></h2>
        <p class="center" style="margin-top: -10pt;">No. {{ $nomorKWT }}</p>

        <table width="100%" style="margin-top: 30pt;">
            <tr>
                <td width="140" style="font-style: italic;">Sudah terima dari</td>
                <td width="15">:</td>
                <td style="font-size: 12pt;">{{ $customerName }}</td>
            </tr>
            <tr>
                <td style="font-style: italic; padding-top: 15pt;">Uang Sebesar</td>
                <td style="padding-top: 15pt;">:</td>
                <td style="padding-top: 15pt;">
                    <div style="background-color: #e8e8e8; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 12pt; text-align: center;">
                        <strong style="font-size: 13pt; letter-spacing: 0.5pt;">
                            " Rp. {{ number_format($totalAmount, 0, ',', '.') }},- ( {{ strtoupper($terbilangTotal) }} ) "
                        </strong>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="font-style: italic; padding-top: 15pt;">Untuk Pembayaran</td>
                <td style="padding-top: 15pt;">:</td>
                <td style="padding-top: 15pt;">{{ $terminText }} untuk Pelaksanaan Project Interior {{ $projectName }}</td>
            </tr>
        </table>

        <table width="100%" style="margin-top: 50pt;">
            <tr>
                <td width="50%" style="vertical-align: bottom;">
                    <div style="border: 2px solid #000; padding: 10pt; background-color: #f9f9f9; width: 180pt;">
                        <table width="100%">
                            <tr>
                                <td width="30" style="font-size: 16pt;">Rp</td>
                                <td align="center" style="font-size: 16pt; font-weight: bold; border-bottom: 1px solid #000;">
                                    {{ number_format($totalAmount, 0, ',', '.') }},-
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
                <td align="center">
                    Tangerang, {{ $day }} {{ $monthName }} {{ $year }}<br/><br/>
                    <strong>Hormat Kami,</strong><br/>
                    <strong>PT. Moey Living Indonesia</strong>
                    <div style="height: 60pt;"></div>
                    <strong><u>Aniq Arifuddin</u></strong><br/>
                    Direktur
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
