<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\Karyawan;
use App\Models\Lembur;
use App\Models\Pengaturanumum;
use App\Models\Facerecognition;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LemburController extends Controller
{
    /**
     * Get overtime history for the authenticated employee
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

        $lembur = Lembur::where('nik', $karyawan->nik)
            ->orderBy('tanggal', 'desc')
            ->orderBy('lembur_mulai', 'desc')
            ->get();

        $formatted = $lembur->map(function ($item) {
            $folderPath = 'storage/uploads/lembur/';
            
            return [
                'id' => $item->id,
                'nik' => $item->nik,
                'tanggal' => $item->tanggal,
                'lembur_mulai' => $item->lembur_mulai ? Carbon::parse($item->lembur_mulai)->format('Y-m-d H:i') : null,
                'lembur_selesai' => $item->lembur_selesai ? Carbon::parse($item->lembur_selesai)->format('Y-m-d H:i') : null,
                'keterangan' => $item->keterangan,
                'status' => $item->status, // 0 = pending, 1 = approved, 2 = rejected
                'lembur_in' => $item->lembur_in ? Carbon::parse($item->lembur_in)->format('H:i') : null,
                'lembur_out' => $item->lembur_out ? Carbon::parse($item->lembur_out)->format('H:i') : null,
                'lokasi_lembur_in' => $item->lokasi_lembur_in,
                'lokasi_lembur_out' => $item->lokasi_lembur_out,
                'foto_lembur_in' => $item->foto_lembur_in ? asset($folderPath . $item->foto_lembur_in) : null,
                'foto_lembur_out' => $item->foto_lembur_out ? asset($folderPath . $item->foto_lembur_out) : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted
        ]);
    }

    /**
     * Submit a new overtime request
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'dari' => 'required|date_format:Y-m-d H:i',
            'sampai' => 'required|date_format:Y-m-d H:i',
            'keterangan' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $lembur = Lembur::create([
                'nik' => $karyawan->nik,
                'tanggal' => date('Y-m-d', strtotime($request->dari)),
                'lembur_mulai' => $request->dari,
                'lembur_selesai' => $request->sampai,
                'keterangan' => $request->keterangan,
                'status' => 0, // Pending
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permohonan lembur berhasil diajukan',
                'data' => $lembur
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengajuan lembur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Perform overtime clock-in / clock-out
     */
    public function storepresensi(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'id_lembur' => 'required|integer',
            'status' => 'required|in:1,2', // 1 = masuk, 2 = pulang
            'lokasi' => 'required|string', // "latitude,longitude"
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $id_lembur = $request->id_lembur;
            $status = $request->status;
            $lokasi = $request->lokasi;

            $lembur = Lembur::where('id', $id_lembur)
                ->where('nik', $karyawan->nik)
                ->first();

            if (!$lembur) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data ajuan lembur tidak ditemukan'
                ], 404);
            }

            if ($lembur->status != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ajuan lembur Anda belum disetujui oleh atasan.'
                ], 400);
            }

            $cabang = Cabang::where('kode_cabang', $karyawan->kode_cabang)->first();
            $generalsetting = Pengaturanumum::where('id', 1)->first();

            if (!$cabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data cabang lokasi kantor tidak ditemukan'
                ], 404);
            }

            $timezone_cabang = $cabang->timezone ?? ($generalsetting->timezone ?? config('app.timezone'));
            $carbon_now = Carbon::now($timezone_cabang);
            $tanggal_sekarang = $carbon_now->format('Y-m-d');

            // Geofence Check
            $koordinat_user = explode(",", $lokasi);
            $latitude_user = trim($koordinat_user[0]);
            $longitude_user = trim($koordinat_user[1]);

            $koordinat_kantor = explode(",", $cabang->lokasi_cabang);
            $latitude_kantor = trim($koordinat_kantor[0]);
            $longitude_kantor = trim($koordinat_kantor[1]);

            $jarak = hitungjarak($latitude_kantor, $longitude_kantor, $latitude_user, $longitude_user);
            $radius = round($jarak["meters"]);

            if ($karyawan->lock_location == 1 && $radius > $cabang->radius_cabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda berada di luar radius kantor. Jarak Anda ' . $radius . ' meter dari kantor.'
                ], 400);
            }

            $in_out = $status == 1 ? "in" : "out";
            $folderPath = "uploads/lembur/";
            if (!Storage::disk('public')->exists($folderPath)) {
                Storage::disk('public')->makeDirectory($folderPath, 0775, true);
            }

            $fileName = $karyawan->nik . "-" . $tanggal_sekarang . "-" . $in_out . ".png";
            $imageFile = $request->file('image');
            Storage::disk('public')->put($folderPath . $fileName, file_get_contents($imageFile));

            // Run Selfie Quality Check & Face Recognition
            $selfieFullPath = Storage::disk('public')->path($folderPath . $fileName);
            $nama_folder_wajah = $karyawan->nik . "-" . getNamaDepan(strtolower($karyawan->nama_karyawan));
            $folderWajahPath = "uploads/facerecognition/" . $nama_folder_wajah;
            
            $hasRegisteredFaces = Storage::disk('public')->exists($folderWajahPath) && count(Storage::disk('public')->files($folderWajahPath)) > 0;
            
            $registeredDirArg = "";
            if ($generalsetting && $generalsetting->face_recognition == 1 && $hasRegisteredFaces) {
                $registeredDirArg = Storage::disk('public')->path($folderWajahPath);
            }

            $pythonPath = PHP_OS_FAMILY === 'Windows' ? 'python' : 'python3';
            $scriptPath = base_path('verify_face.py');
            
            $command = $pythonPath . " " . escapeshellarg($scriptPath) . " " . escapeshellarg($selfieFullPath);
            if ($registeredDirArg !== "") {
                $command .= " " . escapeshellarg($registeredDirArg);
            }
            $command .= " 2>&1";
            
            $output = shell_exec($command);
            $result = json_decode($output, true);
            
            if (!$result || !isset($result['matched']) || !$result['matched']) {
                Storage::disk('public')->delete($folderPath . $fileName);
                
                $failMsg = isset($result['message']) ? $result['message'] : 'Verifikasi wajah gagal. Wajah Anda tidak cocok dengan data terdaftar.';
                return response()->json([
                    'success' => false,
                    'message' => $failMsg
                ], 400);
            }

            $jam_presensi = $tanggal_sekarang . " " . $carbon_now->format('H:i:s');
            $batas_jam_absen = 30; // matching web

            $mulai_lembur = $lembur->lembur_mulai;
            $jam_mulai_masuk = date('Y-m-d H:i', strtotime('-' . $batas_jam_absen . ' minutes', strtotime($mulai_lembur)));
            $jam_mulai_pulang = date('Y-m-d H:i', strtotime('+' . $batas_jam_absen . ' minutes', strtotime($mulai_lembur)));
            $jam_pulang = $lembur->lembur_selesai;

            if ($status == 1) {
                // Clock-in
                if ($lembur->lembur_in != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah memulai absen lembur'
                    ], 400);
                }
                if ($jam_presensi < $jam_mulai_masuk) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Belum waktunya absen masuk. Waktu absen dimulai pukul ' . Carbon::parse($jam_mulai_masuk)->format('d-m-Y H:i')
                    ], 400);
                }
                if ($jam_presensi > $jam_pulang) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Waktu lembur sudah berakhir. Tidak bisa absen masuk lagi.'
                    ], 400);
                }

                Lembur::where('id', $id_lembur)->update([
                    'lembur_in' => $jam_presensi,
                    'lokasi_lembur_in' => $lokasi,
                    'foto_lembur_in' => $fileName
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil memulai lembur',
                    'data' => [
                        'lembur_in' => $carbon_now->format('H:i'),
                        'foto_lembur_in' => asset('storage/uploads/lembur/' . $fileName)
                    ]
                ]);

            } else {
                // Clock-out
                if ($lembur->lembur_out != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah absen pulang lembur'
                    ], 400);
                }
                if ($jam_presensi < $jam_mulai_pulang) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Belum waktunya absen pulang. Minimal 30 menit setelah jam mulai lembur.'
                    ], 400);
                }

                Lembur::where('id', $id_lembur)->update([
                    'lembur_out' => $jam_presensi,
                    'lokasi_lembur_out' => $lokasi,
                    'foto_lembur_out' => $fileName
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil absen pulang lembur',
                    'data' => [
                        'lembur_out' => $carbon_now->format('H:i'),
                        'foto_lembur_out' => asset('storage/uploads/lembur/' . $fileName)
                    ]
                ]);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
