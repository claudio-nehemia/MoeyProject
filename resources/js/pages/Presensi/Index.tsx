import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { 
    Calendar, 
    User, 
    Search, 
    Download, 
    MapPin, 
    Clock, 
    Camera, 
    AlertCircle, 
    X,
    Building,
    CheckCircle,
    Coffee,
    ExternalLink
} from 'lucide-react';

interface PresenceItem {
    id: number;
    tanggal: string;
    nik: string;
    nama_karyawan: string;
    nama_jam_kerja: string;
    jk_jam_masuk: string;
    jk_jam_pulang: string;
    jam_in: string | null;
    jam_out: string | null;
    status: string;
    foto_in?: string | null;
    foto_out?: string | null;
    lokasi_in?: string | null;
    lokasi_out?: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    presensiData: {
        data: PresenceItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        start_date: string;
        end_date: string;
        search: string | null;
    };
}

export default function Index({ presensiData, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [search, setSearch] = useState(filters.search || '');

    // Modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPresence, setSelectedPresence] = useState<PresenceItem | null>(null);
    const [activeDetailType, setActiveDetailType] = useState<'in' | 'out'>('in');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/presensi-karyawan', {
            start_date: startDate,
            end_date: endDate,
            search: search
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleReset = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
        setSearch('');

        router.get('/presensi-karyawan', {
            start_date: firstDay,
            end_date: lastDay,
            search: ''
        });
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            search: search
        }).toString();
        window.open(`/presensi-karyawan/export?${queryParams}`, '_blank');
    };

    const openDetails = (item: PresenceItem, type: 'in' | 'out') => {
        setSelectedPresence(item);
        setActiveDetailType(type);
        setShowDetailModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'h': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-extrabold uppercase tracking-wide">Hadir</span>;
            case 'a': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/50 text-[10px] font-extrabold uppercase tracking-wide">Alpha</span>;
            case 'i': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/50 text-[10px] font-extrabold uppercase tracking-wide">Izin</span>;
            case 's': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-extrabold uppercase tracking-wide">Sakit</span>;
            case 'c': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50 text-[10px] font-extrabold uppercase tracking-wide">Cuti</span>;
            case 'd': 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50 text-[10px] font-extrabold uppercase tracking-wide">Dinas</span>;
            default: 
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-50 text-stone-600 border border-stone-200/50 text-[10px] font-extrabold uppercase tracking-wide">{status}</span>;
        }
    };

    const getMapUrl = (coords?: string | null) => {
        if (!coords) return null;
        const [lat, lng] = coords.split(',');
        return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    };

    return (
        <>
            <Head title="Monitoring Presensi Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .card-hover-effect {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="presensi-karyawan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    📅 Monitoring Presensi Karyawan
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    Realtime
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Catatan kehadiran harian karyawan secara realtime. Klik jam masuk/pulang untuk melihat selfie GPS.
                            </p>
                        </div>

                        {/* Export Button */}
                        <div>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                            >
                                <Download size={14} />
                                Ekspor Laporan Excel
                            </button>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5">
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Tanggal Mulai</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Tanggal Selesai</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Cari Karyawan (Nama/NIK)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                    <input
                                        type="text"
                                        value={search}
                                        placeholder="Masukkan nama atau NIK..."
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow transition-all"
                                >
                                    Saring
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold text-xs rounded-xl transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Presensi Cards List */}
                    <div className="space-y-3">
                        {presensiData.data.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-12 text-center text-stone-400">
                                <Calendar className="mx-auto mb-3 text-stone-300" size={36} />
                                <p className="font-semibold text-sm">Tidak ada data presensi yang ditemukan.</p>
                                <p className="text-xs text-stone-400 mt-1">Coba saring tanggal lain atau periksa kata kunci pencarian Anda.</p>
                            </div>
                        ) : (
                            presensiData.data.map((item) => {
                                const isLate = item.jam_in && item.jam_in > item.jk_jam_masuk;
                                const formattedDate = new Date(item.tanggal).toLocaleDateString('id-ID', { 
                                    weekday: 'long', 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                });

                                return (
                                    <div 
                                        key={item.id} 
                                        className="bg-white rounded-2xl border border-stone-200/70 p-4 shadow-sm card-hover-effect"
                                    >
                                        {/* Card Top: User Info & Status */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-stone-100 gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow">
                                                    {item.nama_karyawan.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-stone-850 text-sm">{item.nama_karyawan}</h3>
                                                        <span className="text-[10px] text-stone-400 font-bold font-mono">({item.nik})</span>
                                                    </div>
                                                    <p className="text-[10px] text-stone-500 font-semibold flex items-center gap-1 mt-0.5">
                                                        <Building size={10} className="text-stone-400" />
                                                        {item.nama_jam_kerja}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                                                    {formattedDate}
                                                </span>
                                                {getStatusBadge(item.status)}
                                            </div>
                                        </div>

                                        {/* Card Bottom: Times & Visual Data Shortcuts */}
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 pt-1">
                                            
                                            {/* Jam Kerja / Shift Target */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Jadwal Shift</span>
                                                    <span className="text-xs font-bold text-stone-700">
                                                        {item.jk_jam_masuk} - {item.jk_jam_pulang}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Jam Masuk (Check-In) */}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.jam_in ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-300'}`}>
                                                    <CheckCircle size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Jam Masuk</span>
                                                    {item.jam_in ? (
                                                        <button 
                                                            type="button"
                                                            onClick={() => openDetails(item, 'in')}
                                                            className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:underline text-left group"
                                                        >
                                                            {item.jam_in}
                                                            {item.foto_in && <Camera size={11} className="text-emerald-500 group-hover:scale-110 transition-all" />}
                                                            {isLate && <span className="text-[9px] font-extrabold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Terlambat</span>}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-stone-400">-</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Jam Pulang (Check-Out) */}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.jam_out ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-300'}`}>
                                                    <Coffee size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Jam Pulang</span>
                                                    {item.jam_out ? (
                                                        <button 
                                                            type="button"
                                                            onClick={() => openDetails(item, 'out')}
                                                            className="flex items-center gap-1 text-xs font-extrabold text-rose-700 hover:underline text-left group"
                                                        >
                                                            {item.jam_out}
                                                            {item.foto_out && <Camera size={11} className="text-rose-500 group-hover:scale-110 transition-all" />}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-stone-400">-</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Map Coordinates Trigger */}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(item.lokasi_in || item.lokasi_out) ? 'bg-sky-50 text-sky-600' : 'bg-stone-50 text-stone-300'}`}>
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-stone-400 block">Koordinat GPS</span>
                                                    {(item.lokasi_in || item.lokasi_out) ? (
                                                        <button 
                                                            type="button"
                                                            onClick={() => openDetails(item, item.lokasi_in ? 'in' : 'out')}
                                                            className="text-xs font-bold text-sky-700 hover:underline text-left flex items-center gap-1"
                                                        >
                                                            Lihat Peta
                                                            <ExternalLink size={10} className="text-sky-500" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-stone-400">Tidak ada GPS</span>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Links */}
                    {presensiData.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm gap-4">
                            <div className="text-[11px] text-stone-500 font-bold">
                                Menampilkan {presensiData.data.length} dari total {presensiData.total} catatan kehadiran
                            </div>
                            <div className="flex gap-1">
                                {presensiData.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                                            link.active
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                        } disabled:opacity-30`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Premium Dialog Modal for Selfie & Map Details */}
            <Modal 
                show={showDetailModal} 
                onClose={() => setShowDetailModal(false)}
                maxWidth="4xl"
            >
                {selectedPresence && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-150">
                            <div>
                                <h2 className="text-base font-extrabold text-stone-850 flex items-center gap-2">
                                    📸 Rincian Presensi Karyawan
                                </h2>
                                <p className="text-[10px] text-stone-500 font-semibold mt-0.5">
                                    {selectedPresence.nama_karyawan} ({selectedPresence.nik}) — {new Date(selectedPresence.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowDetailModal(false)}
                                className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
                            
                            {/* Left Panel: Photo & Details (5/12 cols) */}
                            <div className="md:col-span-5 space-y-5">
                                
                                {/* Toggle Buttons: Check-In vs Check-Out */}
                                <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setActiveDetailType('in')}
                                        className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeDetailType === 'in' ? 'bg-white text-emerald-800 shadow' : 'text-stone-600 hover:text-stone-900'}`}
                                    >
                                        <CheckCircle size={14} className={activeDetailType === 'in' ? 'text-emerald-600' : 'text-stone-400'} />
                                        Masuk (Check-In)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveDetailType('out')}
                                        className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeDetailType === 'out' ? 'bg-white text-rose-800 shadow' : 'text-stone-600 hover:text-stone-900'}`}
                                    >
                                        <Coffee size={14} className={activeDetailType === 'out' ? 'text-rose-600' : 'text-stone-400'} />
                                        Pulang (Check-Out)
                                    </button>
                                </div>

                                {/* Presence Selfie Photo */}
                                <div className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center relative shadow-inner">
                                    {activeDetailType === 'in' ? (
                                        selectedPresence.foto_in ? (
                                            <img 
                                                src={`/storage/uploads/absensi/${selectedPresence.foto_in}`}
                                                alt="Foto Check-In Karyawan"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center p-6 space-y-1.5 text-stone-400">
                                                <Camera className="mx-auto text-stone-300" size={32} />
                                                <p className="text-xs font-bold">Tidak ada foto Check-In</p>
                                            </div>
                                        )
                                    ) : (
                                        selectedPresence.foto_out ? (
                                            <img 
                                                src={`/storage/uploads/absensi/${selectedPresence.foto_out}`}
                                                alt="Foto Check-Out Karyawan"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center p-6 space-y-1.5 text-stone-400">
                                                <Camera className="mx-auto text-stone-300" size={32} />
                                                <p className="text-xs font-bold">Tidak ada foto Check-Out</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Profile detail information Table */}
                                <div className="border border-stone-200/80 rounded-2xl overflow-hidden bg-stone-50/30">
                                    <table className="w-full text-xs text-left">
                                        <tbody>
                                            <tr className="border-b border-stone-100">
                                                <th className="px-4 py-2.5 font-bold text-stone-500 bg-stone-50/50 w-1/3">Waktu Absen</th>
                                                <td className="px-4 py-2.5 font-bold text-stone-800">
                                                    {activeDetailType === 'in' 
                                                        ? (selectedPresence.jam_in ?? '-') 
                                                        : (selectedPresence.jam_out ?? '-')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-stone-100">
                                                <th className="px-4 py-2.5 font-bold text-stone-500 bg-stone-50/50">Jadwal Shift</th>
                                                <td className="px-4 py-2.5 font-medium text-stone-700">
                                                    {selectedPresence.nama_jam_kerja} ({selectedPresence.jk_jam_masuk} - {selectedPresence.jk_jam_pulang})
                                                </td>
                                            </tr>
                                            <tr className="border-b border-stone-100">
                                                <th className="px-4 py-2.5 font-bold text-stone-500 bg-stone-50/50">Status Harian</th>
                                                <td className="px-4 py-2.5">
                                                    {getStatusBadge(selectedPresence.status)}
                                                </td>
                                            </tr>
                                            {activeDetailType === 'in' && selectedPresence.jam_in && selectedPresence.jam_in > selectedPresence.jk_jam_masuk && (
                                                <tr>
                                                    <th className="px-4 py-2.5 font-bold text-stone-500 bg-stone-50/50">Keterlambatan</th>
                                                    <td className="px-4 py-2.5 text-xs font-extrabold text-rose-600 bg-rose-50/40">
                                                        Terlambat Masuk Kerja
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>

                            {/* Right Panel: Map Plotting (7/12 cols) */}
                            <div className="md:col-span-7 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                                    <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                                        <MapPin size={14} className="text-sky-600" />
                                        Plotting Koordinat GPS Karyawan
                                    </h4>
                                    
                                    {(activeDetailType === 'in' ? selectedPresence.lokasi_in : selectedPresence.lokasi_out) && (
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${activeDetailType === 'in' ? selectedPresence.lokasi_in : selectedPresence.lokasi_out}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-extrabold text-sky-700 hover:underline flex items-center gap-1 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg"
                                        >
                                            Buka di Google Maps
                                            <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>

                                {/* Iframe Map Block */}
                                {(() => {
                                    const coords = activeDetailType === 'in' 
                                        ? selectedPresence.lokasi_in 
                                        : selectedPresence.lokasi_out;
                                    const mapUrl = getMapUrl(coords);

                                    return mapUrl ? (
                                        <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-inner h-[380px] bg-stone-50 relative">
                                            <iframe
                                                src={mapUrl}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen
                                                loading="lazy"
                                                title="Koordinat Presensi GPS"
                                            />
                                        </div>
                                    ) : (
                                        <div className="border border-stone-200/80 rounded-2xl border-dashed h-[380px] bg-stone-50/50 flex flex-col items-center justify-center p-6 text-center text-stone-400 space-y-2">
                                            <MapPin size={36} className="text-stone-300" />
                                            <p className="text-xs font-bold">Titik Koordinat GPS Tidak Tersedia</p>
                                            <p className="text-[10px] text-stone-400 max-w-xs">
                                                Karyawan ini tidak melampirkan titik lokasi atau melakukan absensi offline (log mesin fingerprint).
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>

                        </div>

                    </div>
                )}
            </Modal>
        </>
    );
}
