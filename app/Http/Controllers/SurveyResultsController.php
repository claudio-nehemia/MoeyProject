<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use Illuminate\Http\Request;
use App\Models\SurveyResults;
use App\Models\JenisPengukuran;
use App\Services\NotificationService;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;

class SurveyResultsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== SURVEY RESULTS INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));
        
        // Get all orders with survey results relationship
        $surveys = Order::with(['surveyResults', 'jenisInterior', 'users.role'])
            ->visibleToUser($user)
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
                    // has_survey harus cek response_time (staff response), bukan cuma exists
                    'has_survey' => $order->surveyResults !== null && $order->surveyResults->response_time !== null,
                    'survey_id' => $order->surveyResults->id ?? null,
                    'response_time' => $order->surveyResults->response_time ?? null,
                    'response_by' => $order->surveyResults->response_by ?? null,
                    'pm_response_time' => $order->surveyResults->pm_response_time ?? null,
                    'pm_response_by' => $order->surveyResults->pm_response_by ?? null,
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
        
        // Check if STAFF already responded (cek response_time, bukan cuma exists)
        if ($order->surveyResults && $order->surveyResults->response_time) {
            return back()->with('error', 'Staff response already recorded for this order.');
        }

        // If surveyResults exists (PM mungkin sudah response) tapi response_time NULL
        // Update response_time (staff response)
        if ($order->surveyResults) {
            $order->surveyResults->update([
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
            ]);
        } else {
            // Create new survey with response info
            SurveyResults::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name ?? 'Admin',
            ]);
        }

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

            'layout_files' => 'nullable|array',
            'layout_files.*' => 'file|mimes:pdf,jpg,jpeg,png,dwg,dxf|max:10240',

            'foto_lokasi_files' => 'nullable|array',
            'foto_lokasi_files.*' => 'file|mimes:jpg,jpeg,png|max:5120',

            'mom_file' => 'nullable|file|mimes:pdf,doc,docx|max:2048',

            'jenis_pengukuran_ids' => 'nullable|array',
            'jenis_pengukuran_ids.*' => 'exists:jenis_pengukuran,id',
        ]);

        $survey = SurveyResults::findOrFail($validated['survey_id']);

        /* ===============================
        * PIVOT IDS
        * =============================== */
        $jenisPengukuranIds = $validated['jenis_pengukuran_ids'] ?? [];

        unset(
            $validated['survey_id'],
            $validated['jenis_pengukuran_ids'],
            $validated['layout_files'],
            $validated['foto_lokasi_files']
        );

        /* ===============================
        * UPLOAD LAYOUT FILES
        * =============================== */
        $layoutFilesPaths = [];

        if ($request->hasFile('layout_files')) {
            foreach ($request->file('layout_files') as $file) {

                // IMAGE → resize + thumbnail
                if (in_array($file->getClientOriginalExtension(), ['jpg', 'jpeg', 'png'])) {

                    $imageData = image_service()->saveImage(
                        $file,
                        'survey_layouts',
                        2000, // max width
                        85    // quality
                    );

                    $thumbnail = image_service()->saveThumbnail(
                        $file,
                        'survey_layouts',
                        500,
                        70
                    );

                    $layoutFilesPaths[] = array_merge($imageData, [
                        'thumbnail' => $thumbnail,
                    ]);

                } else {
                    // PDF / DWG / DXF → raw
                    $layoutFilesPaths[] = image_service()->saveRawFile(
                        $file,
                        'survey_layouts'
                    );
                }
            }
        }

        $validated['layout_files'] = $layoutFilesPaths ?: null;

        /* ===============================
        * UPLOAD FOTO LOKASI
        * =============================== */
        $fotoLokasiFilesPaths = [];

        if ($request->hasFile('foto_lokasi_files')) {
            foreach ($request->file('foto_lokasi_files') as $file) {

                $imageData = image_service()->saveImage(
                    $file,
                    'survey_photos',
                    1600,
                    80
                );

                $thumbnail = image_service()->saveThumbnail(
                    $file,
                    'survey_photos',
                    400,
                    70
                );

                $fotoLokasiFilesPaths[] = array_merge($imageData, [
                    'thumbnail' => $thumbnail,
                ]);
            }
        }

        $validated['foto_lokasi_files'] = $fotoLokasiFilesPaths ?: null;

        /* ===============================
        * UPDATE SURVEY
        * =============================== */
        $survey->update($validated);

        /* ===============================
        * SYNC JENIS PENGUKURAN
        * =============================== */
        $survey->jenisPengukuran()->sync($jenisPengukuranIds);

        /* ===============================
        * UPLOAD MOM FILE (ORDER)
        * =============================== */
        if ($request->hasFile('mom_file')) {
            $order = $survey->order;

            if ($order->mom_file && Storage::disk('public')->exists($order->mom_file)) {
                Storage::disk('public')->delete($order->mom_file);
            }

            $momFilePath = $request->file('mom_file')->store('mom_files', 'public');
            $order->update(['mom_file' => $momFilePath]);
        }

        /* ===============================
        * NOTIFICATION
        * =============================== */
        $notificationService = new NotificationService();
        $notificationService->sendMoodboardRequestNotification($survey->order);

        return redirect()
            ->route('survey-results.index')
            ->with('success', 'Survey Results created successfully.');
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

            'layout_files' => 'nullable|array',
            'layout_files.*' => 'file|mimes:pdf,jpg,jpeg,png,dwg,dxf|max:10240',

            'foto_lokasi_files' => 'nullable|array',
            'foto_lokasi_files.*' => 'file|mimes:jpg,jpeg,png|max:5120',

            'mom_file' => 'nullable|file|mimes:pdf,doc,docx|max:2048',

            'jenis_pengukuran_ids' => 'nullable|array',
            'jenis_pengukuran_ids.*' => 'exists:jenis_pengukuran,id',
        ]);

        /* ===============================
        * PREPARE
        * =============================== */
        $jenisPengukuranIds = $validated['jenis_pengukuran_ids'] ?? [];

        unset(
            $validated['layout_files'],
            $validated['foto_lokasi_files'],
            $validated['jenis_pengukuran_ids']
        );

        /* ===============================
        * HANDLE LAYOUT FILES (APPEND)
        * =============================== */
        $existingLayoutFiles = $survey->layout_files ?? [];

        if ($request->hasFile('layout_files')) {
            foreach ($request->file('layout_files') as $file) {

                if (in_array($file->getClientOriginalExtension(), ['jpg', 'jpeg', 'png'])) {

                    $imageData = image_service()->saveImage(
                        $file,
                        'survey_layouts',
                        2000,
                        85
                    );

                    $thumbnail = image_service()->saveThumbnail(
                        $file,
                        'survey_layouts',
                        500,
                        70
                    );

                    $existingLayoutFiles[] = array_merge($imageData, [
                        'thumbnail' => $thumbnail,
                    ]);

                } else {
                    $existingLayoutFiles[] = image_service()->saveRawFile(
                        $file,
                        'survey_layouts'
                    );
                }
            }
        }

        $validated['layout_files'] = $existingLayoutFiles ?: null;

        /* ===============================
        * HANDLE FOTO LOKASI (APPEND)
        * =============================== */
        $existingFotoFiles = $survey->foto_lokasi_files ?? [];

        if ($request->hasFile('foto_lokasi_files')) {
            foreach ($request->file('foto_lokasi_files') as $file) {

                $imageData = image_service()->saveImage(
                    $file,
                    'survey_photos',
                    1600,
                    80
                );

                $thumbnail = image_service()->saveThumbnail(
                    $file,
                    'survey_photos',
                    400,
                    70
                );

                $existingFotoFiles[] = array_merge($imageData, [
                    'thumbnail' => $thumbnail,
                ]);
            }
        }

        $validated['foto_lokasi_files'] = $existingFotoFiles ?: null;

        /* ===============================
        * UPDATE SURVEY
        * =============================== */
        $survey->update($validated);

        /* ===============================
        * SYNC JENIS PENGUKURAN
        * =============================== */
        $survey->jenisPengukuran()->sync($jenisPengukuranIds);

        /* ===============================
        * UPLOAD MOM FILE (ORDER)
        * =============================== */
        if ($request->hasFile('mom_file')) {
            $order = $survey->order;

            if ($order->mom_file && Storage::disk('public')->exists($order->mom_file)) {
                Storage::disk('public')->delete($order->mom_file);
            }

            $momFilePath = $request->file('mom_file')->store('mom_files', 'public');
            $order->update(['mom_file' => $momFilePath]);
        }

        /* ===============================
        * NOTIFICATION
        * =============================== */
        $notificationService = new NotificationService();
        $notificationService->sendMoodboardRequestNotification($survey->order);

        return redirect()
            ->route('survey-results.index')
            ->with('success', 'Survey Results updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $survey = SurveyResults::findOrFail($id);

        // Delete layout files
        if ($survey->layout_files) {
            foreach ($survey->layout_files as $file) {
                if (isset($file['path']) && Storage::disk('public')->exists($file['path'])) {
                    Storage::disk('public')->delete($file['path']);
                }
            }
        }

        // Delete foto lokasi files
        if ($survey->foto_lokasi_files) {
            foreach ($survey->foto_lokasi_files as $file) {
                if (isset($file['path']) && Storage::disk('public')->exists($file['path'])) {
                    Storage::disk('public')->delete($file['path']);
                }
            }
        }

        $survey->delete();

        return redirect()->route('survey-results.index')->with('success', 'Survey Results deleted successfully.');
    }

    /**
     * Delete a single file from layout_files or foto_lokasi_files
     */
    public function deleteFile($id, $fileIndex)
    {
        $survey = SurveyResults::findOrFail($id);
        $fileType = request()->query('type'); // 'layout' or 'foto'

        if ($fileType === 'layout') {
            $files = $survey->layout_files ?? [];
            if (isset($files[$fileIndex])) {
                if (isset($files[$fileIndex]['path']) && Storage::disk('public')->exists($files[$fileIndex]['path'])) {
                    Storage::disk('public')->delete($files[$fileIndex]['path']);
                }
                array_splice($files, $fileIndex, 1);
                $survey->update(['layout_files' => !empty($files) ? array_values($files) : null]);
                return back()->with('success', 'Layout file deleted successfully.');
            }
        } elseif ($fileType === 'foto') {
            $files = $survey->foto_lokasi_files ?? [];
            if (isset($files[$fileIndex])) {
                if (isset($files[$fileIndex]['path']) && Storage::disk('public')->exists($files[$fileIndex]['path'])) {
                    Storage::disk('public')->delete($files[$fileIndex]['path']);
                }
                array_splice($files, $fileIndex, 1);
                $survey->update(['foto_lokasi_files' => !empty($files) ? array_values($files) : null]);
                return back()->with('success', 'Photo file deleted successfully.');
            }
        }

        return back()->with('error', 'File not found.');
    }
}
