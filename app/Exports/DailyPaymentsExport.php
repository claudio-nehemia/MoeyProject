<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DailyPaymentsExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        $rows = [];
        foreach ($this->data as $item) {
            $rows[] = [
                $item['date'],
                $item['project_name'],
                $item['vendor_name'],
                strtoupper($item['vendor_type']),
                $item['type'],
                $item['label'],
                $item['amount'],
                $item['flag_af'] ? '✔' : '—',
                $item['flag_fb'] ? '✔' : '—',
                $item['flag_jw'] ? '✔' : '—',
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return [
            'Tanggal Jatuh Tempo',
            'Nama Project',
            'Vendor / Supplier',
            'Tipe Vendor',
            'Fase',
            'Keterangan',
            'Nominal Pembayaran',
            'Approval AF',
            'Approval FB',
            'Approval JW',
        ];
    }

    public function title(): string
    {
        return 'Pembayaran Harian';
    }

    public function styles(Worksheet $sheet)
    {
        // Heading styles
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);
        $sheet->getStyle('A1:J1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFF59E0B'); // Amber colored header
        $sheet->getStyle('A1:J1')->getFont()->getColor()->setARGB('FFFFFFFF');

        // Alignments & formats
        $highestRow = $sheet->getHighestRow();
        $sheet->getStyle('G2:G' . $highestRow)->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('H2:J' . $highestRow)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // Add borders
        $sheet->getStyle('A1:J' . $highestRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
    }
}
