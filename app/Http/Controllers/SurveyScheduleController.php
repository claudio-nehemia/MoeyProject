<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyScheduleController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isKepalaMarketing = $user->role && $user->role->nama_role === 'Kepala Marketing';

        // USER YANG BOLEH IKUT SURVEY
        $surveyUsers = User::whereHas('role', function ($q) {
            $q->whereIn('nama_role', [
                'Surveyor',
                'Drafter',
                'Desainer',
                'Kepala Marketing',
                'Supervisi',
            ]);
        })->select('id', 'name', 'email')->get();

        $orders = Order::with(['surveyUsers:id,name'])
            ->whereNotNull('payment_status')
            ->whereRaw("LOWER(payment_status) LIKE '%dp%'")
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'nama_project' => $o->nama_project,
                'company_name' => $o->company_name,
                'customer_name' => $o->customer_name,
                'tanggal_survey' => $o->tanggal_survey,
                'survey_response_time' => $o->survey_response_time,
                'survey_response_by' => $o->survey_response_by,
                'pm_survey_response_time' => $o->pm_survey_response_time,
                'pm_survey_response_by' => $o->pm_survey_response_by,
                'survey_users' => $o->surveyUsers->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                ]),
            ]);

        return Inertia::render('SurveySchedule/Index', [
            'orders' => $orders,
            'surveyUsers' => $surveyUsers,
            'isKepalaMarketing' => $isKepalaMarketing,
        ]);
    }

    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'tanggal_survey' => 'required|date',
            'survey_schedule_users' => 'required|array|min:1',
            'survey_schedule_users.*' => 'exists:users,id',
        ]);

        $order->update([
            'tanggal_survey' => $validated['tanggal_survey'],
            'tahapan_proyek' => 'survey_ulang',
            'project_status' => 'in_progress',
        ]);

        // SYNC TIM SURVEY
        $order->surveyUsers()->sync($validated['survey_schedule_users']);

        // TaskResponse: survey schedule sudah diisi (bukan moodboard)
        $taskResponse = \App\Models\TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_schedule')
            ->first();

        if ($taskResponse) {
            $taskResponse->update([
                'update_data_time' => now(), // Kapan data diisi
                'status' => 'selesai',
            ]);

            // Create task response untuk tahap selanjutnya (survey_ulang)
            $nextTaskExists = \App\Models\TaskResponse::where('order_id', $order->id)
                ->where('tahap', 'survey_ulang')
                ->exists();

            if (!$nextTaskExists) {
                \App\Models\TaskResponse::create([
                    'order_id' => $order->id,
                    'user_id' => null,
                    'tahap' => 'survey_ulang',
                    'start_time' => now(),
                    'deadline' => now()->addDays(3), // Deadline untuk survey_ulang
                    'duration' => 3,
                    'duration_actual' => 3,
                    'extend_time' => 0,
                    'status' => 'menunggu_response',
                ]);
            }
        }

        $notificationService = new NotificationService();
        $notificationService->sendSurveyUlangRequestNotification($order);

        return redirect()
            ->route('survey-schedule.index')
            ->with('success', 'Survey berhasil dijadwalkan.');
    }

    public function response(Order $order)
    {
        $order->update([
            'survey_response_time' => now(),
            'survey_response_by' => auth()->user()->name,
        ]);

        $taskResponse = \App\Models\TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey_schedule')
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
        }

        return redirect()
            ->route('survey-schedule.index')
            ->with('success', 'Response survey berhasil disimpan.');
    }
}