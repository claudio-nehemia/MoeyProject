<?php

namespace App\Http\Controllers;

use App\Models\Bpjstenagakerja;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BpjstenagakerjaController extends Controller
{
    public function index(Request $request)
    {
        $query = Bpjstenagakerja::query()
            ->join('karyawan', 'karyawan_bpjstenagakerja.nik', '=', 'karyawan.nik')
            ->select('karyawan_bpjstenagakerja.*', 'karyawan.nama_karyawan', 'karyawan.nik_show');

        if ($request->filled('search')) {
            $query->where('karyawan.nama_karyawan', 'like', '%' . $request->search . '%')
                  ->orWhere('karyawan.nik_show', 'like', '%' . $request->search . '%');
        }

        $bpjstenagakerjas = $query->orderBy('karyawan.nama_karyawan')->paginate(10)->withQueryString();

        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Bpjstenagakerja/Index', [
            'bpjstenagakerjas' => $bpjstenagakerjas,
            'karyawans' => $karyawans,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nik' => 'required|exists:karyawan,nik',
            'jumlah' => 'required|numeric|min:0',
            'tanggal_berlaku' => 'required|date'
        ]);

        try {
            $tahun = date('Y', strtotime($request->tanggal_berlaku));
            $last_bpjs = Bpjstenagakerja::orderBy('kode_bpjs_tk', 'desc')
                ->whereYear('tanggal_berlaku', $tahun)
                ->first();
            $last_kode = $last_bpjs ? $last_bpjs->kode_bpjs_tk : '';

            $prefix = 'T' . substr($tahun, 2, 2);
            if ($last_kode && str_starts_with($last_kode, $prefix)) {
                $num = (int)substr($last_kode, 3);
                $kode_bpjs_tk = $prefix . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $kode_bpjs_tk = $prefix . '0001';
            }

            Bpjstenagakerja::create([
                'kode_bpjs_tk' => $kode_bpjs_tk,
                'nik' => $request->nik,
                'jumlah' => $request->jumlah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'BPJS Ketenagakerjaan berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan BPJS Ketenagakerjaan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_bpjs_tk)
    {
        $bpjs = Bpjstenagakerja::where('kode_bpjs_tk', $kode_bpjs_tk)->firstOrFail();

        $request->validate([
            'jumlah' => 'required|numeric|min:0',
            'tanggal_berlaku' => 'required|date'
        ]);

        try {
            $bpjs->update([
                'jumlah' => $request->jumlah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'BPJS Ketenagakerjaan berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah BPJS Ketenagakerjaan: ' . $e->getMessage());
        }
    }

    public function destroy($kode_bpjs_tk)
    {
        try {
            Bpjstenagakerja::where('kode_bpjs_tk', $kode_bpjs_tk)->delete();
            return redirect()->back()->with('success', 'BPJS Ketenagakerjaan berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus BPJS Ketenagakerjaan: ' . $e->getMessage());
        }
    }
}
