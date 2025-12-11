<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>RAB Jasa - {{ $rabJasa->itemPekerjaan->moodboard->order->nama_project }}</title>
    <style>
        @page {
            margin: 10mm;
            size: landscape;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 10px;
        }

        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #16a34a;
            font-weight: bold;
        }

        .header h2 {
            margin: 3px 0 0 0;
            font-size: 14px;
            color: #333;
            font-weight: bold;
        }

        .info-section {
            margin-bottom: 10px;
            background: #f9fafb;
            padding: 8px;
            border-radius: 5px;
        }

        .info-row {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 2px;
        }

        .info-label {
            font-weight: bold;
            color: #16a34a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        table th {
            background: #e5e7eb;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 6px 4px;
            border: 1px solid #d1d5db;
            font-size: 8px;
            text-transform: uppercase;
        }

        table th.text-center {
            text-align: center;
        }

        table th.text-right {
            text-align: right;
        }

        table th.harga-jasa {
            background: #dcfce7;
            color: #166534;
        }

        table th.harga-col {
            background: #dbeafe;
            color: #1e40af;
        }

        table th.total-items {
            background: #f3e8ff;
            color: #7c3aed;
        }

        table th.grand-total-header {
            background: #dcfce7;
            color: #166534;
        }

        table td {
            padding: 4px;
            border: 1px solid #d1d5db;
            vertical-align: top;
        }

        .produk-row {
            background: #f0fdf4;
        }

        .produk-name {
            font-weight: bold;
            color: #166534;
        }

        .produk-dim {
            font-size: 7px;
            color: #6b7280;
        }

        .harga-jasa-cell {
            background: #dcfce7;
            color: #166534;
            font-weight: bold;
            text-align: right;
        }

        .harga-col-cell {
            background: #eff6ff;
            color: #1e40af;
            text-align: right;
        }

        .total-items-cell {
            background: #faf5ff;
            color: #7c3aed;
            font-weight: bold;
            text-align: right;
        }

        .grand-total-cell {
            background: #dcfce7;
            text-align: right;
            font-weight: bold;
            color: #166534;
            font-size: 11px;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .final-total {
            background: #16a34a;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
        }

        .final-total-table {
            width: 100%;
            border: none;
        }

        .final-total-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .final-total-label {
            font-size: 14px;
            font-weight: bold;
        }

        .final-total-sublabel {
            font-size: 9px;
            margin-top: 3px;
        }

        .final-total-amount {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
        }
    </style>
</head>

<body>
    <!-- Header -->
    <div class="header">
        <h1>RANCANGAN ANGGARAN BIAYA JASA</h1>
        <h2>MOEY INTERIOR</h2>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Project:</span>
            {{ $rabJasa->itemPekerjaan->moodboard->order->nama_project }}
        </div>
        <div class="info-row">
            <span class="info-label">Company:</span>
            {{ $rabJasa->itemPekerjaan->moodboard->order->company_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Customer:</span>
            {{ $rabJasa->itemPekerjaan->moodboard->order->customer_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Response By:</span>
            {{ $rabJasa->response_by }}
        </div>
        <div class="info-row">
            <span class="info-label">Response Time:</span>
            {{ \Carbon\Carbon::parse($rabJasa->response_time)->format('d F Y H:i') }}
        </div>
    </div>

    <!-- Table - Same layout as Show.tsx -->
    <table>
        <thead>
            <tr>
                <th style="width: 14%;">Produk</th>
                <th class="harga-jasa text-right" style="width: 12%;">Harga Jasa</th>
                <th style="width: 16%;">Bahan Baku</th>
                <th style="width: 16%;">Finishing Dalam</th>
                <th style="width: 16%;">Finishing Luar</th>
                <th class="text-center" style="width: 6%;">Qty</th>
                <th class="total-items text-right" style="width: 12%;">Total Items</th>
                <th class="grand-total-header text-right" style="width: 12%;">Grand Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($produks as $index => $produk)
                @php
                    // Get bahan baku names from selected bahan baku
                    $bahanBakuNames = $produk['bahan_baku_names'] ?? [];
                    
                    // Group items by jenis (only for finishing)
                    $finishingDalamItems = [];
                    $finishingLuarItems = [];
                    $finishingDalamTotal = 0;
                    $finishingLuarTotal = 0;

                    foreach ($produk['jenis_items'] as $jenisItem) {
                        $namaJenis = strtolower($jenisItem['nama_jenis']);
                        foreach ($jenisItem['items'] as $item) {
                            $harga = $item['harga_total'] ?? 0;
                            if ($namaJenis === 'finishing dalam') {
                                $finishingDalamItems[] = $item['nama_item'];
                                $finishingDalamTotal += $harga;
                            } elseif ($namaJenis === 'finishing luar') {
                                $finishingLuarItems[] = $item['nama_item'];
                                $finishingLuarTotal += $harga;
                            }
                        }
                    }

                    $totalItems = $finishingDalamTotal + $finishingLuarTotal;
                    $maxRows = max(count($bahanBakuNames), count($finishingDalamItems), count($finishingLuarItems), 1);
                @endphp

                @for($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++)
                    <tr class="{{ $rowIndex === 0 ? 'produk-row' : '' }}">
                        @if($rowIndex === 0)
                            <td rowspan="{{ $maxRows }}">
                                <div class="produk-name">{{ $index + 1 }}. {{ $produk['nama_produk'] }}</div>
                                @if($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                                    <div class="produk-dim">{{ $produk['panjang'] }} × {{ $produk['lebar'] }} × {{ $produk['tinggi'] }} cm</div>
                                @endif
                            </td>
                            <td rowspan="{{ $maxRows }}" class="harga-jasa-cell">
                                Rp {{ number_format($produk['harga_dasar'] ?? 0, 0, ',', '.') }}
                            </td>
                        @endif

                        <td>
                            @if(isset($bahanBakuNames[$rowIndex]))
                                • {{ $bahanBakuNames[$rowIndex] }}
                            @endif
                        </td>

                        <td>
                            @if(isset($finishingDalamItems[$rowIndex]))
                                • {{ $finishingDalamItems[$rowIndex] }}
                            @endif
                        </td>

                        <td>
                            @if(isset($finishingLuarItems[$rowIndex]))
                                • {{ $finishingLuarItems[$rowIndex] }}
                            @endif
                        </td>

                        @if($rowIndex === 0)
                            <td rowspan="{{ $maxRows }}" class="text-center">
                                {{ $produk['qty_produk'] }}
                            </td>
                            <td rowspan="{{ $maxRows }}" class="total-items-cell">
                                Rp {{ number_format($totalItems, 0, ',', '.') }}
                            </td>
                            <td rowspan="{{ $maxRows }}" class="grand-total-cell">
                                Rp {{ number_format($produk['harga_akhir'] ?? 0, 0, ',', '.') }}
                            </td>
                        @endif
                    </tr>
                @endfor
            @endforeach
        </tbody>
    </table>

    <!-- Grand Total -->
    <div class="final-total">
        <table class="final-total-table">
            <tr>
                <td style="width: 60%;">
                    <div class="final-total-label">GRAND TOTAL</div>
                    <div class="final-total-sublabel">Total semua produk ({{ count($produks) }} produk)</div>
                </td>
                <td style="width: 40%;" class="final-total-amount">
                    Rp {{ number_format($totalSemuaProduk, 0, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>
</body>

</html>