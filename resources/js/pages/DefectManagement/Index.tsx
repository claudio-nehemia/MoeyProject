import { Link, Head } from "@inertiajs/react";
import { useState } from "react";
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
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8 shadow-xl">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                                <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/20" />

                                <div className="relative z-10">
                                    <div className="mb-4 flex items-center">
                                        <div className="mr-3 h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-red-500 to-orange-600" />
                                        <h1 className="text-4xl font-bold text-gray-900">
                                            Defect Management
                                        </h1>
                                    </div>
                                    <p className="text-lg text-gray-700">
                                        Kelola dan pantau semua defect yang dilaporkan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Defects Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {defects.map((defect, index) => {
                                const percentage = (defect.total_repaired / defect.total_defects) * 100;
                                
                                return (
                                    <div
                                        key={defect.id}
                                        className={`${getProgressBgColor(defect.total_repaired, defect.total_defects)} transform overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}
                                        style={{
                                            animation: `slideInUp 0.5s ease-out ${index * 0.1}s backwards`,
                                        }}
                                    >
                                        {/* Decorative background */}
                                        <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />

                                        <div className="relative z-10 p-6">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="mb-2 flex items-center text-2xl font-bold text-gray-900">
                                                        <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                                        {defect.nama_project}
                                                    </h3>
                                                    <p className="flex items-center text-sm text-gray-600">
                                                        <svg
                                                            className="mr-2 h-4 w-4 text-blue-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                            />
                                                        </svg>
                                                        {defect.company_name}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex transform items-center rounded-lg border-2 px-4 py-2 text-sm font-bold shadow-md transition-transform hover:scale-105 ${getStatusColor(defect.status)}`}
                                                >
                                                    <svg
                                                        className="mr-2 h-4 w-4"
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
                                                    {getStatusLabel(defect.status)}
                                                </span>
                                            </div>

                                            <div className="mb-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                                                <div className="rounded-lg bg-white/50 px-3 py-2 backdrop-blur-sm">
                                                    <div className="mb-1 flex items-center text-gray-600">
                                                        <svg
                                                            className="mr-2 h-4 w-4 text-purple-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                            />
                                                        </svg>
                                                        Produk
                                                    </div>
                                                    <div className="font-bold text-gray-900">{defect.nama_produk}</div>
                                                </div>
                                                <div className="rounded-lg bg-white/50 px-3 py-2 backdrop-blur-sm">
                                                    <div className="mb-1 flex items-center text-gray-600">
                                                        <svg
                                                            className="mr-2 h-4 w-4 text-indigo-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        QC Stage
                                                    </div>
                                                    <div className="font-bold text-gray-900">{defect.qc_stage}</div>
                                                </div>
                                                <div className="rounded-lg bg-white/50 px-3 py-2 backdrop-blur-sm">
                                                    <div className="mb-1 flex items-center text-gray-600">
                                                        <svg
                                                            className="mr-2 h-4 w-4 text-green-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                            />
                                                        </svg>
                                                        Dilaporkan oleh
                                                    </div>
                                                    <div className="font-bold text-gray-900">{defect.reported_by}</div>
                                                </div>
                                                <div className="rounded-lg bg-white/50 px-3 py-2 backdrop-blur-sm">
                                                    <div className="mb-1 flex items-center text-gray-600">
                                                        <svg
                                                            className="mr-2 h-4 w-4 text-orange-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        Tanggal
                                                    </div>
                                                    <div className="font-bold text-gray-900">
                                                        {new Date(defect.reported_at).toLocaleDateString('id-ID')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between rounded-xl border-2 border-white/50 bg-white/30 p-4 backdrop-blur-sm">
                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="flex items-center text-sm font-semibold text-gray-700">
                                                            <svg
                                                                className="mr-2 h-4 w-4 text-blue-600"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                                />
                                                            </svg>
                                                            Progress Perbaikan
                                                        </span>
                                                        <span
                                                            className={`bg-gradient-to-r text-lg font-bold ${getProgressColor(defect.total_repaired, defect.total_defects)} bg-clip-text text-transparent`}
                                                        >
                                                            {defect.total_repaired}/{defect.total_defects}
                                                        </span>
                                                    </div>
                                                    <div className="h-4 overflow-hidden rounded-full bg-white/60 shadow-inner">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${getProgressColor(defect.total_repaired, defect.total_defects)} relative overflow-hidden transition-all duration-1000 ease-out`}
                                                            style={{ width: `${percentage}%` }}
                                                        >
                                                            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/defect-management/${defect.id}`}
                                                    className="ml-4 inline-flex transform items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl"
                                                >
                                                    <span>Lihat Detail</span>
                                                    <svg
                                                        className="ml-2 h-5 w-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {defects.length === 0 && (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white py-16 text-center shadow-lg">
                                <svg
                                    className="mx-auto h-16 w-16 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <h3 className="mt-4 text-lg font-bold text-gray-900">
                                    Tidak ada defect
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Belum ada defect yang dilaporkan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}