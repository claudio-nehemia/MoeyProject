<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\AktivitasKaryawan;
use App\Models\Karyawan;
use App\Models\Pengaturanumum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AktivitasController extends Controller
{
    /**
     * Get activity history for the authenticated employee
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $query = AktivitasKaryawan::where('nik', $karyawan->nik);

        // Filter by date range if provided
        if ($request->filled('tanggal_awal')) {
            $query->whereDate('created_at', '>=', $request->tanggal_awal);
        }

        if ($request->filled('tanggal_akhir')) {
            $query->whereDate('created_at', '<=', $request->tanggal_akhir);
        }

        $aktivitas = $query->orderBy('created_at', 'desc')->get();

        $formatted = $aktivitas->map(function ($item) {
            $photoUrl = null;
            if ($item->foto) {
                $filePath = 'uploads/aktivitas/' . $item->foto;
                if (Storage::disk('public')->exists($filePath)) {
                    $photoUrl = asset('storage/' . $filePath);
                }
            }

            return [
                'id' => $item->id,
                'nik' => $item->nik,
                'aktivitas' => $item->aktivitas,
                'lokasi' => $item->lokasi,
                'foto' => $photoUrl,
                'jam' => $item->created_at ? Carbon::parse($item->created_at)->format('H:i') : null,
                'tanggal_format' => $item->created_at ? Carbon::parse($item->created_at)->format('d M Y') : null,
                'tanggal_db' => $item->created_at ? Carbon::parse($item->created_at)->format('Y-m-d') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted
        ]);
    }

    /**
     * Submit a new activity record
     */
    public function store(Request $request)
    {
        $settings = Pengaturanumum::where('id', 1)->first();
        if ($settings && !$settings->feature_daily_activity) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur laporan aktivitas harian saat ini dinonaktifkan oleh administrator.'
            ], 403);
        }

        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'aktivitas' => 'required|string|max:1000',
            'lokasi' => 'required|string|max:255', // "lat,lng"
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filename = time() . '_aktivitas_' . uniqid() . '.png';
            $filepath = 'uploads/aktivitas/' . $filename;
            
            $destinationPath = 'uploads/aktivitas/';
            if (!Storage::disk('public')->exists($destinationPath)) {
                Storage::disk('public')->makeDirectory($destinationPath, 0775, true);
            }

            $imageFile = $request->file('image');
            Storage::disk('public')->put($filepath, file_get_contents($imageFile));

            $aktivitas = AktivitasKaryawan::create([
                'nik' => $karyawan->nik,
                'aktivitas' => $request->aktivitas,
                'lokasi' => $request->lokasi,
                'foto' => $filename,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Aktivitas berhasil disimpan',
                'data' => $aktivitas
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan aktivitas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an activity record
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $aktivitas = AktivitasKaryawan::where('id', $id)
            ->where('nik', $karyawan->nik)
            ->first();

        if (!$aktivitas) {
            return response()->json([
                'success' => false,
                'message' => 'Aktivitas tidak ditemukan'
            ], 404);
        }

        try {
            // Delete foto if exists
            if ($aktivitas->foto) {
                $filePath = 'uploads/aktivitas/' . $aktivitas->foto;
                if (Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
            }

            $aktivitas->delete();

            return response()->json([
                'success' => true,
                'message' => 'Aktivitas berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus aktivitas: ' . $e->getMessage()
            ], 500);
        }
    }
}
