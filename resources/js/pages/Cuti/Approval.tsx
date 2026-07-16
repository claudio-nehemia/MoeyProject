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
    UserCheck,
    MapPin,
    Smartphone
} from 'lucide-react';

interface PendingRequest {
    id: string;
    tanggal: string;
    keterangan: string;
    dari: string;
    sampai: string;
    tipe: string;
    nama_karyawan: string;
    nik: string;
}

interface Props {
    pendingList: PendingRequest[];
}

type FilterType = 'All' | 'Cuti' | 'Sakit' | 'Dinas' | 'Lembur' | 'Koreksi Absen';

export default function Approval({ pendingList }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [processing, setProcessing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

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

    // Calculate category counts
    const countAll = pendingList.length;
    const countCuti = pendingList.filter(item => item.tipe === 'Cuti').length;
    const countSakit = pendingList.filter(item => item.tipe === 'Sakit').length;
    const countDinas = pendingList.filter(item => item.tipe === 'Dinas').length;
    const countLembur = pendingList.filter(item => item.tipe === 'Lembur').length;
    const countKoreksi = pendingList.filter(item => item.tipe === 'Koreksi Absen').length;

    // Filtered list
    const filteredList = activeFilter === 'All' 
        ? pendingList 
        : pendingList.filter(item => item.tipe === activeFilter);

    const getTipeBadgeClass = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return 'bg-purple-50 text-purple-700 border border-purple-100';
            case 'Sakit': return 'bg-rose-50 text-rose-700 border border-rose-100';
            case 'Dinas': return 'bg-blue-50 text-blue-700 border border-blue-100';
            case 'Lembur': return 'bg-amber-50 text-amber-700 border border-amber-100';
            case 'Koreksi Absen': return 'bg-teal-50 text-teal-700 border border-teal-100';
            default: return 'bg-stone-50 text-stone-700 border border-stone-150';
        }
    };

    const getTipeIcon = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return <Plane size={14} className="text-purple-600" />;
            case 'Sakit': return <Activity size={14} className="text-rose-600" />;
            case 'Dinas': return <Briefcase size={14} className="text-blue-600" />;
            case 'Lembur': return <Clock size={14} className="text-amber-600" />;
            case 'Koreksi Absen': return <MapPin size={14} className="text-teal-600" />;
            default: return <FileText size={14} className="text-stone-500" />;
        }
    };

    const getTipeBg = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return 'bg-purple-50 border border-purple-100';
            case 'Sakit': return 'bg-rose-50 border border-rose-100';
            case 'Dinas': return 'bg-blue-50 border border-blue-100';
            case 'Lembur': return 'bg-amber-50 border border-amber-100';
            case 'Koreksi Absen': return 'bg-teal-50 border border-teal-100';
            default: return 'bg-stone-50 border border-stone-150';
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
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .tab-transition {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.06);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="approve-cuti" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                📝 Persetujuan Izin & Cuti Karyawan
                            </h1>
                            <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                Delegasi Approval
                            </span>
                        </div>
                        <p className="text-xs text-stone-500">
                            Daftar pengajuan cuti, izin sakit, dinas luar, lembur kerja, dan koreksi absen dari mobile yang sedang menunggu validasi Anda.
                        </p>
                    </div>

                    {/* Quick Category Stats & Filter Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        
                        {/* Tab All */}
                        <button
                            onClick={() => setActiveFilter('All')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'All'
                                    ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">Semua Antrean</span>
                            <span className="text-2xl font-black mt-2 leading-none">{countAll}</span>
                        </button>

                        {/* Tab Cuti */}
                        <button
                            onClick={() => setActiveFilter('Cuti')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'Cuti'
                                    ? 'bg-purple-650 border-purple-650 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <Plane size={11} className={activeFilter === 'Cuti' ? 'text-purple-200' : 'text-purple-500'} />
                                Cuti
                            </span>
                            <span className="text-2xl font-black mt-2 leading-none">{countCuti}</span>
                        </button>

                        {/* Tab Sakit */}
                        <button
                            onClick={() => setActiveFilter('Sakit')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'Sakit'
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <Activity size={11} className={activeFilter === 'Sakit' ? 'text-rose-200' : 'text-rose-500'} />
                                Izin Sakit
                            </span>
                            <span className="text-2xl font-black mt-2 leading-none">{countSakit}</span>
                        </button>

                        {/* Tab Dinas */}
                        <button
                            onClick={() => setActiveFilter('Dinas')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'Dinas'
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <Briefcase size={11} className={activeFilter === 'Dinas' ? 'text-blue-200' : 'text-blue-500'} />
                                Dinas Luar
                            </span>
                            <span className="text-2xl font-black mt-2 leading-none">{countDinas}</span>
                        </button>

                        {/* Tab Lembur */}
                        <button
                            onClick={() => setActiveFilter('Lembur')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'Lembur'
                                    ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <Clock size={11} className={activeFilter === 'Lembur' ? 'text-amber-200' : 'text-amber-500'} />
                                Lembur
                            </span>
                            <span className="text-2xl font-black mt-2 leading-none">{countLembur}</span>
                        </button>

                        {/* Tab Koreksi */}
                        <button
                            onClick={() => setActiveFilter('Koreksi Absen')}
                            className={`p-3.5 rounded-2xl border text-left tab-transition relative overflow-hidden flex flex-col justify-between ${
                                activeFilter === 'Koreksi Absen'
                                    ? 'bg-teal-650 border-teal-650 text-white shadow-md'
                                    : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50'
                            }`}
                        >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <MapPin size={11} className={activeFilter === 'Koreksi Absen' ? 'text-teal-200' : 'text-teal-500'} />
                                Koreksi GPS
                            </span>
                            <span className="text-2xl font-black mt-2 leading-none">{countKoreksi}</span>
                        </button>

                    </div>

                    {/* Subtitle Filter */}
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <h2 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">
                            Antrean Pengajuan ({activeFilter}): <span className="text-stone-700 font-black">{filteredList.length} Permohonan</span>
                        </h2>
                    </div>

                    {/* Cards List of Requests */}
                    {filteredList.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
                            <CheckCircle className="mx-auto mb-3 text-stone-300" size={36} />
                            <p className="font-semibold text-sm">Semua aman!</p>
                            <p className="text-xs text-stone-400 mt-1">Tidak ada permohonan dalam antrean ({activeFilter}) yang menunggu approval.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredList.map((item) => {
                                const submittedDate = new Date(item.tanggal).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                });

                                const dateFrom = new Date(item.dari).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });

                                const dateTo = new Date(item.sampai).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });

                                return (
                                    <div
                                        key={`${item.tipe}-${item.id}`}
                                        className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm card-hover-effect transition-all"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                            
                                            {/* Column 1: Applicant Profile */}
                                            <div className="flex items-start gap-4 lg:w-1/3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-600 flex-shrink-0 border border-stone-300">
                                                    <User size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-extrabold text-stone-850 text-xs sm:text-sm truncate">
                                                            {item.nama_karyawan}
                                                        </h3>
                                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-stone-50 text-stone-550 text-[9px] font-extrabold border border-stone-200 font-mono">
                                                            {item.nik}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-400 flex items-center gap-1 font-bold">
                                                        <span>Diajukan:</span>
                                                        <span className="text-stone-500 font-bold">{submittedDate}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Column 2: Details of leave & Dates */}
                                            <div className="flex-1 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    
                                                    {/* Category & Date Ranges */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div>
                                                            <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1 block">Tipe Permohonan</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getTipeBadgeClass(item.tipe)}`}>
                                                                    {getTipeIcon(item.tipe)}
                                                                    {getFriendlyTipe(item.tipe)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-stone-700 flex items-center gap-1 mt-1">
                                                            <Calendar size={12} className="text-stone-400" />
                                                            {item.dari === item.sampai ? (
                                                                <span>{dateFrom}</span>
                                                            ) : (
                                                                <span>{dateFrom} - {dateTo}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reason / Keterangan */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1">Alasan / Keterangan</span>
                                                        <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-xl border border-stone-150 leading-relaxed line-clamp-2" title={item.keterangan}>
                                                            "{item.keterangan || 'Tidak ada alasan khusus'}"
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>

                                            {/* Column 3: Action Buttons */}
                                            <div className="flex items-center justify-end gap-2 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0 flex-shrink-0">
                                                
                                                <button
                                                    onClick={() => handleAction(item.id, item.tipe, '1')}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                                                >
                                                    <Check size={12} />
                                                    Setujui
                                                </button>

                                                <button
                                                    onClick={() => handleAction(item.id, item.tipe, '2')}
                                                    disabled={processing}
                                                    className="inline-flex items-center gap-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                                                >
                                                    <XIcon size={12} />
                                                    Tolak
                                                </button>

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
