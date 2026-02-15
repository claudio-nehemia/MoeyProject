import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Order {
    id: number;
    nama_project: string;
    company_name: string | null;
    customer_name: string;
    alamat: string;
}

interface CommitmentFee {
    id: number;
    total_fee: number | null;
    payment_proof: string | null;
    payment_status: string;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Estimasi {
    id: number;
    estimated_cost: string;
}

interface Moodboard {
    id: number;
    order_id: number;
    status: string;
    order: Order;
    commitmentFee: CommitmentFee | null;
    moodboard_kasar: string | null;
    estimasi: Estimasi | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
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

export default function Index({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMoodboard, setSelectedMoodboard] =
        useState<Moodboard | null>(null);
    const [totalFee, setTotalFee] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewFileUrl, setPreviewFileUrl] = useState('');
    const [previewFileType, setPreviewFileType] = useState('');
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');
    // Dual task response state: { [orderId]: { regular?: TaskResponse, marketing?: TaskResponse } }
    const [taskResponses, setTaskResponses] = useState<
        Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>
    >({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        isMarketing: boolean;
        taskResponse: TaskResponse;
    } | null>(null);

    const { auth } = usePage<{
        auth: { user: { isKepalaMarketing: boolean } };
    }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;

    // Fetch dual task responses (regular & marketing) untuk semua moodboard (tahap: cm_fee)
    useEffect(() => {
        moodboards.forEach((moodboard) => {
            const orderId = moodboard.order?.id;
            if (orderId) {
                // Regular
                axios
                    .get(`/task-response/${orderId}/cm_fee`)
                    .then((res) => {
                        const task = Array.isArray(res.data)
                            ? res.data[0]
                            : res.data;
                        setTaskResponses((prev) => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error(
                                'Error fetching regular task response (cm_fee):',
                                err,
                            );
                        }
                    });
                // Marketing
                axios
                    .get(`/task-response/${orderId}/cm_fee?is_marketing=1`)
                    .then((res) => {
                        const task = Array.isArray(res.data)
                            ? res.data[0]
                            : res.data;
                        setTaskResponses((prev) => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error(
                                'Error fetching marketing task response (cm_fee):',
                                err,
                            );
                        }
                    });
            }
        });
    }, [moodboards]);

    // Format number with thousand separators
    const formatNumber = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Parse formatted number back to plain string
    const parseFormattedNumber = (value: string): string => {
        return value.replace(/\./g, '');
    };

    const handleResponse = (moodboard: Moodboard) => {
        if (confirm('Yakin akan membuat response Commitment Fee?')) {
            router.post(
                `/commitment-fee/response/${moodboard.id}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handlePmResponse = (moodboardId: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin memberikan PM response untuk commitment fee ini?',
            )
        ) {
            router.post(
                `/pm-response/commitment-fee/${moodboardId}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handleOpenFeeModal = (
        moodboard: Moodboard,
        isEdit: boolean = false,
    ) => {
        setSelectedMoodboard(moodboard);
        setIsEditMode(isEdit);

        if (isEdit && moodboard.commitmentFee?.total_fee !== null) {
            // Store plain number for editing
            setTotalFee(String(moodboard.commitmentFee!.total_fee));
        } else {
            setTotalFee('');
        }

        setShowFeeModal(true);
    };

    const handleSubmitFee = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMoodboard?.commitmentFee) return;

        const commitmentFeeId = selectedMoodboard.commitmentFee.id;

        // Parse the formatted number back to plain number for submission
        const plainFee = parseFormattedNumber(totalFee);

        const endpoint = isEditMode
            ? `/commitment-fee/revise-fee/${commitmentFeeId}`
            : `/commitment-fee/update-fee/${commitmentFeeId}`;

        router.post(
            endpoint,
            {
                total_fee: plainFee,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowFeeModal(false);
                    setTotalFee('');
                    setSelectedMoodboard(null);
                    setIsEditMode(false);
                },
            },
        );
    };

    const handleResetFee = (moodboard: Moodboard) => {
        if (!moodboard.commitmentFee) return;

        if (
            confirm(
                'PERINGATAN! Tindakan ini akan menghapus total fee, bukti pembayaran, dan mengubah status pembayaran menjadi PENDING (reset). Lanjutkan revisi?',
            )
        ) {
            router.post(
                `/commitment-fee/reset-fee/${moodboard.commitmentFee.id}`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.visit(window.location.pathname, {
                            onFinish: () => {},
                        });
                    },
                },
            );
        }
    };

