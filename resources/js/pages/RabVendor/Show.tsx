import { useState, useEffect, useMemo } from 'react';
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
    harga_satuan_aksesoris: number;
    harga_total: number;
}

interface Produk {
    id: number;
    nama_produk: string;
    nama_ruangan: string | null;
    qty_produk: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    harga_dasar: number;
    harga_items_non_aksesoris: number;
    harga_dimensi: number;
    harga_satuan: number;
    harga_total_aksesoris: number;
    harga_akhir: number;
    jenis_items: JenisItem[];
    aksesoris: Aksesoris[];
    bahan_baku_names: string[];
}

// Helper function to calculate total harga for a jenis item
const calculateJenisTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => sum + item.harga_total, 0);
};

interface RabVendor {
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
    rabVendor: RabVendor;
}

export default function Show({ rabVendor }: Props) {
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

    const totalSemuaProduk = rabVendor.produks.reduce((sum, produk) => sum + Number(produk.harga_akhir), 0);

    // Group products by ruangan
    const groupedByRuangan = useMemo(() => {
        const groups: { [key: string]: typeof rabVendor.produks } = {};
        rabVendor.produks.forEach((produk) => {
            const ruangan = produk.nama_ruangan || 'Tanpa Ruangan';
            if (!groups[ruangan]) {
                groups[ruangan] = [];
            }
            groups[ruangan].push(produk);
        });
        return Object.entries(groups).map(([nama_ruangan, produks]) => ({
            nama_ruangan,
            produks,
            total: produks.reduce((sum, p) => sum + Number(p.harga_akhir), 0),
        }));
    }, [rabVendor.produks]);

    return (
        <>
            <Head title="Detail RAB Vendor" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-vendor" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                            <div className="flex justify-between">
                                <h2 className="text-2xl font-bold text-white">
                                    RAB Vendor
                                </h2>
                                <div className="flex items-center space-x-3">
                                    <button className="bg-green-600">
                                        <a
                                            href={`/rab-vendor/${rabVendor.id}/pdf`}
                                            className="rounded-3xl inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Download PDF
                                        </a>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Regenerate RAB Vendor dengan harga terbaru dari master data?')) {
                                                router.post(`/rab-vendor/${rabVendor.id}/regenerate`);
                                            }
                                        }}
                                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-700 hover:shadow-xl"
                                    >
                                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-blue-50 md:grid-cols-2">
                                <div>
                                    <p><strong className="text-white">Project:</strong> {rabVendor.order.nama_project}</p>
                                    <p><strong className="text-white">Company:</strong> {rabVendor.order.company_name}</p>
                                    <p><strong className="text-white">Customer:</strong> {rabVendor.order.customer_name}</p>
                                </div>
                                <div>
                                    <p><strong className="text-white">Response By:</strong> {rabVendor.response_by}</p>
                                    <p><strong className="text-white">Response Time:</strong> {formatDate(rabVendor.response_time)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formula Breakdown Card - RAB Vendor */}
                    <div className="mb-6 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-lg sm:rounded-lg border-2 border-blue-200 dark:border-blue-700">
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="rounded-full bg-blue-600 p-2">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">🏭 Formula RAB Vendor</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Harga original untuk purchase order vendor (TANPA markup)</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-inner border border-blue-100 dark:border-blue-800">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Formula Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">STEP 1</span>
                                            Harga Satuan (Tanpa Markup)
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-4 rounded-lg border-l-4 border-blue-500">
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Harga BB</span>
                                                <span className="mx-2">+</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">Finishing</span>
                                                <span className="mx-2">×</span>
                                                <span className="font-bold text-gray-600 dark:text-gray-400">Dimensi × Qty</span>
                                            </div>
                                            <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                                                ⚠️ TANPA MARKUP (Harga Original)
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-3 flex items-center gap-2">
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">STEP 2</span>
                                            Harga Akhir
                                        </div>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border-l-4 border-green-500">
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                                <span className="font-bold text-blue-600 dark:text-blue-400">Harga Satuan</span>
                                                <span className="mx-2">+</span>
                                                <span className="font-bold text-orange-600 dark:text-orange-400">Total Aksesoris</span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                                Aksesoris juga tanpa markup (harga original)
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Legend Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📌 Keterangan:</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-emerald-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Harga BB:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Harga original dari master data</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-blue-700 dark:text-blue-400">Finishing:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Harga original finishing dalam + luar</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-red-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-red-700 dark:text-red-400">No Markup:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Harga asli tanpa profit margin</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-orange-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-orange-700 dark:text-orange-400">Aksesoris:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Include dengan harga original</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">✅ Karakteristik RAB Vendor:</div>
                                            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                                <li>• TANPA markup (harga original)</li>
                                                <li>• Untuk purchase order ke vendor</li>
                                                <li>• Include aksesoris harga original</li>
                                                <li>• Harga murni cost tanpa profit</li>
                                            </ul>
                                        </div>
                                    </div>
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

                                         <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                                            Total Non-Aks
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Aksesoris
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            QTY
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Total Harga Aks
                                        </th>
                                        <th className="bg-green-100 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Grand Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {groupedByRuangan.map((ruangan, ruanganIndex) => (
                                        <>
                                            <tr key={`ruangan-header-${ruanganIndex}`} className="bg-gradient-to-r from-cyan-500 to-cyan-600">
                                                <td colSpan={14} className="px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                            </svg>
                                                            <span className="text-lg font-bold text-white">{ruangan.nama_ruangan}</span>
                                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                                                                {ruangan.produks.length} produk
                                                            </span>
                                                        </div>
                                                        <span className="text-lg font-bold text-white">
                                                            Subtotal: {formatCurrency(ruangan.total)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {ruangan.produks.map((produk, produkIndex) => {
                                                const bahanBakuNames = produk.bahan_baku_names || [];

                                                const finishingDalamItems: { nama: string; harga: number }[] = [];
                                                const finishingLuarItems: { nama: string; harga: number }[] = [];
                                                let finishingDalamTotal = 0;
                                                let finishingLuarTotal = 0;

                                                produk.jenis_items.forEach((jenisItem) => {
                                                    const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                                    if (namaJenis === 'finishing dalam') {
                                                        jenisItem.items.forEach((item) => {
                                                            const harga = Number(item.harga_total) || 0;
                                                            finishingDalamItems.push({ nama: item.nama_item, harga });
                                                            finishingDalamTotal += harga;
                                                        });
                                                    } else if (namaJenis === 'finishing luar') {
                                                        jenisItem.items.forEach((item) => {
                                                            const harga = Number(item.harga_total) || 0;
                                                            finishingLuarItems.push({ nama: item.nama_item, harga });
                                                            finishingLuarTotal += harga;
                                                        });
                                                    }
                                                });

                                                const totalAksesoris = (produk.aksesoris || []).reduce(
                                                    (sum, aks) => sum + (Number(aks.harga_total) || 0),
                                                    0,
                                                );
                                                const totalNonAksesoris = (Number(produk.harga_akhir) || 0) - totalAksesoris;

                                                const maxRows = Math.max(
                                                    bahanBakuNames.length,
                                                    finishingDalamItems.length,
                                                    finishingLuarItems.length,
                                                    produk.aksesoris.length,
                                                    1,
                                                );

                                                return (
                                                    <>
                                                        {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                            <tr
                                                                key={`${produk.id}-${rowIndex}`}
                                                                className={rowIndex === 0 ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                                            >
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

                                                                

                                                                {/* Bahan Baku Column - Names only */}
                                                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                    {bahanBakuNames[rowIndex] && <div>• {bahanBakuNames[rowIndex]}</div>}
                                                                </td>

                                                                {/* Finishing Dalam Column */}
                                                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                    {finishingDalamItems[rowIndex] && <div>• {finishingDalamItems[rowIndex].nama}</div>}
                                                                </td>

                                                                {/* Harga Finishing Dalam Column */}
                                                                {rowIndex === 0 && (
                                                                    <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                        {formatCurrency(finishingDalamTotal)}
                                                                    </td>
                                                                )}

                                                                {/* Finishing Luar Column */}
                                                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                    {finishingLuarItems[rowIndex] && <div>• {finishingLuarItems[rowIndex].nama}</div>}
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

                                                                {/* Harga Dasar Column */}
                                                                {rowIndex === 0 && (
                                                                    <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                        {formatCurrency(produk.harga_dasar || 0)}
                                                                    </td>
                                                                )}

                                                                {/* Total Non-Aksesoris Column */}
                                                                {rowIndex === 0 && (
                                                                    <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                        {formatCurrency(totalNonAksesoris)}
                                                                    </td>
                                                                )}

                                                                {/* Aksesoris Column */}
                                                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                    {produk.aksesoris[rowIndex] && (
                                                        <div>• {produk.aksesoris[rowIndex].nama_aksesoris}</div>
                                                    )}
                                                </td>

                                                {/* QTY Aksesoris Column */}
                                                <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                    {produk.aksesoris[rowIndex] && (
                                                        <div>{produk.aksesoris[rowIndex].qty_aksesoris}</div>
                                                    )}
                                                </td>

                                                {/* Harga Satuan Aksesoris Column */}
                                                <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                    {produk.aksesoris[rowIndex] && (
                                                        <div>{formatCurrency(Number(produk.aksesoris[rowIndex].harga_satuan_aksesoris) || 0)}</div>
                                                    )}
                                                </td>

                                                {/* Total Harga Aksesoris Column */}
                                                <td className="px-4 py-2 text-sm text-right text-orange-700 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10 border-r border-gray-200 dark:border-gray-700">
                                                    {produk.aksesoris[rowIndex] && (
                                                        <div className="font-medium">{formatCurrency(Number(produk.aksesoris[rowIndex].harga_total) || 0)}</div>
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
                                        </>
                                    ))}
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
                                        Total semua produk ({rabVendor.produks.length} produk) • {groupedByRuangan.length} ruangan
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
                            href="/rab-vendor"
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
