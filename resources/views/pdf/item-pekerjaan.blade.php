<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Item Pekerjaan - {{ $order->nama_project }}</title>
    <style>
        @page {
            margin: 12mm 15mm 15mm 15mm;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #1e293b;
        }

        .header-kop {
            width: 100%;
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
        }

        .kop-img {
            width: 100%;
            max-height: 120px;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .doc-title {
            text-align: center;
            margin-bottom: 15px;
        }

        .doc-title h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .doc-title p {
            margin: 2px 0 0 0;
            font-size: 10px;
            color: #64748b;
        }

        .info-card {
            width: 100%;
            margin-bottom: 18px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background-color: #f8fafc;
            border-collapse: collapse;
        }

        .info-card td {
            padding: 6px 12px;
            vertical-align: top;
            font-size: 10px;
        }

        .info-label {
            font-weight: bold;
            color: #475569;
            width: 120px;
        }

        .info-value {
            color: #0f172a;
            font-weight: 600;
        }

        .ruangan-header {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: bold;
            font-size: 11px;
            padding: 8px 12px;
            margin-top: 15px;
            margin-bottom: 0;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
            word-wrap: break-word;
        }

        .item-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8.5px;
            padding: 7px 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
        }

        .item-table td {
            padding: 7px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            background-color: #ffffff;
        }

        .item-table tr:nth-child(even) td {
            background-color: #fafafa;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-muted { color: #64748b; font-style: italic; }

        .list-item {
            margin: 0;
            padding-left: 12px;
        }

        .list-item li {
            margin-bottom: 2px;
        }

        .checkbox-box {
            display: inline-block;
            width: 15px;
            height: 15px;
            border: 1.5px solid #475569;
            border-radius: 3px;
            background: #ffffff;
            margin: 3px auto;
        }

        .signature-section {
            width: 100%;
            margin-top: 30px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signature-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 10px;
        }

        .signature-space {
            height: 65px;
        }

        .footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            font-size: 8px;
            color: #94a3b8;
            text-align: right;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
        }
    </style>
