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
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(
        {},
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
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
        setExpandedCards((prev) => ({
            ...prev,
            [moodboardId]: !prev[moodboardId],
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

    // Filter moodboards based on search query and status filter
    const filteredMoodboards = moodboards.filter((moodboard) => {
        // Status filtering logic
        const cf = moodboard.commitmentFee;
        let meetsStatus = true;

        if (statusFilter === 'pending_response') {
            meetsStatus = !cf || !cf.response_time;
        } else if (statusFilter === 'pending_payment') {
            meetsStatus = cf?.payment_status === 'pending' && !cf?.payment_proof;
        } else if (statusFilter === 'awaiting_verification') {
            meetsStatus = cf?.payment_status === 'pending' && !!cf?.payment_proof;
        } else if (statusFilter === 'completed') {
            meetsStatus = cf?.payment_status === 'completed';
        }

        if (!meetsStatus) return false;

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
                                Kelola commitment fee untuk moodboard yang sudah
                                approved
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <svg
                                    className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
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
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-sm shadow-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none min-w-[180px]"
                                >
                                    <option value="semua">Semua Status</option>
                                    <option value="pending_response">Belum Response</option>
                                    <option value="pending_payment">Menunggu Pembayaran</option>
                                    <option value="awaiting_verification">Awaiting Verification</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                            <table className="w-full whitespace-nowrap text-left text-sm">
                                <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Project / Client Info</th>
                                        <th className="px-5 py-4">Files & Desain</th>
                                        <th className="px-5 py-4">Deadline Info</th>
                                        <th className="px-5 py-4">Fee Details</th>
                                        <th className="px-5 py-4">Status & Response</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredMoodboards.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500">
                                                {searchQuery
                                                    ? 'Tidak ada hasil yang sesuai dengan pencarian.'
                                                    : 'Tidak ada moodboard yang sudah approved.'}
                                            </td>
                                        </tr>
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

                                            return (
                                                <tr key={moodboard.id} className="transition-colors hover:bg-slate-50/50">
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="font-bold text-slate-900">{moodboard.order.nama_project}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{moodboard.order.company_name || '-'}</div>
                                                        <div className="mt-0.5 text-[11px] font-bold text-slate-400">{moodboard.order.customer_name}</div>
                                                        <div className="mt-1 max-w-[200px] truncate whitespace-pre-wrap text-[11px] text-slate-400">{moodboard.order.alamat}</div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-2">
                                                            {moodboard.moodboard_kasar ? (
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => handleImagePreview(`/storage/${moodboard.moodboard_kasar}`)} className="flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 transition-colors hover:text-purple-800" title="Moodboard Design">
                                                                        🖼️ Preview Design
                                                                    </button>
                                                                    <a href={`/storage/${moodboard.moodboard_kasar}`} download className="text-slate-400 hover:text-slate-600" title="Download">⬇️</a>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs italic text-slate-400">No Design</div>
                                                            )}
                                                            {moodboard.estimasi ? (
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => moodboard.estimasi && handleFilePreview(`/storage/${moodboard.estimasi.estimated_cost}`)} className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800" title="File Estimasi Biaya">
                                                                        📄 File Estimasi
                                                                    </button>
                                                                    <a href={`/storage/${moodboard.estimasi.estimated_cost}`} download className="text-slate-400 hover:text-slate-600" title="Download">⬇️</a>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs italic text-slate-400">No Est</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="flex max-w-[240px] flex-col gap-2">
                                                            {!isKepalaMarketing && taskResponseRegular && taskResponseRegular.status !== 'selesai' && (
                                                                <div className={`rounded-lg p-2.5 border ${daysLeftRegular !== null && daysLeftRegular < 0 ? 'bg-red-50 border-red-200 text-red-700' : daysLeftRegular !== null && daysLeftRegular <= 3 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">⏰ Deadline CF</div>
                                                                    <div className="mt-0.5 text-xs font-medium">{formatDeadline(taskResponseRegular.deadline)}</div>
                                                                    {daysLeftRegular !== null && (
                                                                        <div className="mt-1 text-[10px] font-medium">{daysLeftRegular < 0 ? `Terlambat ${Math.abs(daysLeftRegular)} hari` : `${daysLeftRegular} hari lagi`}</div>
                                                                    )}
                                                                    <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
                                                                        {typeof taskResponseRegular.extend_time === 'number' && taskResponseRegular.extend_time > 0 ? (
                                                                            <span className="text-[9px] font-bold opacity-80">Ext: {taskResponseRegular.extend_time}x</span>
                                                                        ) : <span />}
                                                                        <button onClick={() => setShowExtendModal({orderId: orderId!, tahap: 'cm_fee', isMarketing: false, taskResponse: taskResponseRegular})} className={`rounded px-2 py-1 text-[9px] font-bold text-white transition-colors ${daysLeftRegular !== null && daysLeftRegular < 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'} `}>Perpanjangan</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isKepalaMarketing && taskResponseMarketing && taskResponseMarketing.status !== 'selesai' && (
                                                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-purple-700">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">⏰ Deadline CF(Mkt)</div>
                                                                    <div className="mt-0.5 text-xs font-medium">{formatDeadline(taskResponseMarketing.deadline)}</div>
                                                                    {daysLeftMarketing !== null && (
                                                                        <div className="mt-1 text-[10px] font-medium">{daysLeftMarketing < 0 ? `Terlambat ${Math.abs(daysLeftMarketing)} hari` : `${daysLeftMarketing} hari lagi`}</div>
                                                                    )}
                                                                    <div className="mt-2 flex items-center justify-between border-t border-purple-200 pt-2">
                                                                        {typeof taskResponseMarketing.extend_time === 'number' && taskResponseMarketing.extend_time > 0 ? (
                                                                            <span className="text-[9px] font-bold opacity-80">Ext: {taskResponseMarketing.extend_time}x</span>
                                                                        ) : <span />}
                                                                        <button onClick={() => setShowExtendModal({orderId: orderId!, tahap: 'cm_fee', isMarketing: true, taskResponse: taskResponseMarketing})} className="rounded bg-purple-600 px-2 py-1 text-[9px] font-bold text-white transition-colors hover:bg-purple-700">Perpanjangan</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        {moodboard.commitmentFee && moodboard.commitmentFee.total_fee !== null ? (
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900">{formatCurrency(moodboard.commitmentFee.total_fee)}</div>
                                                                <div className="mt-1.5">
                                                                    {moodboard.commitmentFee.payment_status === 'completed' ? (
                                                                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">✓ Completed</span>
                                                                    ) : (
                                                                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">⏳ Pending</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs italic text-slate-400">Total Fee: Belum Diisi</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-1.5">
                                                            {moodboard.commitmentFee?.response_time ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[10px] text-indigo-700">
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">ResBy</span>
                                                                        <div className="font-semibold">{moodboard.commitmentFee.response_by}</div>
                                                                        <div className="text-indigo-500">{formatDate(moodboard.commitmentFee.response_time)}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="block text-[10px] italic text-slate-400">Belum Response</span>
                                                            )}
                                                            {moodboard.commitmentFee?.pm_response_time && (
                                                                <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] text-emerald-700 mt-1">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">PM ResBy</span>
                                                                    <div className="font-semibold">{moodboard.commitmentFee.pm_response_by}</div>
                                                                    <div className="text-emerald-500">{formatDate(moodboard.commitmentFee.pm_response_time)}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top text-right">
                                                        {isKepalaMarketing && !moodboard.commitmentFee?.pm_response_time && (
                                                            <div className="mb-2">
                                                                <button
                                                                    onClick={() => handlePmResponse(moodboard.id)}
                                                                    className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                                                                >
                                                                    Marketing Response
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            {!isKepalaMarketing && canShowResponseCommitmentFee ? (
                                                                <button
                                                                    onClick={() => handleResponse(moodboard)}
                                                                    className="rounded-md bg-gray-700 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800 w-full text-center"
                                                                >
                                                                    Response Commitment Fee
                                                                </button>
                                                            ) : moodboard.commitmentFee?.total_fee === null ? (
                                                                <button
                                                                    onClick={() => handleOpenFeeModal(moodboard)}
                                                                    className="rounded-md bg-gray-700 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-800 w-full text-center"
                                                                >
                                                                    Isi Total Fee
                                                                </button>
                                                            ) : moodboard.commitmentFee?.payment_status === 'pending' && !moodboard.commitmentFee?.payment_proof ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleOpenFeeModal(moodboard, true)}
                                                                        className="rounded-md bg-gray-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-gray-700 w-full text-center"
                                                                    >
                                                                        Revisi Total Fee
                                                                    </button>
                                                                    <a
                                                                        href={`/commitment-fee/${moodboard.commitmentFee?.id}/print`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-700 w-full text-center"
                                                                    >
                                                                        Cetak CF
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleOpenPaymentModal(moodboard)}
                                                                        className="rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-green-700 w-full text-center"
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
                                                                        className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-700 w-full text-center"
                                                                    >
                                                                        Cetak CF
                                                                    </a>
                                                                    <a
                                                                        href={`/storage/${moodboard.commitmentFee?.payment_proof!}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-emerald-700 w-full text-center"
                                                                    >
                                                                        Download Bukti
                                                                    </a>
                                                                    {!isKepalaMarketing && (
                                                                        <button
                                                                            onClick={() => handleResetFee(moodboard)}
                                                                            className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-700 w-full text-center mt-1"
                                                                        >
                                                                            Reset & Revisi
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
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
                        className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
                        onClick={() => setShowFilePreview(false)}
                    >
                        <div
                            className="relative h-[90vh] w-full max-w-6xl rounded-lg bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 z-10 flex gap-2 p-4">
                                <a
                                    href={previewFileUrl}
                                    download
                                    className="rounded-md bg-gray-700 p-2 text-white shadow-lg transition-colors hover:bg-gray-800"
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
                                    className="rounded-md bg-gray-700 p-2 text-white shadow-lg transition-colors hover:bg-gray-800"
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
                                        className="h-full w-full rounded-lg object-contain"
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
                                                Preview tidak tersedia untuk
                                                file ini.
                                            </p>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Silakan download untuk melihat
                                                file.
                                            </p>
                                            <a
                                                href={previewFileUrl}
                                                download
                                                className="mt-4 inline-block rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-800"
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
