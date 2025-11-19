<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kontrak - {{ $kontrak->itemPekerjaan->moodboard->order->nama_project }}</title>
    <style>
        @page {
            margin: 15mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 15px;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            color: #16a34a;
            font-weight: bold;
        }

        .header h2 {
            margin: 5px 0 0 0;
            font-size: 18px;
            color: #333;
            font-weight: bold;
        }

        .info-section {
            margin-bottom: 20px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: bold;
            width: 150px;
            color: #16a34a;
        }

        .info-value {
            color: #333;
            flex: 1;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #16a34a;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #16a34a;
        }

        .termin-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .termin-table th {
            background: #16a34a;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 10px;
            border: 1px solid #15803d;
        }

        .termin-table td {
            padding: 10px;
            border: 1px solid #d1d5db;
            background: white;
        }

        .termin-table tr:nth-child(even) td {
            background: #f9fafb;
        }

        .total-box {
            background: linear-gradient(to right, #16a34a, #15803d);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-top: 30px;
            text-align: center;
        }

        .total-label {
            font-size: 14px;
            margin-bottom: 10px;
        }

        .total-amount {
            font-size: 24px;
            font-weight: bold;
        }

        .footer-note {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
        }

        .signature-section {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 80px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>KONTRAK</h1>
        <h2>MOEY INTERIOR</h2>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Nomor Kontrak:</div>
            <div class="info-value">{{ str_pad($kontrak->id, 5, '0', STR_PAD_LEFT) }}/KONTRAK/{{ date('Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Nama Project:</div>
            <div class="info-value">{{ $kontrak->itemPekerjaan->moodboard->order->nama_project }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Perusahaan:</div>
            <div class="info-value">{{ $kontrak->itemPekerjaan->moodboard->order->company_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">{{ $kontrak->itemPekerjaan->moodboard->order->customer_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Durasi Kontrak:</div>
            <div class="info-value">{{ $kontrak->durasi_kontrak }} Hari</div>
        </div>
        <div class="info-row">
            <div class="info-label">Harga Kontrak:</div>
            <div class="info-value" style="font-weight: bold; color: #16a34a;">
                Rp {{ number_format($kontrak->harga_kontrak ?? 0, 0, ',', '.') }}
            </div>
        </div>
        <div class="info-row">
            <div class="info-label">Tanggal Kontrak:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($kontrak->created_at)->format('d F Y') }}</div>
        </div>
    </div>

    <!-- Termin Section -->
    <div class="section-title">PEMBAYARAN TERMIN - {{ $kontrak->termin->nama_tipe }}</div>
    
    <table class="termin-table">
        <thead>
            <tr>
                <th style="width: 15%;">Tahap</th>
                <th style="width: 85%;">Deskripsi</th>
            </tr>
        </thead>
        <tbody>
            @foreach($kontrak->termin->tahapan as $tahap)
                <tr>
                    <td style="text-align: center; font-weight: bold;">{{ $tahap['step'] }}</td>
                    <td>{{ $tahap['text'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Total -->
    <div class="total-box">
        <div class="total-label">TOTAL NILAI KONTRAK</div>
        <div class="total-amount">Rp {{ number_format($kontrak->harga_kontrak, 0, ',', '.') }}</div>
    </div>

    <!-- Signature -->
    <table style="width: 100%; margin-top: 10px; border: none;">
        <tr>
            <td style="width: 50%; text-align: center; border: none; padding: 0 20px;">
                <div>MOEY INTERIOR</div>
                <div style="border-top: 1px solid #333; margin-top: 80px; padding-top: 5px;">Pihak Pertama</div>
            </td>
            <td style="width: 50%; text-align: center; border: none; padding: 0 20px;">
                <div>{{ $kontrak->itemPekerjaan->moodboard->order->customer_name }}</div>
                <div style="border-top: 1px solid #333; margin-top: 80px; padding-top: 5px;">Pihak Kedua</div>
            </td>
        </tr>
    </table>
</body>
</html>
