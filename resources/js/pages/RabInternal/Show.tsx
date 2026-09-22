import { useState, useEffect, useMemo, Fragment } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import {
    FileText,
    FileSpreadsheet,
    Building2,
    Globe,
    Calculator,
    Lightbulb,
    Info,
    CheckCircle2,
    Layers,
    Hammer,
    Factory
} from 'lucide-react';

interface Item {
    nama_item: string;
    harga_satuan: number;
    qty: number;
    harga_total: number;
    kategori?: 'internal' | 'fisik' | 'eksternal';
    vendor_name?: string | null;
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
    kategori?: 'internal' | 'fisik' | 'eksternal';
    vendor_name?: string | null;
}

interface Produk {
    id: number;
    nama_produk: string;
    kategori?: 'internal' | 'fisik' | 'eksternal';
    vendor_id?: number | null;
    vendor_name?: string | null;
    vendor_phone?: string | null;
    vendor_code?: string | null;
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
    const [activeCategoryTab, setActiveCategoryTab] = useState<'semua' | 'internal' | 'fisik' | 'eksternal'>('semua');

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

    const categoryTotals = useMemo(() => {
        let internal = 0;
        let fisik = 0;
        let eksternal = 0;

        rabInternal.produks.forEach((produk) => {
            const cat = (produk.kategori || 'internal').toLowerCase();
            const harga = Number(produk.harga_akhir) || 0;
            if (cat === 'fisik') fisik += harga;
            else if (cat === 'eksternal') eksternal += harga;
            else internal += harga;
        });

        return {
            internal,
            fisik,
            eksternal,
            total: internal,
        };
    }, [rabInternal.produks]);

    const filteredProduks = useMemo(() => {
        if (activeCategoryTab === 'semua') return rabInternal.produks;
        return rabInternal.produks.filter((p) => (p.kategori || 'internal').toLowerCase() === activeCategoryTab);
    }, [rabInternal.produks, activeCategoryTab]);

    // Grouping by Ruangan (for Semua, Internal, Fisik)
    const groupedByRuangan = useMemo(() => {
        const groups: { [key: string]: typeof filteredProduks } = {};
        filteredProduks.forEach((produk) => {
            const ruangan = produk.nama_ruangan || 'Tanpa Ruangan';
            if (!groups[ruangan]) {
                groups[ruangan] = [];
            }
            groups[ruangan].push(produk);
        });
        return Object.entries(groups).map(([nama_ruangan, produks]) => ({
            nama_ruangan,
            produks,
            total: produks.reduce((sum, p) => sum + ((p.kategori || 'internal').toLowerCase() === 'internal' ? Number(p.harga_akhir) : 0), 0),
        }));
    }, [filteredProduks]);

    // Grouping by Vendor (specifically for Eksternal / Vendor tab)
    const groupedByVendor = useMemo(() => {
        const groups: { [key: string]: { vendor_name: string; vendor_id?: number | null; produks: Produk[] } } = {};
        filteredProduks.forEach((produk) => {
            const vName = produk.vendor_name || 'Tanpa Vendor / Vendor Umum';
            if (!groups[vName]) {
                groups[vName] = {
                    vendor_name: vName,
                    vendor_id: produk.vendor_id,
                    produks: [],
                };
            }
            groups[vName].produks.push(produk);
        });
        return Object.values(groups);
    }, [filteredProduks]);

    const isNonHargaTab = activeCategoryTab === 'fisik' || activeCategoryTab === 'eksternal';

