<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Progress Report - {{ $order->nama_project }}</title>
    <style>
        @page {
            margin: 1cm;
            size: A4 landscape;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 9px;
            color: #333;
            line-height: 1.2;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .header-table td {
            border: 1px solid #ccc;
            padding: 5px 7px;
        }
        .bg-grey { background-color: #f1f5f9; color: #475569; font-weight: bold; }
        .bg-pink { background-color: #fff1f2; }
        .text-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .customer-name {
            font-size: 15px;
            font-weight: bold;
            color: #be123c;
            text-align: center;
            vertical-align: middle;
        }

        .progress-table {
            width: 100%;
            border-collapse: collapse;
        }
        .progress-table th, .progress-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 3px;
            text-align: center;
            vertical-align: middle;
        }
        .progress-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-size: 7.5px;
            text-transform: uppercase;
            padding: 5px 2px;
            line-height: 1.3;
        }
        .progress-table th.stage-col {
            width: 38px;
        }
        .room-row td {
            background-color: #3b82f6;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 5px 10px;
        }
        .item-name {
            text-align: left !important;
            padding-left: 8px !important;
        }
        .material-text {
            text-align: left !important;
            font-size: 7px;
            color: #475569;
        }
        .check-cell {
            background-color: #f0fdf4;
        }
        .check-mark {
            color: #16a34a;
            font-weight: bold;
            font-size: 11px;
        }
        .empty-cell {
            background-color: #fafafa;
        }
        .bast-check {
            color: #7c3aed;
            font-weight: bold;
            font-size: 11px;
        }
        .footer {
            margin-top: 12px;
            font-size: 8px;
            color: #94a3b8;
            text-align: right;
        }
        .progress-summary {
            margin-top: 8px;
            margin-bottom: 8px;
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
            border-radius: 4px;
        }
        .progress-bar-outer {
            display: inline-block;
            vertical-align: middle;
            width: 220px;
            height: 12px;
            background-color: #e2e8f0;
            border-radius: 6px;
            margin: 0 8px;
            overflow: hidden;
        }
        .progress-bar-inner {
            height: 100%;
            background-color: #3b82f6;
            border-radius: 6px;
        }
        .row-even { background-color: #f8fafc; }
        .row-odd  { background-color: #ffffff; }
        .no-col   { width: 22px; text-align: center; color: #64748b; }
        .qty-col  { width: 28px; }
        .sat-col  { width: 32px; }
        .bobot-col{ width: 42px; font-weight: bold; color: #1e40af; }
    </style>
</head>
<body>
    <div style="margin-bottom: 10px; border-bottom: 2px solid #1e293b; padding-bottom: 6px;">
        <h2 style="margin: 0; color: #1e293b; font-size: 14px; letter-spacing: 1px;">PROJECT PROGRESS REPORT</h2>
        <p style="margin: 2px 0; color: #64748b; font-size: 9px;">{{ $order->nama_project }} &mdash; {{ $order->company_name }}</p>
    </div>

    <!-- Header Info Table -->
    <table class="header-table">
        <tr>
            <td width="14%" class="bg-grey">Tanggal Kontrak</td>
            <td width="16%">{{ $kontrakInfo['tanggal_mulai'] ?? '-' }}</td>
            <td width="10%" class="bg-pink" style="font-weight:bold;">Customer</td>
            <td width="22%" rowspan="3" class="bg-pink customer-name">{{ $order->customer_name }}</td>
            <td width="20%" class="bg-grey">Target Progres 50%</td>
            <td width="18%">{{ $targets['50'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="bg-grey">Approval Gambar Kerja</td>
            <td>{{ $order->gambarKerja->approved_time ? $order->gambarKerja->approved_time->format('d/m/Y') : '-' }}</td>
            <td class="bg-pink"></td>
            <td class="bg-grey">Target Progres 80%</td>
            <td>{{ $targets['80'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="bg-grey">Jangka Waktu</td>
            <td>{{ $kontrakInfo['durasi_kontrak'] ?? '-' }} Hari</td>
            <td class="bg-pink"></td>
            <td class="bg-grey">Target Progres 100%</td>
            <td>{{ $targets['100'] ?? '-' }}</td>
        </tr>
    </table>

    <!-- Progress Summary Bar -->
    <div class="progress-summary">
        <span class="text-bold" style="color:#1e293b;">Total Progress:</span>
        <span class="progress-bar-outer">
            <span class="progress-bar-inner" style="width: {{ $order->progress }}%;"></span>
        </span>
        <span class="text-bold" style="color: #3b82f6; font-size:11px;">{{ number_format($order->progress, 2) }}%</span>
        <span style="margin-left: 24px; font-style: italic; color: #64748b;">
            Hari Ini: {{ now()->format('d/m/Y') }}
        </span>
    </div>

    <!-- Main Data Table -->
    <table class="progress-table">
        <thead>
            <tr>
                <th rowspan="2" class="no-col">NO</th>
                <th rowspan="2" style="text-align:left; padding-left:6px;">JENIS PEKERJAAN</th>
                <th rowspan="2" class="qty-col">Qty</th>
                <th rowspan="2" class="sat-col">Satuan</th>
                <th rowspan="2" style="text-align:left; padding-left:4px;">Material</th>
                <th rowspan="2" class="bobot-col" style="color:#facc15;">Bobot</th>
                <th colspan="10" style="background-color:#0f172a; letter-spacing:1px;">TAHAPAN PRODUKSI</th>
            </tr>
            <tr>
                <th class="stage-col">Potong<br/>10%</th>
                <th class="stage-col">Rangkai<br/>20%</th>
                <th class="stage-col">Fin<br/>30%</th>
                <th class="stage-col">Fin QC<br/>40%</th>
                <th class="stage-col">Packing<br/>50%</th>
                <th class="stage-col">Kirim<br/>60%</th>
                <th class="stage-col">Trap<br/>70%</th>
                <th class="stage-col">Instal<br/>80%</th>
                <th class="stage-col">Ins QC<br/>90%</th>
                <th class="stage-col" style="background-color:#7c3aed;">BAST<br/>100%</th>
            </tr>
        </thead>
        <tbody>
            @php $globalIdx = 1; @endphp
            @foreach($groupedProduks as $roomName => $produks)
                <tr class="room-row">
                    <td colspan="16">{{ $roomName }}</td>
                </tr>
                @foreach($produks as $i => $produk)
                    <tr class="{{ $i % 2 === 0 ? 'row-even' : 'row-odd' }}">
                        <td class="no-col">{{ $globalIdx++ }}</td>
                        <td class="item-name">{{ $produk['nama_produk'] }}</td>
                        <td style="text-align:center;">{{ $produk['quantity'] }}</td>
                        <td style="text-align:center;">Unit</td>
                        <td class="material-text" style="padding-left:4px;">{{ $produk['material_summary'] }}</td>
                        <td class="bobot-col">{{ number_format($produk['weight_percentage'], 2) }}%</td>

                        {{-- Stages --}}
                        @foreach($stageMapping as $key => $label)
                            @if($produk['reached_stages'][$label])
                                <td class="check-cell"><span class="check-mark">&#10003;</span></td>
                            @else
                                <td class="empty-cell"></td>
                            @endif
                        @endforeach

                        {{-- BAST --}}
                        @if($produk['has_bast'])
                            <td class="check-cell"><span class="bast-check">&#10003;</span></td>
                        @else
                            <td class="empty-cell"></td>
                        @endif
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Dicetak pada: {{ now()->format('d/m/Y H:i') }} &nbsp;|&nbsp; Moey Living Group
    </div>
</body>
</html>