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
            'tahapan.*.persentase' => 'required|numeric|min:0|max:100',
        ]);

        // Validate total percentage = 100
        $totalPersentase = array_sum(array_column($validated['tahapan'], 'persentase'));
        if ($totalPersentase != 100) {
            return redirect()->back()->withErrors(['tahapan' => 'Total persentase harus 100%']);
        }

        // Transform tahapan dari frontend format ke database format
        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            if (!empty($item['tahapan'])) {
                $tahapan[] = [
                    'step' => $index + 1,
                    'text' => $item['tahapan'],
                    'persentase' => (float) $item['persentase'],
                ];
            }

            // 🟩 Tambahan validasi percentage
            'tahapan.*.tahapan'    => 'required|string',
            'tahapan.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        // Transform FE → DB format
        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            $tahapan[] = [
                'step'       => $index + 1,
                'text'       => $item['tahapan'],
                'percentage' => (float)$item['percentage'],
            ];
        }

        Termin::create([
            'kode_tipe' => $validated['kode_tipe'],
            'nama_tipe' => $validated['nama_tipe'],
            'deskripsi' => $validated['deskripsi'],
            'tahapan'   => $tahapan,
        ]);

        return redirect()->back()->with('success', 'Termin created successfully.');
    }

    public function edit(Termin $termin)
    {
        // Transform DB → FE format
        $formatted = [];

        if ($termin->tahapan) {
            foreach ($termin->tahapan as $item) {
                $tahapanFormatted[] = [
                    'tahapan' => $item['text'] ?? '',
                    'persentase' => $item['persentase'] ?? 0,
                ];
            }
        }
        
        // Jika tidak ada tahapan, berikan default 1 row kosong
        if (empty($tahapanFormatted)) {
            $tahapanFormatted = [['tahapan' => '', 'persentase' => 0]];
                $formatted[] = [
                    'tahapan'    => $item['text'] ?? '',
                    'percentage' => $item['percentage'] ?? '',
                ];
            }
        }

        if (empty($formatted)) {
            $formatted = [
                ['tahapan' => '', 'percentage' => '']
            ];
        }

        return response()->json([
            'id'         => $termin->id,
            'kode_tipe'  => $termin->kode_tipe,
            'nama_tipe'  => $termin->nama_tipe,
            'deskripsi'  => $termin->deskripsi,
            'tahapan'    => $formatted,
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
            'tahapan.*.persentase' => 'required|numeric|min:0|max:100',
        ]);

        // Validate total percentage = 100
        $totalPersentase = array_sum(array_column($validated['tahapan'], 'persentase'));
        if ($totalPersentase != 100) {
            return redirect()->back()->withErrors(['tahapan' => 'Total persentase harus 100%']);
        }

        // Transform tahapan dari frontend format ke database format
        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            if (!empty($item['tahapan'])) {
                $tahapan[] = [
                    'step' => $index + 1,
                    'text' => $item['tahapan'],
                    'persentase' => (float) $item['persentase'],
                ];
            }

            // 🟩 Validasi baru untuk percentage
            'tahapan.*.tahapan'    => 'required|string',
            'tahapan.*.percentage' => 'required|numeric|min:0|max:100',
        ]);

        $tahapan = [];
        foreach ($validated['tahapan'] as $index => $item) {
            $tahapan[] = [
                'step'       => $index + 1,
                'text'       => $item['tahapan'],
                'percentage' => (float)$item['percentage'],
            ];
        }

        $termin->update([
            'kode_tipe' => $validated['kode_tipe'],
            'nama_tipe' => $validated['nama_tipe'],
            'deskripsi' => $validated['deskripsi'],
            'tahapan'   => $tahapan,
        ]);

        return redirect()->back()->with('success', 'Termin updated successfully.');
    }

    public function destroy(Termin $termin)
    {
        $termin->delete();

        return redirect()->back()->with('success', 'Termin deleted successfully.');
    }
}
