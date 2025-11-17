import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

type Order = {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    progress: number;
};

export default function Index({ orders }: { orders: Order[] }) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [animatedProgress, setAnimatedProgress] = useState<{[key: number]: number}>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            const progress: {[key: number]: number} = {};
            orders.forEach(order => {
                progress[order.id] = order.progress;
            });
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [orders]);

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'from-green-400 to-emerald-600';
        if (progress >= 75) return 'from-blue-400 to-indigo-600';
        if (progress >= 50) return 'from-yellow-400 to-amber-600';
        if (progress >= 25) return 'from-orange-400 to-red-500';
        if (progress > 0) return 'from-red-400 to-pink-600';
        return 'from-gray-300 to-gray-400';
    };

    const getProgressBgColor = (progress: number) => {
        if (progress === 100) return 'from-green-50 to-emerald-50';
        if (progress >= 75) return 'from-blue-50 to-indigo-50';
        if (progress >= 50) return 'from-yellow-50 to-amber-50';
        if (progress >= 25) return 'from-orange-50 to-red-50';
        if (progress > 0) return 'from-red-50 to-pink-50';
        return 'from-gray-50 to-gray-100';
    };

    const getProgressTextColor = (progress: number) => {
        if (progress === 100) return 'text-green-700';
        if (progress >= 75) return 'text-blue-700';
        if (progress >= 50) return 'text-yellow-700';
        if (progress >= 25) return 'text-orange-700';
        if (progress > 0) return 'text-red-700';
        return 'text-gray-600';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Project Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="project-management" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Monitor dan kelola progress semua project
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {orders.map((order, index) => (
                                <Link
                                    href={`/project-management/${order.id}`}
                                    key={order.id}
                                    className="block transform hover:scale-105 transition-all duration-300"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className={`overflow-hidden bg-gradient-to-br ${getProgressBgColor(order.progress)} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white relative group`}>
                                        {/* Decorative gradient overlay */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full transform group-hover:scale-150 transition-transform duration-500" />
                                        
                                        <div className="p-6 relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getProgressColor(order.progress)} mr-2 animate-pulse`} />
                                                        <h2 className="text-lg font-bold text-gray-900">
                                                            {order.nama_project}
                                                        </h2>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        {order.company_name}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        👤 {order.customer_name}
                                                    </p>
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${getProgressColor(order.progress)} shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                                                        <span className="text-2xl font-extrabold text-white drop-shadow-lg">
                                                            {Math.round(order.progress)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mt-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className={`font-semibold ${getProgressTextColor(order.progress)}`}>Progress Keseluruhan</span>
                                                    <span className={`font-bold ${getProgressTextColor(order.progress)}`}>
                                                        {order.progress.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="relative w-full bg-white/50 backdrop-blur-sm rounded-full h-4 overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${getProgressColor(order.progress)} transition-all duration-1000 ease-out rounded-full relative`}
                                                        style={{ width: `${animatedProgress[order.id] || 0}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t-2 border-white/50">
                                                <button className={`w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r ${getProgressColor(order.progress)} text-white text-sm font-bold rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}>
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    Lihat Detail Project
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
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

                        {orders.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada project</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Belum ada project yang tersedia untuk dikelola.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
