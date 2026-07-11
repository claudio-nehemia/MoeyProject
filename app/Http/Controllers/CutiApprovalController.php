<?php

namespace App\Http\Controllers;

use App\Models\Izinabsen;
use App\Models\Izincuti;
use App\Models\Izindinas;
use App\Models\Izinsakit;
use App\Models\Koreksi;
use App\Models\Lembur;
use App\Models\Pengaturanumum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CutiApprovalController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $general = Pengaturanumum::first();
        $allowedRoleId = $general ? $general->cuti_approval_role_id : null;

        if (!$allowedRoleId || $user->role_id != $allowedRoleId) {
            abort(403, 'Anda tidak memiliki hak akses untuk menyetujui pengajuan.');
        }

        $izinabsen = $this->getPendingIzinAbsen();
        $izincuti = $this->getPendingIzinCuti();
        $izinsakit = $this->getPendingIzinSakit();
        $izindinas = $this->getPendingIzinDinas();
        $koreksi = $this->getPendingKoreksi();
        $lembur = $this->getPendingLembur();

        $allPending = $izinabsen->concat($izincuti)
            ->concat($izinsakit)
            ->concat($izindinas)
            ->concat($koreksi)
            ->concat($lembur)
            ->sortByDesc('tanggal')
            ->values()
            ->all();

        return Inertia::render('Cuti/Approval', [
            'pendingList' => $allPending
        ]);
    }

    private function getPendingIzinAbsen()
    {
        return Izinabsen::where('status', 0)
            ->join('karyawan', 'presensi_izinabsen.nik', '=', 'karyawan.nik')
            ->select('presensi_izinabsen.kode_izin as id', 'presensi_izinabsen.tanggal', 'presensi_izinabsen.keterangan', 'presensi_izinabsen.dari', 'presensi_izinabsen.sampai', DB::raw("'Izin Absen' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get();
    }

    private function getPendingIzinCuti()
    {
        return Izincuti::where('status', 0)
            ->join('karyawan', 'presensi_izincuti.nik', '=', 'karyawan.nik')
            ->select('presensi_izincuti.kode_izin_cuti as id', 'presensi_izincuti.tanggal', 'presensi_izincuti.keterangan', 'presensi_izincuti.dari', 'presensi_izincuti.sampai', DB::raw("'Cuti' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get();
    }

    private function getPendingIzinSakit()
    {
        return Izinsakit::where('status', 0)
            ->join('karyawan', 'presensi_izinsakit.nik', '=', 'karyawan.nik')
            ->select('presensi_izinsakit.kode_izin_sakit as id', 'presensi_izinsakit.tanggal', 'presensi_izinsakit.keterangan', 'presensi_izinsakit.dari', 'presensi_izinsakit.sampai', DB::raw("'Sakit' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get();
    }

    private function getPendingIzinDinas()
    {
        return Izindinas::where('status', 0)
            ->join('karyawan', 'presensi_izindinas.nik', '=', 'karyawan.nik')
            ->select('presensi_izindinas.kode_izin_dinas as id', 'presensi_izindinas.tanggal', 'presensi_izindinas.keterangan', 'presensi_izindinas.dari', 'presensi_izindinas.sampai', DB::raw("'Dinas' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get();
    }

    private function getPendingKoreksi()
    {
        return Koreksi::where('status', 0)
            ->join('karyawan', 'presensi_koreksi.nik', '=', 'karyawan.nik')
            ->select('presensi_koreksi.kode_koreksi as id', 'presensi_koreksi.tanggal', 'presensi_koreksi.keterangan', 'presensi_koreksi.tanggal as dari', 'presensi_koreksi.tanggal as sampai', DB::raw("'Koreksi Absen' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get();
    }

    private function getPendingLembur()
    {
        return Lembur::where('status', 0)
            ->join('karyawan', 'lembur.nik', '=', 'karyawan.nik')
            ->select('lembur.id as id', 'lembur.tanggal', 'lembur.keterangan', 'lembur.lembur_mulai as dari', 'lembur.lembur_selesai as sampai', DB::raw("'Lembur' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get()->map(function($item) {
                $item->id = (string) $item->id;
                return $item;
            });
    }

    public function approve(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'tipe' => 'required|string',
            'action' => 'required|in:1,2'
        ]);

        $id = $request->id;
        $tipe = $request->tipe;
        $action = $request->action;

        if ($tipe === 'Izin Absen') {
            Izinabsen::where('kode_izin', $id)->update(['status' => $action]);
        } elseif ($tipe === 'Cuti') {
            Izincuti::where('kode_izin_cuti', $id)->update(['status' => $action]);
        } elseif ($tipe === 'Sakit') {
            Izinsakit::where('kode_izin_sakit', $id)->update(['status' => $action]);
        } elseif ($tipe === 'Dinas') {
            Izindinas::where('kode_izin_dinas', $id)->update(['status' => $action]);
        } elseif ($tipe === 'Koreksi Absen') {
            Koreksi::where('kode_koreksi', $id)->update(['status' => $action]);
            if ($action === '1') {
                $koreksi = Koreksi::where('kode_koreksi', $id)->first();
                if ($koreksi) {
                    $presensi = \App\Models\Presensi::where('nik', $koreksi->nik)
                        ->where('tanggal', $koreksi->tanggal)
                        ->first();

                    $dataPresensi = [
                        'nik' => $koreksi->nik,
                        'tanggal' => $koreksi->tanggal,
                        'kode_jam_kerja' => $koreksi->kode_jam_kerja,
                        'status' => 'h',
                    ];

                    if ($koreksi->jam_in) {
                        $dataPresensi['jam_in'] = $koreksi->tanggal . ' ' . $koreksi->jam_in;
                    }
                    if ($koreksi->jam_out) {
                        $dataPresensi['jam_out'] = $koreksi->tanggal . ' ' . $koreksi->jam_out;
                    }

                    if ($presensi) {
                        $presensi->update($dataPresensi);
                    } else {
                        \App\Models\Presensi::create($dataPresensi);
                    }
                }
            }
        } elseif ($tipe === 'Lembur') {
            Lembur::where('id', intval($id))->update(['status' => $action]);
        }

        return redirect()->back()->with('success', 'Pengajuan berhasil diproses.');
    }
}
