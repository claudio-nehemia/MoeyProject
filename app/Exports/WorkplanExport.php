<?php

namespace App\Exports;

use App\Models\Order;
use App\Models\WorkplanItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class WorkplanExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.invoices',
            'moodboard.itemPekerjaans.kontrak',
            'moodboard.itemPekerjaans.pengajuanPerpanjanganTimelines',
        ])
        ->whereHas('moodboard.itemPekerjaans.invoices', function ($q) {
            $q->whereNotNull('paid_at')->where('termin_step', '>=', 1);
        })
        ->get();
    }

    public function headings(): array
    {
        return [
            'Project',
            'Company',
            'Customer',
            'Item Pekerjaan ID',
            'Produk',
            'Workplan Start',
            'Workplan End',
            'Total Produk (IP)',
            'Produk Dengan Workplan',
            'Progress (%)',
            'Has Kontrak',
            'Durasi Kontrak',
            'Pengajuan Perpanjangan',
            'Status Pengajuan',
            'Alasan Pengajuan',
            'Response By',
            'Response Time',
        ];
    }

    public function map($order): array
    {
        $rows = [];

        foreach ($order->moodboard->itemPekerjaans as $ip) {

            $totalProduks = $ip->produks->count();

            $produksWithWorkplan = $ip->produks->filter(function ($p) {
                return $p->workplanItems->contains(function ($wi) {
                    return $wi->start_date !== null && $wi->end_date !== null;
                });
            })->count();

            $progress = $totalProduks > 0
                ? round(($produksWithWorkplan / $totalProduks) * 100)
                : 0;

            $latestPengajuan = $ip->pengajuanPerpanjanganTimelines
                ->sortByDesc('created_at')
                ->first();

            // Response info (sama dengan index)
            $workplanItems = $ip->produks
                ->flatMap(fn ($p) => $p->workplanItems);

            $respondedItem = $workplanItems->first(
                fn ($wi) => $wi->response_time !== null
            );

            foreach ($ip->produks as $produk) {
                $rows[] = [
                    $order->nama_project,
                    $order->company_name,
                    $order->customer_name,
                    $ip->id,
                    $produk->produk->nama_produk ?? '-',
                    $ip->workplan_start_date?->format('Y-m-d'),
                    $ip->workplan_end_date?->format('Y-m-d'),
                    $totalProduks,
                    $produksWithWorkplan,
                    $progress,
                    $ip->kontrak !== null ? 'Ya' : 'Tidak',
                    $ip->kontrak?->durasi_kontrak,
                    $latestPengajuan ? 'Ya' : 'Tidak',
                    $latestPengajuan?->status ?? '-',
                    $latestPengajuan?->reason ?? '-',
                    $respondedItem?->response_by,
                    $respondedItem?->response_time?->format('Y-m-d H:i:s'),
                ];
            }
        }

        return $rows;
    }
}
