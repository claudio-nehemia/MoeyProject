<?php

namespace App\Http\Controllers;

use App\Models\SlipgajiHarian;
use App\Models\SlipgajiHarianDetail;
use App\Models\Karyawan;
use App\Models\Presensi;
use App\Models\Gajipokok;
use App\Models\Pengaturanumum;
use App\Models\Denda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SlipgajiHarianController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'dari' => 'required|date',
            'sampai' => 'required|date',
            'tanggal_slip' => 'required|date',
            'status' => 'required|in:0,1',
            'nik' => 'nullable|array',
            'nik.*' => 'exists:karyawan,nik'
        ]);

        DB::beginTransaction();
        try {
            $dari = $request->dari;
            $sampai = $request->sampai;
            $kode = 'SGH' . date('Ymd', strtotime($dari));

            $exists = SlipgajiHarian::where('kode_slip_gaji_harian', $kode)->exists();
            if ($exists) {
                return redirect()->back()->with('error', 'Data slip gaji harian dengan periode tersebut sudah ada.');
            }

            SlipgajiHarian::create([
                'kode_slip_gaji_harian' => $kode,
                'tanggal_slip' => $request->tanggal_slip,
                'dari' => $dari,
                'sampai' => $sampai,
                'status' => $request->status
            ]);

            if ($request->filled('nik') && is_array($request->nik)) {
                foreach ($request->nik as $nik) {
                    SlipgajiHarianDetail::create([
                        'kode_slip_gaji_harian' => $kode,
                        'nik' => $nik
                    ]);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Slip gaji harian berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal membuat slip gaji harian: ' . $e->getMessage());
        }
    }

    public function show($kode_slip)
    {
        $slipgaji = SlipgajiHarian::where('kode_slip_gaji_harian', $kode_slip)->firstOrFail();
        $detail = SlipgajiHarianDetail::where('kode_slip_gaji_harian', $kode_slip)
            ->join('karyawan', 'slip_gaji_harian_detail.nik', '=', 'karyawan.nik')
            ->join('jabatan', 'karyawan.kode_jabatan', '=', 'jabatan.kode_jabatan')
            ->join('departemen', 'karyawan.kode_dept', '=', 'departemen.kode_dept')
            ->select('slip_gaji_harian_detail.nik', 'karyawan.nama_karyawan', 'karyawan.nik_show', 'jabatan.nama_jabatan', 'departemen.nama_dept')
            ->get();

        return Inertia::render('SlipgajiHarian/Show', [
            'slipgaji' => $slipgaji,
            'detail' => $detail
        ]);
    }

    public function update(Request $request, $kode_slip)
    {
        $slip = SlipgajiHarian::where('kode_slip_gaji_harian', $kode_slip)->firstOrFail();

        $request->validate([
            'dari' => 'required|date',
            'sampai' => 'required|date',
            'tanggal_slip' => 'required|date',
            'status' => 'required|in:0,1',
            'nik' => 'nullable|array',
            'nik.*' => 'exists:karyawan,nik'
        ]);

        DB::beginTransaction();
        try {
            $slip->update([
                'tanggal_slip' => $request->tanggal_slip,
                'dari' => $request->dari,
                'sampai' => $request->sampai,
                'status' => $request->status
            ]);

            SlipgajiHarianDetail::where('kode_slip_gaji_harian', $kode_slip)->delete();

            if ($request->filled('nik') && is_array($request->nik)) {
                foreach ($request->nik as $nik) {
                    SlipgajiHarianDetail::create([
                        'kode_slip_gaji_harian' => $kode_slip,
                        'nik' => $nik
                    ]);
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Slip gaji harian berhasil diubah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal mengubah slip gaji harian: ' . $e->getMessage());
        }
    }

    public function destroy($kode_slip)
    {
        try {
            SlipgajiHarian::where('kode_slip_gaji_harian', $kode_slip)->delete();
            return redirect()->back()->with('success', 'Slip gaji harian berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus slip gaji harian: ' . $e->getMessage());
        }
    }

    public function cetak(Request $request)
    {
        $periode_dari = $request->dari;
        $periode_sampai = $request->sampai;
        $nik = $request->nik;

        if (empty($nik)) {
            return redirect()->back()->with('error', 'Pilih karyawan terlebih dahulu!');
        }

        $karyawan = Karyawan::whereIn('karyawan.nik', $nik)
            ->leftJoin('jabatan', 'karyawan.kode_jabatan', '=', 'jabatan.kode_jabatan')
            ->leftJoin('departemen', 'karyawan.kode_dept', '=', 'departemen.kode_dept')
            ->select('karyawan.*', 'jabatan.nama_jabatan', 'departemen.nama_dept')
            ->get();

        $presensi = Presensi::whereIn('nik', $nik)
            ->whereBetween('tanggal', [$periode_dari, $periode_sampai])
            ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->select('presensi.*', 'presensi_jamkerja.jam_masuk', 'presensi_jamkerja.jam_pulang')
            ->get();

        $gaji_pokok = Gajipokok::whereIn('nik', $nik)
            ->whereIn('kode_gaji', function($query) use ($periode_sampai) {
                $query->select(DB::raw('MAX(kode_gaji)'))
                    ->from('karyawan_gaji_pokok')
                    ->where('tanggal_berlaku', '<=', $periode_sampai)
                    ->groupBy('nik');
            })->pluck('jumlah', 'nik');

        $data['generalsetting'] = Pengaturanumum::where('id', 1)->first();
        $data['denda_list'] = Denda::all()->toArray();
        $data['periode_dari'] = $periode_dari;
        $data['periode_sampai'] = $periode_sampai;

        $laporan_presensi = $karyawan->mapWithKeys(function($k) use ($presensi, $gaji_pokok) {
            $emp_presensi = $presensi->where('nik', $k->nik);
            
            $item = [
                'nik' => $k->nik,
                'nik_show' => $k->nik_show,
                'nama_karyawan' => $k->nama_karyawan,
                'nama_jabatan' => $k->nama_jabatan,
                'nama_dept' => $k->nama_dept,
                'kode_dept' => $k->kode_dept,
                'gaji_pokok' => $gaji_pokok[$k->nik] ?? 0,
            ];

            foreach($emp_presensi as $p) {
                $item[$p->tanggal] = [
                    'status' => $p->status,
                    'jam_in' => $p->jam_in,
                    'jam_masuk' => $p->jam_masuk,
                    'denda' => $p->denda,
                ];
            }

            return [$k->nik => $item];
        });

        $data['laporan_presensi'] = $laporan_presensi;

        return view('laporan.slip_harian_cetak', $data);
    }
}
