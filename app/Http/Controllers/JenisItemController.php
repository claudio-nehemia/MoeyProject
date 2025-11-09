<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\JenisItem;
use Illuminate\Http\Request;

class JenisItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $jenisItems = JenisItem::all();
        return Inertia::render('JenisItem/Index', [
            'jenisItems' => $jenisItems,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_jenis_item' => 'required|string|max:255',
        ]);

        JenisItem::create([
            'nama_jenis_item' => $request->nama_jenis_item,
        ]);

        return redirect()->back()->with('success', 'Jenis Item created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(JenisItem $jenisItem)
    {
        $jenisItem->load('items');

        return Inertia::render('JenisItem/Show', [
            'jenisItem' => $jenisItem,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(JenisItem $jenisItem)
    {
        return response()->json($jenisItem);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JenisItem $jenisItem)
    {
        $request->validate([
            'nama_jenis_item' => 'required|string|max:255',
        ]);

        $jenisItem->update([
            'nama_jenis_item' => $request->nama_jenis_item,
        ]);

        return redirect()->back()->with('success', 'Jenis Item updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JenisItem $jenisItem)
    {
        $jenisItem->delete();

        return redirect()->back()->with('success', 'Jenis Item deleted successfully.');
    }
}
