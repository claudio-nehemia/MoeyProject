<?php

namespace App\Services;

use App\Models\Karyawan;
use App\Models\PayrollKasbon;
use App\Models\PayrollMonthly;
use App\Models\PayrollPositionConfig;
use App\Models\Presensi;
use App\Services\AttendanceCalculationService;
use Illuminate\Support\Facades\DB;

class PayrollCalculationService
{
    protected AttendanceCalculationService $attendanceService;

    public function __construct(?AttendanceCalculationService $attendanceService = null)
    {
        $this->attendanceService = $attendanceService ?? app(AttendanceCalculationService::class);
    }
    /**
     * Generate slip gaji untuk satu karyawan pada bulan/tahun tertentu.
     * Logika: Divisi → Jabatan → PayrollPositionConfig → hitung semua komponen.
     */
    public function generateSlip(
        string $nik,
        int $bulan,
        int $tahun,
        ?int $configId = null,
        ?array $overrides = []
    ): PayrollMonthly {
        $karyawan = Karyawan::where('nik', $nik)->firstOrFail();

        // Cari config berdasarkan jabatan karyawan, atau pakai configId yang diberikan
        $config = $configId
            ? PayrollPositionConfig::findOrFail($configId)
            : $this->findConfigForKaryawan($karyawan);

        if (!$config) {
            throw new \Exception("Tidak ditemukan konfigurasi payroll untuk karyawan {$nik}");
        }

        // Hitung hari hadir dari presensi
        $hariHadir = $overrides['hari_hadir'] ?? $this->getHariHadir($nik, $bulan, $tahun);
        $hariKerja = $overrides['hari_kerja'] ?? $config->hari_kerja_default;

        // Capaian omzet (dari input manual/overrides, atau auto-tarik dari RAB Internal)
        if (isset($overrides['capaian_omzet_internal']) || isset($overrides['capaian_omzet_eksternal'])) {
            $omzetInternal = (int) ($overrides['capaian_omzet_internal'] ?? 0);
            $omzetExternal = (int) ($overrides['capaian_omzet_eksternal'] ?? 0);
        } else {
            $rabOmzet = $this->getOmzetFromRabInternal($nik, $bulan, $tahun);
            $omzetInternal = $rabOmzet['internal'];
            $omzetExternal = $rabOmzet['eksternal'];
        }
        $totalOmzet = $omzetInternal + $omzetExternal;

        // Jumlah CF yang masuk bulan ini (dari overrides/input manual, atau auto-tarik dari tabel commitment_fees sesuai porsi jabatan)
        if (isset($overrides['jumlah_cf'])) {
            $jumlahCF = (int) $overrides['jumlah_cf'];
        } else {
            $jumlahCF = $this->getCommitmentFeeCount($nik, $bulan, $tahun, $config);
        }

        // Hitung semua komponen
        $gajiPokok = $this->calculateGajiPokok($config, $hariKerja);
        // Evaluasi Tunjangan Jabatan (apakah total omzet internal perusahaan >= 900 juta sesuai Excel P3)
        $companyOmzetInternal = $this->getCompanyTotalInternalOmzet($bulan, $tahun);
        $tunjanganJabatan = $this->calculateTunjanganJabatan($config, $totalOmzet, $companyOmzetInternal);
        $transportasi = $this->calculateTransportasi($config, $hariHadir);
        $makan = $this->calculateMakan($config, $hariHadir);
        $kehadiran = $this->calculateKehadiran($config, $hariHadir);
        $komisiCF = $this->calculateKomisiCF($config, $jumlahCF);

        // 1. Komisi DP: dievaluasi dinamis terhadap min_omzet_komisi_dp posisi
        $komisiDP = $this->calculateKomisiDP($config, $omzetInternal, $omzetExternal);

        // 2. Komisi Pelunasan (dari overrides/input manual, atau auto-tarik dari invoices pelunasan)
        if (isset($overrides['komisi_pelunasan'])) {
            $komisiPelunasan = (int) $overrides['komisi_pelunasan'];
        } else {
            $komisiPelunasan = $this->getKomisiPelunasanFromInvoices($nik, $bulan, $tahun, $config);
        }

        // 3. Capaian Project Progress & Kinerja
        $capaianProjectPersen = isset($overrides['capaian_project_persen']) 
            ? (float) $overrides['capaian_project_persen']
            : (isset($overrides['timeline_score']) ? (float) $overrides['timeline_score'] : $this->getTimelineScoreFromSystem($nik, $bulan, $tahun));

        // Syarat minimum bobot success project sesuai jabatan di sheet (50%, 70%, atau 75%)
        $minProjectSuccess = $config->min_success_project_persen > 0 ? (float) $config->min_success_project_persen : 50.0;

        // Komisi Success Project (sesuai tier jabatan di sheet)
        if (isset($overrides['komisi_success_project'])) {
            $komisiSuccessProject = (int) $overrides['komisi_success_project'];
        } else {
            $komisiSuccessProject = 0;
            if ($capaianProjectPersen >= $minProjectSuccess) {
                if ($config->komisi_success_persen_internal > 0) {
                    $komisiSuccessProject = (int) round($omzetInternal * $config->komisi_success_persen_internal * ($config->komisi_success_bayar_persen / 100));
                } elseif ($capaianProjectPersen >= 70.0) {
                    $komisiSuccessProject = (int) round($omzetInternal * 0.002);
                } elseif ($capaianProjectPersen >= 50.0) {
                    $komisiSuccessProject = (int) round($omzetInternal * 0.001);
                }
            }
        }

        // 4. Achievement Omzet (dievaluasi dinamis terhadap min_omzet_achievement posisi di sheet)
        $achievementOmzet = $this->calculateAchievementOmzet($config, $totalOmzet);

        // 5. Achievement Pelaksanaan / Success Project
        if (isset($overrides['achievement_pelaksanaan'])) {
            $achievementPelaksanaan = (int) $overrides['achievement_pelaksanaan'];
        } else {
            $achievementPelaksanaan = 0;
            if ($capaianProjectPersen >= $minProjectSuccess) {
                if ($config->achievement_pelaksanaan_persen > 0) {
                    $achievementPelaksanaan = (int) round($omzetInternal * $config->achievement_pelaksanaan_persen);
                } elseif ($config->achievement_fixed > 0 && $capaianProjectPersen >= 75.0) {
                    $achievementPelaksanaan = $config->achievement_fixed;
                }
            }
        }

        // Subtotals
        $totalDiluarKomisi = $gajiPokok + $tunjanganJabatan + $transportasi + $makan + $kehadiran;
        $totalCF = $komisiCF;
        $totalKomisiAchievement = $komisiDP + $komisiPelunasan + $komisiSuccessProject + $achievementOmzet + $achievementPelaksanaan;

        // Kasbon
        $kasbon = $this->getKasbon($nik);

        // Total diterima
        $totalDiterima = $totalDiluarKomisi + $totalCF + $totalKomisiAchievement - $kasbon;

        // Timeline Score
        $timelineScore = isset($overrides['timeline_score'])
            ? (float) $overrides['timeline_score']
            : $this->getTimelineScoreFromSystem($nik, $bulan, $tahun);

        // KPI
        $kpiResult = $this->calculateKPI($config, [
            'omzet_internal' => $omzetInternal,
            'omzet_eksternal' => $omzetExternal,
            'min_target_internal' => $config->min_omzet_komisi_dp,
            'jumlah_cf' => $jumlahCF,
            'cf_target' => $config->cf_max_per_bulan,
            'hari_hadir' => $hariHadir,
            'hari_kerja' => $hariKerja,
            'timeline_score' => $timelineScore,
        ]);

        // Simpan atau update
        return PayrollMonthly::updateOrCreate(
            [
                'nik' => $nik,
                'bulan' => $bulan,
                'tahun' => $tahun,
            ],
            [
                'payroll_position_config_id' => $config->id,
                'hari_kerja' => $hariKerja,
                'hari_hadir' => $hariHadir,
                'capaian_omzet_internal' => $omzetInternal,
                'capaian_omzet_eksternal' => $omzetExternal,
                'gaji_pokok' => $gajiPokok,
                'tunjangan_jabatan' => $tunjanganJabatan,
                'transportasi' => $transportasi,
                'makan' => $makan,
                'kehadiran' => $kehadiran,
                'komisi_cf' => $komisiCF,
                'komisi_dp' => $komisiDP,
                'komisi_pelunasan' => $komisiPelunasan,
                'komisi_success_project' => $komisiSuccessProject,
                'achievement_omzet' => $achievementOmzet,
                'achievement_pelaksanaan' => $achievementPelaksanaan,
                'total_pendapatan_diluar_komisi' => $totalDiluarKomisi,
                'total_pendapatan_cf' => $totalCF,
                'total_pendapatan_komisi_achievement' => $totalKomisiAchievement,
                'kasbon' => $kasbon,
                'total_diterima' => $totalDiterima,
                'kpi_skor' => $kpiResult['skor'],
                'kpi_status' => $kpiResult['status'],
                'kpi_detail' => $kpiResult['detail'],
                'status' => 'draft',
                'generated_by' => auth()->id(),
            ]
        );
    }

