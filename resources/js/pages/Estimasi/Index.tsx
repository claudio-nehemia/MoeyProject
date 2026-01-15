import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface EstimasiFileData {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface KasarFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
    estimasi_file: EstimasiFileData | null;
}

interface Estimasi {
    id: number;
    estimated_cost: string | null;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Moodboard {
    id: number;
    order_id: number;
    moodboard_kasar: string;
    moodboard_final: string | null;
    kasar_files: KasarFile[];
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    response_by: string;
    response_time: string;
    pm_response_by: string | null;
    pm_response_time: string | null;
    order: Order | null;
    estimasi: Estimasi | null;
}

interface Props {
    moodboards: Moodboard[];
}

const statusLabels: Record<string, string> = {
    pending: 'Menunggu Review',
    approved: 'Disetujui',
    revisi: 'Revisi',
};

const statusColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    pending: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100',
        text: 'text-yellow-800',
    },
    approved: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100',
        text: 'text-emerald-800',
    },
    revisi: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100',
        text: 'text-orange-800',
    },
};

export default function EstimasiIndex({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
    const [selectedKasarFile, setSelectedKasarFile] = useState<KasarFile | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        return (
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search)
        );
    });

    const handleResponseEstimasi = async (moodboard: Moodboard) => {
        if (!moodboard) return;

        if (window.confirm('Buat response estimasi untuk project ini?')) {
            setLoading(true);
            router.post(`/estimasi/response/${moodboard.id}`, {}, {
                onSuccess: () => {
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Response error:', errors);
                    alert('Gagal membuat response estimasi');
                    setLoading(false);
                },
            });
        }
    };

    const handlePmResponse = (moodboardId: number) => {
        console.log('handlePmResponse called with moodboardId:', moodboardId);
        if (window.confirm('Apakah Anda yakin ingin memberikan PM response untuk moodboard ini?')) {
            console.log('Sending PM response request to:', `/pm-response/moodboard/${moodboardId}`);
            router.post(`/pm-response/moodboard/${moodboardId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('PM Response success');
                },
                onError: (errors) => {
                    console.error('PM Response error:', errors);
                    alert('Gagal memberikan PM response');
                }
            });
        } else {
            console.log('User cancelled PM response');
        }
    };

    const handleUploadEstimasi = async () => {
        if (!selectedMoodboard || !selectedKasarFile || !uploadFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('estimasi_id', selectedMoodboard.estimasi!.id.toString());
        formData.append('moodboard_file_id', selectedKasarFile.id.toString());
        formData.append('estimated_cost', uploadFile);

        router.post('/estimasi/store', formData as any, {
            onSuccess: () => {
                setUploadFile(null);
                setShowUploadModal(false);
                setSelectedMoodboard(null);
                setSelectedKasarFile(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                console.error('Upload error:', errors);
                alert('Gagal upload estimasi');
                setLoading(false);
            },
        });
    };

    const openUploadModal = (moodboard: Moodboard, kasarFile: KasarFile) => {
        setSelectedMoodboard(moodboard);
        setSelectedKasarFile(kasarFile);
        setShowUploadModal(true);
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
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="estimasi"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-2 sm:px-4 pb-6 transition-all w-full overflow-y-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Estimasi Management</h1>
                            <p className="text-xs text-stone-600">Upload estimasi untuk setiap file desain kasar</p>
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
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                <p className="text-stone-500 text-sm">Tidak ada moodboard dengan desain kasar</p>
                            </div>
                        </div>
                    ) : (
                        filteredMoodboards.map((moodboard) => (
                            <div key={moodboard.id} className="rounded-xl border-2 bg-white border-stone-200 hover:border-blue-300 transition-all overflow-hidden">
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
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[moodboard.status].badge} ${statusColors[moodboard.status].text}`}>
                                                {statusLabels[moodboard.status]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Estimasi Response Info */}
                                    {!moodboard.estimasi && (
                                        <div className="mb-4">
                                            <button
                                                onClick={() => handleResponseEstimasi(moodboard)}
                                                disabled={loading}
                                                className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Memproses...' : 'Buat Response Estimasi'}
                                            </button>
                                        </div>
                                    )}

                                    {moodboard.estimasi && (
                                        <div className="mb-4">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs font-semibold text-blue-900 mb-1">Response Estimasi:</p>
                                                <p className="text-xs text-blue-700">Oleh: {moodboard.estimasi.response_by}</p>
                                                <p className="text-xs text-blue-700">
                                                    Waktu: {moodboard.estimasi.response_time ? new Date(moodboard.estimasi.response_time).toLocaleString('id-ID') : '-'}
                                                </p>
                                            </div>

                                            {/* PM Response Badge */}
                                            {moodboard.estimasi.pm_response_time && (
                                                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                    <p className="text-xs font-semibold text-purple-900">✓ PM Response:</p>
                                                    <p className="text-xs text-purple-700">By: {moodboard.estimasi.pm_response_by}</p>
                                                    <p className="text-xs text-purple-700">
                                                        {moodboard.estimasi.pm_response_time ? new Date(moodboard.estimasi.pm_response_time).toLocaleString('id-ID') : '-'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Marketing Response Button - INDEPENDENT */}
                                    {isKepalaMarketing && !moodboard.pm_response_time && (
                                        <div className="mb-4">
                                            <button
                                                onClick={() => handlePmResponse(moodboard.id)}
                                                className="w-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all"
                                            >
                                                Marketing Response
                                            </button>
                                        </div>
                                    )}

                                    {/* PM Response Badge */}
                                    {moodboard.pm_response_time && (
                                        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-purple-900">✓ PM Response</p>
                                            <p className="text-xs text-purple-700">By: {moodboard.pm_response_by}</p>
                                            <p className="text-xs text-purple-700">
                                                {new Date(moodboard.pm_response_time).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Kasar Files List */}
                                    {moodboard.estimasi && moodboard.kasar_files.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-stone-700 mb-3">
                                                File Desain Kasar ({moodboard.kasar_files.length}):
                                            </p>
                                            <div className="space-y-3">
                                                {moodboard.kasar_files.map((kasarFile, idx) => (
                                                    <div key={kasarFile.id} className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                                                        <div className="flex items-start gap-3">
                                                            {/* Preview Image */}
                                                            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-stone-200">
                                                                <img
                                                                    src={kasarFile.url}
                                                                    alt={kasarFile.original_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>

                                                            {/* File Info & Actions */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-stone-900 truncate mb-1">
                                                                    File #{idx + 1}: {kasarFile.original_name}
                                                                </p>
                                                                
                                                                {kasarFile.estimasi_file ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <span className="text-xs font-medium text-emerald-700">
                                                                                ✓ Estimasi sudah diupload
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <a
                                                                                href={kasarFile.estimasi_file.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-all"
                                                                            >
                                                                                Download Estimasi
                                                                            </a>
                                                                            <button
                                                                                onClick={() => openUploadModal(moodboard, kasarFile)}
                                                                                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded transition-all"
                                                                            >
                                                                                Update
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                            </svg>
                                                                            <span className="text-xs font-medium text-amber-700">
                                                                                Belum upload estimasi
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => openUploadModal(moodboard, kasarFile)}
                                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded transition-all"
                                                                        >
                                                                            Upload Estimasi
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && selectedMoodboard && selectedKasarFile && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Upload Estimasi</h2>
                                        <p className="text-xs text-indigo-100 mt-0.5">{selectedKasarFile.original_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFile(null);
                                        setSelectedKasarFile(null);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUploadEstimasi(); }} className="p-4 sm:p-6 space-y-4">
                                {/* Preview Kasar File */}
                                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-stone-700 mb-2">File Desain Kasar:</p>
                                    <img
                                        src={selectedKasarFile.url}
                                        alt={selectedKasarFile.original_name}
                                        className="w-full h-32 object-cover rounded border border-stone-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        File Estimasi
                                    </label>
                                    <div className="relative border-2 border-dashed border-indigo-300 rounded-lg p-4 sm:p-6 text-center hover:border-indigo-400 transition-colors">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="estimasi-upload"
                                            required
                                        />
                                        <label htmlFor="estimasi-upload" className="cursor-pointer">
                                            {uploadFile ? (
                                                <div className="text-center">
                                                    <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-xs sm:text-sm font-medium text-emerald-700">{uploadFile.name}</p>
                                                    <p className="text-xs text-stone-500 mt-1">
                                                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
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
                                            setUploadFile(null);
                                            setSelectedKasarFile(null);
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !uploadFile}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memproses...' : 'Upload'}
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
