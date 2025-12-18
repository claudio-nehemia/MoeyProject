<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

use App\Models\JenisPengukuran;
use Illuminate\Http\Request;

class JenisPengukuranController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jenisPengukuran = JenisPengukuran::all();

        return Inertia::render('JenisPengukuran/Index', [
            'jenisPengukuran' => $jenisPengukuran,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    // public function store(Request $request)
    // {
    //     $request->validate([
    //         'nama_pengukuran' => 'required|string|max:255',
    //     ]);

    //     JenisPengukuran::create([
    //         'nama_pengukuran' => $request->nama_pengukuran,
    //     ]);

    //     return redirect()->back()->with('success', 'Jenis Pengukuran created successfully.');
    // }
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

    /**
     * Display the specified resource.
     */
    public function show(JenisPengukuran $jenisPengukuran)
    {
        return Inertia::render('JenisPengukuran/Show', [
            'jenisPengukuran' => $jenisPengukuran,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(JenisPengukuran $jenisPengukuran)
    {
        return response()->json($jenisPengukuran);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JenisPengukuran $jenisPengukuran)
    {
        $request->validate([
            'nama_pengukuran' => 'required|string|max:255',
        ]);

        $jenisPengukuran->update([
            'nama_pengukuran' => $request->nama_pengukuran,
        ]);

        return redirect()->back()->with('success', 'Jenis Pengukuran updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JenisPengukuran $jenisPengukuran)
    {
        $jenisPengukuran->delete();

        return redirect()->back()->with('success', 'Jenis Pengukuran deleted successfully.');
    }

    /**
     * Fetch API for dropdown / ajax usage.
     */
    public function fetch()
    {
        return JenisPengukuran::all();
    }
}
