import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface ExtendLogEntry {
    id: number;
    task_response_id: number;
    user_id: number | null;
    extend_time: number;
    extend_reason: string;
    request_time: string | number;
    status: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
}

interface TaskResponse {
    id: number;
    order_id: number;
    order: {
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    };
    user: { id: number; name: string; role: { nama_role: string } | null } | null;
    tahap: string;
    status: string;
    deadline: string;
    extend_time: number;
    start_time: string;
    response_time: string | null;
    update_data_time: string | null;
}

interface Props {
    taskResponse: TaskResponse;
    extendLogs: ExtendLogEntry[];
    tahapOptions: Record<string, string>;
}

export default function ExtendLog({
    taskResponse,
    extendLogs,
    tahapOptions,
}: Props) {
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
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('id-ID');
    };

    const formatRequestTime = (value: string | number) => {
        if (typeof value === 'number' && value >= 1 && value <= 30) {
            return `${value} hari`;
        }
        if (typeof value === 'string') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return formatDate(value);
        }
        return String(value);
    };

    const getStatusBadge = (status: string | null) => {
        if (!status) return 'bg-gray-50 text-gray-700 border border-gray-200';
        const badges: Record<string, string> = {
            pending: 'bg-amber-50 text-amber-700 border border-amber-200',
            approved: 'bg-green-50 text-green-700 border border-green-200',
            rejected: 'bg-red-50 text-red-700 border border-red-200',
        };
        return badges[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50">
            <Head title={`Log Perpanjangan - ${taskResponse.order.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="log"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="px-4 pt-20 pb-8 pl-4 transition-all sm:px-6 lg:pl-64">
                <div className="max-w-[1400px] mx-auto">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Link
                            href="/log"
                            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium group"
                        >
                            <svg
                                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Kembali ke Log Task Response
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-200">
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Log Perpanjangan Deadline
                                </h1>
                                <p className="text-sm text-slate-600 mt-0.5">
                                    {taskResponse.order.nama_project} ·{' '}
                                    {tahapOptions[taskResponse.tahap] || taskResponse.tahap}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Context card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Informasi Task Response
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Order</p>
                                    <Link
                                        href={`/log/order/${taskResponse.order_id}`}
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors block"
                                    >
                                        {taskResponse.order.nama_project}
                                    </Link>
                                    <p className="text-sm text-slate-600">
                                        {taskResponse.order.customer_name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tahap</p>
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {tahapOptions[taskResponse.tahap] || taskResponse.tahap}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">User</p>
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {taskResponse.user?.name ?? '-'}
                                    </p>
                                    {taskResponse.user?.role && (
                                        <p className="text-sm text-slate-600">
                                            {taskResponse.user.role.nama_role}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deadline · Perpanjangan</p>
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {formatDate(taskResponse.deadline)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {taskResponse.extend_time > 0
                                            ? `${taskResponse.extend_time}x perpanjangan`
                                            : 'Belum ada perpanjangan'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extend logs table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Riwayat Permintaan Perpanjangan
                            </h3>
                        </div>
                        <div className="p-6">
                            {extendLogs.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 mb-4 shadow-inner">
                                        <svg
                                            className="h-8 w-8"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 font-semibold text-base mb-1">
                                        Belum ada riwayat perpanjangan
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Log akan muncul saat ada permintaan perpanjangan deadline.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    #
                                                </th>
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    Perpanjangan ke-
                                                </th>
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    Lama (hari)
                                                </th>
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    Alasan
                                                </th>
                                              
                                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                    Waktu
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {extendLogs.map((log, idx) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                        {log.extend_time}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-700">
                                                        {log.user?.name ?? '-'}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                                                        {formatRequestTime(log.request_time)}
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-700 max-w-md">
                                                        <span className="line-clamp-2" title={log.extend_reason}>
                                                            {log.extend_reason || '-'}
                                                        </span>
                                                    </td>
                                                    
                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}