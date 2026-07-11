import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'h': return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Hadir</span>;
            case 'a': return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Alpha</span>;
            case 'i': return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">Izin</span>;
            case 's': return <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-800 font-bold text-[10px]">Sakit</span>;
            case 'c': return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Cuti</span>;
            case 'd': return <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">Dinas</span>;
            default: return <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-850 font-bold text-[10px]">{status}</span>;
        }
    };

    return (
        <>
            <Head title="Riwayat Presensi Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="presensi-karyawan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                📅 Riwayat Presensi Karyawan
                            </h1>
                            <p className="text-xs text-stone-500 mt-1">
                                Catatan kehadiran harian karyawan secara realtime. Cari, saring, dan ekspor data presensi ke berkas Excel/CSV.
                            </p>
                        </div>

                        {/* Export Button */}
                        <div>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                            >
                                📥 Ekspor Laporan Excel
                            </button>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-4">
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-[11px] font-bold text-stone-500 mb-1">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-stone-500 mb-1">Tanggal Selesai</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-stone-500 mb-1">Cari Karyawan (Nama/NIK)</label>
                                <input
                                    type="text"
                                    value={search}
                                    placeholder="Masukkan nama atau NIK..."
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-all"
                                >
                                    Saring
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-lg transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-150 text-stone-600 font-bold uppercase tracking-wider">
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Karyawan</th>
                                        <th className="p-4">Jam Kerja / Shift</th>
                                        <th className="p-4">Jam Masuk</th>
                                        <th className="p-4">Jam Pulang</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-150">
                                    {presensiData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                                                Tidak ada data presensi yang ditemukan untuk rentang tanggal terpilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        presensiData.data.map((item) => {
                                            // Check if late check-in
                                            const isLate = item.jam_in && item.jam_in > item.jk_jam_masuk;
                                            return (
                                                <tr key={item.id} className="hover:bg-amber-50/10 transition-all">
                                                    <td className="p-4 text-stone-700 font-bold">
                                                        {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-stone-800">{item.nama_karyawan}</div>
                                                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">{item.nik}</div>
                                                    </td>
                                                    <td className="p-4 text-stone-600">
                                                        <div className="font-medium text-stone-800">{item.nama_jam_kerja}</div>
                                                        <div className="text-[10px] text-stone-400 mt-0.5">({item.jk_jam_masuk} - {item.jk_jam_pulang})</div>
                                                    </td>
                                                    <td className="p-4">
                                                        {item.jam_in ? (
                                                            <div className="space-y-0.5">
                                                                <span className={`font-mono text-xs font-bold ${isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                    {item.jam_in}
                                                                </span>
                                                                {isLate && (
                                                                    <div className="text-[9px] text-rose-500 font-bold">Terlambat</div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-300 font-medium">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {item.jam_out ? (
                                                            <span className="font-mono text-xs font-bold text-stone-700">
                                                                {item.jam_out}
                                                            </span>
                                                        ) : (
                                                            <span className="text-stone-300 font-medium">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {getStatusLabel(item.status)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Links */}
                        {presensiData.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-stone-150">
                                <div className="text-[10px] text-stone-500 font-medium">
                                    Menampilkan {presensiData.data.length} dari total {presensiData.total} catatan
                                </div>
                                <div className="flex gap-1">
                                    {presensiData.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                                                link.active
                                                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
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
            </div>
        </>
    );
}
