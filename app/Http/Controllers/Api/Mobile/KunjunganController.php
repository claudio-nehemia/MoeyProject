<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use App\Models\Karyawan;
use App\Models\Pengaturanumum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class KunjunganController extends Controller
{
    /**
     * Get visit history for the authenticated employee
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

        $query = Kunjungan::where('nik', $karyawan->nik);

        // Filter by date range if provided
        if ($request->filled('tanggal_awal')) {
            $query->whereDate('tanggal_kunjungan', '>=', $request->tanggal_awal);
        }

        if ($request->filled('tanggal_akhir')) {
            $query->whereDate('tanggal_kunjungan', '<=', $request->tanggal_akhir);
        }

        $kunjungan = $query->orderBy('tanggal_kunjungan', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $kunjungan->map(function ($item) {
            $photoUrl = null;
            if ($item->foto) {
                $filePath = 'uploads/kunjungan/' . $item->foto;
                if (Storage::disk('public')->exists($filePath)) {
                    $photoUrl = asset('storage/' . $filePath);
                }
            }

            return [
                'id' => $item->id,
                'nik' => $item->nik,
                'tanggal_kunjungan' => $item->tanggal_kunjungan,
                'deskripsi' => $item->deskripsi,
                'lokasi' => $item->lokasi,
                'foto' => $photoUrl,
                'jam' => $item->created_at ? Carbon::parse($item->created_at)->format('H:i') : null,
                'tanggal_format' => $item->tanggal_kunjungan ? Carbon::parse($item->tanggal_kunjungan)->format('d M Y') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted
        ]);
    }

    /**
     * Submit a new visit record
     */
    public function store(Request $request)
    {
        $settings = Pengaturanumum::where('id', 1)->first();
        if ($settings && !$settings->feature_visit_tracking) {
            return response()->json([
                'success' => false,
                'message' => 'Fitur pelacakan kunjungan saat ini dinonaktifkan oleh administrator.'
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
            'deskripsi' => 'required|string|max:1000',
            'lokasi' => 'required|string|max:255', // "lat,lng"
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
            'tanggal_kunjungan' => 'required|date_format:Y-m-d'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filename = 'kunjungan_' . time() . '_' . uniqid() . '.png';
            $filepath = 'uploads/kunjungan/' . $filename;
            
            $destinationPath = 'uploads/kunjungan/';
            if (!Storage::disk('public')->exists($destinationPath)) {
                Storage::disk('public')->makeDirectory($destinationPath, 0775, true);
            }

            $imageFile = $request->file('image');
            Storage::disk('public')->put($filepath, file_get_contents($imageFile));

            $kunjungan = Kunjungan::create([
                'nik' => $karyawan->nik,
                'deskripsi' => $request->deskripsi,
                'lokasi' => $request->lokasi,
                'tanggal_kunjungan' => $request->tanggal_kunjungan,
                'foto' => $filename,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data kunjungan berhasil disimpan',
                'data' => $kunjungan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan kunjungan: ' . $e->getMessage()
            ], 500);
        }
    }
}