    return (
        <>
            <Head title="Detail RAB Internal" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-internal" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-20 p-3">
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
                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-amber-400/30 pt-4">
                                        <span className="text-xs font-bold text-amber-100 uppercase tracking-wider mr-1">Export PDF:</span>
                                        <a
                                            href={`/rab-internal/${rabInternal.id}/pdf`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition"
                                            title="Export PDF Semua Kategori"
                                        >
                                            <FileText className="w-3.5 h-3.5" /> Semua
                                        </a>
                                        <a
                                            href={`/rab-internal/${rabInternal.id}/pdf?category=internal`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition"
                                            title="Export PDF Kategori Internal"
                                        >
                                            <Factory className="w-3.5 h-3.5" /> Internal
                                        </a>
                                        <a
                                            href={`/rab-internal/${rabInternal.id}/pdf?category=fisik`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-amber-800 transition"
                                            title="Export PDF Fisik"
                                        >
                                            <Building2 className="w-3.5 h-3.5" /> Fisik
                                        </a>
                                        <a
                                            href={`/rab-internal/${rabInternal.id}/pdf?category=eksternal`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-purple-800 transition"
                                            title="Export PDF Eksternal (Semua Vendor)"
                                        >
                                            <Globe className="w-3.5 h-3.5" /> Eksternal
                                        </a>

                                        <div className="h-4 w-px bg-amber-300/40 mx-1 hidden sm:block"></div>

                                        <a
                                            href={`/rab-internal/${rabInternal.id}/excel`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition ml-auto sm:ml-0"
                                        >
                                            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                                        </a>
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

                    {/* Category Subtotal Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                                        <Factory className="w-3.5 h-3.5" /> RAB Internal
                                    </span>
                                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">Internal</span>
                                </div>
                                <p className="mt-2 font-mono text-xl font-bold text-emerald-950">{formatCurrency(categoryTotals.internal)}</p>
                                <span className="text-[10px] font-medium text-emerald-700">Rincian dengan harga & markup</span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-emerald-200/60">
                                <a
                                    href={`/rab-internal/${rabInternal.id}/pdf?category=internal`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition"
                                >
                                    <FileText className="w-3 h-3" /> Export PDF Internal →
                                </a>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> RAB Fisik
                                    </span>
                                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">Fisik</span>
                                </div>
                                <p className="mt-2 font-bold text-amber-950 text-sm">Spesifikasi Item Fisik</p>
                                <span className="text-[10px] font-medium text-amber-700">Non-Harga (Tanpa Harga)</span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-amber-200/60">
                                <a
                                    href={`/rab-internal/${rabInternal.id}/pdf?category=fisik`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 transition"
                                >
                                    <FileText className="w-3 h-3" /> Export PDF Fisik →
                                </a>
                            </div>
                        </div>

                        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-purple-800 tracking-wider flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5" /> RAB Eksternal
                                    </span>
                                    <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-extrabold text-purple-900">Eksternal</span>
                                </div>
                                <p className="mt-2 font-bold text-purple-950 text-sm">Spesifikasi per Vendor</p>
                                <span className="text-[10px] font-medium text-purple-700">Non-Harga (Tanpa Harga)</span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-purple-200/60">
                                <a
                                    href={`/rab-internal/${rabInternal.id}/pdf?category=eksternal`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 transition"
                                >
                                    <FileText className="w-3 h-3" /> Export PDF Eksternal →
                                </a>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-200 bg-indigo-600 p-4 text-white shadow-md flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-indigo-100 tracking-wider flex items-center gap-1.5">
                                        <FileSpreadsheet className="w-3.5 h-3.5" /> Grand Total RAB
                                    </span>
                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">Internal</span>
                                </div>
                                <p className="mt-2 font-mono text-xl font-bold text-white">{formatCurrency(categoryTotals.internal)}</p>
                                <span className="text-[10px] text-indigo-200">Total Harga Internal</span>
                            </div>
                            <div className="mt-3 pt-2 border-t border-indigo-500">
                                <a
                                    href={`/rab-internal/${rabInternal.id}/pdf`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-100 hover:text-white transition"
                                >
                                    <FileText className="w-3 h-3" /> Export PDF Semua →
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Formula Breakdown Card - Only show when Internal or Semua is selected */}
                    {!isNonHargaTab && (
                        <div className="mb-6 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg sm:rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
                            <div className="p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="rounded-full bg-indigo-600 p-2">
                                        <Calculator className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                            Formula RAB Internal
                                        </h3>
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
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-l-4 border-indigo-500">
                                                <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">(BB + Finishing)</span>
                                                    <span className="mx-2">÷</span>
                                                    <span className="font-bold text-amber-600 dark:text-amber-400">(1 - Markup/100)</span>
                                                    <span className="mx-2">×</span>
                                                    <span className="font-bold text-gray-600 dark:text-gray-400">Dimensi × Qty</span>
                                                </div>
                                                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                    <span>Contoh: Markup 20% → (BB+Fin) ÷ 0.8 × Dim × Qty</span>
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
                                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                                                <Info className="w-4 h-4 text-stone-600" /> Keterangan Komponen:
                                            </div>
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
                                                    <span className="font-bold text-amber-700 dark:text-amber-400">Markup:</span>
                                                        <span className="text-gray-600 dark:text-gray-400"> Divider: 1 - (Markup/100). Contoh 20% → 1-0.2 = 0.8</span>
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
                                            
                                            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                <div className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Karakteristik RAB Internal:
                                                </div>
                                                <ul className="text-xs text-indigo-600 space-y-1">
                                                    <li>• Markup sebagai PEMBAGI dengan rumus (1 - markup/100)</li>
                                                    <li>• Include aksesoris dalam harga akhir</li>
                                                    <li>• Pakai harga bahan baku (bukan harga jasa)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category Filter Tab Bar */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white p-2 rounded-xl shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { key: 'semua', label: 'Semua Produk', count: rabInternal.produks.length, icon: Layers },
                                { key: 'internal', label: 'Internal (Workshop)', count: rabInternal.produks.filter(p => (p.kategori || 'internal').toLowerCase() === 'internal').length, icon: Factory },
                                { key: 'fisik', label: 'Fisik (Kontraktor)', count: rabInternal.produks.filter(p => (p.kategori || 'internal').toLowerCase() === 'fisik').length, icon: Building2 },
                                { key: 'eksternal', label: 'Eksternal (Vendor)', count: rabInternal.produks.filter(p => (p.kategori || 'internal').toLowerCase() === 'eksternal').length, icon: Globe },
                            ].map((tab) => {
                                const TabIcon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveCategoryTab(tab.key as any)}
                                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                            activeCategoryTab === tab.key
                                                ? 'bg-amber-500 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <TabIcon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                                            activeCategoryTab === tab.key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <a
                            href={`/rab-internal/${rabInternal.id}/pdf${activeCategoryTab !== 'semua' ? `?category=${activeCategoryTab}` : ''}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition ml-auto"
                            title={`Export PDF ${activeCategoryTab.toUpperCase()}`}
                        >
                            <FileText className="w-3.5 h-3.5" /> Export PDF {activeCategoryTab === 'semua' ? 'Semua' : activeCategoryTab.toUpperCase()}
                        </a>
                    </div>

                    {/* ================= CONDITION 1: EKSTERNAL TAB (GROUPED BY VENDOR) ================= */}
                    {activeCategoryTab === 'eksternal' ? (
                        <div className="space-y-6 mb-8">
                            {groupedByVendor.length === 0 ? (
                                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    Tidak ada produk kategori EKSTERNAL pada project ini.
                                </div>
                            ) : (
                                groupedByVendor.map((vendorGroup, vIdx) => (
                                    <div key={`vendor-group-${vIdx}`} className="overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800 border border-purple-200/70 dark:border-purple-900/40">
                                        {/* Vendor Header Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-700 to-indigo-700 px-5 py-3 text-white">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-base">
                                                    <Building2 className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold tracking-wide uppercase">
                                                        Vendor: {vendorGroup.vendor_name}
                                                    </h3>
                                                    <p className="text-[11px] text-purple-200">
                                                        {vendorGroup.produks.length} item pekerjaan / produk
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/rab-internal/${rabInternal.id}/pdf?category=eksternal&vendor_name=${encodeURIComponent(vendorGroup.vendor_name)}${vendorGroup.vendor_id ? `&vendor_id=${vendorGroup.vendor_id}` : ''}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-purple-900 shadow hover:bg-purple-50 transition"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Export PDF ({vendorGroup.vendor_name})
                                            </a>
                                        </div>

                                        {/* Non-Harga Table with same columns */}
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
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                            Aksesoris
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                            Qty
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                    {vendorGroup.produks.map((produk, produkIndex) => {
                                                        const bahanBakuNames = produk.bahan_baku_names || [];
                                                        const finishingDalamItems: string[] = [];
                                                        const finishingLuarItems: string[] = [];

                                                        produk.jenis_items.forEach((jenisItem) => {
                                                            const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                                            if (namaJenis === 'finishing dalam') {
                                                                jenisItem.items.forEach(item => finishingDalamItems.push(item.nama_item));
                                                            } else if (namaJenis === 'finishing luar') {
                                                                jenisItem.items.forEach(item => finishingLuarItems.push(item.nama_item));
                                                            }
                                                        });

                                                        const maxRows = Math.max(
                                                            bahanBakuNames.length,
                                                            finishingDalamItems.length,
                                                            finishingLuarItems.length,
                                                            produk.aksesoris.length,
                                                            1
                                                        );

                                                        return (
                                                            <Fragment key={`vendor-${vIdx}-p-${produk.id}`}>
                                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                                    <tr
                                                                        key={`vendor-${vIdx}-p-${produk.id}-row-${rowIndex}`}
                                                                        className={rowIndex === 0 ? "bg-purple-50/30 dark:bg-purple-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                                                                    >
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
                                                                                {produk.nama_ruangan && (
                                                                                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                                                                                        📍 {produk.nama_ruangan}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {bahanBakuNames[rowIndex] && (
                                                                                <div>• {bahanBakuNames[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {finishingDalamItems[rowIndex] && (
                                                                                <div>• {finishingDalamItems[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {finishingLuarItems[rowIndex] && (
                                                                                <div>• {finishingLuarItems[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-center text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                                {produk.qty_produk}
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {produk.aksesoris[rowIndex] && (
                                                                                <div>• {produk.aksesoris[rowIndex].nama_aksesoris}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                            {produk.aksesoris[rowIndex] && (
                                                                                <span>{produk.aksesoris[rowIndex].qty_aksesoris}</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : isNonHargaTab ? (
                        /* ================= CONDITION 2: FISIK TAB (NON-HARGA, SAME COLUMNS) ================= */
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
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Aksesoris
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Qty
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {filteredProduks.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-500">
                                                    Tidak ada produk kategori FISIK pada project ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            groupedByRuangan.map((ruangan, ruanganIndex) => (
                                                <Fragment key={`ruangan-fisik-${ruanganIndex}`}>
                                                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                                                        <td colSpan={7} className="px-4 py-3">
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
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {ruangan.produks.map((produk, produkIndex) => {
                                                        const bahanBakuNames = produk.bahan_baku_names || [];
                                                        const finishingDalamItems: string[] = [];
                                                        const finishingLuarItems: string[] = [];

                                                        produk.jenis_items.forEach((jenisItem) => {
                                                            const namaJenis = jenisItem.nama_jenis.toLowerCase();
                                                            if (namaJenis === 'finishing dalam') {
                                                                jenisItem.items.forEach(item => finishingDalamItems.push(item.nama_item));
                                                            } else if (namaJenis === 'finishing luar') {
                                                                jenisItem.items.forEach(item => finishingLuarItems.push(item.nama_item));
                                                            }
                                                        });

                                                        const maxRows = Math.max(
                                                            bahanBakuNames.length,
                                                            finishingDalamItems.length,
                                                            finishingLuarItems.length,
                                                            produk.aksesoris.length,
                                                            1
                                                        );

                                                        return (
                                                            <Fragment key={`fisik-p-${produk.id}`}>
                                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                                    <tr
                                                                        key={`fisik-p-${produk.id}-row-${rowIndex}`}
                                                                        className={rowIndex === 0 ? "bg-amber-50/40 dark:bg-amber-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}
                                                                    >
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
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {bahanBakuNames[rowIndex] && (
                                                                                <div>• {bahanBakuNames[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {finishingDalamItems[rowIndex] && (
                                                                                <div>• {finishingDalamItems[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {finishingLuarItems[rowIndex] && (
                                                                                <div>• {finishingLuarItems[rowIndex]}</div>
                                                                            )}
                                                                        </td>
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-center text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                                {produk.qty_produk}
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                                                            {produk.aksesoris[rowIndex] && (
                                                                                <div>• {produk.aksesoris[rowIndex].nama_aksesoris}</div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                            {produk.aksesoris[rowIndex] && (
                                                                                <span>{produk.aksesoris[rowIndex].qty_aksesoris}</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* ================= CONDITION 3: FULL INTERNAL CALCULATION TABLE (INTERNAL & SEMUA) ================= */
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
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20">
                                                Total BB + Finishing
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Markup
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20">
                                                Harga Satuan
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
                                        {filteredProduks.length === 0 ? (
                                            <tr>
                                                <td colSpan={17} className="py-12 text-center text-gray-500">
                                                    Tidak ada produk ditemukan.
                                                </td>
                                            </tr>
                                        ) : (
                                            groupedByRuangan.map((ruangan, ruanganIndex) => (
                                                <Fragment key={`ruangan-header-${ruanganIndex}`}>
                                                    {/* Ruangan Header Row */}
                                                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-600">
                                                        <td colSpan={17} className="px-4 py-3">
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
                                                        const isItemInternal = (produk.kategori || 'internal').toLowerCase() === 'internal';
                                                        const bahanBakuNames = produk.bahan_baku_names || [];
                                                        
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

                                                        const totalBBPlusFinishing = (Number(produk.harga_dasar) || 0) + finishingDalamTotal + finishingLuarTotal;
                                                        const totalAksesoris = produk.aksesoris.reduce((sum, aks) => sum + (Number(aks.harga_total) || 0), 0);
                                                        
                                                        const maxRows = Math.max(
                                                            bahanBakuNames.length,
                                                            finishingDalamItems.length,
                                                            finishingLuarItems.length,
                                                            produk.aksesoris.length,
                                                            1
                                                        );
                                                        
                                                        return (
                                                            <Fragment key={`produk-block-${produk.id}`}>
                                                                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                                    <tr key={`produk-${produk.id}-row-${rowIndex}`} className={rowIndex === 0 ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}>
                                                                        {/* Produk Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700">
                                                                                <div className="flex items-center flex-wrap gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                                                                                    <span>{produkIndex + 1}. {produk.nama_produk}</span>
                                                                                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                                                                                        (produk.kategori || 'internal') === 'fisik' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                                                        (produk.kategori || 'internal') === 'eksternal' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                                                                        'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                                    }`}>
                                                                                        {produk.kategori || 'internal'}
                                                                                    </span>
                                                                                </div>
                                                                                {produk.panjang && produk.lebar && produk.tinggi && (
                                                                                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                                        {produk.panjang} × {produk.lebar} × {produk.tinggi} m
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        )}
                                                                    
                                                                        {/* Bahan Baku Column */}
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
                                                                                {isItemInternal ? formatCurrency(finishingDalamTotal) : '-'}
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
                                                                                {isItemInternal ? formatCurrency(finishingLuarTotal) : '-'}
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
                                                                                {isItemInternal ? formatCurrency(produk.harga_dasar || 0) : '-'}
                                                                            </td>
                                                                        )}
                                                                        
                                                                        {/* Total BB + Finishing Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                                {isItemInternal ? formatCurrency(totalBBPlusFinishing) : '-'}
                                                                            </td>
                                                                        )}
                                                                        
                                                                        {/* Markup Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                                                                                {isItemInternal ? `${produk.markup_satuan}%` : '-'}
                                                                            </td>
                                                                        )}
                                                                        
                                                                        {/* Harga Satuan Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                                {isItemInternal ? formatCurrency(produk.harga_satuan || 0) : '-'}
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
                                                                                        {isItemInternal ? `${produk.aksesoris[rowIndex].markup_aksesoris}%` : '-'}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        {/* Harga Aksesoris Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 align-top text-right text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10 border-r border-gray-200 dark:border-gray-700">
                                                                                {isItemInternal ? formatCurrency(totalAksesoris) : '-'}
                                                                            </td>
                                                                        )}

                                                                        {/* Diskon Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="px-4 py-3 text-center align-top text-sm font-medium text-rose-700 dark:text-rose-300 border-r border-gray-200 dark:border-gray-700">
                                                                                {isItemInternal ? `${produk.diskon_per_produk ?? 0}%` : '-'}
                                                                            </td>
                                                                        )}
                                                                        
                                                                        {/* Grand Total Column */}
                                                                        {rowIndex === 0 && (
                                                                            <td rowSpan={maxRows} className="bg-gradient-to-b from-green-50 to-green-100 px-4 py-3 align-top text-right dark:from-green-900/20 dark:to-green-900/30">
                                                                                <div className="text-xl font-bold text-green-700 dark:text-green-400">
                                                                                    {isItemInternal ? formatCurrency(produk.harga_akhir) : '-'}
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Grand Total Card - Only for Semua and Internal */}
                    {!isNonHargaTab && (
                        <div className="mb-6 overflow-hidden bg-white shadow-lg sm:rounded-lg dark:bg-gray-800">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            Grand Total RAB Internal
                                        </h3>
                                        <p className="mt-1 text-sm text-purple-100">
                                            Total produk internal ({rabInternal.produks.filter(p => (p.kategori || 'internal').toLowerCase() === 'internal').length} produk) • {groupedByRuangan.length} ruangan
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold text-white">
                                            {formatCurrency(categoryTotals.internal)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
