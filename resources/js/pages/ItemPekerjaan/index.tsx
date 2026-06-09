import { useState, useEffect } from 'react';
import { router, Link, Head, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Produk {
    id: number;
    nama_produk: string;
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
}

interface ItemPekerjaanJenisItem {
    id: number;
    jenis_item_id: number;
    jenis_item_name: string;
    items: Item[];
}

interface ItemPekerjaanProduk {
    id: number;
    produk_id: number;
    produk_name: string;
    quantity: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    jenisItems: ItemPekerjaanJenisItem[];
}

interface ItemPekerjaan {
    id: number;
    response_by: string;
    response_time: string;
    pm_response_by: string | null;
    pm_response_time: string | null;
    status: 'draft' | 'published';
    produks: ItemPekerjaanProduk[];
}

interface Moodboard {
    id: number;
    order: Order;
    itemPekerjaan: ItemPekerjaan | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
    created_at: string;
}

interface Props {
    moodboards: Moodboard[];
    produks: Produk[];
    jenisItems: JenisItem[];
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    response_time?: string | null;
    response_by?: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
    update_data_time?: string | null;
}

function ItemPekerjaanIndex({ moodboards, produks, jenisItems }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [marketingFilter, setMarketingFilter] = useState('all');
    const [urgencyFilter, setUrgencyFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');

    const [loadingPm, setLoadingPm] = useState<number | null>(null);

    const { auth } = usePage<{ auth: { user: { isAdmin: boolean; isKepalaMarketing: boolean } } }>().props;
    const isAdmin = auth?.user?.isAdmin || false;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const canManageMarketing = isAdmin || isKepalaMarketing;
    const isNotKepalaMarketing = !isKepalaMarketing;

    const companies = Array.from(new Set(moodboards.map(m => m.order?.company_name).filter(Boolean))).sort();

    const dateOptions = Array.from(new Set(moodboards.map(m => {
        const d = new Date(m.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }))).sort().reverse().map(val => {
        const [year, month] = val.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long' });
        return { value: val, label: `${monthName} ${year}` };
    });

    const fetchTaskResponses = (orderId: number) => {
        // Regular
        axios.get(`/task-response/${orderId}/item_pekerjaan`)
            .then(res => {
                const task = Array.isArray(res.data) ? res.data[0] : res.data;
                setTaskResponses(prev => ({
                    ...prev,
                    [orderId]: { ...prev[orderId], regular: task ?? null },
                }));
            })
            .catch(err => {
                if (err.response?.status !== 404) {
                    console.error('Error fetching regular task response (item_pekerjaan):', err);
                }
            });
        // Marketing
        axios.get(`/task-response/${orderId}/item_pekerjaan?is_marketing=1`)
            .then(res => {
                const task = Array.isArray(res.data) ? res.data[0] : res.data;
                setTaskResponses(prev => ({
                    ...prev,
                    [orderId]: { ...prev[orderId], marketing: task ?? null },
                }));
            })
            .catch(err => {
                if (err.response?.status !== 404) {
                    console.error('Error fetching marketing task response (item_pekerjaan):', err);
                }
            });
    };

    useEffect(() => {
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dual task response (regular & marketing) untuk semua moodboard
    useEffect(() => {
        moodboards.forEach(moodboard => {
            if (moodboard.order?.id) {
                fetchTaskResponses(moodboard.order.id);
            }
        });
    }, [moodboards]);

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch = 
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;

        // Status Filter
        if (statusFilter !== 'all') {
            const status = moodboard.itemPekerjaan?.status || 'none';
            if (statusFilter !== status) return false;
        }

        // Date Filter (Month/Year)
        if (dateFilter !== 'all') {
            const d = new Date(moodboard.created_at);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (dateFilter !== val) return false;
        }

        // Company Filter
        if (companyFilter !== 'all' && moodboard.order.company_name !== companyFilter) return false;

        const orderId = moodboard.order?.id;
        const taskResponseMarketing = orderId ? taskResponses[orderId]?.marketing : null;
        const taskResponseRegular = orderId ? taskResponses[orderId]?.regular : null;

        // Marketing Filter
        if (marketingFilter !== 'all') {
            const hasMarketing = !!taskResponseMarketing?.response_time;
            if (marketingFilter === 'responded' && !hasMarketing) return false;
            if (marketingFilter === 'waiting' && hasMarketing) return false;
        }

        // Urgency Filter
        if (urgencyFilter !== 'all') {
            const daysLeft = taskResponseRegular?.deadline ? calculateDaysLeft(taskResponseRegular.deadline) : null;
            if (urgencyFilter === 'overdue' && (daysLeft === null || daysLeft >= 0)) return false;
            if (urgencyFilter === 'due_soon' && (daysLeft === null || daysLeft < 0 || daysLeft > 3)) return false;
            if (urgencyFilter === 'safe' && (daysLeft === null || daysLeft <= 3)) return false;
        }

        return true;
    });

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setMarketingFilter('all');
        setUrgencyFilter('all');
        setCompanyFilter('all');
        setDateFilter('all');
    };

    const handleResponseItemPekerjaan = (moodboardId: number, orderId?: number) => {
        if (window.confirm('Buat response untuk Input Item Pekerjaan?')) {
            setLoading(true);
            router.post(`/item-pekerjaan/response/${moodboardId}`, {}, {
                onSuccess: () => {
                    setLoading(false);
                    if (orderId) fetchTaskResponses(orderId);
                },
                onError: () => {
                    alert('Gagal membuat response');
                    setLoading(false);
                },
            });
        }
    };

    const handlePmResponse = (moodboardId: number, orderId?: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk item pekerjaan ini?')) {
            setLoadingPm(moodboardId);
            router.post(`/pm-response/item-pekerjaan-by-moodboard/${moodboardId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingPm(null);
                    if (orderId) fetchTaskResponses(orderId);
                },
                onError: () => {
                    setLoadingPm(null);
                }
            });
        }
    };

    const formatDateTime = (datetime: string) => {
        return new Date(datetime).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateDaysLeft = (deadline: string | null | undefined) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (Number.isNaN(deadlineDate.getTime())) return null;
        const diffTime = deadlineDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <>
            <Head title="Input Item Pekerjaan" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="item-pekerjaan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-20 p-3">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                                        Input Item Pekerjaan
                                    </h1>
                                    <p className="text-sm text-stone-500">
                                        Kelola produk dan item untuk order dengan desain final
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari project, customer, atau company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-stone-200 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 shadow-sm"
                            />
                            <svg className="absolute left-3 top-3 h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Status Item */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 focus:border-purple-500 focus:outline-none shadow-sm"
                            >
                                <option value="all">Semua Status</option>
                                <option value="none">Belum Input</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>

                            {/* Marketing Status */}
                            <select
                                value={marketingFilter}
                                onChange={(e) => setMarketingFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 focus:border-purple-500 focus:outline-none shadow-sm"
                            >
                                <option value="all">Semua Marketing</option>
                                <option value="responded">Sudah Respon</option>
                                <option value="waiting">Menunggu Respon</option>
                            </select>

                            {/* Urgency */}
                            <select
                                value={urgencyFilter}
                                onChange={(e) => setUrgencyFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 focus:border-purple-500 focus:outline-none shadow-sm"
                            >
                                <option value="all">Semua Deadline</option>
                                <option value="overdue">Terlewati (Overdue)</option>
                                <option value="due_soon">Mendekati (≤ 3 Hari)</option>
                                <option value="safe">Aman</option>
                            </select>

                            {/* Company */}
                            <select
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 focus:border-purple-500 focus:outline-none shadow-sm max-w-[200px]"
                            >
                                <option value="all">Semua Company</option>
                                {companies.map(company => (
                                    <option key={company} value={company}>{company}</option>
                                ))}
                            </select>

                            {/* Date Filter (Month/Year) */}
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 focus:border-purple-500 focus:outline-none shadow-sm"
                            >
                                <option value="all">Semua Bulan</option>
                                {dateOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            {/* Reset */}
                            {(statusFilter !== 'all' || marketingFilter !== 'all' || urgencyFilter !== 'all' || companyFilter !== 'all' || dateFilter !== 'all' || searchQuery !== '') && (
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-tight"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset Filter
                                </button>
                            )}

                            {/* Result Count */}
                            <div className="ml-auto text-xs text-stone-400 font-medium">
                                Menampilkan <span className="text-stone-700 font-bold">{filteredMoodboards.length}</span> project
                            </div>
                        </div>
                    </div>

                    {/* Table / Empty State */}
                    {filteredMoodboards.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-4 text-sm text-stone-600">
                                {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data moodboard dengan desain final'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-stone-100 text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-purple-50 to-stone-50">
                                        <th className="px-4 py-3 text-center font-semibold text-stone-500 uppercase tracking-wider text-xs w-10">
                                            No.
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Project / Client
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Regular Response
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Marketing Response
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Deadline Info
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-stone-500 uppercase tracking-wider text-xs">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredMoodboards.map((moodboard, index) => {
                                        const orderId = moodboard.order?.id;
                                        const taskResponseRegular = orderId ? taskResponses[orderId]?.regular : null;
                                        const taskResponseMarketing = orderId ? taskResponses[orderId]?.marketing : null;
                                        const daysLeftRegular = taskResponseRegular?.deadline ? calculateDaysLeft(taskResponseRegular.deadline) : null;
                                        const daysLeftMarketing = taskResponseMarketing?.deadline ? calculateDaysLeft(taskResponseMarketing.deadline) : null;

                                        const showRegularDeadline =
                                            isNotKepalaMarketing &&
                                            !!taskResponseRegular &&
                                            taskResponseRegular.status !== 'selesai' &&
                                            taskResponseRegular.status !== 'telat_submit' &&
                                            !taskResponseRegular.update_data_time;

                                        const showMarketingDeadline =
                                            canManageMarketing &&
                                            !!taskResponseMarketing &&
                                            taskResponseMarketing.status !== 'selesai' &&
                                            taskResponseMarketing.status !== 'telat_submit' &&
                                            !taskResponseMarketing.update_data_time;

                                        return (
                                            <tr
                                                key={moodboard.id}
                                                className="group hover:bg-purple-50/40 transition-colors duration-150"
                                            >
                                                {/* No. */}
                                                <td className="px-4 py-4 text-center text-stone-400 font-medium text-xs">
                                                    {index + 1}
                                                </td>

                                                {/* Project / Client Info */}
                                                <td className="px-4 py-4 min-w-[200px]">
                                                    <p className="font-semibold text-slate-800 leading-snug">
                                                        {moodboard.order.nama_project}
                                                    </p>
                                                    <p className="text-xs text-stone-500 mt-0.5">
                                                        <span className="font-medium text-stone-600">Company:</span>{' '}
                                                        {moodboard.order.company_name}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        <span className="font-medium text-stone-600">Customer:</span>{' '}
                                                        {moodboard.order.customer_name}
                                                    </p>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4 text-center">
                                                    {!moodboard.itemPekerjaan ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-500">
                                                            <span className="h-1 w-1 rounded-full bg-stone-400 inline-block"></span>
                                                            No Item
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                                                                moodboard.itemPekerjaan.status === 'published'
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-amber-400 text-white'
                                                            }`}>
                                                                {moodboard.itemPekerjaan.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                                                            </span>
                                                            {moodboard.itemPekerjaan.status === 'draft' && (
                                                                <span className="text-[10px] text-amber-600 font-medium">
                                                                    Waiting Publish
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Regular Response */}
                                                <td className="px-4 py-4 min-w-[180px]">
                                                    {moodboard.itemPekerjaan ? (
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-stone-500">
                                                                <span className="font-medium text-stone-600">By:</span>{' '}
                                                                {moodboard.itemPekerjaan.response_by}
                                                            </p>
                                                            <p className="text-[10px] text-stone-400">
                                                                {formatDateTime(moodboard.itemPekerjaan.response_time)}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 pt-1">
                                                                <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                                                                    {moodboard.itemPekerjaan.produks.length} Produk
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : isNotKepalaMarketing ? (
                                                        <button
                                                            onClick={() => handleResponseItemPekerjaan(moodboard.id, moodboard.order?.id)}
                                                            disabled={loading}
                                                            className="w-full rounded-lg bg-purple-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm hover:bg-purple-700 transition-all disabled:bg-stone-300 flex items-center justify-center gap-2"
                                                        >
                                                            {loading ? (
                                                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : 'RESPONSE'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-stone-400 italic">Waiting Regular</span>
                                                    )}
                                                </td>

                                                {/* Marketing Response */}
                                                <td className="px-4 py-4 min-w-[180px]">
                                                    {(moodboard.itemPekerjaan?.pm_response_time || taskResponseMarketing?.response_time) ? (
                                                        <div className="space-y-1 rounded-lg bg-purple-50/50 border border-purple-100 p-2">
                                                            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-tight">✓ Responded</p>
                                                            <p className="text-xs text-purple-900 font-medium">{moodboard.itemPekerjaan?.pm_response_by || taskResponseMarketing?.response_by || '-'}</p>
                                                            <p className="text-[10px] text-purple-600">
                                                                {formatDateTime(moodboard.itemPekerjaan?.pm_response_time || taskResponseMarketing?.response_time!)}
                                                            </p>
                                                        </div>
                                                    ) : canManageMarketing ? (
                                                        <button
                                                            onClick={() => handlePmResponse(moodboard.id, moodboard.order?.id)}
                                                            disabled={loadingPm === moodboard.id}
                                                            className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-2 text-[10px] font-bold text-white shadow-md hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                                        >
                                                            {loadingPm === moodboard.id ? (
                                                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : 'RESPONSE'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-stone-400 italic">Waiting Response</span>
                                                    )}
                                                </td>

                                                {/* Deadline Info */}
                                                <td className="px-4 py-4 min-w-[220px]">
                                                    {/* Regular Deadline */}
                                                    {showRegularDeadline && taskResponseRegular && (
                                                        <div className={`rounded-lg border p-2.5 mb-2 ${
                                                            daysLeftRegular !== null && daysLeftRegular < 0
                                                                ? 'bg-red-50 border-red-200'
                                                                : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                ? 'bg-orange-50 border-orange-200'
                                                                : 'bg-yellow-50 border-yellow-200'
                                                        }`}>
                                                            <p className={`text-xs font-semibold mb-0.5 ${
                                                                daysLeftRegular !== null && daysLeftRegular < 0
                                                                    ? 'text-red-900'
                                                                    : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                    ? 'text-orange-900'
                                                                    : 'text-yellow-900'
                                                            }`}>
                                                                {daysLeftRegular !== null && daysLeftRegular < 0 ? '⚠️ Deadline Terlewat' : '⏰ Deadline'}
                                                            </p>
                                                            <p className={`text-xs ${
                                                                daysLeftRegular !== null && daysLeftRegular < 0
                                                                    ? 'text-red-700'
                                                                    : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                    ? 'text-orange-700'
                                                                    : 'text-yellow-700'
                                                            }`}>
                                                                {formatDeadline(taskResponseRegular.deadline)}
                                                            </p>
                                                            {daysLeftRegular !== null && (
                                                                <p className={`text-xs font-medium mt-0.5 ${
                                                                    daysLeftRegular < 0 ? 'text-red-700'
                                                                    : daysLeftRegular <= 3 ? 'text-orange-700'
                                                                    : 'text-yellow-700'
                                                                }`}>
                                                                    {daysLeftRegular < 0
                                                                        ? `Terlambat ${Math.abs(daysLeftRegular)} hari`
                                                                        : `${daysLeftRegular} hari lagi`}
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'item_pekerjaan', isMarketing: false, taskResponse: taskResponseRegular })}
                                                                className="mt-1.5 w-full rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
                                                            >
                                                                Minta Perpanjangan
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Marketing Deadline */}
                                                    {showMarketingDeadline && taskResponseMarketing && (
                                                        <div className="rounded-lg border bg-purple-50 border-purple-200 p-2.5">
                                                            <p className="text-xs font-semibold mb-0.5 text-purple-900">
                                                                ⏰ Deadline (Marketing)
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                {formatDeadline(taskResponseMarketing.deadline)}
                                                            </p>
                                                            {daysLeftMarketing !== null && (
                                                                <p className="text-xs font-medium mt-0.5 text-purple-700">
                                                                    {daysLeftMarketing < 0
                                                                        ? `Terlambat ${Math.abs(daysLeftMarketing)} hari`
                                                                        : `${daysLeftMarketing} hari lagi`}
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'item_pekerjaan', isMarketing: true, taskResponse: taskResponseMarketing })}
                                                                className="mt-1.5 w-full rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white hover:bg-purple-600 transition-colors"
                                                            >
                                                                Minta Perpanjangan
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* No deadline info */}
                                                    {!showRegularDeadline && !showMarketingDeadline && (
                                                        <span className="text-xs text-stone-400">—</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {/* Lihat Detail & Edit (sudah ada item pekerjaan) */}
                                                        {moodboard.itemPekerjaan ? (
                                                            <>
                                                                <Link
                                                                    href={`/item-pekerjaan/${moodboard.itemPekerjaan.id}/show`}
                                                                    className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                                                                >
                                                                    LIHAT DETAIL
                                                                </Link>
                                                                <Link
                                                                    href={`/item-pekerjaan/${moodboard.itemPekerjaan.id}/edit`}
                                                                    className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
                                                                >
                                                                    EDIT
                                                                </Link>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] text-stone-400 font-medium">No Actions</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

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
        </>
    );
}

export default ItemPekerjaanIndex;