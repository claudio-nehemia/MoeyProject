import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

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
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
}

export default function Index({ itemPekerjaans }: Props) {
    const [generating, setGenerating] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [activeFilter, setActiveFilter] = useState<'semua' | 'belum_bayar' | 'dp' | 'proses' | 'lunas'>('semua');
    const [taskResponses, setTaskResponses] = useState<Record<number, any>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string } | null>(null);

    // Fetch task response untuk semua project (tahap: invoice)
    useEffect(() => {
        itemPekerjaans.forEach((item) => {
            const orderId = item.order?.id;
            if (orderId) {
                axios
                    .get(`/task-response/${orderId}/invoice`)
                    .then((res) => {
                        if (res.data) {
                            setTaskResponses((prev) => ({ ...prev, [orderId]: res.data }));
                        }
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching task response (invoice):', err);
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

    // Filter items based on active filter
    const filteredItems = useMemo(() => {
        if (activeFilter === 'semua') return itemPekerjaans;
        return itemPekerjaans.filter(item => getPaymentCategory(item) === activeFilter);
    }, [itemPekerjaans, activeFilter]);

    // Calculate filter counts
    const filterCounts = useMemo(() => {
        return {
            semua: itemPekerjaans.length,
            belum_bayar: itemPekerjaans.filter(i => getPaymentCategory(i) === 'belum_bayar').length,
            dp: itemPekerjaans.filter(i => getPaymentCategory(i) === 'dp').length,
            proses: itemPekerjaans.filter(i => getPaymentCategory(i) === 'proses').length,
            lunas: itemPekerjaans.filter(i => getPaymentCategory(i) === 'lunas').length,
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
                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                            Invoice Management
                                        </h1>
                                        <p className="text-gray-600">Kelola pembayaran bertahap sesuai termin kontrak</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center px-6 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                            <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
                                            <div className="text-xs text-gray-600 font-medium">Total Projects</div>
                                        </div>
                                        <div className="text-center px-6 py-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                            <div className="text-2xl font-bold text-green-600">{fullyPaidProjects}</div>
                                            <div className="text-xs text-gray-600 font-medium">Selesai Termin</div>
                                        </div>
                                        <div className="text-center px-6 py-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                                            <div className="text-lg font-bold text-amber-600">{formatRupiah(totalPaidAmount)}</div>
                                            <div className="text-xs text-gray-600 font-medium">Total Terbayar</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="mb-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveFilter('semua')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeFilter === 'semua'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>📋</span>
                                    <span>Semua</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeFilter === 'semua' ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}>
                                        {filterCounts.semua}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('belum_bayar')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeFilter === 'belum_bayar'
                                            ? 'bg-gray-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>⏳</span>
                                    <span>Belum Bayar</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeFilter === 'belum_bayar' ? 'bg-gray-500' : 'bg-gray-300'
                                    }`}>
                                        {filterCounts.belum_bayar}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('dp')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeFilter === 'dp'
                                            ? 'bg-amber-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>💰</span>
                                    <span>DP</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeFilter === 'dp' ? 'bg-amber-500' : 'bg-gray-300'
                                    }`}>
                                        {filterCounts.dp}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('proses')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeFilter === 'proses'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>🔄</span>
                                    <span>Proses</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeFilter === 'proses' ? 'bg-indigo-500' : 'bg-gray-300'
                                    }`}>
                                        {filterCounts.proses}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveFilter('lunas')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                        activeFilter === 'lunas'
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>✅</span>
                                    <span>Lunas</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeFilter === 'lunas' ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                        {filterCounts.lunas}
                                    </span>
                                </button>
                            </div>
                        </div>

                                {/* Projects List */}
                                <div className="space-y-6">
                            {filteredItems.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-medium">
                                        {activeFilter === 'semua' 
                                            ? 'Tidak ada project dengan kontrak' 
                                            : `Tidak ada project dengan status "${
                                                activeFilter === 'belum_bayar' ? 'Belum Bayar' :
                                                activeFilter === 'dp' ? 'DP' :
                                                activeFilter === 'proses' ? 'Proses' : 'Lunas'
                                            }"`
                                        }
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {activeFilter === 'semua' 
                                            ? 'Invoice akan muncul setelah kontrak dibuat'
                                            : 'Coba pilih filter lain'
                                        }
                                    </p>
                                </div>
                            ) : (
                                filteredItems.map((item) => {
                                    const orderId = item.order.id;
                                    const taskResponse = taskResponses[orderId];

                                    return (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                        {/* Project Header */}
                                        <div 
                                            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                                        {item.order.nama_project.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">{item.order.nama_project}</h3>
                                                        <p className="text-sm text-gray-500">{item.order.company_name} • {item.order.customer_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    {/* Payment Progress */}
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500 mb-1">Progress Pembayaran</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                                                                    style={{ width: `${item.progress_pembayaran || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">
                                                                {item.progress_pembayaran || 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Payment Category Badge */}
                                                    {(() => {
                                                        const category = getPaymentCategory(item);
                                                        const configs = {
                                                            belum_bayar: { bg: 'from-gray-400 to-gray-500', icon: '⏳', label: 'Belum Bayar' },
                                                            dp: { bg: 'from-amber-400 to-orange-500', icon: '💰', label: 'DP' },
                                                            proses: { bg: 'from-indigo-400 to-purple-500', icon: '🔄', label: 'Proses' },
                                                            lunas: { bg: 'from-green-400 to-emerald-500', icon: '✅', label: 'Lunas' },
                                                        };
                                                        const config = configs[category];
                                                        return (
                                                            <span className={`inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r ${config.bg} text-white rounded-full text-sm font-bold shadow-md`}>
                                                                {config.icon} {config.label}
                                                            </span>
                                                        );
                                                    })()}
                                                    {/* Expand Icon */}
                                                    <svg 
                                                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${expandedRows.includes(item.id) ? 'rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Task Response Deadline & Extend Button */}
                                            {taskResponse && taskResponse.status !== 'selesai' && (
                                                <div className="mt-4 mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-amber-800">
                                                                Deadline Invoice
                                                            </p>
                                                            <p className="text-sm font-semibold text-amber-900">
                                                                {new Date(taskResponse.deadline).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                            {taskResponse.extend_time > 0 && (
                                                                <p className="mt-1 text-xs text-orange-600">
                                                                    Perpanjangan: {taskResponse.extend_time}x
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowExtendModal({ orderId, tahap: 'invoice' });
                                                            }}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Summary Row */}
                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-4">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500">Harga Kontrak</div>
                                                    <div className="text-sm font-bold text-gray-900">{formatRupiah(item.harga_kontrak || 0)}</div>
                                                </div>
                                                <div className={`rounded-lg p-3 ${item.commitment_fee.paid ? 'bg-green-50' : 'bg-amber-50'}`}>
                                                    <div className={`text-xs ${item.commitment_fee.paid ? 'text-green-600' : 'text-amber-600'}`}>
                                                        Commitment Fee {item.commitment_fee.paid ? '✓' : '(Pending)'}
                                                    </div>
                                                    <div className={`text-sm font-bold ${item.commitment_fee.paid ? 'text-green-700' : 'text-amber-700'}`}>
                                                        {formatRupiah(item.commitment_fee.amount || 0)}
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <div className="text-xs text-blue-600">Sisa Pembayaran</div>
                                                    <div className="text-sm font-bold text-blue-700">{formatRupiah(item.sisa_pembayaran || 0)}</div>
                                                </div>
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <div className="text-xs text-green-600">Sudah Dibayar</div>
                                                    <div className="text-sm font-bold text-green-700">{formatRupiah(item.total_paid || 0)}</div>
                                                </div>
                                                <div className="bg-orange-50 rounded-lg p-3">
                                                    <div className="text-xs text-orange-600">Belum Dibayar</div>
                                                    <div className="text-sm font-bold text-orange-700">{formatRupiah(item.remaining_to_pay || 0)}</div>
                                                </div>
                                                <div className="bg-indigo-50 rounded-lg p-3">
                                                    <div className="text-xs text-indigo-600">Termin</div>
                                                    <div className="text-sm font-bold text-indigo-700">{item.termin?.nama || '-'}</div>
                                                    {item.current_payment_status !== 'Belum Bayar' && (
                                                        <div className="text-xs text-indigo-500 mt-0.5">Status: {item.current_payment_status}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Detail - Payment Steps */}
                                        {expandedRows.includes(item.id) && (
                                            <div className="border-t border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white">
                                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    Tahapan Pembayaran
                                                </h4>
                                                
                                                <div className="space-y-3">
                                                    {item.steps_info.map((step, idx) => (
                                                        <div 
                                                            key={step.step}
                                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                                                                step.status === 'paid' 
                                                                    ? 'bg-green-50 border-green-200' 
                                                                    : step.status === 'pending'
                                                                    ? 'bg-yellow-50 border-yellow-200'
                                                                    : step.status === 'available'
                                                                    ? 'bg-blue-50 border-blue-200'
                                                                    : step.status === 'waiting_bast'
                                                                    ? 'bg-purple-50 border-purple-200'
                                                                    : 'bg-gray-50 border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                {/* Step Number */}
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                                                                    step.status === 'paid' 
                                                                        ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                                                        : step.status === 'pending'
                                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-400'
                                                                        : step.status === 'available'
                                                                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                                                        : step.status === 'waiting_bast'
                                                                        ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                                                                        : 'bg-gray-400'
                                                                }`}>
                                                                    {step.status === 'paid' ? '✓' : step.step}
                                                                </div>
                                                                
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-gray-900">Tahap {step.step}</span>
                                                                        {step.is_last_step && (
                                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                                                                Final
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600">{step.text}</div>
                                                                    {step.locked_reason && (
                                                                        <div className="text-xs text-purple-600 mt-1">⚠️ {step.locked_reason}</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                {/* Amount */}
                                                                <div className="text-right">
                                                                    <div className="text-sm font-bold text-gray-900">
                                                                        {step.invoice ? formatRupiah(step.invoice.total_amount || 0) : formatRupiah(step.nominal || 0)}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{step.persentase || 0}%</div>
                                                                </div>

                                                                {/* Status Badge */}
                                                                {getStepStatusBadge(step)}

                                                                {/* Action Button */}
                                                                {step.can_pay && !step.invoice && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleGenerateInvoice(item.id, step.step);
                                                                        }}
                                                                        disabled={generating === `${item.id}-${step.step}`}
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                                                    >
                                                                        {generating === `${item.id}-${step.step}` ? (
                                                                            <>
                                                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                Loading...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                                </svg>
                                                                                Generate Invoice
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {step.invoice && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleViewInvoice(step.invoice!.id);
                                                                        }}
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                        Lihat Invoice
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* BAST Requirement Note */}
                                                {!item.has_bast && item.steps_info.some(s => s.is_last_step && s.status === 'waiting_bast') && (
                                                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                                        <div className="flex items-start gap-3">
                                                            <svg className="w-5 h-5 text-purple-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div>
                                                                <div className="font-semibold text-purple-800">Pembayaran Tahap Akhir Terkunci</div>
                                                                <div className="text-sm text-purple-600 mt-1">
                                                                    Pembayaran tahap terakhir hanya bisa dilakukan setelah BAST (Berita Acara Serah Terima) untuk Item Pekerjaan ini dibuat.
                                                                    Silakan generate BAST di halaman Project Management terlebih dahulu.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )})
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </div>
    );
}