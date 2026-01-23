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
    markup_aksesoris: number;
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
    markup_satuan: number;
    harga_dasar: number;
    harga_items_non_aksesoris: number;
    harga_dimensi: number;
    harga_satuan: number;
     harga_total_aksesoris: number;
     harga_akhir: number;
     diskon_per_produk?: number;
     jenis_items: JenisItem[];
     aksesoris: Aksesoris[];
     bahan_baku_names: string[];
 }

 interface RabInternal {
     id: number;
     response_by: string;
     response_time: string;
     is_submitted: boolean;
     submitted_by?: string;
     submitted_at?: string;
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
         const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
         window.addEventListener('resize', handleResize);
         return () => window.removeEventListener('resize', handleResize);
     }, []);

     const handleSubmit = () => {
         if (confirm('Submit RAB Internal?')) {
             router.post(`/rab-internal/${rabInternal.id}/submit`);
         }
     };

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

     const totalSemuaProduk = rabInternal.produks.reduce(
         (sum, produk) => sum + Number(produk.harga_akhir),
         0,
     );

     const groupedByRuangan = useMemo(() => {
         const groups: { [key: string]: typeof rabInternal.produks } = {};
         rabInternal.produks.forEach((produk) => {
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
     }, [rabInternal.produks]);

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

                    {/* Formula Breakdown Card */}
                    <div className="mb-6 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg sm:rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
                        <div className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="rounded-full bg-indigo-600 p-2">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">📐 Formula RAB Internal</h3>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Rumus perhitungan harga jual dengan markup & aksesoris</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-inner border border-indigo-100 dark:border-indigo-800">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Formula Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs">STEP 1</span>
                                            Harga Satuan
                                        </div>
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-4 rounded-lg border-l-4 border-indigo-500">
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Harga BB</span>
                                                <span className="mx-2">+</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">Finishing</span>
                                                <span className="mx-2">÷</span>
                                                <span className="font-bold text-amber-600 dark:text-amber-400">(Markup / 100)</span>
                                                <span className="mx-2">×</span>
                                                <span className="font-bold text-gray-600 dark:text-gray-400">Dimensi × Qty</span>
                                            </div>
                                            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                                💡 Contoh: Markup 150% → 150/100 = 1.5, lalu harga dibagi 1.5
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-3 flex items-center gap-2">
                                            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs">STEP 2</span>
                                            Harga Akhir
                                        </div>
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-4 rounded-lg border-l-4 border-green-500">
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                                <span className="font-bold text-purple-600 dark:text-purple-400">Harga Satuan</span>
                                                <span className="mx-2">+</span>
                                                <span className="font-bold text-orange-600 dark:text-orange-400">Total Aksesoris</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Legend Section */}
                                    <div>
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📌 Keterangan Komponen:</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-emerald-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Harga BB:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Sum harga bahan baku yang dipilih</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-blue-700 dark:text-blue-400">Finishing:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Finishing Dalam + Finishing Luar</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-amber-700 dark:text-amber-400">Markup:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Persentase dibagi 100 jadi divider (150% → 1.5)</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-gray-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-gray-700 dark:text-gray-400">Dimensi:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> P × L × T (min 1 setiap dimensi)</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded bg-orange-500 mt-0.5 flex-shrink-0"></div>
                                                <div>
                                                    <span className="font-semibold text-orange-700 dark:text-orange-400">Aksesoris:</span>
                                                    <span className="text-gray-600 dark:text-gray-400"> Komponen tambahan (Engsel, Handle, dll)</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">✅ Karakteristik RAB Internal:</div>
                                            <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                                                <li>• Markup sebagai PEMBAGI (150% = 1.5, harga ÷ 1.5)</li>
                                                <li>• Include aksesoris dalam harga akhir</li>
                                                <li>• Pakai harga bahan baku (bukan harga jasa)</li>
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
                                            Harga Dasar
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Markup
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                                            Total BB + Finishing
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Aksesoris
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            QTY
                                        </th>

                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Markup
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                            Harga Aks
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
                                        // Get bahan baku names from produk (from master data)
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

                                        // Calculate total non-aksesoris (only finishing items - bahan baku not included)
                                        const totalNonAksesoris = finishingDalamTotal + finishingLuarTotal;

                                        // Calculate total aksesoris (use Number() to handle null/undefined)
                                        const totalAksesoris = produk.aksesoris.reduce((sum, aks) => sum + (Number(aks.harga_total) || 0), 0);
                                        
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
                                                    <tr key={`produk-${produk.id}-row-${rowIndex}`} className={rowIndex === 0 ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}>
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
                                                    
                                                        
                                                        {/* Bahan Baku Column - Names only (no price) */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {bahanBakuNames[rowIndex] && (
                                                                <div key={`bahan-${produk.id}-${rowIndex}`}>• {bahanBakuNames[rowIndex]}</div>
                                                            )}
                                                        </td>
                                                        
                                                        {/* Finishing Dalam Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {finishingDalamItems[rowIndex] && (
                                                                <div key={`fd-${produk.id}-${rowIndex}`}>• {finishingDalamItems[rowIndex].nama}</div>
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
                                                                <div key={`fl-${produk.id}-${rowIndex}`}>• {finishingLuarItems[rowIndex].nama}</div>
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

                                                        {/* Harga Dasar Column (Total harga bahan baku yang dipilih) */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                {formatCurrency(produk.harga_dasar || 0)}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Markup Column */}
                                                        {rowIndex === 0 && (
                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-amber-600 dark:text-amber-400 border-r border-gray-200 dark:border-gray-700">
                                                                {produk.markup_satuan}%
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
                                                                <div key={`aks-${produk.id}-${produk.aksesoris[rowIndex].id}-${rowIndex}`}>
                                                                    • {produk.aksesoris[rowIndex].nama_aksesoris} 
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* QTY Aksesoris Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div key={`aks-${produk.id}-${produk.aksesoris[rowIndex].id}-${rowIndex}`}>
                                                                    <span className="ml-2 text-sm text-black dark:text-gray-400">
                                                                        {produk.aksesoris[rowIndex].qty_aksesoris}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Markup Aksesoris Column */}
                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                            {produk.aksesoris[rowIndex] && (
                                                                <div key={`aks-${produk.id}-${produk.aksesoris[rowIndex].id}-${rowIndex}`}>
                                                                    <span className="ml-2 text-sm text-black dark:text-gray-400">
                                                                        {produk.aksesoris[rowIndex].markup_aksesoris}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {/* Harga Aksesoris Column */}
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
                    </div>                        {/* Grand Total */}
                        <div className="mb-6 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Grand Total
                                        </h3>
                                        <p className="mt-1 text-sm text-purple-100">
                                            Total semua produk ({rabInternal.produks.length} produk) • {groupedByRuangan.length} ruangan
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
