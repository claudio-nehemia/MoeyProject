<?php

namespace App\Services;

use App\Models\Pph21Setting;
use App\Models\Pph21FormulaKomponen;
use App\Models\Pph21TerRate;
use App\Models\Pph21ProgresifRate;
use App\Models\Pph21SlipDetail;
use App\Models\Statuskawin;
use Illuminate\Support\Facades\DB;

class Pph21Service
{
    private ?Pph21Setting $setting = null;

    public function getSetting(): Pph21Setting
    {
        if (!$this->setting) {
            $this->setting = Pph21Setting::getSetting();
        }
        return $this->setting;
    }

    /**
     * Cek apakah fitur PPh 21 aktif
     */
    public function isAktif(): bool
    {
        return (bool) $this->getSetting()->status_aktif;
    }

    /**
     * Ambil kategori TER berdasarkan kode_status_kawin
     * Mapping otomatis dari status_kawin.kategori_ter
     *
     * @param string|null $kodeStatusKawin
     * @return string 'A'|'B'|'C'
     */
    public function getKategoriTer(?string $kodeStatusKawin): string
    {
        if (!$kodeStatusKawin) return 'A'; // default jika belum diisi

        $statusKawin = Statuskawin::where('kode_status_kawin', $kodeStatusKawin)->first();
        if (!$statusKawin || !$statusKawin->kategori_ter) {
            return 'A'; // default
        }
        return strtoupper($statusKawin->kategori_ter);
    }

    /**
     * Ambil nilai PTKP per tahun dari status_kawin
     */
    public function getNilaiPtkp(?string $kodeStatusKawin): int
    {
        if (!$kodeStatusKawin) return 54000000;

        $statusKawin = Statuskawin::where('kode_status_kawin', $kodeStatusKawin)->first();
        return $statusKawin ? (int)$statusKawin->nilai_ptkp : 54000000;
    }

    /**
     * Hitung penghasilan bruto per bulan berdasarkan formula kustom.
     *
     * @param array $nilaiKomponen Contoh:
     *   [
     *     'gaji_pokok'     => 5000000,
     *     'bpjs_kesehatan' => 100000,
     *     'bpjs_tenagakerja' => 57500,
     *     'lembur'         => 200000,
     *     'tunjangan'      => ['T01' => 300000, 'T02' => 150000],
     *   ]
     * @return array ['bruto' => int, 'detail' => [...], 'pengurang' => int]
     */
    public function hitungBruto(array $nilaiKomponen): array
    {
        $komponens = Pph21FormulaKomponen::aktif()->get();

        $penambah = 0;
        $pengurang = 0;
        $detail = [];

        foreach ($komponens as $k) {
            $nilai = 0;

            switch ($k->sumber) {
                case 'gaji_pokok':
                    $nilai = (int)($nilaiKomponen['gaji_pokok'] ?? 0);
                    break;
                case 'bpjs_kesehatan':
                    $nilai = (int)($nilaiKomponen['bpjs_kesehatan'] ?? 0);
                    break;
                case 'bpjs_tenagakerja':
                    $nilai = (int)($nilaiKomponen['bpjs_tenagakerja'] ?? 0);
                    break;
                case 'lembur':
                    $nilai = (int)($nilaiKomponen['lembur'] ?? 0);
                    break;
                case 'tunjangan':
                    $tunjangans = $nilaiKomponen['tunjangan'] ?? [];
                    if ($k->kode_sumber && isset($tunjangans[$k->kode_sumber])) {
                        $nilai = (int)$tunjangans[$k->kode_sumber];
                    } elseif (!$k->kode_sumber) {
                        // Semua tunjangan jika kode_sumber kosong
                        $nilai = (int)array_sum($tunjangans);
                    }
                    break;
            }

            $detail[] = [
                'id'             => $k->id,
                'nama_komponen'  => $k->nama_komponen,
                'tipe'           => $k->tipe,
                'nilai'          => $nilai,
            ];

            if ($k->tipe === 'penambah') {
                $penambah += $nilai;
            } else {
                $pengurang += $nilai;
            }
        }

        $bruto = max(0, $penambah - $pengurang);

        return [
            'bruto'    => $bruto,
            'penambah' => $penambah,
            'pengurang'=> $pengurang,
            'detail'   => $detail,
        ];
    }

