<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Inertia\Inertia;
use App\Models\JenisItem;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = Item::with('jenisItem')->get();

        return Inertia::render('Item/Index', [
            'items' => $items,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $jenisItems = JenisItem::select('id', 'nama_jenis_item')->get();
        return response()->json($jenisItems);
    }

    public function getJenisItems()
    {
        $jenisItems = JenisItem::select('id', 'nama_jenis_item')->get();
        return response()->json($jenisItems);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Dapatkan jenis item untuk cek apakah bahan baku
        $jenisItem = JenisItem::find($request->jenis_item_id);
        $isBahanBaku = $jenisItem && strtolower($jenisItem->nama_jenis_item) === 'bahan baku';

        $rules = [
            'nama_item' => 'required|string|max:255',
            'jenis_item_id' => 'required|exists:jenis_items,id',
        ];

        // Harga nullable untuk Bahan Baku, required untuk Finishing dan Aksesoris
        if ($isBahanBaku) {
            $rules['harga'] = 'nullable|numeric|min:0';
        } else {
            $rules['harga'] = 'required|numeric|min:0';
        }

        $validated = $request->validate($rules);

        // Pastikan harga null untuk bahan baku jika tidak diisi
        if ($isBahanBaku && !isset($validated['harga'])) {
            $validated['harga'] = null;
        }

        Item::create($validated);
        return redirect()->back()->with('success', 'Item created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function show(Item $item)
    {
        $item->load('jenisItem');
        return Inertia::render('Item/Show', [
            'item' => $item,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Item $item)
    {
        $jenisItems = JenisItem::select('id', 'nama_item')->get();
        return response()->json([
            'item' => $item,
            'jenisItems' => $jenisItems,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Item $item)
    {
        // Dapatkan jenis item untuk cek apakah bahan baku
        $jenisItemId = $request->jenis_item_id ?? $item->jenis_item_id;
        $jenisItem = JenisItem::find($jenisItemId);
        $isBahanBaku = $jenisItem && strtolower($jenisItem->nama_jenis_item) === 'bahan baku';

        $rules = [
            'nama_item' => 'required|string|max:255',
            'jenis_item_id' => 'required|exists:jenis_items,id',
        ];

        // Harga nullable untuk Bahan Baku, required untuk Finishing dan Aksesoris
        if ($isBahanBaku) {
            $rules['harga'] = 'nullable|numeric|min:0';
        } else {
            $rules['harga'] = 'required|numeric|min:0';
        }

        $validated = $request->validate($rules);

        // Pastikan harga null untuk bahan baku jika tidak diisi
        if ($isBahanBaku && !isset($validated['harga'])) {
            $validated['harga'] = null;
        }

        $item->update($validated);

        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        $item->delete();

        return redirect()->back()->with('success', 'Item deleted successfully.');
    }
}
