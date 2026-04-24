<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ProjectExport implements WithMultipleSheets
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        $sheets = [
            new ProjectProgressSheet($this->data),
        ];

        // Add evidence sheet if there are any stage evidences
        $hasEvidence = false;
        foreach ($this->data['groupedProduks'] as $produks) {
            foreach ($produks as $produk) {
                if (!empty($produk['stage_evidences'])) {
                    $hasEvidence = true;
                    break 2;
                }
            }
        }

        if ($hasEvidence) {
            $sheets[] = new ProjectEvidenceSheet($this->data);
        }

        return $sheets;
    }
}