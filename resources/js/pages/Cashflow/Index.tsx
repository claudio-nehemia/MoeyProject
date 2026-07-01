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
    has_bast: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    orders: PaginatedData<OrderCashflow>;
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

export default function Index({ orders, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 mb-4">
                        <div className="flex-1">
                            <SearchFilter onSearch={handleSearch} searchPlaceholder="Cari project, customer..." />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                        >
                            <option value="">Semua Status</option>
                            <option value="not_start">Belum Mulai</option>
                            <option value="cm_fee">CM Fee</option>
                            <option value="dp">DP</option>
                            <option value="termin">Termin</option>
                            <option value="lunas">Lunas</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm fadeInUp">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500">
                                        <th className="text-left px-4 py-3 font-semibold uppercase">Project</th>
                                        <th className="text-left px-4 py-3 font-semibold uppercase">PM</th>
                                        <th className="text-right px-4 py-3 font-semibold uppercase">Total Kontrak</th>
                                        <th className="text-right px-4 py-3 font-semibold text-emerald-700/80 uppercase">Internal</th>
                                        <th className="text-right px-4 py-3 font-semibold text-blue-700/80 uppercase">Fisik</th>
                                        <th className="text-right px-4 py-3 font-semibold text-purple-700/80 uppercase">External</th>
                                        <th className="text-right px-4 py-3 font-semibold uppercase">Diterima</th>
                                        <th className="text-right px-4 py-3 font-semibold uppercase">Piutang</th>
                                        <th className="text-center px-4 py-3 font-semibold uppercase">Status</th>
                                        <th className="text-center px-4 py-3 font-semibold uppercase">BAST</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {orders.data.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-12 text-center text-stone-400 italic">
                                                Tidak ada data project dengan kontrak ditemukan
                                            </td>
                                        </tr>
                                    )}
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="table-row-hover cursor-pointer transition-colors bg-white"
                                            onClick={() => router.visit(`/cashflow/${order.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-stone-850">{order.nama_project}</div>
                                                <div className="text-[10px] text-stone-500">{order.customer_name} · {order.company_name}</div>
                                            </td>
                                            <td className="px-4 py-3 text-stone-600">{order.pm_name}</td>
                                            <td className="px-4 py-3 text-right font-mono text-stone-700 font-semibold">{formatCurrency(order.harga_kontrak)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(order.kontrak_internal)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-blue-600 font-semibold">{formatCurrency(order.kontrak_fisik)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-purple-600 font-semibold">{formatCurrency(order.kontrak_external)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(order.total_received)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-amber-600">{formatCurrency(order.sisa_piutang)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.payment_status] || 'bg-stone-100 text-stone-700'}`}>
                                                    {statusLabels[order.payment_status] || order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {order.has_bast ? (
                                                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                                                ) : (
                                                    <span className="text-stone-300 font-bold">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
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
                </div>
            </div>
        </>
    );
}
