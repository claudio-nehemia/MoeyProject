import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, Fragment } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        nama_role: string;
    };
}

interface PageProps {
    auth: {
        user: User;
    };
    invoice: Invoice;
    [key: string]: any;
}

interface Order {
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Item {
    nama_item: string;
    qty: number;
}

interface JenisItem {
    nama_jenis: string;
    items: Item[];
}

interface Aksesoris {
    nama_aksesoris: string;
    qty_aksesoris: number;
    harga_satuan_aksesoris: number;
    harga_total: number;
}

interface InvoiceItem {
    nama_produk: string;
    qty_produk: number;
    dimensi: {
        panjang: number;
        lebar: number;
        tinggi: number;
    };
    harga_satuan: number;
    harga_akhir: number;
    jenis_items: JenisItem[];
    aksesoris: Aksesoris[];
}

interface PaymentSummary {
    harga_kontrak: number;
    commitment_fee: {
        amount: number;
        paid: boolean;
    };
    sisa_pembayaran: number;
    total_paid: number;
    remaining_to_pay: number;
}

interface Invoice {
    id: number;
    invoice_number: string;
    termin_step: number;
    termin_text: string;
    termin_persentase: number;
    total_steps: number;
    total_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    pm_response_time: string | null;
    pm_response_by: string | null;
    bukti_bayar: string | null;
    paid_at: string | null;
    response_time: string | null;
    response_by: string | null;
    notes: string | null;
    created_at: string;
    order: Order;
    payment_summary: PaymentSummary;
    termin_nama: string | null;
    all_invoices: Array<{
        id: number;
        termin_step: number;
        termin_text: string;
        total_amount: number;
        status: string;
        paid_at: string | null;
    }>;
    items: InvoiceItem[];
    // BAST foto klien info
    is_last_step: boolean;
    item_pekerjaan_id: number;
    has_bast_foto_klien: boolean;
    bast_foto_klien: string | null;
    bast_foto_klien_uploaded_at: string | null;
}

interface Props {
    invoice: Invoice;
}

export default function Show({ invoice }: Props) {
    const [showMaterials, setShowMaterials] = useState<{ [key: number]: boolean }>({});
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingBast, setIsDraggingBast] = useState(false);
    const { data, setData, post, processing } = useForm({
        bukti_bayar: null as File | null,
    });
    const { data: bastData, setData: setBastData, post: postBast, processing: processingBast } = useForm({
        bast_foto_klien: null as File | null,
    });
    
    // Auth info
    const { auth } = usePage<PageProps>().props;
    const isKepalaMarketing = auth.user.role.nama_role === 'Kepala Marketing';

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const configs = {
            pending: {
                bg: 'bg-gradient-to-r from-yellow-400 to-orange-400',
                text: 'text-white',
                icon: '⏳',
                label: 'Pending',
                pulse: true
            },
            paid: {
                bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
                text: 'text-white',
                icon: '✓',
                label: 'Terbayar',
                pulse: false
            },
            cancelled: {
                bg: 'bg-gradient-to-r from-red-400 to-pink-500',
                text: 'text-white',
                icon: '✕',
                label: 'Dibatalkan',
                pulse: false
            },
        };

        const config = configs[status as keyof typeof configs];

