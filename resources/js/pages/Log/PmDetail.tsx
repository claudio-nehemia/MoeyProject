import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Stage {
    nama_tahapan: string;
    start_date: string | null;
    end_date: string | null;
    actual_date: string | null;
    delay_days: number | null;
    status: 'planned' | 'in_progress' | 'done_on_time' | 'done_early' | 'done_late' | 'overdue';
    notes: string | null;
    uploaded_by: string | null;
    evidence_path: string | null;
}

interface Product {
    id: number;
    nama_produk: string;
    nama_ruangan: string | null;
    current_stage: string | null;
    progress: number;
    stages: Stage[];
}

interface Project {
    id: number;
    nama_project: string;
    customer_name: string;
    company_name: string | null;
    products: Product[];
}

interface Props {
    project: Project;
}

export default function PmDetail({ project }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number>(
        project.products[0]?.id || 0
    );
    const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const selectedProduct = project.products.find((p) => p.id === selectedProductId);
    const completedStages = selectedProduct?.stages.filter((s) => s.actual_date) || [];
    const productImages = selectedProduct?.stages.filter((s) => s.evidence_path) || [];

    const getPmStageStatusBadge = (status: string, delayDays: number | null) => {
        switch (status) {
            case 'done_on_time':
                return (
                    <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 text-xs font-semibold">
                        Tepat Waktu
                    </span>
                );
            case 'done_early':
                return (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                        Cepat {delayDays} Hari
                    </span>
                );
            case 'done_late':
                return (
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-xs font-semibold">
                        Terlambat {delayDays} Hari
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold animate-pulse">
                        Terlambat {delayDays} Hari (Belum Selesai)
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold animate-pulse">
                        Sedang Berjalan
                    </span>
                );
            case 'planned':
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold">
                        Direncanakan
                    </span>
                );
        }
    };

    const formatDateOnly = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50">
            <Head title={`PM Detail - ${project.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="log"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-4 pt-20 pb-8 pl-4 transition-all sm:px-6 lg:pl-64">
                <div className="mx-auto max-w-[1600px]">
                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/log?tab=pm"
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
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
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Detail Progress Project Management
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Project: <strong className="text-slate-800">{project.nama_project}</strong>
                                </p>
                            </div>
                        </div>
                        {/* <button
                            onClick={() => setShowNotesModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-150 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-250 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Catatan Pengerjaan Progress
                        </button> */}
                    </div>

                    {/* Project Info Card */}
                    <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Informasi Proyek</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-4">
                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Project</span>
                                <span className="mt-1 block text-base font-bold text-slate-850">{project.nama_project}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</span>
                                <span className="mt-1 block text-base font-bold text-slate-850">{project.customer_name}</span>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4">
                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</span>
                                <span className="mt-1 block text-base font-bold text-slate-850">{project.company_name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Products Timeline List */}
                    <div className="space-y-6">
                        {project.products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-slate-500 italic">Tidak ada produk dalam item pekerjaan proyek ini.</p>
                            </div>
                        ) : (
                            project.products.map((product) => (
                                <div key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200">
                                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900">{product.nama_produk}</h4>
                                                <p className="text-sm text-slate-500">
                                                    Ruangan: <span className="font-semibold text-slate-700">{product.nama_ruangan || 'Tanpa Ruangan'}</span>
                                                    {product.current_stage && (
                                                        <>
                                                            <span className="mx-2 text-slate-300">•</span>
                                                            Tahap Saat Ini: <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{product.current_stage}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="w-full sm:w-64">
                                                <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                                                    <span>Progress Produksi</span>
                                                    <span className="font-bold text-indigo-650">{product.progress}%</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                                                        style={{ width: `${product.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead>
                                                    <tr className="bg-slate-50/50">
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Tahapan</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Target (Workplan)</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Realisasi (Next)</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Catatan Bukti</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {product.stages.map((stage, sIdx) => (
                                                        <tr key={sIdx} className="hover:bg-slate-50/30">
                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                                                {stage.nama_tahapan}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                                {stage.start_date ? (
                                                                    <span>
                                                                        {formatDateOnly(stage.start_date)}
                                                                        <span className="mx-1.5 text-slate-450">s/d</span>
                                                                        <strong className="text-slate-700">{formatDateOnly(stage.end_date)}</strong>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">Belum diatur</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                                {stage.actual_date ? (
                                                                    <div>
                                                                        <span className="font-semibold text-slate-700">
                                                                            {formatDateTime(stage.actual_date)}
                                                                        </span>
                                                                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                                            Oleh: {stage.uploaded_by || 'System'}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">Belum selesai</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {getPmStageStatusBadge(stage.status, stage.delay_days)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <div className="flex flex-col gap-2">
                                                                    <span className="text-slate-700">{stage.notes || '-'}</span>
                                                                    {stage.evidence_path && (
                                                                        <div className="flex">
                                                                            <img
                                                                                src={`/storage/${stage.evidence_path}`}
                                                                                alt={stage.nama_tahapan}
                                                                                className="h-12 w-16 object-cover rounded border border-slate-200 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                                                                onClick={() => setSelectedZoomImage(`/storage/${stage.evidence_path}`)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>            {/* Catatan Pengerjaan Progress Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowNotesModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors z-10"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal Header */}
                        <div className="p-6 pb-3 flex-shrink-0 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 pr-8">
                                Catatan Pengerjaan Progress
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Proyek: <span className="font-semibold text-slate-700">{project.nama_project}</span>
                            </p>

                            {/* Product Switch Selector */}
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Pilih Produk (Switch)
                                </label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    {project.products.map((prod) => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.nama_produk} {prod.nama_ruangan ? `(${prod.nama_ruangan})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Body Container */}
                        <div className="flex-1 overflow-y-auto p-6 pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                            {/* Product Images Horizontal Gallery (Gambarnya dibuat berderet) */}
                            {productImages.length > 0 && (
                                <div className="mb-6 rounded-lg border border-slate-150 bg-slate-50/50 p-4">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                                        Galeri Foto Progress (Berderet)
                                    </h5>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                        {productImages.map((stage, i) => (
                                            <div key={i} className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white p-1">
                                                <img
                                                    src={`/storage/${stage.evidence_path}`}
                                                    alt={stage.nama_tahapan}
                                                    className="h-20 w-28 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setSelectedZoomImage(`/storage/${stage.evidence_path}`)}
                                                />
                                                <div className="mt-1 text-[9px] font-bold text-center text-slate-650 truncate w-26 px-0.5">
                                                    {stage.nama_tahapan}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Stages Notes Timeline */}
                            <h5 className="text-xs font-bold text-slate-505 uppercase tracking-wider mb-3">
                                Timeline Catatan & Bukti
                            </h5>

                            {completedStages.length === 0 ? (
                                <p className="text-sm text-slate-450 italic py-6 text-center">
                                    Belum ada progress pengerjaan yang diselesaikan untuk produk ini.
                                </p>
                            ) : (
                                <div className="relative border-l border-slate-200 pl-6 space-y-6">
                                    {completedStages.map((stage, index) => (
                                        <div key={index} className="relative">
                                            {/* Timeline Node dot */}
                                            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-white">
                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                            </span>
                                            <div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {stage.nama_tahapan}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {formatDateTime(stage.actual_date)}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-indigo-650 font-bold mt-0.5">
                                                    Oleh: {stage.uploaded_by || 'System'}
                                                </div>
                                                
                                                {/* Text and Image Flex Row (Gambarnya dibuat berderet / berdampingan) */}
                                                <div className="mt-2 flex flex-col md:flex-row gap-4 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                        {stage.notes || <span className="text-slate-400 italic">Tidak ada catatan tertulis</span>}
                                                    </div>
                                                    {stage.evidence_path && (
                                                        <div className="flex-shrink-0">
                                                            <img
                                                                src={`/storage/${stage.evidence_path}`}
                                                                alt={stage.nama_tahapan}
                                                                className="h-16 w-24 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                                                onClick={() => setSelectedZoomImage(`/storage/${stage.evidence_path}`)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-150 flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setShowNotesModal(false)}
                                className="rounded-lg border border-slate-350 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Zoom Modal */}
            {selectedZoomImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setSelectedZoomImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-lg bg-white p-2">
                        <img
                            src={selectedZoomImage}
                            alt="Zoomed Evidence"
                            className="max-w-full max-h-[85vh] object-contain rounded"
                        />
                        <button
                            onClick={() => setSelectedZoomImage(null)}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
