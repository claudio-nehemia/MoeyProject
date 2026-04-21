import { Link, Head } from "@inertiajs/react";
import { useState, useMemo } from "react";
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Defect {
    id: number;
    nama_project: string;
    company_name: string;
    nama_produk: string;
    qc_stage: string;
    status: string;
    reported_by: string;
    reported_at: string;
    total_defects: number;
    total_repaired: number;
}

export default function Index({ defects }: { defects: Defect[] }) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');

    const filteredDefects = useMemo(() =>
        defects.filter(defect => {
            // Status filter
            if (statusFilter !== 'semua' && defect.status !== statusFilter) {
                return false;
            }

            return (
                defect.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                defect.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                defect.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }),
        [defects, searchQuery, statusFilter]
    );

    // Status badge colors
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-orange-500';
            case 'in_repair': return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-indigo-600';
            case 'completed': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-green-600';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    
    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending': return 'Menunggu Perbaikan';
            case 'in_repair': return 'Sedang Diperbaiki';
            case 'completed': return 'Selesai';
            default: return status;
        }
    };

    const getProgressColor = (repaired: number, total: number) => {
        const percentage = (repaired / total) * 100;
        if (percentage >= 100) return 'from-emerald-500 to-green-600';
        if (percentage >= 75) return 'from-blue-500 to-indigo-600';
        if (percentage >= 50) return 'from-yellow-400 to-orange-500';
        if (percentage >= 25) return 'from-orange-500 to-red-500';
        return 'from-pink-500 to-rose-600';
    };

    const getProgressBgColor = (repaired: number, total: number) => {
        const percentage = (repaired / total) * 100;
        if (percentage >= 100) return 'bg-gradient-to-br from-emerald-50 to-green-100';
        if (percentage >= 75) return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        if (percentage >= 50) return 'bg-gradient-to-br from-yellow-50 to-orange-100';
        if (percentage >= 25) return 'bg-gradient-to-br from-orange-50 to-red-100';
        return 'bg-gradient-to-br from-pink-50 to-rose-100';
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Defect Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="defect-management"
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
            >
                <div className="py-12">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="mb-2 flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-red-600 shadow-md">
                                    <svg
                                        className="h-4 w-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                        Defect Management
                                    </h1>
                                    <p className="text-xs text-stone-600">
                                        Kelola dan pantau semua defect yang dilaporkan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama project, company, atau produk..."
                                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 min-w-[150px]"
                                >
                                    <option value="semua">Semua Status</option>
                                    <option value="pending">Menunggu Perbaikan</option>
                                    <option value="in_repair">Sedang Diperbaiki</option>
                                    <option value="completed">Selesai</option>
                                </select>
                            </div>
                        </div>

                        {/* Defects Table */}
                        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                            <table className="w-full whitespace-nowrap text-left text-sm">
                                <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Project / Client Info</th>
                                        <th className="px-5 py-4">Defect Scope</th>
                                        <th className="px-5 py-4">Progress Perbaikan</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredDefects.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-stone-500">
                                                <div className="flex flex-col items-center">
                                                    <svg
                                                        className="h-10 w-10 text-gray-300 mb-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">Tidak ada defect ditemukan.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDefects.map((defect) => {
                                            const percentage = (defect.total_repaired / defect.total_defects) * 100;
                                            
                                            return (
                                                <tr key={defect.id} className="transition-colors hover:bg-slate-50/50">
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                                            {defect.nama_project}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                                            <span className="truncate max-w-[150px] font-medium text-slate-700">{defect.company_name}</span>
                                                        </div>
                                                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(defect.status)}`}>
                                                            {getStatusLabel(defect.status)}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-1.5">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-medium text-slate-400">Produk</span>
                                                                <span className="text-[11px] font-semibold text-slate-700 whitespace-normal max-w-[200px]">{defect.nama_produk}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-medium text-slate-400">QC Stage</span>
                                                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 max-w-fit">{defect.qc_stage}</span>
                                                            </div>
                                                            <div className="flex flex-col pt-1">
                                                                <span className="text-[10px] font-medium text-slate-400">Reported</span>
                                                                <span className="text-[10px] text-slate-600">{defect.reported_by} <span className="text-slate-400">({new Date(defect.reported_at).toLocaleDateString('id-ID')})</span></span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 align-top">
                                                        <div className="w-[180px]">
                                                            <div className="mb-1.5 flex items-center justify-between">
                                                                <span className="text-[10px] font-medium text-slate-600">Terperbaiki</span>
                                                                <span className={`text-[11px] font-bold bg-gradient-to-r ${getProgressColor(defect.total_repaired, defect.total_defects)} bg-clip-text text-transparent`}>
                                                                    {defect.total_repaired}/{defect.total_defects}
                                                                </span>
                                                            </div>
                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${getProgressColor(defect.total_repaired, defect.total_defects)} relative transition-all duration-1000`}
                                                                    style={{ width: `${percentage}%` }}
                                                                >
                                                                    <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4 align-top text-right">
                                                        <Link
                                                            href={`/defect-management/${defect.id}`}
                                                            className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700"
                                                        >
                                                            👁️ Lihat Detail
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}