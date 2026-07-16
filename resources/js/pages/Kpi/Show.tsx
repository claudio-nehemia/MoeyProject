import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface KpiUserSummary {
    score: number;
    fast_responses: number;
    fast_updates: number;
    late_tasks: number;
    completed_projects: number;
    late_presences?: number;
    alpha_days?: number;
    perfect_attendance_bonus?: boolean;
}

interface TaskHistoryItem {
    id: number;
    nama_project: string;
    tahap: string;
    start_time: string;
    response_time: string | null;
    update_data_time: string | null;
    deadline: string;
    status: string;
    is_late: boolean;
    points_impact: number;
}

interface CompletedProjectItem {
    id: number;
    nama_project: string;
    customer_name: string;
    completed_at: string | null;
    points_impact: number;
}

interface MonthlyTrendItem {
    month: string;
    score: number;
    fast_responses: number;
    fast_updates: number;
    late_tasks: number;
    completed_projects: number;
    late_presences?: number;
    alpha_days?: number;
    perfect_attendance_bonus?: boolean;
}

interface KpiSettings {
    base_points: number;
    points_fast_response: number;
    points_fast_update: number;
    penalty_late: number;
    points_completed_project: number;
    bonus_type: 'flat' | 'proportional';
    penalty_attendance_late?: number;
    penalty_attendance_alpha?: number;
    bonus_attendance_perfect?: number;
}

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        divisi: string;
    };
    summary: KpiUserSummary;
    taskHistory: TaskHistoryItem[];
    completedProjects: CompletedProjectItem[];
    trend: MonthlyTrendItem[];
    settings: KpiSettings;
}

