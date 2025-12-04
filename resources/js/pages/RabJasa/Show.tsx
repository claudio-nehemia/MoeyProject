import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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

interface Produk {
    id: number;
    nama_produk: string;
    qty_produk: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    harga_dasar: number; // This is harga_jasa for RAB Jasa (sum from selected bahan baku)
    harga_items_non_aksesoris: number;
    harga_dimensi: number;
    harga_satuan: number;
    harga_akhir: number;
    jenis_items: JenisItem[];
    bahan_baku_names: string[];
}

// Helper function to calculate total harga for a jenis item
const calculateJenisTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => sum + item.harga_total, 0);
};

interface rabJasa {
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
    rabJasa: rabJasa;
}

export default function Show({ rabJasa }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { post } = useForm();

    const handleRegenerate = () => {
        if (
            confirm(
                'Regenerate RAB Jasa dengan harga terbaru dari master data?',
            )
        ) {
            post(`/rab-jasa/${rabJasa.id}/regenerate`);
        }
    };

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

    const totalSemuaProduk = rabJasa.produks.reduce(
        (sum, produk) => sum + Number(produk.harga_akhir),
        0,
    );

    return (
        <>
            <Head title="Detail RAB Jasa" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="rab-jasa"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                            <div className="flex justify-between">
                                <h2 className="text-2xl font-bold text-white">
                                    RAB Jasa
                                </h2>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleRegenerate}
                                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-700 hover:shadow-xl"
                                    >
                                        <svg
                                            className="mr-2 h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        Regenerate
                                    </button>
                                    <button className="bg-green-600">
                                        <a
                                            href={`/rab-jasa/${rabJasa.id}/pdf`}
                                            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Download PDF
                                        </a>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-green-50 md:grid-cols-2">
                                <div>
                                    <p>
                                        <strong className="text-white">
                                            Project:
                                        </strong>{' '}
                                        {rabJasa.order.nama_project}
                                    </p>
                                    <p>
                                        <strong className="text-white">
                                            Company:
                                        </strong>{' '}
                                        {rabJasa.order.company_name}
                                    </p>
                                    <p>
                                        <strong className="text-white">
                                            Customer:
                                        </strong>{' '}
                                        {rabJasa.order.customer_name}
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        <strong className="text-white">
                                            Response By:
                                        </strong>{' '}
                                        {rabJasa.response_by}
                                    </p>
                                    <p>
                                        <strong className="text-white">
                                            Response Time:
                                        </strong>{' '}
                                        {formatDate(rabJasa.response_time)}
                                    </p>
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
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Produk
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20">
                                            Harga Jasa
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Bahan Baku
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Dalam
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                            Harga FD
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Luar
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                            Harga FL
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                                            Total Items
                                        </th>
                                        <th className="bg-green-100 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Grand Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {rabJasa.produks.map((produk, produkIndex) => {
                                        // Get bahan baku names from produk (from selected bahan baku)
                                        const bahanBakuNames = produk.bahan_baku_names || [];
                                        
                                        // Group items by jenis with prices (only for finishing)
                                        const finishingDalamItems: { nama: string; harga: number }[] = [];
                                        const finishingLuarItems: { nama: string; harga: number }[] = [];
                                        
                                        let finishingDalamTotal = 0;
                                        let finishingLuarTotal = 0;
                                        
                                        produk.jenis_items.forEach((jenisItem) => {
                                            const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                            if (namaJenis === 'finishing dalam') {
                                                jenisItem.items.forEach(item => {
                                                    const harga = Number(item.harga_total) || 0;
                                                    finishingDalamItems.push({ nama: item.nama_item, harga });
                                                    finishingDalamTotal += harga;
                                                });
                                            } else if (namaJenis === 'finishing luar') {
                                                jenisItem.items.forEach(item => {
                                                    const harga = Number(item.harga_total) || 0;
                                                    finishingLuarItems.push({ nama: item.nama_item, harga });
                                                    finishingLuarTotal += harga;
                                                });
                                            }
                                        });

                                        // Calculate total items (only finishing items for RAB Jasa)
                                        const totalItems = finishingDalamTotal + finishingLuarTotal;
                                        
                                        const maxRows = Math.max(
                                            bahanBakuNames.length,
                                            finishingDalamItems.length,
                                            finishingLuarItems.length,
                                            1
                                        );
                                        
                                        return (
                                            <>
                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                    <tr key={`${produk.id}-${rowIndex}`} className={rowIndex === 0 ? "bg-green-50 dark:bg-green-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}>
                                                        {/* Produk Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700">
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                                    {produkIndex + 1}. {produk.nama_produk}
                                                                </div>
                                                                {produk.panjang && produk.lebar && produk.tinggi && (
                                                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                        {produk.panjang} × {produk.lebar} × {produk.tinggi} m
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Harga Jasa Column - harga_dasar is sum of harga_jasa from selected bahan baku */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_dasar)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Bahan Baku Column - Names only (no price column) */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {bahanBakuNames[rowIndex] && (
                                                                <div>• {bahanBakuNames[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Finishing Dalam Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingDalamItems[rowIndex] && (
                                                                <div>• {finishingDalamItems[rowIndex].nama}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Harga Finishing Dalam Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(finishingDalamTotal)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Finishing Luar Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingLuarItems[rowIndex] && (
                                                                <div>• {finishingLuarItems[rowIndex].nama}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Harga Finishing Luar Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(finishingLuarTotal)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Qty Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.qty_produk}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Total Items Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(totalItems)}
                                                            </td>
                                                        )}
                                                        
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
                    </div>

                    {/* Grand Total */}
                    <div className="mb-6 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">
                                        Grand Total
                                    </h3>
                                    <p className="mt-1 text-sm text-green-100">
                                        Total semua produk (
                                        {rabJasa.produks.length} produk)
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
                            href="/rab-kontrak"
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