        return (
            <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transform transition-all duration-300 hover:scale-105 ${config.bg} ${config.text} ${config.pulse ? 'animate-pulse' : ''}`}>
                <span className="text-lg">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const toggleMaterials = (index: number) => {
        setShowMaterials((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleUploadBukti: FormEventHandler = (e) => {
        e.preventDefault();
        if (data.bukti_bayar) {
            post(`/invoice/${invoice.id}/upload-bukti`, {
                preserveScroll: true,
                forceFormData: true,
            });
        }
    };

    const handleUploadBastFotoKlien: FormEventHandler = (e) => {
        e.preventDefault();
        if (bastData.bast_foto_klien) {
            postBast(`/invoice/${invoice.item_pekerjaan_id}/upload-bast-foto-klien`, {
                preserveScroll: true,
                forceFormData: true,
            });
        }
    };

    const handleDelete = () => {
        if (confirm('Yakin ingin menghapus invoice ini?')) {
            router.delete(`/invoice/${invoice.id}`);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setData('bukti_bayar', file);
        }
    };

    const handleDragOverBast = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBast(true);
    };

    const handleDragLeaveBast = () => {
        setIsDraggingBast(false);
    };

    const handleDropBast = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBast(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setBastData('bast_foto_klien', file);
        }
    };

    const handleResponse = () => {
        if (confirm('Apakah Anda yakin ingin menyetujui invoice ini?')) {
            router.post(route('invoice.response', invoice.id));
        }
    };

    const handlePmResponse = () => {
        if (confirm('Apakah Anda yakin ingin mengirim invoice ini (PM Response)?')) {
            router.post(route('pm.response.invoice', invoice.item_pekerjaan_id));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <Head title={`Invoice ${invoice.invoice_number}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="invoice" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={() => router.get('/invoice')}
                            className="group inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm text-gray-700 shadow-md hover:shadow-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transform transition-all duration-200 hover:-translate-x-1"
                        >
                            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to List
                        </button>

                        {/* Invoice Header */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                                <div className="flex justify-between items-start">
                                    <div className="text-white">
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h1 className="text-3xl font-bold">INVOICE</h1>
                                        </div>
                                        <p className="text-xl font-bold text-blue-100">{invoice.invoice_number}</p>
                                        <p className="text-sm text-blue-200 mt-1">Issue Date: {formatDate(invoice.created_at)}</p>
                                        
                                        {/* Termin Info */}
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                                                📋 {invoice.termin_nama || 'Termin'}
                                            </span>
                                            <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-sm font-bold">
                                                Tahap {invoice.termin_step} / {invoice.total_steps}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-blue-200">
                                            {invoice.termin_text} ({invoice.termin_persentase}% dari sisa pembayaran)
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3">
                                        {getStatusBadge(invoice.status)}
                                        <a
                                            href={`/invoice/${invoice.id}/export-pdf`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm shadow-md hover:shadow-xl hover:bg-blue-50 transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download PDF
                                        </a>
                                        {invoice.paid_at && (
                                            <p className="text-sm text-blue-100 mt-3 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                                                💰 Paid: {formatDate(invoice.paid_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* All Invoices Navigation */}
                            {invoice.all_invoices && invoice.all_invoices.length > 1 && (
                                <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-3">Semua Tahap Pembayaran:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {invoice.all_invoices.map((inv) => (
                                            <button
                                                key={inv.id}
                                                onClick={() => router.get(`/invoice/${inv.id}/show`)}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                    inv.id === invoice.id
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : inv.status === 'paid'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : inv.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                <span className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                                                    {inv.termin_step}
                                                </span>
                                                {inv.termin_text}
                                                {inv.status === 'paid' && <span>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment Summary Section */}
                            <div className="px-8 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Ringkasan Pembayaran
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                        <div className="text-xs text-gray-500">Harga Kontrak</div>
                                        <div className="text-sm font-bold text-gray-900">{formatRupiah(invoice.payment_summary?.harga_kontrak || 0)}</div>
                                    </div>
                                    <div className={`rounded-lg p-3 border shadow-sm ${invoice.payment_summary?.commitment_fee?.paid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className={`text-xs ${invoice.payment_summary?.commitment_fee?.paid ? 'text-green-600' : 'text-amber-600'}`}>
                                            Commitment Fee {invoice.payment_summary?.commitment_fee?.paid ? '✓' : ''}
                                        </div>
                                        <div className={`text-sm font-bold ${invoice.payment_summary?.commitment_fee?.paid ? 'text-green-700' : 'text-amber-700'}`}>
                                            {formatRupiah(invoice.payment_summary?.commitment_fee?.amount || 0)}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 shadow-sm">
                                        <div className="text-xs text-blue-600">Sisa Pembayaran</div>
                                        <div className="text-sm font-bold text-blue-700">{formatRupiah(invoice.payment_summary?.sisa_pembayaran || 0)}</div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 shadow-sm">
                                        <div className="text-xs text-green-600">Sudah Dibayar</div>
                                        <div className="text-sm font-bold text-green-700">{formatRupiah(invoice.payment_summary?.total_paid || 0)}</div>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 shadow-sm">
                                        <div className="text-xs text-orange-600">Belum Dibayar</div>
                                        <div className="text-sm font-bold text-orange-700">{formatRupiah(invoice.payment_summary?.remaining_to_pay || 0)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Bill To Section */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {invoice.order.customer_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bill To:</h3>
                                            <p className="text-2xl font-bold text-gray-900 mb-1">{invoice.order.customer_name}</p>
                                            <p className="text-gray-600 font-medium mb-2">{invoice.order.company_name}</p>
                                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-blue-200">
                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                                                </svg>
                                                <span className="text-sm font-semibold text-gray-700">Project: {invoice.order.nama_project}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                                        Invoice Items
                                    </h3>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Dimensi</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Qty</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Unit Price</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Amount</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {invoice.items.map((item, index) => (
                                                    <Fragment key={index}>
                                                        <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-md">
                                                                        {item.nama_produk.charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-900">{item.nama_produk}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="inline-flex items-center gap-1 text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-medium text-gray-700">
                                                                    📏 {item.dimensi.panjang} × {item.dimensi.lebar} × {item.dimensi.tinggi} cm
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                                                    {item.qty_produk}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                                {formatRupiah(item.harga_satuan)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                                    <span className="text-sm font-bold text-green-700">
                                                                        {formatRupiah(item.harga_akhir)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {(item.jenis_items.length > 0 || item.aksesoris.length > 0) && (
                                                                    <button
                                                                        onClick={() => toggleMaterials(index)}
                                                                        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105"
                                                                    >
                                                                        <svg className={`w-4 h-4 transform transition-transform duration-300 ${showMaterials[index] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                        {showMaterials[index] ? 'Hide' : 'Show'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {showMaterials[index] && (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-6 bg-gradient-to-br from-gray-50 to-blue-50">
                                                                    <div className="space-y-6">
                                                                        {/* Materials */}
                                                                        {item.jenis_items.length > 0 && (
                                                                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                                                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase mb-4">
                                                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white">
                                                                                        🧱
                                                                                    </div>
                                                                                    Materials
                                                                                </h4>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    {item.jenis_items.map((jenisItem, jIndex) => (
                                                                                        <div key={jIndex} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                                                                                            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                                                                {jenisItem.nama_jenis}
                                                                                            </p>
                                                                                            <ul className="space-y-2">
                                                                                                {jenisItem.items.map((matItem, mIndex) => (
                                                                                                    <li key={mIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                                                                        {matItem.nama_item}
                                                                                                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 bg-white rounded-md text-xs font-bold text-orange-600 border border-orange-200">
                                                                                                            ×{matItem.qty}
                                                                                                        </span>
                                                                                                    </li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Accessories */}
                                                                        {item.aksesoris.length > 0 && (
                                                                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                                                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase mb-4">
                                                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white">
                                                                                        ⚡
                                                                                    </div>
                                                                                    Accessories
                                                                                </h4>
                                                                                <div className="overflow-x-auto">
                                                                                    <table className="min-w-full text-sm">
                                                                                        <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                                                                            <tr>
                                                                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Item</th>
                                                                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Qty</th>
                                                                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Unit Price</th>
                                                                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Total</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-gray-100">
                                                                                            {item.aksesoris.map((aks, aIndex) => (
                                                                                                <tr key={aIndex} className="hover:bg-purple-50 transition-colors">
                                                                                                    <td className="px-4 py-3 text-gray-700 font-medium">{aks.nama_aksesoris}</td>
                                                                                                    <td className="px-4 py-3 text-right">
                                                                                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-purple-100 rounded-md text-xs font-bold text-purple-700">
                                                                                                            {aks.qty_aksesoris}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3 text-right text-gray-700 font-medium">
                                                                                                        {formatRupiah(aks.harga_satuan_aksesoris)}
                                                                                                    </td>
                                                                                                    <td className="px-4 py-3 text-right">
                                                                                                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg text-green-700 font-bold">
                                                                                                            {formatRupiah(aks.harga_total)}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                                    <td colSpan={4} className="px-6 py-6 text-right text-white font-bold uppercase tracking-wider">
                                                        Grand Total:
                                                    </td>
                                                    <td colSpan={2} className="px-6 py-6">
                                                        <div className="text-right">
                                                            <div className="inline-block px-6 py-3 bg-white rounded-xl shadow-lg">
                                                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                                    {formatRupiah(invoice.total_amount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Notes */}
                                {invoice.notes && (
                                    <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-400">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <h3 className="text-sm font-bold text-yellow-800 uppercase mb-1">Notes:</h3>
                                                <p className="text-sm text-yellow-700">{invoice.notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Foto BAST dengan Klien - Hanya untuk tahap terakhir/pelunasan */}
                        {invoice.is_last_step && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {invoice.has_bast_foto_klien ? '✅ Foto BAST dengan Klien' : '📸 Upload Foto BAST dengan Klien'}
                                    </h3>
                                    <p className="text-purple-200 text-sm mt-1">
                                        Wajib untuk pembayaran tahap terakhir (pelunasan)
                                    </p>
                                </div>
                                <div className="p-8">
                                    {invoice.has_bast_foto_klien ? (
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-600 mb-1">Foto BAST dengan Klien</p>
                                                    {invoice.bast_foto_klien_uploaded_at && (
                                                        <p className="text-lg font-bold text-purple-700 flex items-center gap-2">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                            Diupload: {invoice.bast_foto_klien_uploaded_at}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={invoice.bast_foto_klien!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-xl font-bold text-sm text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105"
                                            >
                                                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Lihat Foto
                                            </a>
                                        </div>
                                    ) : invoice.status === 'pending' ? (
                                        <form onSubmit={handleUploadBastFotoKlien} className="space-y-6">
                                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="font-semibold text-amber-800">Perhatian!</p>
                                                        <p className="text-sm text-amber-700">
                                                            Untuk pembayaran tahap terakhir (pelunasan), Anda harus upload foto dokumentasi BAST dengan klien terlebih dahulu.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                onDragOver={handleDragOverBast}
                                                onDragLeave={handleDragLeaveBast}
                                                onDrop={handleDropBast}
                                                className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                                                    isDraggingBast
                                                        ? 'border-purple-500 bg-purple-50 scale-105'
                                                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                                                }`}
                                            >
                                                <input
                                                    type="file"
                                                    id="bast_foto_klien"
                                                    accept="image/*"
                                                    onChange={(e) => setBastData('bast_foto_klien', e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="pointer-events-none">
                                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-lg font-bold text-gray-900 mb-2">
                                                        {bastData.bast_foto_klien ? bastData.bast_foto_klien.name : 'Drop foto BAST dengan klien atau klik untuk browse'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Support: JPG, PNG (Max 5MB)
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={processingBast || !bastData.bast_foto_klien}
                                                className="group w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-xl font-bold text-base text-white uppercase tracking-wider shadow-xl hover:shadow-2xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {processingBast ? (
                                                    <>
                                                        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Mengupload Foto...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-6 h-6 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Upload Foto BAST dengan Klien
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="font-semibold text-red-800">Foto BAST dengan Klien Belum Diupload</p>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        Foto dokumentasi BAST dengan klien tidak diupload sebelum pembayaran dilakukan.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PM Response Section (Termin 1 Only, visible to KepMark) */}
                        {!invoice.pm_response_time && isKepalaMarketing && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-6 transition-all duration-300 hover:shadow-2xl">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-5">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        PM Response (Marketing)
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200 mb-8 flex items-start gap-4">
                                        <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-indigo-900 text-lg mb-1">Menunggu Konfirmasi Marketing</p>
                                            <p className="text-indigo-700 leading-relaxed">
                                                Sebagai Kepala Marketing, mohon konfirmasi bahwa invoice ini sudah valid dan siap dikirim/dilihat oleh klien.
                                                Tindakan ini akan menyelesaikan task marketing untuk tahap Invoice.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePmResponse}
                                        className="group w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-xl font-bold text-base text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-200 hover:-translate-y-1 active:translate-y-0"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Konfirmasi & Kirim Invoice
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Response Section (Termin 1 Only) */}
                        {invoice.status === 'pending' && invoice.termin_step === 1 && !invoice.response_time && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Persetujuan Invoice
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-semibold text-blue-800">Menunggu Response</p>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    Mohon konfirmasi bahwa Anda telah menerima dan menyetujui invoice ini sebelum melanjutkan ke proses pembayaran.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleResponse}
                                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 border border-transparent rounded-xl font-bold text-base text-white uppercase tracking-wider shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Setujui Invoice
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Invoice Info Cards - PM Response Status */}
                        {invoice.termin_step === 1 && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${invoice.pm_response_time ? 'bg-green-100/50 text-green-600' : 'bg-orange-100/50 text-orange-600'}`}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">PM Response</p>
                                            <p className={`text-lg font-bold ${invoice.pm_response_time ? 'text-green-600' : 'text-orange-500'}`}>
                                                {invoice.pm_response_time ? 'Confirmed' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                    {invoice.pm_response_time && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">By {invoice.pm_response_by}</span>
                                                <span className="font-medium text-gray-700">{formatDate(invoice.pm_response_time)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${invoice.response_time ? 'bg-blue-100/50 text-blue-600' : 'bg-gray-100/50 text-gray-600'}`}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Client Response</p>
                                            <p className={`text-lg font-bold ${invoice.response_time ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {invoice.response_time ? 'Accepted' : 'Waiting Response'}
                                            </p>
                                        </div>
                                    </div>
                                    {invoice.response_time && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">By {invoice.response_by}</span>
                                                <span className="font-medium text-gray-700">{formatDate(invoice.response_time)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Proof Upload */}
                        {invoice.status === 'pending' && (invoice.termin_step !== 1 || invoice.response_time) && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload Bukti Bayar
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleUploadBukti} className="space-y-6">
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                                                isDragging
                                                    ? 'border-green-500 bg-green-50 scale-105'
                                                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                id="bukti_bayar"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setData('bukti_bayar', e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="pointer-events-none">
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <p className="text-lg font-bold text-gray-900 mb-2">
                                                    {data.bukti_bayar ? data.bukti_bayar.name : 'Drop your file here or click to browse'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Support: JPG, PNG, PDF (Max 5MB)
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.bukti_bayar}
                                            className="group w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl font-bold text-base text-white uppercase tracking-wider shadow-xl hover:shadow-2xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            {processing ? (
                                                <>
                                                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Uploading Payment Proof...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    Upload Payment Proof
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Display Uploaded Proof */}
                        {invoice.bukti_bayar && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment Proof
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600 mb-1">Payment Confirmed</p>
                                                {invoice.paid_at && (
                                                    <p className="text-lg font-bold text-green-700 flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                        </svg>
                                                        {formatDate(invoice.paid_at)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <a
                                            href={invoice.bukti_bayar}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl font-bold text-sm text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105"
                                        >
                                            <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Payment Proof
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Button - Only for pending invoices */}
                        {invoice.status === 'pending' && (
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                <div className="bg-gradient-to-r from-red-600 to-pink-600 px-8 py-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Danger Zone
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-red-900 mb-2">Delete This Invoice</h4>
                                                <p className="text-sm text-red-700">
                                                    Once deleted, this invoice cannot be recovered. Please be certain.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleDelete}
                                                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 border border-transparent rounded-xl font-bold text-sm text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95"
                                            >
                                                <svg className="w-5 h-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}