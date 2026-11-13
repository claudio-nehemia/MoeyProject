import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
    Check,
    X as XIcon,
    Calendar,
    Plane,
    Activity,
    Briefcase,
    Clock,
    FileText,
    User,
    CheckCircle,
    MapPin,
    Paperclip,
    ExternalLink,
    History,
    Inbox,
    Search,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface LeaveRequestItem {
    id: string;
    tanggal: string;
    created_at?: string | null;
    created_at_raw?: string | null;
    updated_at?: string | null;
    updated_at_raw?: string | null;
    jam_pengajuan?: string | null;
    waktu_pengajuan?: string | null;
    jam_diproses?: string | null;
    waktu_diproses?: string | null;
    status?: number;
    keterangan: string;
    dari: string;
    sampai: string;
    tipe: string;
    nama_karyawan: string;
    nik: string;
    jam_in?: string | null;
    jam_out?: string | null;
    doc_url?: string | null;
}

interface Props {
    pendingList: LeaveRequestItem[];
    historyList?: LeaveRequestItem[];
}

type FilterType = 'All' | 'Cuti' | 'Izin Absen' | 'Sakit' | 'Dinas' | 'Lembur' | 'Koreksi Absen';
type ViewTab = 'pending' | 'history';
type HistoryStatusFilter = 'all' | 'approved' | 'rejected';

