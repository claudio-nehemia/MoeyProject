import MoodboardModal from '@/components/MoodboardModal';
import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

interface Team {
    id: number;
    name: string;
    role: string;
}

interface EstimasiFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
    estimasi_file: EstimasiFile | null;
}

interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    kasar_files: MoodboardFile[];
    final_files: MoodboardFile[];
    response_time: string;
    response_by: string;
    pm_response_time: string | null;
    pm_response_by: string | null;
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    has_estimasi: boolean;
    has_commitment_fee_completed: boolean;
    has_item_pekerjaan: boolean;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_masuk_customer: string;
    project_status: string;
    moodboard: Moodboard | null;
    team: Team[];
}

interface TaskResponse {
    id: number;
    order_id: number;
    tahap: string;
    status: string;
    deadline: string | null;
    extend_time: number;
    is_marketing?: number;
}

interface Props {
    orders: Order[];
}

const statusColors = {
    pending: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100',
    },
    approved: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100',
    },
    revisi: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        badge: 'bg-orange-100',
    },
};

const statusLabels = {
    pending: 'Menunggu Review',
    approved: 'Diterima',
    revisi: 'Perlu Revisi',
};

export default function Index({ orders }: Props) {
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'upload-kasar' | 'revise'>('create');
    const [filteredOrders, setFilteredOrders] = useState(orders);
    const [replaceFileId, setReplaceFileId] = useState<number | null>(null);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    

    // State untuk dua jenis TaskResponse
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
        const [approvalDesignTaskResponses, setApprovalDesignTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dua jenis task responses (regular & marketing) untuk semua order
    useEffect(() => {
        orders.forEach(order => {
            // Regular
            axios.get(`/task-response/${order.id}/moodboard`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching regular task response:', err);
                    }
                });
            // Marketing
            axios.get(`/task-response/${order.id}/moodboard?is_marketing=1`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                marketing: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching marketing task response:', err);
                    }
                });

            // approval_design - Regular
            axios.get(`/task-response/${order.id}/approval_design`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setApprovalDesignTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching regular approval_design task response:', err);
                    }
                });

            // approval_design - Marketing
            axios.get(`/task-response/${order.id}/approval_design?is_marketing=1`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setApprovalDesignTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                marketing: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching marketing approval_design task response:', err);
                    }
                });
        });
    }, [orders]);

    useEffect(() => {
        const filtered = orders.filter(
            (order) =>
                order.nama_project
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                order.customer_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                order.company_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
        setFilteredOrders(filtered);
    }, [searchQuery, orders]);

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

    const openCreateMoodboard = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('create');
        setShowModal(true);
    };

    const openUploadKasarModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('upload-kasar');
        setShowModal(true);
    };

    const openReviseModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('revise');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const handlePmResponse = (moodboardId: number) => {
        if (confirm('Apakah Anda yakin ingin merespon sebagai Kepala Marketing?')) {
            router.post(`/pm-response/moodboard/${moodboardId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    const toggleExpand = (orderId: number) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleDeleteFile = (fileId: number, fileName: string) => {
        if (window.confirm(`Hapus file "${fileName}"?`)) {
            router.delete(`/moodboard/file-kasar/${fileId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleReplaceFileClick = (fileId: number) => {
        setReplaceFileId(fileId);
        document.getElementById(`replace-file-${fileId}`)?.click();
    };

    const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileId: number) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm(`Ganti file dengan "${file.name}"?`)) {
                const formData = new FormData();
                formData.append('file', file);
                
                router.post(`/moodboard/file-kasar/${fileId}/replace`, formData as any, {
                    preserveScroll: true,
                    onFinish: () => {
                        setReplaceFileId(null);
                        setNewFile(null);
                    }
                });
            }
        }
    };

    const getMoodboardStatus = (moodboard: Moodboard | null) => {
        if (!moodboard) return null;
        return moodboard.status;
    };

    const getActionButtons = (order: Order) => {
        const moodboard = order.moodboard;

        if (!moodboard) {
            return (
                <button
                    onClick={() => openCreateMoodboard(order)}
                    className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:from-violet-600 hover:to-violet-700 sm:w-auto sm:px-4 sm:text-sm"
                >
                    Response
                </button>
            );
        }

        return (
            <div className="flex flex-col gap-2 sm:flex-row">
                {moodboard.kasar_files.length === 0 && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 sm:px-3.5 sm:py-2"
                    >
                        Upload Moodboard
                    </button>
                )}

                {moodboard.kasar_files.length > 0 && moodboard.status !== 'approved' && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 sm:px-3.5 sm:py-2"
                    >
                        + Tambah File ({moodboard.kasar_files.length})
                    </button>
                )}

                {moodboard.kasar_files.length > 0 &&
                    moodboard.status === 'pending' && (
                        <button
                            onClick={() => openReviseModal(order)}
                            className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-orange-600 hover:to-orange-700 sm:px-3.5 sm:py-2"
                        >
                            Revisi
                        </button>
                    )}

                {moodboard.status === 'revisi' && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 sm:px-3.5 sm:py-2"
                    >
                        Upload Ulang
                    </button>
                )}

                {moodboard.status === 'approved' && (
                    <>
                        {!moodboard.has_commitment_fee_completed && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-xs font-medium text-amber-700">
                                    ⏳ Menunggu Commitment Fee diselesaikan
                                </p>
                            </div>
                        )}
                        {moodboard.has_commitment_fee_completed && (
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                                <p className="text-xs font-medium text-indigo-700">
                                    ✓ Approved
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };


    const tahapLabels: Record<string, string> = {
        moodboard: 'Moodboard',
        approval_design: 'Approval Design',
    };

    // Helper untuk render info deadline/extend dan tombol perpanjangan
    const renderDeadlineSection = (task: TaskResponse | undefined, orderId: number, tahap: string, isMarketing: boolean) => {
        if (!task || task.status === 'selesai') return null;
        return (
            <div className={`mb-3 p-2 ${isMarketing ? 'bg-purple-50 border border-purple-200' : 'bg-yellow-50 border border-yellow-200'} rounded text-xs`}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className={isMarketing ? 'text-purple-700' : 'text-yellow-700'}>
                            {tahapLabels[tahap] ? `${tahapLabels[tahap]} - ` : ''}Deadline: {formatDeadline(task.deadline)}
                        </p>
                        {task.extend_time > 0 && (
                            <p className={isMarketing ? 'text-purple-600' : 'text-orange-600'}>
                                Perpanjangan: {task.extend_time}x
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setShowExtendModal({ orderId, tahap, isMarketing, taskResponse: task })}
                        className={`px-2 py-1 ${isMarketing ? 'bg-purple-500 hover:bg-purple-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded text-xs`}
                    >
                        Minta Perpanjangan
                    </button>
                </div>
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50 to-stone-50">
            <Head title="Moodboard Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="moodboard"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="mb-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 shadow-md">
                                <svg
                                    className="h-4 w-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4a2 2 0 00-2 2v4a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                    Moodboard Management
                                </h1>
                                <p className="text-xs text-stone-600">
                                    Kelola desain moodboard untuk setiap project
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <svg
                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-stone-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari project, customer, atau company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-stone-200 py-2.5 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full py-12">
                            <div className="text-center">
                                <svg
                                    className="mx-auto mb-4 h-16 w-16 text-stone-300"
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
                                <p className="text-sm text-stone-500">
                                    Tidak ada project yang ditemukan
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const moodboard = order.moodboard;
                            const status = getMoodboardStatus(moodboard);
                            const statusColor = status ? statusColors[status] : null;
                            const isExpanded = expandedCards.has(order.id);

                            return (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border-2 transition-all ${
                                        statusColor
                                            ? `${statusColor.bg} ${statusColor.border}`
                                            : 'border-stone-100 bg-white hover:border-violet-200'
                                    }`}
                                >
                                    <div className="p-3 sm:p-4">
                                        {/* Compact Header */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate mb-1">
                                                    {order.nama_project}
                                                </h3>
                                                <p className="text-xs text-stone-600 truncate">{order.company_name}</p>
                                                {moodboard && (
                                                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor?.badge} ${statusColor?.text}`}>
                                                        {statusLabels[status!]}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(order.id);
                                                }}
                                                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors"
                                            >
                                                <svg
                                                    className={`w-4 h-4 text-stone-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* DEADLINE & Minta Perpanjangan - regular */}
                                        {renderDeadlineSection(taskResponses[order.id]?.regular, order.id, 'moodboard', false)}
                                        {/* DEADLINE & Minta Perpanjangan - marketing (khusus Kepala Marketing) */}
                                        {isKepalaMarketing && renderDeadlineSection(taskResponses[order.id]?.marketing, order.id, 'moodboard', true)}

                                        {/* DEADLINE & Minta Perpanjangan - approval_design (muncul setelah commitment fee completed) */}
                                        {moodboard?.has_commitment_fee_completed &&
                                            renderDeadlineSection(
                                                approvalDesignTaskResponses[order.id]?.regular,
                                                order.id,
                                                'approval_design',
                                                false,
                                            )}
                                        {moodboard?.has_commitment_fee_completed &&
                                            isKepalaMarketing &&
                                            renderDeadlineSection(
                                                approvalDesignTaskResponses[order.id]?.marketing,
                                                order.id,
                                                'approval_design',
                                                true,
                                            )}

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <>
                                                {/* Info */}
                                                <div className="mb-3 space-y-1.5 border-b border-stone-200 pb-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-stone-600">Customer:</span>
                                                        <span className="font-medium text-stone-900">
                                                            {order.customer_name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-stone-600">Jenis Interior:</span>
                                                        <span className="font-medium text-stone-900">
                                                            {order.jenis_interior}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-stone-600">Tanggal Masuk:</span>
                                                        <span className="font-medium text-stone-900">
                                                            {new Date(order.tanggal_masuk_customer).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Moodboard Status */}
                                                {moodboard && (
                                                    <div className="mb-4 space-y-3 border-b border-stone-200 pb-4">
                                                        {/* List Kasar Files with Actions */}
                                                        {moodboard.kasar_files.length > 0 && (
                                                            <div className="mb-2">
                                                                <p className="text-xs font-semibold text-stone-700 mb-2">
                                                                    File Moodboard ({moodboard.kasar_files.length}):
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {moodboard.kasar_files.map((file, idx) => {
                                                                        // Only show 'DESAIN TERPILIH' after the design has been accepted (approved)
                                                                        const isAcceptedFile =
                                                                            moodboard.status === 'approved' &&
                                                                            moodboard.moodboard_kasar === file.file_path;
                                                                        return (
                                                                            <div 
                                                                                key={file.id} 
                                                                                className={`border-2 rounded-lg p-2 transition-all ${
                                                                                    isAcceptedFile 
                                                                                        ? 'border-emerald-400 bg-emerald-50 shadow-md' 
                                                                                        : 'border-stone-200 bg-stone-50'
                                                                                }`}
                                                                            >
                                                                                {isAcceptedFile && (
                                                                                    <div className="mb-2 flex items-center gap-1.5 bg-emerald-500 text-white px-2 py-1 rounded-md">
                                                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                        <span className="text-xs font-bold">DESAIN TERPILIH</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <div className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden ${
                                                                                        isAcceptedFile ? 'ring-2 ring-emerald-400' : 'bg-stone-200'
                                                                                    }`}>
                                                                                        <img
                                                                                            src={file.url}
                                                                                            alt={file.original_name}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs font-medium text-stone-900 truncate">
                                                                                            #{idx + 1}: {file.original_name}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                                    <a
                                                                                        href={file.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-all"
                                                                                    >
                                                                                        👁️ Lihat
                                                                                    </a>
                                                                                    
                                                                                    {moodboard.status !== 'approved' && (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={() => handleReplaceFileClick(file.id)}
                                                                                                className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded transition-all"
                                                                                            >
                                                                                                🔄 Ganti
                                                                                            </button>
                                                                                            <input
                                                                                                type="file"
                                                                                                id={`replace-file-${file.id}`}
                                                                                                accept=".jpg,.jpeg,.png,.pdf"
                                                                                                className="hidden"
                                                                                                onChange={(e) => handleReplaceFileChange(e, file.id)}
                                                                                            />
                                                                                            <button
                                                                                                onClick={() => handleDeleteFile(file.id, file.original_name)}
                                                                                                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded transition-all"
                                                                                            >
                                                                                                🗑️ Hapus
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                    
                                                                                    {/* DEADLINE & Minta Perpanjangan - hanya setelah response */}
                                                                                    {moodboard.status === 'pending' && moodboard.has_estimasi && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (window.confirm(`Pilih desain "${file.original_name}" sebagai moodboard?`)) {
                                                                                                    router.post(`/moodboard/accept/${moodboard.id}`, {
                                                                                                        moodboard_file_id: file.id,
                                                                                                    });
                                                                                                }
                                                                                            }}
                                                                                            className="col-span-2 px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded transition-all"
                                                                                        >
                                                                                            ✓ Terima Desain Ini
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                <div
                                                                                    className={`mt-2 rounded-lg border p-2 ${file.estimasi_file
                                                                                        ? 'border-emerald-200 bg-emerald-50'
                                                                                        : 'border-stone-200 bg-white'}`}
                                                                                >
                                                                                    {file.estimasi_file ? (
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <div className="min-w-0">
                                                                                                <p className="text-[11px] font-semibold text-emerald-900">File Estimasi</p>
                                                                                                <p className="text-[11px] text-emerald-700 truncate">{file.estimasi_file.original_name}</p>
                                                                                            </div>
                                                                                            <a
                                                                                                href={file.estimasi_file.url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="flex-shrink-0 inline-flex items-center px-2 py-1 text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded"
                                                                                            >
                                                                                                📥 Unduh
                                                                                            </a>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-[11px] text-stone-600">
                                                                                            Belum ada file estimasi yang diupload untuk desain ini.
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {moodboard.notes && (
                                                            <div className="mb-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                                                                <p className="text-xs font-semibold text-orange-900 mb-0.5">Catatan:</p>
                                                                <p className="text-xs text-orange-700 line-clamp-2">{moodboard.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Team */}
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-stone-700 mb-1.5">Tim:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {order.team.map((member) => (
                                                            <span
                                                                key={member.id}
                                                                className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium"
                                                            >
                                                                {member.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Actions - Always Visible */}
                                        <div className="pt-2 border-t border-stone-200">
                                            {getActionButtons(order)}
                                        </div>

                                        {/* Marketing Response Section - INDEPENDENT */}
                                        <div className="pt-2 flex flex-col gap-2 sm:flex-row">
                                            {/* Marketing Response Button */}
                                            {isKepalaMarketing && (!order.moodboard?.pm_response_time) && (
                                                <button
                                                    onClick={() => handlePmResponse(order.moodboard?.id || order.id)}
                                                    className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-purple-600 hover:to-purple-700 sm:px-3.5 sm:py-2"
                                                >
                                                    Marketing Response
                                                </button>
                                            )}
                                            
                                            {/* PM Response Badge */}
                                            {order.moodboard?.pm_response_time && (
                                                <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                                                    <p className="text-xs font-medium text-purple-700">
                                                        ✓ PM: {order.moodboard.pm_response_by}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Moodboard Modal */}
            {selectedOrder && taskResponses[selectedOrder.id]?.regular && (
                <MoodboardModal
                    show={showModal}
                    order={selectedOrder}
                    mode={modalMode}
                    onClose={closeModal}
                    taskResponse={taskResponses[selectedOrder.id]!.regular!}
                    onShowExtendModal={(orderId, tahap) => {
                        const task = taskResponses[orderId]?.regular;
                        if (task) setShowExtendModal({ orderId, tahap, isMarketing: false, taskResponse: task });
                    }}
                />
            )}

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