    /**
     * Ambil tarif TER dari tabel pph21_ter_rates
     *
     * @param float $bruto Penghasilan bruto bulanan
     * @param string $kategori A|B|C
     * @return float Tarif dalam persen (misal: 2.5 untuk 2.5%)
     */
    public function getTarifTer(float $bruto, string $kategori): float
    {
        $rate = Pph21TerRate::aktif()
            ->kategori($kategori)
            ->where('penghasilan_dari', '<=', $bruto)
            ->where(function ($q) use ($bruto) {
                $q->whereNull('penghasilan_sampai')
                  ->orWhere('penghasilan_sampai', '>=', $bruto);
            })
            ->orderByDesc('penghasilan_dari')
            ->first();

        return $rate ? (float)$rate->tarif_persen : 0.0;
    }

    /**
     * Hitung PPh 21 bulanan (Januari s.d. November) menggunakan metode TER
     *
     * @param float $bruto Penghasilan bruto bulanan
     * @param string $kategoriTer A|B|C
     * @return array ['pph21' => int, 'tarif_persen' => float]
     */
    public function hitungTER(float $bruto, string $kategoriTer): array
    {
        $tarif = $this->getTarifTer($bruto, $kategoriTer);
        $pph21 = (int)round($bruto * $tarif / 100);

        return [
            'pph21'        => $pph21,
            'tarif_persen' => $tarif,
        ];
    }

    /**
     * Hitung PPh 21 bulan Desember atau saat karyawan keluar (metode progresif).
     * PPh Desember = PPh setahun (Pasal 17) - total PPh sudah dipotong Jan–Nov
     *
     * @param float $totalBrutoSetahun Total penghasilan bruto selama setahun
     * @param string|null $kodeStatusKawin Kode status kawin karyawan
     * @param int $biayaJabatanPerBulan Biaya jabatan per bulan (sudah dihitung)
     * @param int $totalPphJanNov Total PPh yang sudah dipotong Jan–Nov
     * @return array ['pph21_setahun' => int, 'pph21_desember' => int, 'pkp' => int, 'biaya_jabatan' => int, 'ptkp' => int]
     */
    public function hitungDesember(
        float $totalBrutoSetahun,
        ?string $kodeStatusKawin,
        int $biayaJabatanPerBulan = 0,
        int $totalPphJanNov = 0
    ): array {
        $setting = $this->getSetting();

        // Biaya jabatan setahun (max sesuai setting)
        $biayaJabatanMax = $setting->biaya_jabatan_max_bulan * 12;
        $biayaJabatan = min(
            (int)round($totalBrutoSetahun * $setting->biaya_jabatan_persen / 100),
            $biayaJabatanMax
        );

        // Penghasilan neto setahun
        $penghasilanNeto = $totalBrutoSetahun - $biayaJabatan;

        // PTKP
        $nilaiPtkp = $this->getNilaiPtkp($kodeStatusKawin);

        // PKP (Penghasilan Kena Pajak) — tidak boleh negatif
        $pkp = max(0, $penghasilanNeto - $nilaiPtkp);

        // PPh setahun pakai tarif Pasal 17
        $pphSetahun = $this->hitungProgresif($pkp);

        // PPh Desember = PPh setahun - total sudah dipotong
        $pphDesember = max(0, $pphSetahun - $totalPphJanNov);

        return [
            'pph21_setahun'   => $pphSetahun,
            'pph21_desember'  => $pphDesember,
            'pkp'             => $pkp,
            'biaya_jabatan'   => $biayaJabatan,
            'ptkp'            => $nilaiPtkp,
            'penghasilan_neto'=> $penghasilanNeto,
        ];
    }

