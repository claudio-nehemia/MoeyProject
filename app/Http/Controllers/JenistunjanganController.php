<?php

namespace App\Http\Controllers;

use App\Models\Jenistunjangan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JenistunjanganController extends Controller
{
    public function index()
    {
        $jenistunjangan = Jenistunjangan::all();
        return Inertia::render('Jenistunjangan/Index', [
            'jenistunjangans' => $jenistunjangan
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_jenis_tunjangan' => 'required|string|max:4|unique:jenis_tunjangan,kode_jenis_tunjangan',
            'jenis_tunjangan' => 'required|string|max:50',
            'status_tunjangan' => 'required|string|in:0,1'
        ]);

        try {
            $kode_jenis_tunjangan = strtoupper(trim($request->kode_jenis_tunjangan));
            $jenis_tunjangan = trim($request->jenis_tunjangan);

            Jenistunjangan::create([
                'kode_jenis_tunjangan' => $kode_jenis_tunjangan,
                'jenis_tunjangan' => $jenis_tunjangan,
                'status_tunjangan' => $request->status_tunjangan
            ]);

            return redirect()->back()->with('success', 'Jenis tunjangan berhasil disimpan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menyimpan jenis tunjangan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_jenis_tunjangan)
    {
        $jt = Jenistunjangan::where('kode_jenis_tunjangan', $kode_jenis_tunjangan)->firstOrFail();

        $request->validate([
            'jenis_tunjangan' => 'required|string|max:50',
            'status_tunjangan' => 'required|string|in:0,1'
        ]);

        try {
            $jenis_tunjangan = trim($request->jenis_tunjangan);

            $jt->update([
                'jenis_tunjangan' => $jenis_tunjangan,
                'status_tunjangan' => $request->status_tunjangan
            ]);

            return redirect()->back()->with('success', 'Jenis tunjangan berhasil diupdate.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengupdate jenis tunjangan: ' . $e->getMessage());
        }
    }

    public function destroy($kode_jenis_tunjangan)
    {
        try {
            Jenistunjangan::where('kode_jenis_tunjangan', $kode_jenis_tunjangan)->delete();
            return redirect()->back()->with('success', 'Jenis tunjangan berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus jenis tunjangan: ' . $e->getMessage());
        }
    }
}
