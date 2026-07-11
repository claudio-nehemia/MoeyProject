<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use App\Models\User;
use App\Models\Cabang;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Facerecognition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class KaryawanController extends Controller
{
    public function index()
    {
        $karyawans = Karyawan::with(['user', 'cabang', 'departemen', 'jabatan', 'facerecognition', 'jamkerja'])->orderBy('nama_karyawan')->get();
        $users = User::select('id', 'name', 'email')->get();
        $cabangs = Cabang::select('kode_cabang', 'nama_cabang')->get();
        $departemens = Departemen::select('kode_dept', 'nama_dept')->get();
        $jabatans = Jabatan::select('kode_jabatan', 'nama_jabatan')->get();
        $jamkerjas = \App\Models\Jamkerja::select('kode_jam_kerja', 'nama_jam_kerja')->get();

        return Inertia::render('Karyawan/Index', [
            'karyawans' => $karyawans,
            'users' => $users,
            'cabangs' => $cabangs,
            'departemens' => $departemens,
            'jabatans' => $jabatans,
            'jamkerjas' => $jamkerjas
        ]);
    }

    public function store(Request $request)
    {
        // Sanitize empty strings to null
        $inputs = $request->all();
        foreach (['user_id', 'no_hp', 'email', 'kode_jadwal'] as $field) {
            if (isset($inputs[$field]) && $inputs[$field] === '') {
                $inputs[$field] = null;
            }
        }
        $request->merge($inputs);

        $validated = $request->validate([
            'nik' => 'required|string|max:9|unique:karyawan,nik',
            'user_id' => 'nullable|integer|exists:users,id',
            'nama_karyawan' => 'required|string|max:100',
            'no_ktp' => 'required|string|max:16',
            'no_hp' => 'nullable|string|max:15',
            'email' => 'nullable|string|email|max:100',
            'jenis_kelamin' => 'required|string|max:1',
            'kode_cabang' => 'required|string|max:3|exists:cabang,kode_cabang',
            'kode_dept' => 'required|string|max:3|exists:departemen,kode_dept',
            'kode_jabatan' => 'required|string|max:3|exists:jabatan,kode_jabatan',
            'tanggal_masuk' => 'required|date',
            'status_karyawan' => 'required|string|max:5',
            'kode_jadwal' => 'nullable|string|max:4|exists:presensi_jamkerja,kode_jam_kerja',
        ]);

        Karyawan::create($validated);

        return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    public function update(Request $request, $nik)
    {
        $karyawan = Karyawan::findOrFail($nik);

        // Sanitize empty strings to null
        $inputs = $request->all();
        foreach (['user_id', 'no_hp', 'email', 'kode_jadwal'] as $field) {
            if (isset($inputs[$field]) && $inputs[$field] === '') {
                $inputs[$field] = null;
            }
        }
        $request->merge($inputs);

        \Illuminate\Support\Facades\Log::info("KARYAWAN_UPDATE_REQUEST for NIK $nik:", $request->all());

        try {
            $validated = $request->validate([
                'user_id' => 'nullable|integer|exists:users,id',
                'nama_karyawan' => 'required|string|max:100',
                'no_ktp' => 'required|string|max:16',
                'no_hp' => 'nullable|string|max:15',
                'email' => 'nullable|string|email|max:100',
                'jenis_kelamin' => 'required|string|max:1',
                'kode_cabang' => 'required|string|max:3|exists:cabang,kode_cabang',
                'kode_dept' => 'required|string|max:3|exists:departemen,kode_dept',
                'kode_jabatan' => 'required|string|max:3|exists:jabatan,kode_jabatan',
                'tanggal_masuk' => 'required|date',
                'status_karyawan' => 'required|string|max:5',
                'kode_jadwal' => 'nullable|string|max:4|exists:presensi_jamkerja,kode_jam_kerja',
                'lock_location' => 'nullable|string|max:1',
                'lock_jam_kerja' => 'nullable|string|max:1',
                'status_aktif_karyawan' => 'nullable|string|max:1',
            ]);

            \Illuminate\Support\Facades\Log::info("KARYAWAN_UPDATE_VALIDATED successfully:", $validated);

            $karyawan->update($validated);

            return redirect()->back()->with('success', 'Karyawan berhasil diperbarui.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error("KARYAWAN_UPDATE_VALIDATION_FAILED:", $e->errors());
            throw $e;
        }
    }

    public function destroy($nik)
    {
        $karyawan = Karyawan::findOrFail($nik);
        
        // Hapus folder master wajah
        $namaDepan = getNamaDepan(strtolower($karyawan->nama_karyawan));
        $folderName = $karyawan->nik . "-" . $namaDepan;
        $folderPath = "uploads/facerecognition/" . $folderName;
        
        if (Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->deleteDirectory($folderPath);
        }

        $karyawan->delete();

        return redirect()->back()->with('success', 'Karyawan berhasil dihapus.');
    }

    public function uploadFace(Request $request, $nik)
    {
        $karyawan = Karyawan::findOrFail($nik);

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $image = $request->file('image');

        $namaDepan = getNamaDepan(strtolower($karyawan->nama_karyawan));
        $folderName = $karyawan->nik . "-" . $namaDepan;
        $folderPath = "uploads/facerecognition/" . $folderName;

        if (!Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->makeDirectory($folderPath, 0775, true);
        }

        $existingCount = Facerecognition::where('nik', $nik)->count();
        $fileName = ($existingCount + 1) . "_front.png";

        $image->storeAs($folderPath, $fileName, 'public');

        Facerecognition::create([
            'nik' => $nik,
            'wajah' => $fileName
        ]);

        return redirect()->back()->with('success', 'Foto master wajah berhasil ditambahkan.');
    }

    public function deleteFace($nik, $id)
    {
        $karyawan = Karyawan::findOrFail($nik);
        $face = Facerecognition::findOrFail($id);

        $namaDepan = getNamaDepan(strtolower($karyawan->nama_karyawan));
        $folderName = $karyawan->nik . "-" . $namaDepan;
        $filePath = "uploads/facerecognition/" . $folderName . "/" . $face->wajah;

        if (Storage::disk('public')->exists($filePath)) {
            Storage::disk('public')->delete($filePath);
        }

        $face->delete();

        return redirect()->back()->with('success', 'Foto wajah berhasil dihapus.');
    }
}
