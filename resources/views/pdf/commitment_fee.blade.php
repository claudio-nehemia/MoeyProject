@if(isset($isWord) && $isWord)
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
@else
<!DOCTYPE html>
<html>
@endif
<head>
    <meta charset="utf-8">
    <title>Commitment Fee PDF</title>
    @if(isset($isWord) && $isWord)
    <!--[if gte mso 9]>
    <xml>
     <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
     </w:WordDocument>
    </xml>
    <![endif]-->
    @endif

    <style>
        @if(isset($isWord) && $isWord)
        @page Section1 {
            size: 595.3pt 841.9pt; /* A4 size */
            margin: 0.5in 0.6in 0.5in 0.6in; /* Matches PDF padding */
            mso-header-margin: .3in;
            mso-footer-margin: .3in;
            mso-paper-source: 0;
        }
        div.Section1 {
            page: Section1;
        }
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            margin: 0;
            padding: 0;
            mso-line-height-rule: exactly;
        }
        .kop-surat {
            width: 450pt;
            height: auto;
            display: block;
            margin: 0 auto 15px auto;
        }
        .page {
            padding: 0;
            box-sizing: border-box;
        }
        .page-break {
            page-break-before: always;
            mso-page-break-before: always;
        }
        @else
        body {
            font-family: "Times New Roman", serif;
            font-size: 14px;
            margin: 0;
        }

        /* Halaman aman untuk DOMPDF — tanpa height */
        .page {
            padding: 35px 45px;
            box-sizing: border-box;
        }
        .kop-surat {
            width: 100%;
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0;
        }
        .page-break {
            page-break-after: always;
        }
        @endif

        .center { text-align: center; }
        .right  { text-align: right; }

        /* HEADER FIX: pakai table */
        .header-table {
            width: 100%;
            border-bottom: 1.5px solid #cfcfcf;
            margin-bottom: 20px;
        }

        .header-table td {
            vertical-align: middle;
            padding-bottom: 5px;
        }

        .header-logo {
            width: 180px;
        }

        .header-title {
            text-align: right;
            font-size: 14px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            border-spacing: 0;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        table td {
            padding: 4px 2px;
            vertical-align: top;
            border: none;
        }

        table th {
            padding: 6px;
            border: none;
        }

        /* Red bar fix */
        .red-bar {
            width: 100%;
            height: 20px;
            background: #be1e2d;
            margin: 20px 0;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
        }

        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000 !important;
            padding: 6px;
            font-size: 14px;
        }

        /* Signature area */
        .signature img {
            width: 120px;
            margin: 5px 0;
        }

        p { margin: 0 0 8pt 0; }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border: none;
        }

        .signature-table td { padding: 0; }

        .signature-spacer { height: 70pt; }
        .signature-spacer-small { height: 60pt; }

        .kwitansi-footer { margin-top: 20px; }

        .kwitansi-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border: none;
        }

        .kwitansi-table td {
            padding: 0;
            vertical-align: top;
        }

        .kwitansi-nominal { width: 50%; }
        .kwitansi-signature { width: 50%; text-align: center; }

        .nominal-box {
            border: 1px solid #000;
            width: 180px;
            height: 35px;
            text-align: center;
            line-height: 35px;
            display: inline-block;
        }

        .signature-box {
            width: 200px;
            text-align: center;
            float: none;
            display: inline-block;
        }

        /* Kop surat for non-Word is handled in first block */
    </style>
</head>
<body>
@if(isset($isWord) && $isWord)
<div class="Section1">
@endif

<!-- =======================
     HALAMAN 1 — SURAT
