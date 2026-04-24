<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class OrderExport implements WithMultipleSheets
{
    protected $orders;

    public function __construct($orders)
    {
        $this->orders = $orders;
    }

    public function sheets(): array
    {
        return [
            new OrderSheet($this->orders),
        ];
    }
}
