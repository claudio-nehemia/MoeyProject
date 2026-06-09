<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>RAB Internal - {{ $rabInternal->itemPekerjaan->moodboard->order->nama_project }}</title>
    <style>
        @page {
            margin: 10mm;
            size: landscape;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 8.5px;
            line-height: 1.2;
            color: #333;
        }

        .info-section {
            margin-bottom: 10px;
            background: #fffbeb;
            padding: 8px;
            border: 1px solid #fef3c7;
            border-radius: 5px;
        }

        .info-row {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 2px;
        }

        .info-label {
            font-weight: bold;
            color: #d97706;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        table th {
            background: #e2e8f0;
            color: #334155;
            font-weight: bold;
            text-align: left;
            padding: 5px 3px;
            border: 1px solid #cbd5e1;
            font-size: 8px;
            text-transform: uppercase;
        }

        table th.text-center { text-align: center; }
        table th.text-right { text-align: right; }

        table th.header-finishing {
            background: #dbeafe;
            color: #1e40af;
        }

        table th.header-dasar {
            background: #d1fae5;
            color: #065f46;
        }

        table th.header-satuan {
            background: #e0e7ff;
            color: #3730a3;
        }

        table th.header-aksesoris {
            background: #ffedd5;
            color: #9a3412;
        }

        table th.header-grand-total {
            background: #dcfce7;
            color: #166534;
        }

        table td {
            padding: 4px 3px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
        }

        .produk-row { background: #fffdf5; }

        .produk-name {
            font-weight: bold;
            color: #b45309;
        }

        .produk-dim {
            font-size: 7px;
            color: #6b7280;
        }

        .finishing-cell {
            background: #f8fafc;
        }

        .harga-finishing-cell {
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: bold;
            text-align: right;
        }

        .harga-dasar-cell {
            background: #ecfdf5;
            color: #047857;
            text-align: right;
        }

        .harga-satuan-cell {
            background: #f5f3ff;
            color: #6d28d9;
            font-weight: bold;
            text-align: right;
        }

        .harga-akhir-cell {
            background: #eeebff;
            color: #4338ca;
            font-weight: bold;
            text-align: right;
        }

        .harga-aksesoris-cell {
            background: #fff7ed;
            color: #c2410c;
            text-align: right;
        }

        .grand-total-cell {
            background: #dcfce7;
            text-align: right;
            font-weight: bold;
            color: #166534;
            font-size: 10px;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .final-total {
            background: #d97706;
            color: white;
            padding: 12px;
            border-radius: 5px;
            margin-top: 15px;
        }

        .final-total-table { width: 100%; border: none; }
        .final-total-table td { border: none; padding: 0; vertical-align: middle; }
        .final-total-label { font-size: 13px; font-weight: bold; }
        .final-total-sublabel { font-size: 8.5px; margin-top: 2px; }
        .final-total-amount { font-size: 17px; font-weight: bold; text-align: right; }

        .kop-surat {
            width: 100%;
            border-bottom: 3px solid #d97706;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }

        .kop-logo { width: 100%; text-align: center; margin-bottom: 8px; }
        .kop-logo img {
            width: 100%;
            max-width: 100%;
            height: 100px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }

        .kop-judul { text-align: center; margin-top: 5px; }
        .judul-utama {
            font-size: 16px;
            font-weight: bold;
            color: #d97706;
            margin: 0 0 2px 0;
            letter-spacing: 0.5px;
        }
        .judul-sub { font-size: 12px; font-weight: bold; color: #1e293b; margin: 0; }
        
        .room-header {
            background: #06b6d4;
            color: white;
            font-weight: bold;
            font-size: 9px;
            padding: 5px;
        }
    </style>
</head>

<body>
    <!-- Header -->
    <div class="kop-surat">
        <div class="kop-logo">
            <img src="{{ public_path('kop-moey.jpeg') }}" alt="MOEY Logo">
        </div>
        <div class="kop-judul">
            <div class="judul-utama">RANCANGAN ANGGARAN BIAYA INTERNAL</div>
            <div class="judul-sub">MOEY INTERIOR</div>
        </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Project:</span>
            {{ $rabInternal->itemPekerjaan->moodboard->order->nama_project }}
        </div>
        <div class="info-row">
            <span class="info-label">Company:</span>
            {{ $rabInternal->itemPekerjaan->moodboard->order->company_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Customer:</span>
            {{ $rabInternal->itemPekerjaan->moodboard->order->customer_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Response By:</span>
            {{ $rabInternal->response_by }}
        </div>
        <div class="info-row">
            <span class="info-label">Response Time:</span>
            {{ \Carbon\Carbon::parse($rabInternal->response_time)->format('d F Y H:i') }}
        </div>
    </div>

    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">Produk</th>
                <th style="width: 9%;">Bahan Baku</th>
                <th style="width: 9%;">Finishing Dalam</th>
                <th class="header-finishing text-right" style="width: 6%;">Harga FD</th>
                <th style="width: 9%;">Finishing Luar</th>
                <th class="header-finishing text-right" style="width: 6%;">Harga FL</th>
                <th class="text-center" style="width: 3%;">Qty</th>
                <th class="header-dasar text-right" style="width: 7%;">Harga Dasar</th>
                <th class="header-satuan text-right" style="width: 7%;">Total BB+Fin</th>
                <th class="text-center" style="width: 4%;">Markup</th>
                <th class="header-satuan text-right" style="width: 7%;">Harga Satuan</th>
                <th style="width: 9%;">Aksesoris</th>
                <th class="header-aksesoris text-center" style="width: 3%;">Qty</th>
                <th class="header-aksesoris text-center" style="width: 4%;">Markup</th>
                <th class="header-aksesoris text-right" style="width: 7%;">Total Aks</th>
                <th class="text-center" style="width: 4%;">Diskon</th>
                <th class="header-grand-total text-right" style="width: 8%;">Grand Total</th>
            </tr>
        </thead>
        <tbody>
            @php
                $grouped = [];
                foreach ($produks as $produk) {
                    $ruangan = $produk['nama_ruangan'] ?: 'Tanpa Ruangan';
                    $grouped[$ruangan][] = $produk;
                }
            @endphp

            @foreach ($grouped as $roomName => $roomProduks)
                <tr>
                    <td colspan="17" class="room-header">
                        {{ $roomName }}
                    </td>
                </tr>

                @foreach ($roomProduks as $index => $produk)
                    @php
                        $bahanBakuNames = $produk['bahan_baku_names'] ?? [];

                        $finishingDalamItems = [];
                        $finishingLuarItems = [];
                        $finishingDalamTotal = 0;
                        $finishingLuarTotal = 0;

                        foreach ($produk['jenis_items'] as $jenisItem) {
                            $namaJenis = strtolower($jenisItem['nama_jenis']);
                            foreach ($jenisItem['items'] as $item) {
                                if ($namaJenis === 'finishing dalam') {
                                    $finishingDalamItems[] = $item['nama_item'];
                                    $finishingDalamTotal += $item['harga_total'];
                                } elseif ($namaJenis === 'finishing luar') {
                                    $finishingLuarItems[] = $item['nama_item'];
                                    $finishingLuarTotal += $item['harga_total'];
                                }
                            }
                        }

                        $totalBBPlusFinishing = $produk['harga_dasar'] + $finishingDalamTotal + $finishingLuarTotal;
                        $aksesorisData = $produk['aksesoris'] ?? [];

                        $maxRows = max(
                            count($bahanBakuNames),
                            count($finishingDalamItems),
                            count($finishingLuarItems),
                            count($aksesorisData),
                            1
                        );
                    @endphp

                    @for ($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++)
                        <tr class="{{ $rowIndex === 0 ? 'produk-row' : '' }}">
                            @if ($rowIndex === 0)
                                <td rowspan="{{ $maxRows }}">
                                    <div class="produk-name">{{ $index + 1 }}. {{ $produk['nama_produk'] }}</div>
                                    @if ($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                                        <div class="produk-dim">
                                            {{ $produk['panjang'] }} × {{ $produk['lebar'] }} × {{ $produk['tinggi'] }} m
                                        </div>
                                    @endif
                                </td>
                            @endif

                            <td>
                                @if (isset($bahanBakuNames[$rowIndex]))
                                    • {{ $bahanBakuNames[$rowIndex] }}
                                @endif
                            </td>

                            <td class="finishing-cell">
                                @if (isset($finishingDalamItems[$rowIndex]))
                                    • {{ $finishingDalamItems[$rowIndex] }}
                                @endif
                            </td>

                            @if ($rowIndex === 0)
                                <td rowspan="{{ $maxRows }}" class="harga-finishing-cell">
                                    Rp {{ number_format($finishingDalamTotal, 0, ',', '.') }}
                                </td>
                            @endif

                            <td class="finishing-cell">
                                @if (isset($finishingLuarItems[$rowIndex]))
                                    • {{ $finishingLuarItems[$rowIndex] }}
                                @endif
                            </td>

                            @if ($rowIndex === 0)
                                <td rowspan="{{ $maxRows }}" class="harga-finishing-cell">
                                    Rp {{ number_format($finishingLuarTotal, 0, ',', '.') }}
                                </td>
                                <td rowspan="{{ $maxRows }}" class="text-center">
                                    {{ $produk['qty_produk'] }}
                                </td>
                                <td rowspan="{{ $maxRows }}" class="harga-dasar-cell">
                                    Rp {{ number_format($produk['harga_dasar'], 0, ',', '.') }}
                                </td>
                                <td rowspan="{{ $maxRows }}" class="harga-satuan-cell">
                                    Rp {{ number_format($totalBBPlusFinishing, 0, ',', '.') }}
                                </td>
                                <td rowspan="{{ $maxRows }}" class="text-center">
                                    {{ $produk['markup_satuan'] }}%
                                </td>
                                <td rowspan="{{ $maxRows }}" class="harga-akhir-cell">
                                    Rp {{ number_format($produk['harga_satuan'], 0, ',', '.') }}
                                </td>
                            @endif

                            <td>
                                @if (isset($aksesorisData[$rowIndex]))
                                    • {{ $aksesorisData[$rowIndex]['nama_aksesoris'] }}
                                @endif
                            </td>
                            <td class="text-center">
                                @if (isset($aksesorisData[$rowIndex]))
                                    {{ $aksesorisData[$rowIndex]['qty_aksesoris'] }}
                                @endif
                            </td>
                            <td class="text-center">
                                @if (isset($aksesorisData[$rowIndex]))
                                    {{ $aksesorisData[$rowIndex]['markup_aksesoris'] }}%
                                @endif
                            </td>
                            <td class="text-right">
                                @if (isset($aksesorisData[$rowIndex]))
                                    Rp {{ number_format($aksesorisData[$rowIndex]['harga_total'], 0, ',', '.') }}
                                @endif
                            </td>

                            @if ($rowIndex === 0)
                                <td rowspan="{{ $maxRows }}" class="text-center">
                                    {{ $produk['diskon_per_produk'] }}%
                                </td>
                                <td rowspan="{{ $maxRows }}" class="grand-total-cell">
                                    Rp {{ number_format($produk['harga_akhir'], 0, ',', '.') }}
                                </td>
                            @endif
                        </tr>
                    @endfor
                @endforeach
            @endforeach
        </tbody>
    </table>

    <!-- Grand Total -->
    <div class="final-total">
        <table class="final-total-table">
            <tr>
                <td style="width: 65%;">
                    <div class="final-total-label">GRAND TOTAL</div>
                    <div class="final-total-sublabel">Total semua produk ({{ count($produks) }} produk)</div>
                </td>
                <td style="width: 35%;" class="final-total-amount">
                    Rp {{ number_format($totalSemuaProduk, 0, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
