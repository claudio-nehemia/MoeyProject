<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use App\Models\Order;

class VendorExternalSheet implements FromArray, WithTitle, WithStyles, ShouldAutoSize
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
            ['Rincian Pembayaran Vendor Eksternal - ' . $this->order->nama_project],
            [''],
            ['RINCIAN ITEM EKSTERNAL'],
            ['Keterangan', 'SPK Amount', 'DP (V)', 'Tanggal DP', 'AF', 'FB', 'JW', 'Termin (V2)', 'Tanggal Termin', 'AF (T)', 'FB (T)', 'JW (T)'],
        ];

        foreach ($this->data['items'] as $item) {
            $rows[] = [
                $item['label'],
                $item['spk_amount'],
                $item['pembayaran'],
                $item['tanggal_pembayaran'] ?: '—',
                $item['flag_af'] ? '✔' : '—',
                $item['flag_fb'] ? '✔' : '—',
                $item['flag_jw'] ? '✔' : '—',
                $item['pembayaran_termin'],
                $item['tanggal_pembayaran_termin'] ?: '—',
                $item['flag_af_termin'] ? '✔' : '—',
                $item['flag_fb_termin'] ? '✔' : '—',
                $item['flag_jw_termin'] ? '✔' : '—',
            ];
        }

        $rows[] = [''];
        $rows[] = ['RINCIAN ADDENDUM EKSTERNAL'];
        $rows[] = ['Keterangan', 'SPK Amount', 'Pembayaran (V)', 'Tanggal Pembayaran', 'AF', 'FB', 'JW'];

        foreach ($this->data['addendums'] as $item) {
            $rows[] = [
                $item['label'],
                $item['spk_amount'],
                $item['pembayaran'],
                $item['tanggal_pembayaran'] ?: '—',
                $item['flag_af'] ? '✔' : '—',
                $item['flag_fb'] ? '✔' : '—',
                $item['flag_jw'] ? '✔' : '—',
            ];
        }

        $rows[] = [''];
        $rows[] = ['RINCIAN PENGELUARAN LUAR WORKSHOP (OPERASIONAL / LAINNYA)'];
        $rows[] = ['Keterangan', 'SPK Amount', 'Pembayaran (V)', 'Tanggal Pembayaran', 'AF', 'FB', 'JW'];

        foreach ($this->data['pengeluaran_luar'] as $item) {
            $rows[] = [
                $item['label'],
                $item['spk_amount'],
                $item['pembayaran'],
                $item['tanggal_pembayaran'] ?: '—',
                $item['flag_af'] ? '✔' : '—',
                $item['flag_fb'] ? '✔' : '—',
                $item['flag_jw'] ? '✔' : '—',
            ];
        }

        return $rows;
    }

    public function title(): string
    {
        return 'Vendor External';
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $highestRow = $sheet->getHighestRow();

        for ($i = 3; $i <= $highestRow; $i++) {
            $val = $sheet->getCell('A' . $i)->getValue();
            if ($val === 'RINCIAN ITEM EKSTERNAL' || $val === 'RINCIAN ADDENDUM EKSTERNAL' || $val === 'RINCIAN PENGELUARAN LUAR WORKSHOP (OPERASIONAL / LAINNYA)') {
                $sheet->getStyle('A' . $i)->getFont()->setBold(true)->setSize(11);
                $sheet->getStyle('A' . ($i + 1) . ':L' . ($i + 1))->getFont()->setBold(true);
                $sheet->getStyle('A' . ($i + 1) . ':L' . ($i + 1))->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFE0F2FE');
            }
        }
    }
}
