<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Report</title>
    <style>
        @page {
            margin: 1.5cm;
            size: A4 portrait;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 9px;
            color: #1e293b;
            line-height: 1.3;
        }
        .header {
            border-bottom: 3px solid #1e293b;
            padding-bottom: 8px;
            margin-bottom: 14px;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #1e293b;
            letter-spacing: 1px;
        }
        .header p {
            margin: 2px 0 0 0;
            font-size: 9px;
            color: #64748b;
        }
        .summary-cards {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .summary-cards td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            text-align: center;
            width: 25%;
        }
        .summary-cards .card-label {
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            font-weight: bold;
        }
        .summary-cards .card-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 2px;
        }
        .filter-info {
            font-size: 8px;
            color: #64748b;
            margin-bottom: 8px;
            font-style: italic;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }
        .data-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 5px;
            text-align: left;
            border: 1px solid #334155;
        }
        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 5px;
            vertical-align: middle;
        }
        .data-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .data-table tr:nth-child(odd) td {
            background-color: #ffffff;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-pending { background-color: #fef3c7; color: #92400e; }
        .badge-in-progress { background-color: #dbeafe; color: #1e40af; }
        .badge-completed { background-color: #dcfce7; color: #166534; }
        .badge-low { background-color: #f1f5f9; color: #475569; }
        .badge-medium { background-color: #dbeafe; color: #1e40af; }
        .badge-high { background-color: #ffedd5; color: #c2410c; }
        .badge-urgent { background-color: #fee2e2; color: #991b1b; }
        .badge-survey { background-color: #e0e7ff; color: #3730a3; }
        .badge-moodboard { background-color: #fce7f3; color: #9d174d; }
        .badge-cm_fee { background-color: #fef3c7; color: #92400e; }
        .badge-desain_final { background-color: #cffafe; color: #155e75; }
        .badge-rab { background-color: #dbeafe; color: #1e40af; }
        .badge-kontrak { background-color: #e0e7ff; color: #4338ca; }
        .badge-produksi { background-color: #faf5ff; color: #7e22ce; }
        .badge-not_start { background-color: #f1f5f9; color: #475569; }
        .badge-lunas { background-color: #dcfce7; color: #166534; }
        .badge-termin { background-color: #e0e7ff; color: #4338ca; }
        .badge-dp { background-color: #cffafe; color: #155e75; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .team-list {
            font-size: 7px;
            color: #475569;
        }
        .footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 8px;
            color: #94a3b8;
            text-align: right;
        }
        .no-col { width: 22px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ORDER MANAGEMENT REPORT</h1>
        <p>Daftar Seluruh Order Project &mdash; Moey Living Group</p>
    </div>

    <!-- Summary Cards -->
    <table class="summary-cards">
        <tr>
            <td>
                <div class="card-label">Total Orders</div>
                <div class="card-value">{{ $totalOrders }}</div>
            </td>
            <td>
                <div class="card-label">Pending</div>
                <div class="card-value" style="color: #d97706;">{{ $statusCounts['pending'] ?? 0 }}</div>
            </td>
            <td>
                <div class="card-label">In Progress</div>
                <div class="card-value" style="color: #2563eb;">{{ $statusCounts['in_progress'] ?? 0 }}</div>
            </td>
            <td>
                <div class="card-label">Completed</div>
                <div class="card-value" style="color: #16a34a;">{{ $statusCounts['completed'] ?? 0 }}</div>
            </td>
        </tr>
    </table>

    <!-- Data Table -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="no-col">No</th>
                <th>Nama Project</th>
                <th>Perusahaan</th>
                <th>Customer</th>
                <th>Telepon</th>
                <th class="text-center">Prioritas</th>
                <th class="text-center">Status</th>
                <th class="text-center">Tahapan</th>
                <th class="text-center">Pembayaran</th>
                <th>Team</th>
                <th class="text-center">Tanggal Masuk</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $index => $order)
                <tr>
                    <td class="no-col">{{ $index + 1 }}</td>
                    <td style="font-weight:bold;">{{ $order->nama_project }}</td>
                    <td>{{ $order->company_name }}</td>
                    <td>{{ $order->customer_name }}</td>
                    <td>{{ $order->phone_number ?: '-' }}</td>
                    <td class="text-center">
                        <span class="badge badge-{{ $order->priority_level }}">
                            {{ ucfirst($order->priority_level) }}
                        </span>
                    </td>
                    <td class="text-center">
                        <span class="badge badge-{{ str_replace('_', '-', $order->project_status) }}">
                            {{ ucfirst(str_replace('_', ' ', $order->project_status)) }}
                        </span>
                    </td>
                    <td class="text-center">
                        <span class="badge badge-{{ $order->tahapan_proyek }}">
                            @switch($order->tahapan_proyek)
                                @case('not_start') Belum Mulai @break
                                @case('survey') Survey @break
                                @case('moodboard') Moodboard @break
                                @case('cm_fee') CM Fee @break
                                @case('desain_final') Desain Final @break
                                @case('rab') RAB @break
                                @case('kontrak') Kontrak @break
                                @case('produksi') Produksi @break
                                @default {{ $order->tahapan_proyek }}
                            @endswitch
                        </span>
                    </td>
                    <td class="text-center">
                        <span class="badge badge-{{ $order->payment_status }}">
                            @switch($order->payment_status)
                                @case('not_start') Belum Bayar @break
                                @case('cm_fee') CM Fee @break
                                @case('dp') DP @break
                                @case('termin') Termin @break
                                @case('lunas') Lunas @break
                                @default {{ $order->payment_status }}
                            @endswitch
                        </span>
                    </td>
                    <td class="team-list">
                        @if($order->users->count() > 0)
                            {{ $order->users->pluck('name')->implode(', ') }}
                        @else
                            <span style="color:#cbd5e1;">-</span>
                        @endif
                    </td>
                    <td class="text-center">{{ \Carbon\Carbon::parse($order->tanggal_masuk_customer)->format('d/m/Y') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Total: {{ $totalOrders }} order &nbsp;|&nbsp; Dicetak pada: {{ now()->format('d/m/Y H:i') }} &nbsp;|&nbsp; Moey Living Group
    </div>
</body>
</html>