    /**
     * Hitung PPh berdasarkan tarif progresif Pasal 17 (dari tabel pph21_progresif_rates)
     *
     * @param int $pkp Penghasilan Kena Pajak setahun
     * @return int Total PPh terutang
     */
    public function hitungProgresif(int $pkp): int
    {
        $rates = Pph21ProgresifRate::aktif()->get();
        $totalPph = 0;
        $sisaPkp   = $pkp;

        foreach ($rates as $rate) {
            if ($sisaPkp <= 0) break;

            $dari    = (int)$rate->pkp_dari;
            $sampai  = $rate->pkp_sampai !== null ? (int)$rate->pkp_sampai : PHP_INT_MAX;
            $tarif   = (float)$rate->tarif_persen;

            if ($pkp <= $dari) continue;

            $lapisanMax   = $sampai - $dari;
            $pkpDiLapisan = min($sisaPkp, $lapisanMax);
            if ($pkpDiLapisan <= 0) continue;

            $totalPph += (int)round($pkpDiLapisan * $tarif / 100);
            $sisaPkp  -= $pkpDiLapisan;
        }

        return $totalPph;
    }

    /**
     * Hitung biaya jabatan bulanan
     */
    public function hitungBiayaJabatan(float $bruto): int
    {
        $setting = $this->getSetting();
        $bjBulanan = (int)round($bruto * $setting->biaya_jabatan_persen / 100);
        return min($bjBulanan, (int)$setting->biaya_jabatan_max_bulan);
    }

    /**
     * Hitung Gross-Up: nilai yang di-gross-up sehingga PPh ditanggung perusahaan.
     * Formula: PPh Gross-Up = PPh normal / (1 - tarif%)
     *
     * Digunakan saat metode_tanggungan = GROSS_UP
     *
     * @param int $pphNormal PPh terutang metode gross
     * @param float $tarifPersen Tarif TER yang digunakan
     * @return int Tambahan tunjangan pajak (PPh yg ditanggung perusahaan)
     */
    public function hitungGrossUp(int $pphNormal, float $tarifPersen): int
    {
        if ($tarifPersen <= 0 || $tarifPersen >= 100) return $pphNormal;
        // Tambahan tunjangan = PPh / (1 - tarif/100) - PPh
        $grossUp = ($pphNormal / (1 - $tarifPersen / 100)) - $pphNormal;
        return (int)round($grossUp);
    }

    /**
     * Entry point utama: hitung PPh 21 lengkap untuk satu karyawan satu bulan
     *
     * @param array $nilaiKomponen Data gaji karyawan
     * @param string|null $kodeStatusKawin
     * @param int $bulan 1-12
     * @param int $totalPphJanNov (untuk bulan Desember)
     * @param float $totalBrutoJanNov (untuk bulan Desember)
     * @return array Hasil perhitungan lengkap
     */
    public function hitung(
        array $nilaiKomponen,
        ?string $kodeStatusKawin,
        int $bulan,
        int $totalPphJanNov = 0,
        float $totalBrutoJanNov = 0
    ): array {
        $setting      = $this->getSetting();
        $brutoResult  = $this->hitungBruto($nilaiKomponen);
        $bruto        = $brutoResult['bruto'];
        $kategoriTer  = $this->getKategoriTer($kodeStatusKawin);
        $metode       = $setting->metode;

        $result = [
            'status_aktif'       => true,
            'metode'             => $metode,
            'metode_tanggungan'  => $setting->metode_tanggungan,
            'bruto'              => $bruto,
            'detail_komponen'    => $brutoResult['detail'],
            'kategori_ter'       => $kategoriTer,
            'tarif_ter_persen'   => 0,
            'biaya_jabatan'      => 0,
            'ptkp'               => $this->getNilaiPtkp($kodeStatusKawin),
            'pkp_setahun'        => 0,
            'pph21_terutang'     => 0,
            'pph21_ditanggung_perusahaan' => 0,
            'bulan'              => $bulan,
        ];

        if ($bulan >= 1 && $bulan <= 11) {
            // Metode TER (Jan–Nov)
            if ($metode === 'TER') {
                $ter = $this->hitungTER($bruto, $kategoriTer);
                $result['tarif_ter_persen'] = $ter['tarif_persen'];
                $result['pph21_terutang']   = $ter['pph21'];
            } else {
                // Metode progresif estimasi bulanan (anualisasi bruto)
                $brutoSetahun = $bruto * 12;
                $bj = $this->hitungBiayaJabatan($bruto) * 12;
                $ptkp = $this->getNilaiPtkp($kodeStatusKawin);
                $pkp  = max(0, $brutoSetahun - $bj - $ptkp);
                $pphSetahun = $this->hitungProgresif($pkp);
                $result['biaya_jabatan']  = (int)round($bj / 12);
                $result['pkp_setahun']    = $pkp;
                $result['pph21_terutang'] = (int)round($pphSetahun / 12);
            }
        } else {
            // Bulan Desember — hitung ulang pakai progresif
            $totalBruto = $totalBrutoJanNov + $bruto;
            $des = $this->hitungDesember($totalBruto, $kodeStatusKawin, 0, $totalPphJanNov);
            $result['biaya_jabatan']  = $des['biaya_jabatan'];
            $result['ptkp']           = $des['ptkp'];
            $result['pkp_setahun']    = $des['pkp'];
            $result['pph21_terutang'] = $des['pph21_desember'];
        }

        // Gross-Up: hitung tambahan tunjangan pajak
        if ($setting->metode_tanggungan === 'GROSS_UP' && $result['pph21_terutang'] > 0) {
            $result['pph21_ditanggung_perusahaan'] = $this->hitungGrossUp(
                $result['pph21_terutang'],
                $result['tarif_ter_persen']
            );
        }

        return $result;
    }

