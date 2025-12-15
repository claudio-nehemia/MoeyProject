<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyScheduleController extends Controller
{
    /**
     * List order yang sudah DP / Commitment
     * (baik yang BELUM maupun SUDAH ada tanggal survey)
     */
    public function index()
    {
        $orders = Order::whereNotNull('payment_status')
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
                'tanggal_survey' => $o->tanggal_survey, // ⬅️ PENTING
            ]);

        return Inertia::render('SurveySchedule/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Simpan tanggal survey
     */
    public function store(Request $request, Order $order)
    {
        $request->validate([
            'tanggal_survey' => ['required', 'date'],
        ]);

        $order->update([
            'tanggal_survey' => $request->tanggal_survey,
            'tahapan_proyek' => 'survey',
            'project_status' => 'in_progress',
        ]);

        return back()->with('success', 'Tanggal survey berhasil disimpan.');
    }
}
