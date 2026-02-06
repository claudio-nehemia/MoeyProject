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
    harga_finishing_dalam?: number;
    harga_finishing_luar?: number;
    harga_items_non_aksesoris?: number;
    harga_dimensi?: number;
    harga_satuan?: number;
    harga_total_aksesoris?: number;
    harga_akhir: number;
    diskon_per_produk?: number;
    jenis_items: JenisItem[];
    aksesoris: Aksesoris[];
    bahan_baku_names: string[];
}

interface RabKontrak {
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
    rabKontrak: RabKontrak;
}

export default function Show({ rabKontrak }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const totalSemuaProduk = rabKontrak.produks.reduce(
        (sum, produk) => sum + Number(produk.harga_akhir),
        0,
    );

    const groupedByRuangan = useMemo(() => {
        const groups: { [key: string]: typeof rabKontrak.produks } = {};
        rabKontrak.produks.forEach((produk) => {
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
    }, [rabKontrak.produks]);

    return (
        <>
            <Head title="Detail RAB Kontrak" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-kontrak" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                            <div className="flex justify-between">
                                <h2 className="text-2xl font-bold text-white">
                                    RAB Kontrak
                                </h2>
                                <div className="flex space-x-3">
                                    <button className="bg-green-600">
                                        <a
                                            href={`/rab-kontrak/${rabKontrak.id}/pdf`}
                                            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                        >
                                            Download PDF
                                        </a>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Regenerate RAB Kontrak dengan harga terbaru dari master data?')) {
                                                router.post(`/rab-kontrak/${rabKontrak.id}/regenerate`);
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

                            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-purple-50 md:grid-cols-2">
                                <div>
                                    <p><strong className="text-white">Project:</strong> {rabKontrak.order.nama_project}</p>
                                    <p><strong className="text-white">Company:</strong> {rabKontrak.order.company_name}</p>
                                    <p><strong className="text-white">Customer:</strong> {rabKontrak.order.customer_name}</p>
                                </div>
                                <div>
                                    <p><strong className="text-white">Response By:</strong> {rabKontrak.response_by}</p>
                                    <p><strong className="text-white">Response Time:</strong> {formatDate(rabKontrak.response_time)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formula Breakdown Card - RAB Kontrak */}
                    <div className="mb-6 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg sm:rounded-lg border-2 border-purple-200 dark:border-purple-700">
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="rounded-full bg-purple-600 p-2">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">📋 Formula RAB Kontrak</h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">Harga untuk kontrak customer (diambil dari RAB Internal)</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-inner border border-purple-100 dark:border-purple-800">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Formula Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs">FORMULA</span>
                                            Rumus RAB Kontrak
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg border-l-4 border-purple-500">
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200 mb-3">
                                                <div className="font-bold text-purple-700 dark:text-purple-400 mb-2">⚡ Formula Utama:</div>
                                                <code className="bg-white dark:bg-gray-900 px-3 py-2 rounded block">
                                                    (BB + Fin. Dalam + Fin. Luar) ÷ (1 - Markup/100) × Dimensi × Qty
                                                </code>
                                            </div>
                                            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                                                <div>• <strong>BB</strong> = Bahan Baku (dari RAB Internal)</div>
                                                <div>• <strong>Fin. Dalam + Fin. Luar</strong> = Total Finishing</div>
                                                <div>• <strong>Markup</strong> = % markup dari RAB Internal</div>
                                                <div>• <strong>Dimensi</strong> = P × L × T × Qty produk</div>
                                                <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                                                    💡 <strong>Contoh:</strong> Markup 20% → (1-0.2) = 0.8, maka harga <strong>DIBAGI</strong> 0.8
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-3 flex items-center gap-2">
                                            <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs">BREAKDOWN</span>
                                            Detail Harga per Kolom
                                        </div>
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-4 rounded-lg border-l-4 border-amber-500">
                                            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                                                <div>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Harga BB (Kontrak)</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">BB Internal ÷ (1 - Markup/100)</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">Finishing Dalam</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">Fin. Dalam Internal ÷ (1 - Markup/100)</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-cyan-600 dark:text-cyan-400">Finishing Luar</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">Fin. Luar Internal ÷ (1 - Markup/100)</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Harga Satuan</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">(BB + Fin. Dalam + Fin. Luar) × Dimensi</span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">Aksesoris</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">Harga Aks ÷ (1 - Markup/100) × Qty</span>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                                                    <span className="font-bold text-green-600 dark:text-green-400">Harga Akhir</span>
                                                    <span className="mx-2">=</span>
                                                    <span className="text-gray-600 dark:text-gray-400">Harga Satuan + Total Aksesoris - Diskon</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Legend Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📌 Keterangan:</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-purple-700 dark:text-purple-400">Data Source:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Diambil dari RAB Internal</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-amber-700 dark:text-amber-400">Markup:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Diterapkan ke Harga BB & Finishing</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-indigo-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">Harga Satuan:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Sudah include markup dari Internal</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-orange-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-orange-700 dark:text-orange-400">Aksesoris:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Include dalam harga akhir</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                                            <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">✅ Karakteristik RAB Kontrak:</div>
                                            <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                                                <li>• Markup diterapkan dengan PEMBAGIAN (20% → 0.8, harga ÷ 0.8)</li>
                                                <li>• Breakdown harga BB, Finishing Dalam, Finishing Luar sudah di-markup</li>
                                                <li>• Setiap kolom harga sudah include markup untuk customer</li>
                                                <li>• Include aksesoris dengan markup yang sama</li>
                                                <li>• Tidak menampilkan kolom markup (karena sudah diterapkan)</li>
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
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
                                            Harga Dasar
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Dalam
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                            Harga Fin. Dalam
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Finishing Luar
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20">
                                            Harga Fin. Luar
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Qty
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                                            Total Item
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Aksesoris
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            QTY
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Harga Aksesoris
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Total Harga Aksesoris
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20">
                                            Diskon
                                        </th>
                                        <th className="bg-green-100 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Grand Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {groupedByRuangan.map((ruangan, ruanganIndex) => (
                                        <>
                                            {/* Ruangan Header Row */}
                                            <tr key={`ruangan-header-${ruanganIndex}`} className="bg-gradient-to-r from-cyan-500 to-cyan-600">
                                                <td colSpan={16} className="px-4 py-3">
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
                                            {/* Products in this Ruangan */}
                                            {ruangan.produks.map((produk, produkIndex) => {
                                        // Get bahan baku names from produk (from selected bahan baku)
                                        const bahanBakuNames = produk.bahan_baku_names || [];
                                        
                                        // Group items by jenis with prices (only for finishing)
                                        const finishingDalamItems: { nama: string; harga: number }[] = [];
                                        const finishingLuarItems: { nama: string; harga: number }[] = [];
                                        
                                        produk.jenis_items.forEach((jenisItem) => {
                                            const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                            if (namaJenis === 'finishing dalam') {
                                                jenisItem.items.forEach(item => {
                                                    const harga = Number(item.harga_total) || 0;
                                                    finishingDalamItems.push({ nama: item.nama_item, harga });
                                                });
                                            } else if (namaJenis === 'finishing luar') {
                                                jenisItem.items.forEach(item => {
                                                    const harga = Number(item.harga_total) || 0;
                                                    finishingLuarItems.push({ nama: item.nama_item, harga });
                                                });
                                            }
                                        });

                                        // Calculate total item = harga_akhir - total aksesoris
                                        const totalAksesoris = produk.aksesoris.reduce((sum, aks) => sum + (Number(aks.harga_total) || 0), 0);
                                        const totalItem = Number(produk.harga_akhir) - totalAksesoris;
                                        
                                        const maxRows = Math.max(
                                            bahanBakuNames.length,
                                            finishingDalamItems.length,
                                            finishingLuarItems.length,
                                            produk.aksesoris.length,
                                            1
                                        );
                                        
                                        return (
                                            <>
                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                    <tr key={`${produk.id}-${rowIndex}`} className={rowIndex === 0 ? "bg-purple-50 dark:bg-purple-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}>
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
                                                            {bahanBakuNames[rowIndex] && (
                                                                <div>• {bahanBakuNames[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Harga BB Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_dasar || 0)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Finishing Dalam Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingDalamItems[rowIndex] && (
                                                                <div>• {finishingDalamItems[rowIndex].nama}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Harga Finishing Dalam Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_finishing_dalam || 0)}
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
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_finishing_luar || 0)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Qty Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.qty_produk}
                                                            </td>
                                                        )}

                                                        {/* Harga Dasar Column - REMOVED, already shown after Bahan Baku */}
                                                        {/* {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_dasar || 0)}
                                                            </td>
                                                        )} */}
                                                        
                                                        {/* Total Item Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(totalItem)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Aksesoris Column with price per item */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div>
                                                                    <div className="font-medium">• {produk.aksesoris[rowIndex].nama_aksesoris}</div>
                                                                    
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Aksesoris Qty Column */}
                                                        <td className="px-4 py-2 text-right text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div>
                                                                    {produk.aksesoris[rowIndex].qty_aksesoris}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Aksesoris Harga Satuan Column */}
                                                        <td className="px-4 py-2 text-right text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div>
                                                                    {formatCurrency(produk.aksesoris[rowIndex].harga_satuan_aksesoris)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Total Aksesoris Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(totalAksesoris)}
                                                            </td>
                                                        )}

                                                        {/* Diskon Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-rose-700 dark:text-rose-300 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.diskon_per_produk ?? 0}%
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
                                        Total semua produk ({rabKontrak.produks.length} produk) • {groupedByRuangan.length} ruangan
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
