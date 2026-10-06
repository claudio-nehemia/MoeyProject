<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Izinabsen;
use App\Models\Izincuti;
use App\Models\Izindinas;
use App\Models\Izinsakit;
use App\Models\Karyawan;
use App\Models\Koreksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class IzinController extends Controller
{
    /**
     * Get list of permission/leave requests for mobile.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;
        
        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil data karyawan tidak ditemukan'
            ], 404);
        }
        $nik = $karyawan->nik;

        $hasDocCuti = Schema::hasColumn('presensi_izincuti', 'doc_cuti');
        $hasDocIzin = Schema::hasColumn('presensi_izinabsen', 'doc_izin');
        $hasDocDinas = Schema::hasColumn('presensi_izindinas', 'doc_dinas');
        $hasDocKoreksi = Schema::hasColumn('presensi_koreksi', 'doc_koreksi');

        $izinabsen = DB::table('presensi_izinabsen')->where('nik', $nik)
            ->select('kode_izin as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'i' as ket"), 'status', 'approval_step', $hasDocIzin ? 'doc_izin as doc_sid' : DB::raw('NULL as doc_sid'));

        $izinsakit = DB::table('presensi_izinsakit')->where('nik', $nik)
            ->select('kode_izin_sakit as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'s' as ket"), 'status', 'approval_step', 'doc_sid');

        $izincuti = DB::table('presensi_izincuti')->where('nik', $nik)
            ->select('kode_izin_cuti as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'c' as ket"), 'status', 'approval_step', $hasDocCuti ? 'doc_cuti as doc_sid' : DB::raw('NULL as doc_sid'));

        $izin_dinas = DB::table('presensi_izindinas')->where('nik', $nik)
            ->select('kode_izin_dinas as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'d' as ket"), 'status', 'approval_step', $hasDocDinas ? 'doc_dinas as doc_sid' : DB::raw('NULL as doc_sid'));

        // Koreksi
        $koreksi = DB::table('presensi_koreksi')->where('nik', $nik)
            ->select('kode_koreksi as kode', 'tanggal', 'keterangan', 'tanggal as dari', 'tanggal as sampai', DB::raw("'k' as ket"), 'status', 'approval_step', $hasDocKoreksi ? 'doc_koreksi as doc_sid' : DB::raw('NULL as doc_sid'));

        $pengajuan_izin = $izinabsen->union($izinsakit)->union($izincuti)->union($izin_dinas)->union($koreksi)
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(function ($item) {
                if ($item->doc_sid) {
                    $folder = match ($item->ket) {
                        'c' => 'cuti',
                        'i' => 'absen',
                        'd' => 'dinas',
                        'k' => 'koreksi',
                        default => 'sid',
                    };
                    $item->doc_sid_url = asset('storage/uploads/' . $folder . '/' . $item->doc_sid);
                    $item->doc_url = $item->doc_sid_url;
                } else {
                    $item->doc_sid_url = null;
                    $item->doc_url = null;
                }
                return $item;
            });

        return response()->json([
            'success' => true,
            'data' => $pengajuan_izin
        ]);
    }

    /**
     * Submit a permission/leave request.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;
        
        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil data karyawan tidak ditemukan'
            ], 404);
        }
        $nik = $karyawan->nik;

        $validator = Validator::make($request->all(), [
            'jenis_izin' => 'required|in:i,s,c,d,k', // i=absen, s=sakit, c=cuti, d=dinas, k=koreksi
            'dari' => 'required|date_format:Y-m-d',
            'sampai' => 'required|date_format:Y-m-d|after_or_equal:dari',
            'keterangan' => 'required|string',
            'sid' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'doc_cuti' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'doc_izin' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'doc_dinas' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'doc_koreksi' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'lampiran' => 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'kode_jam_kerja' => 'required_if:jenis_izin,k|string',
            'jam_in' => 'nullable|string',
            'jam_out' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $jenis = $request->input('jenis_izin');
        $dari = $request->input('dari');
        $sampai = $request->input('sampai');
        $keterangan = $request->input('keterangan');

        if ($jenis === 'k') {
            $cek_koreksi = Koreksi::where('nik', $nik)
                ->where('tanggal', $dari)
                ->where('status', 0)
                ->first();

            if ($cek_koreksi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki pengajuan koreksi yang sedang diproses untuk tanggal tersebut!'
                ], 400);
            }
        } else {
            // Check if there's overlap in dates across any permission table
            $cek_absen = Izinabsen::where('nik', $nik)
                ->where(function($q) use ($dari, $sampai) {
                    $q->whereBetween('dari', [$dari, $sampai])
                      ->orWhereBetween('sampai', [$dari, $sampai]);
                })->first();

            $cek_sakit = Izinsakit::where('nik', $nik)
                ->where(function($q) use ($dari, $sampai) {
                    $q->whereBetween('dari', [$dari, $sampai])
                      ->orWhereBetween('sampai', [$dari, $sampai]);
                })->first();

            $cek_cuti = Izincuti::where('nik', $nik)
                ->where(function($q) use ($dari, $sampai) {
                    $q->whereBetween('dari', [$dari, $sampai])
                      ->orWhereBetween('sampai', [$dari, $sampai]);
                })->first();

            $cek_dinas = Izindinas::where('nik', $nik)
                ->where(function($q) use ($dari, $sampai) {
                    $q->whereBetween('dari', [$dari, $sampai])
                      ->orWhereBetween('sampai', [$dari, $sampai]);
                })->first();

            if ($cek_absen || $cek_sakit || $cek_cuti || $cek_dinas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memiliki pengajuan izin/sakit/cuti/dinas pada rentang tanggal tersebut!'
                ], 400);
            }
        }

        $uploadedFile = $request->file('lampiran')
            ?? $request->file('doc_izin')
            ?? $request->file('doc_cuti')
            ?? $request->file('sid')
            ?? $request->file('doc_dinas')
            ?? $request->file('doc_koreksi');

        $saveFile = function ($file, $folder, $fileName) {
            $destination_path = "uploads/" . $folder;
            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                try {
                    $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
                    $image = $manager->read($file);
                    $encodedImage = (string) $image->toJpeg(80);
                    Storage::disk('public')->put($destination_path . "/" . $fileName, $encodedImage);
                } catch (\Exception $e) {
                    $file->storeAs($destination_path, $fileName, 'public');
                }
            } else {
                $file->storeAs($destination_path, $fileName, 'public');
            }
        };

        DB::beginTransaction();
        try {
            if ($jenis == 'i') {
                // Izin Absen
                $lastizin = Izinabsen::select('kode_izin')
                    ->whereRaw("EXTRACT(YEAR FROM dari) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM dari) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin", "desc")
                    ->first();
                $last_kode = $lastizin ? $lastizin->kode_izin : '';
                $kode = buatkode($last_kode, "IA" . date('ym', strtotime($dari)), 4);

                $docIzinName = null;
                if ($uploadedFile) {
                    $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: 'jpg');
                    $docIzinName = $kode . "." . $ext;
                }

                $izin = new Izinabsen();
                $izin->kode_izin = $kode;
                $izin->nik = $nik;
                $izin->tanggal = $dari;
                $izin->dari = $dari;
                $izin->sampai = $sampai;
                $izin->keterangan = $keterangan;
                $izin->status = 0;
                $izin->approval_step = 1;
                if ($docIzinName && Schema::hasColumn('presensi_izinabsen', 'doc_izin')) {
                    $izin->doc_izin = $docIzinName;
                }
                $izin->save();

                if ($uploadedFile && $docIzinName) {
                    $saveFile($uploadedFile, 'absen', $docIzinName);
                }

            } elseif ($jenis == 's') {
                // Izin Sakit
                $lastizinsakit = Izinsakit::select('kode_izin_sakit')
                    ->whereRaw("EXTRACT(YEAR FROM tanggal) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM tanggal) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin_sakit", "desc")
                    ->first();
                $last_kode = $lastizinsakit ? $lastizinsakit->kode_izin_sakit : '';
                $kode = buatkode($last_kode, "IS" . date('ym', strtotime($dari)), 4);

                $sid_name = null;
                if ($uploadedFile) {
                    $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: 'jpg');
                    $sid_name = $kode . "." . $ext;
                }

                $sakit = new Izinsakit();
                $sakit->kode_izin_sakit = $kode;
                $sakit->nik = $nik;
                $sakit->tanggal = $dari;
                $sakit->dari = $dari;
                $sakit->sampai = $sampai;
                $sakit->keterangan = $keterangan;
                $sakit->status = 0;
                $sakit->approval_step = 1;
                $sakit->id_user = $user->id;
                if ($sid_name) {
                    $sakit->doc_sid = $sid_name;
                }
                $sakit->save();

                if ($uploadedFile && $sid_name) {
                    $saveFile($uploadedFile, 'sid', $sid_name);
                }

            } elseif ($jenis == 'c') {
                // Izin Cuti
                $kodeCuti = $request->input('kode_cuti', 'C01');

                // Safety guard: Pastikan data master cuti tersedia untuk mencegah foreign key violation
                if (!\App\Models\Cuti::where('kode_cuti', $kodeCuti)->exists()) {
                    \App\Models\Cuti::firstOrCreate(
                        ['kode_cuti' => 'C01'],
                        ['jenis_cuti' => 'Tahunan', 'jumlah_hari' => 12]
                    );
                    if ($kodeCuti !== 'C01' && !\App\Models\Cuti::where('kode_cuti', $kodeCuti)->exists()) {
                        $kodeCuti = 'C01';
                    }
                }

                $lastizincuti = Izincuti::select('kode_izin_cuti')
                    ->whereRaw("EXTRACT(YEAR FROM dari) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM dari) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin_cuti", "desc")
                    ->first();
                $last_kode = $lastizincuti ? $lastizincuti->kode_izin_cuti : '';
                $kode = buatkode($last_kode, "IC" . date('ym', strtotime($dari)), 4);

                $docCutiName = null;
                if ($uploadedFile) {
                    $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: 'jpg');
                    $docCutiName = $kode . "." . $ext;
                }

                $cuti = new Izincuti();
                $cuti->kode_izin_cuti = $kode;
                $cuti->nik = $nik;
                $cuti->tanggal = $dari;
                $cuti->dari = $dari;
                $cuti->sampai = $sampai;
                $cuti->kode_cuti = $kodeCuti;
                $cuti->keterangan = $keterangan;
                $cuti->status = 0;
                $cuti->approval_step = 1;
                $cuti->id_user = $user->id;
                if ($docCutiName && Schema::hasColumn('presensi_izincuti', 'doc_cuti')) {
                    $cuti->doc_cuti = $docCutiName;
                }
                $cuti->save();

                if ($uploadedFile && $docCutiName) {
                    $saveFile($uploadedFile, 'cuti', $docCutiName);
                }

            } elseif ($jenis == 'd') {
                // Izin Dinas
                $lastizindinas = Izindinas::select('kode_izin_dinas')
                    ->whereRaw("EXTRACT(YEAR FROM dari) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM dari) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin_dinas", "desc")
                    ->first();
                $last_kode = $lastizindinas ? $lastizindinas->kode_izin_dinas : '';
                $kode = buatkode($last_kode, "ID" . date('ym', strtotime($dari)), 4);

                $docDinasName = null;
                if ($uploadedFile) {
                    $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: 'jpg');
                    $docDinasName = $kode . "." . $ext;
                }

                $dinas = new Izindinas();
                $dinas->kode_izin_dinas = $kode;
                $dinas->nik = $nik;
                $dinas->tanggal = $dari;
                $dinas->dari = $dari;
                $dinas->sampai = $sampai;
                $dinas->keterangan = $keterangan;
                $dinas->status = 0;
                $dinas->approval_step = 1;
                if ($docDinasName && Schema::hasColumn('presensi_izindinas', 'doc_dinas')) {
                    $dinas->doc_dinas = $docDinasName;
                }
                $dinas->save();

                if ($uploadedFile && $docDinasName) {
                    $saveFile($uploadedFile, 'dinas', $docDinasName);
                }

            } elseif ($jenis == 'k') {
                // Koreksi Absen
                $lastkoreksi = Koreksi::select('kode_koreksi')
                    ->whereRaw("EXTRACT(YEAR FROM tanggal) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM tanggal) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_koreksi", "desc")
                    ->first();
                $last_kode = $lastkoreksi ? $lastkoreksi->kode_koreksi : '';
                $kode = buatkode($last_kode, "KP" . date('ym', strtotime($dari)), 4);

                $docKoreksiName = null;
                if ($uploadedFile) {
                    $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: 'jpg');
                    $docKoreksiName = $kode . "." . $ext;
                }

                $koreksi = new Koreksi();
                $koreksi->kode_koreksi = $kode;
                $koreksi->nik = $nik;
                $koreksi->tanggal = $dari;
                $koreksi->kode_jam_kerja = $request->input('kode_jam_kerja');
                $koreksi->jam_in = $request->input('jam_in');
                $koreksi->jam_out = $request->input('jam_out');
                $koreksi->keterangan = $keterangan;
                $koreksi->status = 0;
                $koreksi->approval_step = 1;
                $koreksi->id_user = $user->id;
                if ($docKoreksiName && Schema::hasColumn('presensi_koreksi', 'doc_koreksi')) {
                    $koreksi->doc_koreksi = $docKoreksiName;
                }
                $koreksi->save();

                if ($uploadedFile && $docKoreksiName) {
                    $saveFile($uploadedFile, 'koreksi', $docKoreksiName);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Pengajuan izin berhasil disimpan.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pengajuan izin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel/delete a pending permission/leave request.
     */
    public function destroy(Request $request, $kode)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;
        
        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'Profil data karyawan tidak ditemukan'
            ], 404);
        }
        $nik = $karyawan->nik;

        $prefix = substr($kode, 0, 2);
        $record = null;

        if ($prefix === 'IA') {
            $record = Izinabsen::where('kode_izin', $kode)->where('nik', $nik)->first();
        } elseif ($prefix === 'IS') {
            $record = Izinsakit::where('kode_izin_sakit', $kode)->where('nik', $nik)->first();
        } elseif ($prefix === 'IC') {
            $record = Izincuti::where('kode_izin_cuti', $kode)->where('nik', $nik)->first();
        } elseif ($prefix === 'ID') {
            $record = Izindinas::where('kode_izin_dinas', $kode)->where('nik', $nik)->first();
        } elseif ($prefix === 'KP') {
            $record = Koreksi::where('kode_koreksi', $kode)->where('nik', $nik)->first();
        }

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengajuan tidak ditemukan'
            ], 404);
        }

        if ($record->status != 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan yang sudah diproses tidak dapat dibatalkan'
            ], 400);
        }

        if ($prefix === 'IA' && !empty($record->doc_izin)) {
            $path = "uploads/absen/" . $record->doc_izin;
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } elseif ($prefix === 'IS' && !empty($record->doc_sid)) {
            $path = "uploads/sid/" . $record->doc_sid;
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } elseif ($prefix === 'IC' && !empty($record->doc_cuti)) {
            $path = "uploads/cuti/" . $record->doc_cuti;
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } elseif ($prefix === 'ID' && !empty($record->doc_dinas)) {
            $path = "uploads/dinas/" . $record->doc_dinas;
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } elseif ($prefix === 'KP' && !empty($record->doc_koreksi)) {
            $path = "uploads/koreksi/" . $record->doc_koreksi;
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan berhasil dibatalkan.'
        ]);
    }
}
