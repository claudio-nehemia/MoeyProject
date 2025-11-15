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
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };

        const labels = {
            pending: 'Pending',
            paid: 'Lunas',
            cancelled: 'Dibatalkan',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Invoice" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="invoice" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
              <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Invoice
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {itemPekerjaans.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.order.nama_project}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.order.company_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.order.customer_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {formatRupiah(item.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.invoice ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {item.invoice.invoice_number}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatDate(item.invoice.created_at)}
                                                            </div>
                                                            {item.invoice.paid_at && (
                                                                <div className="text-xs text-green-600">
                                                                    Paid: {formatDate(item.invoice.paid_at)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.invoice ? (
                                                        getStatusBadge(item.invoice.status)
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {item.invoice ? (
                                                        <button
                                                            onClick={() => handleViewInvoice(item.invoice!.id)}
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                                        >
                                                            View Invoice
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleGenerate(item.id)}
                                                            disabled={generating === item.id}
                                                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                                        >
                                                            {generating === item.id ? 'Generating...' : 'Generate Invoice'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {itemPekerjaans.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        Tidak ada data invoice.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
        </div>
    );
}
