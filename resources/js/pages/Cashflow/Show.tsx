import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

// ===================== TYPES =====================
interface OrderInfo {
    id: number;
    nama_project: string;
    customer_name: string;
    company_name: string;
    payment_status: string;
    tahapan_proyek: string;
    pm_name: string;
}

interface ContractOverrides {
    internal: number | null;
    fisik: number | null;
    external: number | null;
}

interface KontrakInfo {
    harga_kontrak: number;
    kontrak_internal: number;
    kontrak_fisik: number;
    kontrak_external: number;
    durasi: number | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    signed_at: string | null;
    overrides: ContractOverrides;
}

interface InvoiceInfo {
    id: number;
    invoice_number: string | null;
    total_amount: number;
    status: string;
    paid_at: string | null;
    bukti_bayar: string | null;
}

interface TerminStep {
    step: number;
    text: string;
    persentase: number;
    nominal: number;
    invoice: InvoiceInfo | null;
}

interface PembayaranInfo {
    commitment_fee: { amount: number; paid: boolean };
    termin_schedule: TerminStep[];
    total_received: number;
    sisa_piutang: number;
    sisa_pembayaran: number;
}

interface MarginSummary {
    total_rab_kontrak: number;
    total_rab_vendor: number;
    total_rab_jasa: number;
    total_rab_internal: number;
    estimasi_margin: number;
    estimasi_margin_percentage: number;
    realisasi_margin: number;
    realisasi_margin_percentage: number;
    total_efisiensi: number;
}

interface DetailItem {
    produk_name: string;
    harga_kontrak?: number;
    harga_vendor?: number;
    harga_jasa?: number;
    harga_internal?: number;
    harga_akhir?: number;
    harga_aksesoris?: number;
}

interface ManualEntry {
    id: number;
    category: string;
    label: string;
    amount_estimasi: number;
    amount_realisasi: number;
    tanggal: string | null;
    notes: string | null;
    section: string;
    phase: string;
    created_by_name: string;
    created_at: string;
}

interface BastInfo {
    number: string | null;
    date: string | null;
    has_bast: boolean;
}

interface Props {
    order: OrderInfo;
    kontrak: KontrakInfo;
    pembayaran: PembayaranInfo;
    margin_summary: MarginSummary;
    detail_items: {
        internal: DetailItem[];
        fisik: DetailItem[];
        external: DetailItem[];
    };
    manual_entries: {
        internal: ManualEntry[];
        fisik: ManualEntry[];
        external: ManualEntry[];
        general: ManualEntry[];
    };
    manual_totals_estimasi: {
        internal: number;
        fisik: number;
        external: number;
        general: number;
    };
    manual_totals_realisasi: {
        internal: number;
        fisik: number;
        external: number;
        general: number;
    };
    bast: BastInfo;
}

// ===================== HELPERS =====================
const fmt = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const categoryDefinitions: Record<string, { label: string; key: string }[]> = {
    internal: [
        { label: 'SPK Internal', key: 'spk_internal' },
        { label: 'Fee Team', key: 'fee_team' },
        { label: 'Cadangan Overhead', key: 'overhead' },
        { label: 'Entertainment', key: 'entertainment' },
        { label: 'Deposite Gaji', key: 'gaji' },
        { label: 'Cadangan Problem', key: 'cadangan_problem' },
        { label: 'Management Fee', key: 'management' },
        { label: 'Kasbon', key: 'kasbon' },
        { label: 'Lainnya', key: 'other' }
    ],
    fisik: [
        { label: 'SPK Fisik', key: 'spk_fisik' },
        { label: 'Pembayaran Vendor', key: 'vendor_payment' },
        { label: 'Kasbon', key: 'kasbon' },
        { label: 'Lainnya', key: 'other' }
    ],
    external: [
        { label: 'SPK External', key: 'spk_external' },
        { label: 'Pembayaran Vendor', key: 'vendor_payment' },
        { label: 'Kasbon', key: 'kasbon' },
        { label: 'Lainnya', key: 'other' }
    ],
    general: [
        { label: 'Operasional', key: 'operational' },
        { label: 'Digital Marketing', key: 'marketing' },
        { label: 'Kasbon', key: 'kasbon' },
        { label: 'Pengeluaran Tak Terduga', key: 'unplanned' },
        { label: 'Lainnya', key: 'other' }
    ]
};

