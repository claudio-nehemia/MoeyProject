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

class RabJasaExport implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $data;

    // Color palette constants
    const COLOR_HEADER_DARK  = 'FF1E293B'; // Dark navy for main header
    const COLOR_ROOM_BG      = 'FF06B6D4'; // Cyan for room header
    
    const COLOR_JASA_BG      = 'FFECFDF5'; // Light green tint
    const COLOR_JASA_FG      = 'FF047857';
    
    const COLOR_ITEMS_BG     = 'FFF5F3FF'; // Light purple tint
    const COLOR_ITEMS_FG     = 'FF6D28D9';
    
    const COLOR_TOTAL_BG     = 'FFE8F5E9'; // Soft green for Grand Total column
    const COLOR_TOTAL_FG     = 'FF1B5E20';
    
    const COLOR_ROW_EVEN     = 'FFF8FAFC'; // Zebra even
    const COLOR_ROW_ODD      = 'FFFFFFFF'; // Zebra odd
    const COLOR_BORDER       = 'FFCBD5E1'; // Border color

    protected $rowMeta = [];
    protected $totalRows = 0;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'RAB Jasa';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,   // NO
            'B' => 30,  // PRODUK & SPESIFIKASI
            'C' => 16,  // HARGA JASA
            'D' => 22,  // BAHAN BAKU
            'E' => 22,  // FINISHING DALAM
            'F' => 22,  // FINISHING LUAR
            'G' => 8,   // QTY
            'H' => 16,  // TOTAL ITEMS
            'I' => 18,  // GRAND TOTAL
        ];
    }

    public function array(): array
    {
        $rabJasa = $this->data['rabJasa'];
        $produks = $this->data['produks'];
        $totalSemua = $this->data['totalSemuaProduk'];

        $rows = [];
        $this->rowMeta = [];

        // Title
        $rows[] = ['RANCANGAN ANGGARAN BIAYA JASA', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'title'];

        // Subtitle / Project Info
        $rows[] = ['Project: ' . $rabJasa->itemPekerjaan->moodboard->order->nama_project, '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'subtitle'];

        $rows[] = [
            'Company: ' . $rabJasa->itemPekerjaan->moodboard->order->company_name . '   |   Customer: ' . $rabJasa->itemPekerjaan->moodboard->order->customer_name,
            '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        $rows[] = [
            'Response By: ' . $rabJasa->response_by . '   |   Response Time: ' . \Carbon\Carbon::parse($rabJasa->response_time)->format('d F Y H:i'),
            '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // Blank
        $rows[] = array_fill(0, 9, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // Table Header
        $rows[] = [
            'NO', 'PRODUK & SPESIFIKASI', 'HARGA JASA', 
            'BAHAN BAKU', 'FINISHING DALAM', 'FINISHING LUAR', 
            'QTY', 'TOTAL ITEMS', 'GRAND TOTAL'
        ];
        $this->rowMeta[] = ['type' => 'thead'];

        $globalIdx = 1;

        // Group by Ruangan
        $grouped = [];
        foreach ($produks as $produk) {
            $ruangan = $produk['nama_ruangan'] ?: 'Tanpa Ruangan';
            $grouped[$ruangan][] = $produk;
        }

        foreach ($grouped as $roomName => $roomProduks) {
            $rows[] = [$roomName, '', '', '', '', '', '', '', ''];
            $this->rowMeta[] = ['type' => 'room', 'room_name' => $roomName];

            foreach ($roomProduks as $produkIndex => $produk) {
                $bahanBakuNames = $produk['bahan_baku_names'] ?? [];
                
                $finishingDalamItems = [];
                $finishingLuarItems = [];
                $finishingDalamTotal = 0;
                $finishingLuarTotal = 0;

                foreach ($produk['jenis_items'] as $jenisItem) {
                    $namaJenis = strtolower($jenisItem['nama_jenis']);
                    foreach ($jenisItem['items'] as $item) {
                        if ($namaJenis === 'finishing dalam') {
                            $finishingDalamItems[] = $item['nama_item'];
                            $finishingDalamTotal += $item['harga_total'];
                        } elseif ($namaJenis === 'finishing luar') {
                            $finishingLuarItems[] = $item['nama_item'];
                            $finishingLuarTotal += $item['harga_total'];
                        }
                    }
                }

                $totalItems = $finishingDalamTotal + $finishingLuarTotal;
                
                $maxRows = max(
                    count($bahanBakuNames),
                    count($finishingDalamItems),
                    count($finishingLuarItems),
                    1
                );

                $startRow = count($rows) + 1;

                for ($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++) {
                    $row = [];
                    if ($rowIndex === 0) {
                        $row[] = $globalIdx++;
                        $dimStr = ($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                            ? "\n({$produk['panjang']} × {$produk['lebar']} × {$produk['tinggi']} cm)"
                            : '';
                        $row[] = $produk['nama_produk'] . $dimStr;
                    } else {
                        $row[] = '';
                        $row[] = '';
                    }

                    $row[] = ($rowIndex === 0) ? $produk['harga_dasar'] : '';
                    $row[] = $bahanBakuNames[$rowIndex] ?? '';
                    $row[] = $finishingDalamItems[$rowIndex] ?? '';
                    $row[] = $finishingLuarItems[$rowIndex] ?? '';

                    if ($rowIndex === 0) {
                        $row[] = $produk['qty_produk'];
                        $row[] = $totalItems;
                        $row[] = $produk['harga_akhir'];
                    } else {
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                    }

                    $rows[] = $row;
                    $this->rowMeta[] = [
                        'type' => 'item',
                        'rowIndex' => $rowIndex,
                        'maxRows' => $maxRows,
                        'startRow' => $startRow,
                        'zebra' => $produkIndex % 2,
                        'hasDimensions' => ($produk['panjang'] && $produk['lebar'] && $produk['tinggi']) ? true : false
                    ];
                }
            }
        }

        // Grand Total row
        $rows[] = [
            'GRAND TOTAL', '', '', '', '', '', '', '', $totalSemua
        ];
        $this->rowMeta[] = ['type' => 'grand_total'];

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
                $this->applyAllStyles($sheet);
            },
        ];
    }

    protected function applyAllStyles(Worksheet $sheet): void
    {
        $sheet->getParent()->getDefaultStyle()->getFont()
            ->setName('Segoe UI')->setSize(9);

        foreach ($this->rowMeta as $i => $meta) {
            $excelRow = $i + 1;
            $this->styleRow($sheet, $excelRow, $meta);
        }

        $tableStart = 6;
        $tableEnd   = $this->totalRows;
        
        $sheet->getStyle("A{$tableStart}:I{$tableEnd}")
            ->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)
            ->getColor()->setARGB(self::COLOR_BORDER);
    }

    protected function styleRow(Worksheet $sheet, int $row, array $meta): void
    {
        switch ($meta['type']) {
            case 'title':
                $sheet->mergeCells("A{$row}:I{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => 'FF16A34A']], // Green accent
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(26);
                break;

            case 'subtitle':
                $sheet->mergeCells("A{$row}:I{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF475569']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(16);
                break;

            case 'blank':
                $sheet->getRowDimension($row)->setRowHeight(10);
                break;

            case 'thead':
                $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER_DARK]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 9],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;

            case 'room':
                $sheet->mergeCells("A{$row}:I{$row}");
                $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_ROOM_BG]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF0891B2']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(22);
                break;

            case 'item':
                $zebraColor = $meta['zebra'] === 0 ? self::COLOR_ROW_EVEN : self::COLOR_ROW_ODD;
                $startRow = $meta['startRow'];
                $rowIndex = $meta['rowIndex'];
                $maxRows = $meta['maxRows'];
                $endRow = $startRow + $maxRows - 1;

                $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $zebraColor]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->getStyle("B{$row}")->getAlignment()->setWrapText(true)->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Hilights
                $sheet->getStyle("C{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_JASA_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_JASA_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("H{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_ITEMS_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_ITEMS_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_TOTAL_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_TOTAL_FG], 'bold' => true, 'size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);

                if ($rowIndex === 0 && $maxRows > 1) {
                    $sheet->mergeCells("A{$startRow}:A{$endRow}");
                    $sheet->mergeCells("B{$startRow}:B{$endRow}");
                    $sheet->mergeCells("C{$startRow}:C{$endRow}");
                    $sheet->mergeCells("G{$startRow}:G{$endRow}");
                    $sheet->mergeCells("H{$startRow}:H{$endRow}");
                    $sheet->mergeCells("I{$startRow}:I{$endRow}");
                }

                $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');

                if ($rowIndex === 0) {
                    $hasDimensions = $meta['hasDimensions'] ?? false;
                    $sheet->getRowDimension($row)->setRowHeight($hasDimensions ? 32 : 20);
                } else {
                    $sheet->getRowDimension($row)->setRowHeight(20);
                }
                break;

            case 'grand_total':
                $sheet->mergeCells("A{$row}:H{$row}");
                $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF16A34A']], // Green accent
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;
        }
    }
}
