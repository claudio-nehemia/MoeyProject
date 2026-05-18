<!DOCTYPE html>
<html>
<head>
    <title>Workplan Report</title>
    <style>
        body { font-family: 'Arial', sans-serif; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .project-info { margin-bottom: 20px; }
        .project-info p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Workplan Report</h2>
    </div>

    <div class="project-info">
        <p><strong>Project:</strong> {{ $order->nama_project }}</p>
        <p><strong>Company:</strong> {{ $order->company_name }}</p>
        <p><strong>Customer:</strong> {{ $order->customer_name }}</p>
        <p><strong>Date:</strong> {{ date('d F Y') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Ruangan</th>
                <th>Produk</th>
                <th>Workplan Start</th>
                <th>Workplan End</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->moodboard->itemPekerjaans as $ip)
                @php
                    $productsByRoom = $ip->produks->groupBy('nama_ruangan');
                @endphp

                @foreach ($productsByRoom as $ruangan => $produks)
                    @foreach ($produks as $index => $produk)
                        @php
                            $workplanItems = $produk->workplanItems;
                            $startDate = null;
                            $endDate = null;

                            if ($workplanItems->isNotEmpty()) {
                                $startDate = $workplanItems->whereNotNull('start_date')->min('start_date');
                                $endDate = $workplanItems->whereNotNull('end_date')->max('end_date');
                            }
                        @endphp
                        <tr>
                            <td>{{ $index === 0 ? ($ruangan ?? '-') : '' }}</td>
                            <td>{{ $produk->produk->nama_produk ?? '-' }}</td>
                            <td>{{ $startDate ? \Carbon\Carbon::parse($startDate)->format('d/m/Y') : '-' }}</td>
                            <td>{{ $endDate ? \Carbon\Carbon::parse($endDate)->format('d/m/Y') : '-' }}</td>
                        </tr>
                    @endforeach
                @endforeach
            @endforeach
        </tbody>
    </table>
</body>
</html>
