<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use App\Models\Pengumuman;
use App\Models\Karyawan;
use App\Models\Pengaturanumum;
use App\Models\Cabang;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Fetch mobile dashboard data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;
        
        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $nik = $karyawan->nik;
        
        // Get Branch & Active Jam Kerja for GPS presence first to calculate correct local date
        $cabang = Cabang::where('kode_cabang', $karyawan->kode_cabang)->first();
        $general_setting = Pengaturanumum::where('id', 1)->first();
        $timezone_cabang = $cabang->timezone ?? $general_setting->timezone ?? config('app.timezone');
        $carbon_now = Carbon::now($timezone_cabang);
        $hariini = $carbon_now->format('Y-m-d');
        $jamsekarang = $carbon_now->format('H:i');
        $tgl_sebelumnya = $carbon_now->copy()->subDay()->format('Y-m-d');
        
        $cekpresensi_sebelumnya = Presensi::join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('tanggal', $tgl_sebelumnya)
            ->where('nik', $karyawan->nik)
            ->first();

        $ceklintashari_presensi = $cekpresensi_sebelumnya != null ? $cekpresensi_sebelumnya->lintashari : 0;

        if ($ceklintashari_presensi == 1 && ($cekpresensi_sebelumnya->jam_out == null)) {
            $batas_lh = $cekpresensi_sebelumnya->batas_presensi_pulang ?? ($general_setting ? $general_setting->batas_presensi_lintashari : '08:00:00');
            if ($jamsekarang < $batas_lh) {
                $hariini = $tgl_sebelumnya;
            }
        }

        // 1. Get today's attendance status using correct local date
        $presensi = Presensi::where('nik', $nik)
            ->where('tanggal', $hariini)
            ->first();

        // 2. Get monthly recap stats
        $rekap = Presensi::select(
            DB::raw("SUM(CASE WHEN status='h' THEN 1 ELSE 0 END) as hadir"),
            DB::raw("SUM(CASE WHEN status='i' THEN 1 ELSE 0 END) as izin"),
            DB::raw("SUM(CASE WHEN status='s' THEN 1 ELSE 0 END) as sakit"),
            DB::raw("SUM(CASE WHEN status='c' THEN 1 ELSE 0 END) as cuti"),
            DB::raw("SUM(CASE WHEN status='a' THEN 1 ELSE 0 END) as alpa")
        )
            ->where('nik', $nik)
            ->whereRaw("EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CAST(? AS DATE))", [$hariini])
            ->whereRaw("EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CAST(? AS DATE))", [$hariini])
            ->groupBy('nik')
            ->first();

        // 3. Get latest announcement
        $pengumuman = Pengumuman::orderBy('created_at', 'desc')->first();

        // 4. Check if it's user's birthday
        $is_birthday = false;
        $umur = null;
        if ($karyawan->tanggal_lahir) {
            $tanggalLahir = Carbon::parse($karyawan->tanggal_lahir);
            $today = Carbon::now();
            if ($tanggalLahir->month == $today->month && $tanggalLahir->day == $today->day) {
                $is_birthday = true;
                $umur = $tanggalLahir->age;
            }
        }

        $day = date('D', strtotime($hariini));
        $namahari = strtolower(Carbon::parse($hariini)->locale('id')->dayName);

        $kode_dept = $karyawan->kode_dept;
        $jamkerja = null;

        // Cek Jam Kerja By Date
        $jamkerja = DB::table('presensi_jamkerja_bydate')
            ->join('presensi_jamkerja', 'presensi_jamkerja_bydate.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('nik', $karyawan->nik)
            ->where('tanggal', $hariini)
            ->first();

        if ($jamkerja == null) {
            // Cek Jam Kerja harian
            $jamkerja = DB::table('presensi_jamkerja_byday')
                ->join('presensi_jamkerja', 'presensi_jamkerja_byday.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('nik', $karyawan->nik)
                ->where('hari', $namahari)
                ->first();
        }

        if ($jamkerja == null && $karyawan->kode_jadwal) {
            // Cek Jam Kerja Utama Karyawan (dari kolom kode_jadwal di tabel karyawan)
            $jamkerja = DB::table('presensi_jamkerja')
                ->where('kode_jam_kerja', $karyawan->kode_jadwal)
                ->first();
        }

        if ($jamkerja == null) {
            // Cek Jam Kerja by Dept
            $jamkerja = DB::table('presensi_jamkerja_bydept_detail')
                ->join('presensi_jamkerja_bydept', 'presensi_jamkerja_bydept_detail.kode_jk_dept', '=', 'presensi_jamkerja_bydept.kode_jk_dept')
                ->join('presensi_jamkerja', 'presensi_jamkerja_bydept_detail.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('kode_dept', $kode_dept)
                ->where('kode_cabang', $karyawan->kode_cabang)
                ->where('hari', $namahari)
                ->first();
        }

        if ($jamkerja == null) {
            // Fallback Jadwal Kerja Global
            if ($general_setting && $general_setting->global_jamkerja_aktif) {
                $globalJk = DB::table('global_jamkerja')->where('hari', $namahari)->first();
                if ($globalJk && $globalJk->kode_jam_kerja) {
                    $jamkerja = DB::table('presensi_jamkerja')->where('kode_jam_kerja', $globalJk->kode_jam_kerja)->first();
                }
            }
        }

        // 6. Get presence history
        $datapresensi = Presensi::join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('presensi.nik', $nik)
            ->leftJoin('presensi_izinabsen_approve', 'presensi.id', '=', 'presensi_izinabsen_approve.id_presensi')
            ->leftJoin('presensi_izinabsen', 'presensi_izinabsen_approve.kode_izin', '=', 'presensi_izinabsen.kode_izin')
            ->leftJoin('presensi_izinsakit_approve', 'presensi.id', '=', 'presensi_izinsakit_approve.id_presensi')
            ->leftJoin('presensi_izinsakit', 'presensi_izinsakit_approve.kode_izin_sakit', '=', 'presensi_izinsakit.kode_izin_sakit')
            ->leftJoin('presensi_izincuti_approve', 'presensi.id', '=', 'presensi_izincuti_approve.id_presensi')
            ->leftJoin('presensi_izincuti', 'presensi_izincuti_approve.kode_izin_cuti', '=', 'presensi_izincuti.kode_izin_cuti')
            ->leftJoin('mesin_fingerprints', 'presensi.id_mesin', '=', 'mesin_fingerprints.id')
            ->select(
                'presensi.*',
                'presensi_jamkerja.nama_jam_kerja',
                'presensi_jamkerja.jam_masuk',
                'presensi_jamkerja.jam_pulang',
                'presensi_jamkerja.total_jam',
                'presensi_jamkerja.lintashari',
                'presensi_izinabsen.keterangan as keterangan_izin',
                'presensi_izinsakit.keterangan as keterangan_izin_sakit',
                'presensi_izincuti.keterangan as keterangan_izin_cuti',
                'mesin_fingerprints.nama_mesin'
            )
            ->orderBy('presensi.tanggal', 'desc')
            ->limit(30)
            ->get();

        $history = [];
        foreach ($datapresensi as $d) {
            $keterangan = null;
            if ($d->status == 'i') {
                $keterangan = 'Izin: ' . $d->keterangan_izin;
            } else if ($d->status == 's') {
                $keterangan = 'Sakit: ' . $d->keterangan_izin_sakit;
            } else if ($d->status == 'c') {
                $keterangan = 'Cuti: ' . $d->keterangan_izin_cuti;
            } else if ($d->status == 'a') {
                $keterangan = 'Alpha';
            } else {
                $keterangan = 'Hadir';
            }

            $history[] = [
                'id' => $d->id,
                'tanggal' => $d->tanggal,
                'jam_in' => $d->jam_in ? date('H:i', strtotime($d->jam_in)) : null,
                'jam_out' => $d->jam_out ? date('H:i', strtotime($d->jam_out)) : null,
                'status' => $d->status,
                'nama_jam_kerja' => $d->nama_jam_kerja,
                'jam_masuk' => $d->jam_masuk ? date('H:i', strtotime($d->jam_masuk)) : null,
                'jam_pulang' => $d->jam_pulang ? date('H:i', strtotime($d->jam_pulang)) : null,
                'keterangan' => $keterangan,
                'foto_in' => $d->foto_in ? asset('storage/uploads/absensi/' . $d->foto_in) : null,
                'foto_out' => $d->foto_out ? asset('storage/uploads/absensi/' . $d->foto_out) : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'history' => $history,
                'presensi' => $presensi ? [
                    'jam_in' => $presensi->jam_in ? date('H:i', strtotime($presensi->jam_in)) : null,
                    'jam_out' => $presensi->jam_out ? date('H:i', strtotime($presensi->jam_out)) : null,
                    'foto_in' => $presensi->foto_in ? asset('storage/uploads/absensi/' . $presensi->foto_in) : null,
                    'foto_out' => $presensi->foto_out ? asset('storage/uploads/absensi/' . $presensi->foto_out) : null,
                    'istirahat_out' => $presensi->istirahat_out ? date('H:i', strtotime($presensi->istirahat_out)) : null,
                    'istirahat_in' => $presensi->istirahat_in ? date('H:i', strtotime($presensi->istirahat_in)) : null,
                ] : null,
                'rekap' => [
                    'hadir' => (int) ($rekap->hadir ?? 0),
                    'sakit' => (int) ($rekap->sakit ?? 0),
                    'izin' => (int) ($rekap->izin ?? 0),
                    'cuti' => (int) ($rekap->cuti ?? 0),
                    'alpa' => (int) ($rekap->alpa ?? 0),
                ],
                'is_birthday' => $is_birthday,
                'umur' => $umur,
                'pengumuman' => $pengumuman ? [
                    'id' => $pengumuman->id,
                    'judul' => $pengumuman->judul,
                    'isi' => strip_tags($pengumuman->isi),
                    'created_at' => Carbon::parse($pengumuman->created_at)->translatedFormat('d F Y'),
                ] : null,
                'cabang' => $cabang ? [
                    'nama_cabang' => $cabang->nama_cabang,
                    'lokasi_cabang' => $cabang->lokasi_cabang,
                    'radius_cabang' => (int) $cabang->radius_cabang,
                ] : null,
                'lock_location' => $karyawan ? (int) $karyawan->lock_location : 1,
                'jam_kerja' => $jamkerja ? [
                    'kode_jam_kerja' => $jamkerja->kode_jam_kerja,
                    'nama_jam_kerja' => $jamkerja->nama_jam_kerja,
                    'jam_masuk' => $jamkerja->jam_masuk ? date('H:i', strtotime($jamkerja->jam_masuk)) : null,
                    'jam_pulang' => $jamkerja->jam_pulang ? date('H:i', strtotime($jamkerja->jam_pulang)) : null,
                    'lintashari' => (int) $jamkerja->lintashari,
                    'istirahat' => (int) ($jamkerja->istirahat ?? 0),
                    'jam_awal_istirahat' => $jamkerja->jam_awal_istirahat ? date('H:i', strtotime($jamkerja->jam_awal_istirahat)) : null,
                    'jam_akhir_istirahat' => $jamkerja->jam_akhir_istirahat ? date('H:i', strtotime($jamkerja->jam_akhir_istirahat)) : null,
                ] : null,
                'general_setting' => $general_setting ? [
                    'nama_perusahaan' => $general_setting->nama_perusahaan,
                    'logo' => $general_setting->logo ? asset('storage/logo/' . $general_setting->logo) : null,
                ] : null,
                'features' => $general_setting ? [
                    'visit_tracking' => (bool) $general_setting->feature_visit_tracking,
                    'daily_activity' => (bool) $general_setting->feature_daily_activity,
                    'wa_notification' => (bool) $general_setting->feature_wa_notification,
                ] : [
                    'visit_tracking' => true,
                    'daily_activity' => true,
                    'wa_notification' => true,
                ],
            ]
        ]);
    }
}
