<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Order\Traits\HasOrderExports;
use App\Http\Controllers\Order\Traits\HasOrderMutations;
use App\Models\JenisInterior;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    use HasOrderMutations, HasOrderExports;

    /**
     * Display a listing of the resource.
     */
    public function index()
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

        return Inertia::render('Order/Index', [
            'orders' => $orders,
            'statusCounts' => $statusCounts,
        ]);
    }

    /**
     * Get team users grouped by role for order assignment
     */
    private function getOrderTeamUsers()
    {
        $surveyorId = Role::where('nama_role', 'like', '%Surveyor%')->pluck('id');
        $drafterId = Role::where('nama_role', 'like', '%Drafter%')->pluck('id');
        $desainerId = Role::where('nama_role', 'like', '%Desainer%')->pluck('id');
        $supervisorId = Role::where('nama_role', 'like', '%Supervisor%')->pluck('id');
        $pmId = Role::where('nama_role', 'like', '%Project Manager%')->pluck('id');
        $kmId = Role::where('nama_role', 'like', '%Kepala Marketing%')->pluck('id');

        $marketings = User::where(function ($query) use ($kmId) {
            $query->whereIn('role_id', $kmId)
                ->orWhere('role_id', 1);
        })->get(['id', 'name', 'role_id']);

        $drafters = User::where(function ($query) use ($surveyorId, $drafterId) {
            $query->whereIn('role_id', $surveyorId)
                ->orWhereIn('role_id', $drafterId);
        })->get(['id', 'name', 'role_id']);

        $desainers = User::where(function ($query) use ($desainerId) {
            $query->whereIn('role_id', $desainerId);
        })->get(['id', 'name', 'role_id']);

        $supervisors = User::where(function ($query) use ($supervisorId) {
            $query->whereIn('role_id', $supervisorId);
        })->get(['id', 'name', 'role_id']);

        $projectManagers = User::where(function ($query) use ($pmId) {
            $query->whereIn('role_id', $pmId);
        })->get(['id', 'name', 'role_id']);

        return [
            'marketings' => $marketings,
            'drafters' => $drafters,
            'desainers' => $desainers,
            'supervisors' => $supervisors,
            'projectManagers' => $projectManagers,
        ];
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $teamUsers = $this->getOrderTeamUsers();
        $customers = User::role('Customer')->get(['id', 'name', 'email']);

        return Inertia::render('Order/Create', [
            'jenisInteriors' => JenisInterior::all(),
            'drafters' => $teamUsers['drafters'],
            'desainers' => $teamUsers['desainers'],
            'supervisors' => $teamUsers['supervisors'],
            'projectManagers' => $teamUsers['projectManagers'],
            'marketings' => $teamUsers['marketings'],
            'customers' => $customers,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load(['users', 'jenisInterior']);

        return Inertia::render('Order/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        $order->load('users');
        $teamUsers = $this->getOrderTeamUsers();
        $customers = User::role('Customer')->get(['id', 'name', 'email']);

        return Inertia::render('Order/Edit', [
            'order' => $order,
            'jenisInteriors' => JenisInterior::all(),
            'drafters' => $teamUsers['drafters'],
            'desainers' => $teamUsers['desainers'],
            'supervisors' => $teamUsers['supervisors'],
            'projectManagers' => $teamUsers['projectManagers'],
            'marketings' => $teamUsers['marketings'],
            'selectedUsers' => $order->users->pluck('id')->toArray(),
            'customers' => $customers,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        ActivityLogService::log(
            $order->id,
            $order,
            'delete',
            'Order Dihapus',
            "Menghapus order #{$order->id}: {$order->nama_project}",
            ['order' => ['id' => $order->id, 'nama_project' => $order->nama_project]]
        );

        $order->delete();

        return redirect()->back()->with('success', 'Order deleted successfully.');
    }
}
