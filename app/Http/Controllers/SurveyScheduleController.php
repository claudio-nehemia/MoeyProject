<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyScheduleController extends Controller
{
    /**
     * List order yang sudah DP tapi belum ada tanggal survey
     */
    public function index()
    {
        $orders = Order::whereNotNull('payment_status')
            ->whereRaw("LOWER(payment_status) LIKE '%dp%' 
                        OR LOWER(payment_status) LIKE '%commitment%'")
            ->whereNull('tanggal_survey')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'nama_project' => $o->nama_project,
                'company_name' => $o->company_name,
                'customer_name' => $o->customer_name,
                'payment_status' => $o->payment_status,
            ]);

        return Inertia::render('SurveySchedule/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Update tanggal survey (PM only)
     */
    public function store(Request $request, Order $order)
    {
        $request->validate([
            'tanggal_survey' => 'required|date',
        ]);

        $order->update([
            'tanggal_survey' => $request->tanggal_survey,
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        return back()->with('success', 'Tanggal survey berhasil disimpan.');
    }

}
