<?php

namespace App\Http\Controllers;

use App\Models\Detailpenyesuaiangaji;
use App\Models\Karyawan;
use App\Models\Penyesuaiangaji;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PenyesuaiangajiController extends Controller
{
    public function index(Request $request)
    {
        $tahun = $request->filled('tahun') ? $request->tahun : date('Y');
        $penyesuaiangaji = Penyesuaiangaji::where('tahun', $tahun)->orderBy('bulan')->get();
        
        $list_bulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        return Inertia::render('Penyesuaiangaji/Index', [
            'penyesuaiangajis' => $penyesuaiangaji,
            'tahun' => (int)$tahun,
            'list_bulan' => $list_bulan
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer',
        ]);

        $bulan_pad = str_pad($request->bulan, 2, '0', STR_PAD_LEFT);
        $kode_penyesuaian_gaji = 'PYG' . $bulan_pad . $request->tahun;

        try {
            $cek = Penyesuaiangaji::where('bulan', $request->bulan)->where('tahun', $request->tahun)->first();
            if ($cek) {
                return redirect()->back()->with('error', 'Data penyesuaian untuk periode ini sudah ada.');
            }

            Penyesuaiangaji::create([
                'kode_penyesuaian_gaji' => $kode_penyesuaian_gaji,
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
            ]);

            return redirect()->back()->with('success', 'Penyesuaian gaji berhasil dibuat.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal membuat penyesuaian: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_penyesuaian_gaji)
    {
        $pg = Penyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)->firstOrFail();

        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer',
        ]);

        $bulan_pad = str_pad($request->bulan, 2, '0', STR_PAD_LEFT);
        $kode_penyesuaian_gaji_new = 'PYG' . $bulan_pad . $request->tahun;

        try {
            $cek = Penyesuaiangaji::where('bulan', $request->bulan)
                ->where('tahun', $request->tahun)
                ->where('kode_penyesuaian_gaji', '!=', $kode_penyesuaian_gaji)
                ->first();
            if ($cek) {
                return redirect()->back()->with('error', 'Data penyesuaian untuk periode baru sudah ada.');
            }

            $pg->update([
                'kode_penyesuaian_gaji' => $kode_penyesuaian_gaji_new,
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
            ]);

            return redirect()->back()->with('success', 'Penyesuaian gaji berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah penyesuaian: ' . $e->getMessage());
        }
    }

    public function destroy($kode_penyesuaian_gaji)
    {
        try {
            Penyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)->delete();
            return redirect()->back()->with('success', 'Penyesuaian gaji berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus penyesuaian: ' . $e->getMessage());
        }
    }

    public function setkaryawan($kode_penyesuaian_gaji)
    {
        $penyesuaiangaji = Penyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)->firstOrFail();
        $detailpenyesuaian = Detailpenyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)
            ->join('karyawan', 'karyawan_penyesuaian_gaji_detail.nik', '=', 'karyawan.nik')
            ->select('karyawan_penyesuaian_gaji_detail.*', 'karyawan.nama_karyawan', 'karyawan.nik_show')
            ->get();

        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Penyesuaiangaji/SetKaryawan', [
            'penyesuaiangaji' => $penyesuaiangaji,
            'detailpenyesuaian' => $detailpenyesuaian,
            'karyawans' => $karyawans
        ]);
    }

    public function storekaryawan(Request $request, $kode_penyesuaian_gaji)
    {
        $request->validate([
            'nik' => 'required|exists:karyawan,nik',
            'penambah' => 'required|numeric|min:0',
            'pengurang' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:255',
        ]);

        try {
            $cek = Detailpenyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)
                ->where('nik', $request->nik)
                ->first();
            if ($cek) {
                return redirect()->back()->with('error', 'Karyawan sudah ditambahkan ke penyesuaian ini.');
            }

            Detailpenyesuaiangaji::create([
                'kode_penyesuaian_gaji' => $kode_penyesuaian_gaji,
                'nik' => $request->nik,
                'penambah' => $request->penambah,
                'pengurang' => $request->pengurang,
                'keterangan' => $request->keterangan
            ]);

            return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan ke penyesuaian.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan karyawan: ' . $e->getMessage());
        }
    }

    public function updatekaryawan(Request $request, $kode_penyesuaian_gaji, $nik)
    {
        $request->validate([
            'penambah' => 'required|numeric|min:0',
            'pengurang' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:255',
        ]);

        try {
            Detailpenyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)
                ->where('nik', $nik)
                ->update([
                    'penambah' => $request->penambah,
                    'pengurang' => $request->pengurang,
                    'keterangan' => $request->keterangan
                ]);

            return redirect()->back()->with('success', 'Detail penyesuaian karyawan berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah detail karyawan: ' . $e->getMessage());
        }
    }

    public function destroykaryawan($kode_penyesuaian_gaji, $nik)
    {
        try {
            Detailpenyesuaiangaji::where('kode_penyesuaian_gaji', $kode_penyesuaian_gaji)
                ->where('nik', $nik)
                ->delete();

            return redirect()->back()->with('success', 'Karyawan berhasil dihapus dari penyesuaian.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus karyawan: ' . $e->getMessage());
        }
    }
}
