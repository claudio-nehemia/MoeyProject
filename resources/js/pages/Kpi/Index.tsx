import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, FormEventHandler } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface KpiUserSummary {
    user_id: number;
    name: string;
    email: string;
    role: string;
    divisi: string;
    fast_responses: number;
    fast_updates: number;
    late_tasks: number;
    completed_projects: number;
    score: number;
}

interface KpiSettings {
    base_points: number;
    points_fast_response: number;
    points_fast_update: number;
    penalty_late: number;
    points_completed_project: number;
    bonus_type: 'flat' | 'proportional';
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    meta?: any;
}

interface GlobalStats {
    avgScore: number;
    topPerformerName: string;
    topPerformerScore: number;
    totalCompletedProjects: number;
    totalLateTasks: number;
}

interface Props {
    kpiData: PaginatedData<KpiUserSummary>;
    settings: KpiSettings;
    rolesList: string[];
    filters: {
        search?: string;
        role?: string;
    };
    globalStats: GlobalStats;
}

export default function Index({ kpiData, settings, rolesList, filters, globalStats }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [activeTab, setActiveTab] = useState<'leaderboard' | 'settings'>('leaderboard');
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedRole, setSelectedRole] = useState(filters.role || "");
    const [mounted, setMounted] = useState(false);

    // Settings Form
    const { data: settingsData, setData: setSettingsData, post: submitSettings, processing: savingSettings } = useForm({
        base_points: settings.base_points,
        points_fast_response: settings.points_fast_response,
        points_fast_update: settings.points_fast_update,
        penalty_late: settings.penalty_late,
        points_completed_project: settings.points_completed_project,
        bonus_type: settings.bonus_type,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Debounced Search & Filter Backend Reload
    useEffect(() => {
        if (!mounted) return;

        const delayDebounce = setTimeout(() => {
            router.get(
                '/kpi',
                {
                    search: searchQuery || undefined,
                    role: selectedRole || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, selectedRole]);

    const handleSaveSettings: FormEventHandler = (e) => {
        e.preventDefault();
        submitSettings('/kpi/settings', {
            preserveScroll: true,
            onSuccess: () => {
                alert('Pengaturan KPI berhasil disimpan!');
            }
        });
    };

    const getScoreBadgeClass = (score: number) => {
        if (score >= 120) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        if (score >= 90) return 'bg-blue-100 text-blue-800 border border-blue-200';
        if (score >= 70) return 'bg-amber-100 text-amber-800 border border-amber-200';
        return 'bg-rose-100 text-rose-800 border border-rose-200';
    };

    return (
        <>
            <Head title="KPI Master Data" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .table-row-hover:hover {
                    transform: translateX(4px);
                    background: linear-gradient(to right, #fffbeb, white);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="kpi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    KPI Management
                                </h1>
                                <span className="inline-flex px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                                    Master Data
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Track employee key performance metrics, speed metrics, and point configurations.
                            </p>
                        </div>

                        {/* Tabs Toggle */}
                        <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 self-start md:self-auto shadow-sm">
                            <button
                                onClick={() => setActiveTab('leaderboard')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'leaderboard' ? 'bg-white text-amber-700 shadow' : 'text-stone-600 hover:text-stone-900'}`}
                            >
                                Leaderboard
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'settings' ? 'bg-white text-amber-700 shadow' : 'text-stone-600 hover:text-stone-900'}`}
                            >
                                Pengaturan Poin
                            </button>
                        </div>
                    </div>

                    {activeTab === 'leaderboard' ? (
                        <div className="space-y-6 fadeInUp">
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: Average Score */}
                                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Rata-Rata Score KPI</p>
                                    <h3 className="text-2xl font-bold text-stone-800 mt-1">{globalStats.avgScore} Poin</h3>
                                    <p className="text-[10px] text-stone-500 mt-1">Seluruh divisi & staff (Bulan Ini)</p>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-sm font-bold">
                                        📊
                                    </div>
                                </div>

                                {/* Card 2: Top Performer */}
                                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Top Performer</p>
                                    <h3 className="text-md font-bold text-stone-800 mt-1 truncate max-w-[80%]">{globalStats.topPerformerName}</h3>
                                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">★ {globalStats.topPerformerScore} Poin (Bulan Ini)</p>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm">
                                        👑
                                    </div>
                                </div>

                                {/* Card 3: Total Completed Projects */}
                                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Project Selesai</p>
                                    <h3 className="text-2xl font-bold text-stone-800 mt-1">{globalStats.totalCompletedProjects} Project</h3>
                                    <p className="text-[10px] text-stone-500 mt-1">Akumulasi seluruh tim (Bulan Ini)</p>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm">
                                        💼
                                    </div>
                                </div>

                                {/* Card 4: Overdue Tasks */}
                                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Total Keterlambatan</p>
                                    <h3 className="text-2xl font-bold text-rose-600 mt-1">{globalStats.totalLateTasks} Kali</h3>
                                    <p className="text-[10px] text-stone-500 mt-1">Denda poin terhitung (Bulan Ini)</p>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 text-sm">
                                        ⚠️
                                    </div>
                                </div>
                            </div>

                            {/* Search and Filters */}
                            <SearchFilter
                                onSearch={setSearchQuery}
                                onFilterChange={(key, value) => {
                                    if (key === 'role') {
                                        setSelectedRole(value);
                                    }
                                }}
                                filters={{
                                    role: {
                                        label: 'Pilih Role',
                                        options: rolesList.map(role => ({
                                            value: role,
                                            label: role
                                        }))
                                    }
                                }}
                                searchPlaceholder="Cari karyawan berdasarkan nama..."
                            />

                            {/* Table List of Karyawan */}
                            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-md">
                                <table className="w-full text-sm text-left text-stone-600">
                                    <thead className="text-xs text-stone-700 uppercase bg-gradient-to-r from-stone-50 to-stone-100 border-b-2 border-amber-200">
                                        <tr>
                                            <th scope="col" className="px-5 py-3.5 font-bold">No</th>
                                            <th scope="col" className="px-5 py-3.5 font-bold">Karyawan</th>
                                            <th scope="col" className="px-5 py-3.5 font-bold">Role & Divisi</th>
                                            <th scope="col" className="px-5 py-3.5 text-center font-bold">Project Selesai</th>
                                            <th scope="col" className="px-5 py-3.5 text-center font-bold">Respon Cepat</th>
                                            <th scope="col" className="px-5 py-3.5 text-center font-bold">Update Cepat</th>
                                            <th scope="col" className="px-5 py-3.5 text-center font-bold">Telat</th>
                                            <th scope="col" className="px-5 py-3.5 text-center font-bold">Poin KPI</th>
                                            <th scope="col" className="px-5 py-3.5 text-right font-bold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kpiData.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-5 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-3xl mb-2">👥</span>
                                                        <p className="text-stone-500 font-semibold text-sm">Karyawan tidak ditemukan</p>
                                                        <p className="text-stone-400 text-xs mt-0.5">Silakan sesuaikan kata kunci pencarian atau filter Anda.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            kpiData.data.map((user, idx) => (
                                                <tr key={user.user_id} className="bg-white border-b border-stone-100 table-row-hover transition-all">
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 shadow-sm border border-stone-200">
                                                            {((kpiData.meta?.current_page || 1) - 1) * (kpiData.meta?.per_page || 10) + idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-stone-900 block text-xs">{user.name}</span>
                                                                <span className="text-[10px] text-stone-400 block">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 block w-max mb-1">
                                                            {user.role}
                                                        </span>
                                                        <span className="text-[10px] text-stone-500 block">
                                                            Divisi: {user.divisi}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center font-bold text-stone-850 text-xs">
                                                        {user.completed_projects}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center text-xs font-medium text-emerald-600">
                                                        +{user.fast_responses}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center text-xs font-medium text-emerald-600">
                                                        +{user.fast_updates}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center text-xs font-semibold text-rose-500">
                                                        -{user.late_tasks}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getScoreBadgeClass(user.score)}`}>
                                                            {user.score}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Link
                                                            href={`/kpi/${user.user_id}`}
                                                            className="inline-flex px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all transform hover:scale-105"
                                                        >
                                                            Lihat Rapor
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Server-Side Pagination Links */}
                                {kpiData.links && kpiData.links.length > 3 && (
                                    <div className="border-t border-stone-200 bg-stone-50/50 px-6 py-3.5 flex justify-center">
                                        <nav className="flex space-x-1">
                                            {kpiData.links.map((link: any, index: number) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                        link.active
                                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow'
                                                            : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                                    } ${!link.url ? 'cursor-not-allowed opacity-40' : 'hover:shadow-sm'}`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ))}
                                        </nav>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Settings Tab
                        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden fadeInUp">
                            <div className="bg-gradient-to-r from-stone-800 to-stone-750 p-5 text-white">
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    ⚙️ Parameter Penilaian KPI
                                </h2>
                                <p className="text-[11px] text-stone-300 mt-1">
                                    Konfigurasi poin dasar, sistem bonus respon/update, dan denda denda keterlambatan per parameter.
                                </p>
                            </div>

                            <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Base points */}
                                    <div className="col-span-1 md:col-span-2 bg-amber-50/40 border border-amber-200/50 rounded-lg p-4 space-y-2">
                                        <label className="block text-xs font-bold text-stone-700">Poin Awal Bulanan (Base Score)</label>
                                        <p className="text-[10px] text-stone-500 font-medium">Poin baseline nilai karyawan pada awal setiap bulan. Poin ini akan diset ulang ke nilai ini setiap berganti bulan baru.</p>
                                        <input
                                            type="number"
                                            value={settingsData.base_points}
                                            onChange={e => setSettingsData('base_points', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-semibold"
                                            required
                                            min="0"
                                        />
                                    </div>

                                    {/* Bonus Type Toggle */}
                                    <div className="col-span-1 md:col-span-2 bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                                        <label className="block text-xs font-bold text-stone-700">Sistem Kalkulasi Bonus Kecepatan (Respon & Update)</label>
                                        <p className="text-[10px] text-stone-500">
                                            Pilih apakah bonus kecepatan dihitung flat (merata selama selesai sebelum deadline target), atau proporsional (semakin cepat pengerjaan dibanding target deadline, semakin besar poin yang didapat).
                                        </p>
                                        <select
                                            value={settingsData.bonus_type}
                                            onChange={e => setSettingsData('bonus_type', e.target.value as 'flat' | 'proportional')}
                                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg font-semibold bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="flat">Bonus Flat (Rata - Poin Penuh jika Cepat)</option>
                                            <option value="proportional">Bonus Proporsional (Progresif - Lebih Cepat Lebih Banyak)</option>
                                        </select>
                                    </div>

                                    {/* Response Time Parameter */}
                                    <div className="border border-stone-200 rounded-lg p-4 space-y-4 shadow-sm bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-amber-800 border-b border-stone-200 pb-1.5">⚡ Kecepatan Respon (Response Speed)</h3>
                                        <p className="text-[10px] text-stone-400">Target pengerjaan otomatis merujuk ke parameter <code className="font-semibold text-amber-700">duration_actual</code> pada setiap task response.</p>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-semibold text-stone-700">Maksimum Bonus Poin per Respon Cepat</label>
                                            <input
                                                type="number"
                                                value={settingsData.points_fast_response}
                                                onChange={e => setSettingsData('points_fast_response', parseInt(e.target.value))}
                                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold"
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Update Time Parameter */}
                                    <div className="border border-stone-200 rounded-lg p-4 space-y-4 shadow-sm bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-amber-800 border-b border-stone-200 pb-1.5">✍️ Kecepatan Update Selesai</h3>
                                        <p className="text-[10px] text-stone-400">Target pengerjaan otomatis merujuk ke parameter <code className="font-semibold text-amber-700">duration - duration_actual</code> pada setiap task response.</p>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-semibold text-stone-700">Maksimum Bonus Poin per Update Cepat</label>
                                            <input
                                                type="number"
                                                value={settingsData.points_fast_update}
                                                onChange={e => setSettingsData('points_fast_update', parseInt(e.target.value))}
                                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold"
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Late Penalty */}
                                    <div className="border border-stone-200 rounded-lg p-4 space-y-3.5 shadow-sm bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-rose-800 border-b border-stone-200 pb-1.5">⚠️ Denda Terlambat (Penalty)</h3>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-semibold text-stone-700">Pengurangan Poin per Terlambat</label>
                                            <p className="text-[9px] text-stone-400">Nilai pengurangan poin ketika melewati deadline respon atau input data.</p>
                                            <input
                                                type="number"
                                                value={settingsData.penalty_late}
                                                onChange={e => setSettingsData('penalty_late', parseInt(e.target.value))}
                                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold text-rose-600"
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Completed Projects Parameter */}
                                    <div className="border border-stone-200 rounded-lg p-4 space-y-3.5 shadow-sm bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-emerald-800 border-b border-stone-200 pb-1.5">💼 Project Selesai (BAST & Lunas)</h3>
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-semibold text-stone-700">Penambahan Poin per Project</label>
                                            <p className="text-[9px] text-stone-400">Nilai bonus poin ketika project yang di-assign terhitung selesai (BAST & Lunas).</p>
                                            <input
                                                type="number"
                                                value={settingsData.points_completed_project}
                                                onChange={e => setSettingsData('points_completed_project', parseInt(e.target.value))}
                                                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg font-semibold text-emerald-600"
                                                required
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                </div>

                                <div className="border-t border-stone-150 pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingSettings}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
                                    >
                                        {savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