export default function Show({ user, summary, taskHistory, completedProjects, trend, settings }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [activeHistoryTab, setActiveHistoryTab] = useState<'tasks' | 'projects' | 'history'>('tasks');
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getScoreBadgeClass = (score: number) => {
        if (score >= 120) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        if (score >= 90) return 'bg-blue-100 text-blue-800 border border-blue-200';
        if (score >= 70) return 'bg-amber-100 text-amber-800 border border-amber-200';
        return 'bg-rose-100 text-rose-800 border border-rose-200';
    };

    // Custom SVG Graph Renderer (supports responsive/sliding nodes for 12 months)
    const renderTrendChart = (trendData: MonthlyTrendItem[]) => {
        if (!trendData || trendData.length === 0) return null;

        const width = 800;
        const height = 260;
        const padding = { top: 30, right: 30, bottom: 40, left: 50 };

        const scores = trendData.map(t => t.score);
        const maxScore = Math.max(...scores, 150);
        const minScore = Math.min(...scores, 50);
        const scoreRange = maxScore - minScore || 1;

        // Map values to coordinates
        const points = trendData.map((item, index) => {
            const x = padding.left + (index * (width - padding.left - padding.right) / (trendData.length - 1));
            const y = height - padding.bottom - ((item.score - minScore) / scoreRange * (height - padding.top - padding.bottom));
            return { x, y, ...item, index };
        });

        // SVG Path definitions
        let linePath = '';
        let areaPath = '';

        if (points.length > 0) {
            linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
            areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
        }

        // Draw grid lines
        const gridLines = [];
        const gridCount = 4;
        for (let i = 0; i <= gridCount; i++) {
            const yVal = minScore + (i * scoreRange / gridCount);
            const y = height - padding.bottom - (i * (height - padding.top - padding.bottom) / gridCount);
            gridLines.push({ y, label: Math.round(yVal) });
        }

        return (
            <div className="relative bg-stone-50 border border-stone-150 rounded-2xl p-5 shadow-inner overflow-x-auto">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto min-w-[700px]">
                    {/* Gradients */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {gridLines.map((line, idx) => (
                        <g key={idx}>
                            <line 
                                x1={padding.left} 
                                y1={line.y} 
                                x2={width - padding.right} 
                                y2={line.y} 
                                stroke="#e7e5e4" 
                                strokeDasharray="3 3"
                            />
                            <text 
                                x={padding.left - 12} 
                                y={line.y + 4} 
                                textAnchor="end" 
                                className="text-[10px] fill-stone-400 font-bold"
                            >
                                {line.label}
                            </text>
                        </g>
                    ))}

                    {/* Area under the line */}
                    {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

                    {/* Main Line */}
                    {linePath && (
                        <path 
                            d={linePath} 
                            fill="none" 
                            stroke="#d97706" 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Dots and interactive hover triggers */}
                    {points.map((p, idx) => (
                        <g 
                            key={idx}
                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                            onMouseLeave={() => setHoveredTrendIndex(null)}
                            className="cursor-pointer"
                        >
                            {/* Outer dot hover effect (always mounted, opacity animated) */}
                            <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="9" 
                                fill="#fef3c7" 
                                stroke="#b45309"
                                strokeWidth="2"
                                style={{ opacity: hoveredTrendIndex === idx ? 1 : 0, transition: 'opacity 0.15s ease' }}
                                className="pointer-events-none"
                            />
                            {/* Inner Dot */}
                            <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="5" 
                                fill="#d97706" 
                                stroke="white"
                                strokeWidth="2"
                                className="pointer-events-none"
                            />
                            {/* Invisible larger hover catcher to prevent cursor jitter */}
                            <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="15" 
                                fill="transparent"
                            />
                            {/* X Axis Labels */}
                            <text 
                                x={p.x} 
                                y={height - 15} 
                                textAnchor="middle" 
                                className="text-[9px] fill-stone-500 font-bold pointer-events-none"
                            >
                                {p.month}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Info Tooltip Overlay */}
                {hoveredTrendIndex !== null && (
                    <div 
                        className="absolute bg-amber-950 text-white rounded-xl p-3 shadow-2xl text-xs space-y-1 pointer-events-none transition-all duration-150 border border-amber-800/20"
                        style={{
                            left: `${points[hoveredTrendIndex].x}px`,
                            top: `${points[hoveredTrendIndex].y - 105}px`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <p className="font-extrabold border-b border-white/20 pb-1 mb-1 text-[10px] uppercase tracking-widest">{trendData[hoveredTrendIndex].month}</p>
                        <p className="flex justify-between gap-5"><span className="text-amber-200">Score KPI:</span> <strong>{trendData[hoveredTrendIndex].score} Poin</strong></p>
                        <p className="flex justify-between gap-5"><span className="text-stone-300">Respon Cepat:</span> <span>+{trendData[hoveredTrendIndex].fast_responses} kali</span></p>
                        <p className="flex justify-between gap-5"><span className="text-stone-300">Update Cepat:</span> <span>+{trendData[hoveredTrendIndex].fast_updates} kali</span></p>
                        <p className="flex justify-between gap-5"><span className="text-stone-300">Terlambat:</span> <span className="text-rose-300">-{trendData[hoveredTrendIndex].late_tasks} kali</span></p>
                        <p className="flex justify-between gap-5"><span className="text-stone-300">Project Selesai:</span> <span className="text-emerald-300">+{trendData[hoveredTrendIndex].completed_projects}</span></p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={`Rapor KPI: ${user.name}`} />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .table-row-hover:hover {
                    background-color: #fcfbf7;
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="kpi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header Controls */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/kpi"
                            className="inline-flex items-center text-xs font-bold text-stone-600 hover:text-amber-700 transition-all bg-white border border-stone-200 rounded-lg px-3.5 py-2 shadow-sm hover:shadow"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Leaderboard
                        </Link>
                        
                        <span className="text-[10px] text-stone-400 font-medium">Terakhir sinkronisasi: {new Date().toLocaleDateString('id-ID')}</span>
                    </div>

                    {/* Profile Banner */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-stone-850 flex items-center justify-center sm:justify-start gap-2">
                                {user.name}
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getScoreBadgeClass(summary.score)}`}>
                                    {summary.score} Poin
                                </span>
                            </h2>
                            <p className="text-xs text-stone-500 mt-1">{user.email}</p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                                <span className="px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                                    {user.role}
                                </span>
                                <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                    Divisi: {user.divisi}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Info Alert Card */}
                    {(() => {
                        const penaltyLateVal = settings.penalty_attendance_late ?? 5;
                        const penaltyAlphaVal = settings.penalty_attendance_alpha ?? 15;
                        const bonusPerfectVal = settings.bonus_attendance_perfect ?? 15;

                        const attendancePenalty = ((summary.late_presences ?? 0) * penaltyLateVal) + ((summary.alpha_days ?? 0) * penaltyAlphaVal);
                        const attendanceBonus = summary.perfect_attendance_bonus ? bonusPerfectVal : 0;

                        return (
                            <>
                                <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📅</span>
                                        <div>
                                            <h4 className="text-xs font-bold text-indigo-800">Catatan Absensi Bulanan</h4>
                                            <p className="text-[11px] text-indigo-700/80 mt-0.5">Penilaian kehadiran berdasarkan finger print & log kehadiran harian.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1">
                                            <span className="text-[9px] text-amber-700 font-bold block">Terlambat ({penaltyLateVal} pts)</span>
                                            <span className="font-mono font-extrabold text-amber-800 text-xs">{summary.late_presences ?? 0} Kali</span>
                                        </div>
                                        <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-1">
                                            <span className="text-[9px] text-rose-700 font-bold block">Mangkir / Alpa ({penaltyAlphaVal} pts)</span>
                                            <span className="font-mono font-extrabold text-rose-800 text-xs">{summary.alpha_days ?? 0} Hari</span>
                                        </div>
                                        <div className={`rounded-lg px-3 py-1 border ${summary.perfect_attendance_bonus ? 'bg-emerald-50 border-emerald-150' : 'bg-stone-50 border-stone-150'}`}>
                                            <span className={`text-[9px] font-bold block ${summary.perfect_attendance_bonus ? 'text-emerald-700' : 'text-stone-500'}`}>Perfect Attendance (+{bonusPerfectVal} pts)</span>
                                            <span className={`font-mono font-extrabold text-xs ${summary.perfect_attendance_bonus ? 'text-emerald-800' : 'text-stone-500'}`}>
                                                {summary.perfect_attendance_bonus ? 'Ya ✅' : 'Tidak ❌'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Summary Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-xl text-center shadow-md text-white border border-amber-600/20">
                                        <p className="text-[9px] uppercase font-extrabold tracking-wider opacity-90">Total Poin Bulan Ini</p>
                                        <p className="text-3xl font-extrabold mt-1">{summary.score}</p>
                                        <p className="text-[9px] opacity-80 mt-1">Awal bulan reset ke {settings.base_points}</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
                                        <p className="text-[9px] uppercase font-bold text-stone-400">Project Selesai</p>
                                        <p className="text-2xl font-extrabold text-stone-800 mt-1">{summary.completed_projects}</p>
                                        <p className="text-[9px] text-stone-500 mt-1">+{settings.points_completed_project} poin / project</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
                                        <p className="text-[9px] uppercase font-bold text-stone-400">Respon Cepat</p>
                                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{summary.fast_responses}</p>
                                        <p className="text-[9px] text-stone-500 mt-1">Sesuai duration_actual</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
                                        <p className="text-[9px] uppercase font-bold text-stone-400">Update Cepat</p>
                                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{summary.fast_updates}</p>
                                        <p className="text-[9px] text-stone-500 mt-1">Selesai sebelum target</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
                                        <p className="text-[9px] uppercase font-bold text-stone-400">Late Tasks</p>
                                        <p className="text-2xl font-extrabold text-rose-500 mt-1">-{summary.late_tasks}</p>
                                        <p className="text-[9px] text-stone-500 mt-1">-{settings.penalty_late} poin / terlambat</p>
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-4 text-center shadow-sm">
                                        <p className="text-[9px] uppercase font-bold text-stone-400">Presensi Karyawan</p>
                                        <p className={`text-xl font-extrabold mt-1 ${attendanceBonus > 0 ? 'text-emerald-600' : attendancePenalty > 0 ? 'text-rose-500' : 'text-stone-600'}`}>
                                            {attendanceBonus > 0 ? `+${attendanceBonus}` : attendancePenalty > 0 ? `-${attendancePenalty}` : '0'} Poin
                                        </p>
                                        <p className="text-[9px] text-stone-500 mt-1">
                                            {summary.late_presences ?? 0} T, {summary.alpha_days ?? 0} A
                                        </p>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {/* Chart Section */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-stone-800">📈 Tren KPI Bulanan</h3>
                                <p className="text-[10px] text-stone-500 mt-0.5">Grafik pergerakan nilai KPI yang dicatat di akhir setiap bulan.</p>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded">
                                Sistem: {settings.bonus_type === 'flat' ? 'Bonus Flat' : 'Bonus Proporsional'}
                            </span>
                        </div>
                        {renderTrendChart(trend)}
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-md space-y-5">
                        
                        {/* Tab Headers */}
                        <div className="flex border-b border-stone-200 overflow-x-auto whitespace-nowrap">
                            <button
                                onClick={() => setActiveHistoryTab('tasks')}
                                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${activeHistoryTab === 'tasks' ? 'border-amber-500 text-amber-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                            >
                                Riwayat Task ({taskHistory.length})
                            </button>
                            <button
                                onClick={() => setActiveHistoryTab('projects')}
                                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${activeHistoryTab === 'projects' ? 'border-amber-500 text-amber-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                            >
                                Project Selesai ({completedProjects.length})
                            </button>
                            <button
                                onClick={() => setActiveHistoryTab('history')}
                                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${activeHistoryTab === 'history' ? 'border-amber-500 text-amber-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
                            >
                                Riwayat Nilai Bulanan ({trend.length})
                            </button>
                        </div>

                        {activeHistoryTab === 'tasks' && (
                            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-xs text-left text-stone-600 min-w-[700px]">
                                    <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase border-b border-stone-200">
                                        <tr>
                                            <th className="px-5 py-3">Project</th>
                                            <th className="px-5 py-3">Tahap</th>
                                            <th className="px-5 py-3 text-center">Mulai</th>
                                            <th className="px-5 py-3 text-center">Respon</th>
                                            <th className="px-5 py-3 text-center">Update Selesai</th>
                                            <th className="px-5 py-3 text-center">Deadline</th>
                                            <th className="px-5 py-3 text-center">Status</th>
                                            <th className="px-5 py-3 text-right">Dampak Poin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taskHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-stone-400">Tidak ada riwayat pengerjaan task.</td>
                                            </tr>
                                        ) : (
                                            taskHistory.map((task) => (
                                                <tr key={task.id} className="border-b border-stone-100 table-row-hover transition-all">
                                                    <td className="px-5 py-3 font-semibold text-stone-900">{task.nama_project}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-100">
                                                            {task.tahap}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-stone-500">{task.start_time}</td>
                                                    <td className="px-5 py-3 text-center text-stone-500">{task.response_time || '-'}</td>
                                                    <td className="px-5 py-3 text-center text-stone-500">{task.update_data_time || '-'}</td>
                                                    <td className="px-5 py-3 text-center text-stone-500">{task.deadline}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                                            task.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                                                            task.status === 'telat_submit' ? 'bg-rose-100 text-rose-800' :
                                                            task.status === 'telat' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className={`px-5 py-3 text-right font-extrabold ${task.points_impact >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {task.points_impact >= 0 ? `+${task.points_impact}` : task.points_impact}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeHistoryTab === 'projects' && (
                            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-xs text-left text-stone-600 min-w-[500px]">
                                    <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase border-b border-stone-200">
                                        <tr>
                                            <th className="px-5 py-3">Nama Project</th>
                                            <th className="px-5 py-3">Customer</th>
                                            <th className="px-5 py-3 text-center">Tanggal Selesai (BAST/Lunas)</th>
                                            <th className="px-5 py-3 text-right">Dampak Poin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completedProjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-stone-400 font-semibold">Belum ada project yang selesai dikerjakan.</td>
                                            </tr>
                                        ) : (
                                            completedProjects.map((project) => (
                                                <tr key={project.id} className="border-b border-stone-100 table-row-hover transition-all">
                                                    <td className="px-5 py-3 font-semibold text-stone-900">{project.nama_project}</td>
                                                    <td className="px-5 py-3 text-stone-500 font-medium">{project.customer_name}</td>
                                                    <td className="px-5 py-3 text-center text-stone-500">
                                                        {project.completed_at || 'Synchronizing...'}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-extrabold text-emerald-600">
                                                        +{project.points_impact}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Monthly History parameters log table */}
                        {activeHistoryTab === 'history' && (
                            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-xs text-left text-stone-600 min-w-[800px]">
                                    <thead className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase border-b border-stone-200">
                                        <tr>
                                            <th className="px-5 py-3">Bulan</th>
                                            <th className="px-5 py-3 text-center">Project Selesai</th>
                                            <th className="px-5 py-3 text-center">Respon Cepat</th>
                                            <th className="px-5 py-3 text-center">Update Cepat</th>
                                            <th className="px-5 py-3 text-center">Task Terlambat</th>
                                            <th className="px-5 py-3 text-center">Absen Terlambat</th>
                                            <th className="px-5 py-3 text-center">Absen Alpa</th>
                                            <th className="px-5 py-3 text-center">Bonus Kehadiran</th>
                                            <th className="px-5 py-3 text-right">Total Score KPI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trend.slice().reverse().map((item, index) => {
                                            const latePresPenalty = (item.late_presences ?? 0) * (settings.penalty_attendance_late ?? 5);
                                            const alphaPresPenalty = (item.alpha_days ?? 0) * (settings.penalty_attendance_alpha ?? 15);
                                            const perfectBonus = item.perfect_attendance_bonus ? (settings.bonus_attendance_perfect ?? 15) : 0;

                                            return (
                                                <tr key={index} className="border-b border-stone-100 table-row-hover transition-all">
                                                    <td className="px-5 py-3 font-bold text-stone-900">{item.month}</td>
                                                    <td className="px-5 py-3 text-center font-semibold text-stone-700">
                                                        {item.completed_projects}
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-emerald-600 font-semibold">
                                                        +{item.fast_responses}
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-emerald-600 font-semibold">
                                                        +{item.fast_updates}
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-rose-500 font-semibold">
                                                        -{item.late_tasks}
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-semibold">
                                                        <span className={item.late_presences ? 'text-amber-600' : 'text-stone-400'}>
                                                            {item.late_presences ?? 0}x {latePresPenalty > 0 && `(-${latePresPenalty})`}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-semibold">
                                                        <span className={item.alpha_days ? 'text-rose-500' : 'text-stone-400'}>
                                                            {item.alpha_days ?? 0} hari {alphaPresPenalty > 0 && `(-${alphaPresPenalty})`}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-semibold">
                                                        {perfectBonus > 0 ? (
                                                            <span className="text-emerald-600">Ya (+{perfectBonus})</span>
                                                        ) : (
                                                            <span className="text-stone-400">Tidak</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-[10px] shadow-sm ${getScoreBadgeClass(item.score)}`}>
                                                            {item.score} Poin
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </>
    );
}
