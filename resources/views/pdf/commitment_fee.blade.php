<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Commitment Fee PDF</title>

    <style>
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

        .page-break {
            page-break-after: always;
        }

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
        }

        table td {
            padding: 4px 2px;
            vertical-align: top;
        }

        table th {
            padding: 6px;
            border: 1px solid #000;
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

        .kwitansi-footer {
            margin-top: 20px;
        }

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
            float: right;
        }

        .kop-surat {
            width: 100%;
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0;
        }
    </style>
</head>
<body>

<!-- =======================
     HALAMAN 1 — SURAT
======================= -->
<div class="page page-break">

    <!-- Header -->
    <img src="{{ public_path('kop-moey.png') }}" class="kop-surat">

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
        <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
        <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
    </div>

</div>



<!-- =======================
     HALAMAN 2 — INVOICE
======================= -->
<div class="page page-break">

    <img src="{{ public_path('kop-moey.png') }}" class="kop-surat">

    {{-- <div class="red-bar"></div> --}}

    <h2 class="center">INVOICE</h2>

    <p>No: {{ $nomor_invoice }}</p>
    <p class="right">{{$companyAddress}}, {{ $today }}</p>

    <p>
        Kepada : <strong>{{ $customerName }}</strong><br>
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
        <p style="margin-bottom: 100px;">Hormat Kami,<br><strong>{{$companyName}}</strong></p>
        <p><strong>{{ $direkturName }}</strong><br>{{$jabatanDirektur}}</p>
    </div>

</div>



<!-- =======================
     HALAMAN 3 — KWITANSI
======================= -->
<div class="page">

    <img src="{{ public_path('kop-moey.png') }}" class="kop-surat">

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
        <div class="nominal-box">Rp {{ $nominal }},-</div>

        <div class="signature-box">
            <p style="margin-bottom: 100px;">{{$companyAddress}}, {{ $today }}</p>
            <p><strong>{{ $direkturName }}</strong><br>Direktur Utama</p>
        </div>

        <div style="clear: both;"></div>
    </div>

</div>

</body>
</html>
