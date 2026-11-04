<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\KpiSetting;
use App\Models\KpiHistory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class KpiService
{
    public function syncUserKpiHistories(User $user, KpiSetting $settings)
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
                'late_presences' => $record->late_presences,
                'alpha_days' => $record->alpha_days,
                'perfect_attendance_bonus' => $record->perfect_attendance_bonus,
            ];
        }
        return $trend;
    }

    public function syncAndCalculateMonthlyKpi(User $user, string $month, KpiSetting $settings)
    {
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
            $durationActual = max(1, (int) ($task->duration_actual ?: 1));

            // Check response time (start_time -> response_time)
            if ($task->response_time) {
                $respTime = Carbon::parse($task->response_time);
                if ($respTime->between($startOfMonth, $endOfMonth)) {
                    $startTime = Carbon::parse($task->start_time);
                    $diffDays = max(0, $startTime->diffInDays($respTime, false));
                    
                    if ($diffDays < $durationActual && !$respTime->greaterThan(Carbon::parse($task->deadline))) {
                        $fastResponsesCount++;
                        $daysEarly = max(1, $durationActual - floor($diffDays));
                        if ($settings->bonus_type === 'flat') {
                            $fastResponsesBonus += $settings->points_fast_response;
                        } else {
                            $fastResponsesBonus += round(($settings->points_fast_response * $daysEarly) / $durationActual);
                        }
                    }

                    if ($diffDays > $durationActual || $respTime->greaterThan(Carbon::parse($task->deadline))) {
                        if (!$task->update_data_time) {
                            $isLate = true;
                        }
                    }
                }
            }

            // Check update data time (response_time/start_time -> update_data_time)
            if ($task->update_data_time) {
                $updTime = Carbon::parse($task->update_data_time);
                if ($updTime->between($startOfMonth, $endOfMonth)) {
                    $baseTime = Carbon::parse($task->response_time ?? $task->start_time);
                    $diffDays = max(0, $baseTime->diffInDays($updTime, false));
                    
                    $targetUpdateDays = $task->duration > $durationActual
                        ? ($task->duration - $durationActual)
                        : max(1, (int) $task->duration);
                    $isUpdateOverdue = $updTime->greaterThan(Carbon::parse($task->deadline)) || in_array($task->status, ['telat', 'telat_submit']);
                    if ($diffDays < $targetUpdateDays && !$isUpdateOverdue) {
                        $fastUpdatesCount++;
                        $daysEarly = max(1, $targetUpdateDays - floor($diffDays));
                        if ($settings->bonus_type === 'flat') {
                            $fastUpdatesBonus += $settings->points_fast_update;
                        } else {
                            $fastUpdatesBonus += round(($settings->points_fast_update * $daysEarly) / $targetUpdateDays);
                        }
                    }

                    if ($isUpdateOverdue) {
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

        // Attendance KPI calculations via unified AttendanceCalculationService
        $latePresences = 0;
        $alphaDays = 0;
        $perfectAttendanceBonus = false;
        $karyawan = $user->karyawan;

        if ($karyawan) {
            $attService = app(\App\Services\AttendanceCalculationService::class);
            $parsedDate = Carbon::parse($month . '-01');
            $attSummary = $attService->getMonthlyAttendanceSummary($karyawan->nik, $parsedDate->month, $parsedDate->year);

            if (!empty($attSummary['has_attendance_data'])) {
                $latePresences = $attSummary['hari_terlambat'];
                $alphaDays = $attSummary['hari_alpha'];
                $perfectAttendanceBonus = $attSummary['perfect_attendance'];
            }
        }

        $penaltyLate = $settings->penalty_attendance_late ?? 5;
        $penaltyAlpha = $settings->penalty_attendance_alpha ?? 15;
        $bonusPerfect = $settings->bonus_attendance_perfect ?? 15;

        $attendancePenalty = ($latePresences * $penaltyLate) + ($alphaDays * $penaltyAlpha);
        $attendanceBonus = $perfectAttendanceBonus ? $bonusPerfect : 0;

        $monthlyScore = $settings->base_points 
            + $fastResponsesBonus 
            + $fastUpdatesBonus 
            - ($lateTasksCount * $settings->penalty_late) 
            + ($completedProjectsCount * $settings->points_completed_project)
            - $attendancePenalty
            + $attendanceBonus;

        return KpiHistory::updateOrCreate(
            ['user_id' => $user->id, 'month' => $month],
            [
                'base_score' => $settings->base_points,
                'fast_responses' => $fastResponsesCount,
                'fast_updates' => $fastUpdatesCount,
                'late_tasks' => $lateTasksCount,
                'completed_projects' => $completedProjectsCount,
                'late_presences' => $latePresences,
                'alpha_days' => $alphaDays,
                'perfect_attendance_bonus' => $perfectAttendanceBonus,
                'score' => max(0, $monthlyScore),
            ]
        );
    }
}
