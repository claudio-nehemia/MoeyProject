import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Order {
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    created_at: string;
    paid_at: string | null;
}

interface ItemPekerjaan {
    id: number;
    order: Order;
    total_amount: number;
    invoice: Invoice | null;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
}

export default function Index({ itemPekerjaans }: Props) {
    const [generating, setGenerating] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    const handleGenerate = (itemPekerjaanId: number) => {
        if (confirm('Generate invoice untuk item pekerjaan ini?')) {
            setGenerating(itemPekerjaanId);
            router.post(
                `/invoice/${itemPekerjaanId}/generate`,
                {},
                {
                    onFinish: () => setGenerating(null),
                }
            );
        }
    };

    const handleViewInvoice = (invoiceId: number) => {
        router.get(`/invoice/${invoiceId}/show`);
    };

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
                label: 'Pending'
            },
            paid: {
                bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
                text: 'text-white',
                icon: '✓',
                label: 'Lunas'
            },
            cancelled: {
                bg: 'bg-gradient-to-r from-red-400 to-pink-500',
                text: 'text-white',
                icon: '✕',
                label: 'Dibatalkan'
            },
        };

        const config = configs[status as keyof typeof configs];

        return (
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-md transform transition-all duration-300 hover:scale-105 ${config.bg} ${config.text}`}>
                <span className="text-sm">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <Head title="Invoice" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="invoice" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                            Invoice Management
                                        </h1>
                                        <p className="text-gray-600">Kelola dan pantau semua invoice project Anda</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-4">
                                        <div className="text-center px-6 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                            <div className="text-2xl font-bold text-blue-600">{itemPekerjaans.length}</div>
                                            <div className="text-xs text-gray-600 font-medium">Total Projects</div>
                                        </div>
                                        <div className="text-center px-6 py-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                            <div className="text-2xl font-bold text-green-600">
                                                {itemPekerjaans.filter(i => i.invoice?.status === 'paid').length}
                                            </div>
                                            <div className="text-xs text-gray-600 font-medium">Paid</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Project Info
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Total Amount
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Invoice Details
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {itemPekerjaans.map((item) => (
                                            <tr 
                                                key={item.id} 
                                                className="transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                                                onMouseEnter={() => setHoveredRow(item.id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md transform transition-all duration-300 ${hoveredRow === item.id ? 'scale-110 rotate-3' : ''}`}>
                                                            {item.order.nama_project.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 mb-1">
                                                                {item.order.nama_project}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                                                </svg>
                                                                {item.order.company_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {item.order.customer_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-gray-700 font-medium">
                                                            {item.order.customer_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                        <span className="text-sm font-bold text-green-700">
                                                            {formatRupiah(item.total_amount)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.invoice ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {item.invoice.invoice_number}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 ml-6">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                </svg>
                                                                {formatDate(item.invoice.created_at)}
                                                            </div>
                                                            {item.invoice.paid_at && (
                                                                <div className="text-xs text-green-600 font-semibold flex items-center gap-1 ml-6">
                                                                    ✓ Paid: {formatDate(item.invoice.paid_at)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">No invoice yet</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.invoice ? (
                                                        getStatusBadge(item.invoice.status)
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                            <span>○</span>
                                                            Not Generated
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.invoice ? (
                                                        <button
                                                            onClick={() => handleViewInvoice(item.invoice!.id)}
                                                            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl font-bold text-xs text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95"
                                                        >
                                                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerate(item.id)}
                                                            disabled={generating === item.id}
                                                            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 border border-transparent rounded-xl font-bold text-xs text-white uppercase tracking-wider shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                        >
                                                            {generating === item.id ? (
                                                                <>
                                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    Generate
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {itemPekerjaans.length === 0 && (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 font-medium">Tidak ada data invoice</p>
                                        <p className="text-sm text-gray-400 mt-1">Invoice akan muncul setelah dibuat dari project</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}