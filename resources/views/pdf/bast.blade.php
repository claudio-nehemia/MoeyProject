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
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }
        .container {
            padding: 20px 40px;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #1a365d;
        }
        .header h2 {
            font-size: 16px;
            font-weight: normal;
            color: #4a5568;
        }
        .bast-number {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin: 15px 0;
            font-size: 14px;
            font-weight: bold;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2d3748;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 8px 0;
            vertical-align: top;
        }
        .info-table .label {
            width: 180px;
            font-weight: bold;
            color: #4a5568;
        }
        .info-table .separator {
            width: 20px;
            text-align: center;
        }
        .product-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .product-table th,
        .product-table td {
            border: 1px solid #cbd5e0;
            padding: 10px;
            text-align: left;
        }
        .product-table th {
            background: #edf2f7;
            font-weight: bold;
            color: #2d3748;
        }
        .product-table tr:nth-child(even) {
            background: #f7fafc;
        }
        .stages-section {
            margin-top: 20px;
        }
        .stage-item {
            display: inline-block;
            background: #e2e8f0;
            padding: 8px 15px;
            margin: 5px;
            border-radius: 20px;
            font-size: 11px;
        }
        .stage-item.completed {
            background: #c6f6d5;
            color: #22543d;
        }
        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        .signature-table {
            width: 100%;
        }
        .signature-box {
            width: 45%;
            text-align: center;
            padding: 20px;
        }
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 80px;
            padding-top: 10px;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 10px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .stamp {
            border: 3px solid #38a169;
            border-radius: 10px;
            padding: 15px 25px;
            display: inline-block;
            transform: rotate(-5deg);
            color: #38a169;
            font-weight: bold;
            font-size: 18px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BERITA ACARA SERAH TERIMA</h1>
            <h2>PEKERJAAN INTERIOR</h2>
            <div class="bast-number">{{ $bast_number }}</div>
            <p style="margin-top: 10px; color: #718096;">Tanggal: {{ $bast_date }}</p>
        </div>

        <div class="section">
            <div class="section-title">📋 INFORMASI PROJECT</div>
            <table class="info-table">
                <tr>
                    <td class="label">Nama Project</td>
                    <td class="separator">:</td>
                    <td>{{ $order->nama_project }}</td>
                </tr>
                <tr>
                    <td class="label">Nama Perusahaan</td>
                    <td class="separator">:</td>
                    <td>{{ $order->company_name }}</td>
                </tr>
                <tr>
                    <td class="label">Nama Customer</td>
                    <td class="separator">:</td>
                    <td>{{ $order->customer_name }}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📦 DETAIL PRODUK</div>
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Nama Produk</th>
                        <th>Quantity</th>
                        <th>Dimensi (P×L×T)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $produk->produk->nama_produk }}</td>
                        <td>{{ $produk->quantity }} unit</td>
                        <td>{{ $produk->panjang }} × {{ $produk->lebar }} × {{ $produk->tinggi }} cm</td>
                        <td><span style="color: #38a169; font-weight: bold;">✓ SELESAI</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section stages-section">
            <div class="section-title">🔄 TAHAPAN YANG TELAH DILALUI</div>
            @foreach($stage_evidences as $stage => $evidences)
                <span class="stage-item completed">✓ {{ $stage }}</span>
            @endforeach
        </div>

        <div class="section">
            <div class="section-title">📝 PERNYATAAN</div>
            <p style="text-align: justify; line-height: 1.8;">
                Dengan ini menyatakan bahwa pekerjaan produk <strong>{{ $produk->produk->nama_produk }}</strong> 
                telah selesai dikerjakan dan diserahterimakan dalam kondisi baik sesuai dengan spesifikasi yang telah disepakati.
                Berita Acara Serah Terima ini dibuat sebagai bukti resmi bahwa pekerjaan telah selesai dan diterima dengan baik.
            </p>
        </div>

        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td class="signature-box">
                        <p><strong>PIHAK PERTAMA</strong></p>
                        <p style="color: #718096; font-size: 11px;">(Pelaksana)</p>
                        <div class="signature-line">
                            <p>(...............................)</p>
                        </div>
                    </td>
                    <td style="width: 10%;"></td>
                    <td class="signature-box">
                        <p><strong>PIHAK KEDUA</strong></p>
                        <p style="color: #718096; font-size: 11px;">({{ $order->customer_name }})</p>
                        <div class="signature-line">
                            <p>(...............................)</p>
                        </div>
                    </td>
                </tr>
            </table>
            
            <div style="text-align: center; margin-top: 30px;">
                <div class="stamp">SERAH TERIMA RESMI</div>
            </div>
        </div>

        <div class="footer">
            <p>Dokumen ini dicetak secara otomatis oleh sistem pada {{ now()->format('d F Y H:i:s') }}</p>
            <p>{{ $bast_number }}</p>
        </div>
    </div>
</body>
</html>
