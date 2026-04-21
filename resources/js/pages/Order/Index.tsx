import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface OrderData {
    id: number;
    nama_project: string;
    company_name: string;
    phone_number: string;
    jenis_interior: JenisInterior;
    project_status: string;
    priority_level: string;
    tanggal_masuk_customer: string;
    payment_status: string;
    tahapan_proyek: string;
    users: User[];
}

interface Props {
    orders: OrderData[];
}

export default function Index({ orders }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    
    const ITEMS_PER_PAGE = 15;
    const [currentPage, setCurrentPage] = useState(1);

    const filteredOrders = useMemo(() => {
        // Reset page to 1 when filters change
        return orders.filter(order => {
            const matchesSearch = order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                order.company_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || order.project_status === selectedStatus;
            const matchesPriority = selectedPriority === 'all' || order.priority_level === selectedPriority;
            
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [orders, searchQuery, selectedStatus, selectedPriority]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus, selectedPriority]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    
    // Get current page data
    const currentOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredOrders, currentPage]);

    useEffect(() => {
        setMounted(true);
        
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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-stone-100 text-stone-700 border-stone-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return 'bg-red-50 text-red-600 border-red-200';
            case 'high':
                return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'medium':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'low':
                return 'bg-slate-50 text-slate-600 border-slate-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'lunas':
                return 'bg-emerald-500 text-white border-transparent shadow-sm';
            case 'termin':
                return 'bg-white text-indigo-500 border-indigo-200';
            case 'dp':
                return 'bg-white text-amber-500 border-amber-200';
            case 'cm_fee':
                return 'bg-white text-purple-500 border-purple-200';
            case 'not_start':
            default:
                return 'bg-white text-slate-400 border-slate-200';
        }
    };

    const getTahapanStyle = (tahapan: string) => {
        switch (tahapan) {
            case 'produksi':
                return { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '✨' };
            case 'kontrak':
                return { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '📄' };
            case 'rab':
                return { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: '💰' };
            case 'desain_final':
                return { color: 'bg-cyan-50 text-cyan-600 border-cyan-200', icon: '🎨' };
            case 'cm_fee':
                return { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '💳' };
            case 'moodboard':
                return { color: 'bg-pink-50 text-pink-600 border-pink-200', icon: '🎨' };
            case 'survey':
                return { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: '📋' };
            case 'not_start':
            default:
                return { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: '⏳' };
        }
    };

    const formatPaymentStatus = (status: string) => {
        switch (status) {
            case 'not_start': return 'Belum Bayar';
            case 'cm_fee': return 'CM Fee';
            case 'dp': return 'DP';
            case 'termin': return 'Termin';
            case 'lunas': return 'Lunas';
            default: return status;
        }
    };

    const formatTahapan = (tahapan: string) => {
        switch (tahapan) {
            case 'not_start': return 'Belum Mulai';
            case 'survey': return 'Survey';
            case 'moodboard': return 'Moodboard';
            case 'cm_fee': return 'CM Fee';
            case 'desain_final': return 'Desain Final';
            case 'rab': return 'RAB';
            case 'kontrak': return 'Kontrak';
            case 'produksi': return 'Produksi';
            default: return tahapan;
        }
    };

    const capitalize = (text: string) => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this order?')) {
            router.delete(`/order/${id}`);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <Head title="Order Management" />

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .fadeInUp {
                    animation: fadeInUp 0.5s ease-out forwards;
                }

                .order-card {
                    transition: all 0.2s ease;
                }

                .order-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
                    border-color: #d1d5db;
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="order" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-20 p-3">
                    {/* Header */}
                    <div
                        className={`mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                    >
                        <div className="mb-1 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                                    Order Management
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Track and manage all project orders
                                </p>
                            </div>
                            <Link
                                href="/order/create"
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                                </svg>
                                Create Order
                            </Link>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama project atau perusahaan..."
                                className="block w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-700 shadow-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-8 text-sm text-stone-700 shadow-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <select
                                value={selectedPriority}
                                onChange={(e) => setSelectedPriority(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white py-2.5 pl-3 pr-8 text-sm text-stone-700 shadow-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            >
                                <option value="all">Semua Prioritas</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders Table */}
                    {filteredOrders.length === 0 ? (
                        <div
                            className={`rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                        >
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-50">
                                <svg
                                    className="h-8 w-8 text-stone-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <p className="mb-2 text-lg font-semibold text-slate-800">
                                Tidak ada order
                            </p>
                            <p className="mb-6 text-stone-500 text-sm">
                                Silakan buat order project pertama Anda
                            </p>
                            <Link
                                href="/order/create"
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                            >
                                Buat Order Baru
                            </Link>
                        </div>
                    ) : (
                        <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${mounted ? 'fadeInUp' : 'opacity-0'} order-card`}>
                            <div className="overflow-x-auto">
                                <table className="w-full whitespace-nowrap text-left text-sm">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">Project / Client Info</th>
                                            <th className="px-6 py-4">Service Type</th>
                                            <th className="px-6 py-4">Timeline</th>
                                            <th className="px-6 py-4">Priority</th>
                                            <th className="px-6 py-4">Stage / Tahapan</th>
                                            <th className="px-6 py-4">Payment Status</th>
                                            <th className="px-6 py-4">Team</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {currentOrders.map((order, index) => {
                                            const tahapan = getTahapanStyle(order.tahapan_proyek);
                                            return (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{order.nama_project}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{order.company_name}</div>
                                                    <div className="text-[11px] text-slate-400 font-bold tracking-tight mt-0.5 tracking-wide">{order.phone_number || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-700 font-medium">{order.jenis_interior?.nama_interior || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-700">{formatDate(order.tanggal_masuk_customer)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold border rounded-full ${getPriorityColor(order.priority_level)}`}>
                                                        {capitalize(order.priority_level)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wide border rounded-full ${tahapan.color}`}>
                                                        <span>{tahapan.icon}</span>
                                                        {formatTahapan(order.tahapan_proyek)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 text-[11px] font-semibold tracking-wide border rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                                        {formatPaymentStatus(order.payment_status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2">
                                                        {order.users && order.users.length > 0 ? (
                                                            <>
                                                                {order.users.slice(0, 3).map((user, i) => {
                                                                    // Generates a consistent soft color based on user ID
                                                                    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-teal-500', 'bg-amber-500', 'bg-emerald-500'];
                                                                    const colorClass = colors[user.id % colors.length];
                                                                    return (
                                                                        <div
                                                                            key={user.id}
                                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm ${colorClass} hover:z-10 transition-all cursor-default title="${user.name}"`}
                                                                            title={user.name}
                                                                        >
                                                                            {user.name.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                    );
                                                                })}
                                                                {order.users.length > 3 && (
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border-2 border-white shadow-sm hover:z-10 transition-all cursor-default title={`${order.users.length - 3} more`}">
                                                                        +{order.users.length - 3}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/order/${order.id}`}
                                                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                            title="View Project"
                                                        >
                                                            <Eye size={18} />
                                                        </Link>
                                                        <Link
                                                            href={`/order/${order.id}/edit`}
                                                            className="text-slate-400 hover:text-amber-600 transition-colors"
                                                            title="Edit Project"
                                                        >
                                                            <Edit2 size={18} />
                                                        </Link>
                                                        <button
                                                            onClick={e => { e.preventDefault(); handleDelete(order.id); }}
                                                            className="text-slate-400 hover:text-rose-600 transition-colors"
                                                            title="Delete Project"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-500 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div>
                                    Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Prev
                                        </button>
                                        <div className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
                                            {currentPage} / {totalPages}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