    const handleOpenPaymentModal = (moodboard: Moodboard) => {
        setSelectedMoodboard(moodboard);
        setPaymentFile(null);
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMoodboard?.commitmentFee || !paymentFile) return;

        const formData = new FormData();
        formData.append('payment_proof', paymentFile);

        router.post(
            `/commitment-fee/upload-payment/${selectedMoodboard.commitmentFee.id}`,
            formData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPaymentModal(false);
                    setPaymentFile(null);
                    setSelectedMoodboard(null);
                },
            },
        );
    };

    const handleImagePreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setShowImagePreview(true);
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
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
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleFilePreview = (fileUrl: string) => {
        const fileExt = fileUrl.split('.').pop()?.toLowerCase() || '';
        setPreviewFileUrl(fileUrl);
        setPreviewFileType(fileExt);
        setShowFilePreview(true);
    };

    const toggleCardExpansion = (moodboardId: number) => {
        setExpandedCards(prev => ({
            ...prev,
            [moodboardId]: !prev[moodboardId]
        }));
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    const isImageFile = (filename: string) => {
        const ext = getFileExtension(filename);
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    };

    const isPdfFile = (filename: string) => {
        return getFileExtension(filename) === 'pdf';
    };

    // Filter moodboards based on search query
    const filteredMoodboards = moodboards.filter(moodboard => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            moodboard.order.nama_project.toLowerCase().includes(query) ||
            moodboard.order.customer_name.toLowerCase().includes(query) ||
            moodboard.order.company_name?.toLowerCase().includes(query) ||
            moodboard.order.alamat.toLowerCase().includes(query)
        );
    });

    return (
        <>
            <Head title="Commitment Fee" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar
                    isOpen={sidebarOpen}
                    currentPage="commitment"
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="pt-16 lg:pl-64">
                    <div className="px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Commitment Fee
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Kelola commitment fee untuk moodboard yang sudah approved
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
                                    placeholder="Cari project, customer, company, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredMoodboards.length === 0 ? (
                                <div className="rounded-lg bg-white p-8 text-center shadow-md">
                                    <p className="text-gray-500">
                                        {searchQuery 
                                            ? "Tidak ada hasil yang sesuai dengan pencarian." 
                                            : "Tidak ada moodboard yang sudah approved."
                                        }
                                    </p>
                                </div>
                            ) : (
                                filteredMoodboards.map((moodboard) => {
                                    const orderId = moodboard.order?.id;
                                    const taskResponseRegular = orderId
                                        ? taskResponses[orderId]?.regular
                                        : null;
                                    const taskResponseMarketing = orderId
                                        ? taskResponses[orderId]?.marketing
                                        : null;
                                    const daysLeftRegular =
                                        taskResponseRegular?.deadline
                                            ? calculateDaysLeft(
                                                  taskResponseRegular.deadline,
                                              )
                                            : null;
                                    const daysLeftMarketing =
                                        taskResponseMarketing?.deadline
                                            ? calculateDaysLeft(
                                                  taskResponseMarketing.deadline,
                                              )
                                            : null;
                                    const canShowResponseCommitmentFee =
                                        !moodboard.commitmentFee ||
                                        !moodboard.commitmentFee.response_time;
                                    const isExpanded = expandedCards[moodboard.id] || false;

                                    return (
                                        <div
                                            key={moodboard.id}
                                            className="rounded-lg border-l-4 border-l-blue-400 border-t border-r border-b border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-md transition-all hover:shadow-lg hover:border-l-blue-500"
                                        >
                                            <div className="p-4">
                                                {/* Compact Header */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                                                            {moodboard.order.nama_project}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {moodboard.order.customer_name}
                                                            {moodboard.order.company_name && ` • ${moodboard.order.company_name}`}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {moodboard.commitmentFee && (
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                                    moodboard.commitmentFee.payment_status === 'completed'
                                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                                }`}
                                                            >
                                                                {moodboard.commitmentFee.payment_status === 'completed'
                                                                    ? '✓ Completed'
                                                                    : '⏳ Pending'}
                                                            </span>
                                                        )}
                                                        
                                                        <button
                                                            onClick={() => toggleCardExpansion(moodboard.id)}
                                                            className="rounded-md bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 transition-colors"
                                                        >
                                                            <svg
                                                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 9l-7 7-7-7"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div className="mt-4 space-y-4">
                                                        {/* Project Details */}
                                                        <div className="rounded-md bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 p-3 text-xs text-gray-600 space-y-1">
                                                            <p><span className="font-medium text-gray-700">Customer:</span> {moodboard.order.customer_name}</p>
                                                            {moodboard.order.company_name && (
                                                                <p><span className="font-medium text-gray-700">Company:</span> {moodboard.order.company_name}</p>
                                                            )}
                                                            {moodboard.order.alamat && (
                                                                <p><span className="font-medium text-gray-700">Alamat:</span> {moodboard.order.alamat}</p>
                                                            )}
                                                        </div>

                                                        {/* Task Response Deadline - REGULAR */}
                                                        {!isKepalaMarketing &&
                                                            taskResponseRegular &&
                                                            taskResponseRegular.status !== 'selesai' && (
                                                                <div className="rounded-md border border-gray-300 bg-gray-50 p-2.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-medium text-gray-800">
                                                                                ⏰ Deadline Commitment Fee
                                                                            </p>
                                                                            <p className="mt-0.5 text-xs text-gray-600">
                                                                                {formatDeadline(taskResponseRegular.deadline)}
                                                                            </p>
                                                                            {daysLeftRegular !== null && (
                                                                                <p className={`mt-0.5 text-xs font-medium ${
                                                                                    daysLeftRegular < 0 
                                                                                        ? 'text-red-600' 
                                                                                        : daysLeftRegular <= 3 
                                                                                        ? 'text-orange-600' 
                                                                                        : 'text-gray-600'
                                                                                }`}>
                                                                                    {daysLeftRegular < 0
                                                                                        ? `Terlambat ${Math.abs(daysLeftRegular)} hari`
                                                                                        : `${daysLeftRegular} hari lagi`}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() =>
                                                                                orderId &&
                                                                                setShowExtendModal({
                                                                                    orderId,
                                                                                    tahap: 'cm_fee',
                                                                                    isMarketing: false,
                                                                                    taskResponse: taskResponseRegular,
                                                                                })
                                                                            }
                                                                            className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                                                                        >
                                                                            Perpanjangan
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Task Response Deadline - MARKETING */}
                                                        {isKepalaMarketing &&
                                                            taskResponseMarketing &&
                                                            taskResponseMarketing.status !== 'selesai' && (
                                                                <div className="rounded-md border border-gray-300 bg-gray-50 p-2.5">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-medium text-gray-800">
                                                                                ⏰ Deadline CF (Marketing)
                                                                            </p>
                                                                            <p className="mt-0.5 text-xs text-gray-600">
                                                                                {formatDeadline(taskResponseMarketing.deadline)}
                                                                            </p>
                                                                            {daysLeftMarketing !== null && (
                                                                                <p className={`mt-0.5 text-xs font-medium ${
                                                                                    daysLeftMarketing < 0 
                                                                                        ? 'text-red-600' 
                                                                                        : daysLeftMarketing <= 3 
                                                                                        ? 'text-orange-600' 
                                                                                        : 'text-gray-600'
                                                                                }`}>
                                                                                    {daysLeftMarketing < 0
                                                                                        ? `Terlambat ${Math.abs(daysLeftMarketing)} hari`
                                                                                        : `${daysLeftMarketing} hari lagi`}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() =>
                                                                                orderId &&
                                                                                setShowExtendModal({
                                                                                    orderId,
                                                                                    tahap: 'cm_fee',
                                                                                    isMarketing: true,
                                                                                    taskResponse: taskResponseMarketing,
                                                                                })
                                                                            }
                                                                            className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                                                                        >
                                                                            Perpanjangan
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Files Section - Vertical Layout */}
                                                        <div className="space-y-2.5">
                                                            {/* Moodboard File */}
                                                            {moodboard.moodboard_kasar && (
                                                                <div className="rounded-md border border-purple-200 bg-gradient-to-br from-white to-purple-50/40 p-3">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                                                                                <svg
                                                                                    className="h-5 w-5 text-purple-600"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                    />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                                                    Moodboard Design
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    Klik preview atau download
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1.5">
                                                                            <button
                                                                                onClick={() => handleImagePreview(`/storage/${moodboard.moodboard_kasar}`)}
                                                                                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                                title="Preview"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                    />
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                            <a
                                                                                href={`/storage/${moodboard.moodboard_kasar}`}
                                                                                download
                                                                                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                                title="Download"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                                                    />
                                                                                </svg>
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Estimasi File */}
                                                            {moodboard.estimasi && (
                                                                <div className="rounded-md border border-blue-200 bg-gradient-to-br from-white to-blue-50/40 p-3">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                                                                <svg
                                                                                    className="h-5 w-5 text-blue-600"
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
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                                                    File Estimasi Biaya
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {isPdfFile(moodboard.estimasi.estimated_cost) ? 'PDF Document' : 'File Document'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1.5">
                                                                            <button
                                                                                onClick={() => moodboard.estimasi && handleFilePreview(`/storage/${moodboard.estimasi.estimated_cost}`)}
                                                                                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                                title="Preview"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                    />
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                            <a
                                                                                href={`/storage/${moodboard.estimasi.estimated_cost}`}
                                                                                download
                                                                                className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                                                                                title="Download"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                                                    />
                                                                                </svg>
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Commitment Fee Info */}
                                                {moodboard.commitmentFee && (
                                                    <div className="rounded-md border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/50 p-3 mt-2">
                                                        <div className="space-y-2 text-xs">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <p className="font-medium text-indigo-700">Response By</p>
                                                                    <p className="text-gray-900">{moodboard.commitmentFee?.response_by}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-indigo-700">Response Time</p>
                                                                    <p className="text-gray-900">{formatDate(moodboard.commitmentFee?.response_time)}</p>
                                                                </div>
                                                            </div>
                                                            {moodboard.commitmentFee?.total_fee !== null && (
                                                                <div className="pt-2 border-t border-indigo-200">
                                                                    <p className="font-medium text-indigo-700">Total Fee</p>
                                                                    <p className="text-base font-bold text-gray-900">
                                                                        {formatCurrency(moodboard.commitmentFee?.total_fee!)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Marketing Response Button */}
                                                {isKepalaMarketing &&
                                                    !moodboard.commitmentFee
                                                        ?.pm_response_time && (
                                                        <button
                                                            onClick={() => {
                                                                handlePmResponse(
                                                                    moodboard.id,
                                                                );
                                                            }}
                                                            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                {/* PM Response Badge */}
                                                {moodboard.commitmentFee
                                                    ?.pm_response_time && (
                                                    <div className="rounded-md border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 p-2.5 mt-2">
                                                        <p className="text-xs font-medium text-green-700">
                                                            ✓ PM Response
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            By:{' '}
                                                            {
                                                                moodboard
                                                                    .commitmentFee
                                                                    ?.pm_response_by
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {formatDate(
                                                                moodboard
                                                                    .commitmentFee
                                                                    ?.pm_response_time,
                                                            )}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {!isKepalaMarketing &&
                                                    canShowResponseCommitmentFee ? (
                                                        <button
                                                            onClick={() =>
                                                                handleResponse(
                                                                    moodboard,
                                                                )
                                                            }
                                                            className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                                        >
                                                            Response Commitment Fee
                                                        </button>
                                                    ) : moodboard.commitmentFee
                                                          ?.total_fee ===
                                                      null ? (
                                                        <button
                                                            onClick={() =>
                                                                handleOpenFeeModal(
                                                                    moodboard,
                                                                )
                                                            }
                                                            className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                                        >
                                                            Isi Total Fee
                                                        </button>
                                                    ) : moodboard.commitmentFee
                                                          ?.payment_status ===
                                                          'pending' &&
                                                      !moodboard.commitmentFee
                                                          ?.payment_proof ? (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleOpenFeeModal(
                                                                        moodboard,
                                                                        true,
                                                                    )
                                                                }
                                                                className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                                                            >
                                                                Revisi Total Fee
                                                            </button>

                                                            <a
                                                                href={`/commitment-fee/${moodboard.commitmentFee?.id}/print`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                                            >
                                                                Cetak CF
                                                            </a>

                                                            <button
                                                                onClick={() =>
                                                                    handleOpenPaymentModal(
                                                                        moodboard,
                                                                    )
                                                                }
                                                                className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 transition-colors"
                                                            >
                                                                Upload Bukti Bayar
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <a
                                                                href={`/commitment-fee/${moodboard.commitmentFee?.id}/print`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                                            >
                                                                Cetak CF
                                                            </a>
                                                            <a
                                                                href={`/storage/${moodboard.commitmentFee?.payment_proof!}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                                            >
                                                                Download Bukti
                                                            </a>
                                                            <button
                                                                onClick={() =>
                                                                    handleResetFee(
                                                                        moodboard,
                                                                    )
                                                                }
                                                                className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 transition-colors"
                                                            >
                                                                Reset & Revisi
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {showImagePreview && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setShowImagePreview(false)}
                    >
                        <div className="relative w-full max-w-6xl">
                            <button
                                onClick={() => setShowImagePreview(false)}
                                className="absolute -top-12 right-0 rounded-full bg-white p-2 text-gray-700 shadow-lg transition-colors hover:text-gray-900"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="h-auto max-h-[90vh] w-full rounded-lg object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}

                {/* File Preview Modal (untuk PDF dan file lainnya) */}
                {showFilePreview && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
                        onClick={() => setShowFilePreview(false)}
                    >
                        <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute top-0 right-0 z-10 flex gap-2 p-4">
                                <a
                                    href={previewFileUrl}
                                    download
                                    className="rounded-md bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-800 transition-colors"
                                    title="Download"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                </a>
                                <button
                                    onClick={() => setShowFilePreview(false)}
                                    className="rounded-md bg-gray-700 p-2 text-white shadow-lg hover:bg-gray-800 transition-colors"
                                    title="Close"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="h-full w-full p-2">
                                {isPdfFile(previewFileUrl) ? (
                                    <iframe
                                        src={previewFileUrl}
                                        className="h-full w-full rounded-lg"
                                        title="PDF Preview"
                                    />
                                ) : isImageFile(previewFileUrl) ? (
                                    <img
                                        src={previewFileUrl}
                                        alt="Preview"
                                        className="h-full w-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="text-center">
                                            <svg
                                                className="mx-auto h-16 w-16 text-gray-400"
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
                                            <p className="mt-4 text-gray-600">
                                                Preview tidak tersedia untuk file ini.
                                            </p>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Silakan download untuk melihat file.
                                            </p>
                                            <a
                                                href={previewFileUrl}
                                                download
                                                className="mt-4 inline-block rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                                            >
                                                Download File
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showFeeModal && selectedMoodboard && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                    >
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                {isEditMode
                                    ? 'Revisi Total Fee'
                                    : 'Isi Total Fee'}
                            </h2>
                            <p className="mb-4 text-sm text-gray-600">
                                Project:{' '}
                                <span className="font-medium">
                                    {selectedMoodboard.order.nama_project}
                                </span>
                            </p>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Total Fee (IDR)
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        value={
                                            totalFee
                                                ? formatNumber(totalFee)
                                                : ''
                                        }
                                        onChange={(e) =>
                                            setTotalFee(
                                                parseFormattedNumber(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Contoh: 1.000.000 atau 500.000
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowFeeModal(false);
                                        setTotalFee('');
                                        setSelectedMoodboard(null);
                                        setIsEditMode(false);
                                    }}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitFee}
                                    className={`flex-1 rounded-lg px-4 py-2 text-white transition-colors ${isEditMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {isEditMode ? 'Simpan Revisi' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showPaymentModal && selectedMoodboard && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                    >
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                Upload Bukti Pembayaran
                            </h2>
                            <p className="mb-4 text-sm text-gray-600">
                                Project:{' '}
                                <span className="font-medium">
                                    {selectedMoodboard.order.nama_project}
                                </span>
                            </p>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    File Bukti Pembayaran
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setPaymentFile(
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Format: JPG, JPEG, PNG, PDF (Max: 10MB)
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setPaymentFile(null);
                                        setSelectedMoodboard(null);
                                    }}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitPayment}
                                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                >
                                    Upload
                                </button>
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
            </div>
        </>
    );
}
