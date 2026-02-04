import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface CommitmentFee {
    id: number;
    payment_status: string;
}

interface Moodboard {
    id: number;
    moodboard_final: string | null;
    final_files: MoodboardFile[];
    notes: string | null;
    revisi_final: string | null;
    response_final_time: string | null;
    response_final_by: string | null;
    has_response_final: boolean;
    has_pm_response_final: boolean;
    pm_response_time: string | null;
    pm_response_by: string | null;
    pm_response_final_time: string | null;
    pm_response_final_by: string | null;
    order: Order;
    commitmentFee: CommitmentFee;
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
}

interface Props {
    moodboards: Moodboard[];
}

export default function DesainFinalIndex({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [selectedMoodboard, setSelectedMoodboard] =
        useState<Moodboard | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [reviseNotes, setReviseNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MoodboardFile | null>(
        null,
    );
    const [replaceFile, setReplaceFile] = useState<File | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Dual task response state
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
    const isNotKepalaMarketing = !isKepalaMarketing;

    // Fetch dual task responses (regular & marketing) untuk semua moodboard (tahap: desain_final)
    useEffect(() => {
        moodboards.forEach((moodboard) => {
            const orderId = moodboard.order?.id;
            if (orderId) {
                // Fetch regular task response
                axios
                    .get(`/task-response/${orderId}/desain_final`)
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
                                'Error fetching regular task response (desain_final):',
                                err,
                            );
                        }
                    });

                // Fetch marketing task response
                axios
                    .get(
                        `/task-response/${orderId}/desain_final?is_marketing=1`,
                    )
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
                                'Error fetching marketing task response (desain_final):',
                                err,
                            );
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

    const handleResponseFinal = (moodboard: Moodboard) => {
        if (
            window.confirm(
                `Response desain final untuk project "${moodboard.order.nama_project}"?`,
            )
        ) {
            setLoading(true);
            router.post(
                `/desain-final/response/${moodboard.id}`,
                {},
                {
                    onSuccess: () => {
                        setLoading(false);
                    },
                    onError: (errors: any) => {
                        console.error('Response error:', errors);
                        alert('Gagal response desain final');
                        setLoading(false);
                    },
                },
            );
        }
    };

    const handlePmResponseDesainFinal = (moodboardId: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin memberikan PM response untuk desain final ini?',
            )
        ) {
            router.post(
                `/pm-response/desain-final/${moodboardId}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handleUploadFinal = async () => {
        if (!selectedMoodboard || uploadFiles.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('moodboard_id', selectedMoodboard.id.toString());

        uploadFiles.forEach((file) => {
            formData.append('moodboard_final[]', file);
        });

        router.post('/desain-final/upload', formData as any, {
            onSuccess: () => {
                setUploadFiles([]);
                setShowUploadModal(false);
                setSelectedMoodboard(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                console.error('Upload error:', errors);
                alert('Gagal upload desain final');
                setLoading(false);
            },
        });
    };

    const handleAcceptDesain = (moodboard: Moodboard, file: MoodboardFile) => {
        if (
            window.confirm(
                `Pilih desain "${file.original_name}" sebagai desain final?`,
            )
        ) {
            setLoading(true);
            router.post(
                `/desain-final/accept/${moodboard.id}`,
                {
                    moodboard_file_id: file.id,
                },
                {
                    onSuccess: () => {
                        setLoading(false);
                    },
                    onError: (errors: any) => {
                        console.error('Accept error:', errors);
                        alert('Gagal accept desain: ' + JSON.stringify(errors));
                        setLoading(false);
                    },
                },
            );
        }
    };

    const handleRevise = async () => {
        if (!selectedMoodboard || !reviseNotes) return;

        setLoading(true);
        router.post(
            `/desain-final/revise/${selectedMoodboard.id}`,
            {
                notes: reviseNotes,
            },
            {
                onSuccess: () => {
                    setReviseNotes('');
                    setShowReviseModal(false);
                    setSelectedMoodboard(null);
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Revise error:', errors);
                    alert('Gagal minta revisi');
                    setLoading(false);
                },
            },
        );
    };

    const openUploadModal = (moodboard: Moodboard) => {
        setSelectedMoodboard(moodboard);
        setShowUploadModal(true);
    };

    const openReviseModal = (moodboard: Moodboard) => {
        setSelectedMoodboard(moodboard);
        setShowReviseModal(true);
    };

    const handleDeleteFile = (file: MoodboardFile) => {
        if (window.confirm(`Hapus file "${file.original_name}"?`)) {
            setLoading(true);
            router.delete(`/desain-final/file/${file.id}`, {
                onSuccess: () => {
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Delete error:', errors);
                    alert('Gagal hapus file: ' + JSON.stringify(errors));
                    setLoading(false);
                },
            });
        }
    };

    const openReplaceModal = (file: MoodboardFile) => {
        setSelectedFile(file);
        setShowReplaceModal(true);
    };

    const handleReplaceFile = async () => {
        if (!selectedFile || !replaceFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('new_file', replaceFile);

        router.post(
            `/desain-final/file/${selectedFile.id}/replace`,
            formData as any,
            {
                onSuccess: () => {
                    setReplaceFile(null);
                    setShowReplaceModal(false);
                    setSelectedFile(null);
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Replace error:', errors);
                    alert('Gagal ganti file');
                    setLoading(false);
                },
            },
        );
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

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
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
            <Head title="Desain Final Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="desain-final"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-md">
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Desain Final Management
                            </h1>
                            <p className="text-xs text-stone-600">
                                Upload dan kelola desain final untuk setiap
                                project
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
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
                            className="w-full rounded-lg border border-stone-200 py-2.5 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Moodboards Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredMoodboards.length === 0 ? (
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
                                    Tidak ada project yang siap untuk desain
                                    final
                                </p>
                            </div>
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

                            return (
                                <div
                                    key={moodboard.id}
                                    className="overflow-hidden rounded-xl border-2 border-stone-200 bg-white transition-all hover:border-indigo-300"
                                >
                                    <div className="p-4 sm:p-5">
                                        {/* Project Info */}
                                        <div className="mb-4 border-b border-stone-200 pb-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="mb-1 text-lg font-bold text-stone-900 sm:text-xl">
                                                        {
                                                            moodboard.order
                                                                ?.nama_project
                                                        }
                                                    </h3>
                                                    <p className="text-sm text-stone-600">
                                                        {
                                                            moodboard.order
                                                                ?.company_name
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-xs text-stone-500">
                                                        Customer:{' '}
                                                        {
                                                            moodboard.order
                                                                ?.customer_name
                                                        }
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {moodboard.moodboard_final && (
                                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-emerald-700">
                                                            ✓ Final Approved
                                                        </span>
                                                    )}
                                                    {moodboard.has_response_final && (
                                                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-violet-700">
                                                            ✓ Responded
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Deadline & Extend Button - REGULAR */}
                                            {!isKepalaMarketing && taskResponseRegular &&
                                                taskResponseRegular.status !==
                                                    'selesai' && (
                                                    <div className="mt-3">
                                                        <div
                                                            className={`rounded-lg border p-3 ${
                                                                daysLeftRegular !==
                                                                    null &&
                                                                daysLeftRegular <
                                                                    0
                                                                    ? 'border-red-200 bg-red-50'
                                                                    : daysLeftRegular !==
                                                                            null &&
                                                                        daysLeftRegular <=
                                                                            3
                                                                      ? 'border-orange-200 bg-orange-50'
                                                                      : 'border-yellow-200 bg-yellow-50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p
                                                                        className={`text-xs font-medium ${
                                                                            daysLeftRegular !==
                                                                                null &&
                                                                            daysLeftRegular <
                                                                                0
                                                                                ? 'text-red-800'
                                                                                : daysLeftRegular !==
                                                                                        null &&
                                                                                    daysLeftRegular <=
                                                                                        3
                                                                                  ? 'text-orange-800'
                                                                                  : 'text-yellow-800'
                                                                        }`}
                                                                    >
                                                                        {daysLeftRegular !==
                                                                            null &&
                                                                        daysLeftRegular <
                                                                            0
                                                                            ? '⚠️ Deadline Terlewat'
                                                                            : '⏰ Deadline Desain Final'}
                                                                    </p>
                                                                    <p
                                                                        className={`text-sm font-semibold ${
                                                                            daysLeftRegular !==
                                                                                null &&
                                                                            daysLeftRegular <
                                                                                0
                                                                                ? 'text-red-900'
                                                                                : daysLeftRegular !==
                                                                                        null &&
                                                                                    daysLeftRegular <=
                                                                                        3
                                                                                  ? 'text-orange-900'
                                                                                  : 'text-yellow-900'
                                                                        }`}
                                                                    >
                                                                        {formatDeadline(
                                                                            taskResponseRegular.deadline,
                                                                        )}
                                                                    </p>
                                                                    {daysLeftRegular !==
                                                                        null && (
                                                                        <p
                                                                            className={`mt-1 text-xs font-medium ${
                                                                                daysLeftRegular <
                                                                                0
                                                                                    ? 'text-red-700'
                                                                                    : daysLeftRegular <=
                                                                                        3
                                                                                      ? 'text-orange-700'
                                                                                      : 'text-yellow-700'
                                                                            }`}
                                                                        >
                                                                            {daysLeftRegular <
                                                                            0
                                                                                ? `Terlambat ${Math.abs(daysLeftRegular)} hari`
                                                                                : `${daysLeftRegular} hari lagi`}
                                                                        </p>
                                                                    )}
                                                                    {typeof taskResponseRegular.extend_time ===
                                                                        'number' &&
                                                                        taskResponseRegular.extend_time >
                                                                            0 && (
                                                                            <p className="mt-1 text-xs text-orange-600">
                                                                                Perpanjangan:{' '}
                                                                                {
                                                                                    taskResponseRegular.extend_time
                                                                                }
                                                                                x
                                                                            </p>
                                                                        )}
                                                                </div>
                                                                <button
                                                                    onClick={() =>
                                                                        orderId &&
                                                                        setShowExtendModal(
                                                                            {
                                                                                orderId,
                                                                                tahap: 'desain_final',
                                                                                isMarketing: false,
                                                                                taskResponse:
                                                                                    taskResponseRegular,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                                                >
                                                                    Minta
                                                                    Perpanjangan
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Deadline & Extend Button - MARKETING (Kepala Marketing only) */}
                                            {isKepalaMarketing &&
                                                taskResponseMarketing &&
                                                taskResponseMarketing.status !==
                                                    'selesai' && (
                                                    <div className="mt-3">
                                                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-xs font-medium text-purple-800">
                                                                        ⏰
                                                                        Deadline
                                                                        Desain
                                                                        Final
                                                                        (Marketing)
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-purple-900">
                                                                        {formatDeadline(
                                                                            taskResponseMarketing.deadline,
                                                                        )}
                                                                    </p>
                                                                    {daysLeftMarketing !==
                                                                        null && (
                                                                        <p className="mt-1 text-xs font-medium text-purple-700">
                                                                            {daysLeftMarketing <
                                                                            0
                                                                                ? `Terlambat ${Math.abs(daysLeftMarketing)} hari`
                                                                                : `${daysLeftMarketing} hari lagi`}
                                                                        </p>
                                                                    )}
                                                                    {typeof taskResponseMarketing.extend_time ===
                                                                        'number' &&
                                                                        taskResponseMarketing.extend_time >
                                                                            0 && (
                                                                            <p className="mt-1 text-xs text-purple-600">
                                                                                Perpanjangan:{' '}
                                                                                {
                                                                                    taskResponseMarketing.extend_time
                                                                                }
                                                                                x
                                                                            </p>
                                                                        )}
                                                                </div>
                                                                <button
                                                                    onClick={() =>
                                                                        orderId &&
                                                                        setShowExtendModal(
                                                                            {
                                                                                orderId,
                                                                                tahap: 'desain_final',
                                                                                isMarketing: true,
                                                                                taskResponse:
                                                                                    taskResponseMarketing,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="rounded-md bg-purple-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-600"
                                                                >
                                                                    Minta
                                                                    Perpanjangan
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Response Info */}
                                        {moodboard.has_response_final &&
                                            moodboard.response_final_by && (
                                                <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                                                    <p className="text-xs text-violet-700">
                                                        <span className="font-semibold">
                                                            Response oleh:
                                                        </span>{' '}
                                                        {
                                                            moodboard.response_final_by
                                                        }
                                                        {moodboard.response_final_time && (
                                                            <span className="ml-2">
                                                                (
                                                                {new Date(
                                                                    moodboard.response_final_time,
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    },
                                                                )}
                                                                )
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                        {/* Marketing Response Button - INDEPENDENT */}
                                        {isKepalaMarketing &&
                                            !moodboard.pm_response_final_time && (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() =>
                                                            handlePmResponseDesainFinal(
                                                                moodboard.id,
                                                            )
                                                        }
                                                        className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-purple-700"
                                                    >
                                                        Marketing Response
                                                    </button>
                                                </div>
                                            )}

                                        {/* PM Response Final Badge */}
                                        {moodboard.pm_response_final_time && (
                                            <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-2">
                                                <p className="text-xs font-semibold text-purple-900">
                                                    ✓ Marketing Response (Desain
                                                    Final)
                                                </p>
                                                <p className="text-xs text-purple-700">
                                                    By:{' '}
                                                    {
                                                        moodboard.pm_response_final_by
                                                    }
                                                </p>
                                                <p className="text-xs text-purple-700">
                                                    {new Date(
                                                        moodboard.pm_response_final_time,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {/* Show Response Button if not responded yet */}
                                        {isNotKepalaMarketing &&
                                            !moodboard.has_response_final &&
                                            !moodboard.moodboard_final && (
                                                <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-4 text-center">
                                                    <svg
                                                        className="mx-auto mb-2 h-10 w-10 text-violet-300"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                        />
                                                    </svg>
                                                    <p className="mb-1 text-sm font-medium text-violet-900">
                                                        Project siap untuk
                                                        desain final
                                                    </p>
                                                    <p className="mb-3 text-xs text-violet-700">
                                                        Klik tombol Response
                                                        untuk memulai proses
                                                        desain final
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            handleResponseFinal(
                                                                moodboard,
                                                            )
                                                        }
                                                        disabled={loading}
                                                        className="rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-violet-600 hover:to-violet-700 disabled:opacity-50"
                                                    >
                                                        Response
                                                    </button>
                                                </div>
                                            )}

                                        {/* Final Files List - Only show if responded */}
                                        {moodboard.has_response_final &&
                                            moodboard.final_files.length >
                                                0 && (
                                                <div className="mb-4">
                                                    <p className="mb-3 text-sm font-semibold text-stone-700">
                                                        File Desain Final (
                                                        {
                                                            moodboard
                                                                .final_files
                                                                .length
                                                        }
                                                        ):
                                                    </p>
                                                    <div className="space-y-2">
                                                        {moodboard.final_files.map(
                                                            (file, idx) => (
                                                                <div
                                                                    key={
                                                                        file.id
                                                                    }
                                                                    className="rounded-lg border border-stone-200 bg-stone-50 p-2.5"
                                                                >
                                                                    <div className="mb-2 flex items-center gap-2">
                                                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                                                                            <img
                                                                                src={
                                                                                    file.url
                                                                                }
                                                                                alt={
                                                                                    file.original_name
                                                                                }
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-xs font-medium text-stone-900">
                                                                                #
                                                                                {idx +
                                                                                    1}
                                                                                :{' '}
                                                                                {
                                                                                    file.original_name
                                                                                }
                                                                            </p>
                                                                            {moodboard.moodboard_final ===
                                                                                file.file_path && (
                                                                                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                                    <svg
                                                                                        className="h-3 w-3"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M5 13l4 4L19 7"
                                                                                        />
                                                                                    </svg>
                                                                                    Terpilih
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <a
                                                                            href={
                                                                                file.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex-1 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-xs font-medium text-blue-700 transition-all hover:bg-blue-100"
                                                                        >
                                                                            👁️
                                                                            Lihat
                                                                        </a>
                                                                        {!moodboard.moodboard_final && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleAcceptDesain(
                                                                                        moodboard,
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    loading
                                                                                }
                                                                                className="flex-1 rounded bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-1.5 text-xs font-medium text-white transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                                                                            >
                                                                                ✓
                                                                                Terima
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() =>
                                                                                openReplaceModal(
                                                                                    file,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                loading
                                                                            }
                                                                            className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
                                                                            title="Ganti file"
                                                                        >
                                                                            🔄
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteFile(
                                                                                    file,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                loading
                                                                            }
                                                                            className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 transition-all hover:bg-red-100 disabled:opacity-50"
                                                                            title="Hapus file"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {/* Notes if any */}
                                        {moodboard.revisi_final && (
                                            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                                                <p className="mb-1 text-xs font-semibold text-orange-900">
                                                    Catatan Revisi:
                                                </p>
                                                <p className="text-xs text-orange-700">
                                                    {moodboard.revisi_final}
                                                </p>
                                            </div>
                                        )}

                                        {/* Info jika sudah response tapi belum ada file */}
                                        {moodboard.has_response_final &&
                                            moodboard.final_files.length ===
                                                0 &&
                                            !moodboard.moodboard_final && (
                                                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                                                    <svg
                                                        className="mx-auto mb-2 h-10 w-10 text-blue-300"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                        />
                                                    </svg>
                                                    <p className="mb-1 text-sm font-medium text-blue-900">
                                                        Belum ada file desain
                                                        final
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        Upload file desain final
                                                        untuk project ini
                                                    </p>
                                                </div>
                                            )}

                                        {/* Info setelah upload, sebelum approve */}
                                        {moodboard.has_response_final &&
                                            moodboard.final_files.length > 0 &&
                                            !moodboard.moodboard_final && (
                                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                    <p className="mb-1 text-xs font-semibold text-amber-900">
                                                        ⏳ Menunggu Approval
                                                    </p>
                                                    <p className="text-xs text-amber-700">
                                                        Pilih salah satu file di
                                                        atas dengan klik tombol
                                                        "✓ Terima" untuk
                                                        menyetujui desain final
                                                    </p>
                                                </div>
                                            )}

                                        {/* Action Buttons */}
                                        {moodboard.has_response_final && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        openUploadModal(
                                                            moodboard,
                                                        )
                                                    }
                                                    disabled={loading}
                                                    className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
                                                >
                                                    {moodboard.final_files
                                                        .length > 0
                                                        ? `+ Tambah File (${moodboard.final_files.length})`
                                                        : 'Upload Desain Final'}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openReviseModal(
                                                            moodboard,
                                                        )
                                                    }
                                                    disabled={loading}
                                                    className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                                                >
                                                    🔄 Revisi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && selectedMoodboard && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-4 sm:px-6 sm:py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
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
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white sm:text-lg">
                                            Upload Desain Final
                                        </h2>
                                        <p className="mt-0.5 text-xs text-indigo-100">
                                            {
                                                selectedMoodboard.order
                                                    .nama_project
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFiles([]);
                                    }}
                                    className="p-1 text-white/80 transition-colors hover:text-white"
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

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUploadFinal();
                                }}
                                className="space-y-4 p-4 sm:p-6"
                            >
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-stone-700 sm:text-sm">
                                        File Desain Final
                                    </label>
                                    <div className="relative rounded-lg border-2 border-dashed border-indigo-300 p-4 text-center transition-colors hover:border-indigo-400 sm:p-6">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            multiple
                                            onChange={(e) =>
                                                setUploadFiles(
                                                    e.target.files
                                                        ? Array.from(
                                                              e.target.files,
                                                          )
                                                        : [],
                                                )
                                            }
                                            className="hidden"
                                            id="final-upload"
                                            required
                                        />
                                        <label
                                            htmlFor="final-upload"
                                            className="cursor-pointer"
                                        >
                                            {uploadFiles.length > 0 ? (
                                                <div className="space-y-2">
                                                    <svg
                                                        className="mx-auto mb-2 h-8 w-8 text-emerald-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <p className="text-xs font-medium text-emerald-700 sm:text-sm">
                                                        {uploadFiles.length}{' '}
                                                        file dipilih
                                                    </p>
                                                    <div className="max-h-32 overflow-y-auto">
                                                        {uploadFiles.map(
                                                            (file, idx) => (
                                                                <p
                                                                    key={idx}
                                                                    className="truncate text-xs text-stone-600"
                                                                >
                                                                    {idx + 1}.{' '}
                                                                    {file.name}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg
                                                        className="mx-auto mb-2 h-8 w-8 text-indigo-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5"
                                                        />
                                                    </svg>
                                                    <p className="text-xs font-medium text-stone-900 sm:text-sm">
                                                        Drag & drop atau klik
                                                        untuk upload
                                                    </p>
                                                    <p className="mt-1 text-xs text-stone-500">
                                                        JPG, PNG, PDF (Max 10MB)
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setUploadFiles([]);
                                        }}
                                        className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            loading || uploadFiles.length === 0
                                        }
                                        className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                    >
                                        {loading ? 'Memproses...' : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Revise Modal */}
                {showReviseModal && selectedMoodboard && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 sm:px-6 sm:py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
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
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white sm:text-lg">
                                            Minta Revisi
                                        </h2>
                                        <p className="mt-0.5 text-xs text-orange-100">
                                            {
                                                selectedMoodboard.order
                                                    .nama_project
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowReviseModal(false);
                                        setReviseNotes('');
                                    }}
                                    className="p-1 text-white/80 transition-colors hover:text-white"
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

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleRevise();
                                }}
                                className="space-y-4 p-4 sm:p-6"
                            >
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-stone-700 sm:text-sm">
                                        Catatan Revisi
                                    </label>
                                    <textarea
                                        value={reviseNotes}
                                        onChange={(e) =>
                                            setReviseNotes(e.target.value)
                                        }
                                        placeholder="Jelaskan bagian mana yang perlu direvisi..."
                                        required
                                        className="h-24 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-xs focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none sm:h-28 sm:px-4 sm:py-3 sm:text-sm"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReviseModal(false);
                                            setReviseNotes('');
                                        }}
                                        className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !reviseNotes}
                                        className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                    >
                                        {loading
                                            ? 'Memproses...'
                                            : 'Kirim Revisi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Replace File Modal */}
                {showReplaceModal && selectedFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-4 sm:px-6 sm:py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
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
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-white sm:text-lg">
                                            Ganti File
                                        </h2>
                                        <p className="mt-0.5 text-xs text-amber-100">
                                            {selectedFile.original_name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowReplaceModal(false);
                                        setReplaceFile(null);
                                        setSelectedFile(null);
                                    }}
                                    className="p-1 text-white/80 transition-colors hover:text-white"
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

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleReplaceFile();
                                }}
                                className="space-y-4 p-4 sm:p-6"
                            >
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-stone-700 sm:text-sm">
                                        File Pengganti
                                    </label>
                                    <div className="relative rounded-lg border-2 border-dashed border-amber-300 p-4 text-center transition-colors hover:border-amber-400 sm:p-6">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) =>
                                                setReplaceFile(
                                                    e.target.files?.[0] || null,
                                                )
                                            }
                                            className="hidden"
                                            id="replace-file-input"
                                            required
                                        />
                                        <label
                                            htmlFor="replace-file-input"
                                            className="block cursor-pointer"
                                        >
                                            {replaceFile ? (
                                                <div className="text-center">
                                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                                                        <svg
                                                            className="h-6 w-6 text-emerald-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <p className="mb-0.5 text-xs font-medium text-stone-900">
                                                        {replaceFile.name}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {(
                                                            replaceFile.size /
                                                            1024 /
                                                            1024
                                                        ).toFixed(2)}{' '}
                                                        MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                                                        <svg
                                                            className="h-6 w-6 text-amber-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <p className="mb-1 text-xs font-semibold text-stone-900">
                                                        Klik untuk pilih file
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        JPG, PNG, atau PDF (Max
                                                        10MB)
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReplaceModal(false);
                                            setReplaceFile(null);
                                            setSelectedFile(null);
                                        }}
                                        className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !replaceFile}
                                        className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                    >
                                        {loading
                                            ? 'Memproses...'
                                            : 'Ganti File'}
                                    </button>
                                </div>
                            </form>
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
