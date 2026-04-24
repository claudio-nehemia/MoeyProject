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
    update_data_time?: string | null;
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
    const [statusFilter, setStatusFilter] = useState('semua');
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
        // Status filter logic
        let meetsStatus = true;
        if (statusFilter === 'pending_response') {
            meetsStatus = !moodboard.has_response_final;
        } else if (statusFilter === 'in_progress') {
            meetsStatus = moodboard.has_response_final && !moodboard.moodboard_final;
        } else if (statusFilter === 'completed') {
            meetsStatus = !!moodboard.moodboard_final;
        }

        if (!meetsStatus) return false;

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

            <main className="w-full overflow-y-auto px-2 pt-20 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
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

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
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
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[180px]"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="pending_response">Belum Response</option>
                            <option value="in_progress">Dalam Proses</option>
                            <option value="completed">Selesai (Approved)</option>
                        </select>
                    </div>
                </div>

                {/* Moodboards Grid */}
                        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                            <table className="w-full whitespace-nowrap text-left text-sm">
                                <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Project / Client Info</th>
                                        <th className="px-5 py-4">Deadline Info</th>
                                        <th className="px-5 py-4">Final Files</th>
                                        <th className="px-5 py-4">Status & Notes</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredMoodboards.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-500">
                                                Tidak ada project yang siap untuk desain final
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

                                            return (
                                                <tr key={moodboard.id} className="transition-colors hover:bg-slate-50/50">
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="font-bold text-slate-900">{moodboard.order?.nama_project}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{moodboard.order?.company_name || '-'}</div>
                                                        <div className="mt-0.5 text-[11px] font-bold text-slate-400">Customer: {moodboard.order?.customer_name}</div>
                                                        <div className="mt-2 flex flex-col items-start gap-1">
                                                            {moodboard.moodboard_final && (
                                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-emerald-700 border border-emerald-200">
                                                                    ✓ Final Approved
                                                                </span>
                                                            )}
                                                            {moodboard.has_response_final && (
                                                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-violet-700 border border-violet-200">
                                                                    ✓ Responded
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="flex max-w-[240px] flex-col gap-2">
                                                            {!isKepalaMarketing && taskResponseRegular && 
                                                             taskResponseRegular.status !== 'selesai' && 
                                                             taskResponseRegular.status !== 'telat_submit' && 
                                                             !taskResponseRegular.update_data_time && (
                                                                <div className={`rounded-lg p-2.5 border ${daysLeftRegular !== null && daysLeftRegular < 0 ? 'bg-red-50 border-red-200 text-red-700' : daysLeftRegular !== null && daysLeftRegular <= 3 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                                                                        {daysLeftRegular !== null && daysLeftRegular < 0 ? '⚠️ Terlewat' : '⏰ Deadline DF'}
                                                                    </div>
                                                                    <div className="mt-0.5 text-xs font-medium">{formatDeadline(taskResponseRegular.deadline)}</div>
                                                                    {daysLeftRegular !== null && (
                                                                        <div className="mt-1 text-[10px] font-medium">{daysLeftRegular < 0 ? `Terlambat ${Math.abs(daysLeftRegular)} hari` : `${daysLeftRegular} hari lagi`}</div>
                                                                    )}
                                                                    <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
                                                                        {typeof taskResponseRegular.extend_time === 'number' && taskResponseRegular.extend_time > 0 ? (
                                                                            <span className="text-[9px] font-bold opacity-80">Ext: {taskResponseRegular.extend_time}x</span>
                                                                        ) : <span />}
                                                                        <button onClick={() => setShowExtendModal({orderId: orderId!, tahap: 'desain_final', isMarketing: false, taskResponse: taskResponseRegular})} className={`rounded px-2 py-1 text-[9px] font-bold text-white transition-colors ${daysLeftRegular !== null && daysLeftRegular < 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>Perpanjangan</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isKepalaMarketing && taskResponseMarketing && 
                                                             taskResponseMarketing.status !== 'selesai' && 
                                                             taskResponseMarketing.status !== 'telat_submit' && 
                                                             !taskResponseMarketing.update_data_time && (
                                                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-purple-700">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">⏰ Deadline DF(Mkt)</div>
                                                                    <div className="mt-0.5 text-xs font-medium">{formatDeadline(taskResponseMarketing.deadline)}</div>
                                                                    {daysLeftMarketing !== null && (
                                                                        <div className="mt-1 text-[10px] font-medium">{daysLeftMarketing < 0 ? `Terlambat ${Math.abs(daysLeftMarketing)} hari` : `${daysLeftMarketing} hari lagi`}</div>
                                                                    )}
                                                                    <div className="mt-2 flex items-center justify-between border-t border-purple-200 pt-2">
                                                                        {typeof taskResponseMarketing.extend_time === 'number' && taskResponseMarketing.extend_time > 0 ? (
                                                                            <span className="text-[9px] font-bold opacity-80">Ext: {taskResponseMarketing.extend_time}x</span>
                                                                        ) : <span />}
                                                                        <button onClick={() => setShowExtendModal({orderId: orderId!, tahap: 'desain_final', isMarketing: true, taskResponse: taskResponseMarketing})} className="rounded bg-purple-600 px-2 py-1 text-[9px] font-bold text-white transition-colors hover:bg-purple-700">Perpanjangan</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        {moodboard.has_response_final && moodboard.final_files.length > 0 ? (
                                                            <div className="space-y-2 max-w-[300px]">
                                                                {moodboard.final_files.map((file, idx) => (
                                                                    <div key={file.id} className="rounded-lg border border-stone-200 bg-stone-50 p-2 flex flex-col gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                                                                                <img src={file.url} alt={file.original_name} className="h-full w-full object-cover" />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="truncate text-[10px] font-medium text-stone-900">#{idx + 1}: {file.original_name}</p>
                                                                                {moodboard.moodboard_final === file.file_path && (
                                                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">Terpilih</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded border border-blue-200 bg-blue-50 px-1 py-1 text-center text-[10px] font-medium text-blue-700 hover:bg-blue-100" title="Lihat">👁️ Lihat</a>
                                                                            {!moodboard.moodboard_final && (
                                                                                <button onClick={() => handleAcceptDesain(moodboard, file)} disabled={loading} className="flex-1 rounded bg-gradient-to-r from-emerald-500 to-emerald-600 px-1 py-1 text-[10px] font-medium text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50" title="Terima">✓ Terima</button>
                                                                            )}
                                                                            <button onClick={() => openReplaceModal(file)} disabled={loading} className="rounded border border-amber-200 bg-amber-50 px-1.5 py-1 text-[10px] text-amber-700 hover:bg-amber-100 disabled:opacity-50" title="Ganti">🔄</button>
                                                                            <button onClick={() => handleDeleteFile(file)} disabled={loading} className="rounded border border-red-200 bg-red-50 px-1.5 py-1 text-[10px] text-red-700 hover:bg-red-100 disabled:opacity-50" title="Hapus">🗑️</button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : moodboard.has_response_final ? (
                                                            <span className="text-[11px] italic text-slate-400">Belum ada file final</span>
                                                        ) : (
                                                            <span className="text-[11px] italic text-slate-400">Menunggu respons</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-1.5">
                                                            {moodboard.has_response_final && moodboard.response_final_by && (
                                                                <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-violet-200 bg-violet-50 px-2 py-1.5 text-[10px] text-violet-700">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500">ResBy</span>
                                                                    <div className="font-semibold">{moodboard.response_final_by}</div>
                                                                    {moodboard.response_final_time && (
                                                                        <div className="text-violet-500">{new Date(moodboard.response_final_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {moodboard.pm_response_final_time && (
                                                                <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-purple-200 bg-purple-50 px-2 py-1.5 text-[10px] text-purple-700 mt-1">
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500">PM ResBy</span>
                                                                    <div className="font-semibold">{moodboard.pm_response_final_by}</div>
                                                                    <div className="text-purple-500">{new Date(moodboard.pm_response_final_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                                </div>
                                                            )}
                                                            {moodboard.revisi_final && (
                                                                <div className="mt-2 rounded border border-orange-200 bg-orange-50 p-2 max-w-[200px] whitespace-normal w-full overflow-hidden">
                                                                    <p className="text-[9px] font-bold text-orange-900 mb-0.5">Catatan Revisi:</p>
                                                                    <p className="text-[10px] text-orange-700 whitespace-pre-wrap break-words">{moodboard.revisi_final}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 align-top text-right">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            {isKepalaMarketing && !moodboard.pm_response_final_time && (
                                                                <button onClick={() => handlePmResponseDesainFinal(moodboard.id)} className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-purple-700 text-center mb-1">
                                                                    Marketing Response
                                                                </button>
                                                            )}
                                                            
                                                            {isNotKepalaMarketing && !moodboard.has_response_final && !moodboard.moodboard_final && (
                                                                <button onClick={() => handleResponseFinal(moodboard)} disabled={loading} className="w-full rounded-md bg-violet-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 text-center">
                                                                    Response Desain
                                                                </button>
                                                            )}
                                                            
                                                            {moodboard.has_response_final && (
                                                                <>
                                                                    <button onClick={() => openUploadModal(moodboard)} disabled={loading} className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 text-center">
                                                                        {moodboard.final_files.length > 0 ? `+ Tambah File` : 'Upload Desain'}
                                                                    </button>
                                                                    <button onClick={() => openReviseModal(moodboard)} disabled={loading} className="w-full rounded-md bg-orange-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50 text-center mt-1">
                                                                        🔄 Revisi
                                                                    </button>
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
                                                selectedMoodboard?.order
                                                    ?.nama_project
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
                                                selectedMoodboard?.order
                                                    ?.nama_project
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
                                            {selectedFile?.original_name}
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
                                                        {replaceFile?.name}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {(
                                                            (replaceFile?.size || 0) /
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
                        orderId={showExtendModal?.orderId as number}
                        tahap={showExtendModal?.tahap as 'cm_fee' | 'desain_final'}
                        taskResponse={showExtendModal?.taskResponse as any}
                        isMarketing={showExtendModal?.isMarketing as boolean}
                        onClose={() => setShowExtendModal(null)}
                    />
                )}
            </main>
        </div>
    );
}
