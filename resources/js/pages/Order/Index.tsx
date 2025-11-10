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
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .order-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .team-avatars {
                    display: flex;
                    gap: -6px;
                }

                .team-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {orders.map((order, index) => (
                                <div
                                    key={order.id}
                                    className={`order-card rounded-xl border border-stone-200 bg-white p-6 shadow-md ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                                    style={{
                                        animationDelay: `${index * 0.05}s`,
                                    }}
                                >
                                    {/* Header */}
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="line-clamp-2 text-lg font-semibold text-stone-900">
                                                {order.nama_project}
                                            </h3>
                                            <p className="mt-1 text-sm text-stone-500">
                                                {order.company_name}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/order/${order.id}`}
                                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                            >
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/order/${order.id}/edit`}
                                                className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50"
                                            >
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleDelete(order.id)
                                                }
                                                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="mb-4 grid grid-cols-2 gap-3 border-b border-stone-200 pb-4">
                                        <div>
                                            <p className="text-xs font-semibold text-stone-600 uppercase">
                                                Interior Type
                                            </p>
                                            <p className="mt-0.5 text-sm text-stone-900">
                                                {
                                                    order.jenis_interior
                                                        .nama_interior
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-stone-600 uppercase">
                                                Phone
                                            </p>
                                            <p className="mt-0.5 text-sm text-stone-900">
                                                {order.phone_number}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-stone-600 uppercase">
                                                Entry Date
                                            </p>
                                            <p className="mt-0.5 text-sm text-stone-900">
                                                {formatDate(
                                                    order.tanggal_masuk_customer,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-stone-600 uppercase">
                                                Status
                                            </p>
                                            <div
                                                className={`status-badge ${getStatusColor(order.project_status)} mt-0.5`}
                                            >
                                                {capitalize(
                                                    order.project_status.replace(
                                                        '_',
                                                        ' ',
                                                    ),
                                                )}{' '}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Priority & Team */}
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`status-badge ${getPriorityColor(order.priority_level)}`}
                                        >
                                            {capitalize(order.priority_level)}{' '}
                                            Priority{' '}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-stone-600">
                                                Team:
                                            </span>
                                            <div className="team-avatars">
                                                {order.users
                                                    .slice(0, 3)
                                                    .map((user, idx) => (
                                                        <div
                                                            key={user.id}
                                                            className="team-avatar bg-gradient-to-br from-blue-400 to-blue-600"
                                                            title={user.name}
                                                        >
                                                            {user.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    ))}
                                                {order.users.length > 3 && (
                                                    <div className="team-avatar bg-stone-400 text-white">
                                                        +
                                                        {order.users.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
