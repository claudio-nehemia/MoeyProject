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
    const [statusFilter, setStatusFilter] = useState('semua');
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
        // Status filter
        if (statusFilter !== 'semua' && item.status !== statusFilter) {
            return false;
        }

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

            <main className="w-full overflow-y-auto px-2 pt-20 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
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

                {/* ================= FILTERS ================= */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
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
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[150px]"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="uploaded">Uploaded / Responded</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                </div>

                {/* ================= LIST ================= */}
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Project / Client Info</th>
                                <th className="px-5 py-4">Progress & Files</th>
                                <th className="px-5 py-4">Deadline Info</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-stone-500">
                                        Tidak ada gambar kerja ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const orderId = item.order.id;
                                    const taskResponse = taskResponses[orderId]?.regular;
                                    const marketingTaskResponse = taskResponses[orderId]?.marketing;

                                    return (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                                            {/* Project Info */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                                    {item.order.nama_project}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                                    <span className="truncate max-w-[150px] font-medium text-slate-700">{item.order.company_name}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[150px]">{item.order.customer_name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {item.status === 'approved' && (
                                                        <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-widest">
                                                            ✓ Approved
                                                        </span>
                                                    )}
                                                    {item.response_time && (
                                                        <span className="inline-flex rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 uppercase tracking-widest">
                                                            ✓ Responded
                                                        </span>
                                                    )}
                                                    {item.pm_response_time && (
                                                        <span className="inline-flex rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 uppercase tracking-widest">
                                                            ✓ Marketing Responded
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Progress & Files */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {item.response_time && (
                                                        <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-violet-200 bg-violet-50 px-2 py-1.5 text-[10px] text-violet-700 w-full mb-1">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500">Response By: {item.response_by || '-'}</span>
                                                            <div className="text-violet-500">
                                                                {new Date(item.response_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.pm_response_time && (
                                                        <div className="inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-purple-200 bg-purple-50 px-2 py-1.5 text-[10px] text-purple-700 w-full mb-1">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500">PM ResBy: {item.pm_response_by || '-'}</span>
                                                            <div className="text-purple-500">
                                                                {new Date(item.pm_response_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.revisi_notes && (
                                                        <div className="mt-1 rounded-md border border-orange-200 bg-orange-50 p-2 max-w-[220px]">
                                                            <p className="mb-0.5 text-[9px] font-bold text-orange-800 uppercase">Catatan Revisi</p>
                                                            <p className="text-[10px] text-orange-900 whitespace-pre-wrap">{item.revisi_notes}</p>
                                                        </div>
                                                    )}
                                                    {item.files.length > 0 && (
                                                        <div className="mt-2 space-y-1.5 max-w-[220px]">
                                                            {item.files.map((file) => (
                                                                <div key={file.id} className="flex items-center justify-between rounded border border-stone-200 bg-stone-50 p-1.5 hover:bg-stone-100 transition">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                                                                            <img src={file.url} alt={file.original_name} className="h-full w-full object-cover" />
                                                                        </div>
                                                                        <span className="truncate text-[10px] text-stone-700">{file.original_name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 font-medium text-blue-600 hover:bg-blue-100 transition" title="Lihat">👁️</a>
                                                                        <button onClick={() => handleDeleteFile(file.id)} className="rounded p-1 text-red-600 hover:bg-red-100 transition" title="Hapus">🗑️</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Deadline */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {!isKepalaMarketing && taskResponse && taskResponse.status !== 'selesai' && taskResponse.status !== 'telat_submit' && !taskResponse.update_data_time && (
                                                        <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 w-full">
                                                            <p className="text-[10px] font-bold text-yellow-800">Deadline Gambar Kerja</p>
                                                            <p className="text-[11px] font-semibold text-yellow-900">{formatDeadline(taskResponse.deadline)}</p>
                                                            {taskResponse.extend_time > 0 && (
                                                                <p className="bg-yellow-200 px-1 py-0.5 rounded text-[9px] font-bold text-yellow-800">Ext: {taskResponse.extend_time}x</p>
                                                            )}
                                                            <button 
                                                                onClick={() => setShowExtendModal({ orderId, tahap: 'gambar_kerja', isMarketing: false, taskResponse })}
                                                                className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-orange-600 w-full text-center hover:shadow-sm"
                                                            >Minta Extend</button>
                                                        </div>
                                                    )}

                                                    {isKepalaMarketing && marketingTaskResponse && marketingTaskResponse.status !== 'selesai' && marketingTaskResponse.status !== 'telat_submit' && !marketingTaskResponse.update_data_time && (
                                                        <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5 w-full mt-1">
                                                            <p className="text-[10px] font-bold text-purple-800">Deadline (Marketing)</p>
                                                            <p className="text-[11px] font-semibold text-purple-900">{formatDeadline(marketingTaskResponse.deadline)}</p>
                                                            {marketingTaskResponse.extend_time > 0 && (
                                                                <p className="bg-purple-200 px-1 py-0.5 rounded text-[9px] font-bold text-purple-800">Ext: {marketingTaskResponse.extend_time}x</p>
                                                            )}
                                                            <button 
                                                                onClick={() => setShowExtendModal({ orderId, tahap: 'gambar_kerja', isMarketing: true, taskResponse: marketingTaskResponse })}
                                                                className="mt-1 w-full rounded bg-purple-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-purple-700 w-full text-center hover:shadow-sm"
                                                            >Minta Extend</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {isKepalaMarketing && !item.pm_response_time && (
                                                        <button
                                                            onClick={() => handlePmResponse(item.id)}
                                                            className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-purple-700 text-center"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                    {isNotKepalaMarketing && !item.response_time && (
                                                        <button
                                                            onClick={() => handleResponse(item)}
                                                            disabled={loading}
                                                            className="w-full rounded-md bg-violet-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-violet-700 text-center disabled:opacity-50"
                                                        >
                                                            ✓ Response
                                                        </button>
                                                    )}

                                                    {item.response_time && (
                                                        <>
                                                            <button
                                                                onClick={() => { setSelectedItem(item); setShowUploadModal(true); }}
                                                                className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 text-center"
                                                            >
                                                                ⬆️ Upload
                                                            </button>

                                                            <button
                                                                onClick={() => { setSelectedItem(item); setShowReviseModal(true); }}
                                                                className="w-full rounded-md bg-orange-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-orange-700 text-center mt-1"
                                                            >
                                                                ✏️ Revisi
                                                            </button>

                                                            {item.files.length > 0 && item.status !== 'approved' && (
                                                                <button
                                                                    onClick={() => handleApprove(item)}
                                                                    disabled={loading}
                                                                    className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-emerald-700 text-center mt-1 disabled:opacity-50"
                                                                >
                                                                    ✓ Approve
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
