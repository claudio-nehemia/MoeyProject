<?php

namespace App\Http\Controllers;

use App\Models\MesinFingerprint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MesinFingerprintController extends Controller
{
    public function index(Request $request)
    {
        $mesinFingerprints = MesinFingerprint::orderBy('nama_mesin')->get();

        return Inertia::render('MesinFingerprint/Index', [
            'mesinFingerprints' => $mesinFingerprints,
        ]);
    }

    public function create()
    {
        return redirect()->route('mesin-fingerprint.index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sn' => 'required|string|max:100|unique:mesin_fingerprints,sn',
            'nama_mesin' => 'required|string|max:255',
            'merk' => 'nullable|string|max:100',
            'lokasi' => 'nullable|string|max:255',
            'titik_koordinat' => 'nullable|string|max:255',
            'status' => 'required|in:Aktif,Nonaktif',
        ]);

        MesinFingerprint::create($validated);

        return redirect()->back()->with('success', 'Data Mesin Fingerprint berhasil disimpan.');
    }

    public function edit(Request $request)
    {
        $mesinfinger = MesinFingerprint::findOrFail($request->id);
        return response()->json($mesinfinger);
    }

    public function update(Request $request, $id)
    {
        $mesinfinger = MesinFingerprint::findOrFail($id);

        $validated = $request->validate([
            'sn' => 'required|string|max:100|unique:mesin_fingerprints,sn,' . $mesinfinger->id,
            'nama_mesin' => 'required|string|max:255',
            'merk' => 'nullable|string|max:100',
            'lokasi' => 'nullable|string|max:255',
            'titik_koordinat' => 'nullable|string|max:255',
            'status' => 'required|in:Aktif,Nonaktif',
        ]);

        $mesinfinger->update($validated);

        return redirect()->back()->with('success', 'Data Mesin Fingerprint berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $mesinfinger = MesinFingerprint::findOrFail($id);
        $mesinfinger->delete();

        return redirect()->back()->with('success', 'Data Mesin Fingerprint berhasil dihapus.');
    }
}
