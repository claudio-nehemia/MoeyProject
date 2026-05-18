<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>Commitment Fee</title>
    <!--[if gte mso 9]>
    <xml>
     <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
     </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page Section1 {
            size: 595.3pt 841.9pt;
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header: h1;
            mso-header-margin: .2in;
            mso-footer-margin: .2in;    
            mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }

        body {
            font-family: "Times New Roman", serif;
            font-size: 11pt;
            color: #000;
            margin: 0;
            padding: 0;
            mso-line-height-rule: exactly;
        }

        .page { page-break-inside: avoid; }
        .page-break { page-break-before: always; mso-page-break-before: always; }
        .word-page-break {
            page-break-before: always;
            mso-page-break-before: always;
            height: 0;
            line-height: 0;
            margin: 0;
        }

        .center { text-align: center; }
        .right { text-align: right; }

        table {
            border-collapse: collapse;
            width: 100%;
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
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }

        .red-bar {
            width: 100%;
            height: 25px;
            background-color: #be1e2d;
            margin-top: 5px;
            margin-bottom: 25px;
        }

        .signature {
            margin-top: 50px;
            text-align: left;
        }

        .kwitansi-footer { width: 100%; margin-top: 30px; }
        .nominal-box {
            border: 1px solid #000;
            width: 180px;
            height: 35px;
            text-align: center;
            line-height: 35px;
        }
        .signature-box { text-align: center; width: 200px; }
        .signature-spacer { height: 60pt; }
    </style>
</head>
<body>
<div style="mso-element:header" id="h1">
    @if(!empty($logoUrl))
        <table width="100%">
            <tr>
                <td align="center">
                    <img src="{{ $logoUrl }}" alt="Kop" style="width: 360pt; max-width: 100%; height: auto; display: block; margin: 0 auto;">
                </td>
            </tr>
        </table>
    @endif
</div>

<div class="Section1">
    <!-- HALAMAN 1 — Surat Pengajuan Commitment Fee -->
    <div class="page">
        <div class="right">{{ $companyAddress }}, {{ $today }}</div>

        <p>No: {{ $nomor_surat }}<br>
           Hal: Pengajuan Commitment Fee Project Interior</p>

        <p>Kepada Yth,<br>
           <strong>{{ $customerName }}</strong><br>
           Di {{ $alamat }}</p>

        <p>Dengan hormat,</p>

        <p>Sehubungan dengan rencana pelaksanaan project interior <strong>{{ $projectName }}</strong>, kami mengajukan <strong>Commitment Fee sebesar Rp {{ $nominal }},-</strong>.</p>

        <p>Commitment Fee ini sebagai tanda keseriusan dan komitmen awal, serta akan diperhitungkan pada nilai kontrak setelah project disetujui.</p>

        <p>Pembayaran dapat dilakukan melalui rekening berikut:</p>

        <table>
            <tr><td width="120">Bank</td><td>: {{ $nameBank }}</td></tr>
            <tr><td>No. Rekening</td><td>: {{ $norekBank }}</td></tr>
            <tr><td>Atas Nama</td><td>: {{ $atasNamaBank }}</td></tr>
        </table>

        <p>Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>

        <div class="signature">
            <p>Hormat Kami,</p>
            <p><strong>{{ $companyName }}</strong></p>
            <div class="signature-spacer"></div>
            <p><strong>{{ $direkturName }}</strong><br>{{ $jabatanDirektur }}</p>
        </div>
    </div>

    <!-- Word hard page break -->
    <!--[if gte mso 9]>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <![endif]-->
    <p class="word-page-break"></p>

    <!-- HALAMAN 2 — INVOICE -->
    <div class="page">
        <div class="red-bar"></div>

        <h2 class="center">INVOICE</h2>

        <table>
            <tr>
                <td>No: {{ $nomor_invoice }}</td>
                <td align="right">{{ $companyAddress }}, {{ $today }}</td>
            </tr>
        </table>

        <table style="margin-top: 8pt;">
            <tr>
                <td width="70">Kepada</td>
                <td width="10">:</td>
                <td><strong>{{ $customerName }}</strong></td>
            </tr>
            <tr>
                <td>Di</td>
                <td>:</td>
                <td><strong>{{ $alamat }}</strong></td>
            </tr>
            <tr>
                <td>Hal</td>
                <td>:</td>
                <td>Pembayaran Commitment Fee Interior</td>
            </tr>
        </table>

        <table>
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
            <p>Hormat Kami,</p>
            <p><strong>{{ $companyName }}</strong></p>
            <div class="signature-spacer"></div>
            <p><strong>{{ $direkturName }}</strong><br>{{ $jabatanDirektur }}</p>
        </div>
    </div>

    <!-- Word hard page break -->
    <!--[if gte mso 9]>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <![endif]-->
    <p class="word-page-break"></p>

    <!-- HALAMAN 3 — KWITANSI -->
    <div>
        <div class="red-bar"></div>

        <h3 class="center">KWITANSI</h3>
        <p class="center">No. {{ $nomor_kwitansi }}</p>

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
            <table>
                <tr>
                    <td width="50%" style="vertical-align: bottom;">
                        <div class="nominal-box">Rp {{ $nominal }},-</div>
                    </td>
                    <td width="50%" align="center">
                        {{ $companyAddress }}, {{ $today }}
                        <div class="signature-spacer"></div>
                        <strong>{{ $direkturName }}</strong><br>Direktur Utama
                    </td>
                </tr>
            </table>
        </div>
    </div>
</div>
</body>
</html>
