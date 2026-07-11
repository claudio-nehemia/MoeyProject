<?php

namespace App\Http\Controllers;

use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class PresensiKaryawanController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $search = $request->input('search');

        $query = Presensi::query()
            ->join('karyawan', 'presensi.nik', '=', 'karyawan.nik')
            ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->select(
                'presensi.*',
                'karyawan.nama_karyawan',
                'presensi_jamkerja.nama_jam_kerja',
                'presensi_jamkerja.jam_masuk as jk_jam_masuk',
                'presensi_jamkerja.jam_pulang as jk_jam_pulang'
            )
            ->whereBetween('presensi.tanggal', [$startDate, $endDate]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('karyawan.nama_karyawan', 'like', '%' . $search . '%')
                  ->orWhere('presensi.nik', 'like', '%' . $search . '%');
            });
        }

        $presensiData = $query->orderBy('presensi.tanggal', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Presensi/Index', [
            'presensiData' => $presensiData,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search,
            ]
        ]);
    }

    public function exportExcel(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        $search = $request->input('search');

        $query = Presensi::query()
            ->join('karyawan', 'presensi.nik', '=', 'karyawan.nik')
            ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
            ->select(
                'presensi.tanggal',
                'presensi.nik',
                'karyawan.nama_karyawan',
                'presensi_jamkerja.nama_jam_kerja',
                'presensi.jam_in',
                'presensi.jam_out',
                'presensi.status'
            )
            ->whereBetween('presensi.tanggal', [$startDate, $endDate]);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('karyawan.nama_karyawan', 'like', '%' . $search . '%')
                  ->orWhere('presensi.nik', 'like', '%' . $search . '%');
            });
        }

        $records = $query->orderBy('presensi.tanggal', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="Laporan_Presensi_' . $startDate . '_to_' . $endDate . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($records) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fputs($file, "\xEF\xBB\xBF");
            
            // CSV Headers
            fputcsv($file, ['Tanggal', 'NIK', 'Nama Karyawan', 'Shift/Jam Kerja', 'Jam Masuk (Check-In)', 'Jam Pulang (Check-Out)', 'Status Kehadiran']);

            foreach ($records as $row) {
                $statusText = '';
                if ($row->status === 'h') {
                    $statusText = 'Hadir';
                } elseif ($row->status === 'a') {
                    $statusText = 'Alpha (Mangkir)';
                } elseif ($row->status === 'i') {
                    $statusText = 'Izin';
                } elseif ($row->status === 's') {
                    $statusText = 'Sakit';
                } elseif ($row->status === 'c') {
                    $statusText = 'Cuti';
                } elseif ($row->status === 'd') {
                    $statusText = 'Dinas';
                } else {
                    $statusText = $row->status;
                }

                fputcsv($file, [
                    $row->tanggal,
                    $row->nik,
                    $row->nama_karyawan,
                    $row->nama_jam_kerja,
                    $row->jam_in ?? '-',
                    $row->jam_out ?? '-',
                    $statusText
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
