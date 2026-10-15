<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Facerecognition;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FacerecognitionController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $karyawan = $user ? $user->karyawan : null;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Data karyawan tidak ditemukan'
            ], 404);
        }

        $wajahList = Facerecognition::where('nik', $karyawan->nik)->orderBy('id', 'asc')->get();
        $nama_folder = $karyawan->nik . "-" . getNamaDepan(strtolower($karyawan->nama_karyawan));
        $folderPath = 'uploads/facerecognition/' . $nama_folder;
        
        $formattedWajahList = $wajahList->map(function ($wajah) use ($nama_folder, $folderPath) {
            $filePath = $folderPath . '/' . $wajah->wajah;
            $exists = Storage::disk('public')->exists($filePath);
            
            return [
                'id' => $wajah->id,
                'nik' => $wajah->nik,
                'wajah' => $wajah->wajah,
                'url' => $exists ? url('/storage/' . $filePath) : null,
                'created_at' => $wajah->created_at ? $wajah->created_at->format('d M Y H:i') : null,
            ];
        });

        $hasFilesOnDisk = Storage::disk('public')->exists($folderPath) && count(Storage::disk('public')->files($folderPath)) > 0;
        $isRegistered = $wajahList->count() > 0 && $hasFilesOnDisk;

        return response()->json([
            'success' => true,
            'registered' => $isRegistered,
            'total' => $wajahList->count(),
            'karyawan' => [
                'nik' => $karyawan->nik,
                'nama' => $karyawan->nama_karyawan,
            ],
            'wajah_list' => $formattedWajahList
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $karyawan = $user ? $user->karyawan : null;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Data karyawan tidak ditemukan'
            ], 404);
        }

        $files = [];
        if ($request->hasFile('image')) {
            $files = [$request->file('image')];
        } elseif ($request->hasFile('file')) {
            $files = [$request->file('file')];
        } elseif ($request->hasFile('files')) {
            $f = $request->file('files');
            $files = is_array($f) ? $f : [$f];
        }

        if (empty($files)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan pilih atau ambil foto wajah terlebih dahulu'
            ], 400);
        }

        foreach ($files as $file) {
            if (!$file || !$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Berkas gambar tidak valid atau korup'
                ], 400);
            }

            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format berkas harus berupa JPG, JPEG, PNG, atau WEBP'
                ], 400);
            }

            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ukuran gambar maksimal adalah 5MB'
                ], 400);
            }
        }

        $nama_folder = $karyawan->nik . "-" . getNamaDepan(strtolower($karyawan->nama_karyawan));
        $folderPath = "uploads/facerecognition/" . $nama_folder . "/";

        if (!Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->makeDirectory($folderPath, 0775, true);
        }

        try {
            $saved = [];
            $cekWajah = Facerecognition::where('nik', $karyawan->nik)->count();
            $urutan = $cekWajah + 1;

            foreach ($files as $index => $file) {
                $direction = $request->input("directions.$index", 'front');
                $fileName = $urutan . "_" . $direction . ".png";
                
                $file->storeAs($folderPath, $fileName, 'public');

                $faceRecord = Facerecognition::create([
                    'nik' => $karyawan->nik,
                    'wajah' => $fileName
                ]);

                $saved[] = [
                    'id' => $faceRecord->id,
                    'wajah' => $fileName,
                    'url' => url('/storage/' . $folderPath . $fileName)
                ];
                $urutan++;
            }

            return response()->json([
                'success' => true,
                'message' => count($saved) . ' foto wajah berhasil disimpan',
                'registered' => true,
                'files' => $saved
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan wajah: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id = null)
    {
        $user = auth()->user();
        $karyawan = $user ? $user->karyawan : null;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Data karyawan tidak ditemukan'
            ], 404);
        }

        $faceId = $id ?? $request->input('id');
        $nama_folder = $karyawan->nik . "-" . getNamaDepan(strtolower($karyawan->nama_karyawan));

        try {
            if ($faceId) {
                $face = Facerecognition::where('nik', $karyawan->nik)->where('id', $faceId)->first();
                if (!$face) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data foto wajah tidak ditemukan'
                    ], 404);
                }

                $filePath = 'uploads/facerecognition/' . $nama_folder . '/' . $face->wajah;
                if (Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
                $face->delete();

                $remainingCount = Facerecognition::where('nik', $karyawan->nik)->count();

                return response()->json([
                    'success' => true,
                    'message' => 'Foto wajah berhasil dihapus',
                    'registered' => $remainingCount > 0,
                    'remaining' => $remainingCount
                ]);
            }

            $folderPath = 'uploads/facerecognition/' . $nama_folder;
            if (Storage::disk('public')->exists($folderPath)) {
                Storage::disk('public')->deleteDirectory($folderPath);
            }
            Facerecognition::where('nik', $karyawan->nik)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Semua data wajah berhasil dihapus',
                'registered' => false,
                'remaining' => 0
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data wajah: ' . $e->getMessage()
            ], 500);
        }
    }
}
