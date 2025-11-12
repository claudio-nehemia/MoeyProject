import { useState, useEffect } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Item {
    nama_item: string;
    harga_satuan: number;
    qty: number;
    harga_total: number;
}

interface JenisItem {
    nama_jenis: string;
    items: Item[];
}

interface Aksesoris {
    id: number;
    nama_aksesoris: string;
    qty_aksesoris: number;
    markup_aksesoris: number;
    harga_satuan_aksesoris: number;
    harga_total: number;
}

interface Produk {
    id: number;
    nama_produk: string;
    qty_produk: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    markup_satuan: number;
    harga_dasar: number;
    harga_items_non_aksesoris: number;
    harga_dimensi: number;
    harga_satuan: number;
    harga_total_aksesoris: number;
    harga_akhir: number;
    jenis_items: JenisItem[];
    aksesoris: Aksesoris[];
}

interface RabInternal {
    id: number;
    response_by: string;
    response_time: string;
    order: {
        nama_project: string;
        company_name: string;
        customer_name: string;
    };
    produks: Produk[];
}

interface Props {
    rabInternal: RabInternal;
}

export default function Show({ rabInternal }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const totalSemuaProduk = rabInternal.produks.reduce((sum, produk) => sum + Number(produk.harga_akhir), 0);

    return (
        <>
            <Head title="Detail RAB Internal" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-internal" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6">
                                <h2 className="text-2xl font-bold text-white">
                                    RAB Internal
                                </h2>
                                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-amber-50 md:grid-cols-2">
                                    <div>
                                        <p><strong className="text-white">Project:</strong> {rabInternal.order.nama_project}</p>
                                        <p><strong className="text-white">Company:</strong> {rabInternal.order.company_name}</p>
                                        <p><strong className="text-white">Customer:</strong> {rabInternal.order.customer_name}</p>
                                    </div>
                                    <div>
                                        <p><strong className="text-white">Response By:</strong> {rabInternal.response_by}</p>
                                        <p><strong className="text-white">Response Time:</strong> {formatDate(rabInternal.response_time)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Full Table - All Products */}
                    <div className="mb-8 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Komponen
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Qty
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Harga Satuan
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Harga Total
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Markup
                                        </th>
                                        <th className="bg-green-100 px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Grand Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {rabInternal.produks.map((produk, produkIndex) => {
                                        const subtotal = Number(produk.harga_dasar) + Number(produk.harga_items_non_aksesoris);
                                        const totalItemsCount = produk.jenis_items.reduce((sum, jenis) => sum + jenis.items.length, 0);
                                        const aksesorisCount = produk.aksesoris.length;
                                        const totalRows = 1 + totalItemsCount + 1 + (aksesorisCount > 0 ? aksesorisCount + 1 : 0);
                                        
                                        return (
                                            <>
                                                {/* Produk Header Row */}
                                                <tr key={`produk-header-${produk.id}`} className="bg-gradient-to-r from-blue-600 to-blue-700">
                                                    <td colSpan={6} className="px-6 py-3">
                                                        <div className="text-lg font-bold text-white">
                                                            {produkIndex + 1}. {produk.nama_produk}
                                                        </div>
                                                        <div className="text-sm text-blue-100">
                                                            Qty: {produk.qty_produk}
                                                            {produk.panjang && produk.lebar && produk.tinggi && 
                                                                ` | Dimensi: ${produk.panjang} × ${produk.lebar} × ${produk.tinggi} cm`
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Harga Dasar Row */}
                                                <tr key={`harga-dasar-${produk.id}`} className="bg-blue-50 dark:bg-blue-900/10">
                                                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        Harga Dasar
                                                    </td>
                                                    <td className="px-6 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                        {produk.qty_produk}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(produk.harga_dasar / produk.qty_produk)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(produk.harga_dasar)}
                                                    </td>
                                                    <td className="px-6 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        -
                                                    </td>
                                                    <td rowSpan={totalRows} className="bg-gradient-to-b from-green-50 to-green-100 px-6 py-3 align-middle dark:from-green-900/20 dark:to-green-900/30">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                                {formatCurrency(produk.harga_akhir)}
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                Harga Akhir
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Jenis Items & Items Rows */}
                                                {produk.jenis_items.map((jenisItem, jenisIndex) => (
                                                    jenisItem.items.map((item, itemIndex) => (
                                                        <tr key={`${produk.id}-${jenisIndex}-${itemIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                            <td className="px-6 py-3">
                                                                {itemIndex === 0 && (
                                                                    <div className="mb-1 text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">
                                                                        {jenisItem.nama_jenis}
                                                                    </div>
                                                                )}
                                                                <div className="pl-4 text-sm text-gray-900 dark:text-gray-100">
                                                                    • {item.nama_item}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                                {item.qty}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                                {formatCurrency(item.harga_satuan)}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(item.harga_total)}
                                                            </td>
                                                            <td className="px-6 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                -
                                                            </td>
                                                        </tr>
                                                    ))
                                                ))}

                                                {/* Subtotal + Markup Row */}
                                                <tr key={`subtotal-${produk.id}`} className="bg-amber-50 dark:bg-amber-900/20">
                                                    <td className="px-6 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        Subtotal + Markup × Dimensi
                                                    </td>
                                                    <td className="px-6 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        -
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            Subtotal: {formatCurrency(subtotal)}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            Markup: {produk.markup_satuan}%
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            Dimensi: {produk.harga_dimensi.toLocaleString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(produk.harga_satuan)}
                                                    </td>
                                                    <td className="px-6 py-3 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                                                        {produk.markup_satuan}%
                                                    </td>
                                                </tr>

                                                {/* Aksesoris Section */}
                                                {produk.aksesoris.length > 0 && (
                                                    <>
                                                        {produk.aksesoris.map((aksesoris, aksIndex) => (
                                                            <tr key={`aks-${produk.id}-${aksIndex}`} className="bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20">
                                                                <td className="px-6 py-3">
                                                                    {aksIndex === 0 && (
                                                                        <div className="mb-1 text-xs font-semibold uppercase text-purple-700 dark:text-purple-400">
                                                                            Aksesoris
                                                                        </div>
                                                                    )}
                                                                    <div className="pl-4 text-sm text-gray-900 dark:text-gray-100">
                                                                        • {aksesoris.nama_aksesoris}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                                    {aksesoris.qty_aksesoris}
                                                                </td>
                                                                <td className="px-6 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                                                                    {formatCurrency(aksesoris.harga_satuan_aksesoris)}
                                                                </td>
                                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                    {formatCurrency(aksesoris.harga_total)}
                                                                </td>
                                                                <td className="px-6 py-3 text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                                                                    {aksesoris.markup_aksesoris}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        
                                                        {/* Total Aksesoris Row */}
                                                        <tr key={`total-aks-${produk.id}`} className="bg-purple-100 dark:bg-purple-900/30">
                                                            <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                                                                Total Aksesoris:
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-sm font-bold text-purple-700 dark:text-purple-400">
                                                                {formatCurrency(produk.harga_total_aksesoris)}
                                                            </td>
                                                            <td className="px-6 py-3"></td>
                                                        </tr>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>                        {/* Grand Total */}
                        <div className="mb-6 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Grand Total
                                        </h3>
                                        <p className="mt-1 text-sm text-purple-100">
                                            Total semua produk ({rabInternal.produks.length} produk)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold text-white">
                                            {formatCurrency(totalSemuaProduk)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3">
                            <Link
                                href="/rab-internal"
                                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Kembali
                            </Link>
                        </div>
                    </div>
                </div>
        </>
    );
}
