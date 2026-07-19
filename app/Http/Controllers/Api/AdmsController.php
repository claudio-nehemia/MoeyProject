<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Karyawan;
use App\Models\Presensi;
use App\Models\Pengaturanumum;
use App\Models\Jamkerja;
use App\Models\Setjamkerjabydate;
use App\Models\Setjamkerjabyday;
use App\Models\Detailsetjamkerjabydept;
use App\Models\GlobalJamkerja;
use App\Models\MesinFingerprint;
use App\Models\LogMesinPresensi;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AdmsController extends Controller
{
    // Capture from Fingerspot JSON Format
    public function capture(Request $request, $any = null)
    {
        $devId = $request->header('dev-id') ??
            $request->header('dev_id') ??
            $request->header('X-Dev-Id') ??
            $_SERVER['HTTP_DEV_ID'] ??
            $_SERVER['DEV_ID'] ??
            $request->query('sn') ??
            '';

        $rawBody = $request->getContent();
        Log::debug('FULL REQUEST', [
            'method' => request()->method(),
            'url' => request()->fullUrl(),
            'query' => request()->query(),
            'headers' => request()->headers->all(),
            'body' => request()->getContent(),
        ]);
        Log::debug('devid: ' . $devId);

        $jsonStart = strpos($rawBody, '{');
        $jsonEnd = strrpos($rawBody, '}');
        $jsonData = [];
        if ($jsonStart !== false && $jsonEnd !== false) {
            $jsonString = substr($rawBody, $jsonStart, $jsonEnd - $jsonStart + 1);
            $jsonData = json_decode($jsonString, true) ?? [];
        }

        $mesin = MesinFingerprint::where('sn', $devId)->where('status', 'Aktif')->first();
        if (!$mesin) {
            $mesin = MesinFingerprint::where('status', 'Aktif')->first();
        }

        if (!$mesin) {
            Log::warning('No active machine found in database to process data', [
                'sn' => $devId,
                'ip' => $request->ip(),
                'path' => $request->path()
            ]);

            return response("OK", 200)
                ->header('Content-Type', 'application/octet-stream; charset=utf-8')
                ->header('response_code', 'OK')
                ->header('Connection', 'close');
        }

        if (empty($jsonData)) {
            return response("OK", 200)
                ->header('Content-Type', 'application/octet-stream; charset=utf-8')
                ->header('response_code', 'OK')
                ->header('Connection', 'close');
        }

        try {
            if (isset($jsonData['user_id']) && isset($jsonData['io_time'])) {
                if ($mesin) {
                    $io_time_str = $jsonData['io_time'];
                    $scan = (strlen($io_time_str) == 14)
                        ? substr($io_time_str, 0, 4) . '-' . substr($io_time_str, 4, 2) . '-' . substr($io_time_str, 6, 2) . ' ' . substr($io_time_str, 8, 2) . ':' . substr($io_time_str, 10, 2) . ':' . substr($io_time_str, 12, 2)
                        : date('Y-m-d H:i:s');

                    $io_mode = $jsonData['io_mode'] ?? 0;
                    $status = ($io_mode >= 16777216) ? ($io_mode / 16777216) - 1 : ($jsonData['status_scan'] ?? 0);

                    $this->processAttendance($jsonData['user_id'], $scan, $status, $mesin);
                }
            }
        } catch (\Exception $e) {
            Log::error('ADMS CAPTURE ERROR: ' . $e->getMessage());
        }

        $transId = $request->header('trans-id') ?? $request->header('trans_id') ?? 'undefined';
        $cmdCode = $request->header('cmd-code') ?? $request->header('cmd_code') ?? 'undefined';
        $blkNo = $request->header('blk-no') ?? $request->header('blk_no');
        $blkLen = $request->header('blk-len') ?? $request->header('blk_len');

        header('Content-Type: application/octet-stream; charset=utf-8');
        header('response_code: OK');
        header('trans_id: ' . $transId);
        header('cmd_code: ' . $cmdCode);
        header('Connection: close');

        if ($blkNo !== null) {
            header('blk_no: ' . $blkNo);
        }
        if ($blkLen !== null) {
            header('blk_len: ' . $blkLen);
        }

        echo "OK";
        exit;
    }

    // Receive from X100c Plain Text ATTLOG Format
    public function receiveX100c(Request $request)
    {
        $dateForX100c = now()->timezone('UTC')->subHour()->format('D, d M Y H:i:s') . ' GMT';
        $devId = $request->query('SN', '');
        if ($request->isMethod('GET')) {
            return response("OK\n", 200)
                ->header('Content-Type', 'text/plain')
                ->header('Date', $dateForX100c);
        }

        $rawBody = $request->getContent();
        $mesin = MesinFingerprint::where('sn', $devId)->where('status', 'Aktif')->first();
        if (!$mesin) {
            Log::warning('Unregistered X100C machine attempted to send data', [
                'sn' => $devId,
                'ip' => $request->ip()
            ]);
            return response("OK\n", 200)
                ->header('Content-Type', 'text/plain')
                ->header('Date', $dateForX100c);
        }

        try {
            $lines = explode("\n", $rawBody);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, 'OPLOG'))
                    continue;

                $parts = explode("\t", $line);
                if (count($parts) >= 3) {
                    $pin = $parts[0];
                    $scan = $parts[1];
                    $status = (int) $parts[2];

                    if (!strtotime($scan)) {
                        continue;
                    }

                    $this->processAttendance($pin, $scan, $status, $mesin);
                }
            }
        } catch (\Exception $e) {
            Log::error('X100C DATA PROCESS ERROR: ' . $e->getMessage());
        }

        return response("OK\n", 200)
            ->header('Content-Type', 'text/plain')
            ->header('Date', $dateForX100c);
    }

    // Receive from ZKTeco Standard Format
    public function receiveZktecoStandard(Request $request)
    {
        $devId = $request->query('SN', '');
        if ($request->isMethod('GET')) {
            return response("OK\n", 200)->header('Content-Type', 'text/plain');
        }

        $rawBody = $request->getContent();
        $mesin = MesinFingerprint::where('sn', $devId)->where('status', 'Aktif')->first();
        if (!$mesin) {
            Log::warning('Unregistered ZKTeco machine attempted to send data', [
                'sn' => $devId,
                'ip' => $request->ip()
            ]);
            return response("OK\n", 200)->header('Content-Type', 'text/plain');
        }

        try {
            $lines = explode("\n", $rawBody);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, 'OPLOG'))
                    continue;

                $parts = explode("\t", $line);
                if (count($parts) >= 3) {
                    $pin = $parts[0];
                    $scan = $parts[1];
                    $status = (int) $parts[2];

                    if (!strtotime($scan)) {
                        continue;
                    }

                    $this->processAttendance($pin, $scan, $status, $mesin);
                }
            }
        } catch (\Exception $e) {
            Log::error('ZKTECO STANDARD DATA PROCESS ERROR: ' . $e->getMessage());
        }

        return response("OK\n", 200)->header('Content-Type', 'text/plain');
    }

    // Core Logic
    private function processAttendance($pin, $scan, $normalized_status, $mesin)
    {
        Log::info('MASUK KE PROCESS ATTENDANCE', ['pin' => $pin, 'scan' => $scan, 'normalized_status' => $normalized_status]);
        $karyawan = Karyawan::where('pin', $pin)->first();

        if ($karyawan != null) {
            Log::info('KARYAWAN DITEMUKAN', ['nik' => $karyawan->nik]);
            $generalsetting = Pengaturanumum::where('id', 1)->first();
            $tanggal_sekarang = date("Y-m-d", strtotime($scan));
            $jam_sekarang = date("H:i", strtotime($scan));
            $tanggal_kemarin = date("Y-m-d", strtotime("-1 days", strtotime($tanggal_sekarang)));
            $tanggal_besok = date("Y-m-d", strtotime("+1 days", strtotime($tanggal_sekarang)));

            // Cek Presensi Kemarin
            $presensi_kemarin = Presensi::where('nik', $karyawan->nik)
                ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('presensi.tanggal', $tanggal_kemarin)->first();

            $lintas_hari = $presensi_kemarin ? $presensi_kemarin->lintashari : 0;
            $batas_presensi_lintashari = ($presensi_kemarin && $presensi_kemarin->batas_presensi_pulang)
                ? $presensi_kemarin->batas_presensi_pulang
                : ($generalsetting->batas_presensi_lintashari ?? '08:00');

            $tanggal_presensi = $tanggal_sekarang;
            if ($presensi_kemarin && $presensi_kemarin->lintashari == 1 && $presensi_kemarin->jam_out == null) {
                if ($jam_sekarang < $batas_presensi_lintashari) {
                    $tanggal_presensi = $tanggal_kemarin;
                }
            }

            $namahari = getnamaHari(date('D', strtotime($tanggal_presensi)));

            // 1) Cek Jam Kerja By Date
            $jamkerja = Setjamkerjabydate::join('presensi_jamkerja', 'presensi_jamkerja_bydate.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('nik', $karyawan->nik)
                ->where('tanggal', $tanggal_presensi)
                ->first();

            // 1.5) Cek Approved Ajuan Jadwal (Defensive)
            if ($jamkerja == null && Schema::hasTable('ajuan_jadwal')) {
                $ajuan = DB::table('ajuan_jadwal')
                    ->join('presensi_jamkerja', 'ajuan_jadwal.kode_jam_kerja_tujuan', '=', 'presensi_jamkerja.kode_jam_kerja')
                    ->where('nik', $karyawan->nik)
                    ->where('tanggal', $tanggal_presensi)
                    ->where('status', 'a')
                    ->first();
                if ($ajuan) {
                    $jamkerja = $ajuan;
                }
            }

            // 1.8) Cek Grup (Defensive)
            if ($jamkerja == null && Schema::hasTable('grup_detail') && Schema::hasTable('grup_jamkerja_bydate')) {
                $cek_group = DB::table('grup_detail')->where('nik', $karyawan->nik)->first();
                if ($cek_group) {
                    $jamkerja = DB::table('grup_jamkerja_bydate')
                        ->where('kode_grup', $cek_group->kode_grup)
                        ->where('tanggal', $tanggal_presensi)
                        ->join('presensi_jamkerja', 'grup_jamkerja_bydate.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                        ->first();
                }
            }

            // 2) Cek Jam Kerja By Day
            if ($jamkerja == null) {
                $jamkerja = Setjamkerjabyday::join('presensi_jamkerja', 'presensi_jamkerja_byday.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                    ->where('nik', $karyawan->nik)->where('hari', $namahari)->first();
            }

            // 3) Cek Jam Kerja By Dept
            if ($jamkerja == null) {
                $jamkerja = Detailsetjamkerjabydept::join('presensi_jamkerja_bydept', 'presensi_jamkerja_bydept_detail.kode_jk_dept', '=', 'presensi_jamkerja_bydept.kode_jk_dept')
                    ->join('presensi_jamkerja', 'presensi_jamkerja_bydept_detail.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                    ->where('kode_dept', $karyawan->kode_dept)
                    ->where('kode_cabang', $karyawan->kode_cabang)
                    ->where('hari', $namahari)->first();
            }

            // 4) Fallback: Cek Jadwal Kerja Global
            if ($jamkerja == null) {
                if ($generalsetting && $generalsetting->global_jamkerja_aktif) {
                    $globalJk = GlobalJamkerja::where('hari', $namahari)->first();
                    if ($globalJk && $globalJk->kode_jam_kerja) {
                        $jamkerja = Jamkerja::where('kode_jam_kerja', $globalJk->kode_jam_kerja)->first();
                    }
                }
            }

            // 5) Fallback Utama: Karyawan Default Jam Kerja (kode_jadwal)
            if ($jamkerja == null) {
                if ($karyawan->kode_jadwal) {
                    $jamkerja = Jamkerja::where('kode_jam_kerja', $karyawan->kode_jadwal)->first();
                }
            }

            Log::info('Status jamkerja', ['is_null' => $jamkerja == null]);

            if ($jamkerja != null) {
                $kode_jam_kerja = $jamkerja->kode_jam_kerja;
                Log::info('Jam kerja ditemukan', ['kode' => $kode_jam_kerja]);
                $jam_kerja = Jamkerja::where('kode_jam_kerja', $kode_jam_kerja)->first();
                $jam_presensi = $tanggal_sekarang . " " . $jam_sekarang;

                $presensi_hariini = Presensi::where('nik', $karyawan->nik)
                    ->where('tanggal', $tanggal_presensi)
                    ->first();

                Log::info('Presensi hari ini', ['is_null' => $presensi_hariini == null]);
                $is_even = ($normalized_status % 2 == 0);

                // Auto-Pulang logic (anti-spam)
                if ($is_even && $presensi_hariini != null && $presensi_hariini->jam_in != null) {
                    $jam_in_time = strtotime($presensi_hariini->jam_in);
                    $scan_time = strtotime($scan);

                    if (($scan_time - $jam_in_time) > 1800) {
                        $is_even = false;
                    } else {
                        Log::info('Abaikan scan berulang (SPAM IN)', ['pin' => $pin, 'time' => $scan]);
                        $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Spam Scan IN (Abaikan scan berulang)');
                        return;
                    }
                }

                $batas_jam_absen = ($generalsetting->batas_jam_absen ?? 0) * 60;
                $batas_jam_absen_pulang = ($generalsetting->batas_jam_absen_pulang ?? 0) * 60;

                $jam_masuk_string = $tanggal_presensi . " " . $jam_kerja->jam_masuk;
                $jam_masuk_carbon = Carbon::parse($jam_masuk_string);
                $jam_mulai_masuk_carbon = $jam_masuk_carbon->copy()->subMinutes($batas_jam_absen);
                $jam_akhir_masuk_carbon = $jam_masuk_carbon->copy()->addMinutes($batas_jam_absen);

                if ($jam_akhir_masuk_carbon->format('H:i') >= '00:00' && $jam_akhir_masuk_carbon->day != $jam_masuk_carbon->day) {
                    $jam_akhir_masuk_carbon = Carbon::parse($jam_akhir_masuk_carbon->format('Y-m-d H:i'));
                }

                $tanggal_pulang = $jam_kerja->lintashari == 1 ? $tanggal_besok : $tanggal_sekarang;
                $jam_kerja_pulang = $jam_kerja->jam_pulang;

                if ($presensi_kemarin && $presensi_kemarin->lintashari == 1 && $presensi_kemarin->jam_out == null) {
                    if ($jam_sekarang < $batas_presensi_lintashari) {
                        $tanggal_pulang = $tanggal_sekarang;
                        $jam_kerja_pulang = $presensi_kemarin->jam_pulang;
                    }
                }

                $jam_pulang_string = $tanggal_pulang . " " . $jam_kerja_pulang;
                $jam_pulang_carbon = Carbon::parse($jam_pulang_string);
                $jam_mulai_pulang_carbon = $jam_pulang_carbon->copy()->subMinutes($batas_jam_absen_pulang);

                $jam_presensi_carbon = Carbon::parse($jam_presensi);

                if ($generalsetting && $generalsetting->batasi_absen == 1) {
                    if ($is_even) {
                        if ($jam_presensi_carbon->lt($jam_mulai_masuk_carbon)) {
                            Log::info('Tolak Masuk: Terlalu pagi', ['pin' => $pin]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Masuk ditolak: Belum waktunya absen masuk');
                            return;
                        }
                        if ($jam_presensi_carbon->gt($jam_akhir_masuk_carbon)) {
                            Log::info('Tolak Masuk: Lewat batas', ['pin' => $pin]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Masuk ditolak: Waktu absen masuk sudah habis');
                            return;
                        }
                    } else {
                        if ($jam_presensi_carbon->lt($jam_mulai_pulang_carbon)) {
                            Log::info('Tolak Pulang: Belum waktunya', ['pin' => $pin]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Pulang ditolak: Belum waktunya absen pulang');
                            return;
                        }
                    }
                }

                Log::info('Mulai insert/update', ['is_even' => $is_even]);

                if ($is_even) {
                    // ABSEN MASUK
                    if ($presensi_hariini == null || $presensi_hariini->jam_in == null) {
                        Log::info('Mencoba simpan masuk');
                        try {
                            if ($presensi_hariini != null) {
                                Presensi::where('id', $presensi_hariini->id)->update([
                                    'jam_in' => $jam_presensi,
                                    'lokasi_in' => $mesin->titik_koordinat ?? 'Fingerprint ADMS',
                                    'id_mesin' => $mesin->id,
                                ]);
                                Log::info('Berhasil update masuk');
                                $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 1, 'Berhasil update absen masuk');
                            } else {
                                Presensi::create([
                                    'nik' => $karyawan->nik,
                                    'tanggal' => $tanggal_presensi,
                                    'jam_in' => $jam_presensi,
                                    'jam_out' => null,
                                    'lokasi_in' => $mesin->titik_koordinat ?? 'Fingerprint ADMS',
                                    'lokasi_out' => null,
                                    'foto_in' => null,
                                    'foto_out' => null,
                                    'id_mesin' => $mesin->id,
                                    'kode_jam_kerja' => $kode_jam_kerja,
                                    'status' => 'h'
                                ]);
                                Log::info('Berhasil create masuk');
                                $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 1, 'Berhasil buat absen masuk baru');
                            }

                            // Send WA
                            if (($karyawan->no_hp != null && $karyawan->no_hp != "") && ($generalsetting && $generalsetting->notifikasi_wa == 1)) {
                                try {
                                    $message = "Terimakasih, Hari ini " . $karyawan->nama_karyawan . " absen masuk (Fingerprint) pada " . $jam_presensi . " Semangat Bekerja";
                                    dispatch(new \App\Jobs\SendWaMessage($karyawan->no_hp, $message));
                                    Log::info('WA masuk queued');
                                } catch (\Exception $waException) {
                                    Log::error('WA Error', ['nik' => $karyawan->nik, 'error' => $waException->getMessage()]);
                                }
                            }
                        } catch (\Throwable $e) {
                            Log::error('Gagal simpan absen masuk ADMS', ['nik' => $karyawan->nik, 'error' => $e->getMessage()]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Gagal simpan absen masuk: ' . $e->getMessage());
                        }
                    }
                } else {
                    // ABSEN PULANG
                    try {
                        if ($presensi_hariini != null) {
                            Presensi::where('id', $presensi_hariini->id)->update([
                                'jam_out' => $jam_presensi,
                                'lokasi_out' => $mesin->titik_koordinat ?? 'Fingerprint ADMS',
                                'id_mesin' => $mesin->id,
                            ]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 1, 'Berhasil update absen pulang');
                        } else {
                            Presensi::create([
                                'nik' => $karyawan->nik,
                                'tanggal' => $tanggal_presensi,
                                'jam_in' => null,
                                'jam_out' => $jam_presensi,
                                'lokasi_in' => null,
                                'lokasi_out' => $mesin->titik_koordinat ?? 'Fingerprint ADMS',
                                'foto_in' => null,
                                'foto_out' => null,
                                'id_mesin' => $mesin->id,
                                'kode_jam_kerja' => $kode_jam_kerja,
                                'status' => 'h'
                            ]);
                            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 1, 'Berhasil buat absen pulang baru');
                        }

                        // Send WA
                        if (($karyawan->no_hp != null && $karyawan->no_hp != "") && ($generalsetting && $generalsetting->notifikasi_wa == 1)) {
                            if ($presensi_hariini == null || $presensi_hariini->jam_out == null) {
                                try {
                                    $message = "Terimakasih, Hari ini " . $karyawan->nama_karyawan . " absen Pulang (Fingerprint) pada " . $jam_presensi . " Hati-hati di Jalan";
                                    dispatch(new \App\Jobs\SendWaMessage($karyawan->no_hp, $message));
                                } catch (\Exception $waException) {
                                    Log::error('WA Error', ['nik' => $karyawan->nik, 'error' => $waException->getMessage()]);
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('Gagal simpan absen pulang ADMS', ['nik' => $karyawan->nik, 'error' => $e->getMessage()]);
                        $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Gagal simpan absen pulang: ' . $e->getMessage());
                    }
                }
            } else {
                $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Jam kerja karyawan tidak ditemukan');
            }
        } else {
            Log::info('Karyawan ADMS Fingerprint Tidak Ditemukan', ['pin' => $pin]);
            $this->recordLogMesin($pin, $scan, $normalized_status, $mesin ? $mesin->id : null, 0, 'Karyawan tidak ditemukan');
        }
    }

    private function recordLogMesin($pin, $scan, $status_scan, $id_mesin, $status, $keterangan)
    {
        try {
            LogMesinPresensi::create([
                'pin' => $pin,
                'status_scan' => $status_scan,
                'jam_absen' => $scan,
                'id_mesin' => $id_mesin,
                'status' => $status,
                'keterangan' => $keterangan,
            ]);
        } catch (\Exception $ex) {
            Log::error('Gagal mencatat log mesin presensi', ['error' => $ex->getMessage()]);
        }
    }

    // Raw debug utility
    public function rawDump(Request $request)
    {
        $data = [
            'time' => now()->toDateTimeString(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'headers_laravel' => $request->headers->all(),
            'apache_headers' => function_exists('apache_request_headers') ? apache_request_headers() : 'N/A',
            'server_vars' => $_SERVER,
            'query_string' => $request->query(),
            'body_raw' => $request->getContent(),
            'body_base64' => base64_encode($request->getContent()),
        ];

        $rawBody = $request->getContent();
        $jsonStart = strpos($rawBody, '{');
        $jsonEnd = strrpos($rawBody, '}');
        if ($jsonStart !== false && $jsonEnd !== false) {
            $jsonString = substr($rawBody, $jsonStart, $jsonEnd - $jsonStart + 1);
            $data['body_parsed_json'] = json_decode($jsonString, true);
        }

        Log::build([
            'driver' => 'single',
            'path' => storage_path('logs/raw-dump.log'),
        ])->info('RAW DUMP FROM MACHINE', $data);

        return response("OK", 200)
            ->header('Content-Type', 'application/octet-stream; charset=utf-8')
            ->header('response_code', 'OK')
            ->header('Connection', 'close');
    }
}
