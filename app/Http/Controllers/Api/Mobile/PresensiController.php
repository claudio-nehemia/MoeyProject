<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\Karyawan;
use App\Models\Presensi;
use App\Models\Jamkerja;
use App\Models\Pengaturanumum;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PresensiController extends Controller
{
    /**
     * Check-In (Absen Masuk)
     */
    public function masuk(Request $request)
    {
        return $this->storePresence($request, 1); // 1 = Masuk
    }

    /**
     * Check-Out (Absen Pulang)
     */
    public function pulang(Request $request)
    {
        return $this->storePresence($request, 2); // 2 = Pulang
    }

    /**
     * Store Presence entry (Common logic for check-in and check-out)
     */
    private function storePresence(Request $request, $status)
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
            'lokasi' => 'required|string', // "latitude,longitude"
            'kode_jam_kerja' => 'required|string',
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
            $generalsetting = Pengaturanumum::where('id', 1)->first();
            $status_lock_location = $karyawan->lock_location;
            $lokasi = $request->input('lokasi');
            $kode_jam_kerja = $request->input('kode_jam_kerja');

            $cabang = Cabang::where('kode_cabang', $karyawan->kode_cabang)->first();
            if (!$cabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data cabang lokasi kantor tidak ditemukan'
                ], 404);
            }

            $lokasi_kantor = $cabang->lokasi_cabang; // "latitude,longitude"
            $timezone_cabang = $cabang->timezone ?? ($generalsetting->timezone ?? config('app.timezone'));

            $carbon_now = Carbon::now($timezone_cabang);
            $tanggal_sekarang = $carbon_now->format('Y-m-d');
            $jam_sekarang = $carbon_now->format('H:i');
            $tanggal_kemarin = $carbon_now->copy()->subDay()->format('Y-m-d');
            $tanggal_besok = $carbon_now->copy()->addDay()->format('Y-m-d');

            // Check yesterday's attendance for Lintas Hari
            $presensi_kemarin = Presensi::where('nik', $karyawan->nik)
                ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('presensi.tanggal', $tanggal_kemarin)->first();

            $batas_presensi_lintashari = ($presensi_kemarin && $presensi_kemarin->batas_presensi_pulang)
                ? $presensi_kemarin->batas_presensi_pulang
                : ($generalsetting ? $generalsetting->batas_presensi_lintashari : '08:00:00');

            $jam_kerja = Jamkerja::where('kode_jam_kerja', $kode_jam_kerja)->first();
            if (!$jam_kerja) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data jam kerja tidak ditemukan'
                ], 404);
            }

            // Determine check-in target date
            $tanggal_presensi = $tanggal_sekarang;
            $jam_kerja_pulang = $jam_kerja->jam_pulang;
            $tanggal_pulang = $jam_kerja->lintashari == 1 ? $tanggal_besok : $tanggal_sekarang;

            if ($presensi_kemarin && $presensi_kemarin->lintashari == 1 && $presensi_kemarin->jam_out == null) {
                if ($jam_sekarang < $batas_presensi_lintashari) {
                    $tanggal_presensi = $tanggal_kemarin;
                    $tanggal_pulang = $tanggal_sekarang;
                    $jam_kerja_pulang = $presensi_kemarin->jam_pulang;
                }
            }

            // Calculate distance
            $koordinat_user = explode(",", $lokasi);
            $latitude_user = trim($koordinat_user[0]);
            $longitude_user = trim($koordinat_user[1]);

            $koordinat_kantor = explode(",", $lokasi_kantor);
            $latitude_kantor = trim($koordinat_kantor[0]);
            $longitude_kantor = trim($koordinat_kantor[1]);

            $jarak = hitungjarak($latitude_kantor, $longitude_kantor, $latitude_user, $longitude_user);
            $radius = round($jarak["meters"]);

            // Geofence lock check
            if ($status_lock_location == 1 && $radius > $cabang->radius_cabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda berada di luar radius kantor. Jarak Anda ' . $radius . ' meter dari kantor.'
                ], 400);
            }

            $in_out = $status == 1 ? "in" : "out";
            $folderPath = "uploads/absensi/";
            if (!Storage::disk('public')->exists($folderPath)) {
                Storage::disk('public')->makeDirectory($folderPath, 0775, true);
            }

            $jam_presensi = $tanggal_sekarang . " " . $carbon_now->format('H:i:s');
            $fileName = $karyawan->nik . "-" . $tanggal_presensi . "-" . $in_out . ".png";

            // Save uploaded selfie
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
            Log::info("FACE_RECOGNITION_OUTPUT for NIK $karyawan->nik: " . $output);
            
            $result = null;
            $start = strpos($output, '{');
            $end = strrpos($output, '}');
            if ($start !== false && $end !== false) {
                $json_str = substr($output, $start, $end - $start + 1);
                $result = json_decode($json_str, true);
            }
            
            if (!$result || !isset($result['matched']) || !$result['matched']) {
                // Delete the uploaded selfie
                Storage::disk('public')->delete($folderPath . $fileName);
                
                $failMsg = isset($result['message']) ? $result['message'] : 'Verifikasi wajah gagal. Wajah Anda tidak cocok dengan data terdaftar.';
                return response()->json([
                    'success' => false,
                    'message' => $failMsg,
                    'python_output' => $output ?? ''
                ], 400);
            }

            $presensi_hariini = Presensi::where('nik', $karyawan->nik)
                ->where('tanggal', $tanggal_presensi)
                ->first();

            // Limits checking parameters
            $batas_jam_absen = ($generalsetting ? $generalsetting->batas_jam_absen : 0) * 60;
            $batas_jam_absen_pulang = ($generalsetting ? $generalsetting->batas_jam_absen_pulang : 0) * 60;

            $jam_masuk_string = $tanggal_presensi . " " . $jam_kerja->jam_masuk;
            $jam_masuk_carbon = Carbon::parse($jam_masuk_string, $timezone_cabang);

            $jam_mulai_masuk_carbon = $jam_masuk_carbon->copy()->subMinutes($batas_jam_absen);
            $jam_akhir_masuk_carbon = $jam_masuk_carbon->copy()->addMinutes($batas_jam_absen);

            $jam_pulang_string = $tanggal_pulang . " " . $jam_kerja_pulang;
            $jam_pulang_carbon = Carbon::parse($jam_pulang_string, $timezone_cabang);
            $jam_mulai_pulang_carbon = $jam_pulang_carbon->copy()->subMinutes($batas_jam_absen_pulang);

            if ($status == 1) {
                // Check-In
                if ($presensi_hariini && $presensi_hariini->jam_in != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah absen masuk hari ini'
                    ], 400);
                }

                if ($generalsetting && $generalsetting->batasi_absen == 1 && $carbon_now->lt($jam_mulai_masuk_carbon)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maaf, belum waktunya absen masuk. Dimulai pukul ' . $jam_mulai_masuk_carbon->format('H:i')
                    ], 400);
                }

                if ($generalsetting && $generalsetting->batasi_absen == 1 && $carbon_now->gt($jam_akhir_masuk_carbon)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maaf, batas waktu absen masuk sudah habis'
                    ], 400);
                }

                if ($presensi_hariini != null) {
                    Presensi::where('id', $presensi_hariini->id)->update([
                        'jam_in' => $jam_presensi,
                        'lokasi_in' => $lokasi,
                        'foto_in' => $fileName
                    ]);
                } else {
                    Presensi::create([
                        'nik' => $karyawan->nik,
                        'tanggal' => $tanggal_presensi,
                        'jam_in' => $jam_presensi,
                        'jam_out' => null,
                        'lokasi_in' => $lokasi,
                        'lokasi_out' => null,
                        'foto_in' => $fileName,
                        'foto_out' => null,
                        'kode_jam_kerja' => $kode_jam_kerja,
                        'status' => 'h'
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil absen masuk',
                    'data' => [
                        'jam_in' => $carbon_now->format('H:i'),
                        'foto_in' => asset('storage/uploads/absensi/' . $fileName)
                    ]
                ]);

            } else {
                // Check-Out
                if ($presensi_hariini && $presensi_hariini->jam_out != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah absen pulang hari ini'
                    ], 400);
                }

                if ($generalsetting && $generalsetting->batasi_absen == 1 && $carbon_now->lt($jam_mulai_pulang_carbon)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maaf, belum waktunya absen pulang. Dimulai pukul ' . $jam_mulai_pulang_carbon->format('H:i')
                    ], 400);
                }

                if ($presensi_hariini != null) {
                    Presensi::where('id', $presensi_hariini->id)->update([
                        'jam_out' => $jam_presensi,
                        'lokasi_out' => $lokasi,
                        'foto_out' => $fileName
                    ]);
                } else {
                    Presensi::create([
                        'nik' => $karyawan->nik,
                        'tanggal' => $tanggal_presensi,
                        'jam_in' => null,
                        'jam_out' => $jam_presensi,
                        'lokasi_in' => null,
                        'lokasi_out' => $lokasi,
                        'foto_in' => null,
                        'foto_out' => $fileName,
                        'kode_jam_kerja' => $kode_jam_kerja,
                        'status' => 'h'
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil absen pulang',
                    'data' => [
                        'jam_out' => $carbon_now->format('H:i'),
                        'foto_out' => asset('storage/uploads/absensi/' . $fileName)
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

    /**
     * Get monthly presence history list
     */
    public function riwayat(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak terdaftar sebagai karyawan'
            ], 403);
        }

        $bulan = $request->query('bulan', Carbon::now()->month);
        $tahun = $request->query('tahun', Carbon::now()->year);

        $riwayat = Presensi::join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->where('presensi.nik', $karyawan->nik)
            ->whereRaw("EXTRACT(MONTH FROM presensi.tanggal) = ?", [$bulan])
            ->whereRaw("EXTRACT(YEAR FROM presensi.tanggal) = ?", [$tahun])
            ->leftJoin('presensi_izinabsen_approve', 'presensi.id', '=', 'presensi_izinabsen_approve.id_presensi')
            ->leftJoin('presensi_izinabsen', 'presensi_izinabsen_approve.kode_izin', '=', 'presensi_izinabsen.kode_izin')
            ->leftJoin('presensi_izinsakit_approve', 'presensi.id', '=', 'presensi_izinsakit_approve.id_presensi')
            ->leftJoin('presensi_izinsakit', 'presensi_izinsakit_approve.kode_izin_sakit', '=', 'presensi_izinsakit.kode_izin_sakit')
            ->leftJoin('presensi_izincuti_approve', 'presensi.id', '=', 'presensi_izincuti_approve.id_presensi')
            ->leftJoin('presensi_izincuti', 'presensi_izincuti_approve.kode_izin_cuti', '=', 'presensi_izincuti.kode_izin_cuti')
            ->select(
                'presensi.id',
                'presensi.tanggal',
                'presensi.jam_in',
                'presensi.jam_out',
                'presensi.status',
                'presensi_jamkerja.nama_jam_kerja',
                'presensi_jamkerja.jam_masuk',
                'presensi_jamkerja.jam_pulang',
                'presensi_izinabsen.keterangan as keterangan_izin',
                'presensi_izinsakit.keterangan as keterangan_izin_sakit',
                'presensi_izincuti.keterangan as keterangan_izin_cuti'
            )
            ->orderBy('presensi.tanggal', 'desc')
            ->get();

        $riwayatFormatted = $riwayat->map(function ($item) use ($karyawan) {
            $keterangan = null;
            if ($item->status == 'i') $keterangan = $item->keterangan_izin;
            if ($item->status == 's') $keterangan = $item->keterangan_izin_sakit;
            if ($item->status == 'c') $keterangan = $item->keterangan_izin_cuti;

            return [
                'id' => $item->id,
                'tanggal' => $item->tanggal,
                'jam_in' => $item->jam_in ? date('H:i', strtotime($item->jam_in)) : null,
                'jam_out' => $item->jam_out ? date('H:i', strtotime($item->jam_out)) : null,
                'status' => $item->status,
                'nama_jam_kerja' => $item->nama_jam_kerja,
                'jam_masuk' => date('H:i', strtotime($item->jam_masuk)),
                'jam_pulang' => date('H:i', strtotime($item->jam_pulang)),
                'keterangan' => $keterangan,
                'foto_in' => $item->jam_in ? asset('storage/uploads/absensi/' . $karyawan->nik . '-' . $item->tanggal . '-in.png') : null,
                'foto_out' => $item->jam_out ? asset('storage/uploads/absensi/' . $karyawan->nik . '-' . $item->tanggal . '-out.png') : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $riwayatFormatted
        ]);
    }

    /**
     * Break Attendance (Mulai / Selesai Istirahat)
     */
    public function istirahat(Request $request)
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
            'status' => 'required|in:1,2', // 1 = Mulai Istirahat, 2 = Selesai Istirahat
            'lokasi' => 'required|string',
            'kode_jam_kerja' => 'required|string',
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
            $status = $request->input('status');
            $lokasi = $request->input('lokasi');
            $kode_jam_kerja = $request->input('kode_jam_kerja');

            $generalsetting = Pengaturanumum::where('id', 1)->first();
            $tanggal_sekarang = Carbon::now(config('app.timezone'))->format('Y-m-d');
            $jam_sekarang = Carbon::now(config('app.timezone'))->format('H:i');
            $tanggal_kemarin = Carbon::now(config('app.timezone'))->copy()->subDay()->format('Y-m-d');

            // Cek presensi hari ini
            $presensi_kemarin = Presensi::where('nik', $karyawan->nik)
                ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('presensi.tanggal', $tanggal_kemarin)->first();

            $lintas_hari = $presensi_kemarin ? $presensi_kemarin->lintashari : 0;
            $tanggal_presensi = $lintas_hari == 1 ? $tanggal_kemarin : $tanggal_sekarang;

            $presensi_hariini = Presensi::where('nik', $karyawan->nik)
                ->where('tanggal', $tanggal_presensi)
                ->first();

            if (!$presensi_hariini) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda belum melakukan presensi masuk'
                ], 400);
            }

            $jam_kerja = Jamkerja::where('kode_jam_kerja', $kode_jam_kerja)->first();
            if (!$jam_kerja || $jam_kerja->istirahat == 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada istirahat untuk jam kerja saat ini'
                ], 400);
            }

            // Save break selfie
            $in_out = $status == 1 ? "out" : "in";
            $folderPath = "public/uploads/istirahat/";
            if (!Storage::exists($folderPath)) {
                Storage::makeDirectory($folderPath, 0775, true);
            }

            $jam_presensi = Carbon::now(config('app.timezone'))->format('Y-m-d H:i:s');
            $fileName = $karyawan->nik . "-" . $tanggal_presensi . "-" . $in_out . ".png";

            $imageFile = $request->file('image');
            Storage::put($folderPath . $fileName, file_get_contents($imageFile));

            $batas_jam_absen = 30;
            $jam_awal_istirahat = $tanggal_presensi . " " . date('H:i', strtotime($jam_kerja->jam_awal_istirahat));
            $jam_mulai_istirahat = Carbon::parse($jam_awal_istirahat)->copy()->subMinutes($batas_jam_absen);

            if ($status == 1) {
                // Mulai Istirahat
                if ($presensi_hariini->istirahat_out != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah mencatat Mulai Istirahat hari ini'
                    ], 400);
                }

                if (Carbon::now(config('app.timezone'))->lt($jam_mulai_istirahat)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maaf, belum waktunya memulai istirahat. Istirahat dapat dilakukan mulai pukul ' . $jam_mulai_istirahat->format('H:i')
                    ], 400);
                }

                $presensi_hariini->update([
                    'istirahat_out' => $jam_presensi,
                    'lokasi_istirahat_out' => $lokasi,
                    'foto_istirahat_out' => $fileName
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil memulai istirahat',
                    'data' => [
                        'istirahat_out' => Carbon::now(config('app.timezone'))->format('H:i'),
                        'foto_istirahat_out' => asset('storage/uploads/istirahat/' . $fileName)
                    ]
                ]);
            } else {
                // Selesai Istirahat
                if ($presensi_hariini->istirahat_out == null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda belum mencatat Mulai Istirahat hari ini'
                    ], 400);
                }

                if ($presensi_hariini->istirahat_in != null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda sudah mengakhiri istirahat hari ini'
                    ], 400);
                }

                $presensi_hariini->update([
                    'istirahat_in' => $jam_presensi,
                    'lokasi_istirahat_in' => $lokasi,
                    'foto_istirahat_in' => $fileName
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Berhasil mengakhiri istirahat',
                    'data' => [
                        'istirahat_in' => Carbon::now(config('app.timezone'))->format('H:i'),
                        'foto_istirahat_in' => asset('storage/uploads/istirahat/' . $fileName)
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
