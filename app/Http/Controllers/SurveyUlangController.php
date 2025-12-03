<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SurveyUlang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyUlangController extends Controller
{
    // 📌 Halaman Index
    public function index()
    {
        $surveys = Order::where('tahapan_proyek', 'survey_ulang')
            ->with('surveyUlang')
            ->get()
            ->map(function ($o) {

                return [
                    'id' => $o->id,
                    'nama_project' => $o->nama_project,
                    'company_name' => $o->company_name,
                    'customer_name' => $o->customer_name,
                    'jenis_interior' => optional($o->jenisInterior)->nama ?? "-",
                    'payment_status' => $o->payment_status,
                    'tahapan_proyek' => $o->tahapan_proyek,
                    'tanggal_survey_ulang' => $o->tanggal_survey, // pakai tanggal survey ulang
                    'status_survey_ulang' => $o->surveyUlang ? 'done' : 'pending',
                    'survey_ulang_id' => $o->surveyUlang->id ?? null,
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

        SurveyUlang::create([
            'order_id' => $order->id,
            'catatan' => $validated['catatan'] ?? null,
            'temuan' => $validated['temuan'] ?? [],
            'foto' => $fotoPaths,
            'survey_time' => now(),
            'survey_by' => auth()->user()->name ?? 'System',
        ]);

        // update tahapan utama
        $order->update([
            'tahapan_proyek' => 'gambar_kerja', // setelah survey ulang
        ]);

        return redirect()->route('survey-ulang.index')->with('success', 'Survey ulang berhasil disimpan.');
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
        ]);

        $fotoPaths = $surveyUlang->foto ?? [];

        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $fotoPaths[] = $file->store('survey_ulang', 'public');
            }
        }

        $surveyUlang->update([
            'catatan' => $validated['catatan'] ?? null,
            'temuan' => $validated['temuan'] ?? [],
            'foto' => $fotoPaths,
        ]);

        return redirect()->route('survey-ulang.index')->with('success', 'Survey ulang berhasil diperbarui.');
    }
}
