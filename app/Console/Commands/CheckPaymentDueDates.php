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
        $this->info('Checking vendor payment due dates and reminders...');

        $notificationService = new NotificationService();
        $today = Carbon::today();

        $hMinSetting = \App\Models\NotificationSetting::getByKey('reminder_payment_h_min');
        $dueSetting = \App\Models\NotificationSetting::getByKey('reminder_payment_due');
        $feeSetting = \App\Models\NotificationSetting::getByKey('reminder_material_fee');

        // ==========================================
        // 1. REMINDER H-X (JATUH TEMPO H-X AWAL)
        // ==========================================
        if (!$hMinSetting || $hMinSetting->is_active) {
            $hDays = $hMinSetting ? (int) $hMinSetting->days_offset : 7;
            $hTargetDate = Carbon::today()->addDays($hDays);

            // 1a. Check tanggal_pembayaran (DP/Main)
            $hGeneralEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran', '=', $hTargetDate)
                ->where('reminder_h7_sent', false)
                ->get();

            foreach ($hGeneralEntries as $entry) {
                $order = $entry->order;
                if ($order) {
                    $notificationService->sendPaymentReminderH7Notification($order, $entry, 'dp');
                    $entry->update(['reminder_h7_sent' => true]);
                    $this->info("Sent H-{$hDays} reminder for DP/Payment entry ID: {$entry->id} on project: {$order->nama_project}");
                }
            }

            // 1b. Check tanggal_pembayaran_termin
            $hTerminEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran_termin', '=', $hTargetDate)
                ->where('reminder_h7_termin_sent', false)
                ->get();

            foreach ($hTerminEntries as $entry) {
                $order = $entry->order;
                if ($order) {
                    $notificationService->sendPaymentReminderH7Notification($order, $entry, 'termin');
                    $entry->update(['reminder_h7_termin_sent' => true]);
                    $this->info("Sent H-{$hDays} reminder for Termin entry ID: {$entry->id} on project: {$order->nama_project}");
                }
            }
        }

        // ==========================================
        // 2. REMINDER H-0 (HARI JATUH TEMPO)
        // ==========================================
        if (!$dueSetting || $dueSetting->is_active) {
            // 2a. Check tanggal_pembayaran (DP/Main) H-0
            $dueGeneralEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran', '=', $today)
                ->where('reminder_sent', false)
                ->get();

            foreach ($dueGeneralEntries as $entry) {
                $order = $entry->order;
                if ($order) {
                    $notificationService->sendPaymentReminderNotification($order, $entry, 'dp');
                    $entry->update(['reminder_sent' => true]);
                    $this->info("Sent H-0 reminder for DP/Payment entry ID: {$entry->id} on project: {$order->nama_project}");
                }
            }

            // 2b. Check tanggal_pembayaran_termin H-0
            $dueTerminEntries = CashflowVendorEntry::whereDate('tanggal_pembayaran_termin', '=', $today)
                ->where('reminder_termin_sent', false)
                ->get();

            foreach ($dueTerminEntries as $entry) {
                $order = $entry->order;
                if ($order) {
                    $notificationService->sendPaymentReminderNotification($order, $entry, 'termin');
                    $entry->update(['reminder_termin_sent' => true]);
                    $this->info("Sent H-0 reminder for Termin entry ID: {$entry->id} on project: {$order->nama_project}");
                }
            }
        }

        // ==========================================
        // 3. REMINDER FEE H+X SETELAH APPROVAL MATERIAL
        // ==========================================
        if (!$feeSetting || $feeSetting->is_active) {
            $feeDays = $feeSetting ? (int) $feeSetting->days_offset : 3;
            $feeDate = Carbon::today()->subDays($feeDays);

            $itemPekerjaans = \App\Models\ItemPekerjaan::whereDate('pm_approval_rab_response_time', '=', $feeDate)
                ->where('reminder_fee_sent', false)
                ->get();

            foreach ($itemPekerjaans as $ip) {
                $order = $ip->moodboard?->order;
                if ($order) {
                    $notificationService->sendFeeReminderNotification($order);
                    $ip->update(['reminder_fee_sent' => true]);
                    $this->info("Sent H+{$feeDays} Fee Reminder for project: {$order->nama_project}");
                }
            }
        }

        $this->info('Vendor payment check completed');
    }
}
