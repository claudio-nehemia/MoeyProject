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

        // Ambil semua task yang statusnya bukan 'selesai' dan deadline H-1
        /** @var Collection<int, TaskResponse> $tasks */
        $tasks = TaskResponse::whereIn('status', ['menunggu_response', 'menunggu_input'])
            ->whereDate('deadline', '=', Carbon::tomorrow())
            ->get();

        $this->info("Found {$tasks->count()} tasks with deadline tomorrow");

        $notificationService = new NotificationService();

        foreach ($tasks as $task) {
            $order = $task->order;

            // Tentukan user yang harus dikirim notifikasi berdasarkan tahap
            /** @var Collection<int, User> $usersToNotify */
            $usersToNotify = $this->getUsersForTahap($order, $task->tahap);

            foreach ($usersToNotify as $user) {
                $notificationService->sendTaskDeadlineReminderNotification(
                    $order,
                    $task,
                    $user
                );
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
     * Get users yang harus dikirim notifikasi berdasarkan tahap
     */
    private function getUsersForTahap(Order $order, string $tahap): Collection
    {
        /** @var Collection<int, User> $users */
        $users = collect();

        switch ($tahap) {
            case 'survey':
                // Hanya drafter dan surveyor dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
                })->get();
                break;

            case 'moodboard':
                // Desainer dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Desainer');
                })->get();
                break;

            case 'estimasi':
                // CM Fee dan Desainer dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Estimator');
                })->get();
                break;

            case 'cm_fee':
                // CM Fee dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Legal Admin');
                })->get();
                break;

            case 'approval_design':
                // Project Manager dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Desainer');
                })->get();
                break;

            case 'desain_final':
                // Desainer dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Desainer');
                })->get();
                break;

            case 'item_pekerjaan':
                // desainer dari order teams
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Desainer');
                })->get();
                break;

            case 'rab_internal':
                // Estimator dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Estimator');
                })->get();
                break;

            case 'kontrak':
                // Legal Admin dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Legal Admin');
                })->get();
                break;

            case 'invoice':
                // Finance dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Finance');
                })->get();
                break;

            case 'survey_schedule':
                // Surveyor dari order team
                $users = User::whereHas('role', function ($query) {
                    $query->where('nama_role', 'Project Manager');
                })->get();
                break;

            case 'survey_ulang':
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Surveyor', 'Drafter', 'Desainer']);
                })->get();
                break;

            case 'gambar_kerja':
                // Drafter dari order team
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Surveyor', 'Drafter', 'Desainer']);
                })->get();
                break;

            case 'approval_material':
                // project manager dari survey users
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Drafter');
                })->get();
                break;

            case 'workplan':
                // project manager dari survey users
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Project Manager');
                })->get();
                break;

            case 'produksi':
                // project manager dari survey users dan supervisor dari user model
                $users = $order->surveyUsers()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Project Manager');
                })->get();
                break;
            
            // Tambahkan case lain sesuai kebutuhan
            // case 'cm_fee': ...
            // case 'desain_final': ...
            // dll
        }

        return $users;
    }
}