const statusLabels: Record<string, string> = {
    not_start: 'Belum Mulai',
    cm_fee: 'CM Fee',
    dp: 'DP',
    termin: 'Termin',
    lunas: 'Lunas',
};

const statusColors: Record<string, string> = {
    not_start: 'bg-stone-100 text-stone-700 border border-stone-200',
    cm_fee: 'bg-blue-50 text-blue-700 border border-blue-200',
    dp: 'bg-amber-50 text-amber-700 border border-amber-200',
    termin: 'bg-violet-50 text-violet-700 border border-violet-200',
    lunas: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

// ===================== INLINE ADD FORM COMPONENT =====================
interface InlineFormProps {
    orderId: number;
    section: string;
    category: string;
    onSave: () => void;
}

function InlineCategoryForm({ orderId, section, category, onSave }: InlineFormProps) {
    const { data, setData, post, processing, reset } = useForm({
        category: category,
        label: '',
        amount_estimasi: '',
        amount_realisasi: '',
        tanggal: new Date().toISOString().split('T')[0],
        notes: '',
        section: section,
        phase: 'general'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.label) return;

        // Auto copy estimasi to realisasi if left empty (standard helper)
        const postData = {
            ...data,
            amount_estimasi: data.amount_estimasi || '0',
            amount_realisasi: data.amount_realisasi || data.amount_estimasi || '0'
        };

        post(`/cashflow/${orderId}/manual-entry`, {
            preserveScroll: true,
            data: postData as any,
            onSuccess: () => {
                reset('label', 'amount_estimasi', 'amount_realisasi', 'notes');
                onSave();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 p-2.5 bg-stone-50/50 border border-stone-200 rounded-lg flex flex-col md:flex-row gap-2 items-center">
            <input
                type="text"
                value={data.label}
                onChange={(e) => setData('label', e.target.value)}
                placeholder="Keterangan..."
                required
                className="w-full md:flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            <div className="flex gap-2 w-full md:w-auto">
                <input
                    type="number"
                    value={data.amount_estimasi}
                    onChange={(e) => setData('amount_estimasi', e.target.value)}
                    placeholder="Estimasi (Rp)..."
                    className="w-1/2 md:w-28 bg-white border border-stone-200 rounded px-2 py-1 text-xs font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                    type="number"
                    value={data.amount_realisasi}
                    onChange={(e) => setData('amount_realisasi', e.target.value)}
                    placeholder="Realisasi (Rp)..."
                    className="w-1/2 md:w-28 bg-white border border-stone-200 rounded px-2 py-1 text-xs font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <input
                    type="date"
                    value={data.tanggal}
                    onChange={(e) => setData('tanggal', e.target.value)}
                    className="w-1/2 md:w-28 bg-white border border-stone-200 rounded px-2 py-1 text-xs text-stone-600 focus:outline-none"
                />
                <select
                    value={data.phase}
                    onChange={(e) => setData('phase', e.target.value)}
                    className="w-1/2 md:w-24 bg-white border border-stone-200 rounded px-2 py-1 text-xs text-stone-600 focus:outline-none"
                >
                    <option value="general">Fase Umum</option>
                    <option value="dp">DP</option>
                    <option value="termin">Termin</option>
                    <option value="pelunasan">Pelunasan</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={processing}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-1 rounded transition-colors shadow-sm"
            >
                {processing ? '...' : 'Tambah'}
            </button>
        </form>
    );
}

// ===================== CONTRACT OVERRIDE EDIT WIDGET =====================
function ContractSplitOverride({ orderId, overrides }: { orderId: number; overrides: ContractOverrides }) {
    const [isEditing, setIsEditing] = useState(false);
    const { data, setData, post, processing } = useForm({
        internal: overrides.internal !== null ? overrides.internal.toString() : '',
        fisik: overrides.fisik !== null ? overrides.fisik.toString() : '',
        external: overrides.external !== null ? overrides.external.toString() : '',
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Save each overrides sequentially or simple post
        router.post(`/cashflow/${orderId}/manual-entry`, {
            category: 'kontrak_internal',
            label: 'Override Kontrak Internal',
            amount_estimasi: parseFloat(data.internal) || 0,
            amount_realisasi: 0,
            section: 'general',
            phase: 'general'
        }, {
            preserveScroll: true,
            onSuccess: () => {
                router.post(`/cashflow/${orderId}/manual-entry`, {
                    category: 'kontrak_fisik',
                    label: 'Override Kontrak Fisik',
                    amount_estimasi: parseFloat(data.fisik) || 0,
                    amount_realisasi: 0,
                    section: 'general',
                    phase: 'general'
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.post(`/cashflow/${orderId}/manual-entry`, {
                            category: 'kontrak_external',
                            label: 'Override Kontrak External',
                            amount_estimasi: parseFloat(data.external) || 0,
                            amount_realisasi: 0,
                            section: 'general',
                            phase: 'general'
                        }, {
                            preserveScroll: true,
                            onSuccess: () => setIsEditing(false)
                        });
                    }
                });
            }
        });
    };

    if (!isEditing) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold underline mt-2 self-start"
            >
                ⚙️ Atur Split Nilai Kontrak Manual
            </button>
        );
    }

    return (
        <form onSubmit={handleSave} className="mt-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-amber-900">Custom Nilai Kontrak (Override)</p>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">Kontrak Internal</label>
                    <input
                        type="number"
                        value={data.internal}
                        onChange={(e) => setData('internal', e.target.value)}
                        placeholder="Rp..."
                        className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs"
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">Kontrak Fisik</label>
                    <input
                        type="number"
                        value={data.fisik}
                        onChange={(e) => setData('fisik', e.target.value)}
                        placeholder="Rp..."
                        className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs"
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">Kontrak External</label>
                    <input
                        type="number"
                        value={data.external}
                        onChange={(e) => setData('external', e.target.value)}
                        placeholder="Rp..."
                        className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs"
                    />
                </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-0.5 border border-stone-300 rounded text-stone-600 text-[10px] font-semibold bg-white"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="px-2.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-semibold hover:bg-amber-600"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
}

// ===================== MAIN SHOW COMPONENT =====================
export default function Show({
    order,
    kontrak,
    pembayaran,
    margin_summary,
    detail_items,
    manual_entries,
    manual_totals_estimasi,
    manual_totals_realisasi,
    bast
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [activeTab, setActiveTab] = useState<'internal' | 'fisik' | 'external'>('internal');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDelete = (entryId: number) => {
        if (confirm('Hapus entry ini?')) {
            router.delete(`/cashflow/manual-entry/${entryId}`, { preserveScroll: true });
        }
    };

    const tabs = [
        { key: 'internal' as const, label: '💼 Internal', color: 'emerald', value: kontrak.kontrak_internal },
        { key: 'fisik' as const, label: '🏗️ Fisik', color: 'blue', value: kontrak.kontrak_fisik },
        { key: 'external' as const, label: '🔧 External', color: 'purple', value: kontrak.kontrak_external },
    ];

    return (
        <>
            <Head title={`Cashflow — ${order.nama_project}`} />
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="cashflow" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50 text-stone-850">
                <div className="p-3 mt-20">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.visit('/cashflow')} className="p-1 bg-white border border-stone-200 rounded hover:bg-stone-50 transition-colors shadow-sm">
                                <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-stone-800">{order.nama_project}</h1>
                                <p className="text-xs text-stone-500">{order.customer_name} · {order.company_name} · PM: {order.pm_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.payment_status] || 'bg-stone-100'}`}>
                                {statusLabels[order.payment_status] || order.payment_status}
                            </span>
                            {bast.has_bast && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    BAST Verified ✓
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Global Financial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Nilai Kontrak Card */}
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total Kontrak</p>
                                <p className="text-lg font-bold text-stone-800 mt-1 font-mono">{fmt(kontrak.harga_kontrak)}</p>
                                <div className="mt-2 space-y-1 border-t border-stone-100 pt-2 text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Internal</span>
                                        <span className="font-mono text-emerald-700 font-semibold">{fmt(kontrak.kontrak_internal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Fisik</span>
                                        <span className="font-mono text-blue-700 font-semibold">{fmt(kontrak.kontrak_fisik)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">External</span>
                                        <span className="font-mono text-violet-700 font-semibold">{fmt(kontrak.kontrak_external)}</span>
                                    </div>
                                </div>
                            </div>
                            <ContractSplitOverride orderId={order.id} overrides={kontrak.overrides} />
                        </div>

                        {/* Estimasi Margin Card */}
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Estimasi Margin (Target)</p>
                            <p className="text-lg font-bold text-blue-700 mt-1 font-mono">{fmt(margin_summary.estimasi_margin)}</p>
                            <p className="text-[10px] text-blue-500 font-semibold mt-0.5">Persentase: {margin_summary.estimasi_margin_percentage}%</p>
                            <div className="mt-2 space-y-1 border-t border-stone-100 pt-2 text-[10px]">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">RAB Kontrak</span>
                                    <span className="font-mono text-stone-700">{fmt(margin_summary.total_rab_kontrak)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">RAB Vendor</span>
                                    <span className="font-mono text-red-650">{fmt(margin_summary.total_rab_vendor)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">RAB Jasa</span>
                                    <span className="font-mono text-amber-650">{fmt(margin_summary.total_rab_jasa)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Realisasi Margin Card */}
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Realisasi Margin (Aktual)</p>
                            <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">{fmt(margin_summary.realisasi_margin)}</p>
                            <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 font-semibold">Persentase: {margin_summary.realisasi_margin_percentage}%</p>
                            <div className="mt-2 space-y-1 border-t border-stone-100 pt-2 text-[10px]">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Total Diterima</span>
                                    <span className="font-mono text-emerald-650 font-bold">{fmt(pembayaran.total_received)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Sisa Piutang</span>
                                    <span className="font-mono text-amber-600 font-semibold">{fmt(pembayaran.sisa_piutang)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Efisiensi Proyek Card */}
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 shadow-md flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">Total Efisiensi (Dipress)</p>
                                <p className="text-2xl font-bold mt-1 font-mono">{fmt(margin_summary.total_efisiensi)}</p>
                                <p className="text-[10px] text-amber-100 mt-1">
                                    Selisih penyelamatan budget pengeluaran yang berhasil dinegosiasikan.
                                </p>
                            </div>
                            <div className="text-[9px] text-amber-200 font-semibold italic mt-2">
                                * Angka positif berarti penghematan budget.
                            </div>
                        </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex items-center gap-1.5 mb-6 bg-stone-100 border border-stone-200 p-1 rounded-xl self-start max-w-fit shadow-inner">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === tab.key
                                        ? tab.color === 'emerald' ? 'bg-white text-emerald-800 shadow'
                                        : tab.color === 'blue' ? 'bg-white text-blue-800 shadow'
                                        : 'bg-white text-purple-800 shadow'
                                        : 'text-stone-600 hover:text-stone-900'
                                }`}
                            >
                                {tab.label}
                                <span className="ml-1.5 font-mono text-[10px] font-medium bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500">
                                    {fmt(tab.value)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Main Workspace Area (Split Column) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Auto-Sync Details (RAB & Items) */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm fadeInUp">
                                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
                                    📦 Detail Item Pekerjaan ({tabs.find(t => t.key === activeTab)?.label})
                                </h3>

                                {activeTab === 'internal' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                                                    <th className="text-left py-2 px-2">Produk</th>
                                                    <th className="text-right py-2 px-2">Kontrak</th>
                                                    <th className="text-right py-2 px-2 text-red-700">Vendor</th>
                                                    <th className="text-right py-2 px-2 text-amber-700">Jasa</th>
                                                    <th className="text-right py-2 px-2 text-emerald-700">Internal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {detail_items.internal.map((item, i) => (
                                                    <tr key={i} className="hover:bg-amber-50/20">
                                                        <td className="py-2 px-2 text-stone-700 font-medium">{item.produk_name}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-stone-600">{fmt(item.harga_kontrak || 0)}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-red-500/80">{fmt(item.harga_vendor || 0)}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-amber-500/80">{fmt(item.harga_jasa || 0)}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-emerald-600 font-semibold">{fmt(item.harga_internal || 0)}</td>
                                                    </tr>
                                                ))}
                                                {detail_items.internal.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-stone-400 italic">
                                                            Tidak ada data RAB internal yang ditemukan
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'fisik' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                                                    <th className="text-left py-2 px-2">Produk</th>
                                                    <th className="text-right py-2 px-2 text-blue-700">Harga Jasa</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {detail_items.fisik.map((item, i) => (
                                                    <tr key={i} className="hover:bg-amber-50/20">
                                                        <td className="py-2 px-2 text-stone-700 font-medium">{item.produk_name}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-blue-600 font-semibold">{fmt(item.harga_akhir || 0)}</td>
                                                    </tr>
                                                ))}
                                                {detail_items.fisik.length === 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="py-8 text-center text-stone-400 italic">
                                                            Tidak ada data RAB Jasa
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'external' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                                                    <th className="text-left py-2 px-2">Produk</th>
                                                    <th className="text-right py-2 px-2 text-purple-700">Harga Vendor</th>
                                                    <th className="text-right py-2 px-2 text-stone-500">Aksesoris</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {detail_items.external.map((item, i) => (
                                                    <tr key={i} className="hover:bg-amber-50/20">
                                                        <td className="py-2 px-2 text-stone-700 font-medium">{item.produk_name}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-purple-600 font-semibold">{fmt(item.harga_akhir || 0)}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-stone-500">{fmt(item.harga_aksesoris || 0)}</td>
                                                    </tr>
                                                ))}
                                                {detail_items.external.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="py-8 text-center text-stone-400 italic">
                                                            Tidak ada data RAB Vendor
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="mt-3 text-[10px] text-stone-400 italic">
                                    * Data detail ini ditarik secara otomatis berdasarkan spesifikasi teknis dan RAB yang tersimpan.
                                </div>
                            </div>
                        </div>

                        {/* Direct Category Manual Input Forms with Estimasi vs Realisasi side by side */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm fadeInUp">
                                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
                                    ✏️ Pencatatan Pengeluaran & Manual Entry ({tabs.find(t => t.key === activeTab)?.label})
                                </h3>

                                <div className="space-y-6">
                                    {categoryDefinitions[activeTab].map((def) => {
                                        const entries = manual_entries[activeTab].filter(e => e.category === def.key);
                                        const totalEst = entries.reduce((s, e) => s + e.amount_estimasi, 0);
                                        const totalReal = entries.reduce((s, e) => s + e.amount_realisasi, 0);
                                        const totalDiff = totalEst - totalReal;

                                        return (
                                            <div key={def.key} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-stone-750 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        {def.label}
                                                    </span>
                                                    {(totalEst > 0 || totalReal > 0) && (
                                                        <span className="text-[10px] font-mono text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded flex gap-2">
                                                            <span>Est: <span className="font-bold">{fmt(totalEst)}</span></span>
                                                            <span>Real: <span className="font-bold text-amber-700">{fmt(totalReal)}</span></span>
                                                            {totalDiff !== 0 && (
                                                                <span className={totalDiff > 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                                                                    (Selisih: {fmt(totalDiff)})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Saved Entries under this category */}
                                                {entries.length > 0 && (
                                                    <div className="space-y-1.5 mb-2 pl-3 border-l-2 border-stone-200">
                                                        {entries.map((entry) => {
                                                            const diff = entry.amount_estimasi - entry.amount_realisasi;
                                                            return (
                                                                <div key={entry.id} className="flex justify-between items-center text-[10px] bg-stone-50 border border-stone-100 rounded px-2.5 py-1">
                                                                    <div className="text-stone-650">
                                                                        <span className="font-semibold text-stone-800">{entry.label}</span>
                                                                        {entry.tanggal && <span className="text-stone-400 ml-1.5">({entry.tanggal})</span>}
                                                                        <span className="text-stone-400 ml-1">· {entry.phase}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex gap-2 font-mono text-[9px]">
                                                                            <span className="text-stone-500">Est: {fmt(entry.amount_estimasi)}</span>
                                                                            <span className="text-stone-800 font-semibold">Real: {fmt(entry.amount_realisasi)}</span>
                                                                            {diff !== 0 && (
                                                                                <span className={diff > 0 ? 'text-emerald-600 font-bold' : 'text-red-650 font-bold'}>
                                                                                    {diff > 0 ? '✓ +' : ''}{fmt(diff)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDelete(entry.id)}
                                                                            className="text-stone-300 hover:text-red-500 font-bold transition-colors text-xs ml-1"
                                                                            title="Hapus"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Direct Form */}
                                                <InlineCategoryForm
                                                    orderId={order.id}
                                                    section={activeTab}
                                                    category={def.key}
                                                    onSave={() => {}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* General/Operational tab entries displayed directly as a fallback */}
                            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
                                    🏛️ Pengeluaran Umum & Operasional (General)
                                </h3>

                                <div className="space-y-6">
                                    {categoryDefinitions.general.map((def) => {
                                        const entries = manual_entries.general.filter(e => e.category === def.key);
                                        const totalEst = entries.reduce((s, e) => s + e.amount_estimasi, 0);
                                        const totalReal = entries.reduce((s, e) => s + e.amount_realisasi, 0);
                                        const totalDiff = totalEst - totalReal;

                                        return (
                                            <div key={def.key} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-stone-750 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        {def.label}
                                                    </span>
                                                    {(totalEst > 0 || totalReal > 0) && (
                                                        <span className="text-[10px] font-mono text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded flex gap-2">
                                                            <span>Est: <span className="font-bold">{fmt(totalEst)}</span></span>
                                                            <span>Real: <span className="font-bold text-amber-700">{fmt(totalReal)}</span></span>
                                                            {totalDiff !== 0 && (
                                                                <span className={totalDiff > 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                                                                    (Selisih: {fmt(totalDiff)})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Saved Entries */}
                                                {entries.length > 0 && (
                                                    <div className="space-y-1.5 mb-2 pl-3 border-l-2 border-stone-200">
                                                        {entries.map((entry) => {
                                                            const diff = entry.amount_estimasi - entry.amount_realisasi;
                                                            return (
                                                                <div key={entry.id} className="flex justify-between items-center text-[10px] bg-stone-50 border border-stone-100 rounded px-2.5 py-1">
                                                                    <div className="text-stone-650">
                                                                        <span className="font-semibold text-stone-800">{entry.label}</span>
                                                                        {entry.tanggal && <span className="text-stone-400 ml-1.5">({entry.tanggal})</span>}
                                                                        <span className="text-stone-400 ml-1">· {entry.phase}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex gap-2 font-mono text-[9px]">
                                                                            <span className="text-stone-500">Est: {fmt(entry.amount_estimasi)}</span>
                                                                            <span className="text-stone-850 font-semibold">Real: {fmt(entry.amount_realisasi)}</span>
                                                                            {diff !== 0 && (
                                                                                <span className={diff > 0 ? 'text-emerald-600 font-bold' : 'text-red-650 font-bold'}>
                                                                                    {diff > 0 ? '✓ +' : ''}{fmt(diff)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDelete(entry.id)}
                                                                            className="text-stone-300 hover:text-red-500 font-bold transition-colors text-xs ml-1"
                                                                            title="Hapus"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Direct Form */}
                                                <InlineCategoryForm
                                                    orderId={order.id}
                                                    section="general"
                                                    category={def.key}
                                                    onSave={() => {}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
