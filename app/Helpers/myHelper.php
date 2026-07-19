<?php

function hitungjarak($lat1, $lon1, $lat2, $lon2)
{
    $theta = $lon1 - $lon2;
    $miles = (sin(deg2rad($lat1)) * sin(deg2rad($lat2))) + (cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta)));
    $miles = acos($miles);
    $miles = rad2deg($miles);
    $miles = $miles * 60 * 1.1515;
    $feet = $miles * 5280;
    $yards = $feet / 3;
    $kilometers = $miles * 1.609344;
    $meters = $kilometers * 1000;
    return compact('meters');
}

function hitungHari($startDate, $endDate)
{
    if ($startDate && $endDate) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);

        // Tambahkan 1 hari agar penghitungan inklusif
        $interval = $start->diff($end);
        $dayDifference = $interval->days + 1;

        return  $dayDifference;
    } else {
        return 0;
    }
}

function formatAngkaDesimal($nilai)
{
    if (isset($nilai) && is_numeric($nilai)) {
        return number_format($nilai, '2', ',', '.');
    }
    return $nilai;
}

function hitungpulangcepat($tanggal_presensi, $jam_out, $jam_pulang, $istirahat, $jam_awal_istirahat, $jam_akhir_istirahat, $lintashari)
{
    $tanggal = $lintashari == 1 ? date('Y-m-d', strtotime($tanggal_presensi . ' +1 day')) : $tanggal_presensi;
    $jam_awal_istirahat = $tanggal . ' ' . $jam_awal_istirahat;
    $jam_akhir_istirahat = $tanggal . ' ' . $jam_akhir_istirahat;
    $jam_pulang = $tanggal . ' ' . $jam_pulang;

    if (empty($jam_out)) {
        return 0;
    }

    if ($istirahat == 1) {
        if ($jam_out >= $jam_akhir_istirahat) {
            $j_pulang = $jam_out;
            $pengurang = 0;
        } elseif ($jam_out < $jam_awal_istirahat) {
            $j_pulang = $jam_out;
            $pengurang = 1;
        } else {
            $j_pulang = $jam_akhir_istirahat;
            $pengurang = 0;
        }
    } else {
        $j_pulang = $jam_out;
        $pengurang = 0;
    }

    if ($j_pulang < $jam_pulang) {
        $j1 = strtotime($j_pulang);
        $j2 = strtotime($jam_pulang);
        $diffpulangcepat = $j2 - $j1;

        $jam_pulangcepat = floor($diffpulangcepat / (60 * 60));
        $menit_pulangcepat = floor(($diffpulangcepat - $jam_pulangcepat * (60 * 60)) / 60);

        $jpulangcepat = $jam_pulangcepat <= 9 ? '0' . $jam_pulangcepat : $jam_pulangcepat;
        $mpulangcepat = $menit_pulangcepat <= 9 ? '0' . $menit_pulangcepat : $menit_pulangcepat;

        $keterangan_pulangcepat = $jpulangcepat . ':' . $mpulangcepat;
        $desimal_pulangcepat = $jam_pulangcepat +   ROUND(($menit_pulangcepat / 60), 2) - $pengurang;

        return $desimal_pulangcepat;
    } else {
        return 0;
    }
}

function hitungjamterlambat($jam_in, $jam_mulai)
{
    if (!empty($jam_in)) {
        if ($jam_in > $jam_mulai) {
            $j1 = strtotime($jam_mulai);
            $j2 = strtotime($jam_in);

            $diffterlambat = $j2 - $j1;

            $jamterlambat = floor($diffterlambat / (60 * 60));
            $menitterlambat = floor(($diffterlambat - $jamterlambat * (60 * 60)) / 60);

            $jterlambat = $jamterlambat <= 9 ? '0' . $jamterlambat : $jamterlambat;
            $mterlambat = $menitterlambat <= 9 ? '0' . $menitterlambat : $menitterlambat;

            $keterangan_terlambat =  $jterlambat . ':' . $mterlambat;
            $desimal_terlambat = $jamterlambat +   ROUND(($menitterlambat / 60), 2);

            $show = $desimal_terlambat < 1 ? $menitterlambat . " Menit" : formatAngkaDesimal($desimal_terlambat) . " Jam";
            return [
                'keterangan_terlambat' => $keterangan_terlambat,
                'jamterlambat' => $jamterlambat,
                'menitterlambat' => $menitterlambat,
                'desimal_terlambat' => $desimal_terlambat,
                'show' => '<span style="color:red">' . $show . '</span>',
                'show_laporan' => 'Telat :' . $show,
                'color' => 'red'
            ];
        } else {
            return [
                'menitterlambat' => 0,
                'desimal_terlambat' => 0,
                'color' => 'green',
                'show' => '<span style="color:green">Tepat Waktu</span>',
                'show_laporan' => 'Tepat Waktu'
            ];
        }
    } else {
        return null;
    }
}

function getNamaDepan($name)
{
    $words = explode(' ', $name);
    return $words[0];
}

function buatkode($nomor_terakhir, $kunci, $jumlah_karakter = 0)
{
    $nomor_baru = intval(substr($nomor_terakhir, strlen($kunci))) + 1;
    $nomor_baru_plus_nol = str_pad($nomor_baru, $jumlah_karakter, "0", STR_PAD_LEFT);
    $kode = $kunci . $nomor_baru_plus_nol;
    return $kode;
}

function getnamaHari($hari)
{
    switch ($hari) {
        case 'Sun':
            $hari_ini = "Minggu";
            break;
        case 'Mon':
            $hari_ini = "Senin";
            break;
        case 'Tue':
            $hari_ini = "Selasa";
            break;
        case 'Wed':
            $hari_ini = "Rabu";
            break;
        case 'Thu':
            $hari_ini = "Kamis";
            break;
        case 'Fri':
            $hari_ini = "Jumat";
            break;
        case 'Sat':
            $hari_ini = "Sabtu";
            break;
        default:
            $hari_ini = "Tidak di ketahui";
            break;
    }
    return $hari_ini;
}
