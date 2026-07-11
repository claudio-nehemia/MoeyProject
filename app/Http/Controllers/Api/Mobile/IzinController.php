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

        $izinabsen = DB::table('presensi_izinabsen')->where('nik', $nik)
            ->select('kode_izin as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'i' as ket"), 'status', 'approval_step', DB::raw('NULL as doc_sid'));

        $izinsakit = DB::table('presensi_izinsakit')->where('nik', $nik)
            ->select('kode_izin_sakit as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'s' as ket"), 'status', 'approval_step', 'doc_sid');

        $izincuti = DB::table('presensi_izincuti')->where('nik', $nik)
            ->select('kode_izin_cuti as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'c' as ket"), 'status', 'approval_step', DB::raw('NULL as doc_sid'));

        $izin_dinas = DB::table('presensi_izindinas')->where('nik', $nik)
            ->select('kode_izin_dinas as kode', 'tanggal', 'keterangan', 'dari', 'sampai', DB::raw("'d' as ket"), 'status', 'approval_step', DB::raw('NULL as doc_sid'));

        // Koreksi
        $koreksi = DB::table('presensi_koreksi')->where('nik', $nik)
            ->select('kode_koreksi as kode', 'tanggal', 'keterangan', 'tanggal as dari', 'tanggal as sampai', DB::raw("'k' as ket"), 'status', 'approval_step', DB::raw('NULL as doc_sid'));

        $pengajuan_izin = $izinabsen->union($izinsakit)->union($izincuti)->union($izin_dinas)->union($koreksi)
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(function ($item) {
                if ($item->doc_sid) {
                    $item->doc_sid_url = asset('storage/uploads/sid/' . $item->doc_sid);
                } else {
                    $item->doc_sid_url = null;
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
            'sid' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:10240', // for sickness
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

                $izin = new Izinabsen();
                $izin->kode_izin = $kode;
                $izin->nik = $nik;
                $izin->tanggal = $dari;
                $izin->dari = $dari;
                $izin->sampai = $sampai;
                $izin->keterangan = $keterangan;
                $izin->status = 0;
                $izin->approval_step = 1;
                $izin->save();

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
                if ($request->hasfile('sid')) {
                    $sid_name = $kode . ".jpg";
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

                if ($request->hasfile('sid') && $sid_name) {
                    $destination_sid_path = "uploads/sid";
                    $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
                    $image = $manager->read($request->file('sid'));
                    $encodedImage = (string) $image->toJpeg(75);
                    Storage::disk('public')->put($destination_sid_path . "/" . $sid_name, $encodedImage);
                }

            } elseif ($jenis == 'c') {
                // Izin Cuti
                $lastizincuti = Izincuti::select('kode_izin_cuti')
                    ->whereRaw("EXTRACT(YEAR FROM dari) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM dari) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin_cuti", "desc")
                    ->first();
                $last_kode = $lastizincuti ? $lastizincuti->kode_izin_cuti : '';
                $kode = buatkode($last_kode, "IC" . date('ym', strtotime($dari)), 4);

                $cuti = new Izincuti();
                $cuti->kode_izin_cuti = $kode;
                $cuti->nik = $nik;
                $cuti->tanggal = $dari;
                $cuti->dari = $dari;
                $cuti->sampai = $sampai;
                $cuti->kode_cuti = $request->input('kode_cuti', 'C01'); // default to C01 if not provided
                $cuti->keterangan = $keterangan;
                $cuti->status = 0;
                $cuti->approval_step = 1;
                $cuti->id_user = $user->id;
                $cuti->save();

            } elseif ($jenis == 'd') {
                // Izin Dinas
                $lastizindinas = Izindinas::select('kode_izin_dinas')
                    ->whereRaw("EXTRACT(YEAR FROM dari) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM dari) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_izin_dinas", "desc")
                    ->first();
                $last_kode = $lastizindinas ? $lastizindinas->kode_izin_dinas : '';
                $kode = buatkode($last_kode, "ID" . date('ym', strtotime($dari)), 4);

                $dinas = new Izindinas();
                $dinas->kode_izin_dinas = $kode;
                $dinas->nik = $nik;
                $dinas->tanggal = $dari;
                $dinas->dari = $dari;
                $dinas->sampai = $sampai;
                $dinas->keterangan = $keterangan;
                $dinas->status = 0;
                $dinas->approval_step = 1;
                $dinas->save();
            } elseif ($jenis == 'k') {
                // Koreksi Absen
                $lastkoreksi = Koreksi::select('kode_koreksi')
                    ->whereRaw("EXTRACT(YEAR FROM tanggal) = ?", [date('Y', strtotime($dari))])
                    ->whereRaw("EXTRACT(MONTH FROM tanggal) = ?", [date('m', strtotime($dari))])
                    ->orderBy("kode_koreksi", "desc")
                    ->first();
                $last_kode = $lastkoreksi ? $lastkoreksi->kode_koreksi : '';
                $kode = buatkode($last_kode, "KP" . date('ym', strtotime($dari)), 4);

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
                $koreksi->save();
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

        if ($prefix === 'IS' && $record->doc_sid) {
            $sid_path = "uploads/sid/" . $record->doc_sid;
            if (Storage::disk('public')->exists($sid_path)) {
                Storage::disk('public')->delete($sid_path);
            }
        }

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan berhasil dibatalkan.'
        ]);
    }
}
