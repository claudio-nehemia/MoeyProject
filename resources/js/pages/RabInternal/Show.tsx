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
    is_submitted: boolean;
    submitted_by: string | null;
    submitted_at: string | null;
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

    const handleSubmit = () => {
        if (confirm('Submit RAB? Pastikan semua RAB (Internal, Kontrak, Vendor, Jasa) sudah lengkap dan benar.')) {
            router.post(`/rab-internal/${rabInternal.id}/submit`);
        }
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
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
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
                                                {rabInternal.is_submitted && (
                                                    <>
                                                        <p className="mt-2"><strong className="text-white">Submitted By:</strong> {rabInternal.submitted_by}</p>
                                                        <p><strong className="text-white">Submitted At:</strong> {formatDate(rabInternal.submitted_at!)}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Submit Button */}
                                    {!rabInternal.is_submitted && (
                                        <div className="ml-4">
                                            <button
                                                onClick={handleSubmit}
                                                className="rounded-lg bg-white px-6 py-3 font-semibold text-amber-600 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
                                            >
                                                Submit RAB
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Status Badge if Submitted */}
                                    {rabInternal.is_submitted && (
                                        <div className="ml-4">
                                            <span className="inline-flex items-center rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
                                                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                RAB Submitted
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    {/* Full Table - All Products */}
                    <div className="mb-8 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Bahan Baku
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Dalam
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Luar
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Markup
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Aksesoris
                                        </th>
                                        <th className="bg-green-100 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Grand Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {rabInternal.produks.map((produk, produkIndex) => {
                                        // Group items by jenis
                                        const bahanBakuItems: string[] = [];
                                        const finishingDalamItems: string[] = [];
                                        const finishingLuarItems: string[] = [];
                                        
                                        produk.jenis_items.forEach((jenisItem) => {
                                            const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                            if (namaJenis === 'bahan baku') {
                                                jenisItem.items.forEach(item => {
                                                    bahanBakuItems.push(item.nama_item);
                                                });
                                            } else if (namaJenis === 'finishing dalam') {
                                                jenisItem.items.forEach(item => {
                                                    finishingDalamItems.push(item.nama_item);
                                                });
                                            } else if (namaJenis === 'finishing luar') {
                                                jenisItem.items.forEach(item => {
                                                    finishingLuarItems.push(item.nama_item);
                                                });
                                            }
                                        });
                                        
                                        const maxRows = Math.max(
                                            bahanBakuItems.length,
                                            finishingDalamItems.length,
                                            finishingLuarItems.length,
                                            produk.aksesoris.length,
                                            1
                                        );
                                        
                                        return (
                                            <>
                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                    <tr key={`${produk.id}-${rowIndex}`} className={rowIndex === 0 ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}>
                                                        {/* Produk Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700">
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                                    {produkIndex + 1}. {produk.nama_produk}
                                                                </div>
                                                                {produk.panjang && produk.lebar && produk.tinggi && (
                                                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                        {produk.panjang} × {produk.lebar} × {produk.tinggi} cm
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Bahan Baku Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {bahanBakuItems[rowIndex] && (
                                                                <div>• {bahanBakuItems[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Finishing Dalam Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingDalamItems[rowIndex] && (
                                                                <div>• {finishingDalamItems[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Finishing Luar Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingLuarItems[rowIndex] && (
                                                                <div>• {finishingLuarItems[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Qty Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.qty_produk}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Markup Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-amber-600 dark:text-amber-400 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.markup_satuan}%
                                                            </td>
                                                        )}
                                                        
                                                        {/* Aksesoris Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div>
                                                                    • {produk.aksesoris[rowIndex].nama_aksesoris} 
                                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                                        (Qty: {produk.aksesoris[rowIndex].qty_aksesoris}, Markup: {produk.aksesoris[rowIndex].markup_aksesoris}%)
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Grand Total Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="bg-gradient-to-b from-green-50 to-green-100 px-4 py-3 align-top text-right dark:from-green-900/20 dark:to-green-900/30">
                                                                <div className="text-xl font-bold text-green-700 dark:text-green-400">
                                                                    {formatCurrency(produk.harga_akhir)}
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
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
