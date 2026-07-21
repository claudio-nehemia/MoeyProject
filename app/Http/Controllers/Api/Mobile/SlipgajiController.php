<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Bpjskesehatan;
use App\Models\Bpjstenagakerja;
use App\Models\Denda;
use App\Models\Detailpenyesuaiangaji;
use App\Models\Detailtunjangan;
use App\Models\Gajipokok;
use App\Models\Jenistunjangan;
use App\Models\Karyawan;
use App\Models\Pengaturanumum;
use App\Models\Presensi;
use App\Models\Slipgaji;
use App\Services\Pph21Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SlipgajiController extends Controller
{
    /**
     * Fetch list of published payslip periods.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $userKaryawan = $user->karyawan;
        if (!$userKaryawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $generalsetting = Pengaturanumum::where('id', 1)->first();
        if (!$generalsetting) {
            return response()->json([
                'success' => false,
                'message' => 'Pengaturan umum tidak ditemukan'
            ], 500);
        }

        $slips = Slipgaji::orderBy('tahun', 'desc')
            ->orderBy('bulan', 'desc')
            ->where('status', '1')
            ->get();

        $listBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        $data = [];
        foreach ($slips as $s) {
            $bulan = $s->bulan;
            $tahun = $s->tahun;

            $periode_laporan_dari = $generalsetting->periode_laporan_dari;
            $periode_laporan_sampai = $generalsetting->periode_laporan_sampai;
            $periode_laporan_lintas_bulan = $generalsetting->periode_laporan_next_bulan;

            if ($periode_laporan_lintas_bulan == 1) {
                if ($bulan == 1) {
                    $bulan_dari = 12;
                    $tahun_dari = $tahun - 1;
                } else {
                    $bulan_dari = $bulan - 1;
                    $tahun_dari = $tahun;
                }
                $bulan_sampai = $bulan;
                $tahun_sampai = $tahun;
            } elseif ($periode_laporan_lintas_bulan == 2) {
                $bulan_dari = $bulan;
                $tahun_dari = $tahun;
                if ($bulan == 12) {
                    $bulan_sampai = 1;
                    $tahun_sampai = $tahun + 1;
                } else {
                    $bulan_sampai = $bulan + 1;
                    $tahun_sampai = $tahun;
                }
            } else {
                $bulan_dari = $bulan;
                $tahun_dari = $tahun;
                $bulan_sampai = $bulan;
                $tahun_sampai = $tahun;
            }

            $bulan_dari_pad = str_pad($bulan_dari, 2, '0', STR_PAD_LEFT);
            $last_day_start = date('t', strtotime($tahun_dari . '-' . $bulan_dari_pad . '-01'));
            $p_dari_val = min($periode_laporan_dari, $last_day_start);
            $p_dari = str_pad($p_dari_val, 2, '0', STR_PAD_LEFT);

            $bulan_sampai_pad = str_pad($bulan_sampai, 2, '0', STR_PAD_LEFT);
            $last_day_end = date('t', strtotime($tahun_sampai . '-' . $bulan_sampai_pad . '-01'));
            $p_sampai_val = min($periode_laporan_sampai, $last_day_end);
            $p_sampai = str_pad($p_sampai_val, 2, '0', STR_PAD_LEFT);

            $periode_dari = $tahun_dari . '-' . $bulan_dari_pad . '-' . $p_dari;
            $periode_sampai = $tahun_sampai . '-' . $bulan_sampai_pad . '-' . $p_sampai;

            $data[] = [
                'kode_slip_gaji' => $s->kode_slip_gaji,
                'bulan' => (int)$bulan,
                'tahun' => (int)$tahun,
                'nama_bulan' => $listBulan[(int)$bulan] ?? '',
                'periode_dari' => $periode_dari,
                'periode_sampai' => $periode_sampai,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get details of a specific payslip.
     */
    public function show(Request $request, $bulan, $tahun)
    {
        $user = $request->user();
        $userKaryawan = $user->karyawan;
        if (!$userKaryawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $nik = $userKaryawan->nik;

        // Check if the slip is published
        $slipGajiRecord = Slipgaji::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->where('status', '1')
            ->first();

        if (!$slipGajiRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Slip gaji untuk periode ini belum diterbitkan'
            ], 404);
        }

        $generalsetting = Pengaturanumum::where('id', 1)->first();
        if (!$generalsetting) {
            return response()->json([
                'success' => false,
                'message' => 'Pengaturan umum tidak ditemukan'
            ], 500);
        }

        // Calculate Period Range
        $periode_laporan_dari = $generalsetting->periode_laporan_dari;
        $periode_laporan_sampai = $generalsetting->periode_laporan_sampai;
        $periode_laporan_lintas_bulan = $generalsetting->periode_laporan_next_bulan;

        if ($periode_laporan_lintas_bulan == 1) {
            if ($bulan == 1) {
                $bulan_dari = 12;
                $tahun_dari = $tahun - 1;
            } else {
                $bulan_dari = $bulan - 1;
                $tahun_dari = $tahun;
            }
            $bulan_sampai = $bulan;
            $tahun_sampai = $tahun;
        } elseif ($periode_laporan_lintas_bulan == 2) {
            $bulan_dari = $bulan;
            $tahun_dari = $tahun;
            if ($bulan == 12) {
                $bulan_sampai = 1;
                $tahun_sampai = $tahun + 1;
            } else {
                $bulan_sampai = $bulan + 1;
                $tahun_sampai = $tahun;
            }
        } else {
            $bulan_dari = $bulan;
            $tahun_dari = $tahun;
            $bulan_sampai = $bulan;
            $tahun_sampai = $tahun;
        }

        $bulan_dari_pad = str_pad($bulan_dari, 2, '0', STR_PAD_LEFT);
        $last_day_start = date('t', strtotime($tahun_dari . '-' . $bulan_dari_pad . '-01'));
        $p_dari_val = min($periode_laporan_dari, $last_day_start);
        $p_dari = str_pad($p_dari_val, 2, '0', STR_PAD_LEFT);

        $bulan_sampai_pad = str_pad($bulan_sampai, 2, '0', STR_PAD_LEFT);
        $last_day_end = date('t', strtotime($tahun_sampai . '-' . $bulan_sampai_pad . '-01'));
        $p_sampai_val = min($periode_laporan_sampai, $last_day_end);
        $p_sampai = str_pad($p_sampai_val, 2, '0', STR_PAD_LEFT);

        $periode_dari = $tahun_dari . '-' . $bulan_dari_pad . '-' . $p_dari;
        $periode_sampai = $tahun_sampai . '-' . $bulan_sampai_pad . '-' . $p_sampai;

        // Subqueries for Salary components
        $gaji_pokok_sub = Gajipokok::select('nik', 'jumlah', 'jenis_upah')
            ->whereIn('kode_gaji', function ($query) use ($periode_sampai) {
                $query->select(DB::raw('MAX(kode_gaji)'))
                    ->from('karyawan_gaji_pokok')
                    ->where('tanggal_berlaku', '<=', $periode_sampai)
                    ->groupBy('nik');
            });

        $bpjs_kesehatan_sub = Bpjskesehatan::select('nik', 'jumlah')
            ->whereIn('kode_bpjs_kesehatan', function ($query) use ($periode_sampai) {
                $query->select(DB::raw('MAX(kode_bpjs_kesehatan)'))
                    ->from('karyawan_bpjskesehatan')
                    ->where('tanggal_berlaku', '<=', $periode_sampai)
                    ->groupBy('nik');
            });

        $bpjs_tenagakerja_sub = Bpjstenagakerja::select('nik', 'jumlah')
            ->whereIn('kode_bpjs_tk', function ($query) use ($periode_sampai) {
                $query->select(DB::raw('MAX(kode_bpjs_tk)'))
                    ->from('karyawan_bpjstenagakerja')
                    ->where('tanggal_berlaku', '<=', $periode_sampai)
                    ->groupBy('nik');
            });

        $jenis_tunjangan = Jenistunjangan::orderBy('kode_jenis_tunjangan')->get();
        $select_tunjangan = [];
        foreach ($jenis_tunjangan as $jt) {
            $select_tunjangan[] = DB::raw("SUM(CASE WHEN karyawan_tunjangan_detail.kode_jenis_tunjangan = '" . $jt->kode_jenis_tunjangan . "' THEN karyawan_tunjangan_detail.jumlah ELSE 0 END) as jumlah_" . $jt->kode_jenis_tunjangan);
        }

        $tunjangan_sub = Detailtunjangan::join('karyawan_tunjangan', 'karyawan_tunjangan_detail.kode_tunjangan', '=', 'karyawan_tunjangan.kode_tunjangan')
            ->select('karyawan_tunjangan.nik', ...$select_tunjangan)
            ->whereIn('karyawan_tunjangan_detail.kode_tunjangan', function ($query) use ($periode_sampai) {
                $query->select(DB::raw('MAX(kode_tunjangan)'))
                    ->from('karyawan_tunjangan')
                    ->where('tanggal_berlaku', '<=', $periode_sampai)
                    ->groupBy('nik');
            })
            ->groupBy('karyawan_tunjangan.nik');

        $penyesuaian_gaji_sub = Detailpenyesuaiangaji::select('nik', 'penambah', 'pengurang', 'keterangan')
            ->join('karyawan_penyesuaian_gaji', 'karyawan_penyesuaian_gaji_detail.kode_penyesuaian_gaji', '=', 'karyawan_penyesuaian_gaji.kode_penyesuaian_gaji')
            ->where('bulan', $bulan)
            ->where('tahun', $tahun);

        // Fetch employee details
        $empQuery = Karyawan::leftJoin('jabatan', 'karyawan.kode_jabatan', '=', 'jabatan.kode_jabatan')
            ->leftJoin('departemen', 'karyawan.kode_dept', '=', 'departemen.kode_dept')
            ->leftJoinSub($gaji_pokok_sub, 'gaji_pokok', 'karyawan.nik', '=', 'gaji_pokok.nik')
            ->leftJoinSub($bpjs_kesehatan_sub, 'bpjs_kesehatan', 'karyawan.nik', '=', 'bpjs_kesehatan.nik')
            ->leftJoinSub($bpjs_tenagakerja_sub, 'bpjs_tenagakerja', 'karyawan.nik', '=', 'bpjs_tenagakerja.nik')
            ->leftJoinSub($tunjangan_sub, 'tunjangan', 'karyawan.nik', '=', 'tunjangan.nik')
            ->leftJoinSub($penyesuaian_gaji_sub, 'penyesuaian_gaji', 'karyawan.nik', '=', 'penyesuaian_gaji.nik')
            ->select(
                'karyawan.*',
                'jabatan.nama_jabatan',
                'departemen.nama_dept',
                'gaji_pokok.jumlah as gaji_pokok',
                'gaji_pokok.jenis_upah',
                'bpjs_kesehatan.jumlah as bpjs_kesehatan',
                'bpjs_tenagakerja.jumlah as bpjs_tenagakerja',
                'penambah',
                'pengurang',
                'penyesuaian_gaji.keterangan as keterangan_penyesuaian'
            )
            ->where('karyawan.nik', $nik);

        // Add pinjaman sub if table exists
        if (\Illuminate\Support\Facades\Schema::hasTable('pembayaran_pinjaman')) {
            $pinjaman_sub = DB::table('pembayaran_pinjaman')
                ->select('pinjaman.nik', DB::raw('SUM(pembayaran_pinjaman.jumlah_bayar) as total_cicilan'))
                ->join('pinjaman', 'pembayaran_pinjaman.pinjaman_id', '=', 'pinjaman.id')
                ->where('pembayaran_pinjaman.bulan_gaji', $bulan)
                ->where('pembayaran_pinjaman.tahun_gaji', $tahun)
                ->where('pembayaran_pinjaman.jenis_pembayaran', 'C')
                ->groupBy('pinjaman.nik');
            $empQuery = $empQuery->leftJoinSub($pinjaman_sub, 'pinjaman_cicilan', 'karyawan.nik', '=', 'pinjaman_cicilan.nik')
                ->addSelect('pinjaman_cicilan.total_cicilan');
        }

        $emp = $empQuery->first();

        if (!$emp) {
            return response()->json([
                'success' => false,
                'message' => 'Detail karyawan tidak ditemukan'
            ], 404);
        }

        // Attendance logs
        $logs = DB::table('presensi')
            ->leftJoin('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->select(
                'presensi.*',
                'presensi_jamkerja.nama_jam_kerja',
                'presensi_jamkerja.jam_masuk',
                'presensi_jamkerja.jam_pulang',
                'presensi_jamkerja.istirahat',
                'presensi_jamkerja.jam_awal_istirahat',
                'presensi_jamkerja.jam_akhir_istirahat',
                'presensi_jamkerja.lintashari',
                'presensi_jamkerja.total_jam'
            )
            ->where('presensi.nik', $nik)
            ->whereBetween('presensi.tanggal', [$periode_dari, $periode_sampai])
            ->orderBy('presensi.tanggal', 'asc')
            ->get();

        // Load schedule mappings
        $jadwal_bydate = DB::table('presensi_jamkerja_bydate')
            ->join('presensi_jamkerja', 'presensi_jamkerja_bydate.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('nik', $nik)
            ->select('tanggal', 'presensi_jamkerja.total_jam', 'presensi_jamkerja.nama_jam_kerja', 'presensi_jamkerja.jam_masuk', 'presensi_jamkerja.jam_pulang')
            ->get()
            ->keyBy('tanggal')
            ->toArray();

        $cek_group = null;
        $jadwal_grup_bydate = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('grup_detail')) {
            $cek_group = DB::table('grup_detail')->where('nik', $nik)->first();
            if ($cek_group && \Illuminate\Support\Facades\Schema::hasTable('grup_jamkerja_bydate')) {
                $jadwal_grup_bydate = DB::table('grup_jamkerja_bydate')
                    ->join('presensi_jamkerja', 'grup_jamkerja_bydate.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                    ->where('kode_grup', $cek_group->kode_grup)
                    ->whereBetween('tanggal', [$periode_dari, $periode_sampai])
                    ->select('tanggal', 'presensi_jamkerja.total_jam', 'presensi_jamkerja.nama_jam_kerja', 'presensi_jamkerja.jam_masuk', 'presensi_jamkerja.jam_pulang')
                    ->get()
                    ->keyBy('tanggal')
                    ->toArray();
            }
        }

        $jadwal_byday = DB::table('presensi_jamkerja_byday')
            ->join('presensi_jamkerja', 'presensi_jamkerja_byday.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('nik', $nik)
            ->select('hari', 'presensi_jamkerja.total_jam', 'presensi_jamkerja.nama_jam_kerja', 'presensi_jamkerja.jam_masuk', 'presensi_jamkerja.jam_pulang')
            ->get()
            ->keyBy('hari')
            ->toArray();

        $jadwal_bydept = DB::table('presensi_jamkerja_bydept_detail')
            ->join('presensi_jamkerja_bydept', 'presensi_jamkerja_bydept_detail.kode_jk_dept', '=', 'presensi_jamkerja_bydept.kode_jk_dept')
            ->join('presensi_jamkerja', 'presensi_jamkerja_bydept_detail.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('kode_dept', $emp->kode_dept)
            ->where('kode_cabang', $emp->kode_cabang)
            ->select('hari', 'presensi_jamkerja.total_jam', 'presensi_jamkerja.nama_jam_kerja', 'presensi_jamkerja.jam_masuk', 'presensi_jamkerja.jam_pulang')
            ->get()
            ->keyBy('hari')
            ->toArray();

        $denda_list = Denda::all()->toArray();
        $datalibur = function_exists('getdatalibur') ? getdatalibur($periode_dari, $periode_sampai) : [];
        $datalembur = function_exists('getlembur') ? getlembur($periode_dari, $periode_sampai) : [];

        $libur_nasional_dates = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('hari_libur_detail') && \Illuminate\Support\Facades\Schema::hasTable('hari_libur')) {
            $libur_nasional_dates = DB::table('hari_libur_detail')
                ->join('hari_libur', 'hari_libur_detail.kode_libur', '=', 'hari_libur.kode_libur')
                ->whereBetween('hari_libur.tanggal', [$periode_dari, $periode_sampai])
                ->pluck('hari_libur.tanggal')
                ->flip()
                ->toArray();
        }

        $datalibur_indexed = [];
        foreach ($datalibur as $item) {
            if (($item['nik'] ?? null) == $nik) {
                $datalibur_indexed[$item['tanggal']][] = $item;
            }
        }
        $datalibur_by_tanggal = [];
        foreach ($datalibur as $item) {
            if (empty($item['nik'])) {
                $datalibur_by_tanggal[$item['tanggal']][] = $item;
            }
        }

        $datalembur_indexed = [];
        foreach ($datalembur as $item) {
            if (($item['nik'] ?? null) == $nik) {
                $datalembur_indexed[$item['tanggal']][] = $item;
            }
        }

        $logs_by_date = $logs->keyBy('tanggal')->toArray();

        // Perform dynamic payroll variables
        $tanggal_presensi = $periode_dari;
        $total_denda = 0;
        $total_potongan_jam = 0;
        $total_tunjangan = 0;
        $total_jam_lembur_aktual = 0;
        $total_jam_netto_lembur = 0;
        $total_nominal_lembur_snapshot = 0;
        $has_lembur_snapshot = false;

        $hari_kerja = 0;
        $hari_hadir = 0;
        $hari_terlambat = 0;

        $tunjangan_breakdown = [];

        $upah_perjam = $generalsetting->total_jam_bulan > 0
            ? (float)$emp->gaji_pokok / $generalsetting->total_jam_bulan
            : 0;

        while (strtotime($tanggal_presensi) <= strtotime($periode_sampai)) {
            $denda = 0;
            $potongan_jam = 0;

            $is_libur_nasional = isset($libur_nasional_dates[$tanggal_presensi]);
            if ($is_libur_nasional) {
                $is_libur = true;
            } else {
                $has_schedule = false;
                $nama_hari_check = function_exists('getHari') ? getHari($tanggal_presensi) : strtolower(date('l', strtotime($tanggal_presensi)));
                if (isset($jadwal_bydate[$tanggal_presensi])) $has_schedule = true;
                elseif (isset($jadwal_grup_bydate[$tanggal_presensi])) $has_schedule = true;
                elseif (isset($jadwal_byday[$nama_hari_check])) $has_schedule = true;
                else {
                    $keyDC = $emp->kode_dept . '|' . $emp->kode_cabang;
                    $mapD = $jadwal_bydept[$keyDC] ?? [];
                    if (isset($mapD[$nama_hari_check])) $has_schedule = true;
                }
                $is_libur = !$has_schedule;
            }
            $tipe_hari = $is_libur ? 2 : 1;

            if (!$is_libur) {
                $hari_kerja++;
            }

            $log_row = isset($logs_by_date[$tanggal_presensi]) ? (object) $logs_by_date[$tanggal_presensi] : null;

            $jml_jam_lembur = 0;
            $jam_netto_harian = 0;

            $snapshot_lembur = $log_row && ($log_row->jam_lembur_aktual ?? null) !== null;
            if ($snapshot_lembur) {
                $has_lembur_snapshot = true;
                $jml_jam_lembur = $log_row->jam_lembur_aktual;
                $jam_netto_harian = $log_row->jam_lembur_netto ?? 0;
                $total_nominal_lembur_snapshot += $log_row->nominal_lembur ?? 0;
            } else {
                $ceklembur_data = $datalembur_indexed[$tanggal_presensi] ?? [];
                if (function_exists('hitungLembur')) {
                    $lembur_aktual = hitungLembur($ceklembur_data);
                    if ($lembur_aktual > 0) {
                        $jml_jam_lembur = $lembur_aktual;
                        $jam_netto_harian = function_exists('hitungJamNetto') ? hitungJamNetto($lembur_aktual, $tipe_hari) : 0;
                    }
                }
            }

            $total_jam_lembur_aktual += $jml_jam_lembur;
            $total_jam_netto_lembur += $jam_netto_harian;

            $ceklibur = $datalibur_indexed[$tanggal_presensi] ?? ($datalibur_by_tanggal[$tanggal_presensi] ?? []);

            if ($log_row) {
                if ($log_row->status == 'h') {
                    $hari_hadir++;
                    $jam_masuk = $tanggal_presensi . ' ' . $log_row->jam_masuk;
                    $terlambat = function_exists('hitungjamterlambat')
                        ? hitungjamterlambat($log_row->jam_in, $jam_masuk)
                        : null;

                    if ($terlambat && ($terlambat['desimal_terlambat'] ?? 0) > 0) {
                        $hari_terlambat++;
                    }

                    $denda_dari_db = isset($log_row->denda) && $log_row->denda !== null
                        ? $log_row->denda
                        : null;

                    $potongan_jam_terlambat = 0;
                    if ($denda_dari_db !== null) {
                        $denda = $denda_dari_db;
                        if ($terlambat != null) {
                            if ($terlambat['desimal_terlambat'] >= 1) {
                                $potongan_jam_terlambat =
                                    $terlambat['desimal_terlambat'] > $log_row->total_jam
                                        ? $log_row->total_jam
                                        : $terlambat['desimal_terlambat'];
                            }
                        }
                    } else {
                        if ($terlambat != null) {
                            if ($terlambat['desimal_terlambat'] < 1) {
                                $denda = function_exists('hitungdenda')
                                    ? hitungdenda($denda_list, $terlambat['menitterlambat'])
                                    : 0;
                            } else {
                                $potongan_jam_terlambat =
                                    $terlambat['desimal_terlambat'] > $log_row->total_jam
                                        ? $log_row->total_jam
                                        : $terlambat['desimal_terlambat'];
                            }
                        }
                    }

                    $pulangcepat = function_exists('hitungpulangcepat')
                        ? hitungpulangcepat(
                            $tanggal_presensi,
                            $log_row->jam_out ?? null,
                            $log_row->jam_pulang ?? null,
                            $log_row->istirahat ?? null,
                            $log_row->jam_awal_istirahat ?? null,
                            $log_row->jam_akhir_istirahat ?? null,
                            $log_row->lintashari ?? null,
                        )
                        : 0;
                    $pulangcepat = $pulangcepat > ($log_row->total_jam ?? 0) ? $log_row->total_jam : $pulangcepat;

                    $potongan_tidak_absen = empty($log_row->jam_out) || empty($log_row->jam_in)
                        ? ($log_row->total_jam ?? 0)
                        : 0;

                    $potongan_istirahat = function_exists('hitungPotonganIstirahat')
                        ? hitungPotonganIstirahat(
                            $log_row->istirahat_out ?? null,
                            $log_row->istirahat_in ?? null,
                            $log_row->jam_awal_istirahat ?? null,
                            $log_row->jam_akhir_istirahat ?? null
                        )
                        : 0;

                    $status_potongan_istirahat = $log_row->status_potongan_istirahat ?? $generalsetting->potongan_istirahat;

                    $potongan_jam = $potongan_tidak_absen == 0
                        ? $pulangcepat + $potongan_jam_terlambat + ($status_potongan_istirahat == 1 ? $potongan_istirahat : 0)
                        : $potongan_tidak_absen;

                } elseif ($log_row->status == 'i' || $log_row->status == 'a') {
                    $potongan_jam = $log_row->total_jam ?? 0;
                    $denda_dari_db = isset($log_row->denda) && $log_row->denda !== null
                        ? $log_row->denda
                        : null;
                    $denda = $denda_dari_db !== null ? $denda_dari_db : 0;
                }
            } else {
                if (empty($ceklibur)) {
                    $totalJamJadwal = $jadwal_bydate[$tanggal_presensi] ?? null;
                    if ($totalJamJadwal === null) {
                        $totalJamJadwal = $jadwal_grup_bydate[$tanggal_presensi] ?? null;
                    }
                    if ($totalJamJadwal === null) {
                        $nama_hari = function_exists('getHari') ? getHari($tanggal_presensi) : strtolower(date('l', strtotime($tanggal_presensi)));
                        $totalJamJadwal = $jadwal_byday[$nama_hari] ?? null;
                    }
                    if ($totalJamJadwal === null) {
                        $nama_hari = isset($nama_hari) ? $nama_hari : (function_exists('getHari') ? getHari($tanggal_presensi) : strtolower(date('l', strtotime($tanggal_presensi))));
                        $keyDeptCabang = $emp->kode_dept . '|' . $emp->kode_cabang;
                        $mapDept = $jadwal_bydept[$keyDeptCabang] ?? [];
                        $totalJamJadwal = $mapDept[$nama_hari] ?? null;
                    }
                    $is_future = strtotime($tanggal_presensi) > strtotime(date('Y-m-d'));
                    if ($totalJamJadwal !== null && !$is_future) {
                        if (is_numeric($totalJamJadwal)) {
                            $potongan_jam = $totalJamJadwal;
                        } elseif (is_array($totalJamJadwal)) {
                            $potongan_jam = $totalJamJadwal['total_jam'] ?? 0;
                        } elseif (is_object($totalJamJadwal)) {
                            $potongan_jam = $totalJamJadwal->total_jam ?? 0;
                        }
                    }
                }
            }

            $status_potongan_harian = $log_row && isset($log_row->status_potongan) ? $log_row->status_potongan : ($generalsetting->status_potongan_jam ?? 1);
            if ($status_potongan_harian == 0) {
                $potongan_jam = 0;
            }

            $total_denda += $denda;
            $total_potongan_jam += $potongan_jam;

            $tanggal_presensi = date('Y-m-d', strtotime('+1 day', strtotime($tanggal_presensi)));
        }

        // Tunjangan calculation
        $nilai_tunjangan_map = [];
        foreach ($jenis_tunjangan as $jt) {
            $prop = 'jumlah_' . $jt->kode_jenis_tunjangan;
            $base_jumlah = (float)($emp->$prop ?? 0);
            if ($jt->status_tunjangan === '0') {
                $jumlah = $base_jumlah * $hari_hadir;
            } else {
                $jumlah = $base_jumlah;
            }
            $nilai_tunjangan_map[$jt->kode_jenis_tunjangan] = $jumlah;
            $total_tunjangan += $jumlah;
            if ($jumlah > 0) {
                $tunjangan_breakdown[] = [
                    'nama' => $jt->jenis_tunjangan ?? $jt->kode_jenis_tunjangan,
                    'jumlah' => $jumlah
                ];
            }
        }

        // Overtime wage calculation
        $lembur_khusus = null;
        if (\Illuminate\Support\Facades\Schema::hasTable('lembur_karyawan_khusus')) {
            $lembur_khusus = DB::table('lembur_karyawan_khusus')
                ->where('nik', $nik)
                ->where('status', 1)
                ->first();
        }

        if ($has_lembur_snapshot) {
            $upah_lembur = $total_nominal_lembur_snapshot;
        } elseif ($lembur_khusus) {
            $upah_lembur = $lembur_khusus->upah_perjam * $total_jam_lembur_aktual;
        } else {
            $totalJamBulan = $generalsetting->total_jam_bulan ?: 173;
            $upah_perjam_lembur = ($emp->gaji_pokok + $total_tunjangan) / $totalJamBulan;
            $upah_lembur = ROUND($upah_perjam_lembur) * $total_jam_netto_lembur;
        }

        // PPh 21 Calculation
        $pph21Service = app(Pph21Service::class);
        $isPphActive = $pph21Service->isAktif();

        $pph21_terutang = 0;
        $pph21_ditanggung_perusahaan = 0;
        $active_metode_tanggungan = 'GROSS';

        $snapshot = null;
        if (\Illuminate\Support\Facades\Schema::hasTable('pph21_slip_detail')) {
            $snapshot = DB::table('pph21_slip_detail')
                ->where('kode_slip_gaji', $slipGajiRecord->kode_slip_gaji)
                ->where('nik', $nik)
                ->first();
        }

        if ($snapshot) {
            $pph21_terutang = $snapshot->pph21_terutang;
            $pph21_ditanggung_perusahaan = $snapshot->pph21_ditanggung_perusahaan;
            $active_metode_tanggungan = $snapshot->metode_tanggungan;
        } elseif ($isPphActive && (($emp->hitung_pph21 ?? 1) == 1)) {
            $pphSetting = $pph21Service->getSetting();
            $active_metode_tanggungan = $pphSetting->metode_tanggungan;

            $tunjanganMap = [];
            foreach ($jenis_tunjangan as $jt) {
                $tunjanganMap[$jt->kode_jenis_tunjangan] = $nilai_tunjangan_map[$jt->kode_jenis_tunjangan] ?? 0;
            }

            $nilaiKomponen = [
                'gaji_pokok' => (float)$emp->gaji_pokok,
                'bpjs_kesehatan' => (float)$emp->bpjs_kesehatan,
                'bpjs_tenagakerja' => (float)$emp->bpjs_tenagakerja,
                'lembur' => $upah_lembur,
                'tunjangan' => $tunjanganMap,
            ];

            $totalPphJanNov = 0;
            $totalBrutoJanNov = 0;
            if ($bulan == 12 && \Illuminate\Support\Facades\Schema::hasTable('pph21_slip_detail')) {
                $janNovStats = DB::table('pph21_slip_detail')
                    ->join('slip_gaji', 'pph21_slip_detail.kode_slip_gaji', '=', 'slip_gaji.kode_slip_gaji')
                    ->select(
                        DB::raw('SUM(pph21_slip_detail.penghasilan_bruto) as total_bruto'),
                        DB::raw('SUM(pph21_slip_detail.pph21_terutang) as total_pph')
                    )
                    ->where('pph21_slip_detail.nik', $nik)
                    ->where('slip_gaji.tahun', $tahun)
                    ->whereBetween('slip_gaji.bulan', [1, 11])
                    ->first();
                $totalPphJanNov = $janNovStats->total_pph ?? 0;
                $totalBrutoJanNov = $janNovStats->total_bruto ?? 0;
            }

            $pphResult = $pph21Service->hitung(
                $nilaiKomponen,
                $emp->kode_status_kawin ?? null,
                (int)$bulan,
                (int)$totalPphJanNov,
                (float)$totalBrutoJanNov
            );

            $pph21_terutang = $pphResult['pph21_terutang'] ?? 0;
            $pph21_ditanggung_perusahaan = $pphResult['pph21_ditanggung_perusahaan'] ?? 0;
        }

        if ($active_metode_tanggungan === 'GROSS_UP') {
            $tunjangan_pajak = $pph21_terutang + $pph21_ditanggung_perusahaan;
            $potongan_pph21 = $pph21_terutang + $pph21_ditanggung_perusahaan;
        } else {
            $tunjangan_pajak = 0;
            $potongan_pph21 = $pph21_terutang;
        }

        // Totals
        $gaji_pokok = (float)$emp->gaji_pokok;
        $bpjs_kesehatan = (float)$emp->bpjs_kesehatan;
        $bpjs_tenagakerja = (float)$emp->bpjs_tenagakerja;
        $cicilan_pinjaman = (float)($emp->total_cicilan ?? 0);
        $penambah = (float)($emp->penambah ?? 0);
        $pengurang = (float)($emp->pengurang ?? 0);

        if ($total_potongan_jam > ($generalsetting->total_jam_bulan ?? 173)) {
            $total_potongan_jam = $generalsetting->total_jam_bulan ?? 173;
        }
        $jumlah_potongan_jam = round($upah_perjam) * $total_potongan_jam;

        $total_potongan = round($jumlah_potongan_jam) + $total_denda + $bpjs_kesehatan + $bpjs_tenagakerja + $cicilan_pinjaman + $potongan_pph21;
        $bruto_total = $gaji_pokok + $total_tunjangan + $tunjangan_pajak + round($upah_lembur);
        $gaji_bersih = $gaji_pokok + $total_tunjangan + $tunjangan_pajak - $total_potongan + $penambah - $pengurang + round($upah_lembur);

        return response()->json([
            'success' => true,
            'data' => [
                'karyawan' => [
                    'nik' => $emp->nik,
                    'nik_show' => $emp->nik_show ?? $emp->nik,
                    'nama_karyawan' => $emp->nama_karyawan,
                    'nama_jabatan' => $emp->nama_jabatan,
                    'nama_dept' => $emp->nama_dept,
                    'jenis_upah' => $emp->jenis_upah ?? 'Bulanan',
                ],
                'summary' => [
                    'hari_kerja' => $hari_kerja,
                    'hari_hadir' => $hari_hadir,
                    'hari_terlambat' => $hari_terlambat,
                    'jam_lembur' => $total_jam_lembur_aktual,
                ],
                'penerimaan' => [
                    'gaji_pokok' => $gaji_pokok,
                    'tunjangan' => $tunjangan_breakdown,
                    'tunjangan_pajak' => $tunjangan_pajak,
                    'upah_lembur' => round($upah_lembur),
                    'penambah' => $penambah,
                    'keterangan_penyesuaian' => $emp->keterangan_penyesuaian ?? '',
                ],
                'potongan' => [
                    'potongan_jam' => round($jumlah_potongan_jam),
                    'denda' => $total_denda,
                    'bpjs_kesehatan' => $bpjs_kesehatan,
                    'bpjs_tenagakerja' => $bpjs_tenagakerja,
                    'cicilan_pinjaman' => $cicilan_pinjaman,
                    'potongan_pph21' => $potongan_pph21,
                    'pengurang' => $pengurang,
                ],
                'total_penerimaan' => $bruto_total,
                'total_potongan' => $total_potongan,
                'gaji_bersih' => $gaji_bersih,
            ]
        ]);
    }
}
