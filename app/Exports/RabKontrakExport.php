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

class RabKontrakExport implements FromArray, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $data;

    // Color palette constants
    const COLOR_HEADER_DARK  = 'FF1E293B'; // Dark navy for main header
    const COLOR_ROOM_BG      = 'FF06B6D4'; // Cyan for room header
    
    const COLOR_SATUAN_BG    = 'FFECFDF5'; // Light green tint
    const COLOR_SATUAN_FG    = 'FF047857';
    
    const COLOR_ITEM_BG      = 'FFF5F3FF'; // Light purple tint
    const COLOR_ITEM_FG      = 'FF6D28D9';
    
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
        return 'RAB Kontrak';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,   // NO
            'B' => 30,  // PRODUK & SPESIFIKASI
            'C' => 22,  // BAHAN BAKU
            'D' => 22,  // FINISHING DALAM
            'E' => 22,  // FINISHING LUAR
            'F' => 8,   // QTY
            'G' => 16,  // HARGA SATUAN
            'H' => 16,  // TOTAL ITEM
            'I' => 22,  // AKSESORIS
            'J' => 10,  // QTY AKS
            'K' => 16,  // HARGA AKS
            'L' => 16,  // TOTAL AKS
            'M' => 18,  // GRAND TOTAL
        ];
    }

    public function array(): array
    {
        $rabKontrak = $this->data['rabKontrak'];
        $produks = $this->data['produks'];
        $totalSemua = $this->data['totalSemuaProduk'];

        $rows = [];
        $this->rowMeta = [];

        // Title
        $rows[] = ['RANCANGAN ANGGARAN BIAYA KONTRAK', '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'title'];

        // Subtitle / Project Info
        $rows[] = ['Project: ' . $rabKontrak->itemPekerjaan->moodboard->order->nama_project, '', '', '', '', '', '', '', '', '', '', '', ''];
        $this->rowMeta[] = ['type' => 'subtitle'];

        $rows[] = [
            'Company: ' . $rabKontrak->itemPekerjaan->moodboard->order->company_name . '   |   Customer: ' . $rabKontrak->itemPekerjaan->moodboard->order->customer_name,
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        $rows[] = [
            'Response By: ' . $rabKontrak->response_by . '   |   Response Time: ' . \Carbon\Carbon::parse($rabKontrak->response_time)->format('d F Y H:i'),
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $this->rowMeta[] = ['type' => 'subtitle'];

        // Blank
        $rows[] = array_fill(0, 13, '');
        $this->rowMeta[] = ['type' => 'blank'];

        // Table Header
        $rows[] = [
            'NO', 'PRODUK & SPESIFIKASI', 'BAHAN BAKU', 
            'FINISHING DALAM', 'FINISHING LUAR', 
            'QTY', 'HARGA SATUAN', 'TOTAL ITEM',
            'AKSESORIS', 'QTY AKS', 'HARGA AKS', 'TOTAL AKS', 'GRAND TOTAL'
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
            $rows[] = [$roomName, '', '', '', '', '', '', '', '', '', '', '', ''];
            $this->rowMeta[] = ['type' => 'room', 'room_name' => $roomName];

            foreach ($roomProduks as $produkIndex => $produk) {
                $bahanBakuNames = $produk['bahan_baku_names'] ?? [];
                
                $finishingDalamItems = [];
                $finishingLuarItems = [];

                foreach ($produk['jenis_items'] as $jenisItem) {
                    $namaJenis = strtolower($jenisItem['nama_jenis']);
                    foreach ($jenisItem['items'] as $item) {
                        if ($namaJenis === 'finishing dalam') {
                            $finishingDalamItems[] = $item['nama_item'];
                        } elseif ($namaJenis === 'finishing luar') {
                            $finishingLuarItems[] = $item['nama_item'];
                        }
                    }
                }

                $totalAksesoris = 0;
                foreach ($produk['aksesoris'] ?? [] as $aks) {
                    $totalAksesoris += $aks['harga_total'] ?? 0;
                }

                $diskon = $produk['diskon_per_produk'] ?? 0;
                $hargaSebelumDiskon = ($produk['harga_satuan'] ?? 0) + ($produk['harga_total_aksesoris'] ?? 0);
                $hargaSetelahDiskon = $produk['harga_akhir'] ?? ($hargaSebelumDiskon - ($hargaSebelumDiskon * $diskon / 100));

                $hargaSatuan = ($produk['harga_dasar'] ?? 0)
                             + ($produk['harga_finishing_dalam'] ?? 0)
                             + ($produk['harga_finishing_luar'] ?? 0);

                $totalItem = $hargaSetelahDiskon - $totalAksesoris;
                $aksesorisData = $produk['aksesoris'] ?? [];
                
                $maxRows = max(
                    count($bahanBakuNames),
                    count($finishingDalamItems),
                    count($finishingLuarItems),
                    count($aksesorisData),
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

                    $row[] = $bahanBakuNames[$rowIndex] ?? '';
                    $row[] = $finishingDalamItems[$rowIndex] ?? '';
                    $row[] = $finishingLuarItems[$rowIndex] ?? '';

                    if ($rowIndex === 0) {
                        $row[] = $produk['qty_produk'];
                        $row[] = $hargaSatuan;
                        $row[] = $totalItem;
                    } else {
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                    }

                    if (isset($aksesorisData[$rowIndex])) {
                        $row[] = $aksesorisData[$rowIndex]['nama_aksesoris'];
                        $row[] = $aksesorisData[$rowIndex]['qty_aksesoris'];
                        $row[] = $aksesorisData[$rowIndex]['harga_satuan_aksesoris'];
                    } else {
                        $row[] = '';
                        $row[] = '';
                        $row[] = '';
                    }

                    if ($rowIndex === 0) {
                        $row[] = $totalAksesoris;
                        $row[] = $hargaSetelahDiskon;
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

        // Grand Total row
        $rows[] = [
            'GRAND TOTAL', '', '', '', '', '', '', '', '', '', '', '', $totalSemua
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
        
        $sheet->getStyle("A{$tableStart}:M{$tableEnd}")
            ->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)
            ->getColor()->setARGB(self::COLOR_BORDER);
    }

    protected function styleRow(Worksheet $sheet, int $row, array $meta): void
    {
        switch ($meta['type']) {
            case 'title':
                $sheet->mergeCells("A{$row}:M{$row}");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => 'FF7C3AED']], // Deep purple accent
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(26);
                break;

            case 'subtitle':
                $sheet->mergeCells("A{$row}:M{$row}");
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
                $sheet->getStyle("A{$row}:M{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_HEADER_DARK]],
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 9],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF475569']]],
                ]);
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;

            case 'room':
                $sheet->mergeCells("A{$row}:M{$row}");
                $sheet->getStyle("A{$row}:M{$row}")->applyFromArray([
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

                $sheet->getStyle("A{$row}:M{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => $zebraColor]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->getStyle("B{$row}")->getAlignment()->setWrapText(true)->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                // Hilights
                $sheet->getStyle("G{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_SATUAN_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_SATUAN_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("H{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_ITEM_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_ITEM_FG], 'bold' => true],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("L{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_AKS_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_AKS_FG]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);
                $sheet->getStyle("M{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => self::COLOR_TOTAL_BG]],
                    'font' => ['color' => ['argb' => self::COLOR_TOTAL_FG], 'bold' => true, 'size' => 10],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]
                ]);

                if ($rowIndex === 0 && $maxRows > 1) {
                    $sheet->mergeCells("A{$startRow}:A{$endRow}");
                    $sheet->mergeCells("B{$startRow}:B{$endRow}");
                    $sheet->mergeCells("F{$startRow}:F{$endRow}");
                    $sheet->mergeCells("G{$startRow}:G{$endRow}");
                    $sheet->mergeCells("H{$startRow}:H{$endRow}");
                    $sheet->mergeCells("L{$startRow}:L{$endRow}");
                    $sheet->mergeCells("M{$startRow}:M{$endRow}");
                }

                $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("K{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("L{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getStyle("M{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');

                if ($rowIndex === 0) {
                    $hasDimensions = $meta['hasDimensions'] ?? false;
                    $sheet->getRowDimension($row)->setRowHeight($hasDimensions ? 32 : 20);
                } else {
                    $sheet->getRowDimension($row)->setRowHeight(20);
                }
                break;

            case 'grand_total':
                $sheet->mergeCells("A{$row}:L{$row}");
                $sheet->getStyle("A{$row}:M{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF7C3AED']], // Deep purple
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setIndent(1);
                $sheet->getStyle("M{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle("M{$row}")->getNumberFormat()->setFormatCode('Rp#,##0;[Red](Rp#,##0);"-"');
                $sheet->getRowDimension($row)->setRowHeight(28);
                break;
        }
    }
}
