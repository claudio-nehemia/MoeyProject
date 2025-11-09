<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Produk;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $produks = Produk::all();
        return Inertia::render('Produk/Index', [
            'produks' => $produks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
        ]);

        Produk::create($validated);

        return redirect()->back()->with('success', 'Produk created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Produk $produk)
    {
        return response()->json($produk);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
        ]);

        $produk->update($validated);

        return redirect()->back()->with('success', 'Produk updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Produk $produk)
    {
        $produk->delete();

        return redirect()->back()->with('success', 'Produk deleted successfully.');
    }
}
