<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Approval Material PDF</title>

    <style>
        body {
            font-family: "Times New Roman", serif;
            font-size: 14px; /* Increased from 13px */
            margin: 0;
            color: #000;
        }

        .page {
            padding: 15px 25px;
            box-sizing: border-box;
        }

        .kop-surat {
            width: 100%;
            height: auto; /* Fix "gepeng" aspect ratio */
            display: block;
            margin: 0 auto 10px;
        }

        /* Info Project */
        .info-table {
            width: 100%;
            margin: 10px 0 15px;
        }
        .info-table td {
            padding: 4px 6px;
            vertical-align: top;
            font-size: 16px; /* Increased from 14px */
        }
        .info-label {
            font-weight: bold;
            width: 140px;
        }

        /* Data Table */
        .material-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px; /* Increased from 12px */
            table-layout: fixed; /* Enforce column widths */
            word-wrap: break-word;
        }

        .material-table th {
            border: 1px solid #000;
            padding: 10px 6px;
            text-align: center;
            font-weight: bold;
            background-color: #f2f2f2;
            font-size: 14px;
        }

        .material-table td {
            border: 1px solid #000;
            padding: 10px;
            vertical-align: middle;
        }

        tr { page-break-inside: avoid !important; }

        .section-header td {
            background-color: #e0e0e0;
            font-weight: bold;
            font-size: 15px;
            padding: 10px 12px;
        }

        .center { text-align: center; }

        /* Closing section */
        .footer-section {
            margin-top: 30px;
            page-break-inside: avoid; /* Keep whole footer together */
        }

        .closing-text {
            font-size: 15px;
            margin-bottom: 8px;
            color: #d32f2f;
            font-style: italic;
            font-weight: bold;
        }

        .note-text {
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid; /* Keep table rows together */
        }

        .signature-table th {
            border: 1px solid #000;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            font-size: 15px;
            background-color: #f2f2f2;
        }

        .signature-table td {
            border: 1px solid #000;
            padding: 12px;
            text-align: center;
            vertical-align: bottom;
            height: 120px; /* Increased from 100px */
            font-size: 14px;
        }

        .no-col { width: 5%; }
        .item-col { width: 17%; }
        .foto-col { width: 18%; }
        .brand-col { width: 15%; }
        .kode-col { width: 15%; }
        .area-col { width: 12%; }
        .note-col { width: 18%; }

        .foto-img {
            max-width: 100%; /* Fit to cell */
            max-height: 110px;
            display: block;
            margin: 0 auto;
            border: 1px solid #ddd;
        }
    </style>
</head>
<body>

<div class="page">
    {{-- Kop Surat --}}
    <img src="{{ public_path('kop-moey.jpeg') }}" class="kop-surat">

    {{-- Project Info --}}
    <table class="info-table">
        <tr>
            <td class="info-label">OWNER</td>
            <td>: {{ $owner }}</td>
        </tr>
        <tr>
            <td class="info-label">PROJECT</td>
            <td>: {{ $project }}</td>
        </tr>
        <tr>
            <td class="info-label">LOKASI</td>
            <td>: {{ $lokasi }}</td>
        </tr>
        <tr>
            <td class="info-label">TANGGAL</td>
            <td>: {{ $tanggal }}</td>
        </tr>
    </table>

    {{-- Tabel Material --}}
    <table class="material-table">
        <thead>
            <tr>
                <th rowspan="2" class="no-col">NO.</th>
                <th rowspan="2" class="item-col">ITEM</th>
                <th rowspan="2" class="foto-col">FOTO</th>
                <th colspan="2">SPESIFIKASI MATERIAL</th>
                <th rowspan="2" class="area-col">AREA</th>
                <th rowspan="2" class="note-col">NOTE</th>
            </tr>
            <tr>
                <th class="brand-col">BRAND/SPEK</th>
                <th class="kode-col">KODE MATERIAL</th>
            </tr>
        </thead>
        <tbody>
            {{-- ===== A. BAHAN BAKU ===== --}}
            @if($bahanBakuItems->count() > 0)
            <tr class="section-header">
                <td colspan="7">A. BAHAN BAKU</td>
            </tr>
            @foreach($bahanBakuItems as $idx => $item)
            <tr>
                <td class="center">{{ $idx + 1 }}</td>
                <td style="font-weight: bold;">{{ $item->item_name }}</td>
                <td class="center">
                    @if($item->foto)
                        <img src="{{ public_path('storage/' . $item->foto) }}" class="foto-img">
                    @else
                        <span style="color: #999;">-</span>
                    @endif
                </td>
                <td>
                    @if(is_array($item->brand_spek) && count($item->brand_spek) > 0)
                        <ul style="margin: 0; padding-left: 15px;">
                        @foreach($item->brand_spek as $bs)
                            <li>{{ $bs }}</li>
                        @endforeach
                        </ul>
                    @else
                        -
                    @endif
                </td>
                <td>
                    @if(is_array($item->kode_material) && count($item->kode_material) > 0)
                        <ul style="margin: 0; padding-left: 15px;">
                        @foreach($item->kode_material as $km)
                            <li>{{ $km }}</li>
                        @endforeach
                        </ul>
                    @else
                        -
                    @endif
                </td>
                <td>{{ $item->area ?? '-' }}</td>
                <td>{{ $item->keterangan_material ?? '-' }}</td>
            </tr>
            @endforeach
            @endif

            {{-- ===== B. FINISHING & AKSESORIS ===== --}}
            @if($finishingItems->count() > 0)
            <tr class="section-header">
                <td colspan="7">B. FINISHING & AKSESORIS</td>
            </tr>
            @foreach($finishingItems as $idx => $item)
            <tr>
                <td class="center">{{ $idx + 1 }}</td>
                <td style="font-weight: bold;">{{ $item->item_name }}</td>
                <td class="center">
                    @if($item->foto)
                        <img src="{{ public_path('storage/' . $item->foto) }}" class="foto-img">
                    @else
                        <span style="color: #999;">-</span>
                    @endif
                </td>
                <td>
                    @if(is_array($item->brand_spek) && count($item->brand_spek) > 0)
                        <ul style="margin: 0; padding-left: 15px;">
                        @foreach($item->brand_spek as $bs)
                            <li>{{ $bs }}</li>
                        @endforeach
                        </ul>
                    @else
                        -
                    @endif
                </td>
                <td>
                    @if(is_array($item->kode_material) && count($item->kode_material) > 0)
                        <ul style="margin: 0; padding-left: 15px;">
                        @foreach($item->kode_material as $km)
                            <li>{{ $km }}</li>
                        @endforeach
                        </ul>
                    @else
                        -
                    @endif
                </td>
                <td>{{ $item->area ?? '-' }}</td>
                <td>{{ $item->keterangan_material ?? '-' }}</td>
            </tr>
            @endforeach
            @endif
        </tbody>
    </table>

    {{-- Penutup & TTD Langsung di bawah tabel --}}
    <div class="footer-section">
        <p class="closing-text">
            Demikian form approval tersebut dibuat untuk disetujui dan sebagai berkas pendukung untuk tahap produksi.
        </p>

        <p class="note-text">
            <strong>Note:</strong> Material yang kami rekomendasikan adalah harga sesuai dengan penawaran. Jika ada perubahan dalam pemilihan material, maka akan disesuaikan dengan material yang dipilih
        </p>

        <table class="signature-table">
            <thead>
                <tr>
                    <th style="width: 33%;">DIBUAT OLEH</th>
                    <th style="width: 33%;">DIAJUKAN OLEH</th>
                    <th style="width: 34%;">DISETUJUI OLEH</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>
