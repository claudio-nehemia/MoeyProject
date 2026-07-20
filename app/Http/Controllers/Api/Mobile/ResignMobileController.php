<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\KaryawanResign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ResignMobileController extends Controller
{
    public function getResignStatus(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil karyawan tidak ditemukan.'
            ], 404);
        }

        $resign = KaryawanResign::where('nik', $karyawan->nik)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $resign ? [
                'id' => $resign->id,
                'tanggal_pengajuan' => $resign->tanggal_pengajuan,
                'tanggal_efektif' => $resign->tanggal_efektif,
                'alasan' => $resign->alasan,
                'status_approval' => $resign->status_approval,
                'catatan_hrd' => $resign->catatan_hrd ?? '',
                'file_surat_url' => $resign->file_surat_resign ? url('/storage/' . $resign->file_surat_resign) : null
            ] : null
        ]);
    }

    public function submitResign(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil karyawan tidak ditemukan.'
            ], 404);
        }

        // Check if there is already a pending request
        $existing = KaryawanResign::where('nik', $karyawan->nik)
            ->where('status_approval', 'Pending')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki pengajuan pengunduran diri yang sedang diproses.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'tanggal_efektif' => 'required|date|after_or_equal:' . date('Y-m-d', strtotime('+30 days')),
            'alasan' => 'required|string',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096'
        ], [
            'tanggal_efektif.after_or_equal' => 'Tanggal efektif minimal harus 30 hari ke depan (One Month Notice).'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filePath = null;
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $filePath = $file->store('uploads/resign', 'public');
            }

            $resign = KaryawanResign::create([
                'nik' => $karyawan->nik,
                'tanggal_pengajuan' => date('Y-m-d'),
                'tanggal_efektif' => $request->tanggal_efektif,
                'alasan' => $request->alasan,
                'file_surat_resign' => $filePath,
                'status_approval' => 'Pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan pengunduran diri berhasil dikirim.',
                'data' => $resign
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pengajuan: ' . $e->getMessage()
            ], 500);
        }
    }
}