export default function Approval({ pendingList = [], historyList = [] }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [processing, setProcessing] = useState(false);
    const [viewTab, setViewTab] = useState<ViewTab>('pending');
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAction = (id: string, tipe: string, action: '1' | '2') => {
        const actionText = action === '1' ? 'menyetujui' : 'menolak';
        if (confirm(`Apakah Anda yakin ingin ${actionText} pengajuan ini?`)) {
            setProcessing(true);
            router.post('/approve-cuti', { id, tipe, action }, {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    alert('Pengajuan berhasil diproses.');
                }
            });
        }
    };

    // Source list based on active view tab (Pending vs History)
    const baseList = viewTab === 'pending' ? pendingList : historyList;

    // Apply status filter (for history view) & search query before computing category counts
    const statusAndSearchFiltered = baseList.filter((item) => {
        if (viewTab === 'history') {
            if (historyStatusFilter === 'approved' && Number(item.status) !== 1) return false;
            if (historyStatusFilter === 'rejected' && Number(item.status) !== 2) return false;
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchName = item.nama_karyawan?.toLowerCase().includes(q);
            const matchNik = item.nik?.toLowerCase().includes(q);
            const matchKet = item.keterangan?.toLowerCase().includes(q);
            const matchTipe = item.tipe?.toLowerCase().includes(q);
            if (!matchName && !matchNik && !matchKet && !matchTipe) return false;
        }
        return true;
    });

    // Calculate category counts for the current view
    const countAll = statusAndSearchFiltered.length;
    const countCuti = statusAndSearchFiltered.filter(item => item.tipe === 'Cuti').length;
    const countIzinAbsen = statusAndSearchFiltered.filter(item => item.tipe === 'Izin Absen').length;
    const countSakit = statusAndSearchFiltered.filter(item => item.tipe === 'Sakit').length;
    const countDinas = statusAndSearchFiltered.filter(item => item.tipe === 'Dinas').length;
    const countLembur = statusAndSearchFiltered.filter(item => item.tipe === 'Lembur').length;
    const countKoreksi = statusAndSearchFiltered.filter(item => item.tipe === 'Koreksi Absen').length;

    // Overall history stats
    const totalApproved = historyList.filter(item => Number(item.status) === 1).length;
    const totalRejected = historyList.filter(item => Number(item.status) === 2).length;

    // Final filtered list
    const filteredList = activeFilter === 'All'
        ? statusAndSearchFiltered
        : statusAndSearchFiltered.filter(item => item.tipe === activeFilter);

    const getTipeBadgeClass = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return 'bg-purple-50 text-purple-700 border border-purple-200';
            case 'Izin Absen': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            case 'Sakit': return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'Dinas': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'Lembur': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'Koreksi Absen': return 'bg-teal-50 text-teal-700 border border-teal-200';
            default: return 'bg-stone-50 text-stone-700 border border-stone-200';
        }
    };

    const getTipeIcon = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return <Plane size={13} className="text-purple-600" />;
            case 'Izin Absen': return <FileText size={13} className="text-indigo-600" />;
            case 'Sakit': return <Activity size={13} className="text-rose-600" />;
            case 'Dinas': return <Briefcase size={13} className="text-blue-600" />;
            case 'Lembur': return <Clock size={13} className="text-amber-600" />;
            case 'Koreksi Absen': return <MapPin size={13} className="text-teal-600" />;
            default: return <FileText size={13} className="text-stone-500" />;
        }
    };

    const getFriendlyTipe = (tipe: string) => {
        if (tipe === 'Koreksi Absen') return 'Koreksi GPS';
        return tipe;
    };

    return (
        <>
            <Head title="Persetujuan Izin / Cuti Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.35s ease-out forwards; }
                .tab-transition {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 18px -6px rgba(0, 0, 0, 0.06);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="approve-cuti" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-stone-50/80">
                <div className="p-3 mt-20 space-y-5 fadeInUp max-w-7xl mx-auto">

                    {/* Header & Mode Switcher */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold tracking-tight text-slate-800">
                                            Persetujuan Izin & Cuti Karyawan
                                        </h1>
                                        <span className="inline-flex px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                                            Approval Center
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        Kelola antrean permohonan izin, cuti, sakit, dinas, lembur, serta pantau riwayat keputusan yang telah diproses.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Segmented Tab Switcher: Antrean vs Riwayat */}
                        <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/80 self-start md:self-auto">
                            <button
                                type="button"
                                onClick={() => setViewTab('pending')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                    viewTab === 'pending'
                                        ? 'bg-white text-slate-800 shadow-xs border border-stone-200/60'
                                        : 'text-stone-600 hover:text-slate-800'
                                }`}
                            >
                                <Inbox size={14} className={viewTab === 'pending' ? 'text-amber-600' : 'text-stone-400'} />
                                <span>Antrean Menunggu</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    viewTab === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-stone-200/80 text-stone-600'
                                }`}>
                                    {pendingList.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewTab('history')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                    viewTab === 'history'
                                        ? 'bg-white text-slate-800 shadow-xs border border-stone-200/60'
                                        : 'text-stone-600 hover:text-slate-800'
                                }`}
                            >
                                <History size={14} className={viewTab === 'history' ? 'text-slate-700' : 'text-stone-400'} />
                                <span>Riwayat Keputusan</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    viewTab === 'history'
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-stone-200/80 text-stone-600'
                                }`}>
                                    {historyList.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Category Filter Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {/* Tab All */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('All')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'All'
                                    ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                {viewTab === 'pending' ? 'Semua Antrean' : 'Semua Riwayat'}
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countAll}</span>
                        </button>

                        {/* Tab Cuti */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Cuti')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Cuti'
                                    ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <Plane size={11} className={activeFilter === 'Cuti' ? 'text-purple-200' : 'text-purple-600'} />
                                Cuti
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countCuti}</span>
                        </button>

                        {/* Tab Izin Absen */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Izin Absen')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Izin Absen'
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <FileText size={11} className={activeFilter === 'Izin Absen' ? 'text-indigo-200' : 'text-indigo-600'} />
                                Izin Absen
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countIzinAbsen}</span>
                        </button>

                        {/* Tab Sakit */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Sakit')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Sakit'
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <Activity size={11} className={activeFilter === 'Sakit' ? 'text-rose-200' : 'text-rose-600'} />
                                Izin Sakit
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countSakit}</span>
                        </button>

                        {/* Tab Dinas */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Dinas')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Dinas'
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <Briefcase size={11} className={activeFilter === 'Dinas' ? 'text-blue-200' : 'text-blue-600'} />
                                Dinas Luar
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countDinas}</span>
                        </button>

                        {/* Tab Lembur */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Lembur')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Lembur'
                                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <Clock size={11} className={activeFilter === 'Lembur' ? 'text-amber-200' : 'text-amber-600'} />
                                Lembur
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countLembur}</span>
                        </button>

                        {/* Tab Koreksi */}
                        <button
                            type="button"
                            onClick={() => setActiveFilter('Koreksi Absen')}
                            className={`p-3 rounded-xl border text-left tab-transition flex flex-col justify-between ${
                                activeFilter === 'Koreksi Absen'
                                    ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                                <MapPin size={11} className={activeFilter === 'Koreksi Absen' ? 'text-teal-200' : 'text-teal-600'} />
                                Koreksi GPS
                            </span>
                            <span className="text-xl font-black mt-1.5 leading-none">{countKoreksi}</span>
                        </button>
                    </div>

                    {/* Filter Bar: Search & Status Sub-filter (for Riwayat) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-stone-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xs font-extrabold text-stone-600 uppercase tracking-wider">
                                {viewTab === 'pending' ? 'Daftar Antrean' : 'Daftar Riwayat'} ({activeFilter === 'All' ? 'Semua Kategori' : getFriendlyTipe(activeFilter)}):
                                <span className="ml-1.5 text-slate-800 font-black">{filteredList.length} Data</span>
                            </h2>

                            {viewTab === 'history' && (
                                <div className="inline-flex items-center gap-1.5 ml-0 sm:ml-3 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-stone-200 sm:pl-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                            historyStatusFilter === 'all'
                                                ? 'bg-slate-800 text-white'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                    >
                                        Semua ({historyList.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter('approved')}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                            historyStatusFilter === 'approved'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70'
                                        }`}
                                    >
                                        <CheckCircle2 size={12} />
                                        Disetujui ({totalApproved})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHistoryStatusFilter('rejected')}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                            historyStatusFilter === 'rejected'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
                                        }`}
                                    >
                                        <XCircle size={12} />
                                        Ditolak ({totalRejected})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Search input */}
                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, NIK, atau alasan..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-700 placeholder:text-stone-400"
                            />
                        </div>
                    </div>

                    {/* Cards List of Requests */}
                    {filteredList.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-12 text-center text-stone-400">
                            {viewTab === 'pending' ? (
                                <>
                                    <CheckCircle className="mx-auto mb-3 text-stone-300" size={36} />
                                    <p className="font-semibold text-sm text-stone-600">Tidak ada antrean menunggu</p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        Semua permohonan pada kategori ({activeFilter}) sudah selesai divalidasi.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <History className="mx-auto mb-3 text-stone-300" size={36} />
                                    <p className="font-semibold text-sm text-stone-600">Belum ada riwayat keputusan</p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        Belum ada data izin atau cuti yang disetujui maupun ditolak sesuai filter saat ini.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredList.map((item) => {
                                const submissionDateObj = item.created_at ? new Date(item.created_at) : new Date(item.tanggal);
                                const submittedDate = submissionDateObj.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                });

                                const submittedTime = item.jam_pengajuan || (item.created_at ? submissionDateObj.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                }).replace(/\./g, ':') : null);

                                const isLembur = item.tipe === 'Lembur';

                                const dateFrom = isLembur
                                    ? item.dari
                                    : new Date(item.dari).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                      });

                                const dateTo = isLembur
                                    ? item.sampai
                                    : new Date(item.sampai).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                      });

                                const isApproved = Number(item.status) === 1;
                                const isRejected = Number(item.status) === 2;

                                return (
                                    <div
                                        key={`${viewTab}-${item.tipe}-${item.id}`}
                                        className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs card-hover-effect transition-all ${
                                            viewTab === 'history'
                                                ? isApproved
                                                    ? 'border-stone-200 border-l-4 border-l-emerald-500'
                                                    : 'border-stone-200 border-l-4 border-l-rose-500'
                                                : 'border-stone-200'
                                        }`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                                            {/* Column 1: Applicant Profile */}
                                            <div className="flex items-start gap-3.5 lg:w-1/3">
                                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 flex-shrink-0 border border-stone-200">
                                                    <User size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                                            {item.nama_karyawan}
                                                        </h3>
                                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[9px] font-bold border border-stone-200 font-mono">
                                                            {item.nik}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                                                        <span>Diajukan:</span>
                                                        <span className="text-stone-700 font-semibold">{submittedDate}</span>
                                                        {submittedTime && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80 font-mono text-[9px] font-bold">
                                                                <Clock size={10} className="text-amber-600" />
                                                                {submittedTime} WIB
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-stone-400 font-mono mt-1">
                                                        Kode: #{item.id}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Details of leave & Dates */}
                                            <div className="flex-1 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                    {/* Category & Date Ranges */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div>
                                                            <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1 block">
                                                                Tipe & Tanggal Izin
                                                            </span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getTipeBadgeClass(item.tipe)}`}>
                                                                    {getTipeIcon(item.tipe)}
                                                                    {getFriendlyTipe(item.tipe)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mt-0.5">
                                                            <Calendar size={12} className="text-stone-400 flex-shrink-0" />
                                                            {item.dari === item.sampai ? (
                                                                <span>{dateFrom}</span>
                                                            ) : (
                                                                <span>{dateFrom} s/d {dateTo}</span>
                                                            )}
                                                        </div>
                                                        {(item.jam_in || item.jam_out) && (
                                                            <div className="text-[11px] text-teal-700 font-semibold flex items-center gap-1.5">
                                                                <Clock size={11} className="text-teal-600" />
                                                                <span>
                                                                    Koreksi Jam: {item.jam_in || '-'} — {item.jam_out || '-'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Reason / Keterangan */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1">
                                                            Alasan / Keterangan
                                                        </span>
                                                        <p
                                                            className="text-xs text-stone-600 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/70 leading-relaxed line-clamp-2"
                                                            title={item.keterangan}
                                                        >
                                                            {item.keterangan || 'Tidak ada keterangan tambahan'}
                                                        </p>
                                                        {item.doc_url && (
                                                            <div className="mt-2">
                                                                <a
                                                                    href={item.doc_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                                                                >
                                                                    <Paperclip size={12} className="text-indigo-600" />
                                                                    <span>Lihat Lampiran</span>
                                                                    <ExternalLink size={10} className="text-indigo-400" />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Column 3: Action Buttons (Pending) OR Status Badge (History) */}
                                            <div className="flex items-center justify-end gap-2 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0 flex-shrink-0">
                                                {viewTab === 'pending' ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(item.id, item.tipe, '1')}
                                                            disabled={processing}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                                                        >
                                                            <Check size={13} />
                                                            Setujui
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleAction(item.id, item.tipe, '2')}
                                                            disabled={processing}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all disabled:opacity-50"
                                                        >
                                                            <XIcon size={13} />
                                                            Tolak
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        {isApproved ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                                                                <CheckCircle2 size={14} className="text-emerald-600" />
                                                                Disetujui (ACC)
                                                            </span>
                                                        ) : isRejected ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold">
                                                                <XCircle size={14} className="text-rose-600" />
                                                                Ditolak
                                                            </span>
                                                        ) : null}

                                                        {item.waktu_diproses && (
                                                            <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                                                                <Clock size={10} />
                                                                Diproses: {item.waktu_diproses} WIB
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
