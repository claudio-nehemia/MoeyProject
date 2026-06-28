<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\KpiSetting;
use App\Models\KpiHistory;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KpiController extends Controller
{
    public function index(Request $request)
    {
        $settings = KpiSetting::first() ?? KpiSetting::create([
            'base_points' => 100,
            'points_fast_response' => 5,
            'points_fast_update' => 10,
            'penalty_late' => 10,
            'points_completed_project' => 20,
            'bonus_type' => 'flat',
        ]);

        $currentMonth = Carbon::now()->format('Y-m');
        
        // Sync KPI histories for all users for the current month so that calculations are up-to-date.
        $users = User::all();
        foreach ($users as $user) {
            $this->syncAndCalculateMonthlyKpi($user, $currentMonth, $settings);
        }

        // Calculate global stats across all users for the current month
        $allHistories = DB::table('kpi_histories')
            ->where('month', $currentMonth)
            ->get();

        $totalScoreSum = $allHistories->sum('score');
        $avgScore = $allHistories->count() > 0 ? round($totalScoreSum / $allHistories->count()) : $settings->base_points;
        $totalProjects = $allHistories->sum('completed_projects');
        $totalLate = $allHistories->sum('late_tasks');

        $topRecord = DB::table('kpi_histories')
            ->where('month', $currentMonth)
            ->join('users', 'kpi_histories.user_id', '=', 'users.id')
            ->orderByDesc('kpi_histories.score')
            ->select('users.name', 'kpi_histories.score')
            ->first();

        $globalStats = [
            'avgScore' => (int)$avgScore,
            'topPerformerName' => $topRecord ? $topRecord->name : '-',
            'topPerformerScore' => $topRecord ? (int)$topRecord->score : 0,
            'totalCompletedProjects' => (int)$totalProjects,
            'totalLateTasks' => (int)$totalLate,
        ];

        // Current month calculation
        $query = User::with('role.divisi');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $roleName = $request->role;
            $query->whereHas('role', function($q) use ($roleName) {
                $q->where('nama_role', $roleName);
            });
        }

        $query->leftJoin('kpi_histories', function($join) use ($currentMonth) {
            $join->on('users.id', '=', 'kpi_histories.user_id')
                 ->where('kpi_histories.month', '=', $currentMonth);
        })
        ->select(
            'users.*',
            'kpi_histories.score as kpi_score',
            'kpi_histories.fast_responses as kpi_fast_responses',
            'kpi_histories.fast_updates as kpi_fast_updates',
            'kpi_histories.late_tasks as kpi_late_tasks',
            'kpi_histories.completed_projects as kpi_completed_projects'
        )
        ->orderByRaw('COALESCE(kpi_histories.score, 0) DESC');

        $paginated = $query->paginate(10)->withQueryString();

        $kpiData = $paginated->through(function ($user) use ($settings) {
            return [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->nama_role : '-',
                'divisi' => ($user->role && $user->role->divisi) ? $user->role->divisi->nama_divisi : '-',
                'fast_responses' => $user->kpi_fast_responses ?? 0,
                'fast_updates' => $user->kpi_fast_updates ?? 0,
                'late_tasks' => $user->kpi_late_tasks ?? 0,
                'completed_projects' => $user->kpi_completed_projects ?? 0,
                'score' => $user->kpi_score ?? $settings->base_points,
            ];
        });

        $rolesList = DB::table('roles')->pluck('nama_role')->filter()->toArray();

        return Inertia::render('Kpi/Index', [
            'kpiData' => $kpiData,
            'settings' => $settings,
            'rolesList' => $rolesList,
            'filters' => $request->only(['search', 'role']),
            'globalStats' => $globalStats,
        ]);
    }

    public function show(User $user)
    {
        $settings = KpiSetting::first() ?? KpiSetting::firstOrCreate([]);
        $user->load('role.divisi');

        // Sync and get 12 months trend history
        $trend = $this->syncUserKpiHistories($user, $settings);
        $currentMonthRecord = end($trend);

        // Fetch task history for this user (recent 30 task responses)
        $tasks = DB::table('task_responses')
            ->where('user_id', $user->id)
            ->join('orders', 'task_responses.order_id', '=', 'orders.id')
            ->select('task_responses.*', 'orders.nama_project')
            ->orderByDesc('task_responses.updated_at')
            ->limit(30)
            ->get();

        $taskHistory = [];
        foreach ($tasks as $task) {
            $isFastResponse = false;
            $isFastUpdate = false;
            $isLate = false;
            $pointsImpact = 0;

            if ($task->response_time) {
                $startTime = Carbon::parse($task->start_time);
                $responseTime = Carbon::parse($task->response_time);
                $diffDays = $responseTime->diffInDays($startTime);
                if ($diffDays < $task->duration_actual) {
                    $isFastResponse = true;
                    $daysEarly = $task->duration_actual - $diffDays;
                    if ($settings->bonus_type === 'flat') {
                        $pointsImpact += $settings->points_fast_response;
                    } else {
                        $pointsImpact += round(($settings->points_fast_response * $daysEarly) / $task->duration_actual);
                    }
                }
                if ($responseTime->greaterThan(Carbon::parse($task->deadline))) {
                    $isLate = true;
                }
            }

            if ($task->update_data_time) {
                $baseTime = Carbon::parse($task->response_time ?? $task->start_time);
                $updateTime = Carbon::parse($task->update_data_time);
                $diffDays = $updateTime->diffInDays($baseTime);
                $targetUpdateDays = max(1, $task->duration - $task->duration_actual);
                if ($diffDays < $targetUpdateDays) {
                    $isFastUpdate = true;
                    $daysEarly = $targetUpdateDays - $diffDays;
                    if ($settings->bonus_type === 'flat') {
                        $pointsImpact += $settings->points_fast_update;
                    } else {
                        $pointsImpact += round(($settings->points_fast_update * $daysEarly) / $targetUpdateDays);
                    }
                }
                if ($updateTime->greaterThan(Carbon::parse($task->deadline))) {
                    $isLate = true;
                }
            }

            if (in_array($task->status, ['telat', 'telat_submit'])) {
                $isLate = true;
            }

            if ($isLate) {
                $pointsImpact -= $settings->penalty_late;
            }

            $taskHistory[] = [
                'id' => $task->id,
                'nama_project' => $task->nama_project,
                'tahap' => ucfirst($task->tahap),
                'start_time' => Carbon::parse($task->start_time)->format('Y-m-d H:i'),
                'response_time' => $task->response_time ? Carbon::parse($task->response_time)->format('Y-m-d H:i') : null,
                'update_data_time' => $task->update_data_time ? Carbon::parse($task->update_data_time)->format('Y-m-d H:i') : null,
                'deadline' => Carbon::parse($task->deadline)->format('Y-m-d H:i'),
                'status' => $task->status,
                'is_late' => $isLate,
                'points_impact' => $pointsImpact,
            ];
        }

        // Fetch completed projects list
        $orderIdsFromTeams = DB::table('order_teams')
            ->where('user_id', $user->id)
            ->pluck('order_id')
            ->toArray();

        $orderIdsFromTasks = DB::table('task_responses')
            ->where('user_id', $user->id)
            ->pluck('order_id')
            ->toArray();

        $orderIds = array_unique(array_merge($orderIdsFromTeams, $orderIdsFromTasks));
        $completedProjects = [];

        if (!empty($orderIds)) {
            $orders = Order::whereIn('id', $orderIds)
                ->with(['itemPekerjaans.invoices'])
                ->get();

            foreach ($orders as $order) {
                $orderIsCompleted = false;
                $completionDate = null;
                $items = $order->itemPekerjaans;

                if ($items->isNotEmpty()) {
                    $orderIsCompleted = true;
                    $dates = [];
                    foreach ($items as $item) {
                        if (empty($item->bast_number)) {
                            $orderIsCompleted = false;
                            break;
                        }
                        if ($item->bast_date) {
                            $dates[] = Carbon::parse($item->bast_date);
                        }

                        $invoices = $item->invoices;
                        if ($invoices->isEmpty()) {
                            $orderIsCompleted = false;
                            break;
                        }
                        foreach ($invoices as $inv) {
                            if ($inv->status !== 'paid') {
                                $orderIsCompleted = false;
                                break 2;
                            }
                            if ($inv->paid_at) {
                                $dates[] = Carbon::parse($inv->paid_at);
                            }
                        }
                    }

                    if ($orderIsCompleted && !empty($dates)) {
                        $completionDate = max($dates);
                    }
                }

                if ($orderIsCompleted) {
                    $completedProjects[] = [
                        'id' => $order->id,
                        'nama_project' => $order->nama_project,
                        'customer_name' => $order->customer_name,
                        'completed_at' => $completionDate ? $completionDate->format('Y-m-d') : null,
                        'points_impact' => $settings->points_completed_project,
                    ];
                }
            }
        }

        return Inertia::render('Kpi/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->nama_role : '-',
                'divisi' => ($user->role && $user->role->divisi) ? $user->role->divisi->nama_divisi : '-',
            ],
            'summary' => [
                'score' => $currentMonthRecord['score'],
                'fast_responses' => $currentMonthRecord['fast_responses'],
                'fast_updates' => $currentMonthRecord['fast_updates'],
                'late_tasks' => $currentMonthRecord['late_tasks'],
                'completed_projects' => $currentMonthRecord['completed_projects'],
            ],
            'taskHistory' => $taskHistory,
            'completedProjects' => $completedProjects,
            'trend' => $trend,
            'settings' => $settings,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'base_points' => 'required|integer|min:0',
            'points_fast_response' => 'required|integer|min:0',
            'points_fast_update' => 'required|integer|min:0',
            'penalty_late' => 'required|integer|min:0',
            'points_completed_project' => 'required|integer|min:0',
            'bonus_type' => 'required|string|in:flat,proportional',
        ]);

        $settings = KpiSetting::first();
        if ($settings) {
            $settings->update($validated);
        } else {
            KpiSetting::create($validated);
        }

        // Recalculate historical snapshots for the current month so that the dashboard reflects settings updates instantly
        $currentMonth = Carbon::now()->format('Y-m');
        $users = User::all();
        foreach ($users as $user) {
            $this->syncAndCalculateMonthlyKpi($user, $currentMonth, KpiSetting::first());
        }

        return redirect()->back()->with('success', 'KPI settings updated successfully.');
    }

    private function syncUserKpiHistories(User $user, KpiSetting $settings)
    {
        $trend = [];
        // Fetch 12 months history
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->format('Y-m');
            $record = $this->syncAndCalculateMonthlyKpi($user, $month, $settings);
            $trend[] = [
                'month' => $date->format('M Y'),
                'score' => $record->score,
                'fast_responses' => $record->fast_responses,
                'fast_updates' => $record->fast_updates,
                'late_tasks' => $record->late_tasks,
                'completed_projects' => $record->completed_projects,
            ];
        }
        return $trend;
    }

    private function syncAndCalculateMonthlyKpi(User $user, string $month, KpiSetting $settings)
    {
        $isCurrentMonth = ($month === Carbon::now()->format('Y-m'));

        if (!$isCurrentMonth) {
            $existing = KpiHistory::where('user_id', $user->id)
                ->where('month', $month)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
        $endOfMonth = Carbon::parse($month . '-01')->endOfMonth();

        // Fetch tasks relevant to this month
        $tasks = DB::table('task_responses')
            ->where('user_id', $user->id)
            ->where(function($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('update_data_time', [$startOfMonth, $endOfMonth])
                      ->orWhereBetween('response_time', [$startOfMonth, $endOfMonth])
                      ->orWhere(function($q) use ($startOfMonth, $endOfMonth) {
                          $q->whereBetween('deadline', [$startOfMonth, $endOfMonth])
                            ->whereNotIn('status', ['selesai']);
                      });
            })
            ->get();

        $fastResponsesCount = 0;
        $fastUpdatesCount = 0;
        $lateTasksCount = 0;

        $fastResponsesBonus = 0;
        $fastUpdatesBonus = 0;

        foreach ($tasks as $task) {
            $isLate = false;

            // Check response time
            if ($task->response_time) {
                $respTime = Carbon::parse($task->response_time);
                if ($respTime->between($startOfMonth, $endOfMonth)) {
                    $startTime = Carbon::parse($task->start_time);
                    $diffDays = $respTime->diffInDays($startTime);
                    
                    if ($diffDays < $task->duration_actual) {
                        $fastResponsesCount++;
                        $daysEarly = $task->duration_actual - $diffDays;
                        if ($settings->bonus_type === 'flat') {
                            $fastResponsesBonus += $settings->points_fast_response;
                        } else {
                            $fastResponsesBonus += round(($settings->points_fast_response * $daysEarly) / $task->duration_actual);
                        }
                    }

                    if ($respTime->greaterThan(Carbon::parse($task->deadline))) {
                        $isLate = true;
                    }
                }
            }

            // Check update data time
            if ($task->update_data_time) {
                $updTime = Carbon::parse($task->update_data_time);
                if ($updTime->between($startOfMonth, $endOfMonth)) {
                    $baseTime = Carbon::parse($task->response_time ?? $task->start_time);
                    $diffDays = $updTime->diffInDays($baseTime);
                    
                    $targetUpdateDays = max(1, $task->duration - $task->duration_actual);
                    if ($diffDays < $targetUpdateDays) {
                        $fastUpdatesCount++;
                        $daysEarly = $targetUpdateDays - $diffDays;
                        if ($settings->bonus_type === 'flat') {
                            $fastUpdatesBonus += $settings->points_fast_update;
                        } else {
                            $fastUpdatesBonus += round(($settings->points_fast_update * $daysEarly) / $targetUpdateDays);
                        }
                    }

                    if ($updTime->greaterThan(Carbon::parse($task->deadline))) {
                        $isLate = true;
                    }
                }
            }

            // Check status-based lateness
            if (in_array($task->status, ['telat', 'telat_submit'])) {
                $deadline = Carbon::parse($task->deadline);
                if ($deadline->between($startOfMonth, $endOfMonth)) {
                    $isLate = true;
                }
            }

            if ($isLate) {
                $lateTasksCount++;
            }
        }

        // Projects completed in this month
        $orderIdsFromTeams = DB::table('order_teams')
            ->where('user_id', $user->id)
            ->pluck('order_id')
            ->toArray();

        $orderIdsFromTasks = DB::table('task_responses')
            ->where('user_id', $user->id)
            ->pluck('order_id')
            ->toArray();

        $orderIds = array_unique(array_merge($orderIdsFromTeams, $orderIdsFromTasks));
        $completedProjectsCount = 0;

        if (!empty($orderIds)) {
            $orders = Order::whereIn('id', $orderIds)
                ->with(['itemPekerjaans.invoices'])
                ->get();

            foreach ($orders as $order) {
                $orderIsCompleted = false;
                $completionDate = null;
                $items = $order->itemPekerjaans;

                if ($items->isNotEmpty()) {
                    $orderIsCompleted = true;
                    $dates = [];
                    foreach ($items as $item) {
                        if (empty($item->bast_number)) {
                            $orderIsCompleted = false;
                            break;
                        }
                        if ($item->bast_date) {
                            $dates[] = Carbon::parse($item->bast_date);
                        }

                        $invoices = $item->invoices;
                        if ($invoices->isEmpty()) {
                            $orderIsCompleted = false;
                            break;
                        }
                        foreach ($invoices as $inv) {
                            if ($inv->status !== 'paid') {
                                $orderIsCompleted = false;
                                break 2;
                            }
                            if ($inv->paid_at) {
                                $dates[] = Carbon::parse($inv->paid_at);
                            }
                        }
                    }

                    if ($orderIsCompleted && !empty($dates)) {
                        $completionDate = max($dates);
                    }
                }

                if ($orderIsCompleted && $completionDate && $completionDate->between($startOfMonth, $endOfMonth)) {
                    $completedProjectsCount++;
                }
            }
        }

        $monthlyScore = $settings->base_points 
            + $fastResponsesBonus 
            + $fastUpdatesBonus 
            - ($lateTasksCount * $settings->penalty_late) 
            + ($completedProjectsCount * $settings->points_completed_project);

        return KpiHistory::updateOrCreate(
            ['user_id' => $user->id, 'month' => $month],
            [
                'base_score' => $settings->base_points,
                'fast_responses' => $fastResponsesCount,
                'fast_updates' => $fastUpdatesCount,
                'late_tasks' => $lateTasksCount,
                'completed_projects' => $completedProjectsCount,
                'score' => max(0, $monthlyScore),
            ]
        );
    }
}
