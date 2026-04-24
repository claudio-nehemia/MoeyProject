import { useState, useEffect, Fragment } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

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

interface TaskResponse {
    status: string;
    deadline: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
    update_data_time?: string | null;
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
    const [uploadStatusFilter, setUploadStatusFilter] = useState('All');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    // Dual task response state: { [orderId]: { regular?: TaskResponse, marketing?: TaskResponse } }
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    // Fetch dual task responses (regular & marketing) untuk semua moodboard
    useEffect(() => {
        moodboards.forEach(moodboard => {
            const orderId = moodboard.order?.id;
            if (orderId) {
                // Regular
                axios.get(`/task-response/${orderId}/estimasi`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? undefined,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (estimasi):', err);
                        }
                    });
                // Marketing
                axios.get(`/task-response/${orderId}/estimasi?is_marketing=1`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? undefined,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (estimasi):', err);
                        }
                    });
            }
        });
    }, [moodboards]);

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch = 
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search);
        
        const totalFiles = moodboard.kasar_files.length;
        const uploadedFiles = moodboard.kasar_files.filter(f => f.estimasi_file).length;
        const progress = totalFiles > 0 ? (uploadedFiles / totalFiles) * 100 : 0;
        
        let matchesStatus = true;
        if (uploadStatusFilter === 'Selesai') matchesStatus = progress === 100;
        if (uploadStatusFilter === 'Pending') matchesStatus = progress < 100;

        return matchesSearch && matchesStatus;
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

    const handlePmResponse = (orderId: number) => {
        if (window.confirm('Apakah Anda yakin ingin memberikan PM response untuk moodboard ini?')) {
            router.post(`/pm-response/moodboard/${orderId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('PM Response success');
                },
                onError: (errors) => {
                    console.error('PM Response error:', errors);
                    alert('Gagal memberikan PM response');
                }
            });
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

    const openPreviewModal = (url: string, fileName: string, type: string) => {
        setPreviewFile({
            url: url,
            name: fileName,
            type: type
        });
        setShowPreviewModal(true);
    };

    const downloadFile = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isImageFile = (fileName: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const isPdfFile = (fileName: string): boolean => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50 to-stone-50 overflow-x-hidden">
            <Head title="Estimasi Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="estimasi"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-2 pt-20 pb-10 pl-0 transition-all sm:px-6 sm:pl-64">
                <div className="max-w-[1600px] mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                            Estimasi Management
                        </h1>
                        <p className="mt-1.5 text-slate-500 font-medium">
                            Review dan upload file estimasi biaya berdasarkan desain kasar
                        </p>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari project atau client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select 
                                value={uploadStatusFilter}
                                onChange={(e) => setUploadStatusFilter(e.target.value)}
                                className="flex-1 sm:flex-none py-2.5 pl-4 pr-10 rounded-xl border-slate-200 bg-white text-sm text-slate-600 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            >
                                <option value="All">Semua Status Upload</option>
                                <option value="Pending">Pending / Belum Selesai</option>
                                <option value="Selesai">Selesai Upload</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Project & Client</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Design Preview</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Status Upload</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Progress</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right pr-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMoodboards.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm text-slate-400 font-medium">Tidak ada moodboard yang ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMoodboards.map((moodboard) => {
                                        const isExpanded = expandedCards.has(moodboard.id);
                                        const order = moodboard.order;
                                        if (!order) return null;

                                        const taskResponsesData = taskResponses[order.id];
                                        const deadline = taskResponsesData?.regular?.deadline || taskResponsesData?.marketing?.deadline;
                                        
                                        const totalFiles = moodboard.kasar_files.length;
                                        const uploadedFiles = moodboard.kasar_files.filter(f => f.estimasi_file).length;
                                        const progress = totalFiles > 0 ? (uploadedFiles / totalFiles) * 100 : 0;

                                        return (
                                            <Fragment key={moodboard.id}>
                                                <tr 
                                                    className={`group cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/70'}`}
                                                    onClick={() => toggleExpand(moodboard.id)}
                                                >
                                                    {/* Project Info */}
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-800 text-sm leading-tight transition-colors group-hover:text-indigo-600">{order.nama_project}</div>
                                                        <div className="text-xs text-slate-400 mt-1 font-medium italic">{order.company_name}</div>
                                                    </td>

                                                    {/* Deadline */}
                                                    <td className="px-5 py-4">
                                                        <div className="text-xs text-slate-600 font-bold whitespace-nowrap">
                                                            {formatDeadline(deadline)}
                                                        </div>
                                                        {taskResponsesData?.regular?.extend_time! > 0 && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded border border-indigo-100 uppercase italic">
                                                                    {taskResponsesData.regular?.extend_time}x Ext
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Design Preview */}
                                                    <td className="px-5 py-4 text-center">
                                                        <div className="flex items-center justify-center -space-x-1.5">
                                                            {moodboard.kasar_files.slice(0, 3).map((file) => (
                                                                <img 
                                                                    key={file.id}
                                                                    src={file.url} 
                                                                    className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                                                                    alt="Design"
                                                                />
                                                            ))}
                                                            {totalFiles > 3 && (
                                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-300">
                                                                    +{totalFiles - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status Upload */}
                                                    <td className="px-5 py-4 text-center">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase ${progress === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                            <span className={`w-1 h-1 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                            {uploadedFiles}/{totalFiles} FILES
                                                        </div>
                                                    </td>

                                                    {/* Progress Bar */}
                                                    <td className="px-5 py-4 min-w-[120px]">
                                                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div 
                                                                className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-5 py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1 text-slate-300">
                                                            <div className={`p-1.5 rounded-lg transition-all pointer-events-none ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : ''}`}>
                                                                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>

                                                            {isKepalaMarketing && !moodboard.estimasi?.pm_response_time && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handlePmResponse(order.id); }}
                                                                    className="p-1.5 hover:bg-violet-50 hover:text-violet-500 rounded-lg transition-all"
                                                                    title="Marketing Review"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            
                                                            {!moodboard.estimasi && isNotKepalaMarketing && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleResponseEstimasi(moodboard); }}
                                                                    className="p-1.5 hover:bg-indigo-50 hover:text-indigo-500 rounded-lg transition-all"
                                                                    title="Input Estimasi"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={6} className="bg-slate-50/50 px-8 py-8 border-b border-indigo-50">
                                                            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-100/50">
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic leading-none">Management Repository</h4>
                                                                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Setiap file desain kasar harus memiliki file estimasi yang sesuai</p>
                                                                    </div>
                                                                    {taskResponsesData?.regular && 
                                                                     taskResponsesData?.regular?.status !== 'selesai' && 
                                                                     taskResponsesData?.regular?.status !== 'telat_submit' && 
                                                                     !taskResponsesData?.regular?.update_data_time && (
                                                                        <button
                                                                            onClick={() => setShowExtendModal({
                                                                                orderId: order.id,
                                                                                tahap: 'estimasi',
                                                                                isMarketing: false,
                                                                                taskResponse: taskResponsesData.regular!
                                                                            })}
                                                                            className="px-4 py-2 bg-white border border-slate-200 text-[11px] font-bold text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-wider"
                                                                        >
                                                                            Minta Perpanjangan
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {moodboard.kasar_files.map((file) => (
                                                                        <div key={file.id} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:border-indigo-200 transition-colors">
                                                                            <div className="flex gap-4">
                                                                                <img 
                                                                                    src={file.url} 
                                                                                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-slate-100"
                                                                                    alt="Preview"
                                                                                    onClick={() => openPreviewModal(file.url, file.original_name, 'kasar')}
                                                                                />
                                                                                <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                                                                                    <h5 className="text-[10px] font-bold text-slate-700 truncate" title={file.original_name}>
                                                                                        {file.original_name}
                                                                                    </h5>
                                                                                    {file.estimasi_file ? (
                                                                                        <div className="flex flex-col gap-1.5">
                                                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter leading-none italic">✓ Estimasi Ready</span>
                                                                                            <div className="flex gap-1.5">
                                                                                                <button 
                                                                                                    onClick={() => openPreviewModal(file.estimasi_file!.url, file.estimasi_file!.original_name, 'estimasi')}
                                                                                                    className="flex-1 py-1.5 bg-indigo-600 text-white rounded text-[9px] font-black uppercase hover:bg-indigo-700 transition-colors shadow-sm"
                                                                                                >
                                                                                                    Preview
                                                                                                </button>
                                                                                                <button 
                                                                                                    onClick={() => downloadFile(file.estimasi_file!.url, file.estimasi_file!.original_name)}
                                                                                                    className="px-2 py-1.5 bg-slate-50 text-slate-400 rounded hover:bg-slate-100 transition-colors border border-slate-200"
                                                                                                >
                                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                                                    </svg>
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col gap-2 transition-all p-1">
                                                                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter leading-none italic">Waiting Estimation</span>
                                                                                            {moodboard.estimasi && isNotKepalaMarketing ? (
                                                                                                <button 
                                                                                                    onClick={() => openUploadModal(moodboard, file)}
                                                                                                    className="py-1.5 bg-white border border-dashed border-indigo-200 text-indigo-500 rounded text-[9px] font-black uppercase hover:bg-indigo-50 transition-colors shadow-sm"
                                                                                                >
                                                                                                    Upload
                                                                                                </button>
                                                                                            ) : (
                                                                                                <div className="w-full h-2 bg-slate-100 rounded-full animate-pulse"></div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">File Authentication</h3>
                                <button onClick={() => setShowUploadModal(false)} className="hover:bg-slate-50 p-2 rounded-xl transition-colors text-slate-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <img src={selectedKasarFile?.url} className="w-12 h-12 rounded-xl object-cover ring-4 ring-white shadow-sm" />
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{selectedKasarFile?.original_name}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">Reference Document</div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <input
                                        type="file"
                                        id="estimasi-file"
                                        className="hidden"
                                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                        accept=".pdf,image/*"
                                    />
                                    <label
                                        htmlFor="estimasi-file"
                                        className={`group block border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all duration-300 text-center ${
                                            uploadFile ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white shadow-inner'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-all ${uploadFile ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-200 text-slate-400 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:text-indigo-500'}`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-indigo-600">
                                                {uploadFile ? uploadFile.name : 'Verify & Upload'}
                                            </span>
                                            <span className="text-[8px] text-slate-300 mt-2 uppercase font-bold">Standard PDF / JPEG protocol</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleUploadEstimasi}
                                    disabled={loading || !uploadFile}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black disabled:bg-slate-50 disabled:text-slate-200 transition-all active:scale-[0.98] text-[10px]"
                                >
                                    {loading ? 'Processing...' : 'Deploy Estimation'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreviewModal && previewFile && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-500">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-white/20">
                            <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{previewFile.name}</h3>
                                    <p className="text-[9px] text-slate-300 uppercase font-black tracking-widest italic mt-0.5">{previewFile.type === 'kasar' ? 'Visual Architect Draft' : 'Validated Financial Estimation'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                        className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button onClick={() => setShowPreviewModal(false)} className="p-3 bg-slate-50 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-auto p-12 bg-slate-100/30">
                                {isImageFile(previewFile.name) ? (
                                    <div className="flex items-center justify-center min-h-[50vh]">
                                        <img src={previewFile.url} className="max-w-full rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] ring-8 ring-white" alt="Preview" />
                                    </div>
                                ) : isPdfFile(previewFile.name) ? (
                                    <iframe src={previewFile.url} className="w-full h-full min-h-[65vh] border-0 rounded-3xl bg-white shadow-2xl" />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic leading-relaxed">System cannot render this format extension.<br/>Please proceed with manual decryption/download.</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-8 py-6 border-t border-slate-50 flex justify-end gap-4 bg-white/80 backdrop-blur-md">
                                <button onClick={() => setShowPreviewModal(false)} className="px-8 py-3 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Abort Review</button>
                                <button 
                                    onClick={() => downloadFile(previewFile.url, previewFile.name)}
                                    className="px-12 py-3 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    Download Object
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