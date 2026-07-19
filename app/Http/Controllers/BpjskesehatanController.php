<?php

namespace App\Http\Controllers;

use App\Models\Bpjskesehatan;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BpjskesehatanController extends Controller
{
    public function index(Request $request)
    {
        $query = Bpjskesehatan::query()
            ->join('karyawan', 'karyawan_bpjskesehatan.nik', '=', 'karyawan.nik')
            ->select('karyawan_bpjskesehatan.*', 'karyawan.nama_karyawan', 'karyawan.nik_show');

        if ($request->filled('search')) {
            $query->where('karyawan.nama_karyawan', 'like', '%' . $request->search . '%')
                  ->orWhere('karyawan.nik_show', 'like', '%' . $request->search . '%');
        }

        $bpjskesehatans = $query->orderBy('karyawan.nama_karyawan')->paginate(10)->withQueryString();

        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Bpjskesehatan/Index', [
            'bpjskesehatans' => $bpjskesehatans,
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
            $last_bpjs = Bpjskesehatan::orderBy('kode_bpjs_kesehatan', 'desc')
                ->whereRaw('YEAR(tanggal_berlaku) = ' . $tahun)
                ->first();
            $last_kode = $last_bpjs ? $last_bpjs->kode_bpjs_kesehatan : '';

            $prefix = 'K' . substr($tahun, 2, 2);
            if ($last_kode && str_starts_with($last_kode, $prefix)) {
                $num = (int)substr($last_kode, 3);
                $kode_bpjs_kesehatan = $prefix . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $kode_bpjs_kesehatan = $prefix . '0001';
            }

            Bpjskesehatan::create([
                'kode_bpjs_kesehatan' => $kode_bpjs_kesehatan,
                'nik' => $request->nik,
                'jumlah' => $request->jumlah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'BPJS Kesehatan berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan BPJS Kesehatan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_bpjs_kesehatan)
    {
        $bpjs = Bpjskesehatan::where('kode_bpjs_kesehatan', $kode_bpjs_kesehatan)->firstOrFail();

        $request->validate([
            'jumlah' => 'required|numeric|min:0',
            'tanggal_berlaku' => 'required|date'
        ]);

        try {
            $bpjs->update([
                'jumlah' => $request->jumlah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'BPJS Kesehatan berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah BPJS Kesehatan: ' . $e->getMessage());
        }
    }

    public function destroy($kode_bpjs_kesehatan)
    {
        try {
            Bpjskesehatan::where('kode_bpjs_kesehatan', $kode_bpjs_kesehatan)->delete();
            return redirect()->back()->with('success', 'BPJS Kesehatan berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus BPJS Kesehatan: ' . $e->getMessage());
        }
    }
}
