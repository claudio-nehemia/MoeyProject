import { useState } from 'react';
import { router, Head, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

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

    const { auth } = usePage<{ auth: { user: { isProjectManager: boolean } } }>().props;
    const isProjectManager = auth?.user?.isProjectManager || false;

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
        if (window.confirm(`Response gambar kerja untuk project "${item.order.nama_project}"?`)) {
            setLoading(true);
            router.post(`/gambar-kerja/response/${item.id}`, {}, {
                onFinish: () => setLoading(false),
            });
        }
    };

    const handlePmResponse = (gambarKerjaId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk gambar kerja ini?')) {
            router.post(`/pm-response/gambar-kerja/${gambarKerjaId}`, {}, {
                preserveScroll: true,
            });
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
        if (window.confirm(`Approve semua gambar kerja untuk project "${item.order.nama_project}"?`)) {
            setLoading(true);
            router.post(`/gambar-kerja/approve/${item.id}`, {}, {
                onFinish: () => setLoading(false),
            });
        }
    };

    const handleRevise = () => {
        if (!selectedItem || !reviseNotes) return;

        setLoading(true);
        router.post(`/gambar-kerja/revisi/${selectedItem.id}`, {
            notes: reviseNotes,
        }, {
            onSuccess: () => {
                setShowReviseModal(false);
                setSelectedItem(null);
                setReviseNotes('');
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleDeleteFile = (fileId: number) => {
        if (window.confirm('Hapus file ini?')) {
            setLoading(true);
            router.delete(`/gambar-kerja/file/${fileId}`, {
                onFinish: () => setLoading(false),
            });
        }
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

            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all w-full overflow-y-auto">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
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
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari project, customer, atau company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* ================= LIST ================= */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id}
                            className="rounded-xl border-2 bg-white border-stone-200 hover:border-indigo-300 transition-all overflow-hidden">
                            <div className="p-4 sm:p-5">

                                {/* INFO */}
                                <div className="mb-4 pb-4 border-b border-stone-200">
                                    <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                                        {item.order.nama_project}
                                    </h3>
                                    <p className="text-sm text-stone-600">{item.order.company_name}</p>
                                    <p className="text-xs text-stone-500">
                                        Customer: {item.order.customer_name}
                                    </p>

                                    <div className="flex gap-2 mt-2">
                                        {item.status === 'approved' && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                ✓ Approved
                                            </span>
                                        )}
                                        {item.response_time && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                                                ✓ Responded
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* RESPONSE */}
                                {!item.response_time && (
                                    <div className="mb-4 text-center">
                                        <button
                                            onClick={() => handleResponse(item)}
                                            disabled={loading}
                                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg"
                                        >
                                            Response
                                        </button>
                                    </div>
                                )}

                                {/* PM Response Button */}
                                {isProjectManager && !item.pm_response_time && (
                                    <div className="mb-4 text-center">
                                        <button
                                            onClick={() => handlePmResponse(item.id)}
                                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all"
                                        >
                                            PM Response
                                        </button>
                                    </div>
                                )}

                                {/* PM Response Badge */}
                                {item.pm_response_time && (
                                    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                                        <p className="text-sm font-semibold text-purple-900">✓ PM Response</p>
                                        <p className="text-xs text-purple-700">By: {item.pm_response_by}</p>
                                        <p className="text-xs text-purple-700">
                                            {new Date(item.pm_response_time).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* FILES */}
                                {item.files.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {item.files.map((file) => (
                                            <div key={file.id}
                                                className="flex items-center gap-2 p-2.5 bg-stone-50 border rounded-lg">
                                                <img src={file.url}
                                                    className="w-12 h-12 rounded object-cover" />
                                                <div className="flex-1 text-xs truncate">
                                                    {file.original_name}
                                                </div>
                                                <a href={file.url} target="_blank"
                                                    className="text-blue-600 text-xs">
                                                    👁️ Lihat
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    className="text-red-600 text-xs">
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* REVISI */}
                                {item.revisi_notes && (
                                    <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-orange-900 mb-1">
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
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg"
                                        >
                                            Upload
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setShowReviseModal(true);
                                            }}
                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-lg"
                                        >
                                            Revisi
                                        </button>

                                        {item.files.length > 0 && item.status !== 'approved' && (
                                            <button
                                                onClick={() => handleApprove(item)}
                                                className="px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ================= UPLOAD MODAL ================= */}
                {showUploadModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-lg font-bold mb-3">Upload Gambar Kerja</h2>
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) =>
                                    setUploadFiles(e.target.files ? Array.from(e.target.files) : [])
                                }
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 border rounded py-2">
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={loading || uploadFiles.length === 0}
                                    className="flex-1 bg-indigo-600 text-white rounded py-2">
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= REVISE MODAL ================= */}
                {showReviseModal && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-lg font-bold mb-3">Catatan Revisi</h2>
                            <textarea
                                value={reviseNotes}
                                onChange={(e) => setReviseNotes(e.target.value)}
                                className="w-full border rounded p-2 h-24"
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setShowReviseModal(false)}
                                    className="flex-1 border rounded py-2">
                                    Batal
                                </button>
                                <button
                                    onClick={handleRevise}
                                    disabled={loading || !reviseNotes}
                                    className="flex-1 bg-orange-600 text-white rounded py-2">
                                    Kirim Revisi
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
