<?php

namespace App\Http\Controllers;

use App\Models\JenisPengukuran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JenisPengukuranController extends Controller
{
    public function index()
    {
        return Inertia::render('JenisPengukuran/Index', [
            'jenisPengukuran' => JenisPengukuran::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_pengukuran' => 'required|string|max:255',
        ]);

        $jenis = JenisPengukuran::create($validated);

        return redirect()->back()->with([
            'success' => 'Jenis Pengukuran created successfully.',
            'newJenisPengukuran' => $jenis,
        ]);
    }

    public function update(Request $request, JenisPengukuran $jenisPengukuran)
    {
        $validated = $request->validate([
            'nama_pengukuran' => 'required|string|max:255',
        ]);

        $jenisPengukuran->update($validated);

        return redirect()->back()->with('success', 'Jenis Pengukuran updated successfully.');
    }

    public function destroy(JenisPengukuran $jenisPengukuran)
    {
        $jenisPengukuran->delete();

        return redirect()->back()->with('success', 'Jenis Pengukuran deleted successfully.');
    }

    /**
     * ❌ OPTIONAL
     * Tidak perlu kalau sudah pakai Inertia flow
     */
    public function fetch()
    {
        return JenisPengukuran::all();
    }
}