</head>
<body>

    <!-- Kop Surat Kontrak -->
    <div class="header-kop">
        @if(file_exists(public_path('kop-moey.jpeg')))
            <img src="{{ public_path('kop-moey.jpeg') }}" class="kop-img" alt="Kop Surat PT. Moey Living Indonesia">
        @elseif(file_exists(public_path('images/KOP.png')))
            <img src="{{ public_path('images/KOP.png') }}" class="kop-img" alt="Kop Surat">
        @else
            <h1 style="margin:0; font-size:20px; color:#0f172a; font-weight:bold;">PT. MOEY LIVING INDONESIA</h1>
            <p style="margin:2px 0 0 0; font-size:10px; color:#64748b;">Interior Design & Architecture Contractor</p>
        @endif
    </div>

    <!-- Judul Dokumen -->
    <div class="doc-title">
        <h2>Daftar Item Pekerjaan & Checklist Spec</h2>
        <p>Dokumen Spesifikasi Detail Item Pekerjaan dan Checklist Pengecekan Lapangan</p>
    </div>

    <!-- Informasi Project -->
    <table class="info-card">
        <tr>
            <td class="info-label">Nama Project</td>
            <td class="info-value">: {{ $order->nama_project }}</td>
            <td class="info-label">Customer / Owner</td>
            <td class="info-value">: {{ $order->customer_name }}</td>
        </tr>
        <tr>
            <td class="info-label">Perusahaan</td>
            <td class="info-value">: {{ $order->company_name }}</td>
            <td class="info-label">Tanggal Export</td>
            <td class="info-value">: {{ $tanggal }}</td>
        </tr>
        @if(!empty($order->alamat))
        <tr>
            <td class="info-label">Alamat / Lokasi</td>
            <td class="info-value" colspan="3">: {{ $order->alamat }}</td>
        </tr>
        @endif
    </table>

    <!-- Loop Ruangan -->
    @foreach($ruanganGroups as $namaRuangan => $produks)
        <div class="ruangan-header">
            RUANGAN: {{ $namaRuangan }}
        </div>

        <table class="item-table">
            <thead>
                <tr>
                    <th class="text-center" style="width: 1%; white-space: nowrap; padding: 7px 4px;">No</th>
                    <th>Produk & Spesifikasi Dimensi</th>
                    <th>Finishing Dalam</th>
                    <th>Finishing Luar</th>
                    <th>Aksesoris & Qty</th>
                    <th class="text-center" style="width: 1%; white-space: nowrap; padding: 7px 6px;">Checklist</th>
                </tr>
            </thead>
            <tbody>
                @foreach($produks as $index => $prod)
                    <tr>
                        <td class="text-center font-bold" style="white-space: nowrap; padding: 7px 4px;">{{ $index + 1 }}</td>
                        <td>
                            <div class="font-bold" style="font-size: 10.5px; color: #0f172a;">
                                {{ $prod['nama_produk'] }}
                            </div>
                            <div style="font-size: 9px; color: #475569; margin-top: 3px;">
                                <strong>Jumlah:</strong> {{ $prod['quantity'] }} unit
                            </div>
                            @if($prod['panjang'] || $prod['lebar'] || $prod['tinggi'])
                                <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
                                    <strong>Dimensi:</strong> 
                                    @php
                                        $dims = [];
                                        if($prod['panjang']) $dims[] = 'P: '.$prod['panjang'].'m';
                                        if($prod['lebar']) $dims[] = 'L: '.$prod['lebar'].'m';
                                        if($prod['tinggi']) $dims[] = 'T: '.$prod['tinggi'].'m';
                                    @endphp
                                    {{ implode(' × ', $dims) }}
                                </div>
                            @endif
                        </td>
                        <td>
                            @if(count($prod['finishing_dalam']) > 0)
                                <ul class="list-item">
                                    @foreach($prod['finishing_dalam'] as $fd)
                                        <li>{{ $fd }}</li>
                                    @endforeach
                                </ul>
                            @else
                                <span class="text-muted">-</span>
                            @endif
                        </td>
                        <td>
                            @if(count($prod['finishing_luar']) > 0)
                                <ul class="list-item">
                                    @foreach($prod['finishing_luar'] as $fl)
                                        <li>{{ $fl }}</li>
                                    @endforeach
                                </ul>
                            @else
                                <span class="text-muted">-</span>
                            @endif
                        </td>
                        <td>
                            @if(count($prod['aksesoris']) > 0)
                                <ul class="list-item">
                                    @foreach($prod['aksesoris'] as $acc)
                                        <li>{{ $acc }}</li>
                                    @endforeach
                                </ul>
                            @else
                                <span class="text-muted">-</span>
                            @endif
                        </td>
                        <td class="text-center"></td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endforeach

    <!-- Section Foto BAST / Serah Terima (jika ada) -->
    @php
        $bastFotoFullPath = !empty($itemPekerjaan->bast_foto_klien) ? storage_path('app/public/' . $itemPekerjaan->bast_foto_klien) : null;
    @endphp
    @if($bastFotoFullPath && file_exists($bastFotoFullPath))
        <div style="margin-top: 25px; margin-bottom: 25px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                Dokumentasi Serah Terima Pekerjaan (Foto BAST)
            </div>
            <div style="text-align: center; background-color: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                <img src="{{ $bastFotoFullPath }}" style="max-width: 100%; max-height: 320px; height: auto; border-radius: 4px; display: inline-block;">
                @if($itemPekerjaan->bast_foto_klien_uploaded_at)
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 6px;">
                        Diupload pada: {{ \Carbon\Carbon::parse($itemPekerjaan->bast_foto_klien_uploaded_at)->translatedFormat('d F Y H:i') }} WIB
                    </div>
                @endif
            </div>
        </div>
    @endif

    <!-- Section Tanda Tangan -->
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td>
                    <p style="margin: 0; font-weight: bold; color: #334155;">Dibuat / Disiapkan Oleh,</p>
                    <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">Project Manager / Tim Operasional</p>
                    <div class="signature-space"></div>
                    <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #0f172a;">
                        ( {{ $itemPekerjaan->response_by ?? 'Tim PT. Moey Living Indonesia' }} )
                    </p>
                </td>
                <td>
                    <p style="margin: 0; font-weight: bold; color: #334155;">Disetujui / Diperiksa Oleh,</p>
                    <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">Client / Customer Representative</p>
                    <div class="signature-space"></div>
                    <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #0f172a;">
                        ( {{ $order->customer_name }} )
                    </p>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
