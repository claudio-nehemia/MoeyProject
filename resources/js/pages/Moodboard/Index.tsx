import MoodboardModal from '@/components/MoodboardModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {Link} from '@inertiajs/react';

interface Team {
    id: number;
    name: string;
    role: string;
}

interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    kasar_files: MoodboardFile[];
    final_files: MoodboardFile[];
    response_time: string;
    response_by: string;
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
    const [modalMode, setModalMode] = useState<
        'create' | 'upload-kasar' | 'revise'
    >('create');
    const [filteredOrders, setFilteredOrders] = useState(orders);
    const [replaceFileId, setReplaceFileId] = useState<number | null>(null);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                        Upload Kasar
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
                            const statusColor = status
                                ? statusColors[status]
                                : null;
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

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <>
                                                {/* Info */}
                                                <div className="mb-3 space-y-1.5 border-b border-stone-200 pb-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-600">
                                                    Customer:
                                                </span>
                                                <span className="font-medium text-stone-900">
                                                    {order.customer_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-600">
                                                    Jenis Interior:
                                                </span>
                                                <span className="font-medium text-stone-900">
                                                    {order.jenis_interior}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-600">
                                                    Tanggal Masuk:
                                                </span>
                                                <span className="font-medium text-stone-900">
                                                    {new Date(
                                                        order.tanggal_masuk_customer,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                    )}
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
                                                            File Kasar ({moodboard.kasar_files.length}):
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {moodboard.kasar_files.slice(0, 2).map((file) => (
                                                                <div key={file.id} className="relative group">
                                                                    <img
                                                                        src={file.url}
                                                                        alt={file.original_name}
                                                                        className="w-full h-20 object-cover rounded-lg border border-stone-200"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                                                        <a
                                                                            href={file.url}
                                                                            target="_blank"
                                                                            className="p-1.5 bg-white rounded-md hover:bg-stone-100"
                                                                        >
                                                                            <svg className="w-3 h-3 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                        </a>
                                                                        {moodboard.status !== 'approved' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleReplaceFileClick(file.id)}
                                                                                    className="p-1.5 bg-white rounded-md hover:bg-stone-100"
                                                                                >
                                                                                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteFile(file.id, file.original_name)}
                                                                                    className="p-1.5 bg-white rounded-md hover:bg-stone-100"
                                                                                >
                                                                                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                    </svg>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        id={`replace-file-${file.id}`}
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleReplaceFileChange(e, file.id)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {moodboard.kasar_files.length > 2 && (
                                                            <p className="text-xs text-stone-500 mt-1.5 text-center">
                                                                +{moodboard.kasar_files.length - 2} file lainnya
                                                            </p>
                                                        )}
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
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Modal */}
            {selectedOrder && (
                <MoodboardModal
                    show={showModal}
                    order={selectedOrder}
                    mode={modalMode}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}