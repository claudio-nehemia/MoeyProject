<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\SurveyUlang;
use App\Models\GambarKerja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GambarKerjaController extends Controller
{
    /**
     * INDEX
     * Ambil dari survey_ulang dulu
     */
    public function index()
    {
        $orders = Order::with('surveyUlang')
            ->whereHas('surveyUlang') // 🔑 SUMBER DATA AWAL
            ->orderByDesc('id')
            ->get()
            ->map(function ($order) {
                $gambarKerja = GambarKerja::where('order_id', $order->id)->first();

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,

                    'gambar_kerja' => $gambarKerja ? [
                        'id' => $gambarKerja->id,
                        'gambar_kerja' => $gambarKerja->gambar_kerja
                            ? Storage::url($gambarKerja->gambar_kerja)
                            : null,
                        'response_time' => $gambarKerja->response_time,
                        'response_by' => $gambarKerja->response_by,
                        'status' => $gambarKerja->status,
                        'notes' => $gambarKerja->notes,
                    ] : null,
                ];
            });

        return Inertia::render('GambarKerja/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * RESPONSE GAMBAR KERJA
     */
    public function response(Order $order)
    {
        if (!SurveyUlang::where('order_id', $order->id)->exists()) {
            return back()->with('error', 'Survey ulang belum tersedia.');
        }

        if (GambarKerja::where('order_id', $order->id)->exists()) {
            return back()->with('error', 'Gambar kerja sudah di-response.');
        }

        GambarKerja::create([
            'order_id'      => $order->id,
            'status'        => 'pending',
            'response_time' => now(),
            'response_by'   => auth()->user()->name,
        ]);

        // pindah tahap
        $order->update([
            'tahapan_proyek' => 'gambar_kerja',
        ]);

        return back()->with('success', 'Response gambar kerja berhasil.');
    }

    /**
     * UPLOAD GAMBAR KERJA
     */
    public function upload(Request $request, Order $order)
    {
        $request->validate([
            'gambar_kerja' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'notes' => 'nullable|string|max:500',
        ]);

        $gambarKerja = GambarKerja::where('order_id', $order->id)->first();

        if (!$gambarKerja) {
            return back()->with('error', 'Silakan response gambar kerja terlebih dahulu.');
        }

        if ($gambarKerja->gambar_kerja && Storage::disk('public')->exists($gambarKerja->gambar_kerja)) {
            Storage::disk('public')->delete($gambarKerja->gambar_kerja);
        }

        $path = $request->file('gambar_kerja')->store('gambar-kerja', 'public');

        $gambarKerja->update([
            'gambar_kerja' => $path,
            'notes'        => $request->notes,
            'status'       => 'uploaded',
        ]);

        return back()->with('success', 'Gambar kerja berhasil diupload.');
    }
}
