import { useState } from 'react';
import { router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Estimasi {
    id: number;
    estimated_cost: string | null;
    response_by: string | null;
    response_time: string | null;
}

interface Moodboard {
    id: number;
    order_id: number;
    moodboard_kasar: string;
    moodboard_final: string | null;
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    response_by: string;
    response_time: string;
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
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [reviseNotes, setReviseNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleUploadEstimasi = async () => {
        if (!selectedMoodboard || !uploadFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('moodboard_id', selectedMoodboard.id.toString());
        formData.append('estimated_cost', uploadFile);

        router.post('/estimasi/store', formData as any, {
            onSuccess: () => {
                setUploadFile(null);
                setShowUploadModal(false);
                setSelectedMoodboard(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                console.error('Upload error:', errors);
                alert('Gagal upload estimasi');
                setLoading(false);
            },
        });
    };

    const handleAccept = async () => {
        if (!selectedMoodboard) return;

        if (window.confirm('Apakah Anda yakin ingin menerima desain ini?')) {
            setLoading(true);
            router.post(`/estimasi/accept/${selectedMoodboard.id}`, {}, {
                onSuccess: () => {
                    setSelectedMoodboard(null);
                    setLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Accept error:', errors);
                    alert('Gagal accept estimasi');
                    setLoading(false);
                },
            });
        }
    };

    const handleRevise = async () => {
        if (!selectedMoodboard || !reviseNotes) return;

        setLoading(true);
        router.post(`/estimasi/revise/${selectedMoodboard.id}`, { notes: reviseNotes }, {
            onSuccess: () => {
                setReviseNotes('');
                setShowReviseModal(false);
                setSelectedMoodboard(null);
                setLoading(false);
            },
            onError: (errors: any) => {
                console.error('Revise error:', errors);
                alert('Gagal revise estimasi');
                setLoading(false);
            },
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
                            <p className="text-xs text-stone-600">Kelola estimasi harga untuk desain kasar moodboard</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMoodboards.length === 0 ? (
                        <div className="col-span-full py-12">
                            <div className="text-center">
                                <svg className="w-16 h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-stone-500 text-sm">Semua estimasi sudah selesai atau tidak ada moodboard dengan desain kasar</p>
                            </div>
                        </div>
                    ) : (
                        filteredMoodboards.map((moodboard) => (
                            <div key={moodboard.id} className="rounded-xl border-2 bg-white border-stone-200 hover:border-blue-300 transition-all overflow-hidden">
                                <div className="p-4 sm:p-5">
                                    {/* Desain Kasar Preview */}
                                    {moodboard.moodboard_kasar && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-stone-700 mb-2">Desain Kasar:</p>
                                            <img
                                                src={`/storage/${moodboard.moodboard_kasar}`}
                                                alt="Desain Kasar"
                                                className="w-full h-40 object-cover rounded-lg border border-stone-200"
                                            />
                                        </div>
                                    )}

                                    {/* Project Info */}
                                    <div className="mb-4 pb-4 border-b border-stone-200">
                                        <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1 line-clamp-2">
                                            {moodboard.order?.nama_project}
                                        </h3>
                                        <p className="text-xs text-stone-600 mb-2">{moodboard.order?.company_name}</p>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">Customer:</span>
                                                <span className="font-medium text-stone-900">{moodboard.order?.customer_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Response Info */}
                                    <div className="mb-4 pb-4 border-b border-stone-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-stone-700">Status Moodboard:</span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[moodboard.status].badge} ${statusColors[moodboard.status].text}`}>
                                                {statusLabels[moodboard.status]}
                                            </span>
                                        </div>
                                        <div className="text-xs bg-stone-50 rounded-lg p-2.5 space-y-1">
                                            <p className="text-stone-600">Di-respond: <span className="font-semibold text-stone-900">{moodboard.response_by}</span></p>
                                            <p className="text-stone-600">Waktu: <span className="font-semibold text-stone-900">{new Date(moodboard.response_time).toLocaleString('id-ID')}</span></p>
                                        </div>
                                    </div>

                                    {/* Estimasi Info (if exists and has response) */}
                                    {moodboard.estimasi && moodboard.estimasi.response_by && (
                                        <div className="mb-4 pb-4 border-b border-stone-200">
                                            <p className="text-xs font-semibold text-stone-700 mb-2">Info Estimasi:</p>
                                            <div className="text-xs bg-blue-50 rounded-lg p-2.5 space-y-1">
                                                <p className="text-stone-600">Di-respond: <span className="font-semibold text-stone-900">{moodboard.estimasi.response_by}</span></p>
                                                <p className="text-stone-600">Waktu: <span className="font-semibold text-stone-900">{moodboard.estimasi.response_time ? new Date(moodboard.estimasi.response_time).toLocaleString('id-ID') : '-'}</span></p>
                                                {moodboard.estimasi.estimated_cost && (
                                                    <p className="text-emerald-600 font-semibold mt-1">✓ File estimasi sudah diupload</p>
                                                )}
                                                {!moodboard.estimasi.estimated_cost && (
                                                    <p className="text-amber-600 font-semibold mt-1">⚠ Menunggu upload file estimasi</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {/* BELUM ADA ESTIMASI SAMA SEKALI -> RESPONSE */}
                                        {!moodboard.estimasi && (
                                            <button
                                                onClick={() => handleResponseEstimasi(moodboard)}
                                                disabled={loading}
                                                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Memproses...' : 'Response Estimasi'}
                                            </button>
                                        )}

                                        {/* ESTIMASI ADA TAPI BELUM UPLOAD FILE -> UPLOAD */}
                                        {moodboard.estimasi && !moodboard.estimasi.estimated_cost && (
                                            <button
                                                onClick={() => {
                                                    setSelectedMoodboard(moodboard);
                                                    setShowUploadModal(true);
                                                }}
                                                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all"
                                            >
                                                Upload File Estimasi
                                            </button>
                                        )}

                                        {/* ESTIMASI LENGKAP (ADA FILE) -> DOWNLOAD + REVISI/TERIMA */}
                                        {moodboard.estimasi && moodboard.estimasi.estimated_cost && (
                                            <>
                                                <a
                                                    href={`/storage/${moodboard.estimasi.estimated_cost}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-3 py-2 text-xs font-semibold text-center text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all"
                                                >
                                                    Download Estimasi
                                                </a>
                                                {moodboard.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMoodboard(moodboard);
                                                                setShowReviseModal(true);
                                                            }}
                                                            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg transition-all"
                                                        >
                                                            Revisi
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMoodboard(moodboard);
                                                                handleAccept();
                                                            }}
                                                            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all"
                                                        >
                                                            Terima
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && selectedMoodboard && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen sm:max-h-none overflow-y-auto sm:overflow-visible">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Upload Estimasi</h2>
                                        <p className="text-xs text-blue-100 mt-0.5">{selectedMoodboard.order?.nama_project}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFile(null);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUploadEstimasi(); }} className="p-4 sm:p-6 space-y-4">
                                <p className="text-xs sm:text-sm text-stone-600">Unggah file estimasi harga untuk review</p>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        File Estimasi
                                    </label>
                                    <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
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
                                                    <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUploadModal(false);
                                            setUploadFile(null);
                                        }}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !uploadFile}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen sm:max-h-none overflow-y-auto sm:overflow-visible">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-white">Request Revisi</h2>
                                        <p className="text-xs text-orange-100 mt-0.5">{selectedMoodboard.order?.nama_project}</p>
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
                                <p className="text-xs sm:text-sm text-stone-600">Berikan catatan untuk revisi desain kasar</p>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                        Catatan Revisi
                                    </label>
                                    <textarea
                                        value={reviseNotes}
                                        onChange={(e) => setReviseNotes(e.target.value)}
                                        placeholder="Masukkan detail revisi yang diperlukan..."
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
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
            </main>
        </div>
    );
}
