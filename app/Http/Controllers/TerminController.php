<?php

namespace App\Http\Controllers;

use App\Models\Termin;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TerminController extends Controller
{
    public function index()
    {
        $termins = Termin::all();
        return Inertia::render('Termin/Index', [
            'termins' => $termins,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_tipe' => 'required|string|max:255',
            'nama_tipe' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tahapan'   => 'required|array|min:1',
            'tahapan.*.tahapan' => 'required|string',
        ]);

        // Transform tahapan dari frontend format ke database format
        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            if (!empty($item['tahapan'])) {
                $tahapan[] = [
                    'step' => $index + 1,
                    'text' => $item['tahapan'],
                ];
            }
        }

        Termin::create([
            'kode_tipe' => $validated['kode_tipe'],
            'nama_tipe' => $validated['nama_tipe'],
            'deskripsi' => $validated['deskripsi'],
            'tahapan' => $tahapan,
        ]);

        return redirect()->back()->with('success', 'Termin created successfully.');
    }

    public function edit(Termin $termin)
    {
        // Transform tahapan dari database format ke frontend format
        $tahapanFormatted = [];
        if ($termin->tahapan) {
            foreach ($termin->tahapan as $item) {
                $tahapanFormatted[] = [
                    'tahapan' => $item['text'] ?? ''
                ];
            }
        }
        
        // Jika tidak ada tahapan, berikan default 1 row kosong
        if (empty($tahapanFormatted)) {
            $tahapanFormatted = [['tahapan' => '']];
        }

        return response()->json([
            'id' => $termin->id,
            'kode_tipe' => $termin->kode_tipe,
            'nama_tipe' => $termin->nama_tipe,
            'deskripsi' => $termin->deskripsi,
            'tahapan' => $tahapanFormatted,
        ]);
    }

    public function update(Request $request, Termin $termin)
    {
        $validated = $request->validate([
            'kode_tipe' => 'required|string|max:255',
            'nama_tipe' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'tahapan'   => 'required|array|min:1',
            'tahapan.*.tahapan' => 'required|string',
        ]);

        // Transform tahapan dari frontend format ke database format
        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            if (!empty($item['tahapan'])) {
                $tahapan[] = [
                    'step' => $index + 1,
                    'text' => $item['tahapan'],
                ];
            }
        }

        $termin->update([
            'kode_tipe' => $validated['kode_tipe'],
            'nama_tipe' => $validated['nama_tipe'],
            'deskripsi' => $validated['deskripsi'],
            'tahapan' => $tahapan,
        ]);

        return redirect()->back()->with('success', 'Termin updated successfully.');
    }

    public function destroy(Termin $termin)
    {
        $termin->delete();

        return redirect()->back()->with('success', 'Termin deleted successfully.');
    }
}