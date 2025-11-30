<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Inertia\Inertia;
use App\Models\Produk;
use App\Models\ProdukImages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    public function index()
    {
        $produks = Produk::with(['produkImages', 'bahanBakus'])->get();
        
        // Pastikan harga di-include untuk setiap bahan baku
        // Karena belongsToMany akan load semua field, tapi kita pastikan harga ada
        $produks->transform(function ($produk) {
            $produk->bahanBakus->transform(function ($item) {
                // Pastikan harga di-include (jika null, set ke 0)
                if (!isset($item->harga) || $item->harga === null) {
                    $item->harga = 0;
                }
                return $item;
            });
            return $produk;
        });

        // Ambil semua items yang termasuk bahan baku
        $bahanBakuItems = Item::whereHas('jenisItem', function ($query) {
            $query->where('nama_jenis_item', 'Bahan Baku');
        })->get(['id', 'nama_item', 'harga']);

        return Inertia::render('Produk/Index', [
            'produks' => $produks,
            'bahanBakuItems' => $bahanBakuItems,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0|max:9999999999999.99',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'harga_jasa' => 'required|numeric|min:0|max:9999999999999.99',
            'bahan_baku' => 'nullable|array',
            'bahan_baku.*' => 'integer|exists:items,id',
        ]);

        // Pastikan harga tidak terlalu besar untuk decimal(15,2)
        $harga = min($validated['harga'], 9999999999999.99);
        $hargaJasa = min($validated['harga_jasa'], 9999999999999.99);

        // 1. Buat produk
        $produk = Produk::create([
            'nama_produk' => $validated['nama_produk'],
            'harga' => $harga,
            'harga_jasa' => $hargaJasa,
        ]);

        // 2. Simpan gambar ke tabel relasi
        if ($request->hasFile('produk_images')) {
            foreach ($request->file('produk_images') as $image) {
                $path = $image->store('produk_images', 'public');

                ProdukImages::create([
                    'produk_id' => $produk->id,
                    'image' => $path,
                ]);
            }
        }

        if ($request->filled('bahan_baku')) {
            $produk->bahanBakus()->sync($request->bahan_baku);
        }

        return redirect()->back()->with('success', 'Produk created successfully.');
    }

    public function edit(Produk $produk)
    {
        $produk->load('produkImages', 'bahanBakus');
        return response()->json($produk);
    }

    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0|max:9999999999999.99',
            'harga_jasa' => 'required|numeric|min:0|max:9999999999999.99',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'bahan_baku' => 'nullable|array',
            'bahan_baku.*' => 'integer|exists:items,id',
        ]);

        // Pastikan harga tidak terlalu besar untuk decimal(15,2)
        $harga = min($validated['harga'], 9999999999999.99);
        $hargaJasa = min($validated['harga_jasa'], 9999999999999.99);

        // Update data produk
        $produk->update([
            'nama_produk' => $validated['nama_produk'],
            'harga' => $harga,
            'harga_jasa' => $hargaJasa,
        ]);

        // Tambah gambar baru
        if ($request->hasFile('produk_images')) {
            foreach ($request->file('produk_images') as $image) {
                $path = $image->store('produk_images', 'public');

                ProdukImages::create([
                    'produk_id' => $produk->id,
                    'image' => $path,
                ]);
            }
        }

        if ($request->filled('bahan_baku')) {
            $produk->bahanBakus()->sync($request->bahan_baku);
        }


        return redirect()->back()->with('success', 'Produk updated successfully.');
    }

    public function destroy(Produk $produk)
    {
        // Hapus semua gambar produk
        foreach ($produk->produkImages as $img) {
            Storage::disk('public')->delete($img->image);
            $img->delete();
        }

        $produk->delete();

        return redirect()->back()->with('success', 'Produk deleted successfully.');
    }

    public function deleteImage(Request $request, $produkId)
    {
        $request->validate([
            'image_path' => 'required|string',
        ]);

        $produk = Produk::findOrFail($produkId);

        // Cari gambar di tabel relasi
        $image = $produk->produkImages()->where('image', $request->image_path)->firstOrFail();

        // Hapus file dari storage
        Storage::disk('public')->delete($image->image);

        // Hapus record
        $image->delete();

        return redirect()->back()->with('success', 'Image deleted successfully.');
    }
}