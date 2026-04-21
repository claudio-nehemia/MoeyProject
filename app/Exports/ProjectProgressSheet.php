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
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

class ProjectProgressSheet implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $data;

    // Color palette (matching reference image)
    const COLOR_HEADER_DARK  = 'FF1E293B'; // Dark navy - main header
    const COLOR_HEADER_MID   = 'FF334155'; // Slightly lighter nav
    const COLOR_ROOM_BG      = 'FF3B82F6'; // Blue room row
    const COLOR_ROOM_TEXT    = 'FFFFFFFF'; // White
    const COLOR_GREY_LABEL   = 'FFF1F5F9'; // Light grey label bg
    const COLOR_PINK_BG      = 'FFFFF1F2'; // Pink bg for customer area
    const COLOR_RED_CUSTOMER = 'FFBE123C'; // Customer name color
    const COLOR_CHECK_BG     = 'FFF0FDF4'; // Light green bg for checked cell
    const COLOR_CHECK_FG     = 'FF16A34A'; // Green checkmark
    const COLOR_BAST_BG      = 'FFEDE9FE'; // Purple tint for BAST
    const COLOR_BAST_FG      = 'FF7C3AED'; // Purple
    const COLOR_BOBOT_FG     = 'FF1E40AF'; // Blue for bobot text
    const COLOR_ROW_EVEN     = 'FFF8FAFC'; // Zebra even
    const COLOR_ROW_ODD      = 'FFFFFFFF'; // Zebra odd
    const COLOR_BORDER        = 'FFCBD5E1'; // Border color
    const COLOR_PROGRESS_BAR  = 'FF3B82F6'; // Progress bar fill
    const COLOR_STAGE_HEADER  = 'FF0F172A'; // Stage columns header bg

    // Track which rows are room rows, item rows, and their types
    protected $rowMeta = [];
    protected $totalRows = 0;
    protected $lastCol = 'P'; // A(no) B(name) C(qty) D(sat) E(material) F(bobot) G-O(stages) P(BAST)
    protected $stageColumns; // map stage label => col letter

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Progress Report';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // NO
            'B' => 28,  // Jenis Pekerjaan
            'C' => 6,   // Qty
            'D' => 8,   // Satuan
            'E' => 28,  // Material
            'F' => 8,   // Bobot
            'G' => 8,   // Potong
            'H' => 8,   // Rangkai
            'I' => 7,   // Fin
            'J' => 8,   // Fin QC
            'K' => 9,   // Packing
            'L' => 8,   // Kirim
            'M' => 7,   // Trap
            'N' => 8,   // Instal
            'O' => 8,   // Ins QC
            'P' => 8,   // BAST
        ];
    }

    public function array(): array
    {
        $order      = $this->data['order'];
        $kontrakInfo = $this->data['kontrakInfo'];
        $targets    = $this->data['targets'];
        $groupedProduks = $this->data['groupedProduks'];
        $stageMapping   = $this->data['stageMapping']; // short => internal

        $rows = [];
        $this->rowMeta = [];

        // ─── Row 1: Title ───────────────────────────────────────────────
        $rows[] = ['PROJECT PROGRESS REPORT', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'title'];

        // ─── Row 2: Sub-title ────────────────────────────────────────────
        $rows[] = [$order->nama_project . ' — ' . $order->company_name, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // ─── Row 3: Blank ────────────────────────────────────────────────
        $rows[] = array_fill(0, 16, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // ─── Rows 4-6: Info header ───────────────────────────────────────
        $gambarKerjaDate = $order->gambarKerja->approved_time
            ? $order->gambarKerja->approved_time->format('d/m/Y')
            : '-';

        $rows[] = ['Tanggal Kontrak', $kontrakInfo['tanggal_mulai'] ?? '-', '', 'Customer', '', $order->customer_name, '', '', '', '', 'Target Progres 50%', '', $targets['50'] ?? '-', '', '', ''];
        $this->rowMeta[] = ['type' => 'info_row', 'row_num' => 4];

        $rows[] = ['Approval Gambar Kerja', $gambarKerjaDate, '', '', '', '', '', '', '', '', 'Target Progres 80%', '', $targets['80'] ?? '-', '', '', ''];
        $this->rowMeta[] = ['type' => 'info_row', 'row_num' => 5];

        $rows[] = ['Jangka Waktu', ($kontrakInfo['durasi_kontrak'] ?? '-') . ' Hari', '', '', '', '', '', '', '', '', 'Target Progres 100%', '', $targets['100'] ?? '-', '', '', ''];
        $this->rowMeta[] = ['type' => 'info_row', 'row_num' => 6];

        // ─── Row 7: Blank ────────────────────────────────────────────────
        $rows[] = array_fill(0, 16, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // ─── Row 8: Progress bar (text representation) ──────────────────
        $progressPct = number_format($order->progress, 2);
        $rows[] = ['Total Progress:', $progressPct . '%', '', 'Hari Ini:', now()->format('d/m/Y'), '', '', '', '', '', 'Progress', '', '', $progressPct . '%', '', ''];
        $this->rowMeta[] = ['type' => 'progress'];

        // ─── Row 9: Deadline row ─────────────────────────────────────────
        // Calculate deadline percentage if available
        $deadlinePct = '-';
        $rows[] = ['', '', '', '', '', '', '', '', '', '', 'Deadline', '', '', $deadlinePct, '', ''];
        $this->rowMeta[] = ['type' => 'deadline'];

        // ─── Row 10: blank ───────────────────────────────────────────────
        $rows[] = array_fill(0, 16, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // ─── Row 11: Table header row 1 ──────────────────────────────────
        $rows[] = ['NO', 'JENIS PEKERJAAN', 'Qty', 'Satuan', 'Material', 'Bobot',
                   'Potong', 'Rangkai', 'Fin', 'Fin QC', 'Packing', 'Kirim', 'Trap', 'Instal', 'Ins QC', 'BAST'];
        $this->rowMeta[] = ['type' => 'thead1'];

        // ─── Row 12: Table header row 2 (percentages) ───────────────────
        $rows[] = ['', '', '', '', '', '',
                   '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'];
        $this->rowMeta[] = ['type' => 'thead2'];

        // ─── Data rows ───────────────────────────────────────────────────
        $globalIdx = 1;
        foreach ($groupedProduks as $roomName => $produks) {
            // Room header row
            $rows[] = [$roomName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            $this->rowMeta[] = ['type' => 'room'];

            foreach ($produks as $i => $produk) {
                $stageLabels = array_values($stageMapping); // internal stage labels in order

                $row = [
                    $globalIdx++,
                    $produk['nama_produk'],
                    $produk['quantity'],
                    'Unit',
                    $produk['material_summary'],
                    number_format($produk['weight_percentage'], 2) . '%',
                ];

                // Stages G-O
                foreach ($stageLabels as $label) {
                    $row[] = $produk['reached_stages'][$label] ? '✓' : '';
                }

                // BAST
                $row[] = $produk['has_bast'] ? '✓' : '';

                $rows[] = $row;
                $this->rowMeta[] = ['type' => 'item', 'zebra' => $i % 2];
            }
        }

        $this->totalRows = count($rows);
        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        // Minimal styles via this method; detailed ones in WithEvents AfterSheet
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $this->applyAllStyles($sheet);
            },
        ];
    }

    protected function applyAllStyles(Worksheet $sheet): void
    {
        // Default font for all
        $sheet->getParent()->getDefaultStyle()->getFont()
            ->setName('Arial')->setSize(9);

        foreach ($this->rowMeta as $i => $meta) {
            $excelRow = $i + 1;
            $this->styleRow($sheet, $excelRow, $meta);
        }

        // Outer border on table
        $tableStart = $this->findFirstRowOfType('thead1') + 1;
        $tableEnd   = $this->totalRows;
        if ($tableStart && $tableEnd >= $tableStart) {
            $sheet->getStyle("A{$tableStart}:P{$tableEnd}")
                ->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN)
                ->getColor()->setARGB(self::COLOR_BORDER);
        }
    }

    protected function styleRow(Worksheet $sheet, int $row, array $meta): void
    {
        switch ($meta['type']) {

            case 'title':
                $sheet->mergeCells("A{$row}:P{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => 'FF1E293B']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(24);
                break;

            case 'subtitle':
                $sheet->mergeCells("A{$row}:P{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF64748B']],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(14);
                break;

            case 'blank':
                $sheet->getRowDimension($row)->setRowHeight(6);
                break;

            case 'info_row':
                // Label cells A (col 1) - grey bg
                foreach (['A', 'K'] as $labelCol) {
                    $sheet->getStyle("{$labelCol}{$row}")->applyFromArray([
                        'fill'  => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFF1F5F9']],
                        'font'  => ['bold' => true, 'size' => 9],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                }
                // Value cells
                foreach (['B', 'M'] as $valCol) {
                    $sheet->getStyle("{$valCol}{$row}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                }
                // Customer area: D-F pink bg, merged across rows 4-6
                $rowNum = $meta['row_num'];
                if ($rowNum === 4) {
                    // Merge D4:J6 for customer block
                    $sheet->mergeCells("D4:J6");
                    $sheet->getStyle("D4:J6")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFF1F2']],
                        'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => self::COLOR_RED_CUSTOMER]],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                    // Customer label merge C4:C6
                    $sheet->mergeCells("C4:C6");
                    $sheet->getStyle("C4")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFF1F2']],
                        'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FFBE123C']],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                    // Merge A4:A4, B4:B4, K4:L4, M4:M4 for clean borders
                    $sheet->getStyle("A{$row}:B{$row}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                    $sheet->getStyle("K{$row}:M{$row}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                    ]);
                }
                $sheet->getRowDimension($row)->setRowHeight(18);
                break;

            case 'progress':
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 9],
                ]);
                $sheet->getStyle("B{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_PROGRESS_BAR], 'size' => 10],
                ]);
                $sheet->getStyle("K{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 9],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFFEF3C7']],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                ]);
                $sheet->getStyle("M{$row}:N{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_PROGRESS_BAR]],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFDBEAFE']],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(18);
                break;

            case 'deadline':
                $sheet->getStyle("K{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 9],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFFEF3C7']],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                ]);
                $sheet->getStyle("M{$row}:N{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFEA580C']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FFFFF7ED']],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(16);
                break;

            case 'thead1':
                $sheet->getStyle("A{$row}:P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER_DARK]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 8],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
                ]);
                // BAST column special color
                $sheet->getStyle("P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF7C3AED']],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                ]);
                // TAHAPAN PRODUKSI sub-header span color
                $sheet->getStyle("G{$row}:O{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_STAGE_HEADER]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(22);
                break;

            case 'thead2':
                $sheet->getStyle("A{$row}:P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER_DARK]],
                    'font' => ['color' => ['argb' => 'FFCBD5E1'], 'size' => 7.5],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
                ]);
                $sheet->getStyle("P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF7C3AED']],
                    'font' => ['color' => ['argb' => 'FFFFFFFF']],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(14);
                break;

            case 'room':
                $sheet->mergeCells("A{$row}:P{$row}");
                $sheet->getStyle("A{$row}:P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_ROOM_BG]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 9],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 2],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF2563EB']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(18);
                break;

            case 'item':
                $bgColor = $meta['zebra'] === 0 ? self::COLOR_ROW_EVEN : self::COLOR_ROW_ODD;
                // Base row style
                $sheet->getStyle("A{$row}:P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $bgColor]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => self::COLOR_BORDER]]],
                ]);
                // Column A: NO - center, grey text
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['color' => ['argb' => 'FF94A3B8'], 'size' => 8],
                ]);
                // Column B: Product name - left aligned
                $sheet->getStyle("B{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'indent' => 1],
                    'font' => ['size' => 9],
                ]);
                // Column E: Material - left aligned, smaller
                $sheet->getStyle("E{$row}")->applyFromArray([
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'indent' => 1, 'wrapText' => true],
                    'font' => ['size' => 7.5, 'color' => ['argb' => 'FF475569']],
                ]);
                // Column F: Bobot - bold blue
                $sheet->getStyle("F{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_BOBOT_FG]],
                ]);
                // Stage columns G-O: check cells get green tint
                $stageCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
                foreach ($stageCols as $col) {
                    $cellVal = $sheet->getCell("{$col}{$row}")->getValue();
                    if ($cellVal === '✓') {
                        $sheet->getStyle("{$col}{$row}")->applyFromArray([
                            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_CHECK_BG]],
                            'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_CHECK_FG], 'size' => 11],
                        ]);
                    }
                }
                // BAST column P: check cells get purple tint
                $bastVal = $sheet->getCell("P{$row}")->getValue();
                if ($bastVal === '✓') {
                    $sheet->getStyle("P{$row}")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_BAST_BG]],
                        'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_BAST_FG], 'size' => 11],
                    ]);
                }
                $sheet->getRowDimension($row)->setRowHeight(18);
                break;
        }
    }

    protected function findFirstRowOfType(string $type): ?int
    {
        foreach ($this->rowMeta as $i => $meta) {
            if ($meta['type'] === $type) {
                return $i + 1;
            }
        }
        return null;
    }
}