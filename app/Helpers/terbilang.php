<?php

if (! function_exists('terbilang')) {

    function terbilang($angka)
    {
        $angka = (int) round((float) $angka);
        $angka = abs($angka);

        $baca = [
            "",
            "Satu",
            "Dua",
            "Tiga",
            "Empat",
            "Lima",
            "Enam",
            "Tujuh",
            "Delapan",
            "Sembilan",
            "Sepuluh",
            "Sebelas"
        ];

        $terbilang = "";

        if ($angka < 12) {
            $terbilang = " " . $baca[$angka];
        } elseif ($angka < 20) {
            $terbilang = terbilang($angka - 10) . " Belas";
        } elseif ($angka < 100) {
            $terbilang = terbilang(floor($angka / 10)) . " Puluh" . terbilang($angka % 10);
        } elseif ($angka < 200) {
            $terbilang = " Seratus" . terbilang($angka - 100);
        } elseif ($angka < 1000) {
            $terbilang = terbilang(floor($angka / 100)) . " Ratus" . terbilang($angka % 100);
        } elseif ($angka < 2000) {
            $terbilang = " Seribu" . terbilang($angka - 1000);
        } elseif ($angka < 1000000) {
            $terbilang = terbilang(floor($angka / 1000)) . " Ribu" . terbilang($angka % 1000);
        } elseif ($angka < 1000000000) {
            $terbilang = terbilang(floor($angka / 1000000)) . " Juta" . terbilang($angka % 1000000);
        } elseif ($angka < 1000000000000) {
            $terbilang = terbilang(floor($angka / 1000000000)) . " Miliar" . terbilang($angka % 1000000000);
        } elseif ($angka < 1000000000000000) {
            $terbilang = terbilang(floor($angka / 1000000000000)) . " Triliun" . terbilang($angka % 1000000000000);
        }

        return trim(preg_replace('/\s+/', ' ', $terbilang));
    }
}
