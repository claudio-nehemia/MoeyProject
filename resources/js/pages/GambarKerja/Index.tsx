import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface GambarKerjaFile {
    id: number;
    original_name: string;
    url: string;
}

interface GambarKerja {
    id: number;
    status: 'pending' | 'uploaded' | 'approved';
    response_time: string | null;
    response_by: string | null;
    pm_response_time: string | null;
    pm_response_by: string | null;
    revisi_notes: string | null;
    approved_time: string | null;
    approved_by: string | null;
    files: GambarKerjaFile[];
    order: Order;
}

interface Props {
    items: GambarKerja[];
}

/* ================= COMPONENT ================= */

export default function GambarKerjaIndex({ items }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [selectedItem, setSelectedItem] = useState<GambarKerja | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [reviseNotes, setReviseNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<
        Record<number, { regular?: any; marketing?: any }>
    >({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        isMarketing: boolean;
        taskResponse: any;
    } | null>(null);

    const { auth } = usePage<{
        auth: { user: { isKepalaMarketing: boolean } };
    }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    useEffect(() => {
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dual task responses (regular & marketing)
    useEffect(() => {
        items.forEach((item) => {
            const orderId = item.order?.id;
            if (orderId) {
                // Regular
                axios
                    .get(`/task-response/${orderId}/gambar_kerja`)
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
                                'Error fetching regular task response (gambar_kerja):',
                                err,
                            );
                        }
                    });
                // Marketing
                axios
                    .get(
                        `/task-response/${orderId}/gambar_kerja?is_marketing=1`,
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
                                'Error fetching marketing task response (gambar_kerja):',
                                err,
                            );
                        }
                    });
            }
        });
    }, [items]);

    /* ================= FILTER ================= */

    const filteredItems = items.filter((item) => {
        const search = searchQuery.toLowerCase();
        return (
            item.order.nama_project.toLowerCase().includes(search) ||
            item.order.customer_name.toLowerCase().includes(search) ||
            item.order.company_name.toLowerCase().includes(search)
        );
    });

    /* ================= ACTIONS ================= */

    const handleResponse = (item: GambarKerja) => {
        if (
            window.confirm(
                `Response gambar kerja untuk project "${item.order.nama_project}"?`,
            )
        ) {
            setLoading(true);
            router.post(
                `/gambar-kerja/response/${item.id}`,
                {},
                {
                    onFinish: () => setLoading(false),
                },
            );
        }
    };

    const handlePmResponse = (gambarKerjaId: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin memberikan Marketing response untuk gambar kerja ini?',
            )
        ) {
            router.post(
                `/pm-response/gambar-kerja/${gambarKerjaId}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handleUpload = () => {
        if (!selectedItem || uploadFiles.length === 0) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('gambar_kerja_id', selectedItem.id.toString());
        uploadFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        router.post('/gambar-kerja/upload', formData as any, {
            onSuccess: () => {
                setUploadFiles([]);
                setShowUploadModal(false);
                setSelectedItem(null);
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleApprove = (item: GambarKerja) => {
        if (
            window.confirm(
                `Approve semua gambar kerja untuk project "${item.order.nama_project}"?`,
            )
        ) {
            setLoading(true);
            router.post(
                `/gambar-kerja/approve/${item.id}`,
                {},
                {
                    onFinish: () => setLoading(false),
                },
            );
        }
    };

    const handleRevise = () => {
        if (!selectedItem || !reviseNotes) return;

        setLoading(true);
        router.post(
            `/gambar-kerja/revisi/${selectedItem.id}`,
            {
                notes: reviseNotes,
            },
            {
                onSuccess: () => {
                    setShowReviseModal(false);
                    setSelectedItem(null);
                    setReviseNotes('');
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleDeleteFile = (fileId: number) => {
        if (window.confirm('Hapus file ini?')) {
            setLoading(true);
            router.delete(`/gambar-kerja/file/${fileId}`, {
                onFinish: () => setLoading(false),
            });
        }
    };

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

    /* ================= RENDER ================= */

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Gambar Kerja Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="gambar-kerja"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* ================= HEADER ================= */}
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
                                Gambar Kerja Management
                            </h1>
                            <p className="text-xs text-stone-600">
                                Upload dan kelola gambar kerja setiap project
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= SEARCH ================= */}
                <div className="mb-4">
                    <div className="relative">
                        <svg
                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
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
                            className="w-full rounded-lg border border-stone-200 py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* ================= LIST ================= */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.map((item) => {
                        const orderId = item.order.id;
                        const taskResponse = taskResponses[orderId]?.regular;
                        const marketingTaskResponse =
                            taskResponses[orderId]?.marketing;

                        return (
                            <div
                                key={item.id}
                                className="overflow-hidden rounded-xl border-2 border-stone-200 bg-white transition-all hover:border-indigo-300"
                            >
                                <div className="p-4 sm:p-5">
                                    {/* INFO */}
                                    <div className="mb-4 border-b border-stone-200 pb-4">
                                        <h3 className="text-lg font-bold text-stone-900 sm:text-xl">
                                            {item.order.nama_project}
                                        </h3>
                                        <p className="text-sm text-stone-600">
                                            {item.order.company_name}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            Customer: {item.order.customer_name}
                                        </p>

                                        <div className="mt-2 flex gap-2">
                                            {item.status === 'approved' && (
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    ✓ Approved
                                                </span>
                                            )}
                                            {item.response_time && (
                                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                                                    ✓ Responded
                                                </span>
                                            )}
                                        </div>

                                        {/* Response Details */}
                                        {item.response_time && (
                                            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <p className="mb-0.5 text-xs font-medium text-violet-800">
                                                            Response By
                                                        </p>
                                                        <p className="text-sm font-semibold text-violet-900">
                                                            {item.response_by ||
                                                                '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="mb-0.5 text-xs font-medium text-violet-800">
                                                            Response Time
                                                        </p>
                                                        <p className="text-sm font-semibold text-violet-900">
                                                            {new Date(
                                                                item.response_time,
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
                                                </div>
                                            </div>
                                        )}

                                        {/* Deadline & Minta Perpanjangan - REGULAR */}
                                        {!isKepalaMarketing && taskResponse &&
                                            taskResponse.status !==
                                                'selesai' && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-yellow-800">
                                                                Deadline Gambar
                                                                Kerja
                                                            </p>
                                                            <p className="text-sm font-semibold text-yellow-900">
                                                                {formatDeadline(
                                                                    taskResponse.deadline,
                                                                )}
                                                            </p>
                                                            {taskResponse.extend_time >
                                                                0 && (
                                                                <p className="mt-1 text-xs text-orange-600">
                                                                    Perpanjangan:{' '}
                                                                    {
                                                                        taskResponse.extend_time
                                                                    }
                                                                    x
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                setShowExtendModal(
                                                                    {
                                                                        orderId,
                                                                        tahap: 'gambar_kerja',
                                                                        isMarketing: false,
                                                                        taskResponse,
                                                                    },
                                                                )
                                                            }
                                                            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        {/* Deadline & Minta Perpanjangan - MARKETING (Kepala Marketing only) */}
                                        {isKepalaMarketing &&
                                            marketingTaskResponse &&
                                            marketingTaskResponse.status !==
                                                'selesai' && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-purple-800">
                                                                Deadline Gambar
                                                                Kerja
                                                                (Marketing)
                                                            </p>
                                                            <p className="text-sm font-semibold text-purple-900">
                                                                {formatDeadline(
                                                                    marketingTaskResponse.deadline,
                                                                )}
                                                            </p>
                                                            {marketingTaskResponse.extend_time >
                                                                0 && (
                                                                <p className="mt-1 text-xs text-purple-600">
                                                                    Perpanjangan:{' '}
                                                                    {
                                                                        marketingTaskResponse.extend_time
                                                                    }
                                                                    x
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                setShowExtendModal(
                                                                    {
                                                                        orderId,
                                                                        tahap: 'gambar_kerja',
                                                                        isMarketing: true,
                                                                        taskResponse:
                                                                            marketingTaskResponse,
                                                                    },
                                                                )
                                                            }
                                                            className="rounded-md bg-purple-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-600"
                                                        >
                                                            Minta Perpanjangan
                                                            (Marketing)
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>

                                    {/* RESPONSE */}
                                    {isNotKepalaMarketing &&
                                        !item.response_time && (
                                            <div className="mb-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        handleResponse(item)
                                                    }
                                                    disabled={loading}
                                                    className="rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white"
                                                >
                                                    Response
                                                </button>
                                            </div>
                                        )}

                                    {/* Marketing Response Button - INDEPENDENT */}
                                    {isKepalaMarketing &&
                                        !item.pm_response_time && (
                                            <div className="mb-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        handlePmResponse(
                                                            item.id,
                                                        )
                                                    }
                                                    className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-purple-700"
                                                >
                                                    Marketing Response
                                                </button>
                                            </div>
                                        )}

                                    {/* PM Response Badge */}
                                    {item.pm_response_time && (
                                        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
                                            <p className="text-sm font-semibold text-purple-900">
                                                ✓ Marketing Response
                                            </p>
                                            <p className="text-xs text-purple-700">
                                                By: {item.pm_response_by}
                                            </p>
                                            <p className="text-xs text-purple-700">
                                                {new Date(
                                                    item.pm_response_time,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    {/* FILES */}
                                    {item.files.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                            {item.files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center gap-2 rounded-lg border bg-stone-50 p-2.5"
                                                >
                                                    <img
                                                        src={file.url}
                                                        className="h-12 w-12 rounded object-cover"
                                                    />
                                                    <div className="flex-1 truncate text-xs">
                                                        {file.original_name}
                                                    </div>
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        className="text-xs text-blue-600"
                                                    >
                                                        👁️ Lihat
                                                    </a>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteFile(
                                                                file.id,
                                                            )
                                                        }
                                                        className="text-xs text-red-600"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* REVISI */}
                                    {item.revisi_notes && (
                                        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                                            <p className="mb-1 text-xs font-semibold text-orange-900">
                                                Catatan Revisi
                                            </p>
                                            <p className="text-xs text-orange-700">
                                                {item.revisi_notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* ACTION */}
                                    {item.response_time && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowUploadModal(true);
                                                }}
                                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
                                            >
                                                Upload
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowReviseModal(true);
                                                }}
                                                className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white"
                                            >
                                                Revisi
                                            </button>

                                            {item.files.length > 0 &&
                                                item.status !== 'approved' && (
                                                    <button
                                                        onClick={() =>
                                                            handleApprove(item)
                                                        }
                                                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ================= UPLOAD MODAL ================= */}
                {showUploadModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h2 className="mb-3 text-lg font-bold">
                                Upload Gambar Kerja
                            </h2>
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) =>
                                    setUploadFiles(
                                        e.target.files
                                            ? Array.from(e.target.files)
                                            : [],
                                    )
                                }
                            />
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 rounded border py-2"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={
                                        loading || uploadFiles.length === 0
                                    }
                                    className="flex-1 rounded bg-indigo-600 py-2 text-white"
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= REVISE MODAL ================= */}
                {showReviseModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h2 className="mb-3 text-lg font-bold">
                                Catatan Revisi
                            </h2>
                            <textarea
                                value={reviseNotes}
                                onChange={(e) => setReviseNotes(e.target.value)}
                                className="h-24 w-full rounded border p-2"
                            />
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setShowReviseModal(false)}
                                    className="flex-1 rounded border py-2"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleRevise}
                                    disabled={loading || !reviseNotes}
                                    className="flex-1 rounded bg-orange-600 py-2 text-white"
                                >
                                    Kirim Revisi
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
            </main>
        </div>
    );
}
