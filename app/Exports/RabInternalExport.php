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

class RabInternalExport implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $data;

    // Color palette constants for RabInternal
    const COLOR_HEADER_DARK  = 'FF1E293B'; // Dark navy for main header
    const COLOR_ROOM_BG      = 'FF06B6D4'; // Cyan for room header
    
    // Colored column sections for visual distinction (warna-warni)
    const COLOR_FD_FL_BG     = 'FFEFF6FF'; // Light blue tint
    const COLOR_FD_FL_FG     = 'FF1D4ED8'; 
    
    const COLOR_DASAR_BG     = 'FFECFDF5'; // Light green tint
    const COLOR_DASAR_FG     = 'FF047857';
    
    const COLOR_BBFIN_BG     = 'FFF5F3FF'; // Light purple tint
    const COLOR_BBFIN_FG     = 'FF6D28D9';
    
    const COLOR_SATUAN_BG    = 'FFE0E7FF'; // Light indigo tint
    const COLOR_SATUAN_FG    = 'FF4338CA';
    
    const COLOR_AKS_BG       = 'FFFFF7ED'; // Light orange tint
    const COLOR_AKS_FG       = 'FFC2410C';
    
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
        return 'RAB Internal';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,   // NO
            'B' => 30,  // PRODUK & SPESIFIKASI
            'C' => 22,  // BAHAN BAKU
            'D' => 22,  // FINISHING DALAM
            'E' => 14,  // HARGA FD
            'F' => 22,  // FINISHING LUAR
            'G' => 14,  // HARGA FL
            'H' => 8,   // QTY
            'I' => 16,  // HARGA DASAR
            'J' => 16,  // TOTAL BB+FIN
            'K' => 10,  // MARKUP %
            'L' => 16,  // HARGA SATUAN
            'M' => 22,  // AKSESORIS
            'N' => 10,  // QTY AKS
            'O' => 12,  // MARKUP AKS %
            'P' => 16,  // HARGA AKS
            'Q' => 10,  // DISKON %
            'R' => 18,  // GRAND TOTAL
        ];
    }

    public function array(): array
    {
        $rabInternal = $this->data['rabInternal'];
        $produks = $this->data['produks'];
        $totalSemua = $this->data['totalSemuaProduk'];

        $rows = [];
        $this->rowMeta = [];

        // ─── Row 1: Title
        $rows[] = ['RANCANGAN ANGGARAN BIAYA INTERNAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'title'];

        // ─── Row 2: Sub-title / Project Name
        $rows[] = ['Project: ' . $rabInternal->itemPekerjaan->moodboard->order->nama_project, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // ─── Row 3: Company & Customer Info
        $rows[] = [
            'Company: ' . $rabInternal->itemPekerjaan->moodboard->order->company_name . '   |   Customer: ' . $rabInternal->itemPekerjaan->moodboard->order->customer_name,
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // ─── Row 4: Response Info
        $rows[] = [
            'Response By: ' . $rabInternal->response_by . '   |   Response Time: ' . \Carbon\Carbon::parse($rabInternal->response_time)->format('d F Y H:i'),
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // ─── Row 5: Blank
        $rows[] = array_fill(0, 18, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // ─── Row 6: Table Header
        $rows[] = [
            'NO', 'PRODUK & SPESIFIKASI', 'BAHAN BAKU', 
            'FINISHING DALAM', 'HARGA FD', 'FINISHING LUAR', 'HARGA FL', 
            'QTY', 'HARGA DASAR', 'TOTAL BB+FIN', 'MARKUP', 'HARGA SATUAN', 
            'AKSESORIS', 'QTY AKS', 'MARKUP AKS', 'HARGA AKS', 'DISKON', 'GRAND TOTAL'
        ];
        $this->rowMeta[] = ['type' => 'thead'];

        // ─── Data rows
        $globalIdx = 1;

        // Group by Ruangan
        $grouped = [];
        foreach ($produks as $produk) {
            $ruangan = $produk['nama_ruangan'] ?: 'Tanpa Ruangan';
            $grouped[$ruangan][] = $produk;
        }

        foreach ($grouped as $roomName => $roomProduks) {
            // Room header row
            $rows[] = [$roomName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
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

                $totalBBPlusFinishing = $produk['harga_dasar'] + $finishingDalamTotal + $finishingLuarTotal;
                $aksesorisData = $produk['aksesoris'] ?? [];
                
                $maxRows = max(
                    count($bahanBakuNames),
                    count($finishingDalamItems),
                    count($finishingLuarItems),
                    count($aksesorisData),
                    1
                );

                $startRow = count($rows) + 1; // 1-indexed

                for ($rowIndex = 0; $rowIndex < $maxRows; $rowIndex++) {
                    $row = [];
                    if ($rowIndex === 0) {
                        $row[] = $globalIdx++;
                        $dimStr = ($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                            ? "\n({$produk['panjang']} × {$produk['lebar']} × {$produk['tinggi']} m)"
                            : '';
                        $row[] = $produk['nama_produk'] . $dimStr;
                    } else {
                        $row[] = '';
                        $row[] = '';
                    }

                    // Bahan Baku
                    $row[] = $bahanBakuNames[$rowIndex] ?? '';

                    // Finishing Dalam
                    $row[] = $finishingDalamItems[$rowIndex] ?? '';
                    
                    // Harga FD (only on first row)
                    $row[] = ($rowIndex === 0) ? $finishingDalamTotal : '';

                    // Finishing Luar
                    $row[] = $finishingLuarItems[$rowIndex] ?? '';

                    // Harga FL (only on first row)
                    $row[] = ($rowIndex === 0) ? $finishingLuarTotal : '';

                    if ($rowIndex === 0) {
                        $row[] = $produk['qty_produk'];
                        $row[] = $produk['harga_dasar'];
                        $row[] = $totalBBPlusFinishing;
                        $row[] = $produk['markup_satuan'] / 100; // write as decimal
                        $row[] = $produk['harga_satuan'];
                    } else {
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                    }

                    // Aksesoris
                    if (isset($aksesorisData[$rowIndex])) {
                        $row[] = $aksesorisData[$rowIndex]['nama_aksesoris'];
                        $row[] = $aksesorisData[$rowIndex]['qty_aksesoris'];
                        $row[] = $aksesorisData[$rowIndex]['markup_aksesoris'] / 100;
                        $row[] = $aksesorisData[$rowIndex]['harga_total'];
                    } else {
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                    }

                    if ($rowIndex === 0) {
                        $row[] = $produk['diskon_per_produk'] / 100;
                        $row[] = $produk['harga_akhir'];
                    } else {
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

        // Grand Total row at the end
        $rows[] = [
            'GRAND TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', $totalSemua
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
        // Default font
        $sheet->getParent()->getDefaultStyle()->getFont()
            ->setName('Segoe UI')->setSize(9);

        // Apply styles row by row
        foreach ($this->rowMeta as $i => $meta) {
            $excelRow = $i + 1;
            $this->styleRow($sheet, $excelRow, $meta);
        }

        // Set borders for the table area (excluding headers & title section)
        $tableStart = 6;
        $tableEnd   = $this->totalRows;
        
        $sheet->getStyle("A{$tableStart}:R{$tableEnd}")
            ->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)
            ->getColor()->setARGB(self::COLOR_BORDER);
    }

    protected function styleRow(Worksheet $sheet, int $row, array $meta): void
    {
        switch ($meta['type']) {
            case 'title':
                $sheet->mergeCells("A{$row}:R{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => 'FFD97706']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(26);
                break;

            case 'subtitle':
                $sheet->mergeCells("A{$row}:R{$row}");
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
                $sheet->getStyle("A{$row}:R{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER_DARK]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 9],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;

            case 'room':
                $sheet->mergeCells("A{$row}:R{$row}");
                $sheet->getStyle("A{$row}:R{$row}")->applyFromArray([
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

                // Base style for the entire row (applied to individual cells)
                $sheet->getStyle("A{$row}:R{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $zebraColor]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // Wrap Text and alignment for Product column
                $sheet->getStyle("B{$row}")->getAlignment()->setWrapText(true);
                $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Material / Finishing Names - align left
                $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("M{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Highlight color columns
                $sheet->getStyle("E{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_FD_FL_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_FD_FL_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("G{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_FD_FL_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_FD_FL_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("I{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_DASAR_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_DASAR_FG]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("J{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_BBFIN_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_BBFIN_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("L{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_SATUAN_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_SATUAN_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                
                // Aksesoris columns formatting
                $sheet->getStyle("P{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_AKS_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_AKS_FG]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);

                // Grand Total column formatting
                $sheet->getStyle("R{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_TOTAL_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_TOTAL_FG], 'bold' => true, 'size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);

                // Merge cells if multi-row product
                if ($rowIndex === 0 && $maxRows > 1) {
                    $sheet->mergeCells("A{$startRow}:A{$endRow}");
                    $sheet->mergeCells("B{$startRow}:B{$endRow}");
                    $sheet->mergeCells("E{$startRow}:E{$endRow}");
                    $sheet->mergeCells("G{$startRow}:G{$endRow}");
                    $sheet->mergeCells("H{$startRow}:H{$endRow}");
                    $sheet->mergeCells("I{$startRow}:I{$endRow}");
                    $sheet->mergeCells("J{$startRow}:J{$endRow}");
                    $sheet->mergeCells("K{$startRow}:K{$endRow}");
                    $sheet->mergeCells("L{$startRow}:L{$endRow}");
                    $sheet->mergeCells("P{$startRow}:P{$endRow}");
                    $sheet->mergeCells("Q{$startRow}:Q{$endRow}");
                    $sheet->mergeCells("R{$startRow}:R{$endRow}");
                }

                // Apply Number formats to row columns
                $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("L{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("P{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("R{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                
                $sheet->getStyle("K{$row}")->getNumberFormat()->setFormatCode('0%');
                $sheet->getStyle("O{$row}")->getNumberFormat()->setFormatCode('0%');
                $sheet->getStyle("Q{$row}")->getNumberFormat()->setFormatCode('0%');

                if ($rowIndex === 0) {
                    $hasDimensions = $meta['hasDimensions'] ?? false;
                    $sheet->getRowDimension($row)->setRowHeight($hasDimensions ? 32 : 20);
                } else {
                    $sheet->getRowDimension($row)->setRowHeight(20);
                }
                break;

            case 'grand_total':
                $sheet->mergeCells("A{$row}:Q{$row}");
                $sheet->getStyle("A{$row}:R{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF7C3AED']], // Deep Purple
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("R{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("R{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;
        }
    }
}
