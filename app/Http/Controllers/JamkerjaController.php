<?php

namespace App\Http\Controllers;

use App\Models\Jamkerja;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JamkerjaController extends Controller
{
    public function index()
    {
        $jamkerjas = Jamkerja::all();
        return Inertia::render('Jamkerja/Index', [
            'jamkerjas' => $jamkerjas
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_jam_kerja' => 'required|string|max:4|unique:presensi_jamkerja,kode_jam_kerja',
            'nama_jam_kerja' => 'required|string|max:255',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_pulang' => 'required|date_format:H:i',
            'istirahat' => 'required|string|max:1',
            'jam_awal_istirahat' => 'nullable|date_format:H:i',
            'jam_akhir_istirahat' => 'nullable|date_format:H:i',
            'total_jam' => 'required|integer|min:1',
            'lintashari' => 'required|string|max:1',
            'batas_presensi_pulang' => 'nullable|date_format:H:i',
            'keterangan' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        Jamkerja::create($validated);

        return redirect()->back()->with('success', 'Jam kerja berhasil ditambahkan.');
    }

    public function update(Request $request, $kode_jam_kerja)
    {
        $jamkerja = Jamkerja::findOrFail($kode_jam_kerja);

        $validated = $request->validate([
            'nama_jam_kerja' => 'required|string|max:255',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_pulang' => 'required|date_format:H:i',
            'istirahat' => 'required|string|max:1',
            'jam_awal_istirahat' => 'nullable|date_format:H:i',
            'jam_akhir_istirahat' => 'nullable|date_format:H:i',
            'total_jam' => 'required|integer|min:1',
            'lintashari' => 'required|string|max:1',
            'batas_presensi_pulang' => 'nullable|date_format:H:i',
            'keterangan' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        $jamkerja->update($validated);

        return redirect()->back()->with('success', 'Jam kerja berhasil diperbarui.');
    }

    public function destroy($kode_jam_kerja)
    {
        $jamkerja = Jamkerja::findOrFail($kode_jam_kerja);
        $jamkerja->delete();

        return redirect()->back()->with('success', 'Jam kerja berhasil dihapus.');
    }
}
