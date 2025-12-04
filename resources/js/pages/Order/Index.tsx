import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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
                return 'bg-emerald-100 text-emerald-700';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-stone-100 text-stone-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return 'bg-red-100 text-red-700';
            case 'high':
                return 'bg-orange-100 text-orange-700';
            case 'medium':
                return 'bg-blue-100 text-blue-700';
            case 'low':
                return 'bg-stone-100 text-stone-700';
            default:
                return 'bg-stone-100 text-stone-700';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'lunas':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'termin':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'dp':
                return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'cm_fee':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'not_start':
            default:
                return 'bg-stone-100 text-stone-500 border-stone-200';
        }
    };

    const getTahapanColor = (tahapan: string) => {
        switch (tahapan) {
            case 'produksi':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'kontrak':
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'rab':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'desain_final':
                return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'cm_fee':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'moodboard':
                return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'survey':
                return 'bg-teal-100 text-teal-700 border-teal-200';
            case 'not_start':
            default:
                return 'bg-stone-100 text-stone-500 border-stone-200';
        }
    };

    const formatPaymentStatus = (status: string) => {
        switch (status) {
            case 'not_start': return 'Belum Ada Pembayaran';
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
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div
                        className={`mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1
                                        className="text-3xl font-light text-stone-800"
                                        style={{
                                            fontFamily:
                                                "'Playfair Display', serif",
                                        }}
                                    >
                                        Order Management
                                    </h1>
                                    <p className="text-sm text-stone-500">
                                        Track and manage all project orders
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/order/create"
                                className="inline-flex transform items-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-cyan-600 hover:to-cyan-700 hover:shadow-xl"
                            >
                                <svg
                                    className="mr-2 h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                Create Order
                            </Link>
                        </div>
                    </div>

                    {/* Orders Grid */}
                    {orders.length === 0 ? (
                        <div
                            className={`rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-lg ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                        >
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                                <svg
                                    className="h-8 w-8 text-stone-400"
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
                            <p className="mb-2 text-lg font-semibold text-stone-600">
                                No Orders Yet
                            </p>
                            <p className="mb-6 text-stone-500">
                                Start by creating your first order project
                            </p>
                            <Link
                                href="/order/create"
                                className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-cyan-600 hover:to-cyan-700 hover:shadow-xl"
                            >
                                <svg
                                    className="mr-2 h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                Create First Order
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {orders.map((order, index) => (
                                <div
                                    key={order.id}
                                    className={`order-card group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                                    style={{
                                        animationDelay: `${index * 0.05}s`,
                                    }}
                                >
                                    {/* Priority Indicator Bar */}
                                    <div className={`h-1 w-full ${
                                        order.priority_level === 'urgent' ? 'bg-red-500' :
                                        order.priority_level === 'high' ? 'bg-orange-500' :
                                        order.priority_level === 'medium' ? 'bg-blue-500' : 'bg-stone-300'
                                    }`} />

                                    <div className="p-4">
                                        {/* Header */}
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h3 className="text-sm font-bold text-stone-900 truncate">
                                                    {order.nama_project}
                                                </h3>
                                                <p className="text-xs text-stone-500 truncate">
                                                    {order.company_name}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/order/${order.id}`}
                                                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={`/order/${order.id}/edit`}
                                                    className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="rounded p-1.5 text-red-600 hover:bg-red-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tahapan & Payment Status Badges */}
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border ${getTahapanColor(order.tahapan_proyek)}`}>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                {formatTahapan(order.tahapan_proyek)}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border ${getPaymentStatusColor(order.payment_status)}`}>
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatPaymentStatus(order.payment_status)}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${getStatusColor(order.project_status)}`}>
                                                {capitalize(order.project_status.replace('_', ' '))}
                                            </span>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-stone-100 pt-3">
                                            <div>
                                                <p className="text-stone-400 text-[10px] uppercase tracking-wide">Interior</p>
                                                <p className="text-stone-700 font-medium truncate">{order.jenis_interior?.nama_interior || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-stone-400 text-[10px] uppercase tracking-wide">Telepon</p>
                                                <p className="text-stone-700 font-medium truncate">{order.phone_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-stone-400 text-[10px] uppercase tracking-wide">Tanggal Masuk</p>
                                                <p className="text-stone-700 font-medium">{formatDate(order.tanggal_masuk_customer)}</p>
                                            </div>
                                            <div>
                                                <p className="text-stone-400 text-[10px] uppercase tracking-wide">Prioritas</p>
                                                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${getPriorityColor(order.priority_level)}`}>
                                                    {capitalize(order.priority_level)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Team */}
                                        {order.users && order.users.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                                                <span className="text-[10px] text-stone-400 uppercase tracking-wide">Tim</span>
                                                <div className="flex -space-x-1.5">
                                                    {order.users.slice(0, 4).map((user) => (
                                                        <div
                                                            key={user.id}
                                                            className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm"
                                                            title={user.name}
                                                        >
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {order.users.length > 4 && (
                                                        <div className="w-6 h-6 rounded-full bg-stone-400 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
                                                            +{order.users.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
