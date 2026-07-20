<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use App\Models\KaryawanResign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResignController extends Controller
{
    public function index(Request $request)
    {
        $query = KaryawanResign::with(['karyawan', 'approver']);

        if ($request->filled('search')) {
            $query->whereHas('karyawan', function ($q) use ($request) {
                $q->where('nama_karyawan', 'like', '%' . $request->search . '%')
                  ->orWhere('nik_show', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status_approval', $request->status);
        }

        $resigns = $query->orderBy('tanggal_pengajuan', 'desc')->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('Resign/Index', [
            'resigns' => $resigns,
            'filters' => $request->only(['search', 'status'])
        ]);
    }

    public function approve(Request $request, $id)
    {
        $resign = KaryawanResign::findOrFail($id);

        $request->validate([
            'catatan_hrd' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $resign->update([
                'status_approval' => 'Disetujui',
                'catatan_hrd' => $request->catatan_hrd,
                'approved_by' => auth()->id()
            ]);

            // If the effective date is today or in the past, deactivate employee profile
            $effectiveDate = strtotime($resign->tanggal_efektif);
            $today = strtotime(date('Y-m-d'));

            if ($effectiveDate <= $today) {
                Karyawan::where('nik', $resign->nik)->update([
                    'status_aktif_karyawan' => '0' // '0' = inactive/resign
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Pengunduran diri karyawan disetujui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal memproses persetujuan: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, $id)
    {
        $resign = KaryawanResign::findOrFail($id);

        $request->validate([
            'catatan_hrd' => 'required|string'
        ]);

        try {
            $resign->update([
                'status_approval' => 'Ditolak',
                'catatan_hrd' => $request->catatan_hrd,
                'approved_by' => auth()->id()
            ]);

            return redirect()->back()->with('success', 'Pengunduran diri karyawan ditolak.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memproses penolakan: ' . $e->getMessage());
        }
    }
}
