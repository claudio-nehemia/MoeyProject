<?php

namespace App\Http\Controllers;

use App\Models\Gajipokok;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GajipokokController extends Controller
{
    public function index(Request $request)
    {
        $query = Gajipokok::query()
            ->join('karyawan', 'karyawan_gaji_pokok.nik', '=', 'karyawan.nik')
            ->select('karyawan_gaji_pokok.*', 'karyawan.nama_karyawan', 'karyawan.nik_show');

        if ($request->filled('search')) {
            $query->where('karyawan.nama_karyawan', 'like', '%' . $request->search . '%')
                  ->orWhere('karyawan.nik_show', 'like', '%' . $request->search . '%');
        }

        $gajipokoks = $query->orderBy('karyawan.nama_karyawan')->paginate(10)->withQueryString();

        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Gajipokok/Index', [
            'gajipokoks' => $gajipokoks,
            'karyawans' => $karyawans,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nik' => 'required|exists:karyawan,nik',
            'jumlah' => 'required|numeric|min:0',
            'jenis_upah' => 'required|in:Bulanan,Harian',
            'tanggal_berlaku' => 'required|date'
        ]);

        try {
            $tahun_gaji = date('Y', strtotime($request->tanggal_berlaku));
            $last_gaji = Gajipokok::orderBy('kode_gaji', 'desc')
                ->whereRaw('YEAR(tanggal_berlaku) = ' . $tahun_gaji)
                ->first();
            $last_kode_gaji = $last_gaji ? $last_gaji->kode_gaji : '';
            
            // Generate code G260001
            $prefix = 'G' . substr($tahun_gaji, 2, 2);
            if ($last_kode_gaji && str_starts_with($last_kode_gaji, $prefix)) {
                $num = (int)substr($last_kode_gaji, 3);
                $kode_gaji = $prefix . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $kode_gaji = $prefix . '0001';
            }

            Gajipokok::create([
                'kode_gaji' => $kode_gaji,
                'nik' => $request->nik,
                'jumlah' => $request->jumlah,
                'jenis_upah' => $request->jenis_upah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'Gaji pokok berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan gaji pokok: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_gaji)
    {
        $gp = Gajipokok::where('kode_gaji', $kode_gaji)->firstOrFail();

        $request->validate([
            'jumlah' => 'required|numeric|min:0',
            'jenis_upah' => 'required|in:Bulanan,Harian',
            'tanggal_berlaku' => 'required|date'
        ]);

        try {
            $gp->update([
                'jumlah' => $request->jumlah,
                'jenis_upah' => $request->jenis_upah,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            return redirect()->back()->with('success', 'Gaji pokok berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah gaji pokok: ' . $e->getMessage());
        }
    }

    public function destroy($kode_gaji)
    {
        try {
            Gajipokok::where('kode_gaji', $kode_gaji)->delete();
            return redirect()->back()->with('success', 'Gaji pokok berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus gaji pokok: ' . $e->getMessage());
        }
    }
}
