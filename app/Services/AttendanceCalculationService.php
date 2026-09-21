<?php

namespace App\Services;

use App\Models\Karyawan;
use App\Models\Presensi;
use App\Models\Jamkerja;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class AttendanceCalculationService
{
    /**
     * Hitung rekapitulasi kehadiran seorang karyawan untuk bulan & tahun tertentu.
     *
     * @param string $nik
     * @param int $bulan
     * @param int $tahun
     * @param int $hariKerjaDefault
     * @return array
     */
    public function getMonthlyAttendanceSummary(string $nik, int $bulan, int $tahun, int $hariKerjaDefault = 26): array
    {
        $nik = trim($nik);
        $karyawan = Karyawan::where('nik', $nik)->first();

        $startOfMonth = Carbon::createFromDate($tahun, $bulan, 1)->startOfMonth();
        $endOfMonth = Carbon::createFromDate($tahun, $bulan, 1)->endOfMonth();
        $now = Carbon::now();

        // Tentukan batas tanggal evaluasi (jika bulan berjalan, sampai hari ini; jika bulan lalu, sampai akhir bulan)
        $evalEndDate = ($startOfMonth->isSameMonth($now)) ? min($now->copy()->endOfDay(), $endOfMonth) : $endOfMonth;

        // 1. Ambil semua record presensi bulan ini
        $presenceRecords = DB::table('presensi')
            ->leftJoin('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('presensi.nik', $nik)
            ->whereMonth('presensi.tanggal', $bulan)
            ->whereYear('presensi.tanggal', $tahun)
            ->select(
                'presensi.*',
                'presensi_jamkerja.jam_masuk as jk_jam_masuk',
                'presensi_jamkerja.jam_pulang as jk_jam_pulang'
            )
            ->get();

        // Ambil default jam kerja karyawan jika di record presensi tidak ada jk_jam_masuk
        $defaultJamMasuk = '08:00:00';
        if ($karyawan && $karyawan->kode_jadwal) {
            $defaultJk = Jamkerja::where('kode_jam_kerja', $karyawan->kode_jadwal)->first();
            if ($defaultJk && $defaultJk->jam_masuk) {
                $defaultJamMasuk = $defaultJk->jam_masuk;
            }
        }

        $hariHadir = 0;
        $hariTerlambat = 0;
        $hariTepatWaktu = 0;
        $hariAlphaExplicit = 0;
        $tanggalHadirSet = [];

        foreach ($presenceRecords as $p) {
            $isHadir = ($p->status === 'h') || !empty($p->jam_in);
            if ($isHadir) {
                $hariHadir++;
                $tanggalHadirSet[$p->tanggal] = true;

                // Evaluasi keterlambatan
                $jamMasuk = $p->jk_jam_masuk ?: $defaultJamMasuk;
                if (!empty($p->jam_in)) {
                    $jamInTime = date('H:i:s', strtotime($p->jam_in));
                    if ($jamInTime > $jamMasuk) {
                        $hariTerlambat++;
                    } else {
                        $hariTepatWaktu++;
                    }
                } else {
                    $hariTepatWaktu++;
                }
            } elseif ($p->status === 'a') {
                $hariAlphaExplicit++;
            }
        }

        // 2. Ambil Izin Absen yang disetujui (status = 1)
        $izinAbsenCount = $this->countApprovedPermits('presensi_izinabsen', $nik, $startOfMonth, $endOfMonth);

        // 3. Ambil Izin Cuti yang disetujui (status = 1)
        $izinCutiCount = $this->countApprovedPermits('presensi_izincuti', $nik, $startOfMonth, $endOfMonth);

        // 4. Ambil Izin Dinas yang disetujui (status = 1)
        $izinDinasCount = $this->countApprovedPermits('presensi_izindinas', $nik, $startOfMonth, $endOfMonth);

        // 5. Ambil Izin Sakit yang disetujui (status = 1)
        $izinSakitCount = $this->countApprovedPermits('presensi_izinsakit', $nik, $startOfMonth, $endOfMonth);

        $totalIzin = $izinAbsenCount + $izinCutiCount + $izinDinasCount;

        // 6. Hitung hari alpha
        // Hari kerja terlewat tanpa presensi & tanpa izin/sakit
        $hariAlpha = $hariAlphaExplicit;

        // Jika ada hari kerja yang lewat dalam periode evaluasi (exclude Minggu)
        if ($evalEndDate->gte($startOfMonth)) {
            $period = CarbonPeriod::create($startOfMonth, $evalEndDate);
            $workingDaysPassed = 0;
            foreach ($period as $date) {
                // Hari Minggu libur (0 = Sunday)
                if ($date->dayOfWeek !== Carbon::SUNDAY) {
                    $workingDaysPassed++;
                }
            }

            // Total hari yang accounted for: hadir + izin + sakit
            $accountedDays = $hariHadir + $totalIzin + $izinSakitCount;
            if ($workingDaysPassed > $accountedDays) {
                $unaccounted = $workingDaysPassed - $accountedDays;
                $hariAlpha = max($hariAlphaExplicit, $unaccounted);
            }
        }

        // Batasi nilai agar tidak negatif atau melampaui hari kerja default
        $hariHadir = max(0, $hariHadir);
        $hariTerlambat = max(0, $hariTerlambat);
        $hariTepatWaktu = max(0, $hariTepatWaktu);
        $totalIzin = max(0, $totalIzin);
        $izinSakitCount = max(0, $izinSakitCount);
        $hariAlpha = max(0, min($hariAlpha, $hariKerjaDefault));

        // Status kehadiran sempurna: minimal 1 kehadiran, 0 telat, 0 alpha
        $perfectAttendance = ($hariHadir > 0 && $hariTerlambat === 0 && $hariAlpha === 0);

        // Persentase kehadiran
        $presensiRate = ($hariKerjaDefault > 0) ? round(($hariHadir / $hariKerjaDefault) * 100, 1) : 0;

        return [
            'nik' => $nik,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'hari_kerja_default' => $hariKerjaDefault,
            'hari_hadir' => $hariHadir,
            'hari_tepat_waktu' => $hariTepatWaktu,
            'hari_terlambat' => $hariTerlambat,
            'hari_izin' => $totalIzin,
            'hari_sakit' => $izinSakitCount,
            'hari_alpha' => $hariAlpha,
            'perfect_attendance' => $perfectAttendance,
            'presensi_rate' => $presensiRate,
            'has_attendance_data' => ($hariHadir > 0 || $totalIzin > 0 || $izinSakitCount > 0),
        ];
    }

    /**
     * Hitung jumlah hari izin/sakit/cuti yang disetujui dalam rentang bulan.
     */
    protected function countApprovedPermits(string $tableName, string $nik, Carbon $startOfMonth, Carbon $endOfMonth): int
    {
        try {
            $permits = DB::table($tableName)
                ->where('nik', $nik)
                ->where('status', 1) // 1 = Disetujui
                ->where(function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('tanggal', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                      ->orWhere(function ($sub) use ($startOfMonth, $endOfMonth) {
                          $sub->whereNotNull('dari')
                              ->whereNotNull('sampai')
                              ->where('dari', '<=', $endOfMonth->toDateString())
                              ->where('sampai', '>=', $startOfMonth->toDateString());
                      });
                })
                ->get();

            $totalDays = 0;
            foreach ($permits as $p) {
                if (!empty($p->dari) && !empty($p->sampai)) {
                    $dari = Carbon::parse($p->dari);
                    $sampai = Carbon::parse($p->sampai);

                    // Clamp to the month
                    $actualStart = $dari->max($startOfMonth);
                    $actualEnd = $sampai->min($endOfMonth);

                    if ($actualStart->lte($actualEnd)) {
                        $period = CarbonPeriod::create($actualStart, $actualEnd);
                        foreach ($period as $d) {
                            if ($d->dayOfWeek !== Carbon::SUNDAY) {
                                $totalDays++;
                            }
                        }
                    }
                } else {
                    $totalDays++;
                }
            }

            return $totalDays;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Ambil rekapitulasi kehadiran untuk seluruh karyawan aktif pada bulan/tahun tertentu.
     * Mengembalikan array keyed by NIK.
     *
     * @param int $bulan
     * @param int $tahun
     * @return array<string, array>
     */
    public function getAllEmployeesAttendanceSummary(int $bulan, int $tahun): array
    {
        $karyawans = Karyawan::where(function ($q) {
                $q->whereNull('tanggal_nonaktif')
                  ->orWhere('tanggal_nonaktif', '>', now());
            })
            ->where(function ($q) {
                $q->where('status_aktif_karyawan', '1')
                  ->orWhereNull('status_aktif_karyawan');
            })
            ->get();

        $summaries = [];
        foreach ($karyawans as $k) {
            $summaries[$k->nik] = $this->getMonthlyAttendanceSummary($k->nik, $bulan, $tahun);
        }

        return $summaries;
    }
}