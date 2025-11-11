import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MoodboardModal from '@/components/MoodboardModal';

interface Team {
    id: number;
    name: string;
    role: string;
}

interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    response_time: string;
    response_by: string;
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    has_estimasi: boolean;
    has_commitment_fee_completed: boolean;
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
    pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
    approved: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    revisi: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
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
    const [modalMode, setModalMode] = useState<'create' | 'upload-kasar' | 'upload-final' | 'revise'>('create');
    const [filteredOrders, setFilteredOrders] = useState(orders);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const filtered = orders.filter(order =>
            order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.company_name.toLowerCase().includes(searchQuery.toLowerCase())
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

    const openUploadFinalModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('upload-final');
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
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-lg transition-all"
                >
                    Response
                </button>
            );
        }

        return (
            <div className="flex flex-col sm:flex-row gap-2">
                {!moodboard.moodboard_kasar && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all"
                    >
                        Upload Kasar
                    </button>
                )}

                {moodboard.moodboard_kasar && moodboard.status === 'pending' && (
                    <>
                        {moodboard.has_estimasi && (
                            <>
                                <button
                                    onClick={() => openReviseModal(order)}
                                    className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all"
                                >
                                    Revisi
                                </button>
                                <button
                                    onClick={() => router.post(`/moodboard/accept/${moodboard.id}`)}
                                    className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all"
                                >
                                    Terima
                                </button>
                            </>
                        )}
                        {!moodboard.has_estimasi && (
                            <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                                Menunggu estimasi dibuat terlebih dahulu
                            </div>
                        )}
                    </>
                )}

                {moodboard.status === 'revisi' && (
                    <button
                        onClick={() => openUploadKasarModal(order)}
                        className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all"
                    >
                        Upload Ulang
                    </button>
                )}

                {moodboard.status === 'approved' && (
                    <>
                        {!moodboard.has_commitment_fee_completed && (
                            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-700 font-medium">
                                    ⏳ Menunggu Commitment Fee diselesaikan
                                </p>
                            </div>
                        )}
                        {moodboard.has_commitment_fee_completed && !moodboard.moodboard_final && (
                            <button
                                onClick={() => openUploadFinalModal(order)}
                                className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all"
                            >
                                Upload Final
                            </button>
                        )}
                        {moodboard.has_commitment_fee_completed && moodboard.moodboard_final && (
                            <button
                                onClick={() => openUploadFinalModal(order)}
                                className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all"
                            >
                                Update Final
                            </button>
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
            <Sidebar isOpen={sidebarOpen} currentPage="moodboard" onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4a2 2 0 00-2 2v4a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Moodboard Management</h1>
                                <p className="text-xs text-stone-600">Kelola desain moodboard untuk setiap project</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari project, customer, atau company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full py-12">
                            <div className="text-center">
                                <svg className="w-16 h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-stone-500 text-sm">Tidak ada project yang ditemukan</p>
                            </div>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const moodboard = order.moodboard;
                            const status = getMoodboardStatus(moodboard);
                            const statusColor = status ? statusColors[status] : null;

                            return (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border-2 transition-all ${
                                        statusColor
                                            ? `${statusColor.bg} ${statusColor.border}`
                                            : 'bg-white border-stone-100 hover:border-violet-200'
                                    }`}
                                >
                                    <div className="p-4 sm:p-5">
                                        {/* Header */}
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="text-base sm:text-lg font-bold text-stone-900 flex-1 line-clamp-2">
                                                    {order.nama_project}
                                                </h3>
                                                {moodboard && (
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor?.badge} ${statusColor?.text}`}>
                                                        {statusLabels[status!]}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-stone-600">{order.company_name}</p>
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-2 mb-4 pb-4 border-b border-stone-200">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-600">Customer:</span>
                                                <span className="font-medium text-stone-900">{order.customer_name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-stone-600">Jenis Interior:</span>
                                                <span className="font-medium text-stone-900">{order.jenis_interior}</span>
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
                                            <div className="space-y-3 mb-4 pb-4 border-b border-stone-200">
                                                {moodboard.moodboard_kasar && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-stone-600">Desain Kasar:</span>
                                                        <a
                                                            href={`/storage/${moodboard.moodboard_kasar}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download
                                                        </a>
                                                    </div>
                                                )}

                                                {moodboard.moodboard_final && (
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-stone-600">Desain Final:</span>
                                                        <a
                                                            href={`/storage/${moodboard.moodboard_final}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download
                                                        </a>
                                                    </div>
                                                )}

                                                {moodboard.notes && (
                                                    <div className="text-xs">
                                                        <p className="text-stone-600 mb-1">Catatan Revisi:</p>
                                                        <p className="text-stone-700 italic">{moodboard.notes}</p>
                                                    </div>
                                                )}

                                                {(moodboard.response_time || moodboard.response_by) && (
                                                    <div className="text-xs bg-stone-50 rounded-lg p-2.5">
                                                        <p className="text-stone-600">Di-respond oleh: <span className="font-semibold text-stone-900">{moodboard.response_by || '-'}</span></p>
                                                        <p className="text-stone-600 mt-1">Waktu: <span className="font-semibold text-stone-900">{moodboard.response_time ? new Date(moodboard.response_time).toLocaleString('id-ID') : '-'}</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Team */}
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-stone-700 mb-2">Tim:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {order.team.slice(0, 3).map((member) => (
                                                    <div key={member.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-100 to-violet-200">
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-white">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-medium text-violet-900">{member.name}</span>
                                                    </div>
                                                ))}
                                                {order.team.length > 3 && (
                                                    <div className="text-xs text-stone-600 px-2 py-1">
                                                        +{order.team.length - 3} lebih
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div>
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
