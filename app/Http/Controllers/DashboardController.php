<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index() {
        // Get current user with role and divisi
        $user = auth()->user()->load('role.divisi');

        if ($user->isCustomer()) {
            return redirect()->route('customer.portal');
        }

        $ordersQuery = Order::visibleToUser($user);

        $totalOrders = (clone $ordersQuery)->count();
        $activeOrders = (clone $ordersQuery)->has('surveyResults')
            ->where('tahapan_proyek', '!=', 'selesai')
            ->count();
        $completeProjects = (clone $ordersQuery)->where('tahapan_proyek', 'selesai')->count();
        $completePercentage = $totalOrders > 0 ? ($completeProjects / $totalOrders) * 100 : 0;

        $recentOrders = (clone $ordersQuery)->with('jenisInterior')
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get();

        return Inertia::render('dashboard', [
            'totalOrders' => $totalOrders,
            'activeOrders' => $activeOrders,
            'completeProjects' => $completeProjects,
            'recentOrders' => $recentOrders,
            'completePercentage' => round($completePercentage, 2),
            'currentUser' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->nama_role,
                'divisi' => $user->role?->divisi?->nama_divisi,
            ],
        ]);
    }
}