<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 15mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            color: #2563eb;
            font-weight: bold;
        }

        .header h2 {
            margin: 5px 0 0 0;
            font-size: 18px;
            color: #333;
            font-weight: bold;
        }

        .termin-badge {
            display: inline-block;
            padding: 6px 15px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 11px;
            margin-top: 8px;
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #f59e0b;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            margin-top: 10px;
        }

        .status-paid {
            background: #dcfce7;
            color: #166534;
            border: 2px solid #16a34a;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
            border: 2px solid #f59e0b;
        }

        .info-section {
            margin-bottom: 20px;
            background: #f9fafb;
            padding: 12px;
            border-radius: 5px;
        }

        .info-grid {
            display: flex;
            justify-content: space-between;
        }

        .info-column {
            width: 48%;
        }

        .info-row {
            display: flex;
            margin-bottom: 6px;
        }

        .info-label {
            font-weight: bold;
            width: 120px;
            color: #2563eb;
        }

        .info-value {
            color: #333;
            flex: 1;
        }

        /* Payment Summary Section */
        .payment-summary {
            margin-bottom: 20px;
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #bfdbfe;
        }

        .payment-summary-title {
            font-weight: bold;
            font-size: 12px;
            color: #1e40af;
            margin-bottom: 12px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }

        .payment-summary-grid {
            display: table;
            width: 100%;
        }

        .payment-summary-row {
            display: table-row;
        }

        .payment-summary-cell {
            display: table-cell;
            padding: 8px 10px;
            text-align: center;
            width: 20%;
        }

        .payment-summary-label {
            font-size: 8px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .payment-summary-value {
            font-size: 11px;
            font-weight: bold;
            color: #1e40af;
        }

        /* Termin Steps Section */
        .termin-steps {
            margin-bottom: 20px;
            background: #fefce8;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #fde047;
        }

        .termin-steps-title {
            font-weight: bold;
            font-size: 12px;
            color: #854d0e;
            margin-bottom: 12px;
            border-bottom: 2px solid #eab308;
            padding-bottom: 5px;
        }

        .termin-step-item {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            margin-bottom: 5px;
            border-radius: 5px;
            background: white;
            border: 1px solid #e5e7eb;
        }

        .termin-step-item.current {
            background: #dbeafe;
            border: 2px solid #2563eb;
        }

        .termin-step-item.paid {
            background: #dcfce7;
            border: 1px solid #16a34a;
        }

        .termin-step-number {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 10px;
            margin-right: 10px;
            background: #e5e7eb;
            color: #6b7280;
        }

        .termin-step-item.current .termin-step-number {
            background: #2563eb;
            color: white;
        }

        .termin-step-item.paid .termin-step-number {
            background: #16a34a;
            color: white;
        }

        .termin-step-info {
            flex: 1;
        }

        .termin-step-text {
            font-weight: bold;
            font-size: 10px;
            color: #333;
        }

        .termin-step-persentase {
            font-size: 9px;
            color: #6b7280;
        }

        .termin-step-amount {
            text-align: right;
            font-weight: bold;
            font-size: 10px;
            color: #1e40af;
        }

        .termin-step-status {
            margin-left: 10px;
            font-size: 8px;
            padding: 3px 8px;
            border-radius: 10px;
            font-weight: bold;
        }

        .termin-step-status.paid {
            background: #dcfce7;
            color: #166534;
        }

        .termin-step-status.current {
            background: #dbeafe;
            color: #1e40af;
        }

        .termin-step-status.pending {
            background: #f3f4f6;
            color: #6b7280;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        table th {
            background: #2563eb;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 10px 8px;
            border: 1px solid #1e40af;
            font-size: 9px;
            text-transform: uppercase;
        }

        table th.text-center {
            text-align: center;
        }

        table th.text-right {
            text-align: right;
        }

        table td {
            padding: 8px;
            border: 1px solid #d1d5db;
        }

        .produk-header {
            background: #dbeafe;
            font-weight: bold;
            font-size: 11px;
            padding: 8px;
            color: #1e40af;
        }

        .produk-info {
            font-size: 9px;
            color: #6b7280;
            margin-top: 2px;
        }

        .jenis-item-header {
            font-size: 8px;
            font-weight: bold;
            color: #2563eb;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .item-name {
            padding-left: 15px;
            font-size: 9px;
        }

        .aksesoris-section {
            background: #fef3c7;
            padding: 5px 8px;
        }

        .aksesoris-header {
            font-size: 8px;
            font-weight: bold;
            color: #92400e;
            text-transform: uppercase;
        }

        .total-row {
            background: #dbeafe;
            font-weight: bold;
        }

        .grand-total {
            background: #2563eb;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .grand-total-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .grand-total-label {
            font-size: 14px;
            font-weight: bold;
        }

        .grand-total-amount {
            font-size: 20px;
            font-weight: bold;
        }

        .invoice-tahap-info {
            font-size: 10px;
            margin-top: 5px;
            opacity: 0.9;
        }

        .payment-info {
            margin-top: 25px;
            padding: 15px;
            background: #f0f9ff;
            border-left: 4px solid #2563eb;
            border-radius: 5px;
        }

        .payment-info-title {
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .footer-note {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            font-size: 9px;
            color: #6b7280;
            text-align: center;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>INVOICE</h1>
        <h2>MOEY INTERIOR</h2>
        <div class="termin-badge">
             Tahap {{ $invoice->termin_step }} dari {{ $terminInfo['total_steps'] ?? 1 }}
        </div>
        <br>
        <div class="status-badge status-{{ $invoice->status === 'paid' ? 'paid' : 'pending' }}">
            {{ $invoice->status === 'paid' ? 'TERBAYAR' : 'BELUM BAYAR' }}
        </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
        <div class="info-grid">
            <div class="info-column">
                <div class="info-row">
                    <div class="info-label">No. Invoice:</div>
                    <div class="info-value" style="font-weight: bold;">{{ $invoice->invoice_number }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Tanggal:</div>
                    <div class="info-value">{{ \Carbon\Carbon::parse($invoice->created_at)->format('d F Y') }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Tahap Pembayaran:</div>
                    <div class="info-value" style="font-weight: bold; color: #2563eb;">
                        {{ $invoice->termin_text }} ({{ $invoice->termin_persentase }}%)
                    </div>
                </div>
                @if($invoice->status === 'paid' && $invoice->paid_at)
                    <div class="info-row">
                        <div class="info-label">Dibayar Pada:</div>
                        <div class="info-value" style="color: #16a34a; font-weight: bold;">
                            {{ \Carbon\Carbon::parse($invoice->paid_at)->format('d F Y H:i') }}
                        </div>
                    </div>
                @endif
            </div>
            <div class="info-column">
                <div class="info-row">
                    <div class="info-label">Project:</div>
                    <div class="info-value">{{ $invoice->itemPekerjaan->moodboard->order->nama_project }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Company:</div>
                    <div class="info-value">{{ $invoice->itemPekerjaan->moodboard->order->company_name }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Customer:</div>
                    <div class="info-value">{{ $invoice->itemPekerjaan->moodboard->order->customer_name }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Summary -->
    <div class="payment-summary">
        <div class="payment-summary-title">RINGKASAN PEMBAYARAN PROJECT</div>
        <div class="payment-summary-grid">
            <div class="payment-summary-row">
                <div class="payment-summary-cell">
                    <div class="payment-summary-label">Harga Kontrak</div>
                    <div class="payment-summary-value">Rp {{ number_format($paymentSummary['harga_kontrak'] ?? 0, 0, ',', '.') }}</div>
                </div>
                <div class="payment-summary-cell">
                    <div class="payment-summary-label">Commitment Fee {{ ($paymentSummary['commitment_fee_paid'] ?? false) ? '✓' : '' }}</div>
                    <div class="payment-summary-value" style="color: {{ ($paymentSummary['commitment_fee_paid'] ?? false) ? '#16a34a' : '#92400e' }};">
                        Rp {{ number_format($paymentSummary['commitment_fee'] ?? 0, 0, ',', '.') }}
                    </div>
                </div>
                <div class="payment-summary-cell">
                    <div class="payment-summary-label">Sisa Pembayaran</div>
                    <div class="payment-summary-value">Rp {{ number_format($paymentSummary['sisa_pembayaran'] ?? 0, 0, ',', '.') }}</div>
                </div>
                <div class="payment-summary-cell">
                    <div class="payment-summary-label">Sudah Dibayar</div>
                    <div class="payment-summary-value" style="color: #16a34a;">Rp {{ number_format($paymentSummary['total_paid'] ?? 0, 0, ',', '.') }}</div>
                </div>
                <div class="payment-summary-cell">
                    <div class="payment-summary-label">Belum Dibayar</div>
                    <div class="payment-summary-value" style="color: #dc2626;">Rp {{ number_format($paymentSummary['remaining_to_pay'] ?? 0, 0, ',', '.') }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Termin Steps -->
    @if(isset($allInvoices) && count($allInvoices) > 0)
    <div class="termin-steps">
        <div class="termin-steps-title">TAHAPAN PEMBAYARAN ({{ $terminInfo['termin_nama'] ?? 'Termin' }})</div>
        @foreach($allInvoices as $inv)
            <div class="termin-step-item {{ $inv['id'] == $invoice->id ? 'current' : ($inv['status'] === 'paid' ? 'paid' : '') }}">
                <div class="termin-step-number">{{ $inv['termin_step'] }}</div>
                <div class="termin-step-info">
                    <div class="termin-step-text">{{ $inv['termin_text'] }}</div>
                    <div class="termin-step-persentase">{{ $inv['termin_persentase'] ?? 0 }}% dari sisa pembayaran</div>
                </div>
                <div class="termin-step-amount">
                    Rp {{ number_format($inv['total_amount'] ?? 0, 0, ',', '.') }}
                </div>
                <div class="termin-step-status {{ $inv['id'] == $invoice->id ? 'current' : ($inv['status'] === 'paid' ? 'paid' : 'pending') }}">
                    @if($inv['id'] == $invoice->id)
                        INVOICE INI
                    @elseif($inv['status'] === 'paid')
                        TERBAYAR
                    @else
                        PENDING
                    @endif
                </div>
            </div>
        @endforeach
    </div>
    @endif

    <!-- Items Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 40%;">Item</th>
                <th class="text-center" style="width: 10%;">Qty</th>
                <th class="text-right" style="width: 25%;">Harga Satuan</th>
                <th class="text-right" style="width: 25%;">Harga Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($produks as $index => $produk)
                <!-- Produk Header -->
                <tr>
                    <td colspan="4" class="produk-header">
                        {{ $index + 1 }}. {{ $produk['nama_produk'] }}
                        <div class="produk-info">
                            @if($produk['panjang'] && $produk['lebar'] && $produk['tinggi'])
                                Dimensi: {{ $produk['panjang'] }} × {{ $produk['lebar'] }} × {{ $produk['tinggi'] }} cm
                            @endif
                        </div>
                    </td>
                </tr>

                <!-- Jenis Items -->
                @foreach($produk['jenis_items'] as $jenisItem)
                    @foreach($jenisItem['items'] as $itemIndex => $item)
                        <tr>
                            <td>
                                @if($itemIndex === 0)
                                    <div class="jenis-item-header">{{ $jenisItem['nama_jenis'] }}</div>
                                @endif
                                <div class="item-name">• {{ $item['nama_item'] }}</div>
                            </td>
                            <td class="text-center">{{ $item['qty'] }}</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                        </tr>
                    @endforeach
                @endforeach

                <!-- Aksesoris -->
                @if(count($produk['aksesoris']) > 0)
                    @foreach($produk['aksesoris'] as $aksIndex => $aks)
                        <tr>
                            <td class="aksesoris-section">
                                @if($aksIndex === 0)
                                    <div class="aksesoris-header">Aksesoris</div>
                                @endif
                                <div class="item-name">• {{ $aks['nama_aksesoris'] }}</div>
                            </td>
                            <td class="text-center aksesoris-section">{{ $aks['qty_aksesoris'] }}</td>
                            <td class="text-right aksesoris-section">
                                Rp {{ number_format($aks['harga_satuan_aksesoris'], 0, ',', '.') }}
                            </td>
                            <td class="text-right aksesoris-section">
                                Rp {{ number_format($aks['harga_total'], 0, ',', '.') }}
                            </td>
                        </tr>
                    @endforeach
                @endif

                <!-- Total per Produk -->
                <tr class="total-row">
                    <td colspan="2" class="text-right">Subtotal {{ $produk['nama_produk'] }}:</td>
                    <td class="text-right">{{ $produk['qty_produk'] }} unit</td>
                    <td class="text-right" style="color: #2563eb;">
                        Rp {{ number_format($produk['harga_akhir'], 0, ',', '.') }}
                    </td>
                </tr>
                
            @endforeach
        </tbody>
    </table>

    <!-- Grand Total -->
    <div class="grand-total">
        <div class="grand-total-content">
            <div>
                <div class="grand-total-label">TOTAL INVOICE TAHAP {{ $invoice->termin_step }}</div>
                <div class="invoice-tahap-info">{{ $invoice->termin_text }} ({{ $invoice->termin_persentase }}% dari Rp {{ number_format($paymentSummary['sisa_pembayaran'] ?? 0, 0, ',', '.') }})</div>
            </div>
            <div class="grand-total-amount">
                Rp {{ number_format($totalAmount, 0, ',', '.') }}
            </div>
        </div>
    </div>

    <!-- Payment Info -->
    @if($invoice->status === 'pending')
        <div class="payment-info">
            <div class="payment-info-title">INFORMASI PEMBAYARAN</div>
            <div>Silakan melakukan pembayaran sesuai nominal invoice tahap ini dan upload bukti pembayaran melalui sistem.</div>
            <div style="margin-top: 8px; font-style: italic; color: #92400e;">
                Status: <strong>Menunggu Pembayaran Tahap {{ $invoice->termin_step }}</strong>
            </div>
        </div>
    @else
        <div class="payment-info" style="background: #f0fdf4; border-left-color: #16a34a;">
            <div class="payment-info-title" style="color: #16a34a;">PEMBAYARAN TAHAP {{ $invoice->termin_step }} TELAH DITERIMA</div>
            <div>Invoice ini telah dibayar pada: <strong>{{ \Carbon\Carbon::parse($invoice->paid_at)->format('d F Y H:i') }}</strong></div>
            @if($invoice->notes)
                <div style="margin-top: 5px;">Catatan: {{ $invoice->notes }}</div>
            @endif
        </div>
    @endif

    <!-- Footer -->
    <div class="footer-note">
        Dokumen ini digenerate secara otomatis oleh sistem MOEY Interior Management<br>
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d F Y H:i:s') }}<br>
        <strong>Invoice Tahap {{ $invoice->termin_step }} - {{ $invoice->status === 'paid' ? 'Terbayar' : 'Belum Bayar' }}</strong>
    </div>
</body>
</html>
