import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
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

interface EstimasiFileData {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface KasarFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
    estimasi_file: EstimasiFileData | null;
}

interface Estimasi {
    id: number;
    estimated_cost: string | null;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Moodboard {
    id: number;
    order_id: number;
    moodboard_kasar: string;
    moodboard_final: string | null;
    kasar_files: KasarFile[];
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    response_by: string;
    response_time: string;
    pm_response_by: string | null;
    pm_response_time: string | null;
    order: Order | null;
    estimasi: Estimasi | null;
}

interface Props {
    moodboards: Moodboard[];
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
}

const statusLabels: Record<string, string> = {
    pending: 'Menunggu Review',
    approved: 'Disetujui',
    revisi: 'Revisi',
};

const statusColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    pending: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100',
        text: 'text-yellow-800',
    },
    approved: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100',
        text: 'text-emerald-800',
    },
    revisi: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100',
        text: 'text-orange-800',
    },
};

export default function EstimasiIndex({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
    const [selectedKasarFile, setSelectedKasarFile] = useState<KasarFile | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Dual task response state: { [orderId]: { regular?: TaskResponse, marketing?: TaskResponse } }
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    // Fetch dual task responses (regular & marketing) untuk semua moodboard
    useEffect(() => {
        moodboards.forEach(moodboard => {
            const orderId = moodboard.order?.id;
            if (orderId) {
                // Regular
                axios.get(`/task-response/${orderId}/estimasi`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (estimasi):', err);
                        }
                    });
                // Marketing
                axios.get(`/task-response/${orderId}/estimasi?is_marketing=1`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (estimasi):', err);
                        }
                    });
            }
        });
    }, [moodboards]);

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        return (
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search)
        );
    });

    const handleResponseEstimasi = async (moodboard: Moodboard) => {
        if (!moodboard) return;

        if (window.confirm('Buat response estimasi untuk project ini?')) {
            setLoading(true);
            router.post(`/estimasi/response/${moodboard.id}`, {}, {
                onSuccess: () => {
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Response error:', errors);
                    alert('Gagal membuat response estimasi');
                    setLoading(false);
                },
            });
        }
    };

    const handlePmResponse = (orderId: number) => {
        console.log('handlePmResponse called with orderId:', orderId);
        if (window.confirm('Apakah Anda yakin ingin memberikan PM response untuk moodboard ini?')) {
            console.log('Sending PM response request to:', `/pm-response/moodboard/${orderId}`);
            router.post(`/pm-response/moodboard/${orderId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('PM Response success');
                },
                onError: (errors) => {
                    console.error('PM Response error:', errors);
                    alert('Gagal memberikan PM response');
                }
            });
        } else {
            console.log('User cancelled PM response');
        }
    };

    const handleUploadEstimasi = async () => {
        if (!selectedMoodboard || !selectedKasarFile || !uploadFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('estimasi_id', selectedMoodboard.estimasi!.id.toString());
        formData.append('moodboard_file_id', selectedKasarFile.id.toString());
        formData.append('estimated_cost', uploadFile);

        router.post('/estimasi/store', formData as any, {
            onSuccess: () => {
                setUploadFile(null);
                setShowUploadModal(false);
                setSelectedMoodboard(null);
                setSelectedKasarFile(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                console.error('Upload error:', errors);
                alert('Gagal upload estimasi');
                setLoading(false);
            },
        });
    };

    const openUploadModal = (moodboard: Moodboard, kasarFile: KasarFile) => {
        setSelectedMoodboard(moodboard);
        setSelectedKasarFile(kasarFile);
        setShowUploadModal(true);
    };

    // Function to open preview modal
    const openPreviewModal = (url: string, fileName: string, type: 'kasar' | 'estimasi') => {
        setPreviewFile({
            url: url,
            name: fileName,
            type: type
        });
        setShowPreviewModal(true);
    };

    // Function to download file
    const downloadFile = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to detect if file is an image
    const isImageFile = (fileName: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    // Function to detect if file is a PDF
    const isPdfFile = (fileName: string): boolean => {
        return fileName.toLowerCase().endsWith('.pdf');
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

    const toggleExpand = (moodboardId: number) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(moodboardId)) {
                newSet.delete(moodboardId);
            } else {
                newSet.add(moodboardId);
            }
            return newSet;
        });
    };

    const calculateDaysLeft = (deadline: string | null | undefined) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (Number.isNaN(deadlineDate.getTime())) return null;
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="flex h-screen bg-stone-50">
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="estimasi"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all w-full overflow-y-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Estimasi Management</h1>
                            <p className="text-xs text-stone-600">Upload estimasi untuk setiap file desain kasar</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
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
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Moodboards Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredMoodboards.length === 0 ? (
                        <div className="col-span-full py-12">
                            <div className="text-center">
                                <svg className="w-16 h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-stone-500 text-sm">Tidak ada moodboard dengan desain kasar</p>
                            </div>
                        </div>
                    ) : (
                        filteredMoodboards.map((moodboard) => {
                            const orderId = moodboard.order?.id;
                            const taskResponseRegular = orderId ? taskResponses[orderId]?.regular : null;
                            const taskResponseMarketing = orderId ? taskResponses[orderId]?.marketing : null;
                            const daysLeftRegular = taskResponseRegular?.deadline ? calculateDaysLeft(taskResponseRegular.deadline) : null;
                            const daysLeftMarketing = taskResponseMarketing?.deadline ? calculateDaysLeft(taskResponseMarketing.deadline) : null;

                            return (
                                <div key={moodboard.id} className="rounded-xl border-2 bg-white border-stone-200 hover:border-blue-300 transition-all overflow-hidden">
                                    <div className="p-4 sm:p-5">
                                        {/* Project Info */}
                                        <div className="mb-4 pb-4 border-b border-stone-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1">
                                                        {moodboard.order?.nama_project}
                                                    </h3>
                                                    <p className="text-sm text-stone-600">{moodboard.order?.company_name}</p>
                                                    <p className="text-xs text-stone-500 mt-1">Customer: {moodboard.order?.customer_name}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[moodboard.status].badge} ${statusColors[moodboard.status].text}`}>
                                                    {statusLabels[moodboard.status]}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Task Response Deadline - REGULAR */}
                                        {!isKepalaMarketing && taskResponseRegular && taskResponseRegular.status !== 'selesai' && (
                                            <div className="mb-4">
                                                <div className={`p-3 rounded-lg border ${
                                                    daysLeftRegular !== null && daysLeftRegular < 0 
                                                        ? 'bg-red-50 border-red-200' 
                                                        : daysLeftRegular !== null && daysLeftRegular <= 3
                                                        ? 'bg-orange-50 border-orange-200'
                                                        : 'bg-yellow-50 border-yellow-200'
                                                }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className={`text-xs font-semibold mb-1 ${
                                                                daysLeftRegular !== null && daysLeftRegular < 0
                                                                    ? 'text-red-900'
                                                                    : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                    ? 'text-orange-900'
                                                                    : 'text-yellow-900'
                                                            }`}>
                                                                {daysLeftRegular !== null && daysLeftRegular < 0 ? '⚠️ Deadline Terlewat' : '⏰ Deadline Estimasi'}
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
                                                                <p className={`text-xs mt-1 font-medium ${
                                                                    daysLeftRegular < 0 
                                                                        ? 'text-red-700'
                                                                        : daysLeftRegular <= 3
                                                                        ? 'text-orange-700'
                                                                        : 'text-yellow-700'
                                                                }`}>
                                                                    {daysLeftRegular < 0 
                                                                        ? `Terlambat ${Math.abs(daysLeftRegular)} hari` 
                                                                        : `${daysLeftRegular} hari lagi`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'estimasi', isMarketing: false, taskResponse: taskResponseRegular })}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Task Response Deadline - MARKETING (Kepala Marketing only) */}
                                        {isKepalaMarketing && taskResponseMarketing && taskResponseMarketing.status !== 'selesai' && (
                                            <div className="mb-4">
                                                <div className={`p-3 rounded-lg border bg-purple-50 border-purple-200`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1 text-purple-900">
                                                                ⏰ Deadline Estimasi (Marketing)
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                {formatDeadline(taskResponseMarketing.deadline)}
                                                            </p>
                                                            {daysLeftMarketing !== null && (
                                                                <p className="text-xs mt-1 font-medium text-purple-700">
                                                                    {daysLeftMarketing < 0 
                                                                        ? `Terlambat ${Math.abs(daysLeftMarketing)} hari` 
                                                                        : `${daysLeftMarketing} hari lagi`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'estimasi', isMarketing: true, taskResponse: taskResponseMarketing })}
                                                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Estimasi Response Info */}
                                        {isNotKepalaMarketing && !moodboard.estimasi && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={() => handleResponseEstimasi(moodboard)}
                                                    disabled={loading}
                                                    className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {loading ? 'Memproses...' : 'Buat Response Estimasi'}
                                                </button>
                                            </div>
                                        )}

                                        {moodboard.estimasi && (
                                            <div className="mb-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-blue-900 mb-1">Response Estimasi:</p>
                                                    <p className="text-xs text-blue-700">Oleh: {moodboard.estimasi.response_by}</p>
                                                    <p className="text-xs text-blue-700">
                                                        Waktu: {moodboard.estimasi.response_time ? new Date(moodboard.estimasi.response_time).toLocaleString('id-ID') : '-'}
                                                    </p>
                                                </div>

                                                {/* PM Response Badge */}
                                                {moodboard.estimasi.pm_response_time && (
                                                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                        <p className="text-xs font-semibold text-purple-900">✓ PM Response:</p>
                                                        <p className="text-xs text-purple-700">By: {moodboard.estimasi.pm_response_by}</p>
                                                        <p className="text-xs text-purple-700">
                                                            {moodboard.estimasi.pm_response_time ? new Date(moodboard.estimasi.pm_response_time).toLocaleString('id-ID') : '-'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Marketing Response Button - INDEPENDENT */}
                                        {isKepalaMarketing && !moodboard.pm_response_time && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={() => handlePmResponse(moodboard.order_id)}
                                                    className="w-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all"
                                                >
                                                    Marketing Response
                                                </button>
                                            </div>
                                        )}

                                        {/* PM Response Badge */}
                                        {moodboard.pm_response_time && (
                                            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-purple-900">✓ PM Response</p>
                                                <p className="text-xs text-purple-700">By: {moodboard.pm_response_by}</p>
                                                <p className="text-xs text-purple-700">
                                                    {new Date(moodboard.pm_response_time).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Kasar Files List */}
                                        {moodboard.estimasi && moodboard.kasar_files.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-stone-700 mb-3">
                                                    File Desain Kasar ({moodboard.kasar_files.length}):
                                                </p>
                                                <div className="space-y-3">
                                                    {moodboard.kasar_files.map((kasarFile, idx) => (
                                                        <div key={kasarFile.id} className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                                                            <div className="flex items-start gap-3">
                                                                {/* Preview Image with Click to Enlarge */}
                                                                <div 
                                                                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-stone-200 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                                                                    onClick={() => openPreviewModal(kasarFile.url, kasarFile.original_name, 'kasar')}
                                                                >
                                                                    <img
                                                                        src={kasarFile.url}
                                                                        alt={kasarFile.original_name}
                                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                                    />
                                                                </div>

                                                                {/* File Info & Actions */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-stone-900 truncate mb-1">
                                                                                File #{idx + 1}: {kasarFile.original_name}
                                                                            </p>
                                                                        </div>
                                                                        {/* Kasar File Actions */}
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => openPreviewModal(kasarFile.url, kasarFile.original_name, 'kasar')}
                                                                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-all"
                                                                                title="Preview Desain Kasar"
                                                                            >
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => downloadFile(kasarFile.url, kasarFile.original_name)}
                                                                                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded transition-all"
                                                                                title="Download Desain Kasar"
                                                                            >
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {kasarFile.estimasi_file ? (
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                <span className="text-xs font-medium text-emerald-700">
                                                                                    ✓ Estimasi sudah diupload
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {/* Estimasi File Actions */}
                                                                                <button
                                                                                    onClick={() => openPreviewModal(kasarFile.estimasi_file!.url, kasarFile.estimasi_file!.original_name, 'estimasi')}
                                                                                    className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded transition-all"
                                                                                    title="Preview Estimasi"
                                                                                >
                                                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                    </svg>
                                                                                    Preview
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => downloadFile(kasarFile.estimasi_file!.url, kasarFile.estimasi_file!.original_name)}
                                                                                    className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-all"
                                                                                    title="Download Estimasi"
                                                                                >
                                                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                    </svg>
                                                                                    Download
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => openUploadModal(moodboard, kasarFile)}
                                                                                    className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded transition-all"
                                                                                    title="Update Estimasi"
                                                                                >
                                                                                    Update
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                                </svg>
                                                                                <span className="text-xs font-medium text-amber-700">
                                                                                    Belum upload estimasi
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => openUploadModal(moodboard, kasarFile)}
                                                                                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded transition-all"
                                                                            >
                                                                                Upload Estimasi
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && selectedMoodboard && selectedKasarFile && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Upload Estimasi</h2>
                                        <p className="text-xs text-indigo-100 mt-0.5">{selectedKasarFile.original_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFile(null);
                                        setSelectedKasarFile(null);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUploadEstimasi(); }} className="p-4 sm:p-6 space-y-4">
                                {/* Preview Kasar File */}
                                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-stone-700 mb-2">File Desain Kasar:</p>
                                    <img
                                        src={selectedKasarFile.url}
                                        alt={selectedKasarFile.original_name}
                                        className="w-full h-32 object-cover rounded border border-stone-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        File Estimasi
                                    </label>
                                    <div className="relative border-2 border-dashed border-indigo-300 rounded-lg p-4 sm:p-6 text-center hover:border-indigo-400 transition-colors">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="estimasi-upload"
                                            required
                                        />
                                        <label htmlFor="estimasi-upload" className="cursor-pointer">
                                            {uploadFile ? (
                                                <div className="text-center">
                                                    <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-xs sm:text-sm font-medium text-emerald-700">{uploadFile.name}</p>
                                                    <p className="text-xs text-stone-500 mt-1">
                                                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg className="w-8 h-8 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                                    </svg>
                                                    <p className="text-xs sm:text-sm font-medium text-stone-900">
                                                        Drag & drop atau klik untuk upload
                                                    </p>
                                                    <p className="text-xs text-stone-500 mt-1">JPG, PNG, PDF (Max 10MB)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-2 sm:gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setUploadFile(null);
                                            setSelectedKasarFile(null);
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !uploadFile}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memproses...' : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreviewModal && previewFile && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        previewFile.type === 'kasar' 
                                            ? 'bg-blue-500/20' 
                                            : 'bg-purple-500/20'
                                    }`}>
                                        {previewFile.type === 'kasar' ? (
                                            <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">
                                            Preview {previewFile.type === 'kasar' ? 'Desain Kasar' : 'File Estimasi'}
                                        </h2>
                                        <p className="text-xs text-slate-200 mt-0.5 truncate max-w-60 sm:max-w-96">
                                            {previewFile.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Download Button in Header */}
                                    <button
                                        onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                        className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Download File"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                    {/* Close Button */}
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            setPreviewFile(null);
                                        }}
                                        className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-6 max-h-[calc(95vh-120px)] overflow-auto">
                                {isImageFile(previewFile.name) ? (
                                    <div className="flex justify-center">
                                        <img
                                            src={previewFile.url}
                                            alt={previewFile.name}
                                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                        />
                                    </div>
                                ) : isPdfFile(previewFile.name) ? (
                                    <div className="w-full" style={{ height: '70vh' }}>
                                        <iframe
                                            src={previewFile.url}
                                            className="w-full h-full border rounded-lg"
                                            title={previewFile.name}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="max-w-md mx-auto">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                Preview Tidak Tersedia
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                File ini tidak dapat dipratinjau di browser. Silakan unduh untuk melihat konten.
                                            </p>
                                            <button
                                                onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                Download File
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                                <div className="text-xs text-gray-500">
                                    {previewFile.type === 'kasar' ? 'File Desain Kasar' : 'File Estimasi'}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPreviewModal(false);
                                            setPreviewFile(null);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
            </main>
        </div>
    );
}