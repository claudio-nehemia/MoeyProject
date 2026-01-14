<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BAST - {{ $bast_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
        }
        .container {
            padding: 20px 40px;
        }
        
        /* Header dengan Kop Surat */
        .kop-surat {
            width: 100%;
            height: auto;
            display: block;
            margin-bottom: 20px;
        }
        
        .header-title {
            text-align: center;
            margin: 30px 0 20px 0;
        }
        .header-title h1 {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
        }
        
        /* Section */
        .section {
            margin-bottom: 20px;
        }
        
        .opening-text {
            text-align: justify;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        
        /* Info Table */
        .info-table {
            width: 100%;
            margin: 20px 0;
        }
        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .info-table .label {
            width: 35%;
            padding-left: 40px;
        }
        .info-table .separator {
            width: 5%;
        }
        
        /* Product List */
        .product-section {
            margin: 20px 0;
        }
        .product-section-title {
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .product-list {
            margin-left: 40px;
            margin-bottom: 15px;
        }
        .product-list li {
            margin-bottom: 5px;
            line-height: 1.6;
        }
        
        /* Closing Statement */
        .closing-statement {
            text-align: justify;
            margin: 25px 0;
            line-height: 1.8;
        }
        
        /* Signature Section */
        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        .signature-date {
            text-align: right;
            margin-bottom: 40px;
        }
        .signature-table {
            width: 100%;
            margin-top: 30px;
        }
        .signature-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 20px;
        }
        .signature-table .signature-space {
            height: 80px;
        }
        .signature-table .signature-space-short {
            height: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Kop Surat -->
        @if('kop-moey.png')
            <img src="kop-moey.png" class="kop-surat" alt="Kop Surat PT. Moey Jaya Abadi">
        @endif
        
        <!-- Header Title -->
        <div class="header-title">
            <h1>BERITA ACARA PEMERIKSAAN PEKERJAAN (BASTP)</h1>
        </div>
        
        <!-- Opening Text -->
        <div class="opening-text">
            Pada hari ini <strong>{{ \Carbon\Carbon::parse($bast_date)->locale('id')->isoFormat('dddd, DD MMMM YYYY') }}</strong>, 
            telah dilakukan serah terima pekerjaan antara:
        </div>
        
        <!-- Pihak Pertama -->
        <table class="info-table">
            <tr>
                <td class="label">1. Nama</td>
                <td class="separator">:</td>
                <td><strong>{{ $direkturName }}</strong></td>
            </tr>
            <tr>
                <td class="label">Alamat</td>
                <td class="separator">:</td>
                <td>{{ $companyAddress }}</td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left: 40px; padding-top: 8px;">
                    Dalam hal ini bertindak untuk /atas nama <strong>{{ $companyName }}</strong>.
                </td>
            </tr>
        </table>
        
        <!-- Pihak Kedua -->
        <table class="info-table">
            <tr>
                <td class="label">2. Nama</td>
                <td class="separator">:</td>
                <td><strong>{{ $order->customer_name }}</strong></td>
            </tr>
            <tr>
                <td class="label">Alamat</td>
                <td class="separator">:</td>
                <td>{{ $order->alamat ?? '-' }}</td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left: 40px; padding-top: 8px;">
                    Dalam hal ini bertindak untuk /atas nama <strong>{{ $order->company_name }}</strong>.
                </td>
            </tr>
        </table>
        
        <!-- Rincian Pekerjaan -->
        <div class="product-section">
            <div class="product-section-title">Rincian Pekerjaan:</div>
            <table class="info-table">
                <tr>
                    <td class="label">1. Nama Pekerjaan</td>
                    <td class="separator">:</td>
                    <td>"{{ $order->nama_project }}"</td>
                </tr>
                <tr>
                    <td class="label">2. Lingkup Pekerjaan</td>
                    <td class="separator">:</td>
                    <td>Pembuatan interior {{ strtolower($order->nama_project) }}</td>
                </tr>
                <tr>
                    <td class="label" style="vertical-align: top;">3. Hasil Pekerjaan yang Diserahkan:</td>
                    <td class="separator" style="vertical-align: top;"></td>
                    <td style="vertical-align: top;">
                        <ul style="margin: 0; padding-left: 20px;">
                            @foreach($produks as $index => $produk)
                            <li style="margin-bottom: 5px;">
                                Pembuatan {{ $produk->nama_produk ?? 'produk ' . ($index + 1) }}
                            </li>
                            @endforeach
                        </ul>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Closing Statement -->
        <div class="closing-statement">
            Dengan ini, <strong>Pihak Kedua</strong> menyatakan telah menerima pekerjaan dari 
            <strong>Pihak Pertama</strong> dalam kondisi baik dan sesuai dengan spesifikasi yang telah disepakati.
        </div>
        
        <div class="closing-statement">
            Demikian berita acara serah terima pekerjaan ini dibuat dengan sebenar-benarnya untuk dapat digunakan 
            sebagaimana mestinya.
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-date">
                {{ $companyAddress }}, {{ \Carbon\Carbon::parse($bast_date)->locale('id')->isoFormat('DD MMMM YYYY') }}
            </div>
            
            <table class="signature-table">
                <tr>
                    <td>
                        <p><strong>Diserahkan Oleh :</strong></p>
                    </td>
                    <td>
                        <p><strong>Diterima Oleh :</strong></p>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="signature-space"></div>
                    </td>
                    <td>
                        <div class="signature-space-short"></div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <p><strong>{{ $direkturName }}</strong></p>
                    </td>
                    <td>
                        <p><strong>{{ $order->customer_name }}</strong></p>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>