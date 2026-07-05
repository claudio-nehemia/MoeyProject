<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use App\Models\Order;
use App\Models\CashflowVendorEntry;
use Illuminate\Console\Command;
use App\Services\NotificationService;

class CheckPaymentDueDates extends Command
{
    protected $signature = 'cashflow:check-payments';
    protected $description = 'Check vendor payment due dates and send notifications to Legal Admin';

    public function handle()
    {
        $this->info('Checking vendor payment due dates...');

        $notificationService = new NotificationService();
        $today = Carbon::today();

        // 1. Check tanggal_pembayaran (DP / cash / general entries)
        $dueGeneralEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran', '=', $today)
            ->where('reminder_sent', false)
            ->get();

        $this->info("Found {$dueGeneralEntries->count()} general payment entries due today");

        foreach ($dueGeneralEntries as $entry) {
            $order = $entry->order;
            if ($order) {
                $notificationService->sendPaymentReminderNotification($order, $entry, 'dp');
                $entry->update(['reminder_sent' => true]);
                $this->info("Sent reminder for DP/Payment entry ID: {$entry->id} on project: {$order->nama_project}");
            }
        }

        // 2. Check tanggal_pembayaran_termin (External termin entries)
        $dueTerminEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran_termin', '=', $today)
            ->where('reminder_termin_sent', false)
            ->get();

        $this->info("Found {$dueTerminEntries->count()} termin payment entries due today");

        foreach ($dueTerminEntries as $entry) {
            $order = $entry->order;
            if ($order) {
                $notificationService->sendPaymentReminderNotification($order, $entry, 'termin');
                $entry->update(['reminder_termin_sent' => true]);
                $this->info("Sent reminder for Termin entry ID: {$entry->id} on project: {$order->nama_project}");
            }
        }

        $this->info('Vendor payment check completed');
    }
}
