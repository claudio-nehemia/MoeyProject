import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface OrderCashflow {
    id: number;
    nama_project: string;
    customer_name: string;
    company_name: string;
    payment_status: string;
    tahapan_proyek: string;
    pm_name: string;
    harga_kontrak: number;
    kontrak_internal: number;
    kontrak_fisik: number;
    kontrak_external: number;
    total_received: number;
    sisa_piutang: number;
    status_project: number;
    has_bast: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    orders: PaginatedData<OrderCashflow>;
    total_hutang: number;
    daily_payments: any[];
    upcoming_payments: any[];
    filters: { search?: string; status?: string };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const statusColors: Record<string, string> = {
    not_start: 'bg-stone-100 text-stone-700 border border-stone-200',
    cm_fee: 'bg-blue-50 text-blue-700 border border-blue-200',
    dp: 'bg-amber-50 text-amber-700 border border-amber-200',
    termin: 'bg-violet-50 text-violet-700 border border-violet-200',
    lunas: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const statusLabels: Record<string, string> = {
    not_start: 'Belum Mulai',
    cm_fee: 'CM Fee',
    dp: 'DP',
    termin: 'Termin',
    lunas: 'Lunas',
};

export default function Index({ orders, total_hutang, daily_payments, upcoming_payments = [], filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [activeTab, setActiveTab] = useState<'project' | 'daily' | 'upcoming'>('project');

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

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/cashflow', { search: value, status: statusFilter }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get('/cashflow', { search, status: value }, { preserveState: true, replace: true });
    };

    const handleToggleFlag = (entryId: number, flagField: string, currentValue: string | null) => {
        const newValue = currentValue ? null : '✔';
        router.post(`/cashflow/vendor-entries/${entryId}/toggle-flag`, {
            flag: flagField,
            value: newValue
        }, {
            preserveScroll: true,
        });
    };

    const handleExportExcel = () => {
        window.open('/cashflow/export-daily-payments', '_blank');
    };

    const totalKontrak = orders.data.reduce((sum, o) => sum + o.harga_kontrak, 0);
    const totalReceived = orders.data.reduce((sum, o) => sum + o.total_received, 0);
    const totalPiutang = orders.data.reduce((sum, o) => sum + o.sisa_piutang, 0);

    return (
        <>
            <Head title="Cashflow Overview" />
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .table-row-hover:hover {
                    background-color: #fffbeb !important;
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="cashflow" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50 text-stone-800">
                <div className="p-3 mt-20">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                Cashflow Management
                            </h1>
                            <span className="inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                Finance
                            </span>
                        </div>
                        <p className="text-xs text-stone-500">
                            Monitor and calculate cash flow breakdown per project dynamically based on item categories.
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total Kontrak (Page)</p>
                            <p className="text-xl font-bold text-stone-800 mt-1">{formatCurrency(totalKontrak)}</p>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Diterima (Page)</p>
                            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalReceived)}</p>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Sisa Piutang (Page)</p>
                            <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(totalPiutang)}</p>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Total Hutang Vendor (Global)</p>
                            <p className="text-xl font-bold text-rose-700 mt-1">{formatCurrency(total_hutang)}</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-stone-200 mb-6 gap-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('project')}
                            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                activeTab === 'project'
                                    ? 'border-amber-500 text-stone-850'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            Daftar Project
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('daily')}
                            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                activeTab === 'daily'
                                    ? 'border-amber-500 text-stone-850'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            Pembayaran General All Project
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                activeTab === 'upcoming'
                                    ? 'border-amber-500 text-stone-850'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            Pembayaran Terdekat (Mendatang)
                        </button>
                    </div>

                    {activeTab === 'project' && (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-3 mb-4">
                                <div className="flex-1">
                                    <SearchFilter
                                        value={search}
                                        onChange={handleSearch}
                                        placeholder="Cari nama project atau customer..."
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusFilter(e.target.value)}
                                        className="block w-full rounded-lg border-stone-200 text-xs shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-white"
                                    >
                                        <option value="">Semua Status Bayar</option>
                                        <option value="not_start">Belum Mulai</option>
                                        <option value="cm_fee">CM Fee</option>
                                        <option value="dp">DP</option>
                                        <option value="termin">Termin</option>
                                        <option value="lunas">Lunas</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm fadeInUp">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="text-[10px] text-stone-400 uppercase bg-stone-50 border-b border-stone-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Nama Project</th>
                                                <th className="px-4 py-3 text-left">Customer</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-right">Nilai Kontrak</th>
                                                <th className="px-4 py-3 text-right">Pembayaran Masuk</th>
                                                <th className="px-4 py-3 text-right">Sisa Piutang</th>
                                                <th className="px-4 py-3 text-center">Progress</th>
                                                <th className="px-4 py-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100 text-stone-600">
                                            {orders.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-12 text-center text-stone-400 italic">
                                                        Tidak ada project cashflow ditemukan
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders.data.map((order) => (
                                                    <tr
                                                        key={order.id}
                                                        onClick={() => router.visit(`/cashflow/${order.id}`)}
                                                        className="table-row-hover cursor-pointer transition-colors bg-white"
                                                    >
                                                        <td className="px-4 py-3 font-semibold text-stone-850">
                                                            {order.nama_project}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-stone-800">{order.customer_name}</div>
                                                            <div className="text-[10px] text-stone-400 font-semibold">{order.company_name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusColors[order.payment_status] || 'bg-stone-50 text-stone-500'}`}>
                                                                {statusLabels[order.payment_status] || order.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">{formatCurrency(order.harga_kontrak)}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">{formatCurrency(order.total_received)}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">{formatCurrency(order.sisa_piutang)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className="font-mono text-stone-700 font-semibold">{order.status_project}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.visit(`/cashflow/${order.id}`);
                                                                }}
                                                                className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-100 transition-colors"
                                                            >
                                                                Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {orders.links.length > 3 && (
                                    <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-stone-150 bg-stone-50">
                                        {orders.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url)}
                                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                                                    link.active
                                                        ? 'bg-amber-500 text-white shadow'
                                                        : link.url
                                                        ? 'text-stone-600 hover:bg-stone-200'
                                                        : 'text-stone-300 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'daily' && (
                        <>
                            {/* Daily Payments List */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                                    Jadwal Pembayaran Harian (Seluruh Project)
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Ekspor Excel
                                </button>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm fadeInUp">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-stone-600">
                                        <thead className="text-[10px] text-stone-400 uppercase bg-stone-50 border-b border-stone-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Tanggal</th>
                                                <th className="px-4 py-3 text-left">Project</th>
                                                <th className="px-4 py-3 text-left">Vendor / Type</th>
                                                <th className="px-4 py-3 text-left">Fase</th>
                                                <th className="px-4 py-3 text-left">Keterangan</th>
                                                <th className="px-4 py-3 text-right">Nominal</th>
                                                <th className="px-4 py-3 text-center">AF</th>
                                                <th className="px-4 py-3 text-center">FB</th>
                                                <th className="px-4 py-3 text-center">JW</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {daily_payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-4 py-12 text-center text-stone-400 italic">
                                                        Tidak ada jadwal pembayaran harian ditemukan
                                                    </td>
                                                </tr>
                                            ) : (
                                                daily_payments.map((item) => {
                                                    const isTermin = item.id.endsWith('-termin');
                                                    const afField = isTermin ? 'flag_af_termin' : 'flag_af';
                                                    const fbField = isTermin ? 'flag_fb_termin' : 'flag_fb';
                                                    const jwField = isTermin ? 'flag_jw_termin' : 'flag_jw';

                                                    return (
                                                        <tr key={item.id} className="table-row-hover bg-white hover:bg-amber-50/20">
                                                            <td className="px-4 py-3 font-semibold text-stone-800">
                                                                {item.date}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-stone-850">
                                                                {item.project_name}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold">{item.vendor_name}</div>
                                                                <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                                                                    {item.vendor_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                    isTermin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-stone-500">
                                                                {item.label}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                                                                {formatCurrency(item.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_af}
                                                                    onChange={() => handleToggleFlag(item.entry_id, afField, item.flag_af)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_fb}
                                                                    onChange={() => handleToggleFlag(item.entry_id, fbField, item.flag_fb)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_jw}
                                                                    onChange={() => handleToggleFlag(item.entry_id, jwField, item.flag_jw)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'upcoming' && (
                        <>
                            {/* Upcoming Payments List */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                                    Rencana Pembayaran Terdekat (Seluruh Project)
                                </h3>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm fadeInUp">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-stone-600">
                                        <thead className="text-[10px] text-stone-400 uppercase bg-stone-50 border-b border-stone-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Tanggal</th>
                                                <th className="px-4 py-3 text-left">Project</th>
                                                <th className="px-4 py-3 text-left">Vendor / Type</th>
                                                <th className="px-4 py-3 text-left">Fase</th>
                                                <th className="px-4 py-3 text-left">Keterangan</th>
                                                <th className="px-4 py-3 text-right">Nominal</th>
                                                <th className="px-4 py-3 text-center">AF</th>
                                                <th className="px-4 py-3 text-center">FB</th>
                                                <th className="px-4 py-3 text-center">JW</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {upcoming_payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-4 py-12 text-center text-stone-400 italic">
                                                        Tidak ada rencana pembayaran terdekat ditemukan
                                                    </td>
                                                </tr>
                                            ) : (
                                                upcoming_payments.map((item) => {
                                                    const isTermin = item.id.endsWith('-termin');
                                                    const afField = isTermin ? 'flag_af_termin' : 'flag_af';
                                                    const fbField = isTermin ? 'flag_fb_termin' : 'flag_fb';
                                                    const jwField = isTermin ? 'flag_jw_termin' : 'flag_jw';

                                                    return (
                                                        <tr key={item.id} className="table-row-hover bg-white hover:bg-amber-50/20">
                                                            <td className="px-4 py-3 font-semibold text-stone-800">
                                                                {item.date}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-stone-850">
                                                                {item.project_name}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-semibold">{item.vendor_name}</div>
                                                                <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
                                                                    {item.vendor_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                    isTermin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-stone-500">
                                                                {item.label}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">
                                                                {formatCurrency(item.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_af}
                                                                    onChange={() => handleToggleFlag(item.entry_id, afField, item.flag_af)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_fb}
                                                                    onChange={() => handleToggleFlag(item.entry_id, fbField, item.flag_fb)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!item.flag_jw}
                                                                    onChange={() => handleToggleFlag(item.entry_id, jwField, item.flag_jw)}
                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
