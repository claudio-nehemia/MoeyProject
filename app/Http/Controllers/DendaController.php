<?php

namespace App\Http\Controllers;

use App\Models\Denda;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DendaController extends Controller
{
    public function index()
    {
        $denda = Denda::orderBy('id')->get();
        return Inertia::render('Denda/Index', [
            'dendas' => $denda
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'dari' => 'required|numeric',
            'sampai' => 'required|numeric',
            'denda' => 'required|numeric'
        ]);

        try {
            Denda::create([
                'dari' => $request->dari,
                'sampai' => $request->sampai,
                'denda' => $request->denda
            ]);
            return redirect()->back()->with('success', 'Data denda berhasil disimpan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menyimpan denda: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        $denda = Denda::findOrFail($id);

        $request->validate([
            'dari' => 'required|numeric',
            'sampai' => 'required|numeric',
            'denda' => 'required|numeric'
        ]);

        try {
            $denda->update([
                'dari' => $request->dari,
                'sampai' => $request->sampai,
                'denda' => $request->denda
            ]);
            return redirect()->back()->with('success', 'Data denda berhasil diupdate.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengupdate denda: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $denda = Denda::findOrFail($id);
            $denda->delete();
            return redirect()->back()->with('success', 'Data denda berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus denda: ' . $e->getMessage());
        }
    }
}
