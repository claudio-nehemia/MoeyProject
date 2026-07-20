<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\KaryawanPelatihan;
use Illuminate\Http\Request;

class PelatihanMobileController extends Controller
{
    public function getMyTrainings(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil karyawan tidak ditemukan.'
            ], 404);
        }

        $trainings = KaryawanPelatihan::with('pelatihan')
            ->where('nik', $karyawan->nik)
            ->get();

        $data = $trainings->map(function ($t) {
            return [
                'id' => $t->id,
                'kode_pelatihan' => $t->kode_pelatihan,
                'nama_pelatihan' => $t->pelatihan->nama_pelatihan ?? '',
                'penyelenggara' => $t->pelatihan->penyelenggara ?? '',
                'tanggal_mulai' => $t->pelatihan->tanggal_mulai ?? '',
                'tanggal_selesai' => $t->pelatihan->tanggal_selesai ?? '',
                'deskripsi' => $t->pelatihan->deskripsi ?? '',
                'status_kelulusan' => $t->status_kelulusan,
                'nilai' => $t->nilai ?? '-',
                'sertifikat_url' => $t->file_sertifikat ? url('/storage/' . $t->file_sertifikat) : null
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