======================= -->
<div class="@if(isset($isWord) && $isWord) justify @else page page-break @endif">

    <!-- Header -->
    @if(!empty($logoUrl))
        <img src="{{ $logoUrl }}" class="kop-surat" @if(isset($isWord) && $isWord) width="600" style="width: 450pt; max-width: 100%; height: auto;" @endif>
    @endif

    <p class="right">{{$companyAddress}}, {{ $today }}</p>

    <p>No: {{ $nomor_surat }}<br>
       Hal: Pengajuan Commitment Fee Project Interior</p>

    <p>Kepada Yth,<br>
       <strong>{{ $customerName }}</strong><br>
       Di {{ $alamat }}</p>

    <p>Dengan hormat,</p>

    <p>
        Sehubungan dengan rencana pelaksanaan project interior
        <strong>{{ $projectName }}</strong>, kami mengajukan
        <strong>Commitment Fee sebesar Rp {{ $nominal }},-</strong>.
    </p>

    <p>
        Commitment Fee ini sebagai tanda keseriusan dan komitmen awal, serta akan diperhitungkan
        pada nilai kontrak setelah project disetujui.
    </p>

    <p>Pembayaran dapat dilakukan melalui rekening berikut:</p>

    <table>
        <tr><td width="120">Bank</td><td>: {{ $nameBank }}</td></tr>
        <tr><td>No. Rekening</td><td>: {{ $norekBank }}</td></tr>
        <tr><td>Atas Nama</td><td>: {{ $atasNamaBank }}</td></tr>
    </table>

    <p>
        Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
    </p>

    <div class="signature">
        <table class="signature-table">
            <tr>
                <td>Hormat Kami,<br><strong>{{$companyName}}</strong></td>
            </tr>
            <tr>
                <td class="signature-spacer"></td>
            </tr>
            <tr>
                <td><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</td>
            </tr>
        </table>
    </div>

</div>



<div class="@if(isset($isWord) && $isWord) page-break @else page page-break @endif">

    @if(!empty($logoUrl))
        <img src="{{ $logoUrl }}" class="kop-surat" @if(isset($isWord) && $isWord) width="600" style="width: 450pt; max-width: 100%; height: auto;" @endif>
    @endif

    {{-- <div class="red-bar"></div> --}}

    <h2 class="center">INVOICE</h2>

    <p>No: {{ $nomor_invoice }}</p>
    <p class="right">{{$companyAddress}}, {{ $today }}</p>

    <p>
        Kepada : <strong>{{ $customerName }}</strong><br>
        Di : <strong>{{ $alamat }}</strong><br>
        Hal : Pembayaran Commitment Fee Interior
    </p>

    <table class="invoice-table">
        <thead>
            <tr>
                <th>URAIAN</th>
                <th>JUMLAH</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Pembayaran Commitment Fee</td>
                <td>Rp. {{ $nominal }}</td>
            </tr>
        </tbody>
    </table>


    <p><strong>Pembayaran melalui:</strong></p>

    <table>
        <tr><td width="120">Bank</td><td>: {{ $nameBank }}</td></tr>
        <tr><td>No. Rekening</td><td>: {{ $norekBank }}</td></tr>
        <tr><td>Atas Nama</td><td>: {{ $atasNamaBank }}</td></tr>
    </table>

    <div class="signature">
        <table class="signature-table">
            <tr>
                <td>Hormat Kami,<br><strong>{{$companyName}}</strong></td>
            </tr>
            <tr>
                <td class="signature-spacer"></td>
            </tr>
            <tr>
                <td><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</td>
            </tr>
        </table>
    </div>

</div>



<div class="@if(isset($isWord) && $isWord) page-break @else page page-break @endif">

    @if(!empty($logoUrl))
        <img src="{{ $logoUrl }}" class="kop-surat" @if(isset($isWord) && $isWord) width="600" style="width: 450pt; max-width: 100%; height: auto;" @endif>
    @endif

    {{-- <div class="red-bar"></div> --}}

    <h3 class="center">KWITANSI</h3>
    <p class="center">No: {{ $nomor_kwitansi }}</p>

    <table>
        <tr>
            <td width="150">Sudah terima dari</td>
            <td>: <strong>{{ $customerName }}</strong></td>
        </tr>
        <tr>
            <td>Uang Sebesar</td>
            <td>: <strong>Rp {{ $nominal }},-</strong></td>
        </tr>
        <tr>
            <td>Untuk Pembayaran</td>
            <td>: Commitment Fee Desain Interior</td>
        </tr>
    </table>

    <div class="kwitansi-footer">
        <table class="kwitansi-table">
            <tr>
                <td class="kwitansi-nominal" style="vertical-align: bottom;">
                    <div class="nominal-box">Rp {{ $nominal }},-</div>
                </td>
                <td class="kwitansi-signature">
                    <div class="signature-box">
                        <p style="margin: 0;">{{$companyAddress}}, {{ $today }}</p>
                        <div class="signature-spacer-small"></div>
                        <p style="margin: 0;"><strong>{{ $direkturName }}</strong><br>Direktur Utama</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>

</div>

@if(isset($isWord) && $isWord)
</div>
@endif
</body>
</html>
