<?php

namespace App\Http\Controllers;

use App\Models\Cabang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CabangController extends Controller
{
    public function index()
    {
        $cabangs = Cabang::all();
        return Inertia::render('Cabang/Index', [
            'cabangs' => $cabangs
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_cabang' => 'required|string|max:3|unique:cabang,kode_cabang',
            'nama_cabang' => 'required|string|max:50',
            'alamat_cabang' => 'required|string|max:100',
            'telepon_cabang' => 'required|string|max:13',
            'lokasi_cabang' => 'required|string|max:255',
            'radius_cabang' => 'required|integer|min:1',
            'timezone' => 'required|string|max:255',
        ]);

        Cabang::create($validated);

        return redirect()->back()->with('success', 'Cabang berhasil ditambahkan.');
    }

    public function update(Request $request, $kode_cabang)
    {
        $cabang = Cabang::findOrFail($kode_cabang);

        $validated = $request->validate([
            'nama_cabang' => 'required|string|max:50',
            'alamat_cabang' => 'required|string|max:100',
            'telepon_cabang' => 'required|string|max:13',
            'lokasi_cabang' => 'required|string|max:255',
            'radius_cabang' => 'required|integer|min:1',
            'timezone' => 'required|string|max:255',
        ]);

        $cabang->update($validated);

        return redirect()->back()->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy($kode_cabang)
    {
        $cabang = Cabang::findOrFail($kode_cabang);
        $cabang->delete();

        return redirect()->back()->with('success', 'Cabang berhasil dihapus.');
    }
}
