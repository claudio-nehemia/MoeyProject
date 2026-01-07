<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index() {
        $totalOrders = Order::count();
        $activeOrders = Order::where('project_status', 'deal')->count();
        $completeProjects = Order::where('tahapan_proyek', 'selesai')->count();
        $completePercentage = $totalOrders > 0 ? ($completeProjects / $totalOrders) * 100 : 0;

        $recentOrders = Order::with('jenisInterior')
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get();

        return Inertia::render('dashboard', [
            'totalOrders' => $totalOrders,
            'activeOrders' => $activeOrders,
            'completeProjects' => $completeProjects,
            'recentOrders' => $recentOrders,
            'completePercentage' => round($completePercentage, 2),
        ]);
    }
}