    /**
     * Generate slip gaji untuk semua karyawan aktif
     */
    public function generateAll(int $bulan, int $tahun, array $omzetData = []): array
    {
        $karyawanList = Karyawan::where(function ($q) {
                $q->whereNull('tanggal_nonaktif')
                  ->orWhere('tanggal_nonaktif', '>', now());
            })
            ->where(function ($q) {
                $q->where('status_aktif_karyawan', '1')
                  ->orWhereNull('status_aktif_karyawan');
            })
            ->get();

        $results = [];
        $errors = [];

        foreach ($karyawanList as $karyawan) {
            try {
                $overrides = $omzetData[$karyawan->nik] ?? [];
                $slip = $this->generateSlip($karyawan->nik, $bulan, $tahun, null, $overrides);
                $results[] = $slip;
            } catch (\Exception $e) {
                $errors[] = [
                    'nik' => $karyawan->nik,
                    'nama' => $karyawan->nama_lengkap ?? $karyawan->nik,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return ['slips' => $results, 'errors' => $errors];
    }

    // ==========================================
    // KOMPONEN PERHITUNGAN
    // ==========================================

    /**
     * Gaji Pokok = gaji_pokok_harian × hari_kerja
     * Untuk Staff Drafter: Rp 76.923/hari × 26 = Rp 2.000.000 + Rp 1.000.000 bonus = Rp 3.000.000
     * Untuk jabatan lain: gaji_pokok langsung (biasanya Rp 2.000.000)
     */
    public function calculateGajiPokok(PayrollPositionConfig $config, int $hariKerja): int
    {
        if ($config->gaji_pokok > 0) {
            return $config->gaji_pokok;
        }
        return (int) round($config->gaji_pokok_harian * $hariKerja);
    }

    /**
     * Tunjangan Jabatan — conditional berdasarkan omzet
     * Contoh: Manager Design dapat Rp 2.000.000 jika omzet > 900 juta
     * GM Design dapat Rp 3.000.000 jika omzet > 900 juta
     */
    public function calculateTunjanganJabatan(PayrollPositionConfig $config, int $totalOmzet, int $companyOmzetInternal = 0): int
    {
        if ($config->tunjangan_jabatan <= 0) {
            return 0;
        }

        // Jika ada kondisi minimum omzet (di Excel rumus: =IF($AQ$5 <= $P$3, 0, 2000000)
        // dimana AQ5 adalah total omzet internal perusahaan
        if ($config->tunjangan_jabatan_condition === 'omzet_min' && $config->tunjangan_jabatan_min_omzet > 0) {
            $evalOmzet = $companyOmzetInternal > 0 ? $companyOmzetInternal : $totalOmzet;
            if ($evalOmzet < $config->tunjangan_jabatan_min_omzet) {
                return 0;
            }
        }

        return $config->tunjangan_jabatan;
    }

    /**
     * Transportasi = transportasi_harian × hari_hadir
     */
    public function calculateTransportasi(PayrollPositionConfig $config, int $hariHadir): int
    {
        return $config->transportasi_harian * $hariHadir;
    }

    /**
     * Makan = makan_harian × hari_hadir
     */
    public function calculateMakan(PayrollPositionConfig $config, int $hariHadir): int
    {
        return $config->makan_harian * $hariHadir;
    }

    /**
     * Kehadiran = kehadiran_harian × hari_hadir
     * "Sifatnya bonus, berlaku apabila karyawan mengusahakan hadir tepat waktu"
     */
    public function calculateKehadiran(PayrollPositionConfig $config, int $hariHadir): int
    {
        return $config->kehadiran_harian * $hariHadir;
    }

    /**
     * Komisi CF = cf_per_client × jumlah CF yang masuk bulan ini
     * Staff Drafter: CF 4 kali/bulan, Manager: CF 2x mandiri + team, dst
     */
    public function calculateKomisiCF(PayrollPositionConfig $config, int $jumlahCF): int
    {
        return $config->cf_per_client * $jumlahCF;
    }

    /**
     * Komisi atas DP:
     * Total Omzet dikalikan fee %, lalu dibayarkan sebagian (30/50/70%)
     * 
     * Formula Excel: =AQ8*70% dimana AQ8 = IF(omzet >= min, total_fee_internal + total_fee_external, 0)
     * total_fee_internal = omzet_internal × komisi_dp_persen_internal
     * total_fee_external = omzet_external × komisi_dp_persen_eksternal
     */
    public function calculateKomisiDP(PayrollPositionConfig $config, int $omzetInternal, int $omzetExternal): int
    {
        $totalOmzet = $omzetInternal + $omzetExternal;

        // Cek minimum omzet
        if ($config->min_omzet_komisi_dp > 0 && $totalOmzet < $config->min_omzet_komisi_dp) {
            return 0;
        }

        $feeInternal = $omzetInternal * $config->komisi_dp_persen_internal;
        $feeExternal = $omzetExternal * $config->komisi_dp_persen_eksternal;
        $totalFee = $feeInternal + $feeExternal;

        // Dibayarkan sebagian (e.g. 70%)
        $bayar = $totalFee * ($config->komisi_dp_bayar_persen / 100);

        return (int) round($bayar);
    }

    /**
     * Achievement Omzet:
     * Jika total omzet >= min_omzet_achievement → omzet × achievement_rate
     * Atau jika achievement_fixed > 0 dan omzet >= target → bayar fixed
     */
    public function calculateAchievementOmzet(PayrollPositionConfig $config, int $totalOmzet): int
    {
        if ($config->min_omzet_achievement > 0 && $totalOmzet < $config->min_omzet_achievement) {
            return 0;
        }

        // Fixed achievement (e.g. Rp 2.000.000 untuk SPV Eksternal)
        if ($config->achievement_fixed > 0) {
            return $config->achievement_fixed;
        }

        // Rate-based achievement
        if ($config->achievement_rate > 0) {
            return (int) round($totalOmzet * $config->achievement_rate);
        }

        return 0;
    }

    /**
     * KPI Calculation
     * Menghitung skor KPI berdasarkan bobot komponen dan capaian
     */
    public function calculateKPI(PayrollPositionConfig $config, array $data): array
    {
        $kpiConfigs = $config->kpiConfigs;
        $detail = [];
        $totalSkor = 0;

        foreach ($kpiConfigs as $kpi) {
            $capaian = 0;

            switch ($kpi->komponen) {
                case 'omzet':
                case 'omzet_mandiri':
                    $target = $data['min_target_internal'] ?: 1;
                    $omzet = $data['omzet_internal'] + $data['omzet_eksternal'];
                    $capaian = min(100, ($omzet / $target) * 100);
                    break;

                case 'omzet_team':
                    // Untuk sementara pakai score dari input
                    $capaian = $data['timeline_score'] ?? 100;
                    break;

                case 'cf':
                case 'cf_mandiri':
                    $target = $data['cf_target'] ?: 1;
                    $capaian = min(100, ($data['jumlah_cf'] / $target) * 100);
                    break;

                case 'cf_team':
                    $capaian = $data['timeline_score'] ?? 100;
                    break;

                case 'absensi':
                    $hariKerja = $data['hari_kerja'] ?: 26;
                    $capaian = ($data['hari_hadir'] / $hariKerja) * 100;
                    break;

                case 'timeline':
                    // Timeline score dari project tracking (untuk sementara dari input)
                    $capaian = $data['timeline_score'] ?? 100;
                    break;

                case 'team':
                    // Pencapaian team, sementara dari input
                    $capaian = $data['timeline_score'] ?? 100;
                    break;
            }

            $skorKomponen = ($kpi->bobot / 100) * $capaian;
            $totalSkor += $skorKomponen;

            $detail[] = [
                'komponen' => $kpi->komponen,
                'bobot' => $kpi->bobot,
                'capaian' => round($capaian, 2),
                'skor' => round($skorKomponen, 2),
            ];
        }

        $totalSkor = round($totalSkor, 2);

        return [
            'skor' => $totalSkor,
            'status' => PayrollMonthly::getKpiStatus($totalSkor),
            'detail' => $detail,
        ];
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Cari config payroll berdasarkan jabatan karyawan secara cerdas dan fleksibel.
     */
    public function findConfigForKaryawan(Karyawan $karyawan): ?PayrollPositionConfig
    {
        // 1. Coba match langsung by kode_jabatan
        if ($karyawan->kode_jabatan) {
            $config = PayrollPositionConfig::where('kode_jabatan', $karyawan->kode_jabatan)
                ->where('is_active', true)
                ->first();
            if ($config) return $config;
        }

        $configs = PayrollPositionConfig::where('is_active', true)->get();
        if ($configs->isEmpty()) {
            return null;
        }

        // 2. Coba match by nama_jabatan karyawan
        $rawNamaJabatan = $karyawan->jabatan?->nama_jabatan ?? '';
        $namaJabatan = strtolower($rawNamaJabatan);

        if (!empty($namaJabatan)) {
            // Pemetaan kata kunci spesifik
            if (str_contains($namaJabatan, 'drafter')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'DFT' || str_contains(strtolower($c->jabatan), 'drafter'));
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'design') || str_contains($namaJabatan, 'desain')) {
                if (str_contains($namaJabatan, 'gm') || str_contains($namaJabatan, 'general')) {
                    $found = $configs->first(fn($c) => $c->kode_jabatan === 'GMD');
                    if ($found) return $found;
                } elseif (str_contains($namaJabatan, 'manager') || str_contains($namaJabatan, 'manajer')) {
                    $found = $configs->first(fn($c) => $c->kode_jabatan === 'MDS');
                    if ($found) return $found;
                } else {
                    $found = $configs->first(fn($c) => $c->kode_jabatan === 'DSG' || str_contains(strtolower($c->jabatan), 'design'));
                    if ($found) return $found;
                }
            }
            if (str_contains($namaJabatan, 'marketing') || str_contains($namaJabatan, 'sales')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'MMK' || str_contains(strtolower($c->jabatan), 'marketing'));
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'estimator')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'GME' || str_contains(strtolower($c->jabatan), 'estimator'));
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'legal') || str_contains($namaJabatan, 'finance') || str_contains($namaJabatan, 'keuangan')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'MLF' || str_contains(strtolower($c->jabatan), 'legal') || str_contains(strtolower($c->jabatan), 'finance'));
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'busdev') || str_contains($namaJabatan, 'business') || str_contains($namaJabatan, 'bisnis')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'MBD');
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'project manager') || str_contains($namaJabatan, 'pm')) {
                $found = $configs->first(fn($c) => $c->kode_jabatan === 'PJM');
                if ($found) return $found;
            }
            if (str_contains($namaJabatan, 'supervisor') || str_contains($namaJabatan, 'spv')) {
                if (str_contains($namaJabatan, 'eksternal') || str_contains($namaJabatan, 'external')) {
                    $found = $configs->first(fn($c) => $c->kode_jabatan === 'SPE');
                    if ($found) return $found;
                } else {
                    $found = $configs->first(fn($c) => $c->kode_jabatan === 'SPI');
                    if ($found) return $found;
                }
            }

            // Fuzzy string matching
            foreach ($configs as $cfg) {
                $cfgName = strtolower($cfg->jabatan);
                if (str_contains($cfgName, $namaJabatan) || str_contains($namaJabatan, $cfgName)) {
                    return $cfg;
                }
            }
        }

        // 3. Fallback cerdas jika jabatan karyawan belum ada konfigurasinya
        return $configs->first(fn($c) => $c->kode_jabatan === 'DSG') 
            ?? $configs->first(fn($c) => $c->kode_jabatan === 'DFT') 
            ?? $configs->first();
    }

    /**
     * Hitung hari hadir dari tabel presensi (menggunakan AttendanceCalculationService)
     */
    public function getHariHadir(string $nik, int $bulan, int $tahun): int
    {
        try {
            $summary = $this->attendanceService->getMonthlyAttendanceSummary($nik, $bulan, $tahun);
            return $summary['hari_hadir'];
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Ambil total kasbon aktif karyawan (cicilan per bulan)
     */
    protected function getKasbon(string $nik): int
    {
        return (int) PayrollKasbon::where('nik', $nik)
            ->where('status', 'aktif')
            ->sum('cicilan_per_bulan');
    }

    /**
     * Hitung omzet internal & eksternal dari RAB Internal berdasarkan project-project
     * yang ditugaskan ke karyawan (via order_teams atau created_by).
     */
    public function getOmzetFromRabInternal(string $nik, ?int $bulan = null, ?int $tahun = null): array
    {
        $karyawan = Karyawan::where('nik', trim($nik))->first();
        if (!$karyawan) {
            return ['internal' => 0, 'eksternal' => 0, 'details' => []];
        }

        $userId = $karyawan->user_id;
        $orderIds = collect();

        if ($userId) {
            $assignedOrders = DB::table('order_teams')
                ->where('user_id', $userId)
                ->pluck('order_id');
            $createdOrders = DB::table('orders')
                ->where('created_by', $userId)
                ->pluck('id');
            $orderIds = $assignedOrders->merge($createdOrders)->unique()->values();
        }

        if ($orderIds->isEmpty()) {
            return ['internal' => 0, 'eksternal' => 0, 'details' => []];
        }

        $query = \App\Models\RabInternal::whereHas('itemPekerjaan.moodboard', function ($q) use ($orderIds) {
            $q->whereIn('order_id', $orderIds);
        })->with([
            'itemPekerjaan.moodboard.order',
            'rabProduks.itemPekerjaanProduk.produk'
        ]);

        if ($bulan && $tahun) {
            $query->where(function ($q) use ($bulan, $tahun) {
                $q->whereMonth('submitted_at', $bulan)->whereYear('submitted_at', $tahun)
                  ->orWhere(function ($sub) use ($bulan, $tahun) {
                      $sub->whereNull('submitted_at')
                          ->whereMonth('created_at', $bulan)
                          ->whereYear('created_at', $tahun);
                  });
            });
        }

        $rabs = $query->get();
        $totalInternal = 0;
        $totalEksternal = 0;
        $details = [];

        foreach ($rabs as $rab) {
            $order = $rab->itemPekerjaan?->moodboard?->order;
            $orderName = $order ? $order->nama_project : ('Order #' . $rab->id);
            $orderInternal = 0;
            $orderEksternal = 0;

            foreach ($rab->rabProduks as $rp) {
                $cat = strtolower($rp->itemPekerjaanProduk?->produk?->kategori ?? 'internal');
                $harga = (float) $rp->harga_akhir;

                if ($cat === 'eksternal') {
                    $orderEksternal += $harga;
                } else {
                    $orderInternal += $harga;
                }
            }

            $totalInternal += $orderInternal;
            $totalEksternal += $orderEksternal;

            $details[] = [
                'order_id' => $order?->id,
                'project_name' => $orderName,
                'internal' => (int) round($orderInternal),
                'eksternal' => (int) round($orderEksternal),
            ];
        }

        return [
            'internal' => (int) round($totalInternal),
            'eksternal' => (int) round($totalEksternal),
            'details' => $details,
        ];
    }

    /**
     * Hitung total omzet internal seluruh perusahaan pada periode berjalan
     * (Sesuai cell AQ5 di Excel untuk syarat Tunjangan Jabatan min. Rp 900.000.000)
     */
    public function getCompanyTotalInternalOmzet(?int $bulan = null, ?int $tahun = null): int
    {
        $query = \App\Models\RabInternal::with(['rabProduks.itemPekerjaanProduk.produk']);

        if ($bulan && $tahun) {
            $query->where(function ($q) use ($bulan, $tahun) {
                $q->whereMonth('submitted_at', $bulan)->whereYear('submitted_at', $tahun)
                  ->orWhere(function ($sub) use ($bulan, $tahun) {
                      $sub->whereNull('submitted_at')
                          ->whereMonth('created_at', $bulan)
                          ->whereYear('created_at', $tahun);
                  });
            });
        }

        $rabs = $query->get();
        $total = 0;
        foreach ($rabs as $rab) {
            foreach ($rab->rabProduks as $rp) {
                $cat = strtolower($rp->itemPekerjaanProduk?->produk?->kategori ?? 'internal');
                if ($cat !== 'eksternal') {
                    $total += (float) $rp->harga_akhir;
                }
            }
        }
        return (int) round($total);
    }

    /**
     * Hitung total deal Commitment Fee (CF) yang selesai di perusahaan pada periode berjalan
     * (Sesuai tabel Komposisi CF Rp 5.000.000 per client yang dibagikan ke masing-masing jabatan)
     */
    public function getCompanyCommitmentFeeCount(?int $bulan = null, ?int $tahun = null): int
    {
        $query = DB::table('commitment_fees')
            ->where('payment_status', 'completed');

        if ($bulan && $tahun) {
            $query->where(function ($q) use ($bulan, $tahun) {
                $q->whereMonth('created_at', $bulan)
                  ->whereYear('created_at', $tahun);
            });
        }

        return $query->count();
    }

    /**
     * Hitung jumlah Commitment Fee (CF) untuk karyawan berdasarkan komposisi jabatannya.
     * Komposisi CF di Excel dihitung per JABATAN (dari pool Rp 5.000.000 per client), bukan perorangan order.
     * Jika jabatan berhak atas alokasi CF (cf_per_client > 0), maka mendapatkan deal CF perusahaan.
     */
    public function getCommitmentFeeCount(string $nik, ?int $bulan = null, ?int $tahun = null, ?PayrollPositionConfig $config = null): int
    {
        if (!$config) {
            $karyawan = Karyawan::where('nik', trim($nik))->first();
            if ($karyawan && $karyawan->kode_jabatan) {
                $config = PayrollPositionConfig::where('kode_jabatan', $karyawan->kode_jabatan)->first();
            }
        }

        // Jika jabatan ini tidak memiliki alokasi Komposisi CF (cf_per_client <= 0)
        if ($config && $config->cf_per_client <= 0) {
            return 0;
        }

        // Deal CF dihitung dari jumlah CF perusahaan yang completed pada bulan berjalan
        $companyCount = $this->getCompanyCommitmentFeeCount($bulan, $tahun);

        // Jika ada batas maksimal per bulan di config jabatan
        if ($config && $config->cf_max_per_bulan > 0) {
            return min($companyCount, $config->cf_max_per_bulan);
        }

        return $companyCount;
    }

    /**
     * Hitung komisi pelunasan project dari invoice pelunasan yang paid
     */
    public function getKomisiPelunasanFromInvoices(string $nik, ?int $bulan = null, ?int $tahun = null, ?PayrollPositionConfig $config = null): int
    {
        $karyawan = Karyawan::where('nik', trim($nik))->first();
        if (!$karyawan || !$karyawan->user_id) {
            return 0;
        }

        $userId = $karyawan->user_id;
        $orderIds = DB::table('order_teams')
            ->where('user_id', $userId)
            ->pluck('order_id');

        if ($orderIds->isEmpty()) {
            return 0;
        }

        $query = DB::table('invoices')
            ->join('item_pekerjaans', 'invoices.item_pekerjaan_id', '=', 'item_pekerjaans.id')
            ->join('moodboards', 'item_pekerjaans.moodboard_id', '=', 'moodboards.id')
            ->whereIn('moodboards.order_id', $orderIds)
            ->where('invoices.status', 'paid')
            ->where(function ($q) {
                $q->where('invoices.termin_step', '>', 1)
                  ->orWhere('invoices.termin_text', 'ILIKE', '%pelunasan%');
            });

        if ($bulan && $tahun) {
            $query->where(function ($q) use ($bulan, $tahun) {
                $q->whereMonth('invoices.paid_at', $bulan)
                  ->whereYear('invoices.paid_at', $tahun);
            });
        }

        $totalPelunasanPaid = (float) $query->sum('invoices.total_amount');

        if ($config && $totalPelunasanPaid > 0) {
            $rateInternal = $config->komisi_dp_persen_internal;
            $bayarPersen = (100 - $config->komisi_dp_bayar_persen) / 100;
            return (int) round($totalPelunasanPaid * $rateInternal * $bayarPersen);
        }

        return 0;
    }

    /**
     * Hitung skor Timeline & Kualitas dari task responses & defects
     */
    public function getTimelineScoreFromSystem(string $nik, ?int $bulan = null, ?int $tahun = null): float
    {
        $karyawan = Karyawan::where('nik', trim($nik))->first();
        if (!$karyawan || !$karyawan->user_id) {
            return 100.0;
        }

        $userId = $karyawan->user_id;
        $tasks = DB::table('task_responses')->where('user_id', $userId);

        if ($bulan && $tahun) {
            $tasks->whereMonth('created_at', $bulan)->whereYear('created_at', $tahun);
        }

        $totalTasks = $tasks->count();
        if ($totalTasks === 0) {
            return 100.0;
        }

        $lateTasks = (clone $tasks)->where('status', 'telat_submit')->count();
        $score = max(50.0, 100.0 - ($lateTasks * 10.0));

        return round($score, 2);
    }

    /**
     * Ambil seluruh data sistem untuk satu karyawan secara terpadu
     */
    public function getAllSystemDataForKaryawan(string $nik, int $bulan, int $tahun, ?int $configId = null): array
    {
        $karyawan = Karyawan::where('nik', trim($nik))->firstOrFail();
        $config = $configId
            ? PayrollPositionConfig::find($configId)
            : $this->findConfigForKaryawan($karyawan);

        $rabOmzet = $this->getOmzetFromRabInternal($nik, $bulan, $tahun);
        $hariHadir = $this->getHariHadir($nik, $bulan, $tahun);
        $jumlahCF = $this->getCommitmentFeeCount($nik, $bulan, $tahun, $config);
        $komisiPelunasan = $this->getKomisiPelunasanFromInvoices($nik, $bulan, $tahun, $config);
        $timelineScore = $this->getTimelineScoreFromSystem($nik, $bulan, $tahun);
        $kasbon = PayrollKasbon::where('nik', trim($nik))->where('status', 'aktif')->first();

        return [
            'nik' => trim($nik),
            'hari_kerja' => $config?->hari_kerja_default ?? 26,
            'hari_hadir' => $hariHadir,
            'capaian_omzet_internal' => $rabOmzet['internal'],
            'capaian_omzet_eksternal' => $rabOmzet['eksternal'],
            'rab_details' => $rabOmzet['details'] ?? [],
            'jumlah_cf' => $jumlahCF,
            'komisi_pelunasan' => $komisiPelunasan,
            'timeline_score' => $timelineScore,
            'kasbon_cicilan' => $kasbon ? $kasbon->cicilan_per_bulan : 0,
            'kasbon_total' => $kasbon ? $kasbon->total_kasbon : 0,
        ];
    }

    /**
     * Hitung gaji sementara (monitoring harian berjalan s/d hari ini)
     */
    public function calculateRunningSalary(string $nik, int $bulan, int $tahun): array
    {
        $karyawan = Karyawan::where('nik', trim($nik))->first();
        if (!$karyawan) {
            return [
                'has_config' => false,
                'total_sementara' => 0,
                'hari_hadir' => 0,
            ];
        }

        $config = $this->findConfigForKaryawan($karyawan);
        $hariKerjaDefault = $config ? ($config->hari_kerja_default ?? 26) : 26;

        // 1. Kehadiran aktual s/d hari ini dari AttendanceCalculationService
        $attendance = $this->attendanceService->getMonthlyAttendanceSummary($nik, $bulan, $tahun, $hariKerjaDefault);
        $hariHadir = $attendance['hari_hadir'];

        if (!$config) {
            return [
                'has_config' => false,
                'total_sementara' => 0,
                'hari_hadir' => $hariHadir,
                'hari_tepat_waktu' => $attendance['hari_tepat_waktu'],
                'hari_terlambat' => $attendance['hari_terlambat'],
                'hari_izin' => $attendance['hari_izin'],
                'hari_sakit' => $attendance['hari_sakit'],
                'hari_alpha' => $attendance['hari_alpha'],
                'perfect_attendance' => $attendance['perfect_attendance'],
                'hari_kerja_default' => $hariKerjaDefault,
            ];
        }

        // 2. Operasional harian berjalan (Uang makan, Transportasi, Kehadiran)
        $transportasi = $hariHadir * $config->transportasi_harian;
        $makan = $hariHadir * $config->makan_harian;
        $kehadiran = $hariHadir * $config->kehadiran_harian;
        $totalOperasional = $transportasi + $makan + $kehadiran;

        // 3. Gaji Pokok (prorata hari hadir s/d hari ini atau fixed harian)
        $gajiPokokHarian = $config->gaji_pokok_harian > 0 
            ? $config->gaji_pokok_harian 
            : ($config->gaji_pokok / max(1, $hariKerjaDefault));
        $gajiPokokBerjalan = (int) round($hariHadir * $gajiPokokHarian);

        // 4. Omzet dari RAB Internal project yang ditangani s/d hari ini
        $rabOmzet = $this->getOmzetFromRabInternal($nik, $bulan, $tahun);
        $omzetInternal = $rabOmzet['internal'];
        $omzetExternal = $rabOmzet['eksternal'];
        $totalOmzet = $omzetInternal + $omzetExternal;

        // 5. Tunjangan jabatan (apakah total omzet internal perusahaan >= 900 juta sesuai Excel P3)
        $companyOmzetInternal = $this->getCompanyTotalInternalOmzet($bulan, $tahun);
        $tunjanganJabatan = $this->calculateTunjanganJabatan($config, $totalOmzet, $companyOmzetInternal);

        // 6. CF berjalan (dievaluasi berdasarkan deal CF perusahaan & porsi jabatan)
        $jumlahCF = $this->getCommitmentFeeCount($nik, $bulan, $tahun, $config);
        $komisiCF = $this->calculateKomisiCF($config, $jumlahCF);

        // 7. Komisi DP berjalan (dievaluasi dinamis terhadap min_omzet_komisi_dp)
        $komisiDP = $this->calculateKomisiDP($config, $omzetInternal, $omzetExternal);

        // 8. Komisi Pelunasan berjalan
        $komisiPelunasan = $this->getKomisiPelunasanFromInvoices($nik, $bulan, $tahun, $config);

        // 9. Achievement omzet berjalan (dievaluasi dinamis terhadap min_omzet_achievement)
        $achievementOmzet = $this->calculateAchievementOmzet($config, $totalOmzet);

        // 10. Skor Kinerja & Success Project
        $timelineScore = $this->getTimelineScoreFromSystem($nik, $bulan, $tahun);
        $minProjectSuccess = $config->min_success_project_persen > 0 ? (float) $config->min_success_project_persen : 50.0;

        $komisiSuccessProject = 0;
        $achievementPelaksanaan = 0;
        $isSuccessProjectUnlocked = ($timelineScore >= $minProjectSuccess);

        if ($isSuccessProjectUnlocked) {
            if ($config->komisi_success_persen_internal > 0) {
                $komisiSuccessProject = (int) round($omzetInternal * $config->komisi_success_persen_internal * ($config->komisi_success_bayar_persen / 100));
            } elseif ($timelineScore >= 70.0) {
                $komisiSuccessProject = (int) round($omzetInternal * 0.002);
            } elseif ($timelineScore >= 50.0) {
                $komisiSuccessProject = (int) round($omzetInternal * 0.001);
            }

            if ($config->achievement_pelaksanaan_persen > 0) {
                $achievementPelaksanaan = (int) round($omzetInternal * $config->achievement_pelaksanaan_persen);
            } elseif ($config->achievement_fixed > 0 && $timelineScore >= 75.0) {
                $achievementPelaksanaan = $config->achievement_fixed;
            }
        }

        // 11. Kasbon
        $kasbon = $this->getKasbon($nik);

        $totalPendapatanKotor = $gajiPokokBerjalan + $tunjanganJabatan + $totalOperasional + $komisiCF + $komisiDP + $komisiPelunasan + $komisiSuccessProject + $achievementOmzet + $achievementPelaksanaan;
        $totalSementaraDiterima = max(0, $totalPendapatanKotor - $kasbon);

        // Evaluasi Target Multi-Tier
        $targetKomisiDP = $config->min_omzet_komisi_dp;
        $isKomisiDPUnlocked = ($komisiDP > 0 || ($targetKomisiDP > 0 && $totalOmzet >= $targetKomisiDP));

        $targetAchievementOmzet = $config->min_omzet_achievement;
        $isAchievementOmzetUnlocked = ($achievementOmzet > 0 || ($targetAchievementOmzet > 0 && $totalOmzet >= $targetAchievementOmzet));

        $isTunjanganUnlocked = ($tunjanganJabatan > 0);

        return [
            'has_config' => true,
            'hari_hadir' => $hariHadir,
            'hari_tepat_waktu' => $attendance['hari_tepat_waktu'],
            'hari_terlambat' => $attendance['hari_terlambat'],
            'hari_izin' => $attendance['hari_izin'],
            'hari_sakit' => $attendance['hari_sakit'],
            'hari_alpha' => $attendance['hari_alpha'],
            'perfect_attendance' => $attendance['perfect_attendance'],
            'hari_kerja_default' => $hariKerjaDefault,
            'gaji_pokok_berjalan' => $gajiPokokBerjalan,
            'tunjangan_jabatan' => $tunjanganJabatan,
            'transportasi' => $transportasi,
            'makan' => $makan,
            'kehadiran' => $kehadiran,
            'total_operasional' => $totalOperasional,
            'omzet_internal' => $omzetInternal,
            'omzet_eksternal' => $omzetExternal,
            'total_omzet' => $totalOmzet,
            'company_omzet_internal' => $companyOmzetInternal,
            'target_omzet_dp' => $targetKomisiDP,
            'is_komisi_dp_unlocked' => $isKomisiDPUnlocked,
            'target_omzet_achievement' => $targetAchievementOmzet,
            'is_achievement_omzet_unlocked' => $isAchievementOmzetUnlocked,
            'min_success_project_persen' => $minProjectSuccess,
            'timeline_score' => $timelineScore,
            'is_success_project_unlocked' => $isSuccessProjectUnlocked,
            'is_tunjangan_unlocked' => $isTunjanganUnlocked,
            'tunjangan_min_omzet' => $config->tunjangan_jabatan_min_omzet,
            'jumlah_cf' => $jumlahCF,
            'cf_target' => $config->cf_max_per_bulan,
            'komisi_cf' => $komisiCF,
            'komisi_dp' => $komisiDP,
            'komisi_pelunasan' => $komisiPelunasan,
            'komisi_success_project' => $komisiSuccessProject,
            'achievement_omzet' => $achievementOmzet,
            'achievement_pelaksanaan' => $achievementPelaksanaan,
            'kasbon' => $kasbon,
            'total_sementara' => $totalSementaraDiterima,
        ];
    }
}
