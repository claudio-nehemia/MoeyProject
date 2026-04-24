<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class ProjectEvidenceSheet implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents, WithDrawings
{
    protected $data;
    protected $totalRows = 0;
    protected $imagePositions = [];

    const COLOR_HEADER = 'FF1E293B';
    const COLOR_ROOM_BG = 'FF3B82F6';
    const COLOR_STAGE_BG = 'FFEFF6FF';
    const COLOR_STAGE_FG = 'FF2563EB';
    const COLOR_BORDER = 'FFCBD5E1';
    const COLOR_ROW_EVEN = 'FFF8FAFC';
    const COLOR_ROW_ODD = 'FFFFFFFF';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Dokumentasi Foto';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 22,  // Ruangan
            'C' => 22,  // Produk
            'D' => 16,  // Tahapan
            'E' => 18,  // Foto (placeholder)
            'F' => 30,  // Catatan
            'G' => 16,  // Diupload oleh
            'H' => 16,  // Tanggal Upload
        ];
    }

    public function array(): array
    {
        $order = $this->data['order'];
        $groupedProduks = $this->data['groupedProduks'];
        $stageMapping = $this->data['stageMapping'];

        $rows = [];

        // Row 1: Title
        $rows[] = ['DOKUMENTASI TAHAPAN PRODUKSI', '', '', '', '', '', '', ''];
        // Row 2: Subtitle
        $rows[] = [$order->nama_project . ' — ' . $order->company_name, '', '', '', '', '', '', ''];
        // Row 3: Blank
        $rows[] = array_fill(0, 8, '');
        // Row 4: Table header
        $rows[] = ['No', 'Ruangan', 'Produk', 'Tahapan', 'Foto', 'Catatan', 'Diupload Oleh', 'Tanggal Upload'];

        $globalIdx = 1;
        $currentRow = 5; // Excel row (1-indexed), data starts at row 5

        foreach ($groupedProduks as $roomName => $produks) {
            foreach ($produks as $produk) {
                if (empty($produk['stage_evidences'])) {
                    continue;
                }

                foreach ($stageMapping as $shortName => $internalName) {
                    if (!isset($produk['stage_evidences'][$internalName])) {
                        continue;
                    }

                    foreach ($produk['stage_evidences'][$internalName] as $evidence) {
                        $imgPath = storage_path('app/public/' . $evidence['path']);
                        $hasImage = file_exists($imgPath);

                        $rows[] = [
                            $globalIdx++,
                            $roomName,
                            $produk['nama_produk'],
                            $shortName . ' (' . $internalName . ')',
                            $hasImage ? '📷' : '-',
                            $evidence['notes'] ?? '-',
                            $evidence['uploaded_by'] ?? '-',
                            $evidence['created_at'] ?? '-',
                        ];

                        if ($hasImage) {
                            $this->imagePositions[] = [
                                'path' => $imgPath,
                                'row' => $currentRow,
                                'col' => 'E',
                            ];
                        }

                        $currentRow++;
                    }
                }
            }
        }

        $this->totalRows = count($rows);
        return $rows;
    }

    public function drawings()
    {
        $drawings = [];

        foreach ($this->imagePositions as $pos) {
            if (!file_exists($pos['path'])) {
                continue;
            }

            $drawing = new Drawing();
            $drawing->setName('Evidence');
            $drawing->setDescription('Stage Evidence Photo');
            $drawing->setPath($pos['path']);
            $drawing->setHeight(60);
            $drawing->setCoordinates($pos['col'] . $pos['row']);
            $drawing->setOffsetX(5);
            $drawing->setOffsetY(3);

            $drawings[] = $drawing;
        }

        return $drawings;
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
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(22);

        // Row 2: Subtitle
        $sheet->mergeCells('A2:H2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF64748B']],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(14);

        // Row 3: blank
        $sheet->getRowDimension(3)->setRowHeight(6);

        // Row 4: Table header
        $sheet->getStyle('A4:H4')->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER]],
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 8],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(20);

        // Data rows
        for ($row = 5; $row <= $this->totalRows; $row++) {
            $isEven = ($row - 5) % 2 === 0;
            $bgColor = $isEven ? self::COLOR_ROW_EVEN : self::COLOR_ROW_ODD;

            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $bgColor]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => self::COLOR_BORDER]]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ]);

            // No column - center
            $sheet->getStyle("A{$row}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'font' => ['color' => ['argb' => 'FF94A3B8'], 'size' => 8],
            ]);

            // Tahapan column - blue bg
            $sheet->getStyle("D{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_STAGE_BG]],
                'font' => ['bold' => true, 'color' => ['argb' => self::COLOR_STAGE_FG], 'size' => 8],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            // Set row height for images
            $hasImage = false;
            foreach ($this->imagePositions as $pos) {
                if ($pos['row'] === $row) {
                    $hasImage = true;
                    break;
                }
            }
            $sheet->getRowDimension($row)->setRowHeight($hasImage ? 50 : 18);
        }

        // Outer border on table
        if ($this->totalRows >= 4) {
            $sheet->getStyle("A4:H{$this->totalRows}")
                ->getBorders()->getOutline()
                ->setBorderStyle(Border::BORDER_MEDIUM)
                ->getColor()->setARGB('FF334155');
        }
    }
}
