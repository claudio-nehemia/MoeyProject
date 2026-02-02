import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface TaskResponse {
    id: number;
    order_id: number;
    user_id: number | null;
    tahap: string;
    status: string;
    start_time: string;
    response_time: string | null;
    update_data_time: string | null;
    deadline: string | null;
    duration: number;
    duration_actual: number;
    extend_time: number;
    is_marketing: boolean;
    order: {
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    };
    user: {
        id: number;
        name: string;
        role: {
            nama_role: string;
        } | null;
    } | null;
}

interface Props {
    taskResponses: {
        data: TaskResponse[];
        links: any;
        meta: any;
    };
    users: Array<{
        id: number;
        name: string;
        role: {
            nama_role: string;
        } | null;
    }>;
    orders: Array<{
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    }>;
    tahapOptions: Record<string, string>;
    statusOptions: Record<string, string>;
    filters: {
        user_id?: number;
        order_id?: number;
        tahap?: string;
        status?: string;
    };
}

export default function Index({
    taskResponses,
    users,
    orders,
    tahapOptions,
    statusOptions,
    filters,
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | ''>(
        filters.user_id || '',
    );
    const [selectedOrderId, setSelectedOrderId] = useState<number | ''>(
        filters.order_id || '',
    );
    const [selectedTahap, setSelectedTahap] = useState<string>(
        filters.tahap || '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || '',
    );

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

    const handleFilter = () => {
        router.get(
            '/log',
            {
                user_id: selectedUserId || undefined,
                order_id: selectedOrderId || undefined,
                tahap: selectedTahap || undefined,
                status: selectedStatus || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSelectedUserId('');
        setSelectedOrderId('');
        setSelectedTahap('');
        setSelectedStatus('');
        router.get('/log');
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            menunggu_response:
                'bg-yellow-50 text-yellow-700 border border-yellow-200',
            menunggu_input: 'bg-blue-50 text-blue-700 border border-blue-200',
            selesai: 'bg-green-50 text-green-700 border border-green-200',
            telat: 'bg-red-50 text-red-700 border border-red-200',
            telat_submit:
                'bg-orange-50 text-orange-700 border border-orange-200',
        };
        return (
            badges[status] || 'bg-gray-50 text-gray-700 border border-gray-200'
        );
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('id-ID');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50">
            <Head title="Log Task Response" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="log"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-4 pt-20 pb-8 pl-4 transition-all sm:px-6 lg:pl-64">
                <div className="mx-auto max-w-[1600px]">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-2 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-slate-200">
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    Log Task Response
                                </h1>
                                <p className="mt-0.5 text-sm text-slate-600">
                                    Monitoring progress dan deadline semua task
                                    response
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                <svg
                                    className="h-5 w-5 text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    />
                                </svg>
                                Filter Data
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        User
                                    </label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) =>
                                            setSelectedUserId(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : '',
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Semua User</option>
                                        {users.map((user) => (
                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name} (
                                                {user.role?.nama_role ||
                                                    'No Role'}
                                                )
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Order
                                    </label>
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) =>
                                            setSelectedOrderId(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : '',
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Semua Order</option>
                                        {orders.map((order) => (
                                            <option
                                                key={order.id}
                                                value={order.id}
                                            >
                                                {order.nama_project} -{' '}
                                                {order.customer_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Tahap
                                    </label>
                                    <select
                                        value={selectedTahap}
                                        onChange={(e) =>
                                            setSelectedTahap(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Semua Tahap</option>
                                        {Object.entries(tahapOptions).map(
                                            ([key, value]) => (
                                                <option key={key} value={key}>
                                                    {value}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) =>
                                            setSelectedStatus(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">Semua Status</option>
                                        {Object.entries(statusOptions).map(
                                            ([key, value]) => (
                                                <option key={key} value={key}>
                                                    {value}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Terapkan Filter
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Nama Project
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Role User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Tahap
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Notif Time
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Response Time
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Update Data Time
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Deadline
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                            Extend
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {taskResponses.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <Link
                                                        href={`/log/order/${task.order_id}`}
                                                        className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                                                    >
                                                        {
                                                            task.order
                                                                .nama_project
                                                        }
                                                    </Link>
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        {
                                                            task.order
                                                                .customer_name
                                                        }
                                                    </div>
                                                    {task.is_marketing && (
                                                        <span className="mt-1 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                            Marketing
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {task.user ? (
                                                    <Link
                                                        href={`/log/user/${task.user.id}`}
                                                        className="text-sm text-indigo-600 transition-colors hover:text-indigo-800"
                                                    >
                                                        {task.user.name}
                                                        <div className="mt-0.5 text-xs text-slate-500">
                                                            {task.user.role
                                                                ?.nama_role ||
                                                                'No Role'}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {task.user ? (
                                                    <span className="text-sm text-slate-700">
                                                        {task.user.role
                                                            ?.nama_role ||
                                                            'No Role'}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {tahapOptions[task.tahap] ||
                                                        task.tahap}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(task.status)}`}
                                                >
                                                    {statusOptions[
                                                        task.status
                                                    ] || task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatDate(task.start_time)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatDate(task.response_time)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatDate(
                                                    task.update_data_time,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {formatDate(task.deadline)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/log/task-response/${task.id}/extend-log`}
                                                    className="group inline-flex items-center gap-1.5 text-sm text-indigo-600 transition-colors hover:text-indigo-800"
                                                >
                                                    {task.extend_time > 0 ? (
                                                        <span className="font-semibold text-orange-600">
                                                            {task.extend_time}x
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">
                                                            Lihat log
                                                        </span>
                                                    )}
                                                    <svg
                                                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {taskResponses.links && (
                            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                                <nav className="flex justify-center">
                                    <div className="flex space-x-1">
                                        {taskResponses.links.map(
                                            (link: any, index: number) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                                        link.active
                                                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                                                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                    } ${!link.url ? 'cursor-not-allowed opacity-50' : 'hover:shadow-sm'}`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ),
                                        )}
                                    </div>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
