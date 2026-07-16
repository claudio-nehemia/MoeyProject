<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use App\Models\Order;

class VendorInternalSheet implements FromArray, WithTitle, WithStyles, ShouldAutoSize
{
    protected $order;
    protected $data;

    public function __construct(Order $order, array $data)
    {
        $this->order = $order;
        $this->data = $data;
    }

    public function array(): array
    {
        $rows = [
            ['Rincian Pembayaran Vendor Internal Utama - ' . $this->order->nama_project],
            [''],
            ['Keterangan', 'Target Fase', 'Persentase (%)', 'Nilai (U)', 'DP (V)', 'Tanggal DP', 'AF', 'FB', 'JW', 'Termin (V2)', 'Tanggal Termin', 'AF (T)', 'FB (T)', 'JW (T)'],
        ];

        foreach ($this->data['main_entries'] as $item) {
            $rows[] = [
                $item['label'],
                strtoupper($item['notes'] ?? 'dp'),
                $item['persentase'],
                $item['nilai'],
                $item['pembayaran'],
                $item['tanggal_pembayaran'] ?: '—',
                $item['flag_af'] ? '✔' : '—',
                $item['flag_fb'] ? '✔' : '—',
                $item['flag_jw'] ? '✔' : '—',
                $item['pembayaran_termin'] ?? 0,
                $item['tanggal_pembayaran_termin'] ?: '—',
                $item['flag_af_termin'] ? '✔' : '—',
                $item['flag_fb_termin'] ? '✔' : '—',
                $item['flag_jw_termin'] ? '✔' : '—',
            ];
        }

        // Add blank row and material groups header
        $rows[] = [''];
        $rows[] = ['Rincian Material Hutang (Dinamis)'];
        $rows[] = ['Keterangan Material', 'Nilai', 'Pembayaran', 'Tanggal Inv', 'Tanggal Pembayaran', 'AF', 'FB', 'JW'];

        foreach ($this->data['material_groups'] as $group) {
            $rows[] = ['Group: ' . $group['name']];
            foreach ($group['items'] as $item) {
                $rows[] = [
                    $item['label'],
                    $item['nilai'],
                    $item['pembayaran'],
                    $item['tanggal_inv'] ?: '—',
                    $item['tanggal_pembayaran'] ?: '—',
                    $item['flag_af'] ? '✔' : '—',
                    $item['flag_fb'] ? '✔' : '—',
                    $item['flag_jw'] ? '✔' : '—',
                ];
            }
        }

        return $rows;
    }

    public function title(): string
    {
        return 'Vendor Internal';
    }

    public function styles(Worksheet $sheet)
    {
        // Title style
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        // Header main table style (Row 3)
        $sheet->getStyle('A3:N3')->getFont()->setBold(true);
        $sheet->getStyle('A3:N3')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE0F2FE'); // Blue sky header
        
        $highestRow = $sheet->getHighestRow();

        // Format currencies
        for ($i = 4; $i <= $highestRow; $i++) {
            $val = $sheet->getCell('A' . $i)->getValue();
            if (strpos($val, 'Group:') === 0 || strpos($val, 'Rincian Material') === 0) {
                // Group header style
                $sheet->getStyle('A' . $i . ':H' . $i)->getFont()->setBold(true);
                $sheet->getStyle('A' . $i . ':H' . $i)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFF1F5F9');
            }
        }

        // Alignments & formats
        $sheet->getStyle('D4:E20')->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle('J4:J20')->getNumberFormat()->setFormatCode('#,##0');
    }
}
