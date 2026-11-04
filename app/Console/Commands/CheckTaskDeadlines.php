<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Order;
use App\Models\TaskResponse;
use Illuminate\Console\Command;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Collection;

class CheckTaskDeadlines extends Command
{
    protected $signature = 'tasks:check-deadlines';
    protected $description = 'Check task deadlines and send notifications for H-1 reminders';

    public function handle()
    {
        $this->info('Checking task deadlines...');

        $setting = \App\Models\NotificationSetting::getByKey('reminder_task_deadline');
        if ($setting && !$setting->is_active) {
            $this->info('Task deadline reminder is disabled in settings.');
        } else {
            $daysOffset = $setting ? (int) $setting->days_offset : 1;
            $targetDate = Carbon::today()->addDays($daysOffset);

            // Ambil semua task yang statusnya bukan 'selesai' dan deadline sesuai jeda hari
            /** @var Collection<int, TaskResponse> $tasks */
            $tasks = TaskResponse::whereIn('status', ['menunggu_response', 'menunggu_input'])
                ->whereDate('deadline', '=', $targetDate)
                ->get();

            $this->info("Found {$tasks->count()} tasks with deadline on {$targetDate->toDateString()} (H-{$daysOffset})");

            $notificationService = new NotificationService();

            foreach ($tasks as $task) {
                $order = $task->order;
                if (!$order) continue;

                // Tentukan user yang harus dikirim notifikasi berdasarkan tahap & NotificationSetting
                /** @var Collection<int, User> $usersToNotify */
                $usersToNotify = $this->getUsersForTahap($order, $task->tahap, $setting);

                foreach ($usersToNotify as $user) {
                    $notificationService->sendTaskDeadlineReminderNotification(
                        $order,
                        $task,
                        $user
                    );
                }
            }
        }

        // Update status jadi 'telat' untuk yang lewat deadline
        /** @var Collection<int, TaskResponse> $overdueTasks */
        $overdueTasks = TaskResponse::whereIn('status', ['menunggu_response', 'menunggu_input'])
            ->where('deadline', '<', now())
            ->get();

        foreach ($overdueTasks as $task) {
            $task->update(['status' => 'telat']);
            $this->warn("Task {$task->id} marked as overdue");
        }

        $this->info('Deadline check completed');
    }

    /**
     * Get users yang harus dikirim notifikasi berdasarkan tahap dan konfigurasi NotificationSetting
     */
    private function getUsersForTahap(Order $order, string $tahap, ?\App\Models\NotificationSetting $setting = null): Collection
    {
        /** @var Collection<int, User> $users */
        $users = collect();

        switch ($tahap) {
            case 'survey':
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
                })->get();
                break;

            case 'moodboard':
            case 'approval_design':
            case 'desain_final':
            case 'item_pekerjaan':
            case 'item-pekerjaan':
                $desainerId = \App\Models\Role::getDesainerRoleId();
                $users = $order->users()->where('role_id', $desainerId)->get();
                break;

            case 'estimasi':
            case 'rab_internal':
            case 'rab':
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Estimator');
                })->get();
                break;

            case 'cm_fee':
            case 'kontrak':
            case 'invoice':
                $users = User::whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Legal Admin', 'Finance']);
                })->get();
                break;

            case 'survey_schedule':
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Project Manager');
                })->get();
                break;

            case 'survey_ulang':
            case 'gambar_kerja':
            case 'meeting_vendor':
            case 'meeting_approval':
                $desainerId = \App\Models\Role::getDesainerRoleId();
                $users = $order->surveyUsers()->where(function ($q) use ($desainerId) {
                    $q->whereHas('role', fn($rq) => $rq->whereIn('nama_role', ['Surveyor', 'Drafter']))
                      ->orWhere('role_id', $desainerId);
                })->get();
                break;

            case 'approval_material':
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Drafter', 'Project Manager']);
                })->get();
                break;

            case 'workplan':
            case 'produksi':
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Project Manager', 'Supervisor']);
                })->get();
                break;
        }

        // Respect NotificationSetting target_role_ids filter if configured
        if ($setting && !empty($setting->target_role_ids)) {
            $allowedRoleIds = $setting->target_role_ids;
            if ($setting->recipient_type === 'all_by_role') {
                $users = User::where(function ($query) use ($allowedRoleIds) {
                    $query->whereIn('role_id', $allowedRoleIds)
                        ->orWhereHas('roles', fn($q) => $q->whereIn('roles.id', $allowedRoleIds));
                })->get();
            } else {
                $users = $users->filter(fn(User $u) => in_array((int) $u->role_id, $allowedRoleIds))->values();
            }
        }

        // Respect NotificationSetting send_to_management if enabled
        if ($setting && $setting->send_to_management) {
            $mgmtRoleIds = !empty($setting->management_role_ids)
                ? $setting->management_role_ids
                : [
                    \App\Models\Role::getKepalaMarketingRoleId(),
                    \App\Models\Role::getProjectManagerRoleId(),
                    \App\Models\Role::getSupervisorRoleId(),
                ];

            $orderManagers = $order->users()->whereIn('role_id', $mgmtRoleIds)->get();
            $surveyManagers = method_exists($order, 'surveyUsers')
                ? $order->surveyUsers()->whereIn('role_id', $mgmtRoleIds)->get()
                : collect();

            $users = $users->merge($orderManagers)->merge($surveyManagers)->unique('id')->values();
        }

        return $users;
    }
}