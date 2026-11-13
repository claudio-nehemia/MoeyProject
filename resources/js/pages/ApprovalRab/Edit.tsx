import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import {
    Upload,
    FileText,
    ArrowLeft,
    Trash2,
    Eye,
    Download,
    Archive,
    Check,
    FileIcon,
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

interface Props {
    itemPekerjaan: {
        id: number;
        order_id: number;
        project_name: string;
        company_name: string;
        customer_name: string;
        files: FinalFile[];
        total_files: number;
        approval_rab_response_time: string | null;
        approval_rab_response_by: string | null;
    };
}

export default function ApprovalRabEdit({ itemPekerjaan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);

    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        if (uploadFiles.length === 0) return;

        setSaving(true);
        const formData = new FormData();
        uploadFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        router.post(`/approval-material/${itemPekerjaan.id}/upload`, formData as any, {
            preserveScroll: true,
            onSuccess: () => {
                setUploadFiles([]);
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title={`Kelola Berkas Gambar Kerja Final - ${itemPekerjaan.project_name}`} />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-3 pt-20 pb-12 pl-0 transition-all sm:px-6 sm:pl-64">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/approval-material"
                            className="rounded-xl border border-stone-200 bg-white p-2.5 text-stone-600 shadow-xs hover:bg-stone-100 transition"
                            title="Kembali ke Daftar"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">
                                Berkas Gambar Kerja Final
                            </h1>
                            <p className="text-xs text-stone-500">
                                Proyek: <strong className="text-stone-800">{itemPekerjaan.project_name}</strong> • {itemPekerjaan.customer_name} ({itemPekerjaan.company_name})
                            </p>
                        </div>
                    </div>

                    {itemPekerjaan.files.length > 1 && (
                        <a
                            href={`/approval-material/${itemPekerjaan.id}/download-all`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                        >
                            <Archive className="w-4 h-4" />
                            Download Semua Berkas (ZIP)
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Upload New Files */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <h2 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-amber-600" />
                                Unggah Berkas Baru
                            </h2>
                            <p className="text-xs text-stone-500 mb-4">
                                Pilih satu atau beberapa file gambar kerja final (PDF, gambar, DWG, dokumen, atau ZIP).
                            </p>

                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/60 p-4 text-center hover:bg-stone-50 transition">
                                    <FileIcon className="mx-auto h-8 w-8 text-stone-400 mb-2" />
                                    <label className="cursor-pointer">
                                        <span className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition inline-block">
                                            Pilih File
                                        </span>
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
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="mt-2 text-[11px] text-stone-400">
                                        Maksimum 50MB per file
                                    </p>
                                </div>

                                {uploadFiles.length > 0 && (
                                    <div className="space-y-1.5 border border-stone-100 rounded-xl p-2.5 bg-stone-50 max-h-48 overflow-y-auto">
                                        <p className="text-[11px] font-bold text-stone-600">
                                            {uploadFiles.length} file dipilih:
                                        </p>
                                        {uploadFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between text-xs text-stone-700 bg-white p-2 rounded-lg border border-stone-200 shadow-2xs"
                                            >
                                                <span className="truncate max-w-[180px] font-medium">{file.name}</span>
                                                <span className="text-[10px] text-stone-400">{formatFileSize(file.size)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving || uploadFiles.length === 0}
                                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                >
                                    <Upload className="w-4 h-4" />
                                    {saving ? 'Mengunggah Berkas...' : 'Upload Berkas'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Uploaded Files List */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                                <div>
                                    <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-stone-600" />
                                        Berkas Terunggah ({itemPekerjaan.files.length})
                                    </h2>
                                    <p className="text-xs text-stone-400">
                                        Daftar seluruh berkas gambar kerja final yang telah diunggah untuk proyek ini.
                                    </p>
                                </div>
                            </div>

                            {itemPekerjaan.files.length === 0 ? (
                                <div className="py-12 text-center">
                                    <FileIcon className="mx-auto h-12 w-12 text-stone-300 mb-2" />
                                    <p className="text-sm font-medium text-stone-500">
                                        Belum ada berkas gambar kerja final
                                    </p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        Gunakan form di sebelah kiri untuk mengunggah berkas.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {itemPekerjaan.files.map((file, idx) => (
                                        <div
                                            key={file.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 hover:bg-stone-50 hover:border-stone-300 transition"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-2xs font-bold text-xs">
                                                    #{idx + 1}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="truncate text-sm font-semibold text-stone-800" title={file.original_name}>
                                                        {file.original_name}
                                                    </p>
                                                    <p className="text-[11px] text-stone-400 mt-0.5">
                                                        Ukuran: {formatFileSize(file.file_size)} • Diunggah oleh: <strong className="text-stone-600">{file.uploaded_by || '-'}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 transition"
                                                    title="Lihat / Preview"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Lihat
                                                </a>
                                                <a
                                                    href={`/approval-material/files/${file.id}/download`}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50 hover:border-emerald-200 transition"
                                                    title="Download File"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Unduh
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFile(file.id, file.original_name)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-50 transition"
                                                    title="Hapus File"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
