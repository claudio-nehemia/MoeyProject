<?php

namespace App\Http\Controllers;

use App\Models\Termin;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TerminController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $termins = Termin::all();
        return Inertia::render('Termin/Index', [
            'termins' => $termins,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_tipe' => 'required|string|max:255',
            'nama_tipe' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        Termin::create($validated);

        return redirect()->back()->with('success', 'Termin created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Termin $termin)
    {
        return response()->json($termin);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Termin $termin)
    {
        $validated = $request->validate([
            'kode_tipe' => 'required|string|max:255',
            'nama_tipe' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        $termin->update($validated);

        return redirect()->back()->with('success', 'Termin updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Termin $termin)
    {
        $termin->delete();

        return redirect()->back()->with('success', 'Termin deleted successfully.');
    }
}
