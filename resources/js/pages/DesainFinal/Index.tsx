import { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

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
    order: Order;
    commitmentFee: CommitmentFee;
}

interface Props {
    moodboards: Moodboard[];
}

export default function DesainFinalIndex({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [reviseNotes, setReviseNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MoodboardFile | null>(null);
    const [replaceFile, setReplaceFile] = useState<File | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        return (
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search)
        );
    });

    const handleResponseFinal = (moodboard: Moodboard) => {
        if (window.confirm(`Response desain final untuk project "${moodboard.order.nama_project}"?`)) {
            setLoading(true);
            router.post(`/desain-final/response/${moodboard.id}`, {}, {
                onSuccess: () => {
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Response error:', errors);
                    alert('Gagal response desain final');
                    setLoading(false);
                },
            });
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
        if (window.confirm(`Pilih desain "${file.original_name}" sebagai desain final?`)) {
            setLoading(true);
            router.post(`/desain-final/accept/${moodboard.id}`, {
                moodboard_file_id: file.id,
            }, {
                onSuccess: () => {
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Accept error:', errors);
                    alert('Gagal accept desain: ' + JSON.stringify(errors));
                    setLoading(false);
                },
            });
        }
    };

    const handleRevise = async () => {
        if (!selectedMoodboard || !reviseNotes) return;

        setLoading(true);
        router.post(`/desain-final/revise/${selectedMoodboard.id}`, {
            notes: reviseNotes,
        }, {
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
        });
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

        router.post(`/desain-final/file/${selectedFile.id}/replace`, formData as any, {
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

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Desain Final Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="desain-final"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all w-full overflow-y-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Desain Final Management</h1>
                            <p className="text-xs text-stone-600">Upload dan kelola desain final untuk setiap project</p>
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
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                <p className="text-stone-500 text-sm">Tidak ada project yang siap untuk desain final</p>
                            </div>
                        </div>
                    ) : (
                        filteredMoodboards.map((moodboard) => (
                            <div key={moodboard.id} className="rounded-xl border-2 bg-white border-stone-200 hover:border-indigo-300 transition-all overflow-hidden">
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
                                            <div className="flex flex-col items-end gap-1">
                                                {moodboard.moodboard_final && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                                        ✓ Final Approved
                                                    </span>
                                                )}
                                                {moodboard.has_response_final && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 whitespace-nowrap">
                                                        ✓ Responded
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Response Info */}
                                        {moodboard.has_response_final && moodboard.response_final_by && (
                                            <div className="mt-3 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
                                                <p className="text-xs text-violet-700">
                                                    <span className="font-semibold">Response oleh:</span> {moodboard.response_final_by}
                                                    {moodboard.response_final_time && (
                                                        <span className="ml-2">
                                                            ({new Date(moodboard.response_final_time).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show Response Button if not responded yet */}
                                    {!moodboard.has_response_final && !moodboard.moodboard_final && (
                                        <div className="mb-4 bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
                                            <svg className="w-10 h-10 text-violet-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p className="text-sm font-medium text-violet-900 mb-1">Project siap untuk desain final</p>
                                            <p className="text-xs text-violet-700 mb-3">Klik tombol Response untuk memulai proses desain final</p>
                                            <button
                                                onClick={() => handleResponseFinal(moodboard)}
                                                disabled={loading}
                                                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                Response
                                            </button>
                                        </div>
                                    )}

                                    {/* Final Files List - Only show if responded */}
                                    {moodboard.has_response_final && moodboard.final_files.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-stone-700 mb-3">
                                                File Desain Final ({moodboard.final_files.length}):
                                            </p>
                                            <div className="space-y-2">
                                                {moodboard.final_files.map((file, idx) => (
                                                    <div key={file.id} className="border border-stone-200 rounded-lg p-2.5 bg-stone-50">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-stone-200">
                                                                <img
                                                                    src={file.url}
                                                                    alt={file.original_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-stone-900 truncate">
                                                                    #{idx + 1}: {file.original_name}
                                                                </p>
                                                                {moodboard.moodboard_final === file.file_path && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Terpilih
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 px-2 py-1.5 text-xs font-medium text-center text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-all"
                                                            >
                                                                👁️ Lihat
                                                            </a>
                                                            {!moodboard.moodboard_final && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAcceptDesain(moodboard, file)}
                                                                        disabled={loading}
                                                                        className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded transition-all disabled:opacity-50"
                                                                    >
                                                                        ✓ Terima
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openReplaceModal(file)}
                                                                        disabled={loading}
                                                                        className="px-2 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded transition-all disabled:opacity-50"
                                                                        title="Ganti file"
                                                                    >
                                                                        🔄
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteFile(file)}
                                                                        disabled={loading}
                                                                        className="px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded transition-all disabled:opacity-50"
                                                                        title="Hapus file"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes if any */}
                                    {moodboard.revisi_final && (
                                        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-orange-900 mb-1">Catatan Revisi:</p>
                                            <p className="text-xs text-orange-700">{moodboard.revisi_final}</p>
                                        </div>
                                    )}

                                    {/* Info jika sudah response tapi belum ada file */}
                                    {moodboard.has_response_final && moodboard.final_files.length === 0 && !moodboard.moodboard_final && (
                                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                            <svg className="w-10 h-10 text-blue-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="text-sm font-medium text-blue-900 mb-1">Belum ada file desain final</p>
                                            <p className="text-xs text-blue-700">Upload file desain final untuk project ini</p>
                                        </div>
                                    )}

                                    {/* Info setelah upload, sebelum approve */}
                                    {moodboard.has_response_final && moodboard.final_files.length > 0 && !moodboard.moodboard_final && (
                                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-amber-900 mb-1">
                                                ⏳ Menunggu Approval
                                            </p>
                                            <p className="text-xs text-amber-700">
                                                Pilih salah satu file di atas dengan klik tombol "✓ Terima" untuk menyetujui desain final
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons - Only show if responded */}
                                    {moodboard.has_response_final && (
                                        <div className="flex gap-2">
                                            {!moodboard.moodboard_final && (
                                                <>
                                                    <button
                                                        onClick={() => openUploadModal(moodboard)}
                                                        disabled={loading}
                                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        {moodboard.final_files.length > 0 ? `+ Tambah File (${moodboard.final_files.length})` : 'Upload Desain Final'}
                                                    </button>
                                                    {moodboard.final_files.length > 0 && (
                                                        <button
                                                            onClick={() => openReviseModal(moodboard)}
                                                            disabled={loading}
                                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all disabled:opacity-50"
                                                        >
                                                            🔄 Revisi
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {moodboard.moodboard_final && (
                                                <>
                                                    <div className="flex-1 text-center py-2 text-sm text-emerald-700 font-medium bg-emerald-50 rounded-lg border border-emerald-200">
                                                        ✓ Desain final sudah disetujui
                                                    </div>
                                                    <button
                                                        onClick={() => openReviseModal(moodboard)}
                                                        disabled={loading}
                                                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        🔄 Revisi
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && selectedMoodboard && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Upload Desain Final</h2>
                                        <p className="text-xs text-indigo-100 mt-0.5">{selectedMoodboard.order.nama_project}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFiles([]);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUploadFinal(); }} className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        File Desain Final
                                    </label>
                                    <div className="relative border-2 border-dashed border-indigo-300 rounded-lg p-4 sm:p-6 text-center hover:border-indigo-400 transition-colors">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            multiple
                                            onChange={(e) => setUploadFiles(e.target.files ? Array.from(e.target.files) : [])}
                                            className="hidden"
                                            id="final-upload"
                                            required
                                        />
                                        <label htmlFor="final-upload" className="cursor-pointer">
                                            {uploadFiles.length > 0 ? (
                                                <div className="space-y-2">
                                                    <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-xs sm:text-sm font-medium text-emerald-700">
                                                        {uploadFiles.length} file dipilih
                                                    </p>
                                                    <div className="max-h-32 overflow-y-auto">
                                                        {uploadFiles.map((file, idx) => (
                                                            <p key={idx} className="text-xs text-stone-600 truncate">
                                                                {idx + 1}. {file.name}
                                                            </p>
                                                        ))}
                                                    </div>
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
                                            setUploadFiles([]);
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || uploadFiles.length === 0}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Minta Revisi</h2>
                                        <p className="text-xs text-orange-100 mt-0.5">{selectedMoodboard.order.nama_project}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowReviseModal(false);
                                        setReviseNotes('');
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleRevise(); }} className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        Catatan Revisi
                                    </label>
                                    <textarea
                                        value={reviseNotes}
                                        onChange={(e) => setReviseNotes(e.target.value)}
                                        placeholder="Jelaskan bagian mana yang perlu direvisi..."
                                        required
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none h-24 sm:h-28"
                                    />
                                </div>

                                <div className="flex gap-2 sm:gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReviseModal(false);
                                            setReviseNotes('');
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !reviseNotes}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memproses...' : 'Kirim Revisi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Replace File Modal */}
                {showReplaceModal && selectedFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Ganti File</h2>
                                        <p className="text-xs text-amber-100 mt-0.5">{selectedFile.original_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowReplaceModal(false);
                                        setReplaceFile(null);
                                        setSelectedFile(null);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleReplaceFile(); }} className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        File Pengganti
                                    </label>
                                    <div className="relative border-2 border-dashed border-amber-300 rounded-lg p-4 sm:p-6 text-center hover:border-amber-400 transition-colors">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="replace-file-input"
                                            required
                                        />
                                        <label
                                            htmlFor="replace-file-input"
                                            className="cursor-pointer block"
                                        >
                                            {replaceFile ? (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs font-medium text-stone-900 mb-0.5">
                                                        {replaceFile.name}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {(replaceFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-amber-100 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs font-semibold text-stone-900 mb-1">
                                                        Klik untuk pilih file
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        JPG, PNG, atau PDF (Max 10MB)
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-2 sm:gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReplaceModal(false);
                                            setReplaceFile(null);
                                            setSelectedFile(null);
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !replaceFile}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memproses...' : 'Ganti File'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
