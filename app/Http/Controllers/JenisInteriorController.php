<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\JenisInterior;

class JenisInteriorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jenisInteriors = JenisInterior::all();
        return Inertia::render('JenisInterior/Index', [
            'jenisInteriors' => $jenisInteriors,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_interior' => 'required|string|max:255',
        ]);

        JenisInterior::create($validated);

        return redirect()->back()->with('success', 'Jenis Interior created successfully.');
    }

    public function create()
    {
        return redirect()->route('jenis-interior.index');
    }

    public function show(JenisInterior $jenisInterior)
    {
        if (request()->wantsJson()) {
            return response()->json($jenisInterior);
        }
        return redirect()->route('jenis-interior.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(JenisInterior $jenisInterior)
    {
        return response()->json($jenisInterior);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JenisInterior $jenisInterior)
    {
        $validated = $request->validate([
            'nama_interior' => 'required|string|max:255',
        ]);

        $jenisInterior->update($validated);

        return redirect()->back()->with('success', 'Jenis Interior updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JenisInterior $jenisInterior)
    {
        $jenisInterior->delete();

        return redirect()->back()->with('success', 'Jenis Interior deleted successfully.');
    }
}
