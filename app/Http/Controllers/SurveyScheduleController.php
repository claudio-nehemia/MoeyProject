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

        return redirect()
            ->route('survey-schedule.index')
            ->with('success', 'Response survey berhasil disimpan.');
    }
}