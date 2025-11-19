<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>RAB Kontrak - {{ $rabKontrak->itemPekerjaan->moodboard->order->nama_project }}</title>
    <style>
        @page {
            margin: 15mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #9333ea;
            padding-bottom: 15px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #9333ea;
            font-weight: bold;
        }
        
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        }
        
        .info-section {
            margin-bottom: 15px;
            background: #f9fafb;
            padding: 10px;
            border-radius: 5px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 3px;
        }
        
        .info-label {
            font-weight: bold;
            width: 120px;
            color: #9333ea;
        }
        
        .info-value {
            color: #333;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        table th {
            background: #e5e7eb;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 8px 6px;
            border: 1px solid #d1d5db;
            font-size: 9px;
            text-transform: uppercase;
        }
        
        table th.text-center {
            text-align: center;
        }
        
        table th.text-right {
            text-align: right;
        }
        
        table th.grand-total-header {
            background: #dcfce7;
            color: #166534;
        }
        
        table td {
            padding: 6px;
            border: 1px solid #d1d5db;
        }
        
        .produk-header {
            background: #16a34a;
            color: #ffffff;
            font-weight: bold;
            font-size: 11px;
            padding: 6px;
        }
        
        .produk-info {
            font-size: 9px;
            color: #e9d5ff;
            margin-top: 2px;
        }
        
        .harga-dasar-row {
            background: #f3e8ff;
        }
        
        .harga-dasar-row td {
            font-weight: 600;
        }
        
        .jenis-item-header {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #9333ea;
            margin-bottom: 2px;
        }
        
        .item-name {
            padding-left: 15px;
        }
        
        .subtotal-row {
            background: #dbeafe;
        }
        
        .subtotal-row td {
            font-weight: bold;
        }
        
        .subtotal-detail {
            font-size: 8px;
            color: #4b5563;
        }
        
        .aksesoris-row {
            background: #faf5ff;
        }
        
        .aksesoris-header {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #7c3aed;
            margin-bottom: 2px;
        }
        
        .total-aksesoris-row {
            background: #e9d5ff;
        }
        
        .total-aksesoris-row td {
            font-weight: bold;
            color: #7c3aed;
        }
        
        .grand-total-cell {
            background: linear-gradient(to bottom, #dcfce7, #bbf7d0);
            text-align: center;
            vertical-align: middle;
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
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .final-total {
            background: linear-gradient(to right, #16a34a, #15803d);
            color: white;
            padding: 12px;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .final-total-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .final-total-label {
            font-size: 14px;
            font-weight: bold;
        }
        
        .final-total-amount {
            font-size: 18px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>RANCANGAN ANGGARAN BIAYA KONTRAK</h1>
        <h2>MOEY INTERIOR</h2>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Project:</div>
            <div class="info-value">{{ $rabKontrak->itemPekerjaan->moodboard->order->nama_project }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Company:</div>
            <div class="info-value">{{ $rabKontrak->itemPekerjaan->moodboard->order->company_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">{{ $rabKontrak->itemPekerjaan->moodboard->order->customer_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Response By:</div>
            <div class="info-value">{{ $rabKontrak->response_by }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Response Time:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($rabKontrak->response_time)->format('d F Y H:i') }}</div>
        </div>
    </div>

    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 35%;">Komponen</th>
                <th class="text-center" style="width: 10%;">Qty</th>
                <th class="text-right" style="width: 18%;">Harga Satuan</th>
                <th class="text-right" style="width: 18%;">Harga Total</th>
                <th class="grand-total-header text-right" style="width: 19%;">Grand Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($produks as $index => $produk)
                <?php
                    $totalItemsCount = collect($produk['jenis_items'])->sum(function($jenis) {
                        return count($jenis['items']);
                    });
                    $aksesorisCount = count($produk['aksesoris']);
                    $totalRows = 1 + $totalItemsCount + 1 + ($aksesorisCount > 0 ? $aksesorisCount + 1 : 0);
                    $subtotal = $produk['harga_dasar'] + $produk['harga_items_non_aksesoris'];
                ?>
                
                <!-- Produk Header -->
                <tr>
                    <td colspan="5" class="produk-header">
                        {{ $index + 1 }}. {{ $produk['nama_produk'] }}
                        <div class="produk-info">
                            Qty: {{ $produk['qty_produk'] }}
                            @if($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                                | Dimensi: {{ $produk['panjang'] }} × {{ $produk['lebar'] }} × {{ $produk['tinggi'] }} cm
                            @endif
                        </div>
                    </td>
                </tr>

                <!-- Harga Dasar -->
                <tr class="harga-dasar-row">
                    <td>Harga Dasar</td>
                    <td class="text-center">{{ $produk['qty_produk'] }}</td>
                    <td class="text-right">Rp {{ number_format($produk['harga_dasar'] / $produk['qty_produk'], 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($produk['harga_dasar'], 0, ',', '.') }}</td>
                    <td rowspan="{{ $totalRows }}" class="grand-total-cell">
                        <div class="grand-total-amount">Rp {{ number_format($produk['harga_akhir'], 0, ',', '.') }}</div>
                        <div class="grand-total-label">Harga Akhir</div>
                    </td>
                </tr>

                <!-- Jenis Items & Items -->
                @foreach($produk['jenis_items'] as $jenisItem)
                    @foreach($jenisItem['items'] as $itemIndex => $item)
                        <tr>
                            <td>
                                @if($itemIndex === 0)
                                    <div class="jenis-item-header">{{ $jenisItem['nama_jenis'] }}</div>
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
                        <div class="subtotal-detail">Dimensi: {{ number_format($produk['harga_dimensi'], 0, ',', '.') }}</div>
                    </td>
                    <td class="text-right" style="color: #2563eb;">Rp {{ number_format($produk['harga_satuan'], 0, ',', '.') }}</td>
                </tr>

                <!-- Aksesoris Section -->
                @if(count($produk['aksesoris']) > 0)
                    @foreach($produk['aksesoris'] as $aksIndex => $aksesoris)
                        <tr class="aksesoris-row">
                            <td>
                                @if($aksIndex === 0)
                                    <div class="aksesoris-header">Aksesoris</div>
                                @endif
                                <div class="item-name">• {{ $aksesoris['nama_aksesoris'] }}</div>
                            </td>
                            <td class="text-center">{{ $aksesoris['qty_aksesoris'] }}</td>
                            <td class="text-right">Rp {{ number_format($aksesoris['harga_satuan_aksesoris'], 0, ',', '.') }}</td>
                            <td class="text-right">Rp {{ number_format($aksesoris['harga_total'], 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                    
                    <!-- Total Aksesoris -->
                    <tr class="total-aksesoris-row">
                        <td colspan="3" class="text-right">Total Aksesoris:</td>
                        <td class="text-right">Rp {{ number_format($produk['harga_total_aksesoris'], 0, ',', '.') }}</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <!-- Grand Total -->
    <div class="final-total">
        <div class="final-total-content">
            <div>
                <div class="final-total-label">GRAND TOTAL</div>
                <div style="font-size: 9px; margin-top: 2px;">Total semua produk ({{ count($produks) }} produk)</div>
            </div>
            <div class="final-total-amount">
                Rp {{ number_format($totalSemuaProduk, 0, ',', '.') }}
            </div>
        </div>
    </div>
</body>
</html>