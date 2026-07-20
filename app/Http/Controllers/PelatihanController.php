<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use App\Models\KaryawanPelatihan;
use App\Models\Pelatihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PelatihanController extends Controller
{
    public function index(Request $request)
    {
        $query = Pelatihan::query();

        if ($request->filled('search')) {
            $query->where('nama_pelatihan', 'like', '%' . $request->search . '%')
                  ->orWhere('penyelenggara', 'like', '%' . $request->search . '%');
        }

        $pelatihans = $query->orderBy('tanggal_mulai', 'desc')->paginate(10)->withQueryString();
        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')->orderBy('nama_karyawan')->get();

        return Inertia::render('Pelatihan/Index', [
            'pelatihans' => $pelatihans,
            'karyawans' => $karyawans,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_pelatihan' => 'required|string|max:150',
            'penyelenggara' => 'required|string|max:100',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'deskripsi' => 'nullable|string'
        ]);

        try {
            $year = date('Y', strtotime($request->tanggal_mulai));
            $last = Pelatihan::orderBy('kode_pelatihan', 'desc')
                ->whereYear('tanggal_mulai', $year)
                ->first();
            $last_code = $last ? $last->kode_pelatihan : '';

            $prefix = 'PL-' . substr($year, 2, 2);
            if ($last_code && str_starts_with($last_code, $prefix)) {
                $num = (int)substr($last_code, 5);
                $kode_pelatihan = $prefix . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $kode_pelatihan = $prefix . '0001';
            }

            Pelatihan::create([
                'kode_pelatihan' => $kode_pelatihan,
                'nama_pelatihan' => $request->nama_pelatihan,
                'penyelenggara' => $request->penyelenggara,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'deskripsi' => $request->deskripsi
            ]);

            return redirect()->back()->with('success', 'Program pelatihan berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan pelatihan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_pelatihan)
    {
        $pelatihan = Pelatihan::findOrFail($kode_pelatihan);

        $request->validate([
            'nama_pelatihan' => 'required|string|max:150',
            'penyelenggara' => 'required|string|max:100',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'deskripsi' => 'nullable|string'
        ]);

        try {
            $pelatihan->update([
                'nama_pelatihan' => $request->nama_pelatihan,
                'penyelenggara' => $request->penyelenggara,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'deskripsi' => $request->deskripsi
            ]);

            return redirect()->back()->with('success', 'Program pelatihan berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui pelatihan: ' . $e->getMessage());
        }
    }

    public function destroy($kode_pelatihan)
    {
        try {
            Pelatihan::where('kode_pelatihan', $kode_pelatihan)->delete();
            return redirect()->back()->with('success', 'Program pelatihan berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus pelatihan: ' . $e->getMessage());
        }
    }

    public function manageParticipants($kode_pelatihan)
    {
        $pelatihan = Pelatihan::findOrFail($kode_pelatihan);
        $participants = KaryawanPelatihan::with('karyawan')
            ->where('kode_pelatihan', $kode_pelatihan)
            ->get();
        
        $assignedNiks = $participants->pluck('nik')->toArray();
        $karyawans = Karyawan::select('nik', 'nik_show', 'nama_karyawan')
            ->whereNotIn('nik', $assignedNiks)
            ->orderBy('nama_karyawan')
            ->get();

        return Inertia::render('Pelatihan/KelolaPeserta', [
            'pelatihan' => $pelatihan,
            'participants' => $participants,
            'karyawans' => $karyawans
        ]);
    }

    public function addParticipants(Request $request, $kode_pelatihan)
    {
        $request->validate([
            'niks' => 'required|array',
            'niks.*' => 'exists:karyawan,nik'
        ]);

        try {
            foreach ($request->niks as $nik) {
                KaryawanPelatihan::firstOrCreate([
                    'kode_pelatihan' => $kode_pelatihan,
                    'nik' => $nik
                ], [
                    'status_kelulusan' => 'Mengikuti'
                ]);
            }
            return redirect()->back()->with('success', 'Peserta berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan peserta: ' . $e->getMessage());
        }
    }

    public function updateParticipant(Request $request, $id)
    {
        $kp = KaryawanPelatihan::findOrFail($id);

        $request->validate([
            'status_kelulusan' => 'required|in:Mengikuti,Lulus,Tidak Lulus',
            'nilai' => 'nullable|string|max:10',
            'file_sertifikat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096'
        ]);

        try {
            $data = [
                'status_kelulusan' => $request->status_kelulusan,
                'nilai' => $request->nilai
            ];

            if ($request->hasFile('file_sertifikat')) {
                // Delete old certificate file if exists
                if ($kp->file_sertifikat && Storage::disk('public')->exists($kp->file_sertifikat)) {
                    Storage::disk('public')->delete($kp->file_sertifikat);
                }

                $file = $request->file('file_sertifikat');
                $path = $file->store('uploads/sertifikat', 'public');
                $data['file_sertifikat'] = $path;
            }

            $kp->update($data);
            return redirect()->back()->with('success', 'Status kelulusan peserta berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui status: ' . $e->getMessage());
        }
    }

    public function removeParticipant($id)
    {
        try {
            $kp = KaryawanPelatihan::findOrFail($id);
            if ($kp->file_sertifikat && Storage::disk('public')->exists($kp->file_sertifikat)) {
                Storage::disk('public')->delete($kp->file_sertifikat);
            }
            $kp->delete();
            return redirect()->back()->with('success', 'Peserta berhasil dikeluarkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengeluarkan peserta: ' . $e->getMessage());
        }
    }
}
