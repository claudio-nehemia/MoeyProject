<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>RAB Kontrak - {{ $rabKontrak->itemPekerjaan->moodboard->order->nama_project }}</title>
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
            color: #9333ea;
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

        table th.text-center { text-align: center; }
        table th.text-right { text-align: right; }

        table th.harga-satuan {
            background: #d1fae5;
            color: #065f46;
        }

        table th.total-item {
            background: #f3e8ff;
            color: #7c3aed;
        }

        table th.total-aks {
            background: #ffedd5;
            color: #c2410c;
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

        .produk-row-even { background: #ffffff; }
        .produk-row-odd { background: #faf5ff; }

        .room-header {
            background: #0891b2;
            color: white;
            font-weight: bold;
            font-size: 9.5px;
            padding: 6px 8px;
        }

        .produk-name {
            font-weight: bold;
            color: #7c3aed;
        }

        .produk-dim {
            font-size: 7px;
            color: #6b7280;
        }

        .harga-satuan-cell {
            background: #ecfdf5;
            color: #065f46;
            font-weight: bold;
            text-align: right;
        }

        .total-item-cell {
            background: #faf5ff;
            color: #7c3aed;
            font-weight: bold;
            text-align: right;
        }

        .total-aks-cell {
            background: #fff7ed;
            color: #c2410c;
            text-align: right;
        }

        .grand-total-cell {
            background: #dcfce7;
            text-align: right;
            font-weight: bold;
            color: #166534;
            font-size: 11px;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .final-total {
            background: #16a34a;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
        }

        .final-total-table { width: 100%; border: none; }
        .final-total-table td { border: none; padding: 0; vertical-align: middle; }
        .final-total-label { font-size: 14px; font-weight: bold; }
        .final-total-sublabel { font-size: 9px; margin-top: 3px; }
        .final-total-amount { font-size: 18px; font-weight: bold; text-align: right; }

        .kop-surat {
            width: 100%;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }

        .kop-logo { width: 100%; text-align: center; margin-bottom: 10px; }
        .kop-logo img {
            width: 100%;
            max-width: 100%;
            height: 120px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }

        .kop-judul { text-align: center; margin-top: 6px; }
        .judul-utama {
            font-size: 17px;
            font-weight: bold;
            color: #7c3aed;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
        }
        .judul-sub { font-size: 13px; font-weight: bold; color: #111827; margin: 0; }
    </style>
</head>

<body>
    <!-- Header -->
    <div class="kop-surat">
        <div class="kop-logo">
            <img src="{{ public_path('kop-moey.jpeg') }}" alt="MOEY Logo">
        </div>
        <div class="kop-judul">
            <div class="judul-utama">RANCANGAN ANGGARAN BIAYA KONTRAK</div>
            <div class="judul-sub">MOEY INTERIOR</div>
        </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Project:</span>
            {{ $rabKontrak->itemPekerjaan->moodboard->order->nama_project }}
        </div>
        <div class="info-row">
            <span class="info-label">Company:</span>
            {{ $rabKontrak->itemPekerjaan->moodboard->order->company_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Customer:</span>
            {{ $rabKontrak->itemPekerjaan->moodboard->order->customer_name }}
        </div>
        <div class="info-row">
            <span class="info-label">Response By:</span>
            {{ $rabKontrak->response_by }}
        </div>
        <div class="info-row">
            <span class="info-label">Response Time:</span>
            {{ \Carbon\Carbon::parse($rabKontrak->response_time)->format('d F Y H:i') }}
        </div>
    </div>

    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">Produk</th>
                <th style="width: 9%;">Bahan Baku</th>
                <th style="width: 9%;">Finishing Dalam</th>
                <th style="width: 9%;">Finishing Luar</th>
                <th class="text-center" style="width: 4%;">Qty</th>
                <th class="harga-satuan text-right" style="width: 8%;">Harga Satuan</th>
                <th class="total-item text-right" style="width: 8%;">Total Item</th>
                <th style="width: 9%;">Aksesoris</th>
                <th class="total-aks text-right" style="width: 4%;">Qty</th>
                <th class="total-aks text-right" style="width: 7%;">Harga Aks</th>
                <th class="total-aks text-right" style="width: 7%;">Total Aks</th>
                <th class="grand-total-header text-right" style="width: 8%;">Grand Total</th>
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
                @php
                    $roomSubtotal = 0;
                    foreach ($roomProduks as $rp) {
                        $rDiskon = $rp['diskon_per_produk'] ?? 0;
                        $rSebelum = ($rp['harga_satuan'] ?? 0) + ($rp['harga_total_aksesoris'] ?? 0);
                        $roomSubtotal += $rp['harga_akhir'] ?? ($rSebelum - ($rSebelum * $rDiskon / 100));
                    }
                @endphp
                <tr>
                    <td colspan="12" class="room-header">
                        <span style="float: left;">RUANGAN: {{ $roomName }} ({{ count($roomProduks) }} Produk)</span>
                        <span style="float: right;">Subtotal Ruangan: Rp {{ number_format($roomSubtotal, 0, ',', '.') }}</span>
                        <div style="clear: both;"></div>
                    </td>
                </tr>
                @foreach ($roomProduks as $index => $produk)
                @php
                    $bahanBakuNames = $produk['bahan_baku_names'] ?? [];

                    $finishingDalamItems = [];
                    $finishingLuarItems = [];

                    foreach ($produk['jenis_items'] as $jenisItem) {
                        $namaJenis = strtolower($jenisItem['nama_jenis']);
                        foreach ($jenisItem['items'] as $item) {
                            if ($namaJenis === 'finishing dalam') {
                                $finishingDalamItems[] = $item['nama_item'];
                            } elseif ($namaJenis === 'finishing luar') {
                                $finishingLuarItems[] = $item['nama_item'];
                            }
                        }
                    }

                    $totalAksesoris = 0;
                    foreach ($produk['aksesoris'] ?? [] as $aks) {
                        $totalAksesoris += $aks['harga_total'] ?? 0;
                    }

                    $diskon = $produk['diskon_per_produk'] ?? 0;
                    $hargaSebelumDiskon = ($produk['harga_satuan'] ?? 0) + ($produk['harga_total_aksesoris'] ?? 0);
                    $hargaSetelahDiskon = $produk['harga_akhir'] ?? ($hargaSebelumDiskon - ($hargaSebelumDiskon * $diskon / 100));

                    // Harga Satuan = harga_dasar + harga_finishing_dalam + harga_finishing_luar
                    $hargaSatuan = ($produk['harga_dasar'] ?? 0)
                                 + ($produk['harga_finishing_dalam'] ?? 0)
                                 + ($produk['harga_finishing_luar'] ?? 0);

                    // Total Item = original (harga_akhir - total aksesoris)
                    $totalItem = $hargaSetelahDiskon - $totalAksesoris;

                    $aksesorisData = $produk['aksesoris'] ?? [];
                    $maxRows = max(count($aksesorisData), 1);
                @endphp

                @for ($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++)
                    <tr class="{{ $index % 2 === 0 ? 'produk-row-even' : 'produk-row-odd' }}">
                        @if ($rowIndex === 0)
                            <td rowspan="{{ $maxRows }}">
                                <div class="produk-name">{{ $index + 1 }}. {{ $produk['nama_produk'] }}</div>
                                @if ($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                                    <div class="produk-dim">{{ $produk['panjang'] }} × {{ $produk['lebar'] }} ×
                                        {{ $produk['tinggi'] }} cm</div>
                                @endif
                            </td>

                            <td rowspan="{{ $maxRows }}">
                                @if (!empty($bahanBakuNames))
                                    @foreach ($bahanBakuNames as $bbName)
                                        <div>• {{ $bbName }}</div>
                                    @endforeach
                                @else
                                    <span style="color: #9ca3af;">-</span>
                                @endif
                            </td>

                            <td rowspan="{{ $maxRows }}">
                                @if (!empty($finishingDalamItems))
                                    @foreach ($finishingDalamItems as $fdItem)
                                        <div>• {{ $fdItem }}</div>
                                    @endforeach
                                @else
                                    <span style="color: #9ca3af;">-</span>
                                @endif
                            </td>

                            <td rowspan="{{ $maxRows }}">
                                @if (!empty($finishingLuarItems))
                                    @foreach ($finishingLuarItems as $flItem)
                                        <div>• {{ $flItem }}</div>
                                    @endforeach
                                @else
                                    <span style="color: #9ca3af;">-</span>
                                @endif
                            </td>

                            <td rowspan="{{ $maxRows }}" class="text-center">
                                {{ $produk['qty_produk'] }}
                            </td>
                            <td rowspan="{{ $maxRows }}" class="harga-satuan-cell">
                                Rp {{ number_format($hargaSatuan, 0, ',', '.') }}
                            </td>
                            <td rowspan="{{ $maxRows }}" class="total-item-cell">
                                Rp {{ number_format($totalItem, 0, ',', '.') }}
                            </td>
                        @endif

                        <td>
                            @if (isset($aksesorisData[$rowIndex]))
                                <div>• {{ $aksesorisData[$rowIndex]['nama_aksesoris'] }}</div>
                            @else
                                <span style="color: #9ca3af;">-</span>
                            @endif
                        </td>
                        <td class="text-right">
                            @if (isset($aksesorisData[$rowIndex]))
                                {{ $aksesorisData[$rowIndex]['qty_aksesoris'] }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="text-right">
                            @if (isset($aksesorisData[$rowIndex]))
                                Rp {{ number_format($aksesorisData[$rowIndex]['harga_satuan_aksesoris'] ?? 0, 0, ',', '.') }}
                            @else
                                -
                            @endif
                        </td>

                        @if ($rowIndex === 0)
                            <td rowspan="{{ $maxRows }}" class="total-aks-cell">
                                Rp {{ number_format($totalAksesoris, 0, ',', '.') }}
                            </td>

                            <td rowspan="{{ $maxRows }}" class="grand-total-cell">
                                Rp {{ number_format($hargaSetelahDiskon, 0, ',', '.') }}
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
                <td style="width: 60%;">
                    <div class="final-total-label">GRAND TOTAL</div>
                    <div class="final-total-sublabel">Total semua produk ({{ count($produks) }} produk • {{ count($grouped) }} ruangan)</div>
                </td>
                <td style="width: 40%;" class="final-total-amount">
                    Rp {{ number_format($totalSemuaProduk, 0, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>
</body>

</html>