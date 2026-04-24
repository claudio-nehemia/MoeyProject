import MoodboardModal from '@/components/MoodboardModal';
import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState, Fragment } from 'react';
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
    update_data_time?: string | null;
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

const statusLabelTranslations = {
    pending: { label: 'Menunggu Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    approved: { label: 'Diterima', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    revisi: { label: 'Perlu Revisi', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function Index({ orders }: Props) {
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
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
        const filtered = orders.filter((order) => {
            const matchesSearch = 
                order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.company_name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const moodboard = order.moodboard;
            const status = moodboard ? moodboard.status : 'no_response';
            
            let matchesStatus = true;
            if (statusFilter !== 'All') {
                if (statusFilter === 'Pending') matchesStatus = status === 'pending';
                if (statusFilter === 'Diterima') matchesStatus = status === 'approved';
                if (statusFilter === 'Revisi') matchesStatus = status === 'revisi';
                if (statusFilter === 'No Response') matchesStatus = status === 'no_response';
            }

            return matchesSearch && matchesStatus;
        });
        setFilteredOrders(filtered);
    }, [searchQuery, statusFilter, orders]);

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
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openCreateMoodboard = (order: Order) => {
        router.post(`/moodboard/response/${order.id}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(window.location.pathname, {
                    preserveScroll: true,
                    preserveState: false,
                });
            },
        });
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

    const handlePmResponse = (orderId: number) => {
        if (confirm('Apakah Anda yakin ingin merespon sebagai Kepala Marketing?')) {
            router.post(`/pm-response/moodboard/${orderId}`, {}, {
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

        // Tampilkan tombol Response jika belum ada response (berdasarkan response_by dan response_time)
        if (!moodboard || (!moodboard.response_time && !moodboard.response_by)) {
            return isNotKepalaMarketing ? (
                <button
                    onClick={() => openCreateMoodboard(order)}
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-violet-700 transition-all active:scale-95"
                >
                    Response
                </button>
            ) : null;
        }

        return (
            <div className="flex flex-col gap-2 sm:flex-row">
                {moodboard.kasar_files.length === 0 && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Upload Moodboard
                    </button>
                )}

                {moodboard.kasar_files.length > 0 && moodboard.status !== 'approved' && isNotKepalaMarketing && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        + Tambah File
                    </button>
                )}

                {moodboard.status === 'revisi' && isNotKepalaMarketing && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Upload Ulang
                    </button>
                )}
            </div>
        );
    };

    const renderDeadlineSection = (task: TaskResponse | undefined, orderId: number, tahap: string, isMarketing: boolean) => {
        if (!task || task.status === 'selesai' || task.status === 'telat_submit' || task.update_data_time) return null;
        return (
            <div className={`mb-3 p-2 ${isMarketing ? 'bg-purple-50 border border-purple-200' : 'bg-yellow-50 border border-yellow-200'} rounded text-xs`}>
                <div className="flex justify-between items-center">
                    <div>
                        <p className={isMarketing ? 'text-purple-700' : 'text-yellow-700'}>
                            {tahap === 'moodboard' ? 'Moodboard' : 'Approval Design'} - Deadline: {formatDeadline(task.deadline)}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50 to-stone-50 overflow-x-hidden">
            <Head title="Moodboard Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="moodboard"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-2 pt-20 pb-10 pl-0 transition-all sm:px-6 sm:pl-64">
                <div className="max-w-[1600px] mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                            Moodboard Management
                        </h1>
                        <p className="mt-1.5 text-slate-500">
                            Kelola dan review moodboard desain dari tim secara efisien
                        </p>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors text-lg">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari project atau company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 sm:flex-none py-3 pl-4 pr-10 rounded-xl border-slate-200 bg-white text-sm text-slate-600 shadow-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending (Menunggu Review)</option>
                                <option value="Diterima">Diterima</option>
                                <option value="Revisi">Revisi</option>
                                <option value="No Response">No Response</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Project & Client</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Files</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Team</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right pr-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm text-slate-400">Tidak ada project ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const moodboard = order.moodboard;
                                        const status = getMoodboardStatus(moodboard);
                                        const isExpanded = expandedCards.has(order.id);

                                        return (
                                            <Fragment key={order.id}>
                                                <tr 
                                                    className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-violet-50/40' : 'hover:bg-slate-50/70'}`}
                                                    onClick={() => toggleExpand(order.id)}
                                                >
                                                    {/* Project Info */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-slate-800 text-sm leading-tight">{order.nama_project}</div>
                                                        <div className="text-xs text-slate-400 mt-0.5">{order.company_name}</div>
                                                        <span className="mt-1.5 inline-block text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider italic">{order.jenis_interior}</span>
                                                    </td>

                                                    {/* Deadline */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="text-xs text-slate-600 font-medium">
                                                            {formatDeadline(taskResponses[order.id]?.regular?.deadline || taskResponses[order.id]?.marketing?.deadline)}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <span className="text-[10px] text-slate-400 font-bold">7 HARI</span>
                                                            {(taskResponses[order.id]?.regular?.extend_time! > 0 || taskResponses[order.id]?.marketing?.extend_time! > 0) && (
                                                                <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded border border-violet-100 uppercase tracking-tighter">
                                                                    {Math.max(taskResponses[order.id]?.regular?.extend_time || 0, taskResponses[order.id]?.marketing?.extend_time || 0)}x Ext
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Files */}
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex items-center justify-center -space-x-1.5">
                                                            {moodboard?.kasar_files.slice(0, 3).map((file, idx) => (
                                                                <div key={file.id} className="relative">
                                                                    <img 
                                                                        src={file.url} 
                                                                        className={`w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm
                                                                            ${moodboard.moodboard_kasar === file.file_path && moodboard.status === 'approved' ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}
                                                                        `}
                                                                        alt="Moodboard"
                                                                    />
                                                                    {moodboard.moodboard_kasar === file.file_path && moodboard.status === 'approved' && (
                                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                                                                            <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {moodboard && moodboard.kasar_files.length > 3 && (
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                                                                    +{moodboard.kasar_files.length - 3}
                                                                </div>
                                                            )}
                                                            {(!moodboard || moodboard.kasar_files.length === 0) && (
                                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-3.5 text-center">
                                                        {moodboard ? (
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${statusLabelTranslations[status!].color}`}>
                                                                {statusLabelTranslations[status!].label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Response</span>
                                                        )}
                                                    </td>

                                                    {/* Team */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center justify-center -space-x-1.5">
                                                            {order.team.slice(0, 3).map((member, idx) => (
                                                                <div 
                                                                    key={member.id} 
                                                                    title={member.name}
                                                                    className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm
                                                                        ${idx % 3 === 0 ? 'bg-violet-500 text-white' : idx % 3 === 1 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}
                                                                    `}
                                                                >
                                                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1 text-slate-400">
                                                            {/* Chevron toggle indicator */}
                                                            <div 
                                                                className={`p-1.5 rounded-lg transition-all pointer-events-none ${isExpanded ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-300'}`}
                                                            >
                                                                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                            
                                                            <button 
                                                                className="p-1.5 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all" 
                                                                title="Download All"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>

                                                            {moodboard && (status === 'pending' || status === 'revisi') && isNotKepalaMarketing && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); openReviseModal(order); }}
                                                                    className="p-1.5 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all" 
                                                                    title="Revisi"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                    </svg>
                                                                </button>
                                                            )}

                                                            <div className="ml-0.5" onClick={(e) => e.stopPropagation()}>
                                                                {getActionButtons(order)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Detail View */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="bg-slate-50/70 px-10 py-12 border-b border-slate-200">
                                                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                                                <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
                                                                    <div>
                                                                        <h4 className="text-xl font-bold text-slate-800 tracking-tight">Detail Files Moodboard</h4>
                                                                        <p className="text-sm text-slate-500 mt-1">Review detail desain dari tim designer untuk project ini</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        {taskResponses[order.id]?.regular && 
                                                                         taskResponses[order.id]?.regular?.status !== 'selesai' && 
                                                                         taskResponses[order.id]?.regular?.status !== 'telat_submit' && 
                                                                         !taskResponses[order.id]?.regular?.update_data_time && (
                                                                            <button
                                                                                onClick={() => setShowExtendModal({
                                                                                    orderId: order.id,
                                                                                    tahap: 'moodboard',
                                                                                    isMarketing: false,
                                                                                    taskResponse: taskResponses[order.id]!.regular!
                                                                                })}
                                                                                className="px-4 py-2.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-wider"
                                                                            >
                                                                                Minta Perpanjangan
                                                                            </button>
                                                                        )}
                                                                        {moodboard?.status !== 'approved' && isNotKepalaMarketing && (
                                                                            <button 
                                                                                onClick={() => openUploadKasarModal(order)}
                                                                                className="px-5 py-2.5 bg-slate-800 text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-slate-700 transition-all active:scale-95"
                                                                            >
                                                                                + Tambah File Baru
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Response Logging Integration */}
                                                                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                                                                    {isKepalaMarketing && (!order.moodboard?.pm_response_time) && (
                                                                        <button
                                                                            onClick={() => handlePmResponse(order.id)}
                                                                            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
                                                                        >
                                                                            Inisiasi Marketing Response
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {order.moodboard?.pm_response_time && (
                                                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-emerald-800">Marketing Response Selesai</p>
                                                                                <p className="text-[10px] text-emerald-600 font-medium">Oleh {order.moodboard.pm_response_by} pada {formatDateTime(order.moodboard.pm_response_time)}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {order.moodboard?.response_time && (
                                                                        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-blue-800">Desain Selesai Diupload</p>
                                                                                <p className="text-[10px] text-blue-600 font-medium">Oleh {order.moodboard.response_by} pada {formatDateTime(order.moodboard.response_time)}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                                                                    {!moodboard || moodboard?.kasar_files.length === 0 ? (
                                                                        <div className="col-span-full text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                                                                            <p className="text-slate-400 text-sm font-medium italic">Belum ada file desain yang diupload</p>
                                                                        </div>
                                                                    ) : (
                                                                        moodboard?.kasar_files.map((file, idx) => {
                                                                            const isAcceptedFile = moodboard.status === 'approved' && moodboard.moodboard_kasar === file.file_path;
                                                                            return (
                                                                                <div key={file.id} className="group relative">
                                                                                    <div className={`relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-sm border-4 transition-all group-hover:shadow-2xl group-hover:-translate-y-1.5
                                                                                        ${isAcceptedFile ? 'border-emerald-500 shadow-emerald-100 ring-8 ring-emerald-500/5' : 'border-white'}
                                                                                    `}>
                                                                                        <img 
                                                                                            src={file.url} 
                                                                                            alt={file.original_name} 
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                        
                                                                                        {isAcceptedFile && (
                                                                                            <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl border border-white/20">
                                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                                </svg>
                                                                                                TERPILIH
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <a href={file.url} target="_blank" className="flex-1 bg-white hover:bg-slate-50 text-slate-800 py-2.5 rounded-2xl text-[11px] font-bold transition-all shadow-sm text-center">
                                                                                                    Preview Full
                                                                                                </a>
                                                                                                {moodboard?.status !== 'approved' && isNotKepalaMarketing && (
                                                                                                    <button onClick={() => handleDeleteFile(file.id, file.original_name)} className="p-2.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-sm">
                                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="mt-5 px-3">
                                                                                        <div className="font-bold text-slate-800 text-sm truncate tracking-tight">{file.original_name}</div>
                                                                                        <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Upload: {formatDateTime(moodboard.response_time)}</div>
                                                                                        
                                                                                        {moodboard.status === 'pending' && moodboard.has_estimasi && (
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    if (window.confirm(`Pilih desain "${file.original_name}" sebagai moodboard?`)) {
                                                                                                        router.post(`/moodboard/accept/${moodboard.id}`, { moodboard_file_id: file.id });
                                                                                                    }
                                                                                                }}
                                                                                                className="mt-5 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 transform active:scale-95"
                                                                                            >
                                                                                                ✓ Pilih Desain Ini
                                                                                            </button>
                                                                                        )}
                                                                                        
                                                                                        {/* Linked Estimasi Info */}
                                                                                        <div className="mt-5 pt-5 border-t border-slate-200">
                                                                                            {file.estimasi_file ? (
                                                                                                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm transform transition-all hover:shadow-md hover:border-violet-100 group/est">
                                                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover/est:bg-emerald-500 group-hover/est:text-white transition-colors">
                                                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                                            </svg>
                                                                                                        </div>
                                                                                                        <div className="min-w-0">
                                                                                                            <div className="text-[9px] uppercase tracking-widest font-black text-slate-300">File Estimasi</div>
                                                                                                            <div className="text-xs font-bold text-slate-700 truncate">{file.estimasi_file.original_name}</div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <a href={file.estimasi_file.url} target="_blank" className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                                        </svg>
                                                                                                    </a>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="text-[10px] font-bold text-slate-400 text-center py-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 uppercase tracking-widest">
                                                                                                    No Estimation File
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>

                                                                {moodboard?.notes && (
                                                                    <div className="mt-12 p-8 bg-orange-50/50 border border-orange-200/50 rounded-[40px] relative overflow-hidden group/note">
                                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full -mr-16 -mt-16 transition-transform group-hover/note:scale-150 duration-700"></div>
                                                                        <div className="flex items-start gap-6 relative z-10">
                                                                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 shadow-sm border border-orange-200">
                                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h5 className="font-bold text-orange-900 text-lg tracking-tight">Catatan PM</h5>
                                                                                <div className="mt-3 text-base text-orange-800 leading-relaxed font-medium bg-white/40 p-5 rounded-2xl border border-orange-100/50 italic">
                                                                                    "{moodboard.notes}"
                                                                                </div>
                                                                            </div>
                                                                        </div>
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