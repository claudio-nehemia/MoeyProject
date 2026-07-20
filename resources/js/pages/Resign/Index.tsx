import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
    AlertCircle,
    Calendar,
    Check,
    FileText,
    Search,
    UserCheck,
    X,
    XCircle,
    UserX,
    HelpCircle,
    Clock,
    RotateCcw
} from 'lucide-react';

interface Karyawan {
    nama_karyawan: string;
    nik_show: string;
}

interface User {
    name: string;
}

interface KaryawanResign {
    id: number;
    nik: string;
    tanggal_pengajuan: string;
    tanggal_efektif: string;
    alasan: string;
    status_approval: 'Pending' | 'Disetujui' | 'Ditolak';
    catatan_hrd: string | null;
    approved_by: number | null;
    karyawan: Karyawan;
    approver: User | null;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    resigns: Paginator<KaryawanResign>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ResignIndex({ resigns, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [mounted, setMounted] = useState(false);
    
    // Search & Filter state
    const [searchVal, setSearchVal] = useState(filters.search || "");
    const [statusVal, setStatusVal] = useState(filters.status || "");

    // Modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedResign, setSelectedResign] = useState<KaryawanResign | null>(null);

    // Form
    const { data, setData, post, processing, errors, reset } = useForm({
        catatan_hrd: ''
    });

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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/resign', { search: searchVal, status: statusVal }, { preserveState: true });
    };

    const handleStatusChange = (val: string) => {
        setStatusVal(val);
        router.get('/resign', { search: searchVal, status: val }, { preserveState: true });
    };

    const handleResetFilters = () => {
        setSearchVal("");
        setStatusVal("");
        router.get('/resign', {}, { preserveState: true });
    };

    const openApproveModal = (resign: KaryawanResign) => {
        setSelectedResign(resign);
        setData('catatan_hrd', '');
        setShowApproveModal(true);
    };

    const openRejectModal = (resign: KaryawanResign) => {
        setSelectedResign(resign);
        setData('catatan_hrd', '');
        setShowRejectModal(true);
    };

    const handleApproveSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedResign) return;

