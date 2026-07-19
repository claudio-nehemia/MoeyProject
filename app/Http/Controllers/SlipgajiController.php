<?php

namespace App\Http\Controllers;

use App\Models\Slipgaji;
use App\Models\SlipgajiHarian;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SlipgajiController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $slipgaji = Slipgaji::orderBy('tahun', 'desc')->orderBy('bulan', 'desc')->get();

        $queryHarian = SlipgajiHarian::withCount('detail');
        if ($request->filled('tahun_harian')) {
            $queryHarian->whereYear('tanggal_slip', $request->tahun_harian);
        }
        $slipgaji_harian = $queryHarian->orderBy('tanggal_slip', 'desc')->get();

        $list_bulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        return Inertia::render('Slipgaji/Index', [
            'slipgajis' => $slipgaji,
            'slipgaji_harian' => $slipgaji_harian,
            'list_bulan' => $list_bulan,
            'tahun_harian' => $request->tahun_harian
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer',
            'status' => 'required|in:0,1',
            'jenis_upah' => 'required|in:Bulanan,Harian'
        ]);

        $bulan_pad = str_pad($request->bulan, 2, '0', STR_PAD_LEFT);
        $kode_slip_gaji = 'GJ' . $bulan_pad . $request->tahun;

        try {
            $cek = Slipgaji::where('kode_slip_gaji', $kode_slip_gaji)->first();
            if ($cek) {
                return redirect()->back()->with('error', 'Slip gaji untuk periode ini sudah ada.');
            }

            $slipgaji = Slipgaji::create([
                'kode_slip_gaji' => $kode_slip_gaji,
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
                'status' => $request->status,
                'jenis_upah' => $request->jenis_upah
            ]);

            if ($request->status == '1') {
                $this->sendPublishNotification($slipgaji);
            }

            return redirect()->back()->with('success', 'Slip gaji berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan slip gaji: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $kode_slip_gaji)
    {
        $slipgaji = Slipgaji::where('kode_slip_gaji', $kode_slip_gaji)->firstOrFail();

        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer',
            'status' => 'required|in:0,1',
            'jenis_upah' => 'required|in:Bulanan,Harian'
        ]);

        try {
            $oldStatus = $slipgaji->status;

            $slipgaji->update([
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
                'status' => $request->status,
                'jenis_upah' => $request->jenis_upah
            ]);

            if ($oldStatus != '1' && $request->status == '1') {
                $this->sendPublishNotification($slipgaji);
            }

            return redirect()->back()->with('success', 'Slip gaji berhasil diubah.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengubah slip gaji: ' . $e->getMessage());
        }
    }

    public function destroy($kode_slip_gaji)
    {
        try {
            Slipgaji::where('kode_slip_gaji', $kode_slip_gaji)->delete();
            return redirect()->back()->with('success', 'Slip gaji berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus slip gaji: ' . $e->getMessage());
        }
    }

    private function sendPublishNotification($slipgaji)
    {
        try {
            // Notification class check or safe fallback
            if (class_exists(\App\Notifications\SlipgajiNotification::class)) {
                $users = User::all(); // safe general fallback
                if ($users->isNotEmpty()) {
                    \Illuminate\Support\Facades\Notification::send($users, new \App\Notifications\SlipgajiNotification($slipgaji));
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal mengirim notifikasi slip gaji: ' . $e->getMessage());
        }
    }
}
