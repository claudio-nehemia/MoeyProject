<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Models\Order;

class ProjectVendorPaymentsExport implements WithMultipleSheets
{
    protected $order;
    protected $data;

    public function __construct(Order $order, array $data)
    {
        $this->order = $order;
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            new VendorInternalSheet($this->order, $this->data['vendor_internal']),
            new VendorFisikSheet($this->order, $this->data['vendor_fisik']),
            new VendorExternalSheet($this->order, $this->data['vendor_external']),
        ];
    }
}
