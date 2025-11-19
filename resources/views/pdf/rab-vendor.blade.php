<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>RAB Vendor - {{ $rabVendor->itemPekerjaan->moodboard->order->nama_project }}</title>
    <style>
        @page { margin: 15mm; }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.3;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #9333ea;
            padding-bottom: 15px;
        }
        .header h1 { margin: 0; font-size: 18px; color: #9333ea; font-weight: bold; }
        .header h2 { margin: 5px 0 0; font-size: 16px; color: #333; font-weight: bold; }

        .info-section {
            margin-bottom: 15px;
            background: #f9fafb;
            padding: 10px;
            border-radius: 5px;
        }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-label { font-weight: bold; width: 120px; color: #9333ea; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table th {
            background: #e5e7eb;
            color: #374151;
            font-weight: bold;
            padding: 8px 6px;
            border: 1px solid #d1d5db;
            text-transform: uppercase;
            font-size: 9px;
        }
        table td {
            padding: 6px;
            border: 1px solid #d1d5db;
        }

        .produk-header {
            background: #16a34a;
            color: white;
            font-weight: bold;
            font-size: 11px;
            padding: 6px;
        }
        .produk-info { font-size: 9px; color: #e9d5ff; margin-top: 2px; }

        .harga-dasar-row { background: #f3e8ff; }
        .harga-dasar-row td { font-weight: 600; }

        .jenis-item-header {
            font-size: 8px;
            font-weight: bold;
            color: #9333ea;
            text-transform: uppercase;
        }
        .item-name { padding-left: 15px; }

        .subtotal-row { background: #dbeafe; }
        .subtotal-row td { font-weight: bold; }
        .subtotal-detail { font-size: 8px; color: #4b5563; }

        .aksesoris-row { background: #faf5ff; }
        .aksesoris-header {
            font-size: 8px;
            font-weight: bold;
            color: #7c3aed;
            text-transform: uppercase;
        }
        .total-aksesoris-row { background: #e9d5ff; }
        .total-aksesoris-row td { font-weight: bold; color: #7c3aed; }

        .grand-total-cell {
            background: linear-gradient(to bottom, #dcfce7, #bbf7d0);
            text-align: center;
        }
        .grand-total-amount {
            font-size: 14px;
            font-weight: bold;
            color: #166534;
        }
        .grand-total-label {
            font-size: 8px;
            color: #4b5563;
            margin-top: 2px;
        }

        .final-total {
            background: linear-gradient(to right, #16a34a, #15803d);
            color: white;
            padding: 12px;
            border-radius: 5px;
        }
        .final-total-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .final-total-label { font-size: 14px; font-weight: bold; }
        .final-total-amount { font-size: 18px; font-weight: bold; }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <h1>RANCANGAN ANGGARAN BIAYA VENDOR</h1>
        <h2>MOEY INTERIOR</h2>
    </div>

    <!-- Info -->
    <div class="info-section">
        <div class="info-row"><div class="info-label">Project:</div><div>{{ $rabVendor->itemPekerjaan->moodboard->order->nama_project }}</div></div>
        <div class="info-row"><div class="info-label">Company:</div><div>{{ $rabVendor->itemPekerjaan->moodboard->order->company_name }}</div></div>
        <div class="info-row"><div class="info-label">Customer:</div><div>{{ $rabVendor->itemPekerjaan->moodboard->order->nama_project }}</div></div>
        <div class="info-row"><div class="info-label">Response By:</div><div>{{ $rabVendor->response_by }}</div></div>
        <div class="info-row">
            <div class="info-label">Response Time:</div>
            <div>{{ \Carbon\Carbon::parse($rabVendor->response_time)->format('d F Y H:i') }}</div>
        </div>
    </div>

    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width:35%;">Komponen</th>
                <th class="text-center" style="width:10%;">Qty</th>
                <th class="text-right" style="width:18%;">Harga Satuan</th>
                <th class="text-right" style="width:18%;">Harga Total</th>
                <th class="grand-total-header text-right" style="width:19%;">Grand Total</th>
            </tr>
        </thead>

        <tbody>
            @foreach($produks as $i => $p)
                @php
                    $totalItems = collect($p['jenis_items'])->sum(fn($j) => count($j['items']));
                    $totalAks = count($p['aksesoris']);
                    $totalRows = 1 + $totalItems + 1 + ($totalAks > 0 ? $totalAks + 1 : 0);
                    $subtotal = $p['harga_dasar'] + $p['harga_items_non_aksesoris'];
                @endphp

                <!-- Produk Header -->
                <tr>
                    <td colspan="5" class="produk-header">
                        {{ $i + 1 }}. {{ $p['nama_produk'] }}
                        <div class="produk-info">
                            Qty: {{ $p['qty_produk'] }}
                            @if($p['panjang'] && $p['lebar'] && $p['tinggi'])
                                | Dimensi: {{ $p['panjang'] }} × {{ $p['lebar'] }} × {{ $p['tinggi'] }} cm
                            @endif
                        </div>
                    </td>
                </tr>

                <!-- Harga Dasar -->
                <tr class="harga-dasar-row">
                    <td>Harga Dasar</td>
                    <td class="text-center">{{ $p['qty_produk'] }}</td>
                    <td class="text-right">Rp {{ number_format($p['harga_dasar'] / $p['qty_produk'], 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($p['harga_dasar'], 0, ',', '.') }}</td>

                    <td rowspan="{{ $totalRows }}" class="grand-total-cell">
                        <div class="grand-total-amount">
                            Rp {{ number_format($p['harga_akhir'], 0, ',', '.') }}
                        </div>
                        <div class="grand-total-label">Harga Akhir</div>
                    </td>
                </tr>

                <!-- Items -->
                @foreach($p['jenis_items'] as $jenis)
                    @foreach($jenis['items'] as $idx => $item)
                        <tr>
                            <td>
                                @if($idx === 0)
                                    <div class="jenis-item-header">{{ $jenis['nama_jenis'] }}</div>
                                @endif
                                <div class="item-name">• {{ $item['nama_item'] }}</div>
                            </td>
                            <td class="text-center">{{ $item['qty'] }}</td>
                            <td class="text-right">Rp {{ number_format($item['harga_satuan'], 0, ',', '.') }}</td>
                            <td class="text-right">Rp {{ number_format($item['harga_total'], 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                @endforeach

                <!-- Subtotal × Dimensi -->
                <tr class="subtotal-row">
                    <td>Subtotal × Dimensi</td>
                    <td class="text-center">-</td>
                    <td class="text-right">
                        <div class="subtotal-detail">Subtotal: Rp {{ number_format($subtotal, 0, ',', '.') }}</div>
                        <div class="subtotal-detail">Dimensi: Rp {{ number_format($p['harga_dimensi'], 0, ',', '.') }}</div>
                    </td>
                    <td class="text-right" style="color:#2563eb;">
                        Rp {{ number_format($p['harga_satuan'], 0, ',', '.') }}
                    </td>
                </tr>

                <!-- Aksesoris -->
                @if(count($p['aksesoris']) > 0)
                    @foreach($p['aksesoris'] as $aIdx => $aks)
                        <tr class="aksesoris-row">
                            <td>
                                @if($aIdx === 0)
                                    <div class="aksesoris-header">Aksesoris</div>
                                @endif
                                <div class="item-name">• {{ $aks['nama_aksesoris'] }}</div>
                            </td>
                            <td class="text-center">{{ $aks['qty_aksesoris'] }}</td>
                            <td class="text-right">Rp {{ number_format($aks['harga_satuan_aksesoris'], 0, ',', '.') }}</td>
                            <td class="text-right">Rp {{ number_format($aks['harga_total'], 0, ',', '.') }}</td>
                        </tr>
                    @endforeach

                    <tr class="total-aksesoris-row">
                        <td colspan="3" class="text-right">Total Aksesoris:</td>
                        <td class="text-right">
                            Rp {{ number_format($p['harga_total_aksesoris'], 0, ',', '.') }}
                        </td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <!-- GRAND TOTAL -->
    <div class="final-total">
        <div class="final-total-content">
            <div>
                <div class="final-total-label">GRAND TOTAL</div>
                <div style="font-size: 9px;">Total semua produk ({{ count($produks) }} produk)</div>
            </div>
            <div class="final-total-amount">
                Rp {{ number_format(collect($produks)->sum('harga_akhir'), 0, ',', '.') }}
            </div>
        </div>
    </div>

</body>
</html>
