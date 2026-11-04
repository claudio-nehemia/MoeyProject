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
        $kmId = Role::getKepalaMarketingRoleId();
        $desainerId = Role::getDesainerRoleId();
        $surveyorId = Role::getSurveyorRoleId();
        $drafterId = Role::getDrafterRoleId();
        $supervisorId = Role::getSupervisorRoleId();
        $pmId = Role::getProjectManagerRoleId();

        $marketings = User::where(function ($query) use ($kmId) {
            $query->where('role_id', $kmId)
                ->orWhereHas('roles', fn($q) => $q->where('roles.id', $kmId));
        })->get(['id', 'name', 'email', 'role_id']);

        $drafters = User::where(function ($query) use ($surveyorId, $drafterId) {
            $query->whereIn('role_id', [$surveyorId, $drafterId])
                ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', [$surveyorId, $drafterId]));
        })->get(['id', 'name', 'email', 'role_id']);

        $desainers = User::where(function ($query) use ($desainerId) {
            $query->where('role_id', $desainerId)
                ->orWhereHas('roles', fn($q) => $q->where('roles.id', $desainerId));
        })->get(['id', 'name', 'email', 'role_id']);

        $supervisors = User::where(function ($query) use ($supervisorId) {
            $query->where('role_id', $supervisorId)
                ->orWhereHas('roles', fn($q) => $q->where('roles.id', $supervisorId));
        })->get(['id', 'name', 'email', 'role_id']);

        $projectManagers = User::where(function ($query) use ($pmId) {
            $query->where('role_id', $pmId)
                ->orWhereHas('roles', fn($q) => $q->where('roles.id', $pmId));
        })->get(['id', 'name', 'email', 'role_id']);

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
        $customers = User::whereHas('role', fn($q) => $q->where('nama_role', 'Customer'))
            ->orWhereHas('roles', fn($q) => $q->where('nama_role', 'Customer'))
            ->get(['id', 'name', 'email']);

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
        $order->load(['users.role', 'jenisInterior', 'activityLogs.user']);

        return Inertia::render('Order/Show', [
            'order' => $order,
            'activityLogs' => $order->activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        $order->load('users.role');
        $teamUsers = $this->getOrderTeamUsers();
        $customers = User::whereHas('role', fn($q) => $q->where('nama_role', 'Customer'))
            ->orWhereHas('roles', fn($q) => $q->where('nama_role', 'Customer'))
            ->get(['id', 'name', 'email']);
        $userIds = $order->users->pluck('id')->toArray();

        return Inertia::render('Order/Edit', [
            'order' => $order,
            'jenisInteriors' => JenisInterior::all(),
            'drafters' => $teamUsers['drafters'],
            'desainers' => $teamUsers['desainers'],
            'supervisors' => $teamUsers['supervisors'],
            'projectManagers' => $teamUsers['projectManagers'],
            'marketings' => $teamUsers['marketings'],
            'selectedUsers' => $userIds,
            'existingUserIds' => $userIds,
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
