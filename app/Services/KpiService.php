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

        // Attendance KPI calculations
        $latePresences = 0;
        $alphaDays = 0;
        $perfectAttendanceBonus = false;
        $karyawan = $user->karyawan;

        if ($karyawan) {
            $presenceRecords = DB::table('presensi')
                ->join('presensi_jamkerja', 'presensi.kode_jam_kerja', '=', 'presensi_jamkerja.kode_jam_kerja')
                ->where('presensi.nik', $karyawan->nik)
                ->whereBetween('presensi.tanggal', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->select('presensi.*', 'presensi_jamkerja.jam_masuk as jk_jam_masuk')
                ->get();

            $hasAttendance = false;
            foreach ($presenceRecords as $p) {
                if ($p->status === 'h') {
                    $hasAttendance = true;
                    if ($p->jam_in) {
                        $jamInOnly = date('H:i:s', strtotime($p->jam_in));
                        if ($jamInOnly > $p->jk_jam_masuk) {
                            $latePresences++;
                        }
                    }
                } elseif ($p->status === 'a') {
                    $alphaDays++;
                }
            }

            // Perfect attendance criteria: has at least one presence, 0 lates, 0 alphas
            if ($hasAttendance && $latePresences === 0 && $alphaDays === 0) {
                $perfectAttendanceBonus = true;
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
