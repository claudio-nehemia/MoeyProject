<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class OrderSheet implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $orders;
    protected $totalRows = 0;

    const COLOR_HEADER = 'FF1E293B';
    const COLOR_BORDER = 'FFCBD5E1';
    const COLOR_ROW_EVEN = 'FFF8FAFC';
    const COLOR_ROW_ODD = 'FFFFFFFF';
    const COLOR_SUMMARY_BG = 'FFF1F5F9';

    // Badge colors
    const BADGE_COLORS = [
        'pending' => ['bg' => 'FFFEF3C7', 'fg' => 'FF92400E'],
        'in_progress' => ['bg' => 'FFDBEAFE', 'fg' => 'FF1E40AF'],
        'completed' => ['bg' => 'FFDCFCE7', 'fg' => 'FF166534'],
        'low' => ['bg' => 'FFF1F5F9', 'fg' => 'FF475569'],
        'medium' => ['bg' => 'FFDBEAFE', 'fg' => 'FF1E40AF'],
        'high' => ['bg' => 'FFFFEDD5', 'fg' => 'FFC2410C'],
        'urgent' => ['bg' => 'FFFEE2E2', 'fg' => 'FF991B1B'],
        'not_start' => ['bg' => 'FFF1F5F9', 'fg' => 'FF475569'],
        'survey' => ['bg' => 'FFE0E7FF', 'fg' => 'FF3730A3'],
        'moodboard' => ['bg' => 'FFFCE7F3', 'fg' => 'FF9D174D'],
        'cm_fee' => ['bg' => 'FFFEF3C7', 'fg' => 'FF92400E'],
        'desain_final' => ['bg' => 'FFCFFAFE', 'fg' => 'FF155E75'],
        'rab' => ['bg' => 'FFDBEAFE', 'fg' => 'FF1E40AF'],
        'kontrak' => ['bg' => 'FFE0E7FF', 'fg' => 'FF4338CA'],
        'produksi' => ['bg' => 'FFFAF5FF', 'fg' => 'FF7E22CE'],
        'lunas' => ['bg' => 'FFDCFCE7', 'fg' => 'FF166534'],
        'termin' => ['bg' => 'FFE0E7FF', 'fg' => 'FF4338CA'],
        'dp' => ['bg' => 'FFCFFAFE', 'fg' => 'FF155E75'],
    ];

    public function __construct($orders)
    {
        $this->orders = $orders;
    }

    public function title(): string
    {
        return 'Order List';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 25,  // Nama Project
            'C' => 20,  // Perusahaan
            'D' => 18,  // Customer
            'E' => 15,  // Telepon
            'F' => 14,  // Jenis Interior
            'G' => 12,  // Prioritas
            'H' => 13,  // Status
            'I' => 14,  // Tahapan
            'J' => 13,  // Pembayaran
            'K' => 30,  // Team
            'L' => 13,  // Tanggal Masuk
        ];
    }

    public function array(): array
    {
        $rows = [];

        // Row 1: Title
        $rows[] = ['ORDER MANAGEMENT REPORT', '', '', '', '', '', '', '', '', '', '', ''];
        // Row 2: Subtitle
        $rows[] = ['Daftar Seluruh Order Project — Moey Living Group', '', '', '', '', '', '', '', '', '', '', ''];
        // Row 3: Blank
        $rows[] = array_fill(0, 12, '');
        // Row 4: Summary
        $statusCounts = [
            'pending' => 0,
            'in_progress' => 0,
            'completed' => 0,
        ];
        foreach ($this->orders as $order) {
            $status = $order->project_status ?? 'pending';
            if (isset($statusCounts[$status])) {
                $statusCounts[$status]++;
            }
        }
        $rows[] = [
            'Total Orders:', count($this->orders),
            '', 'Pending:', $statusCounts['pending'],
            '', 'In Progress:', $statusCounts['in_progress'],
            '', 'Completed:', $statusCounts['completed'],
            ''
        ];
        // Row 5: Tanggal cetak
        $rows[] = ['Dicetak: ' . now()->format('d/m/Y H:i'), '', '', '', '', '', '', '', '', '', '', ''];
        // Row 6: Blank
        $rows[] = array_fill(0, 12, '');
        // Row 7: Table Header
        $rows[] = ['No', 'Nama Project', 'Perusahaan', 'Customer', 'Telepon', 'Jenis Interior', 'Prioritas', 'Status', 'Tahapan', 'Pembayaran', 'Team', 'Tanggal Masuk'];

        // Data rows
        foreach ($this->orders as $index => $order) {
            $tahapanLabels = [
                'not_start' => 'Belum Mulai',
                'survey' => 'Survey',
                'moodboard' => 'Moodboard',
                'cm_fee' => 'CM Fee',
                'desain_final' => 'Desain Final',
                'rab' => 'RAB',
                'kontrak' => 'Kontrak',
                'produksi' => 'Produksi',
            ];
            $paymentLabels = [
                'not_start' => 'Belum Bayar',
                'cm_fee' => 'CM Fee',
                'dp' => 'DP',
                'termin' => 'Termin',
                'lunas' => 'Lunas',
            ];

            $teamNames = $order->users ? $order->users->pluck('name')->implode(', ') : '-';
            $tanggalMasuk = $order->tanggal_masuk_customer
                ? \Carbon\Carbon::parse($order->tanggal_masuk_customer)->format('d/m/Y')
                : '-';

            $rows[] = [
                $index + 1,
                $order->nama_project,
                $order->company_name,
                $order->customer_name,
                $order->phone_number ?: '-',
                $order->jenisInterior?->nama_interior ?? '-',
                ucfirst($order->priority_level ?? 'medium'),
                ucfirst(str_replace('_', ' ', $order->project_status ?? 'pending')),
                $tahapanLabels[$order->tahapan_proyek ?? 'not_start'] ?? $order->tahapan_proyek,
                $paymentLabels[$order->payment_status ?? 'not_start'] ?? $order->payment_status,
                $teamNames,
                $tanggalMasuk,
            ];
        }

        $this->totalRows = count($rows);
        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $this->applyStyles($sheet);
            },
        ];
    }

    protected function applyStyles(Worksheet $sheet): void
    {
        $sheet->getParent()->getDefaultStyle()->getFont()
            ->setName('Arial')->setSize(9);

        // Row 1: Title
        $sheet->mergeCells('A1:L1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(24);

        // Row 2: Subtitle
        $sheet->mergeCells('A2:L2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF64748B']],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(14);

        // Row 3: blank
        $sheet->getRowDimension(3)->setRowHeight(6);

        // Row 4: Summary
        $sheet->getStyle('A4:L4')->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_SUMMARY_BG]],
            'font' => ['bold' => true, 'size' => 9],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => self::COLOR_BORDER]]],
        ]);
        $sheet->getStyle('B4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FF1E293B']],
        ]);
        $sheet->getStyle('E4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FFD97706']],
        ]);
        $sheet->getStyle('H4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FF2563EB']],
        ]);
        $sheet->getStyle('K4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FF16A34A']],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(22);

        // Row 5: print date
        $sheet->mergeCells('A5:L5');
        $sheet->getStyle('A5')->applyFromArray([
            'font' => ['italic' => true, 'size' => 8, 'color' => ['argb' => 'FF94A3B8']],
        ]);
        $sheet->getRowDimension(5)->setRowHeight(14);

        // Row 6: blank
        $sheet->getRowDimension(6)->setRowHeight(6);

        // Row 7: Table Header
        $sheet->getStyle('A7:L7')->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER]],
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 8],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
        ]);
        $sheet->getRowDimension(7)->setRowHeight(22);

        // Data rows (8 onwards)
        $dataStart = 8;
        $dataEnd = $this->totalRows;
        for ($row = $dataStart; $row <= $dataEnd; $row++) {
            $isEven = ($row - $dataStart) % 2 === 0;
            $bgColor = $isEven ? self::COLOR_ROW_EVEN : self::COLOR_ROW_ODD;

            $sheet->getStyle("A{$row}:L{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $bgColor]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => self::COLOR_BORDER]]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ]);

            // No column - center
            $sheet->getStyle("A{$row}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'font' => ['color' => ['argb' => 'FF94A3B8'], 'size' => 8],
            ]);

            // Project name - bold
            $sheet->getStyle("B{$row}")->applyFromArray([
                'font' => ['bold' => true],
            ]);

            // Center align: Prioritas, Status, Tahapan, Pembayaran, Tanggal
            foreach (['G', 'H', 'I', 'J', 'L'] as $col) {
                $sheet->getStyle("{$col}{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
            }

            // Apply badge colors for priority (G)
            $priorityVal = strtolower(trim($sheet->getCell("G{$row}")->getValue() ?? ''));
            if (isset(self::BADGE_COLORS[$priorityVal])) {
                $sheet->getStyle("G{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::BADGE_COLORS[$priorityVal]['bg']]],
                    'font' => ['bold' => true, 'size' => 8, 'color' => ['argb' => self::BADGE_COLORS[$priorityVal]['fg']]],
                ]);
            }

            $sheet->getRowDimension($row)->setRowHeight(20);
        }

        // Outer border on table
        if ($dataEnd >= 7) {
            $sheet->getStyle("A7:L{$dataEnd}")
                ->getBorders()->getOutline()
                ->setBorderStyle(Border::BORDER_MEDIUM)
                ->getColor()->setARGB('FF334155');
        }
    }
}