    /**
     * Simpan snapshot PPh 21 ke tabel pph21_slip_detail
     *
     * @param string $kodeSlipGaji
     * @param string $nik
     * @param string|null $kodeStatusKawin
     * @param array $hitungResult Hasil dari method hitung()
     */
    public function simpanSnapshot(
        string $kodeSlipGaji,
        string $nik,
        ?string $kodeStatusKawin,
        array $hitungResult
    ): void {
        Pph21SlipDetail::updateOrCreate(
            ['kode_slip_gaji' => $kodeSlipGaji, 'nik' => $nik],
            [
                'kode_status_kawin'            => $kodeStatusKawin,
                'kategori_ter'                 => $hitungResult['kategori_ter'] ?? null,
                'metode'                       => $hitungResult['metode'] ?? 'TER',
                'metode_tanggungan'            => $hitungResult['metode_tanggungan'] ?? 'GROSS',
                'penghasilan_bruto'            => $hitungResult['bruto'] ?? 0,
                'biaya_jabatan'                => $hitungResult['biaya_jabatan'] ?? 0,
                'nilai_ptkp'                   => $hitungResult['ptkp'] ?? 0,
                'pkp_setahun'                  => $hitungResult['pkp_setahun'] ?? 0,
                'tarif_ter_persen'             => $hitungResult['tarif_ter_persen'] ?? 0,
                'pph21_terutang'               => $hitungResult['pph21_terutang'] ?? 0,
                'pph21_ditanggung_perusahaan'  => $hitungResult['pph21_ditanggung_perusahaan'] ?? 0,
                'detail_komponen'              => json_encode($hitungResult['detail_komponen'] ?? []),
            ]
        );
    }

    /**
     * Ambil snapshot PPh 21 dari database (jika sudah ada)
     */
    public function getSnapshot(string $kodeSlipGaji, string $nik): ?Pph21SlipDetail
    {
        return Pph21SlipDetail::where('kode_slip_gaji', $kodeSlipGaji)
            ->where('nik', $nik)
            ->first();
    }

    /**
     * Hapus semua snapshot untuk satu slip (misal saat slip di-regenerate)
     */
    public function hapusSnapshot(string $kodeSlipGaji): void
    {
        Pph21SlipDetail::where('kode_slip_gaji', $kodeSlipGaji)->delete();
    }
}
