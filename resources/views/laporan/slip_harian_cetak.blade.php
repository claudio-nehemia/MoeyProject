<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Slip Gaji Harian</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            margin: 0;
            padding: 15px;
            background-color: #f4f4f4;
        }

        .container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: flex-start;
        }

        .slip {
            width: 310px;
            background: #fff;
            border: 1px dashed #333;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            page-break-inside: avoid;
        }

        .header {
            text-align: center;
            border-bottom: 2px double #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .title {
            font-weight: bold;
            font-size: 14px;
            margin: 0;
            text-transform: uppercase;
        }

        .company {
            font-size: 12px;
            font-weight: bold;
            margin: 3px 0;
        }

        .periode {
            font-size: 10px;
            color: #555;
        }

        .info-table,
        .rincian-table {
            width: 100%;
            margin-bottom: 8px;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 2px 0;
            font-size: 11px;
            vertical-align: top;
        }

        .rincian-table td {
            padding: 3px 0;
            font-size: 11px;
        }

        .line {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
        }

        .double-line {
            border-bottom: 2px double #000;
            margin: 6px 0;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        .section-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
            text-decoration: underline;
            text-transform: uppercase;
        }

        .total-row td {
            font-size: 13px;
            font-weight: bold;
            padding-top: 6px;
            padding-bottom: 6px;
        }

        .signature {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            text-align: center;
            font-size: 10px;
        }

        .sig-box {
            width: 45%;
        }

        .sig-space {
            height: 45px;
        }

        @media print {
            body {
                background-color: #fff;
                padding: 0;
            }

            .slip {
                box-shadow: none;
                border: 1px dashed #000;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        @foreach ($laporan_presensi as $d)
            @php
                $tanggal_presensi = $periode_dari;
                $total_denda = 0;
                $jml_hadir = 0;

                while (strtotime($tanggal_presensi) <= strtotime($periode_sampai)) {
                    if (isset($d[$tanggal_presensi])) {
                        if ($d[$tanggal_presensi]['status'] == 'h') {
                            $jml_hadir++;
                            $denda = $d[$tanggal_presensi]['denda'] ?? 0;
                            $total_denda += (int) $denda;
                        }
                    }
                    $tanggal_presensi = date('Y-m-d', strtotime('+1 day', strtotime($tanggal_presensi)));
                }

                $upah_perhari = $d['gaji_pokok'] ?? 0;
                $total_upah = $jml_hadir * $upah_perhari;
                $gaji_bersih = $total_upah - $total_denda;
            @endphp

            <div class="slip">
                <div class="header">
                    <div class="title">SLIP GAJI HARIAN</div>
                    <div class="company">{{ $generalsetting->nama_perusahaan ?? 'PT. MOEY LIVING INDONESIA' }}</div>
                    <div class="periode">Periode: {{ date('d/m/y', strtotime($periode_dari)) }} - {{ date('d/m/y', strtotime($periode_sampai)) }}</div>
                </div>

                <table class="info-table">
                    <tr>
                        <td style="width: 30%">NIK</td>
                        <td style="width: 5%">:</td>
                        <td>{{ $d['nik_show'] ?? $d['nik'] }}</td>
                    </tr>
                    <tr>
                        <td>Nama</td>
                        <td>:</td>
                        <td class="bold">{{ $d['nama_karyawan'] }}</td>
                    </tr>
                    <tr>
                        <td>Jabatan</td>
                        <td>:</td>
                        <td>{{ $d['nama_jabatan'] }} ({{ $d['kode_dept'] }})</td>
                    </tr>
                </table>

                <div class="line"></div>

                <div class="section-title">PENGHASILAN</div>
                <table class="rincian-table">
                    <tr>
                        <td>Hari Kerja (Hadir)</td>
                        <td class="text-right">{{ $jml_hadir }} Hari</td>
                    </tr>
                    <tr>
                        <td>Upah / Hari</td>
                        <td class="text-right">{{ number_format($upah_perhari, 0, ',', '.') }}</td>
                    </tr>
                    <tr class="bold">
                        <td>Total Upah</td>
                        <td class="text-right">{{ number_format($total_upah, 0, ',', '.') }}</td>
                    </tr>
                </table>

                @if ($total_denda > 0)
                    <div class="line"></div>
                    <div class="section-title">POTONGAN</div>
                    <table class="rincian-table">
                        <tr>
                            <td>Denda Keterlambatan</td>
                            <td class="text-right">{{ number_format($total_denda, 0, ',', '.') }}</td>
                        </tr>
                        <tr class="bold">
                            <td>Total Potongan</td>
                            <td class="text-right">({{ number_format($total_denda, 0, ',', '.') }})</td>
                        </tr>
                    </table>
                @endif

                <div class="double-line"></div>

                <table class="rincian-table">
                    <tr class="total-row">
                        <td class="text-left">GAJI BERSIH</td>
                        <td class="text-right">Rp {{ number_format($gaji_bersih, 0, ',', '.') }}</td>
                    </tr>
                </table>

                <div class="line"></div>

                <div class="signature">
                    <div class="sig-box">
                        <div>Diserahkan Oleh,</div>
                        <div class="sig-space"></div>
                        <div>( HRD / Keuangan )</div>
                    </div>
                    <div class="sig-box">
                        <div>Diterima Oleh,</div>
                        <div class="sig-space"></div>
                        <div class="bold">( {{ $d['nama_karyawan'] }} )</div>
                    </div>
                </div>
            </div>
        @endforeach
    </div>
</body>

</html>