        post(`/resign/${selectedResign.id}/approve`, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedResign(null);
                reset();
            }
        });
    };

    const handleRejectSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedResign) return;
        if (!data.catatan_hrd.trim()) {
            alert('Catatan penolakan harus diisi!');
            return;
        }

        post(`/resign/${selectedResign.id}/reject`, {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedResign(null);
                reset();
            }
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: 'Pending' | 'Disetujui' | 'Ditolak') => {
        switch (status) {
            case 'Disetujui':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                        <Check size={11} />
                        Disetujui
                    </span>
                );
            case 'Ditolak':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase">
                        <X size={11} />
                        Ditolak
                    </span>
                );
            case 'Pending':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-250 text-amber-800 text-[10px] font-black uppercase">
                        <Clock size={11} />
                        Pending
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Manajemen Resign Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="resign" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/5 to-stone-100">
                <div className="p-3 mt-20 space-y-6 fadeInUp">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    👋 Review Pengunduran Diri (Resign)
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    HR Approval
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Tinjau pengajuan resign karyawan, berikan persetujuan atau penolakan, serta catat riwayat HRD.
                            </p>
                        </div>
                    </div>

                    {/* Search & Filter Panel */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4.5">
                        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2 space-y-1">
                                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                                    Cari Karyawan
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Cari berdasarkan nama atau NIK..."
                                        value={searchVal}
                                        onChange={(e) => setSearchVal(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                                    Status Approval
                                </label>
                                <select
                                    value={statusVal}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors text-center"
                                >
                                    Filter
                                </button>
                                {(filters.search || filters.status || searchVal || statusVal) && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                                        title="Reset Filter"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Resign Requests Table */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600">
                                <thead className="text-[10px] text-stone-500 font-bold uppercase tracking-wider bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-5 py-4">Nama Karyawan</th>
                                        <th scope="col" className="px-5 py-4">Tanggal Pengajuan</th>
                                        <th scope="col" className="px-5 py-4">Tanggal Efektif</th>
                                        <th scope="col" className="px-5 py-4">Alasan</th>
                                        <th scope="col" className="px-5 py-4 text-center">Status</th>
                                        <th scope="col" className="px-5 py-4">Approver</th>
                                        <th scope="col" className="px-5 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {resigns.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <UserX size={36} className="text-stone-300" />
                                                    <p className="font-semibold text-sm">Tidak ada pengajuan resign.</p>
                                                    <p className="text-xs text-stone-400">Semua pengajuan sudah selesai ditinjau.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        resigns.data.map((resign) => (
                                            <tr key={resign.id} className="hover:bg-amber-50/10 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="font-extrabold text-stone-900 text-sm">
                                                        {resign.karyawan.nama_karyawan}
                                                    </div>
                                                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                                        NIK: {resign.karyawan.nik_show || resign.nik}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-stone-700 font-medium">
                                                    {formatDate(resign.tanggal_pengajuan)}
                                                </td>
                                                <td className="px-5 py-4 text-stone-700 font-bold">
                                                    {formatDate(resign.tanggal_efektif)}
                                                </td>
                                                <td className="px-5 py-4 max-w-xs">
                                                    <p className="line-clamp-2 text-stone-600" title={resign.alasan}>
                                                        {resign.alasan}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {getStatusBadge(resign.status_approval)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {resign.approver ? (
                                                        <div>
                                                            <p className="font-bold text-stone-850">{resign.approver.name}</p>
                                                            {resign.catatan_hrd && (
                                                                <p className="text-[10px] text-stone-400 italic mt-0.5 line-clamp-1" title={resign.catatan_hrd}>
                                                                    HRD: "{resign.catatan_hrd}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-stone-400 italic text-[11px]">Belum direview</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {resign.status_approval === 'Pending' ? (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => openApproveModal(resign)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-[10px] font-black rounded-lg shadow-sm transition-colors"
                                                            >
                                                                Setujui
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(resign)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-800 text-[10px] font-black rounded-lg shadow-sm transition-colors"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-stone-400 text-[11px] font-bold">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Links */}
                        {resigns.total > resigns.per_page && (
                            <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-stone-150">
                                <div className="flex justify-between flex-1 sm:hidden">
                                    {resigns.prev_page_url ? (
                                        <Link
                                            href={resigns.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                        >
                                            Sebelumnya
                                        </Link>
                                    ) : (
                                        <span className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-stone-300 bg-white border border-stone-200 rounded-lg cursor-not-allowed">
                                            Sebelumnya
                                        </span>
                                    )}
                                    {resigns.next_page_url ? (
                                        <Link
                                            href={resigns.next_page_url}
                                            className="relative inline-flex items-center px-4 py-2 ml-3 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                        >
                                            Selanjutnya
                                        </Link>
                                    ) : (
                                        <span className="relative inline-flex items-center px-4 py-2 ml-3 text-xs font-bold text-stone-300 bg-white border border-stone-200 rounded-lg cursor-not-allowed">
                                            Selanjutnya
                                        </span>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">
                                            Menampilkan <span className="font-bold text-stone-800">{resigns.from || 0}</span> sampai{' '}
                                            <span className="font-bold text-stone-800">{resigns.to || 0}</span> dari{' '}
                                            <span className="font-bold text-stone-800">{resigns.total}</span> data
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                                            {resigns.links.map((link, idx) => {
                                                let label = link.label;
                                                if (label.includes('Previous')) {
                                                    label = '‹';
                                                } else if (label.includes('Next')) {
                                                    label = '›';
                                                }

                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="relative inline-flex items-center px-3 py-1.5 border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold cursor-not-allowed first:rounded-l-lg last:rounded-r-lg"
                                                            dangerouslySetInnerHTML={{ __html: label }}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-bold transition-colors first:rounded-l-lg last:rounded-r-lg ${
                                                            link.active
                                                                ? 'z-10 bg-amber-500 border-amber-500 text-white'
                                                                : 'bg-white border-stone-200 text-stone-600 hover:bg-amber-50 hover:text-amber-600'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: label }}
                                                    />
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Approve Resignation Modal */}
            <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="md">
                <div className="p-6 relative">
                    <button
                        onClick={() => setShowApproveModal(false)}
                        className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-850 text-base">
                                Setujui Pengunduran Diri
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Karyawan: {selectedResign?.karyawan.nama_karyawan} ({selectedResign?.karyawan.nik_show || selectedResign?.nik})
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleApproveSubmit} className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-650" />
                            <div>
                                <p className="font-bold">Perhatian Penting:</p>
                                <p className="mt-0.5 leading-normal">
                                    Menyetujui permohonan ini akan menjadwalkan penonaktifan profil karyawan secara otomatis pada tanggal efektif (<strong>{formatDate(selectedResign?.tanggal_efektif || '')}</strong>).
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Catatan HRD (Opsional)
                            </label>
                            <textarea
                                value={data.catatan_hrd}
                                onChange={(e) => setData('catatan_hrd', e.target.value)}
                                placeholder="Masukkan catatan HRD atau tanggapan terkait persetujuan resign..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none resize-none"
                            />
                            {errors.catatan_hrd && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.catatan_hrd}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-colors shadow-md"
                            >
                                {processing ? 'Memproses...' : 'Setujui Pengajuan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Reject Resignation Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} maxWidth="md">
                <div className="p-6 relative">
                    <button
                        onClick={() => setShowRejectModal(false)}
                        className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                            <UserX size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-850 text-base">
                                Tolak Pengunduran Diri
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Karyawan: {selectedResign?.karyawan.nama_karyawan} ({selectedResign?.karyawan.nik_show || selectedResign?.nik})
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Catatan / Alasan Penolakan HRD <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.catatan_hrd}
                                onChange={(e) => setData('catatan_hrd', e.target.value)}
                                placeholder="Jelaskan alasan HRD menolak pengajuan resign ini (wajib diisi)..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none resize-none"
                                required
                            />
                            {errors.catatan_hrd && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.catatan_hrd}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-colors shadow-md"
                            >
                                {processing ? 'Memproses...' : 'Tolak Pengajuan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
