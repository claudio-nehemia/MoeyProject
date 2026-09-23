<?php

namespace App\Http\Controllers\Order\Traits;

use App\Exports\OrderExport;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

trait HasOrderExports
{
    /**
     * Export orders as PDF
     */
    public function exportPdf()
    {
        $user = auth()->user();
        $orders = Order::with('users', 'jenisInterior')
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->get();

        $statusCounts = [
            'pending' => $orders->where('project_status', 'pending')->count(),
            'in_progress' => $orders->where('project_status', 'in_progress')->count(),
            'completed' => $orders->where('project_status', 'completed')->count(),
        ];

        $data = [
            'orders' => $orders,
            'totalOrders' => $orders->count(),
            'statusCounts' => $statusCounts,
        ];

        $pdf = Pdf::loadView('pdf.order-report', $data);
        $pdf->setPaper('a4', 'landscape');

        $filename = 'Order-Report-' . date('Ymd') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Export orders as Word
     */
    public function exportWord()
    {
        $user = auth()->user();
        $orders = Order::with('users', 'jenisInterior')
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->get();

        $statusCounts = [
            'pending' => $orders->where('project_status', 'pending')->count(),
            'in_progress' => $orders->where('project_status', 'in_progress')->count(),
            'completed' => $orders->where('project_status', 'completed')->count(),
        ];

        $data = [
            'orders' => $orders,
            'totalOrders' => $orders->count(),
            'statusCounts' => $statusCounts,
        ];

        $html = view('pdf.order-report', $data)->render();
        $filename = 'Order-Report-' . date('Ymd') . '.doc';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-word')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export orders as Excel
     */
    public function exportExcel()
    {
        $user = auth()->user();
        $orders = Order::with('users', 'jenisInterior')
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'Order-Report-' . date('Ymd') . '.xlsx';
        return Excel::download(new OrderExport($orders), $filename);
    }
}
