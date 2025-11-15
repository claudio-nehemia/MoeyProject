import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, Fragment } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

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

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    bukti_bayar: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    order: Order;
    items: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
}

export default function Show({ invoice }: Props) {
    const [showMaterials, setShowMaterials] = useState<{ [key: number]: boolean }>({});
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const { data, setData, post, processing } = useForm({
        bukti_bayar: null as File | null,
    });

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

    const handleDelete = () => {
        if (confirm('Yakin ingin menghapus invoice ini?')) {
            router.delete(`/invoice/${invoice.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Invoice ${invoice.invoice_number}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="invoice" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
              <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.get('/invoice')}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            ← Back to List
                        </button>
                    </div>

                    {/* Invoice Header */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg mb-6">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                                    <p className="text-lg font-semibold text-gray-700">{invoice.invoice_number}</p>
                                    <p className="text-sm text-gray-500">Date: {formatDate(invoice.created_at)}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(invoice.status)}
                                    {invoice.paid_at && (
                                        <p className="text-sm text-gray-500 mt-2">Paid on: {formatDate(invoice.paid_at)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Bill To Section */}
                            <div className="border-t border-gray-200 pt-6 mb-8">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
                                <div className="text-gray-900">
                                    <p className="font-semibold text-lg">{invoice.order.customer_name}</p>
                                    <p className="text-gray-600">{invoice.order.company_name}</p>
                                    <p className="text-sm text-gray-500 mt-1">Project: {invoice.order.nama_project}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Invoice Items</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Dimensi
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Qty
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Unit Price
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Details
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.items.map((item, index) => (
                                                <Fragment key={index}>
                                                    <tr className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {item.nama_produk}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-500">
                                                                {item.dimensi.panjang} × {item.dimensi.lebar} × {item.dimensi.tinggi} cm
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                            {item.qty_produk}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                            {formatRupiah(item.harga_satuan)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                            {formatRupiah(item.harga_akhir)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {(item.jenis_items.length > 0 || item.aksesoris.length > 0) && (
                                                                <button
                                                                    onClick={() => toggleMaterials(index)}
                                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                >
                                                                    {showMaterials[index] ? 'Hide' : 'Show'} Details
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {showMaterials[index] && (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                                <div className="space-y-4">
                                                                    {/* Materials */}
                                                                    {item.jenis_items.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                                                                Materials
                                                                            </h4>
                                                                            {item.jenis_items.map((jenisItem, jIndex) => (
                                                                                <div key={jIndex} className="mb-2">
                                                                                    <p className="text-sm font-medium text-gray-600">
                                                                                        {jenisItem.nama_jenis}:
                                                                                    </p>
                                                                                    <ul className="ml-4 mt-1 space-y-1">
                                                                                        {jenisItem.items.map((matItem, mIndex) => (
                                                                                            <li
                                                                                                key={mIndex}
                                                                                                className="text-sm text-gray-500"
                                                                                            >
                                                                                                • {matItem.nama_item} (Qty: {matItem.qty})
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Accessories */}
                                                                    {item.aksesoris.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                                                                Accessories
                                                                            </h4>
                                                                            <table className="min-w-full text-sm">
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="px-3 py-2 text-left text-xs text-gray-600">
                                                                                            Item
                                                                                        </th>
                                                                                        <th className="px-3 py-2 text-right text-xs text-gray-600">
                                                                                            Qty
                                                                                        </th>
                                                                                        <th className="px-3 py-2 text-right text-xs text-gray-600">
                                                                                            Unit Price
                                                                                        </th>
                                                                                        <th className="px-3 py-2 text-right text-xs text-gray-600">
                                                                                            Total
                                                                                        </th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {item.aksesoris.map((aks, aIndex) => (
                                                                                        <tr key={aIndex} className="border-t">
                                                                                            <td className="px-3 py-2 text-gray-700">
                                                                                                {aks.nama_aksesoris}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right text-gray-700">
                                                                                                {aks.qty_aksesoris}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right text-gray-700">
                                                                                                {formatRupiah(aks.harga_satuan_aksesoris)}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right text-gray-700">
                                                                                                {formatRupiah(aks.harga_total)}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                    GRAND TOTAL:
                                                </td>
                                                <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                                                    {formatRupiah(invoice.total_amount)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="border-t border-gray-200 pt-6 mt-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes:</h3>
                                    <p className="text-sm text-gray-700">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Proof Section */}
                    {invoice.status === 'pending' && (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Bukti Bayar</h3>
                                <form onSubmit={handleUploadBukti} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="bukti_bayar"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Select Payment Proof (Image or PDF)
                                        </label>
                                        <input
                                            type="file"
                                            id="bukti_bayar"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setData('bukti_bayar', e.target.files?.[0] || null)}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.bukti_bayar}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {processing ? 'Uploading...' : 'Upload Bukti Bayar'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Display Uploaded Proof */}
                    {invoice.bukti_bayar && (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bukti Bayar</h3>
                                <div className="flex items-center space-x-4">
                                    <a
                                        href={invoice.bukti_bayar}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        View Bukti Bayar
                                    </a>
                                    {invoice.status === 'paid' && (
                                        <span className="text-sm text-green-600 font-medium">
                                            ✓ Payment confirmed on {formatDate(invoice.paid_at!)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Button */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                Delete Invoice
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>
        </div>
    );
}
