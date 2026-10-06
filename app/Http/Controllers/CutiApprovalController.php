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

        $isAdmin = $user->role?->nama_role === 'Admin' || $user->role?->nama_role === 'Super Admin';
        $hasPermission = $user->hasPermission('approve-cuti.index') || $user->hasPermission('karyawan.index');
        $isRoleAllowed = $allowedRoleId && ($user->role_id == $allowedRoleId || $user->roles()->where('roles.id', $allowedRoleId)->exists());

        if (!$isAdmin && !$hasPermission && !$isRoleAllowed) {
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
            ->sortByDesc(function ($item) {
                return $item->created_at ? strtotime($item->created_at) : strtotime($item->tanggal);
            })
            ->values()
            ->map(function ($item) {
                $item->id = (string) $item->id;
                $createdAt = $item->created_at ? \Carbon\Carbon::parse($item->created_at)->timezone('Asia/Jakarta') : null;
                $item->jam_pengajuan = $createdAt ? $createdAt->format('H:i:s') : null;
                $item->waktu_pengajuan = $createdAt ? $createdAt->translatedFormat('d F Y, H:i:s') : null;
                $item->created_at_raw = $createdAt ? $createdAt->toIso8601String() : null;

                $item->doc_url = null;
                if (!empty($item->doc_cuti)) {
                    $item->doc_url = asset('storage/uploads/cuti/' . $item->doc_cuti);
                } elseif (!empty($item->doc_sid)) {
                    $item->doc_url = asset('storage/uploads/sid/' . $item->doc_sid);
                } elseif (!empty($item->doc_izin)) {
                    $item->doc_url = asset('storage/uploads/absen/' . $item->doc_izin);
                } elseif (!empty($item->doc_dinas)) {
                    $item->doc_url = asset('storage/uploads/dinas/' . $item->doc_dinas);
                } elseif (!empty($item->doc_koreksi)) {
                    $item->doc_url = asset('storage/uploads/koreksi/' . $item->doc_koreksi);
                }

                return $item;
            })
            ->all();

        return Inertia::render('Cuti/Approval', [
            'pendingList' => $allPending
        ]);
    }

    private function getPendingIzinAbsen()
    {
        $hasDoc = \Illuminate\Support\Facades\Schema::hasColumn('presensi_izinabsen', 'doc_izin');
        return Izinabsen::where('status', 0)
            ->join('karyawan', 'presensi_izinabsen.nik', '=', 'karyawan.nik')
            ->select(
                'presensi_izinabsen.kode_izin as id',
                'presensi_izinabsen.tanggal',
                'presensi_izinabsen.created_at',
                'presensi_izinabsen.keterangan',
                'presensi_izinabsen.dari',
                'presensi_izinabsen.sampai',
                DB::raw("'Izin Absen' as tipe"),
                'karyawan.nama_karyawan',
                'karyawan.nik',
                $hasDoc ? 'presensi_izinabsen.doc_izin' : DB::raw('NULL as doc_izin')
            )
            ->get();
    }

    private function getPendingIzinCuti()
    {
        $hasDocCuti = \Illuminate\Support\Facades\Schema::hasColumn('presensi_izincuti', 'doc_cuti');
        return Izincuti::where('status', 0)
            ->join('karyawan', 'presensi_izincuti.nik', '=', 'karyawan.nik')
            ->select(
                'presensi_izincuti.kode_izin_cuti as id',
                'presensi_izincuti.tanggal',
                'presensi_izincuti.created_at',
                'presensi_izincuti.keterangan',
                'presensi_izincuti.dari',
                'presensi_izincuti.sampai',
                DB::raw("'Cuti' as tipe"),
                'karyawan.nama_karyawan',
                'karyawan.nik',
                $hasDocCuti ? 'presensi_izincuti.doc_cuti' : DB::raw('NULL as doc_cuti')
            )
            ->get();
    }

    private function getPendingIzinSakit()
    {
        return Izinsakit::where('status', 0)
            ->join('karyawan', 'presensi_izinsakit.nik', '=', 'karyawan.nik')
            ->select(
                'presensi_izinsakit.kode_izin_sakit as id',
                'presensi_izinsakit.tanggal',
                'presensi_izinsakit.created_at',
                'presensi_izinsakit.keterangan',
                'presensi_izinsakit.dari',
                'presensi_izinsakit.sampai',
                DB::raw("'Sakit' as tipe"),
                'karyawan.nama_karyawan',
                'karyawan.nik',
                'presensi_izinsakit.doc_sid'
            )
            ->get();
    }

    private function getPendingIzinDinas()
    {
        $hasDoc = \Illuminate\Support\Facades\Schema::hasColumn('presensi_izindinas', 'doc_dinas');
        return Izindinas::where('status', 0)
            ->join('karyawan', 'presensi_izindinas.nik', '=', 'karyawan.nik')
            ->select(
                'presensi_izindinas.kode_izin_dinas as id',
                'presensi_izindinas.tanggal',
                'presensi_izindinas.created_at',
                'presensi_izindinas.keterangan',
                'presensi_izindinas.dari',
                'presensi_izindinas.sampai',
                DB::raw("'Dinas' as tipe"),
                'karyawan.nama_karyawan',
                'karyawan.nik',
                $hasDoc ? 'presensi_izindinas.doc_dinas' : DB::raw('NULL as doc_dinas')
            )
            ->get();
    }

    private function getPendingKoreksi()
    {
        $hasDoc = \Illuminate\Support\Facades\Schema::hasColumn('presensi_koreksi', 'doc_koreksi');
        return Koreksi::where('status', 0)
            ->join('karyawan', 'presensi_koreksi.nik', '=', 'karyawan.nik')
            ->select(
                'presensi_koreksi.kode_koreksi as id',
                'presensi_koreksi.tanggal',
                'presensi_koreksi.created_at',
                'presensi_koreksi.jam_in',
                'presensi_koreksi.jam_out',
                'presensi_koreksi.keterangan',
                'presensi_koreksi.tanggal as dari',
                'presensi_koreksi.tanggal as sampai',
                DB::raw("'Koreksi Absen' as tipe"),
                'karyawan.nama_karyawan',
                'karyawan.nik',
                $hasDoc ? 'presensi_koreksi.doc_koreksi' : DB::raw('NULL as doc_koreksi')
            )
            ->get();
    }

    private function getPendingLembur()
    {
        return Lembur::where('status', 0)
            ->join('karyawan', 'lembur.nik', '=', 'karyawan.nik')
            ->select('lembur.id as id', 'lembur.tanggal', 'lembur.created_at', 'lembur.keterangan', 'lembur.lembur_mulai as dari', 'lembur.lembur_selesai as sampai', DB::raw("'Lembur' as tipe"), 'karyawan.nama_karyawan', 'karyawan.nik')
            ->get()->map(function($item) {
                $item->id = (string) $item->id;
                return $item;
            });
    }

    public function approve(Request $request)
    {
        $user = auth()->user();
        $general = Pengaturanumum::first();
        $allowedRoleId = $general ? $general->cuti_approval_role_id : null;

        $isAdmin = $user->role?->nama_role === 'Admin' || $user->role?->nama_role === 'Super Admin';
        $hasPermission = $user->hasPermission('approve-cuti.approve') || $user->hasPermission('approve-cuti.index') || $user->hasPermission('karyawan.index');
        $isRoleAllowed = $allowedRoleId && ($user->role_id == $allowedRoleId || $user->roles()->where('roles.id', $allowedRoleId)->exists());

        if (!$isAdmin && !$hasPermission && !$isRoleAllowed) {
            abort(403, 'Anda tidak memiliki hak akses untuk memproses pengajuan.');
        }
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
