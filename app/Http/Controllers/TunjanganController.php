<?php

namespace App\Http\Controllers;

use App\Models\Detailtunjangan;
use App\Models\Jenistunjangan;
use App\Models\Karyawan;
use App\Models\Tunjangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TunjanganController extends Controller
{
    public function index(Request $request)
    {
        $jenis_tunjangan = Jenistunjangan::orderBy('kode_jenis_tunjangan')->get();
        
        $select_tunjangan = [];
        foreach ($jenis_tunjangan as $d) {
            $select_tunjangan[] = DB::raw("SUM(CASE WHEN karyawan_tunjangan_detail.kode_jenis_tunjangan = '" . $d->kode_jenis_tunjangan . "' THEN karyawan_tunjangan_detail.jumlah ELSE 0 END) as jumlah_" . $d->kode_jenis_tunjangan);
        }

        $query = Detailtunjangan::query()
            ->join('karyawan_tunjangan', 'karyawan_tunjangan_detail.kode_tunjangan', '=', 'karyawan_tunjangan.kode_tunjangan')
            ->join('karyawan', 'karyawan_tunjangan.nik', '=', 'karyawan.nik')
            ->select(
                'karyawan_tunjangan_detail.kode_tunjangan',
                'karyawan_tunjangan.nik',
                'karyawan.nama_karyawan',
                'karyawan.nik_show',
                'karyawan_tunjangan.tanggal_berlaku',
                ...$select_tunjangan
            );

        if ($request->filled('search')) {
            $query->where('karyawan.nama_karyawan', 'like', '%' . $request->search . '%')
                  ->orWhere('karyawan.nik_show', 'like', '%' . $request->search . '%');
        }

        $query->groupBy(
            'karyawan_tunjangan_detail.kode_tunjangan',
            'karyawan_tunjangan.nik',
            'karyawan.nama_karyawan',
            'karyawan.nik_show',
            'karyawan_tunjangan.tanggal_berlaku'
        );

        $tunjangans = $query->orderBy('karyawan.nama_karyawan')->paginate(10)->withQueryString();

        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Tunjangan/Index', [
            'tunjangans' => $tunjangans,
            'jenis_tunjangan' => $jenis_tunjangan,
            'karyawans' => $karyawans,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nik' => 'required|exists:karyawan,nik',
            'tanggal_berlaku' => 'required|date',
            'details' => 'required|array',
            'details.*.kode_jenis_tunjangan' => 'required|exists:jenis_tunjangan,kode_jenis_tunjangan',
            'details.*.jumlah' => 'required|numeric|min:0'
        ]);

        DB::beginTransaction();
        try {
            $tahun_gaji = date('Y', strtotime($request->tanggal_berlaku));
            $last_tunjangan = Tunjangan::orderBy('kode_tunjangan', 'desc')
                ->whereYear('tanggal_berlaku', $tahun_gaji)
                ->first();
            $last_kode = $last_tunjangan ? $last_tunjangan->kode_tunjangan : '';

            $prefix = 'T' . substr($tahun_gaji, 2, 2);
            if ($last_kode && str_starts_with($last_kode, $prefix)) {
                $num = (int)substr($last_kode, 3);
                $kode_tunjangan = $prefix . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $kode_tunjangan = $prefix . '0001';
            }

            Tunjangan::create([
                'kode_tunjangan' => $kode_tunjangan,
                'nik' => $request->nik,
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            foreach ($request->details as $detail) {
                Detailtunjangan::create([
                    'kode_tunjangan' => $kode_tunjangan,
                    'kode_jenis_tunjangan' => $detail['kode_jenis_tunjangan'],
                    'jumlah' => $detail['jumlah']
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Tunjangan berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menyimpan tunjangan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_tunjangan)
    {
        $request->validate([
            'tanggal_berlaku' => 'required|date',
            'details' => 'required|array',
            'details.*.kode_jenis_tunjangan' => 'required|exists:jenis_tunjangan,kode_jenis_tunjangan',
            'details.*.jumlah' => 'required|numeric|min:0'
        ]);

        DB::beginTransaction();
        try {
            $tunjangan = Tunjangan::where('kode_tunjangan', $kode_tunjangan)->firstOrFail();
            $tunjangan->update([
                'tanggal_berlaku' => $request->tanggal_berlaku
            ]);

            Detailtunjangan::where('kode_tunjangan', $kode_tunjangan)->delete();

            foreach ($request->details as $detail) {
                Detailtunjangan::create([
                    'kode_tunjangan' => $kode_tunjangan,
                    'kode_jenis_tunjangan' => $detail['kode_jenis_tunjangan'],
                    'jumlah' => $detail['jumlah']
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Tunjangan berhasil diubah.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal mengubah tunjangan: ' . $e->getMessage());
        }
    }

    public function destroy($kode_tunjangan)
    {
        try {
            Tunjangan::where('kode_tunjangan', $kode_tunjangan)->delete();
            return redirect()->back()->with('success', 'Tunjangan berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus tunjangan: ' . $e->getMessage());
        }
    }
}
