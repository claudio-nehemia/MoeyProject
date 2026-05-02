import { Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect, Fragment } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        nama_role: string;
    };
}

interface PageProps {
    auth: {
        user: User;
    };
    [key: string]: any;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Termin {
    id: number;
    nama: string;
    total_tahap: number;
    tahapan: Array<{
        step: number;
        text: string;
        persentase: number;
    }>;
}

interface CommitmentFee {
    amount: number;
    paid: boolean;
}

interface StepInvoice {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    bukti_bayar: string | null;
    paid_at: string | null;
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    extend_time: number;
    update_data_time?: string | null;
}

interface StepInfo {
    step: number;
    text: string;
    persentase: number;
    nominal: number;
    status: 'locked' | 'available' | 'pending' | 'paid' | 'waiting_bast' | 'cancelled';
    can_pay: boolean;
    is_last_step: boolean;
    locked_reason: string | null;
    invoice: StepInvoice | null;
}

interface ItemPekerjaan {
    id: number;
    order: Order;
    harga_kontrak: number;
    commitment_fee: CommitmentFee;
    sisa_pembayaran: number;
    total_paid: number;
    remaining_to_pay: number;
    progress_pembayaran: number;
    current_payment_status: string;
    termin: Termin | null;
    steps_info: StepInfo[];
    current_step: number;
    has_bast: boolean;
    is_fully_paid: boolean;
    response_time: string | null;
    response_by: string | null;
    pm_response_time: string | null;
    pm_response_by: string | null;
    has_signed_contract?: boolean;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
}

export default function Index({ itemPekerjaans }: Props) {
    const [generating, setGenerating] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [activeFilter, setActiveFilter] = useState<'semua' | 'belum_bayar' | 'dp' | 'proses' | 'lunas'>('semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string } | null>(null);

    const { auth } = usePage<PageProps>().props;
    const isKepalaMarketing = auth.user.role?.nama_role === 'Kepala Marketing';

    // Fetch task response untuk semua project (tahap: invoice)
    useEffect(() => {
        itemPekerjaans.forEach((item) => {
            const orderId = item.order?.id;
            if (orderId) {
                axios
                    .get(`/task-response/${orderId}/invoice`, { params: { is_marketing: 0 } })
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        if (task) {
                            setTaskResponses((prev) => ({
                                ...prev,
                                [orderId]: { ...prev[orderId], regular: task },
                            }));
                        }
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching task response (invoice):', err);
                        }
                    });

                axios
                    .get(`/task-response/${orderId}/invoice`, { params: { is_marketing: 1 } })
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        if (task) {
                            setTaskResponses((prev) => ({
                                ...prev,
                                [orderId]: { ...prev[orderId], marketing: task },
                            }));
                        }
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching task response (invoice marketing):', err);
                        }
                    });
            }
        });
    }, [itemPekerjaans]);

    // Helper function to determine payment status category
    const getPaymentCategory = (item: ItemPekerjaan): 'belum_bayar' | 'dp' | 'proses' | 'lunas' => {
        // Count paid steps
        const paidSteps = item.steps_info.filter(s => s.status === 'paid').length;
        const totalSteps = item.steps_info.length;
        
        if (item.is_fully_paid || paidSteps === totalSteps) {
            return 'lunas';
        }
        if (paidSteps === 0) {
            return 'belum_bayar';
        }
        if (paidSteps === 1) {
            return 'dp'; // DP = sudah bayar tahap 1
        }
        return 'proses'; // lebih dari tahap 1 tapi belum lunas
    };

    // Filter items based on active filter and signed contract
    const filteredItems = useMemo(() => {
        return itemPekerjaans.filter(item => {
            // Sembunyikan card jika belum upload ttd kontrak
            if (!item.has_signed_contract) return false;

            const matchesFilter = activeFilter === 'semua' || getPaymentCategory(item) === activeFilter;
            const matchesSearch = !searchQuery ||
                item.order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.order.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [itemPekerjaans, activeFilter, searchQuery]);

    // Calculate filter counts only for items with signed contract
    const filterCounts = useMemo(() => {
        const validItems = itemPekerjaans.filter(i => i.has_signed_contract);
        return {
            semua: validItems.length,
            belum_bayar: validItems.filter(i => getPaymentCategory(i) === 'belum_bayar').length,
            dp: validItems.filter(i => getPaymentCategory(i) === 'dp').length,
            proses: validItems.filter(i => getPaymentCategory(i) === 'proses').length,
            lunas: validItems.filter(i => getPaymentCategory(i) === 'lunas').length,
        };
    }, [itemPekerjaans]);

    const handleGenerateInvoice = (itemPekerjaanId: number, terminStep: number) => {
        const key = `${itemPekerjaanId}-${terminStep}`;
        if (confirm(`Generate invoice untuk tahap ${terminStep}?`)) {
            setGenerating(key);
            router.post(
                `/invoice/${itemPekerjaanId}/generate`,
                { termin_step: terminStep },
                {
                    onFinish: () => setGenerating(null),
                }
            );
        }
    };

    const handleViewInvoice = (invoiceId: number) => {
        router.get(`/invoice/${invoiceId}/show`);
    };

    const handleResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin ingin melakukan Response untuk invoice ini?')) {
            router.post(`/invoice/item-pekerjaan/${itemPekerjaanId}/response`);
        }
    };

    const handlePmResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin ingin melakukan PM Response untuk invoice ini?')) {
            router.post(`/pm-response/invoice/${itemPekerjaanId}`);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStepStatusBadge = (step: StepInfo) => {
        const configs = {
            locked: {
                bg: 'bg-gray-100',
                text: 'text-gray-500',
                icon: '🔒',
                label: 'Terkunci'
            },
            available: {
                bg: 'bg-blue-100',
                text: 'text-blue-700',
                icon: '📝',
                label: 'Siap Bayar'
            },
            pending: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: '⏳',
                label: 'Menunggu Bukti'
            },
            paid: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: '✓',
                label: 'Terbayar'
            },
            waiting_bast: {
                bg: 'bg-purple-100',
                text: 'text-purple-700',
                icon: '📋',
                label: 'Tunggu BAST'
            },
            cancelled: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: '✕',
                label: 'Dibatalkan'
            },
        };

        const config = configs[step.status];

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    // Calculate stats
    const totalProjects = itemPekerjaans.length;
    const fullyPaidProjects = itemPekerjaans.filter(i => i.is_fully_paid).length;
    const totalPaidAmount = itemPekerjaans.reduce((sum, i) => sum + (i.total_paid || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
            <Head title="Invoice" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="invoice" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-800">Invoice</h1>
                            <p className="text-sm text-slate-500">Kelola pembayaran bertahap sesuai termin kontrak</p>
                            <div className="mt-2 text-xs text-slate-500">
                                Total project: <span className="font-semibold text-slate-700">{totalProjects}</span> · Selesai termin: <span className="font-semibold text-slate-700">{fullyPaidProjects}</span> · Total terbayar: <span className="font-semibold text-slate-700">{formatRupiah(totalPaidAmount)}</span>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:w-96">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama project, company, atau customer..."
                                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveFilter('semua')}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                        activeFilter === 'semua'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>📋</span>
                                    <span>Semua</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeFilter === 'semua' ? 'bg-indigo-500' : 'bg-slate-300'
                                    }`}>
                                        {filterCounts.semua}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('belum_bayar')}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                        activeFilter === 'belum_bayar'
                                            ? 'bg-slate-700 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>⏳</span>
                                    <span>Belum Bayar</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeFilter === 'belum_bayar' ? 'bg-slate-600' : 'bg-slate-300'
                                    }`}>
                                        {filterCounts.belum_bayar}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('dp')}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                        activeFilter === 'dp'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>💰</span>
                                    <span>DP</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeFilter === 'dp' ? 'bg-amber-500' : 'bg-slate-300'
                                    }`}>
                                        {filterCounts.dp}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('proses')}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                        activeFilter === 'proses'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>🔄</span>
                                    <span>Proses</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeFilter === 'proses' ? 'bg-indigo-500' : 'bg-slate-300'
                                    }`}>
                                        {filterCounts.proses}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('lunas')}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                                        activeFilter === 'lunas'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <span>✅</span>
                                    <span>Lunas</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                        activeFilter === 'lunas' ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}>
                                        {filterCounts.lunas}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-[1100px] w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Project</th>
                                        <th className="px-5 py-4">Pembayaran</th>
                                        <th className="px-5 py-4">Termin</th>
                                        <th className="px-5 py-4">Response</th>
                                        <th className="px-5 py-4 text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                                                {activeFilter === 'semua'
                                                    ? 'Invoice akan muncul setelah kontrak dibuat'
                                                    : 'Tidak ada data sesuai filter'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const orderId = item.order.id;
                                            const taskResponse = taskResponses[orderId]?.regular;
                                            const category = getPaymentCategory(item);
                                            const totalSteps = item.termin?.total_tahap ?? item.steps_info.length;
                                            const positionStep = totalSteps > 0
                                                ? Math.min(item.current_step || 1, totalSteps)
                                                : 0;
                                            const positionText = totalSteps > 0
                                                ? `Tahap ${positionStep}/${totalSteps}`
                                                : '-';
                                            const categoryConfig = {
                                                belum_bayar: { bg: 'bg-slate-100 text-slate-700', icon: '⏳', label: 'Belum Bayar' },
                                                dp: { bg: 'bg-amber-100 text-amber-700', icon: '💰', label: 'DP' },
                                                proses: { bg: 'bg-indigo-100 text-indigo-700', icon: '🔄', label: 'Proses' },
                                                lunas: { bg: 'bg-emerald-100 text-emerald-700', icon: '✅', label: 'Lunas' },
                                            }[category];

                                            return (
                                                <Fragment key={item.id}>
                                                    <tr className="align-top">
                                                        <td className="px-5 py-4">
                                                            <div className="font-semibold text-slate-800">{item.order.nama_project}</div>
                                                            <div className="mt-1 text-xs text-slate-500">{item.order.company_name} • {item.order.customer_name}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${categoryConfig.bg}`}>
                                                                <span>{categoryConfig.icon}</span>
                                                                {categoryConfig.label}
                                                            </div>
                                                            <div className="mt-2 w-40">
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                                    <div
                                                                        className="h-full rounded-full bg-emerald-500"
                                                                        style={{ width: `${item.progress_pembayaran || 0}%` }}
                                                                    />
                                                                </div>
                                                                <div className="mt-1 text-[10px] text-slate-500">
                                                                    {item.progress_pembayaran || 0}% • Terbayar {formatRupiah(item.total_paid || 0)}
                                                                </div>
                                                                <div className="mt-1 text-[10px] text-slate-500">
                                                                    Posisi: {positionText}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="text-xs text-slate-700">{item.termin?.nama || '-'}</div>
                                                            <div className="mt-1 text-[10px] text-slate-500">Status: {item.current_payment_status}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="text-[10px] text-slate-500">
                                                                <div>Response: {item.response_time ? formatDateTime(item.response_time) : '-'}</div>
                                                                <div>By: {item.response_by || '-'}</div>
                                                                <div className="mt-1">Marketing: {item.pm_response_time ? formatDateTime(item.pm_response_time) : '-'}</div>
                                                                <div>By: {item.pm_response_by || '-'}</div>
                                                            </div>
                                                            {taskResponse &&
                                                                taskResponse.status !== 'selesai' &&
                                                                taskResponse.status !== 'telat_submit' &&
                                                                !taskResponse.update_data_time && (
                                                                <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
                                                                    Deadline: {formatDeadline(taskResponse.deadline)}
                                                                    {taskResponse.extend_time > 0 && (
                                                                        <span className="ml-1 text-amber-700">(Ext {taskResponse.extend_time}x)</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setShowExtendModal({ orderId, tahap: 'invoice' })}
                                                                        className="mt-1 block w-fit rounded bg-amber-500 px-2 py-0.5 text-[9px] font-semibold text-white hover:bg-amber-600"
                                                                    >
                                                                        Minta Perpanjangan
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right sticky right-0 bg-white border-l border-slate-200">
                                                            <div className="flex flex-col items-end gap-2">
                                                                {!isKepalaMarketing && (
                                                                    !item.response_time ? (
                                                                        <button
                                                                            onClick={() => handleResponse(item.id)}
                                                                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
                                                                        >
                                                                            Response
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] font-semibold text-emerald-600">✓ Response</span>
                                                                    )
                                                                )}
                                                                {isKepalaMarketing && (
                                                                    !item.pm_response_time ? (
                                                                        <button
                                                                            onClick={() => handlePmResponse(item.id)}
                                                                            className="rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-700"
                                                                        >
                                                                            Marketing Response
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-[10px] font-semibold text-emerald-600">✓ Marketing</span>
                                                                    )
                                                                )}
                                                                <button
                                                                    onClick={() => toggleExpand(item.id)}
                                                                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition ${
                                                                        expandedRows.includes(item.id)
                                                                            ? 'bg-slate-700 hover:bg-slate-800'
                                                                            : 'bg-slate-900 hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    {expandedRows.includes(item.id) ? 'Tutup Tahapan' : 'Lihat Tahapan'}
                                                                    <svg className={`h-3.5 w-3.5 transition-transform ${expandedRows.includes(item.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {expandedRows.includes(item.id) && (
                                                        <tr className="bg-slate-50">
                                                            <td colSpan={5} className="px-5 py-4">
                                                                <div className="grid gap-4">
                                                                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 sm:grid-cols-5">
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase text-slate-400">Harga Kontrak</div>
                                                                            <div className="text-sm font-semibold text-slate-800">{formatRupiah(item.harga_kontrak || 0)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase text-slate-400">Commitment Fee</div>
                                                                            <div className="text-sm font-semibold text-slate-800">{formatRupiah(item.commitment_fee.amount || 0)}{item.commitment_fee.paid ? ' ✓' : ''}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase text-slate-400">Sisa Pembayaran</div>
                                                                            <div className="text-sm font-semibold text-slate-800">{formatRupiah(item.sisa_pembayaran || 0)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase text-slate-400">Sudah Dibayar</div>
                                                                            <div className="text-sm font-semibold text-slate-800">{formatRupiah(item.total_paid || 0)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase text-slate-400">Belum Dibayar</div>
                                                                            <div className="text-sm font-semibold text-slate-800">{formatRupiah(item.remaining_to_pay || 0)}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                                        <table className="min-w-[900px] w-full text-left text-xs">
                                                                            <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase text-slate-500">
                                                                                <tr>
                                                                                    <th className="px-4 py-3">Tahap</th>
                                                                                    <th className="px-4 py-3">Keterangan</th>
                                                                                    <th className="px-4 py-3">Persentase</th>
                                                                                    <th className="px-4 py-3">Nominal</th>
                                                                                    <th className="px-4 py-3">Status</th>
                                                                                    <th className="px-4 py-3 text-right">Aksi</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {item.steps_info.map((step) => {
                                                                                    const showAmount = !step.invoice || (step.invoice.total_amount && step.invoice.total_amount > 0);
                                                                                    const amountValue = step.invoice ? (step.invoice.total_amount || 0) : (step.nominal || 0);

                                                                                    return (
                                                                                        <tr key={step.step} className="align-top">
                                                                                            <td className="px-4 py-3">
                                                                                                <div className="font-semibold text-slate-800">Tahap {step.step}</div>
                                                                                                {step.is_last_step && (
                                                                                                    <div className="mt-1 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-semibold text-purple-700">Final</div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <div className="text-slate-700">{step.text}</div>
                                                                                                {step.locked_reason && (
                                                                                                    <div className="mt-1 text-[10px] text-purple-600">{step.locked_reason}</div>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-slate-700">{step.persentase || 0}%</td>
                                                                                            <td className="px-4 py-3 text-slate-700">
                                                                                                {showAmount ? formatRupiah(amountValue) : '-'}
                                                                                            </td>
                                                                                            <td className="px-4 py-3">{getStepStatusBadge(step)}</td>
                                                                                            <td className="px-4 py-3 text-right">
                                                                                                <div className="flex items-center justify-end gap-2">
                                                                                                    {item.response_time && ((step.can_pay && !step.invoice) || (step.invoice && (!step.invoice.total_amount || step.invoice.total_amount === 0 || !step.invoice.invoice_number))) && (
                                                                                                        <button
                                                                                                            onClick={() => handleGenerateInvoice(item.id, step.step)}
                                                                                                            disabled={generating === `${item.id}-${step.step}`}
                                                                                                            className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                                                                        >
                                                                                                            {generating === `${item.id}-${step.step}` ? 'Loading...' : (step.invoice ? 'Update' : 'Generate')}
                                                                                                        </button>
                                                                                                    )}
                                                                                                    {step.invoice && step.invoice.total_amount > 0 && step.invoice.invoice_number && (
                                                                                                        <button
                                                                                                            onClick={() => handleViewInvoice(step.invoice!.id)}
                                                                                                            className="rounded bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700"
                                                                                                        >
                                                                                                            Lihat
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>

                                                                    {!item.has_bast && item.steps_info.some((s) => s.is_last_step && s.status === 'waiting_bast') && (
                                                                        <div className="rounded border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                                                                            Pembayaran tahap akhir terkunci. Buat BAST di halaman Project Management terlebih dahulu.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    taskResponse={taskResponses[showExtendModal.orderId]?.regular}
                    isMarketing={false}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </div>
    );
}