<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Produk;
use App\Models\ProdukImages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    public function index()
    {
        $produks = Produk::with('produkImages')->get();
        return Inertia::render('Produk/Index', [
            'produks' => $produks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // 1. Buat produk
        $produk = Produk::create([
            'nama_produk' => $validated['nama_produk'],
            'harga' => $validated['harga'],
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

        return redirect()->back()->with('success', 'Produk created successfully.');
    }

    public function edit(Produk $produk)
    {
        $produk->load('produkImages');
        return response()->json($produk);
    }

    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Update data produk
        $produk->update([
            'nama_produk' => $validated['nama_produk'],
            'harga' => $validated['harga'],
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