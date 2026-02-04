import Navbar from '@/components/Navbar';
import SearchFilter from '@/components/SearchFilter';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PengajuanPerpanjanganTimeline {
    id: number;
    item_pekerjaan_id: number;
    status: 'pending' | 'approved' | 'rejected' | 'none';
    reason: string | null;
}

interface ItemPekerjaan {
    id: number;
    total_produks: number;
    produks_with_workplan: number;
    has_kontrak: boolean;
    kontrak_durasi: number | null;
    pengajuan_perpanjangans: PengajuanPerpanjanganTimeline[];
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    total_produks: number;
    produks_with_workplan: number;
    workplan_progress: number;
    has_responded: boolean;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
    item_pekerjaans: ItemPekerjaan[];
}

interface Props {
    orders: Order[];
}

export default function Index({ orders }: Props) {
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;
    
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredOrders, setFilteredOrders] = useState(orders);
    // State untuk dua jenis TaskResponse
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: any } | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dua jenis task response (regular & marketing) untuk semua project (tahap: workplan)
    useEffect(() => {
        orders.forEach((order) => {
            // Regular
            axios
                .get(`/task-response/${order.id}/workplan`)
                .then((res) => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses((prev) => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch((err) => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching regular task response (workplan):', err);
                    }
                });
            // Marketing
            axios
                .get(`/task-response/${order.id}/workplan?is_marketing=1`)
                .then((res) => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses((prev) => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                marketing: task,
                            },
                        }));
                    }
                })
                .catch((err) => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching marketing task response (workplan):', err);
                    }
                });
        });
    }, [orders]);

    useEffect(() => {
        const filtered = orders.filter(
            (order) =>
                order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredOrders(filtered);
    }, [searchQuery, orders]);

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-600';
        if (progress >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
        if (progress >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
        if (progress >= 25) return 'bg-gradient-to-r from-orange-500 to-red-500';
        if (progress > 0) return 'bg-gradient-to-r from-pink-500 to-rose-600';
        return 'bg-gray-300';
    };

    const handlePmResponse = (orderId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk workplan ini?')) {
            router.post(`/pm-response/workplan/${orderId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    // Cek apakah bisa edit workplan berdasarkan status pengajuan perpanjangan
    const canEditWorkplan = (order: Order): boolean => {
        // Jika tidak ada item_pekerjaans, tidak bisa edit
        if (!order.item_pekerjaans || order.item_pekerjaans.length === 0) {
            return false;
        }
        
        // Cek semua item_pekerjaans
        for (const item of order.item_pekerjaans) {
            const latestPengajuan = item.pengajuan_perpanjangans?.[0];
            
            // Jika tidak ada pengajuan perpanjangan (array kosong/undefined), boleh edit
            if (!latestPengajuan) {
                return true;
            }
            
            // Jika ada pengajuan dengan status 'approved', boleh edit
            if (latestPengajuan.status === 'approved') {
                return true;
            }
            
            // Jika status pending/rejected/none, lanjut cek item berikutnya
        }
        
        // Jika semua item punya pengajuan dengan status bukan 'approved', tidak boleh edit
        return false;
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getStatusBadge = (progress: number) => {
        if (progress >= 100) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Lengkap
                </span>
            );
        }
        if (progress > 0) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Sebagian
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Belum Ada
            </span>
        );
    };

    const handleExportExcel = (orderId: number) => {
        window.location.href = `/workplan/export/${orderId}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-50">
            <Head title="Workplan Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="workplan"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                    Workplan Management
                                </h1>
                                <p className="text-sm text-stone-600">
                                    Kelola timeline produksi untuk setiap project
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <SearchFilter
                    onSearch={setSearchQuery}
                    onFilterChange={() => {}}
                    filters={{}}
                    searchPlaceholder="Cari project, perusahaan, atau customer..."
                />

                {/* Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-stone-900">{filteredOrders.length}</p>
                                <p className="text-xs text-stone-600">Total Project</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-stone-900">
                                    {filteredOrders.filter(o => o.workplan_progress >= 100).length}
                                </p>
                                <p className="text-xs text-stone-600">Workplan Lengkap</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                                <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-stone-900">
                                    {filteredOrders.filter(o => o.workplan_progress === 0).length}
                                </p>
                                <p className="text-xs text-stone-600">Belum Ada Workplan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project List */}
                <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                                <svg className="h-8 w-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-stone-900">Tidak ada project</h3>
                            <p className="mt-1 text-sm text-stone-600">
                                {searchQuery
                                    ? 'Tidak ada project yang cocok dengan pencarian.'
                                    : 'Belum ada project yang memenuhi syarat untuk workplan.'}
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const taskResponse = taskResponses[order.id];

                            return (
                            <div
                                key={order.id}
                                className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                            >
                                <div className="p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        {/* Project Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-lg font-bold text-amber-700">
                                                    {order.nama_project.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="truncate text-lg font-bold text-stone-900">
                                                        {order.nama_project}
                                                    </h3>
                                                    <p className="text-sm text-stone-600">
                                                        {order.company_name} • {order.customer_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Progress */}
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(order.workplan_progress)}
                                            
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-stone-900">
                                                    {order.produks_with_workplan}/{order.total_produks} Produk
                                                </p>
                                                <p className="text-xs text-stone-500">dengan workplan</p>
                                            </div>

                                            {order.response_by && (
                                                <div className="text-right">
                                                    <p className="text-xs text-stone-500">Response By</p>
                                                    <p className="text-sm font-semibold text-stone-900">{order.response_by}</p>
                                                    {order.response_time && (
                                                        <p className="text-xs text-stone-400 mt-1">
                                                            {new Date(order.response_time).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {order.pm_response_by && (
                                                <div className="text-right">
                                                    <p className="text-xs text-purple-500">PM Response By</p>
                                                    <p className="text-sm font-semibold text-purple-900">{order.pm_response_by}</p>
                                                    {order.pm_response_time && (
                                                        <p className="text-xs text-purple-400 mt-1">
                                                            {new Date(order.pm_response_time).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deadline & Minta Perpanjangan - regular */}
                                    {taskResponses[order.id]?.regular && taskResponses[order.id].regular.status !== 'selesai' && (
                                        <div className="mt-3">
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-medium text-yellow-800">
                                                        Deadline Workplan
                                                    </p>
                                                    <p className="text-sm font-semibold text-yellow-900">
                                                        {formatDeadline(taskResponses[order.id].regular.deadline)}
                                                    </p>
                                                    {taskResponses[order.id].regular.extend_time > 0 && (
                                                        <p className="mt-1 text-xs text-orange-600">
                                                            Perpanjangan: {taskResponses[order.id].regular.extend_time}x
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowExtendModal({ orderId: order.id, tahap: 'workplan', isMarketing: false, taskResponse: taskResponses[order.id].regular })}
                                                    className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                                >
                                                    Minta Perpanjangan
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* Deadline & Minta Perpanjangan - marketing (khusus Kepala Marketing) */}
                                    {isKepalaMarketing && taskResponses[order.id]?.marketing && taskResponses[order.id].marketing.status !== 'selesai' && (
                                        <div className="mt-3">
                                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-medium text-purple-800">
                                                        Deadline Workplan (Marketing)
                                                    </p>
                                                    <p className="text-sm font-semibold text-purple-900">
                                                        {formatDeadline(taskResponses[order.id].marketing.deadline)}
                                                    </p>
                                                    {taskResponses[order.id].marketing.extend_time > 0 && (
                                                        <p className="mt-1 text-xs text-purple-600">
                                                            Perpanjangan: {taskResponses[order.id].marketing.extend_time}x
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowExtendModal({ orderId: order.id, tahap: 'workplan', isMarketing: true, taskResponse: taskResponses[order.id].marketing })}
                                                    className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors"
                                                >
                                                    Minta Perpanjangan
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="font-medium text-stone-600">Progress Workplan</span>
                                            <span className="font-bold text-stone-900">{order.workplan_progress}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                                            <div
                                                className={`h-full transition-all duration-500 ${getProgressColor(order.workplan_progress)}`}
                                                style={{ width: `${order.workplan_progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center justify-end gap-2">
                                        {/* PM Response Button - INDEPENDENT dari general response */}
                                        {isKepalaMarketing && !order.pm_response_time && (
                                            <button
                                                onClick={() => handlePmResponse(order.id)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Marketing Response
                                            </button>
                                        )}
                                        
                                        {/* Show Response button only if NOT responded yet */}
                                        {isNotKepalaMarketing && !order.has_responded && (
                                            <button
                                                onClick={() => router.post(`/workplan/${order.id}/response`)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-600 hover:to-green-700 hover:shadow-lg"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ✓ Response
                                            </button>
                                        )}
                                        
                                        {/* Show Isi/Edit Workplan button only if already responded */}
                                        {order.has_responded && order.workplan_progress === 0 && (
                                            <Link
                                                href={`/workplan/${order.id}/create`}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                📝 Isi Detail Workplan
                                            </Link>
                                        )}
                                        
                                        {order.has_responded && order.workplan_progress > 0 && (
                                            canEditWorkplan(order) ? (
                                                <Link
                                                    href={`/workplan/${order.id}/edit`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-lg"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit Workplan
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Workplan Terkunci
                                                </span>
                                            )
                                        )}
                                        
                                        {/* Export Button - Pass order.id */}
                                        <button
                                            onClick={() => handleExportExcel(order.id)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Export Excel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            </main>
            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    taskResponse={showExtendModal.taskResponse}
                    isMarketing={showExtendModal.isMarketing}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </div>
    );
}