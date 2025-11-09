<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Divisi;
use Illuminate\Http\Request;

class DivisiController extends Controller
{
    public function index()
    {
        $divisis = Divisi::all();
        return Inertia::render('Divisi/Index', [
            'divisis' => $divisis,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_divisi' => 'required|string|max:255',
        ]);

        Divisi::create([
            'nama_divisi' => $request->nama_divisi,
        ]);

        return redirect()->back()->with('success', 'Divisi created successfully.');
    }

    public function edit(Divisi $divisi)
    {
        return response()->json($divisi);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_divisi' => 'required|string|max:255',
        ]);

        $divisi = Divisi::findOrFail($id);
        $divisi->update([
            'nama_divisi' => $request->nama_divisi,
        ]);

        return redirect()->back()->with('success', 'Divisi updated successfully.');
    }

    public function destroy($id)
    {
        $divisi = Divisi::findOrFail($id);
        $divisi->delete();

        return redirect()->back()->with('success', 'Divisi deleted successfully.');
    }
}
