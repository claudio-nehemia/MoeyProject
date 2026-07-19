<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MesinFingerprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class MesinFingerprintController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:mesinfingerprint.index', ['only' => ['index']]);
        $this->middleware('permission:mesinfingerprint.create', ['only' => ['create', 'store']]);
        $this->middleware('permission:mesinfingerprint.edit', ['only' => ['edit', 'update']]);
        $this->middleware('permission:mesinfingerprint.delete', ['only' => ['destroy']]);
    }

    public function index(Request $request)
    {
        $query = MesinFingerprint::query();
        
        if (!empty($request->nama_mesin)) {
            $query->where('nama_mesin', 'like', '%' . $request->nama_mesin . '%');
        }

        $mesinfinger = $query->orderBy('nama_mesin')->paginate(10);
        $mesinfinger->appends($request->all());

        return view('mesinfingerprint.index', compact('mesinfinger'));
    }

    public function create()
    {
        return view('mesinfingerprint.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'sn' => 'required|unique:mesin_fingerprints',
            'nama_mesin' => 'required',
            'merk' => 'nullable|string',
            'lokasi' => 'nullable|string',
            'titik_koordinat' => 'nullable|string',
            'status' => 'required|in:Aktif,Nonaktif',
        ]);

        try {
            MesinFingerprint::create([
                'sn' => $request->sn,
                'nama_mesin' => $request->nama_mesin,
                'merk' => $request->merk,
                'lokasi' => $request->lokasi,
                'titik_koordinat' => $request->titik_koordinat,
                'status' => $request->status,
            ]);
            return redirect()->back()->with(['success' => 'Data Mesin Fingerprint Berhasil Disimpan']);
        } catch (\Exception $e) {
            return redirect()->back()->with(['warning' => 'Data Mesin Fingerprint Gagal Disimpan']);
        }
    }

    public function edit(Request $request)
    {
        $id = Crypt::decrypt($request->id);
        $mesinfinger = MesinFingerprint::findOrFail($id);
        return view('mesinfingerprint.edit', compact('mesinfinger'));
    }

    public function update(Request $request, $id)
    {
        $id = Crypt::decrypt($id);
        
        $request->validate([
            'sn' => 'required|unique:mesin_fingerprints,sn,' . $id,
            'nama_mesin' => 'required',
            'merk' => 'nullable|string',
            'lokasi' => 'nullable|string',
            'titik_koordinat' => 'nullable|string',
            'status' => 'required|in:Aktif,Nonaktif',
        ]);

        try {
            MesinFingerprint::findOrFail($id)->update([
                'sn' => $request->sn,
                'nama_mesin' => $request->nama_mesin,
                'merk' => $request->merk,
                'lokasi' => $request->lokasi,
                'titik_koordinat' => $request->titik_koordinat,
                'status' => $request->status,
            ]);
            return redirect()->back()->with(['success' => 'Data Mesin Fingerprint Berhasil Diupdate']);
        } catch (\Exception $e) {
            return redirect()->back()->with(['warning' => 'Data Mesin Fingerprint Gagal Diupdate']);
        }
    }

    public function destroy($id)
    {
        $id = Crypt::decrypt($id);
        try {
            MesinFingerprint::findOrFail($id)->delete();
            return redirect()->back()->with(['success' => 'Data Mesin Fingerprint Berhasil Dihapus']);
        } catch (\Exception $e) {
            return redirect()->back()->with(['warning' => 'Data Mesin Fingerprint Gagal Dihapus']);
        }
    }
}
