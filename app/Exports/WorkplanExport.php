<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class WorkplanExport implements FromArray, WithStyles, WithColumnWidths
{
    protected $orderId;

    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    public function array(): array
    {
        $rows = [];

        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
            'moodboard.itemPekerjaans.produks.workplanItems',
            'moodboard.itemPekerjaans.invoices',
        ])
        ->whereHas('moodboard.itemPekerjaans.invoices', function ($q) {
            $q->whereNotNull('paid_at')->where('termin_step', '>=', 1);
        })
        ->findOrFail($this->orderId);

        // Project header rows
        $rows[] = ['Project', $order->nama_project, '', ''];
        $rows[] = ['Company', $order->company_name, '', ''];
        $rows[] = ['Customer', $order->customer_name, '', ''];
        $rows[] = ['', '', '', '']; // Empty row
        
        // Table header
        $rows[] = ['Ruangan', 'Produk', 'Workplan Start', 'Workplan End'];

        foreach ($order->moodboard->itemPekerjaans as $ip) {
            // Group products by room (nama_ruangan)
            $productsByRoom = $ip->produks->groupBy('nama_ruangan');

            foreach ($productsByRoom as $ruangan => $produks) {
                $isFirstInRoom = true;

                foreach ($produks as $produk) {
                    // Get earliest start_date and latest end_date from workplan items
                    $workplanItems = $produk->workplanItems;
                    
                    $startDate = null;
                    $endDate = null;

                    if ($workplanItems->isNotEmpty()) {
                        $startDate = $workplanItems
                            ->whereNotNull('start_date')
                            ->min('start_date');
                        $endDate = $workplanItems
                            ->whereNotNull('end_date')
                            ->max('end_date');
                    }

                    // Format dates
                    $startFormatted = $startDate ? \Carbon\Carbon::parse($startDate)->format('d/m/Y') : '-';
                    $endFormatted = $endDate ? \Carbon\Carbon::parse($endDate)->format('d/m/Y') : '-';

                    $rows[] = [
                        $isFirstInRoom ? ($ruangan ?? '-') : '',
                        $produk->produk->nama_produk ?? '-',
                        $startFormatted,
                        $endFormatted,
                    ];

                    $isFirstInRoom = false;
                }
            }
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        $order = Order::with([
            'moodboard.itemPekerjaans.produks.produk',
        ])
        ->whereHas('moodboard.itemPekerjaans.invoices', function ($q) {
            $q->whereNotNull('paid_at')->where('termin_step', '>=', 1);
        })
        ->findOrFail($this->orderId);

        // Style project header (rows 1-3)
        $sheet->getStyle("A1:D3")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'A8D08D'], // Light green like in image
            ],
            'font' => [
                'bold' => false,
            ],
        ]);

        // Style table header (row 5)
        $sheet->getStyle("A5:D5")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E2EFD9'], // Lighter green
            ],
            'font' => [
                'bold' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Count product rows
        $productCount = 0;
        foreach ($order->moodboard->itemPekerjaans as $ip) {
            $productCount += $ip->produks->count();
        }

        // Style data rows (starting from row 6)
        if ($productCount > 0) {
            $sheet->getStyle("A6:D" . (5 + $productCount))->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
            ]);
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 20, // Ruangan
            'B' => 30, // Produk
            'C' => 15, // Workplan Start
            'D' => 15, // Workplan End
        ];
    }
}