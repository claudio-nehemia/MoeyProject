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

        // Ambil semua items yang termasuk bahan baku
        $bahanBakuItems = Item::whereHas('jenisItem', function ($query) {
            $query->where('nama_jenis_item', 'Bahan Baku');
        })->get(['id', 'nama_item']);

        return Inertia::render('Produk/Index', [
            'produks' => $produks,
            'bahanBakuItems' => $bahanBakuItems,
        ]);
    }

    public function store(Request $request)
    {
        // Log request untuk debugging
        \Log::info('Produk Store Request', [
            'nama_produk' => $request->nama_produk,
            'bahan_baku' => $request->bahan_baku,
            'has_images' => $request->hasFile('produk_images'),
        ]);

        // Sanitize bahan baku values - hapus karakter non-digit
        if ($request->has('bahan_baku') && is_array($request->bahan_baku)) {
            $sanitizedBahanBaku = [];
            foreach ($request->bahan_baku as $bahan) {
                $sanitizedBahanBaku[] = [
                    'item_id' => $bahan['item_id'] ?? null,
                    'harga_dasar' => preg_replace('/[^0-9.]/', '', $bahan['harga_dasar'] ?? '0'),
                    'harga_jasa' => preg_replace('/[^0-9.]/', '', $bahan['harga_jasa'] ?? '0'),
                ];
            }
            $request->merge(['bahan_baku' => $sanitizedBahanBaku]);
        }

        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'bahan_baku' => 'nullable|array',
            'bahan_baku.*.item_id' => 'required|integer|exists:items,id',
            'bahan_baku.*.harga_dasar' => 'required|numeric|min:0|max:9999999999999.99',
            'bahan_baku.*.harga_jasa' => 'required|numeric|min:0|max:9999999999999.99',
        ]);

        // Hitung total harga dan harga jasa dari semua bahan baku
        $totalHarga = 0;
        $totalHargaJasa = 0;

        if (!empty($validated['bahan_baku'])) {
            foreach ($validated['bahan_baku'] as $bahan) {
                $totalHarga += floatval($bahan['harga_dasar']);
                $totalHargaJasa += floatval($bahan['harga_jasa']);
            }
        }

        // 1. Buat produk
        $produk = Produk::create([
            'nama_produk' => $validated['nama_produk'],
            'harga' => min($totalHarga, 9999999999999.99),
            'harga_jasa' => min($totalHargaJasa, 9999999999999.99),
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

        // 3. Sync bahan baku dengan pivot data
        if (!empty($validated['bahan_baku'])) {
            $syncData = [];
            foreach ($validated['bahan_baku'] as $bahan) {
                $syncData[$bahan['item_id']] = [
                    'harga_dasar' => $bahan['harga_dasar'],
                    'harga_jasa' => $bahan['harga_jasa'],
                ];
            }
            $produk->bahanBakus()->sync($syncData);
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
        // Log request untuk debugging
        \Log::info('Produk Update Request', [
            'produk_id' => $produk->id,
            'nama_produk' => $request->nama_produk,
            'bahan_baku' => $request->bahan_baku,
            'has_images' => $request->hasFile('produk_images'),
        ]);

        // Sanitize bahan baku values - hapus karakter non-digit
        if ($request->has('bahan_baku') && is_array($request->bahan_baku)) {
            $sanitizedBahanBaku = [];
            foreach ($request->bahan_baku as $bahan) {
                $sanitizedBahanBaku[] = [
                    'item_id' => $bahan['item_id'] ?? null,
                    'harga_dasar' => preg_replace('/[^0-9.]/', '', $bahan['harga_dasar'] ?? '0'),
                    'harga_jasa' => preg_replace('/[^0-9.]/', '', $bahan['harga_jasa'] ?? '0'),
                ];
            }
            $request->merge(['bahan_baku' => $sanitizedBahanBaku]);
        }

        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'produk_images' => 'nullable|array',
            'produk_images.*' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'bahan_baku' => 'nullable|array',
            'bahan_baku.*.item_id' => 'required|integer|exists:items,id',
            'bahan_baku.*.harga_dasar' => 'required|numeric|min:0|max:9999999999999.99',
            'bahan_baku.*.harga_jasa' => 'required|numeric|min:0|max:9999999999999.99',
        ]);

        // Hitung total harga dan harga jasa dari semua bahan baku
        $totalHarga = 0;
        $totalHargaJasa = 0;

        if (!empty($validated['bahan_baku'])) {
            foreach ($validated['bahan_baku'] as $bahan) {
                $totalHarga += floatval($bahan['harga_dasar']);
                $totalHargaJasa += floatval($bahan['harga_jasa']);
            }
        }

        // Update data produk
        $produk->update([
            'nama_produk' => $validated['nama_produk'],
            'harga' => min($totalHarga, 9999999999999.99),
            'harga_jasa' => min($totalHargaJasa, 9999999999999.99),
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

        // Sync bahan baku dengan pivot data
        if (!empty($validated['bahan_baku'])) {
            $syncData = [];
            foreach ($validated['bahan_baku'] as $bahan) {
                $syncData[$bahan['item_id']] = [
                    'harga_dasar' => $bahan['harga_dasar'],
                    'harga_jasa' => $bahan['harga_jasa'],
                ];
            }
            $produk->bahanBakus()->sync($syncData);
        } else {
            $produk->bahanBakus()->detach();
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