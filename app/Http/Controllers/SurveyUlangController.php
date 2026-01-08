<?php

namespace App\Http\Controllers;

use App\Models\GambarKerja;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\SurveyUlang;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class SurveyUlangController extends Controller
{
    // 📌 Halaman Index
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== SURVEY ULANG INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));
        
        $surveys = Order::with(['surveyUlang', 'jenisInterior'])
            ->visibleToSurveyUser($user)
            ->where(function ($q) {
                $q->whereRaw("LOWER(tahapan_proyek) = 'survey_ulang'");
            })
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($o) {

                // Determine status based on survey ulang progress
                $status = 'pending'; // Belum response sama sekali

                if ($o->surveyUlang) {
                    // Check if survey details have been filled (survey_time exists)
                    if ($o->surveyUlang->survey_time) {
                        $status = 'done'; // Sudah lengkap input detail
                    } else {
                        $status = 'waiting_input'; // Sudah response, belum input detail
                    }
                }

                return [
                    'id' => $o->id,
                    'nama_project' => $o->nama_project,
                    'company_name' => $o->company_name,
                    'customer_name' => $o->customer_name,
                    'jenis_interior' => optional($o->jenisInterior)->nama_interior ?? "-",
                    'payment_status' => $o->payment_status,
                    'tahapan_proyek' => $o->tahapan_proyek,
                    'tanggal_survey_ulang' => $o->tanggal_survey,
                    'status_survey_ulang' => $status,
                    'survey_ulang_id' => $o->surveyUlang?->id,
                    'response_by' => $o->surveyUlang?->response_by,
                    'response_time' => $o->surveyUlang?->response_time?->toIso8601String(),
                    'pm_response_by' => $o->surveyUlang?->pm_response_by,
                    'pm_response_time' => $o->surveyUlang?->pm_response_time?->toIso8601String(),
                ];
            });

        return Inertia::render('SurveyUlang/Index', [
            'surveys' => $surveys,
        ]);
    }

    // 📌 Mark order jadi "in_progress"
    public function start(Order $order)
    {
        $order->update([
            'tahapan_proyek' => 'survey_ulang',
        ]);

        return back()->with('success', 'Survey ulang dimulai.');
    }

    // 📌 Response notification - Create empty record
    public function response(Order $order)
    {
        // Check if survey ulang already exists
        if ($order->surveyUlang) {
            return back()->with('info', 'Survey ulang request sudah diterima sebelumnya.');
        }

        // Create empty survey ulang record with ONLY response info
        // User will fill in details (catatan, foto, temuan, survey_time) later via store
        SurveyUlang::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'System',
        ]);

        $order->update(['tahapan_proyek' => 'survey_ulang']);

        return back()->with('success', 'Permintaan survey ulang berhasil diterima. Silakan input hasil survey.');
    }


    // 📌 Halaman Form Create
    public function create(Order $order)
    {
        return Inertia::render('SurveyUlang/Create', [
            'order' => $order,
        ]);
    }

    // 📌 Store hasil survey ulang
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'catatan' => 'nullable|string',
            'temuan' => 'nullable|array',
            'foto.*' => 'nullable|image',
        ]);

        $fotoPaths = [];
        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $fotoPaths[] = $file->store('survey_ulang', 'public');
            }
        }

        // UPDATE existing survey ulang (yang sudah dibuat saat response)
        // Bukan create baru!
        $surveyUlang = $order->surveyUlang;
        
        if (!$surveyUlang) {
            return back()->with('error', 'Survey ulang belum di-response. Silakan klik tombol Response terlebih dahulu.');
        }

        $surveyUlang->update([
            'catatan' => $validated['catatan'] ?? null,
            'temuan' => $validated['temuan'] ?? [],
            'foto' => $fotoPaths,
            'survey_time' => now(),
            'survey_by' => auth()->user()->name ?? 'System',
        ]);

        // Create gambar kerja if not exists
        if (!$order->gambarKerja) {
            GambarKerja::create([
                'order_id' => $order->id,
                'status' => 'pending',
            ]);
        }

        // update tahapan utama
        $order->update([
            'tahapan_proyek' => 'survey_ulang', // tetap di survey ulang sampai user lanjut
        ]);

        // Kirim notifikasi gambar kerja request
        $notificationService = new NotificationService();
        $notificationService->sendGambarKerjaRequestNotification($order);

        return redirect()->route('survey-ulang.index')->with('success', 'Survey ulang berhasil disimpan. Notifikasi gambar kerja telah dikirim.');
    }

    // 📌 Halaman Show
    public function show(SurveyUlang $surveyUlang)
    {
        return Inertia::render('SurveyUlang/Show', [
            'survey' => $surveyUlang->load('order'),
        ]);
    }

    // 📌 Halaman Edit
    public function edit(SurveyUlang $surveyUlang)
    {
        return Inertia::render('SurveyUlang/Edit', [
            'survey' => $surveyUlang->load('order'),
        ]);
    }

    // 📌 Update
    public function update(Request $request, SurveyUlang $surveyUlang)
    {
        $validated = $request->validate([
            'catatan' => 'nullable|string',
            'temuan' => 'nullable|array',
            'foto.*' => 'nullable|image',
            'foto_lama' => 'nullable',
        ]);

        $fotoLama = json_decode($request->foto_lama, true) ?? [];

        $fotoPaths = $fotoLama;

        // append new photos
        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $fotoPaths[] = $file->store('survey_ulang', 'public');
            }
        }

        $surveyUlang->update([
            'catatan' => $validated['catatan'],
            'temuan' => $validated['temuan'],
            'foto' => $fotoPaths,
        ]);


        return redirect()->route('survey-ulang.index')->with('success', 'Survey ulang berhasil diperbarui.');
    }
}
