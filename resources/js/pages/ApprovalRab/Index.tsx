import { useEffect, useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import WorkStatusTabs from '@/components/WorkStatusTabs';
import axios from 'axios';
import {
    Upload,
    FileText,
    Check,
    Download,
    Trash2,
    Eye,
    X,
    FileIcon,
    Archive,
    AlertCircle,
    Calendar,
    Clock,
} from 'lucide-react';

/* ================= TYPES ================= */

interface FinalFile {
    id: number;
    original_name: string;
    file_path: string;
    file_size?: number | null;
    url: string;
    uploaded_by?: string | null;
    created_at?: string | null;
}

interface Row {
    id: number;
    order_id: number;
    project_name: string;
    company_name: string;
    customer_name: string;
    files: FinalFile[];
    total_files: number;
    is_completed?: boolean;
    approval_rab_response_time: string | null;
    approval_rab_response_by: string | null;
    pm_approval_rab_response_time: string | null;
    pm_approval_rab_response_by: string | null;
}

interface Props {
    items: Row[];
}

export default function ApprovalRabIndex({ items }: Props) {
    const { props } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [workTab, setWorkTab] = useState<'belum' | 'sudah'>('belum');

    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        isMarketing: boolean;
        taskResponse: any;
    } | null>(null);

    // Upload Modal State
    const [selectedUploadItem, setSelectedUploadItem] = useState<Row | null>(null);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Kepala Marketing
    const isKepalaMarketing = (props.auth as any)?.user?.isKepalaMarketing || false;

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
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin akan merespon Gambar Kerja Final ini?')) {
            router.post(`/approval-material/${itemPekerjaanId}/responses`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            });
        }
    };

    const handlePmResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin akan merespon sebagai Marketing untuk Gambar Kerja Final ini?')) {
            router.post(`/pm-response/approval-rab/${itemPekerjaanId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            });
        }
    };

    const handleDeleteFile = (fileId: number, fileName: string) => {
        if (confirm(`Hapus berkas "${fileName}"?`)) {
            router.delete(`/approval-material/files/${fileId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUploadItem || uploadFiles.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        uploadFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        router.post(`/approval-material/${selectedUploadItem.id}/upload`, formData as any, {
            preserveScroll: true,
            onSuccess: () => {
                setUploadFiles([]);
                setSelectedUploadItem(null);
            },
            onFinish: () => setUploading(false),
        });
    };

    useEffect(() => {
        const resize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Fetch dual task responses (regular & marketing)
    useEffect(() => {
        items.forEach((row) => {
            const orderId = row.order_id;
            if (orderId) {
                // Regular
                axios
                    .get(`/task-response/${orderId}/approval_material`)
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
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
                            console.error('Error fetching regular task response (approval_material):', err);
                        }
                    });
                // Marketing
                axios
                    .get(`/task-response/${orderId}/approval_material?is_marketing=1`)
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
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
                            console.error('Error fetching marketing task response (approval_material):', err);
                        }
                    });
            }
        });
    }, [items]);

    const isRowCompleted = (r: Row) => {
        if (typeof r.is_completed === 'boolean') {
            return r.is_completed;
        }
        return (r.files && r.files.length > 0) || r.total_files > 0;
    };

    const countBelum = useMemo(() =>
        items.filter(r => !isRowCompleted(r)).length,
        [items]
    );

    const countSudah = useMemo(() =>
        items.filter(r => isRowCompleted(r)).length,
        [items]
    );

    const filtered = items.filter((row) => {
        const isCompleted = isRowCompleted(row);
        const matchesWorkTab = workTab === 'belum' ? !isCompleted : isCompleted;
        if (!matchesWorkTab) return false;

        // Status filter
        let meetsStatus = true;
        if (statusFilter === 'pending_response') {
            meetsStatus = !row.approval_rab_response_time;
        } else if (statusFilter === 'responded') {
            meetsStatus = !!row.approval_rab_response_time;
        } else if (statusFilter === 'marketing_responded') {
            meetsStatus = !!row.pm_approval_rab_response_time;
        }

        if (!meetsStatus) return false;

        const s = search.toLowerCase();
        return (
            row.project_name.toLowerCase().includes(s) ||
            row.company_name.toLowerCase().includes(s) ||
            row.customer_name.toLowerCase().includes(s)
        );
    });

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Gambar Kerja Final" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-2 pt-20 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Gambar Kerja Final
                            </h1>
                            <p className="text-xs text-stone-600">
                                Upload dan kelola berkas gambar kerja final setiap proyek
                            </p>
                        </div>
                    </div>
                </div>

                {/* Work Status Tabs */}
                <WorkStatusTabs
                    activeTab={workTab}
                    onChange={setWorkTab}
                    countBelum={countBelum}
                    countSudah={countSudah}
                />

                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari project, company, atau customer..."
                            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-shadow focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 min-w-[180px]"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="pending_response">Belum Response</option>
                            <option value="responded">Sudah Response</option>
                            <option value="marketing_responded">Marketing Responded</option>
                        </select>
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Project / Client Info</th>
                                <th className="px-5 py-4">Berkas Gambar Kerja Final</th>
                                <th className="px-5 py-4">Deadline Info</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-stone-500">
                                        Tidak ada data gambar kerja final ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => {
                                    const orderId = row.order_id;
                                    const taskResponse = orderId ? taskResponses[orderId]?.regular : null;
                                    const marketingTaskResponse = orderId ? taskResponses[orderId]?.marketing : null;
                                    const files = row.files || [];

                                    return (
                                        <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                                            {/* Project Info */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                                    {row.project_name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                                    <span className="truncate max-w-[150px] font-medium text-slate-700">{row.company_name}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[150px]">{row.customer_name}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {files.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 max-w-fit rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                                            ✓ {files.length} Berkas Diunggah
                                                        </span>
                                                    )}
                                                    {row.approval_rab_response_time && (
                                                        <div className="inline-flex flex-col gap-0.5 px-2 py-1 bg-green-50 border border-green-200 rounded max-w-fit">
                                                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">
                                                                <Check className="w-2.5 h-2.5" /> Response: {row.approval_rab_response_by || '-'}
                                                            </span>
                                                            <span className="text-[10px] text-green-600">{formatDateTime(row.approval_rab_response_time)}</span>
                                                        </div>
                                                    )}
                                                    {row.pm_approval_rab_response_time && (
                                                        <div className="inline-flex flex-col gap-0.5 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded max-w-fit">
                                                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                                                <Check className="w-2.5 h-2.5" /> Marketing Res: {row.pm_approval_rab_response_by || '-'}
                                                            </span>
                                                            <span className="text-[10px] text-indigo-600">{formatDateTime(row.pm_approval_rab_response_time)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Berkas Gambar Kerja Final */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="max-w-[340px] whitespace-normal">
                                                    {files.length === 0 ? (
                                                        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-4 text-center">
                                                            <FileIcon className="mx-auto h-7 w-7 text-stone-400 mb-1.5" />
                                                            <p className="text-xs text-stone-500 font-medium">
                                                                Belum ada berkas gambar kerja final
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedUploadItem(row);
                                                                    setUploadFiles([]);
                                                                }}
                                                                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Upload Berkas
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-xs text-stone-600 font-semibold mb-1">
                                                                <span>{files.length} Berkas Terunggah:</span>
                                                                {files.length > 1 && (
                                                                    <a
                                                                        href={`/approval-material/${row.id}/download-all`}
                                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 transition"
                                                                        title="Download semua file sebagai ZIP"
                                                                    >
                                                                        <Archive className="w-3.5 h-3.5 text-amber-600" />
                                                                        Download Semua (ZIP)
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1">
                                                                {files.map((file) => (
                                                                    <div
                                                                        key={file.id}
                                                                        className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2 hover:bg-stone-100 transition shadow-2xs"
                                                                    >
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-amber-100 text-amber-700">
                                                                                <FileText className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="overflow-hidden">
                                                                                <p className="truncate text-xs font-medium text-stone-800" title={file.original_name}>
                                                                                    {file.original_name}
                                                                                </p>
                                                                                <p className="text-[10px] text-stone-400">
                                                                                    {formatFileSize(file.file_size)} {file.uploaded_by ? `• oleh ${file.uploaded_by}` : ''}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                                            <a
                                                                                href={file.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="rounded p-1 text-stone-600 hover:bg-stone-200 hover:text-indigo-600 transition"
                                                                                title="Lihat / Preview"
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5" />
                                                                            </a>
                                                                            <a
                                                                                href={`/approval-material/files/${file.id}/download`}
                                                                                className="rounded p-1 text-stone-600 hover:bg-stone-200 hover:text-emerald-600 transition"
                                                                                title="Download File"
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" />
                                                                            </a>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteFile(file.id, file.original_name)}
                                                                                className="rounded p-1 text-stone-400 hover:bg-red-100 hover:text-red-600 transition"
                                                                                title="Hapus File"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Deadline */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {taskResponse && taskResponse.status !== 'selesai' && taskResponse.status !== 'telat_submit' && !taskResponse.update_data_time && (
                                                        <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 w-full">
                                                            <p className="text-[10px] font-bold text-yellow-800">Deadline Gambar Kerja Final</p>
                                                            <p className="text-[11px] font-semibold text-yellow-900">{formatDeadline(taskResponse.deadline)}</p>
                                                            {taskResponse.extend_time > 0 && (
                                                                <p className="bg-yellow-200 px-1 py-0.5 rounded text-[9px] font-bold text-yellow-800">Ext: {taskResponse.extend_time}x</p>
                                                            )}
                                                            <button
                                                                onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: false, taskResponse })}
                                                                className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-orange-600 shadow-sm text-center"
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
                                                                onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: true, taskResponse: marketingTaskResponse })}
                                                                className="mt-1 w-full rounded bg-purple-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-purple-600 shadow-sm text-center"
                                                            >Minta Extend</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedUploadItem(row);
                                                            setUploadFiles([]);
                                                        }}
                                                        className="w-full rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-amber-700 text-center inline-flex items-center justify-center gap-1.5"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" /> Upload Berkas
                                                    </button>

                                                    {files.length > 0 && (
                                                        <a
                                                            href={`/approval-material/${row.id}/download-all`}
                                                            className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-emerald-700 text-center inline-flex items-center justify-center gap-1.5"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Download ({files.length})
                                                        </a>
                                                    )}

                                                    {isKepalaMarketing && !row.pm_approval_rab_response_time && (
                                                        <button
                                                            onClick={() => handlePmResponse(row.id)}
                                                            className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-purple-700 text-center mt-1"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                    {!isKepalaMarketing && !row.approval_rab_response_time && (
                                                        <button
                                                            onClick={() => handleResponse(row.id)}
                                                            className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 text-center mt-1 inline-flex items-center justify-center gap-1.5"
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Response
                                                        </button>
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
                {selectedUploadItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-stone-900">
                                        Upload Gambar Kerja Final
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        Project: <strong className="text-stone-700">{selectedUploadItem.project_name}</strong> ({selectedUploadItem.customer_name})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedUploadItem(null)}
                                    className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUploadSubmit}>
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                                        Pilih Berkas (PDF, Gambar, DWG, Dokumen, ZIP):
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.dwg,.doc,.docx,.zip"
                                        onChange={(e) =>
                                            setUploadFiles(
                                                e.target.files
                                                    ? Array.from(e.target.files)
                                                    : [],
                                            )
                                        }
                                        className="w-full text-xs text-stone-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer border border-stone-200 rounded-xl p-1"
                                    />
                                    <p className="text-[11px] text-stone-400 mt-1">
                                        Dapat memilih beberapa file sekaligus. Maksimum 50MB per file.
                                    </p>
                                </div>

                                {uploadFiles.length > 0 && (
                                    <div className="mb-4 max-h-36 overflow-y-auto space-y-1.5 border border-stone-100 rounded-xl p-2 bg-stone-50">
                                        <p className="text-[11px] font-bold text-stone-600 mb-1">
                                            {uploadFiles.length} file dipilih:
                                        </p>
                                        {uploadFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between text-xs text-stone-700 bg-white p-1.5 rounded-lg border border-stone-200"
                                            >
                                                <span className="truncate max-w-[280px] font-medium">{file.name}</span>
                                                <span className="text-[10px] text-stone-400">{formatFileSize(file.size)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUploadItem(null)}
                                        className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || uploadFiles.length === 0}
                                        className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50"
                                    >
                                        {uploading ? 'Mengupload...' : 'Upload Berkas'}
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
