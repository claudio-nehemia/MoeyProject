<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyScheduleController extends Controller
{
    public function index()
    {
        // USER YANG BOLEH IKUT SURVEY
        $surveyUsers = User::whereHas('role', function ($q) {
            $q->whereIn('nama_role', [
                'Surveyor',
                'Drafter',
                'Desainer',
                'Project Manager',
                'Supervisi',
            ]);
        })->select('id', 'name', 'email')->get();

        $orders = Order::with(['surveyUsers:id,name'])
            ->whereNotNull('payment_status')
            ->whereRaw("
                LOWER(payment_status) LIKE '%dp%' 
                OR LOWER(payment_status) LIKE '%commitment%'
            ")
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'nama_project' => $o->nama_project,
                'company_name' => $o->company_name,
                'customer_name' => $o->customer_name,
                'tanggal_survey' => $o->tanggal_survey,
                'survey_users' => $o->surveyUsers->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                ]),
            ]);

        return Inertia::render('SurveySchedule/Index', [
            'orders' => $orders,
            'surveyUsers' => $surveyUsers,
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
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        // SYNC TIM SURVEY
        $order->surveyUsers()->sync($validated['survey_schedule_users']);

        return redirect()
            ->route('survey-schedule.index')
            ->with('success', 'Survey berhasil dijadwalkan.');
    }
}
