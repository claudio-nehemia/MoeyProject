<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\SurveyResults;
use App\Models\JenisPengukuran;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
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
        // NOTE: We eager-load surveyResults.jenisPengukuran so draft status can reflect partial draft data.
        $surveys = Order::with(['surveyResults.jenisPengukuran', 'jenisInterior', 'users.role'])
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $surveyResult = $order->surveyResults;

                $hasFeedback = $surveyResult && is_string($surveyResult->feedback) && trim($surveyResult->feedback) !== '';
                $hasLayoutFiles = $surveyResult && !empty($surveyResult->layout_files);
                $hasFotoFiles = $surveyResult && !empty($surveyResult->foto_lokasi_files);
                $hasJenisPengukuran = $surveyResult && $surveyResult->relationLoaded('jenisPengukuran')
                    ? $surveyResult->jenisPengukuran->isNotEmpty()
                    : ($surveyResult ? $surveyResult->jenisPengukuran()->exists() : false);
                $hasMomFile = !empty($order->mom_file);

                $hasAnyDraftData = $hasFeedback || $hasLayoutFiles || $hasFotoFiles || $hasJenisPengukuran || $hasMomFile;

                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'jenis_interior' => $order->jenisInterior->nama_interior ?? '-',
                    'tanggal_masuk_customer' => $order->tanggal_masuk_customer,
                    'project_status' => $order->project_status,

                    // Survey status checks
                    'has_survey' => $surveyResult !== null
                        && $surveyResult->response_time !== null
                        && $surveyResult->is_draft == false
                        && ($surveyResult->feedback || $surveyResult->layout_files || $surveyResult->foto_lokasi_files),

                    'is_draft' => $surveyResult ? $surveyResult->is_draft : false,
                    // A draft should be treated as "has draft" even if only partial fields are filled
                    // (e.g. jenis_pengukuran_ids or MOM file). This avoids the UI looking like it didn't save.
                    'has_draft' => $surveyResult !== null
                        && $surveyResult->is_draft == true
                        && $hasAnyDraftData,

                    // Survey data
                    'survey_id' => $surveyResult->id ?? null,
                    'response_time' => $surveyResult->response_time ?? null,
                    'response_by' => $surveyResult->response_by ?? null,
                    'pm_response_time' => $surveyResult->pm_response_time ?? null,
                    'pm_response_by' => $surveyResult->pm_response_by ?? null,
                    'feedback' => $surveyResult->feedback ?? null,

                    // Order data
                    'tanggal_survey' => $order->tanggal_survey,
                    'tahapan_proyek' => $order->tahapan_proyek,
                    'payment_status' => $order->payment_status,
                    'is_responded' => $surveyResult && $surveyResult->response_time !== null,

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
        try {
            DB::beginTransaction();

            $order = Order::findOrFail($orderId);

            // Check if STAFF already responded
            if ($order->surveyResults && $order->surveyResults->response_time) {
                return back()->with('error', 'Staff response already recorded for this order.');
            }

            // Update or create survey result
            if ($order->surveyResults) {
                $order->surveyResults->update([
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                ]);
            } else {
                SurveyResults::create([
                    'order_id' => $order->id,
                    'response_time' => now(),
                    'response_by' => auth()->user()->name ?? 'Admin',
                    'is_draft' => true,
                ]);
            }

            $order->update([
                'tahapan_proyek' => 'survey',
                'project_status' => 'in_progress',
            ]);

            $taskResponse = TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'survey')
                ->orderByDesc('extend_time')
                ->orderByDesc('updated_at')
                ->orderByDesc('id')
                ->first();

            if ($taskResponse && $taskResponse->status === 'menunggu_response') {
                $taskResponse->update([
                    'user_id' => auth()->user()->id,
                    'response_time' => now(),   
                    'deadline' => now()->addDays(6),
                    'duration' => 6,
                    'duration_actual' => $taskResponse->duration_actual,
                    'status' => 'menunggu_input',
                ]);
            } else if ($taskResponse && $taskResponse->isOverdue()) {
                $taskResponse->update([
                    'user_id' => auth()->user()->id,
                    'response_time' => now(),   
                ]);
            }

            DB::commit();
            return back()->with('success', 'Response recorded. You can now create the survey.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error marking response: ' . $e->getMessage());
            return back()->with('error', 'Failed to record response. Please try again.');
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $orderId)
    {
        $order = Order::with(['jenisInterior', 'surveyResults', 'users.role'])->findOrFail($orderId);
        $jenisPengukuran = JenisPengukuran::all();

        // Check if user has clicked Response button first
        if (!$order->surveyResults) {
            return redirect()->route('survey-results.index')
                ->with('error', 'Please click "Response" button first before creating survey.');
        }

        // Check if published survey already exists
        if (
            !$order->surveyResults->is_draft &&
            ($order->surveyResults->feedback || $order->surveyResults->layout_files || $order->surveyResults->foto_lokasi_files)
        ) {
            return redirect()->route('survey-results.edit', $order->surveyResults->id)
                ->with('info', 'Survey data already exists. You can edit it.');
        }

        return Inertia::render('SurveyResults/Create', [
            'order' => $order,
            'survey' => $order->surveyResults,
            'jenisPengukuran' => $jenisPengukuran,
            'selectedPengukuranIds' => $order->surveyResults->jenisPengukuran->pluck('id')->toArray() ?? [],
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
            'action' => 'required|in:save_draft,publish',
        ]);

        try {
            DB::beginTransaction();

            $survey = SurveyResults::findOrFail($validated['survey_id']);
            $isDraft = $validated['action'] === 'save_draft';
            $jenisPengukuranIds = $validated['jenis_pengukuran_ids'] ?? [];

            // Remove non-database fields
            unset(
                $validated['survey_id'],
                $validated['jenis_pengukuran_ids'],
                $validated['layout_files'],
                $validated['foto_lokasi_files'],
                $validated['action']
            );

            /* ===============================
             * UPLOAD LAYOUT FILES
             * =============================== */
            $layoutFilesPaths = [];

            if ($request->hasFile('layout_files')) {
                foreach ($request->file('layout_files') as $file) {
                    if (in_array($file->getClientOriginalExtension(), ['jpg', 'jpeg', 'png'])) {
                        $imageData = image_service()->saveImage($file, 'survey_layouts', 2000, 85);
                        $thumbnail = image_service()->saveThumbnail($file, 'survey_layouts', 500, 70);
                        $layoutFilesPaths[] = array_merge($imageData, ['thumbnail' => $thumbnail]);
                    } else {
                        $layoutFilesPaths[] = image_service()->saveRawFile($file, 'survey_layouts');
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
                    $imageData = image_service()->saveImage($file, 'survey_photos', 1600, 80);
                    $thumbnail = image_service()->saveThumbnail($file, 'survey_photos', 400, 70);
                    $fotoLokasiFilesPaths[] = array_merge($imageData, ['thumbnail' => $thumbnail]);
                }
            }

            $validated['foto_lokasi_files'] = $fotoLokasiFilesPaths ?: null;

            /* ===============================
             * UPDATE SURVEY
             * =============================== */
            $validated['is_draft'] = $isDraft;
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
             * NOTIFICATION (only if published)
             * =============================== */
            if (!$isDraft) {
                $notificationService = new NotificationService();
                $notificationService->sendMoodboardRequestNotification($survey->order);
                $order = $survey->order;
                $order->update([
                    'tahapan_proyek' => 'moodboard',
                    'project_status' => 'in_progress',
                ]);

                $taskResponse = TaskResponse::where('order_id', $survey->order->id)
                    ->where('tahap', 'survey')
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if ($taskResponse) {
                    if ($taskResponse->isOverdue()) {
                        $taskResponse->update([
                            'status' => 'telat_submit',
                            'update_data_time' => now(), // Kapan data diisi
                        ]);
                    } else {
                        $taskResponse->update([
                            'update_data_time' => now(), // Kapan data diisi
                            'status' => 'selesai',
                        ]);
                    }
                }

                $nextTaskExists = TaskResponse::where('order_id', $survey->order->id)
                    ->where('tahap', 'moodboard')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $survey->order->id,
                        'user_id' => null,
                        'tahap' => 'moodboard',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Contoh: deadline 5 hari untuk moodboard
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);

                    TaskResponse::create([
                        'order_id' => $survey->order->id,
                        'user_id' => null,
                        'tahap' => 'moodboard',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Contoh: deadline 5 hari untuk moodboard
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }
            }

            DB::commit();

            $message = $isDraft
                ? 'Survey Results saved as draft successfully.'
                : 'Survey Results published successfully.';

            return redirect()
                ->route('survey-results.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error storing survey: ' . $e->getMessage());
            return back()
                ->withInput()
                ->with('error', 'Failed to save survey. Please try again.');
        }
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
            'action' => 'required|in:save_draft,publish',
        ]);

        try {
            DB::beginTransaction();

            $isDraft = $validated['action'] === 'save_draft';
            $wasDraft = $survey->is_draft;
            $jenisPengukuranIds = $validated['jenis_pengukuran_ids'] ?? [];

            // Remove non-database fields
            unset(
                $validated['layout_files'],
                $validated['foto_lokasi_files'],
                $validated['jenis_pengukuran_ids'],
                $validated['action']
            );

            /* ===============================
             * HANDLE LAYOUT FILES (APPEND)
             * =============================== */
            $existingLayoutFiles = $survey->layout_files ?? [];

            if ($request->hasFile('layout_files')) {
                foreach ($request->file('layout_files') as $file) {
                    if (in_array($file->getClientOriginalExtension(), ['jpg', 'jpeg', 'png'])) {
                        $imageData = image_service()->saveImage($file, 'survey_layouts', 2000, 85);
                        $thumbnail = image_service()->saveThumbnail($file, 'survey_layouts', 500, 70);
                        $existingLayoutFiles[] = array_merge($imageData, ['thumbnail' => $thumbnail]);
                    } else {
                        $existingLayoutFiles[] = image_service()->saveRawFile($file, 'survey_layouts');
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
                    $imageData = image_service()->saveImage($file, 'survey_photos', 1600, 80);
                    $thumbnail = image_service()->saveThumbnail($file, 'survey_photos', 400, 70);
                    $existingFotoFiles[] = array_merge($imageData, ['thumbnail' => $thumbnail]);
                }
            }

            $validated['foto_lokasi_files'] = $existingFotoFiles ?: null;

            /* ===============================
             * UPDATE SURVEY
             * =============================== */
            $validated['is_draft'] = $isDraft;
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
             * NOTIFICATION (only if published from draft)
             * =============================== */
            if (!$isDraft && $wasDraft) {
                $notificationService = new NotificationService();
                $notificationService->sendMoodboardRequestNotification($survey->order);
                $order = $survey->order;
                $order->update([
                    'tahapan_proyek' => 'moodboard',
                    'project_status' => 'in_progress',
                ]);

                $taskResponse = TaskResponse::where('order_id', $survey->order->id)
                    ->where('tahap', 'survey')
                    ->orderByDesc('extend_time')
                    ->orderByDesc('updated_at')
                    ->orderByDesc('id')
                    ->first();

                if ($taskResponse) {
                    if ($taskResponse->isOverdue()) {
                        $taskResponse->update([
                            'status' => 'telat_submit',
                            'update_data_time' => now(), // Kapan data diisi
                        ]);
                    } else {
                        $taskResponse->update([
                            'update_data_time' => now(), // Kapan data diisi
                            'status' => 'selesai',
                        ]);
                    }
                }

                $nextTaskExists = TaskResponse::where('order_id', $survey->order->id)
                    ->where('tahap', 'moodboard')
                    ->exists();

                if (!$nextTaskExists) {
                    TaskResponse::create([
                        'order_id' => $survey->order->id,
                        'user_id' => null,
                        'tahap' => 'moodboard',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Contoh: deadline 5 hari untuk moodboard
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                    ]);

                    TaskResponse::create([
                        'order_id' => $survey->order->id,
                        'user_id' => null,
                        'tahap' => 'moodboard',
                        'start_time' => now(),
                        'deadline' => now()->addDays(3), // Contoh: deadline 5 hari untuk moodboard
                        'duration' => 3,
                        'duration_actual' => 3,
                        'extend_time' => 0,
                        'status' => 'menunggu_response',
                        'is_marketing' => true,
                    ]);
                }
            }

            DB::commit();

            $message = $isDraft
                ? 'Survey Results saved as draft successfully.'
                : 'Survey Results published successfully.';

            return redirect()
                ->route('survey-results.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating survey: ' . $e->getMessage());
            return back()
                ->withInput()
                ->with('error', 'Failed to update survey. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $survey = SurveyResults::findOrFail($id);

            // Delete layout files
            if ($survey->layout_files) {
                foreach ($survey->layout_files as $file) {
                    if (isset($file['path']) && Storage::disk('public')->exists($file['path'])) {
                        Storage::disk('public')->delete($file['path']);
                    }
                    if (isset($file['thumbnail']) && Storage::disk('public')->exists($file['thumbnail'])) {
                        Storage::disk('public')->delete($file['thumbnail']);
                    }
                }
            }

            // Delete foto lokasi files
            if ($survey->foto_lokasi_files) {
                foreach ($survey->foto_lokasi_files as $file) {
                    if (isset($file['path']) && Storage::disk('public')->exists($file['path'])) {
                        Storage::disk('public')->delete($file['path']);
                    }
                    if (isset($file['thumbnail']) && Storage::disk('public')->exists($file['thumbnail'])) {
                        Storage::disk('public')->delete($file['thumbnail']);
                    }
                }
            }

            $survey->delete();

            DB::commit();
            return redirect()->route('survey-results.index')->with('success', 'Survey Results deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting survey: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete survey. Please try again.');
        }
    }

    /**
     * Delete a single file from layout_files or foto_lokasi_files
     */
    public function deleteFile($id, $fileIndex)
    {
        try {
            DB::beginTransaction();

            $survey = SurveyResults::findOrFail($id);
            $fileType = request()->query('type'); // 'layout' or 'foto'

            if ($fileType === 'layout') {
                $files = $survey->layout_files ?? [];
                if (isset($files[$fileIndex])) {
                    // Delete main file
                    if (isset($files[$fileIndex]['path']) && Storage::disk('public')->exists($files[$fileIndex]['path'])) {
                        Storage::disk('public')->delete($files[$fileIndex]['path']);
                    }
                    // Delete thumbnail
                    if (isset($files[$fileIndex]['thumbnail']) && Storage::disk('public')->exists($files[$fileIndex]['thumbnail'])) {
                        Storage::disk('public')->delete($files[$fileIndex]['thumbnail']);
                    }

                    array_splice($files, $fileIndex, 1);
                    $survey->update(['layout_files' => !empty($files) ? array_values($files) : null]);

                    DB::commit();
                    return back()->with('success', 'Layout file deleted successfully.');
                }
            } elseif ($fileType === 'foto') {
                $files = $survey->foto_lokasi_files ?? [];
                if (isset($files[$fileIndex])) {
                    // Delete main file
                    if (isset($files[$fileIndex]['path']) && Storage::disk('public')->exists($files[$fileIndex]['path'])) {
                        Storage::disk('public')->delete($files[$fileIndex]['path']);
                    }
                    // Delete thumbnail
                    if (isset($files[$fileIndex]['thumbnail']) && Storage::disk('public')->exists($files[$fileIndex]['thumbnail'])) {
                        Storage::disk('public')->delete($files[$fileIndex]['thumbnail']);
                    }

                    array_splice($files, $fileIndex, 1);
                    $survey->update(['foto_lokasi_files' => !empty($files) ? array_values($files) : null]);

                    DB::commit();
                    return back()->with('success', 'Photo file deleted successfully.');
                }
            }

            DB::rollBack();
            return back()->with('error', 'File not found.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting file: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete file. Please try again.');
        }
    }

    /**
     * Publish a draft survey
     */
    public function publish($id)
    {
        try {
            DB::beginTransaction();

            $survey = SurveyResults::findOrFail($id);

            if (!$survey->is_draft) {
                return back()->with('error', 'Survey is already published.');
            }

            $survey->update(['is_draft' => false]);

            // Send notification
            $notificationService = new NotificationService();
            $notificationService->sendMoodboardRequestNotification($survey->order);

            DB::commit();
            return back()->with('success', 'Survey Results published successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error publishing survey: ' . $e->getMessage());
            return back()->with('error', 'Failed to publish survey. Please try again.');
        }
    }
}