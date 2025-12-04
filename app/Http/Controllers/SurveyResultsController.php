<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use App\Models\SurveyResults;
use App\Models\JenisPengukuran;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SurveyResultsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all orders with survey results relationship
        $surveys = Order::with(['surveyResults', 'jenisInterior', 'users.role'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'jenis_interior' => $order->jenisInterior->nama_interior ?? '-',
                    'tanggal_masuk_customer' => $order->tanggal_masuk_customer,
                    'project_status' => $order->project_status,
                    'has_survey' => $order->surveyResults !== null,
                    'survey_id' => $order->surveyResults->id ?? null,
                    'response_time' => $order->surveyResults->response_time ?? null,
                    'response_by' => $order->surveyResults->response_by ?? null,
                    'feedback' => $order->surveyResults->feedback ?? null,
                    'tanggal_survey' => $order->tanggal_survey,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'payment_status' => $order->payment_status,
                    // New field: is_responded (menandakan sudah klik response)
                    'is_responded' => $order->surveyResults && $order->surveyResults->response_time !== null,
                    // Team members
                    'team' => $order->users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'role' => $user->role->nama_role ?? 'No Role',
                        ];
                    }),
                ];
            });

        return Inertia::render('SurveyResults/Index', [
            'surveys' => $surveys,
        ]);
    }

    /**
     * Mark order as ready for survey (Response button clicked)
     */
    public function markResponse(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        // Check if survey already exists
        if ($order->surveyResults) {
            return back()->with('error', 'Survey already exists for this order.');
        }

        // Create empty survey with response info
        SurveyResults::create([
            'order_id' => $order->id,
            'response_time' => now(),
            'response_by' => auth()->user()->name ?? 'Admin',
        ]);

        $order->update([
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        return back()->with('success', 'Response recorded. You can now create the survey.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $id)
    {
        $order = Order::with(['jenisInterior', 'surveyResults', 'users.role'])->findOrFail($id);
        $jenisPengukuran = JenisPengukuran::all();

        // Check if user has clicked Response button first
        if (!$order->surveyResults) {
            return redirect()->route('survey-results.index')
                ->with('error', 'Please click "Response" button first before creating survey.');
        }

        // Check if survey data already filled
        if ($order->surveyResults->feedback || $order->surveyResults->layout || $order->surveyResults->foto_lokasi) {
            return redirect()->route('survey-results.edit', $order->surveyResults->id)
                ->with('info', 'Survey data already exists. You can edit it.');
        }

        $jenisPengukuran = JenisPengukuran::all();

        return Inertia::render('SurveyResults/Create', [
            'order' => $order,
            'survey' => $order->surveyResults,
            'jenisPengukuran' => $jenisPengukuran, 
            'selectedPengukuranIds' => [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'survey_id' => 'required|exists:survey_results,id',
            'feedback' => 'nullable|string',
            'layout' => 'nullable|file|mimes:pdf,jpg,jpeg,png,dwg,dxf|max:10240',
            'foto_lokasi' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'mom_file' => 'nullable|file|mimes:pdf,doc,docx|max:2048',

            // many-to-many
            'jenis_pengukuran_ids' => 'nullable|array',
            'jenis_pengukuran_ids.*' => 'exists:jenis_pengukuran,id',
        ]);

        $survey = SurveyResults::findOrFail($validated['survey_id']);

        // Simpan pivot IDs, sebelum dihapus
        $jenisPengukuranIds = $validated['jenis_pengukuran_ids'] ?? [];

        // Hapus dari validated agar tidak masuk ke update()
        unset($validated['jenis_pengukuran_ids']);
        unset($validated['survey_id']);

        // Upload layout
        if ($request->hasFile('layout')) {
            $validated['layout'] = $request->file('layout')->store('survey_layouts', 'public');
        }

        // Upload foto lokasi
        if ($request->hasFile('foto_lokasi')) {
            $validated['foto_lokasi'] = $request->file('foto_lokasi')->store('survey_photos', 'public');
        }

        // Update survey result
        $survey->update($validated);

        // Pengukuran relasi many-to-many
        $survey->jenisPengukuran()->sync($jenisPengukuranIds);

        // Handle MOM file upload (ke order)
        if ($request->hasFile('mom_file')) {
            $order = $survey->order;

            if ($order->mom_file && Storage::disk('public')->exists($order->mom_file)) {
                Storage::disk('public')->delete($order->mom_file);
            }

            $momFilePath = $request->file('mom_file')->store('mom_files', 'public');
            $order->update(['mom_file' => $momFilePath]);
        }

        return redirect()->route('survey-results.index')->with('success', 'Survey Results created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $survey = SurveyResults::with(['order.jenisInterior', 'order.users.role', 'jenisPengukuran'])
            ->findOrFail($id);

        return Inertia::render('SurveyResults/Show', [
            'survey' => $survey,
            'selectedPengukuranIds' => $survey->jenisPengukuran->pluck('id')->toArray()
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $survey = SurveyResults::with(['order.jenisInterior', 'order.users.role', 'jenisPengukuran'])->findOrFail($id);
        
        $jenisPengukuran = JenisPengukuran::all();

        $selectedPengukuranIds = $survey->jenisPengukuran->pluck('id')->toArray();

        return Inertia::render('SurveyResults/Edit', [
            'survey' => $survey,
            'jenisPengukuran' => $jenisPengukuran,
            'selectedPengukuranIds' => $selectedPengukuranIds,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $survey = SurveyResults::findOrFail($id);

        $validated = $request->validate([
            'feedback' => 'nullable|string',
            'layout' => 'nullable|file|mimes:pdf,jpg,jpeg,png,dwg,dxf|max:10240',
            'foto_lokasi' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'mom_file' => 'nullable|file|mimes:pdf,doc,docx|max:2048',

            // ⬅️ validasi jenis pengukuran
            'jenis_pengukuran_ids' => 'nullable|array',
            'jenis_pengukuran_ids.*' => 'exists:jenis_pengukuran,id',
        ]);

        // Upload layout
        if ($request->hasFile('layout')) {
            if ($survey->layout && Storage::disk('public')->exists($survey->layout)) {
                Storage::disk('public')->delete($survey->layout);
            }
            $validated['layout'] = $request->file('layout')->store('survey_layouts', 'public');
        }

        // Upload foto lokasi
        if ($request->hasFile('foto_lokasi')) {
            if ($survey->foto_lokasi && Storage::disk('public')->exists($survey->foto_lokasi)) {
                Storage::disk('public')->delete($survey->foto_lokasi);
            }
            $validated['foto_lokasi'] = $request->file('foto_lokasi')->store('survey_photos', 'public');
        }

        // Update survey main data
        $survey->update($validated);

        // ⬅️ jenis pengukuran
        $survey->jenisPengukuran()->sync($request->jenis_pengukuran_ids);

        // Upload MOM file
        if ($request->hasFile('mom_file')) {
            $order = $survey->order;

            if ($order->mom_file && Storage::disk('public')->exists($order->mom_file)) {
                Storage::disk('public')->delete($order->mom_file);
            }

            $momFilePath = $request->file('mom_file')->store('mom_files', 'public');
            $order->update(['mom_file' => $momFilePath]);
        }

        return redirect()->route('survey-results.index')->with('success', 'Survey Results updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $survey = SurveyResults::findOrFail($id);

        // Delete associated files
        if ($survey->layout && Storage::disk('public')->exists($survey->layout)) {
            Storage::disk('public')->delete($survey->layout);
        }
        if ($survey->foto_lokasi && Storage::disk('public')->exists($survey->foto_lokasi)) {
            Storage::disk('public')->delete($survey->foto_lokasi);
        }

        $survey->delete();

        return redirect()->route('survey-results.index')->with('success', 'Survey Results deleted successfully.');
    }
}
