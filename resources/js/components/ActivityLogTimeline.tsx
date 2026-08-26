import { useState } from 'react';

export interface ActivityLogItem {
    id: number;
    order_id?: number | null;
    user_id?: number | null;
    user_name: string | null;
    user_role: string | null;
    subject_type?: string | null;
    subject_id?: number | null;
    action: string;
    title: string | null;
    description: string | null;
    properties?: {
        changes?: Array<{
            field: string;
            label: string;
            old: string | null;
            new: string | null;
        }>;
        team?: string[] | null;
        file_name?: string | null;
        file_type?: string | null;
        layout_count?: number;
        foto_count?: number;
        mom_count?: number;
        new_layout_count?: number;
        new_foto_count?: number;
        new_mom_count?: number;
        total_foto_count?: number;
        response_by?: string;
        response_time?: string;
        [key: string]: any;
    } | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        role?: {
            nama_role: string;
        } | null;
    } | null;
    order?: {
        id: number;
        nama_project: string;
        customer_name: string;
    } | null;
}

interface Props {
    logs?: ActivityLogItem[];
    title?: string;
    emptyMessage?: string;
    showOrderLink?: boolean;
}

export default function ActivityLogTimeline({
    logs = [],
    title = 'Riwayat Perubahan & Aktivitas',
    emptyMessage = 'Belum ada catatan perubahan untuk data ini.',
    showOrderLink = false,
}: Props) {
    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffSeconds < 60) return 'baru saja';
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) return `${diffHours} jam yang lalu`;
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 30) return `${diffDays} hari yang lalu`;
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths < 12) return `${diffMonths} bulan yang lalu`;
            return `${Math.floor(diffMonths / 12)} tahun yang lalu`;
        } catch {
            return '';
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'create':
                return {
                    label: 'Dibuat',
                    bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    dot: 'bg-emerald-500',
                };
            case 'update':
                return {
                    label: 'Diperbarui',
                    bg: 'bg-blue-100 text-blue-800 border-blue-300',
                    dot: 'bg-blue-500',
                };
            case 'publish':
                return {
                    label: 'Dipublikasikan',
                    bg: 'bg-teal-100 text-teal-800 border-teal-300',
                    dot: 'bg-teal-500',
                };
            case 'draft':
                return {
                    label: 'Simpan Draft',
                    bg: 'bg-amber-100 text-amber-800 border-amber-300',
                    dot: 'bg-amber-500',
                };
            case 'response':
            case 'response_pm':
                return {
                    label: 'Respon Dicatat',
                    bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    dot: 'bg-indigo-500',
                };
            case 'delete_file':
                return {
                    label: 'Hapus File',
                    bg: 'bg-rose-100 text-rose-800 border-rose-300',
                    dot: 'bg-rose-500',
                };
            case 'delete':
                return {
                    label: 'Dihapus',
                    bg: 'bg-red-100 text-red-800 border-red-300',
                    dot: 'bg-red-500',
                };
            default:
                return {
                    label: action.replace('_', ' '),
                    bg: 'bg-stone-100 text-stone-700 border-stone-300',
                    dot: 'bg-stone-400',
                };
        }
    };

    const getRoleColor = (roleName: string | null) => {
        if (!roleName) return 'bg-stone-100 text-stone-600 border-stone-200';
        const lower = roleName.toLowerCase();
        if (lower.includes('admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (lower.includes('marketing')) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (lower.includes('survey') || lower.includes('drafter')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (lower.includes('desain')) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (lower.includes('supervisor') || lower.includes('manager')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        return 'bg-stone-100 text-stone-700 border-stone-200';
    };

    const getAvatarInitials = (name: string | null) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-5 sm:p-7">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
                        <p className="text-xs text-stone-500">Merekam riwayat pengguna yang membuat atau mengubah data</p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-stone-100 text-stone-600 rounded-full">
                    {logs.length} catatan
                </span>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <svg className="w-10 h-10 text-stone-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-stone-500">{emptyMessage}</p>
                </div>
            ) : (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-blue-300 before:to-stone-200">
                    {logs.map((log) => {
                        const badge = getActionBadge(log.action);
                        const isExpanded = !!expandedIds[log.id];
                        const userName = log.user?.name || log.user_name || 'System';
                        const userRole = log.user?.role?.nama_role || log.user_role || '-';
                        const hasDetails = !!(
                            (log.properties?.changes && log.properties.changes.length > 0) ||
                            (log.properties?.team && log.properties.team.length > 0) ||
                            log.properties?.file_name
                        );

                        return (
                            <div key={log.id} className="relative group">
                                {/* Dot on timeline */}
                                <div className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${badge.dot}`} />

                                <div className="bg-gradient-to-br from-stone-50/80 to-white rounded-xl border border-stone-200 p-4 transition-all hover:shadow-md hover:border-cyan-200">
                                    {/* Header: User Info & Badges */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                                {getAvatarInitials(userName)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold text-stone-900 truncate">
                                                        {userName}
                                                    </span>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getRoleColor(userRole)}`}>
                                                        {userRole}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-stone-500 font-medium whitespace-nowrap" title={formatDate(log.created_at)}>
                                                {formatRelativeTime(log.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Project / Order Link if applicable */}
                                    {showOrderLink && log.order && (
                                        <div className="mb-2 text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md inline-block border border-cyan-100">
                                            Project: {log.order.nama_project} (#{log.order.id})
                                        </div>
                                    )}

                                    {/* Title & Description */}
                                    {log.title && (
                                        <h4 className="text-sm font-semibold text-stone-800 mb-1">
                                            {log.title}
                                        </h4>
                                    )}

                                    {log.description && (
                                        <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                            {log.description}
                                        </p>
                                    )}

                                    {/* Expandable Details for Detailed Diffs */}
                                    {hasDetails && (
                                        <div className="mt-3 pt-2 border-t border-stone-100">
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(log.id)}
                                                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 inline-flex items-center gap-1 transition-colors"
                                            >
                                                <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Perubahan'}</span>
                                                <svg
                                                    className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-2.5 space-y-2 bg-stone-100/70 rounded-lg p-3 border border-stone-200/70 text-xs">
                                                    {log.properties?.changes && log.properties.changes.length > 0 && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                                                                        <th className="pb-1 pr-2">Atribut / Kolom</th>
                                                                        <th className="pb-1 px-2">Nilai Sebelumnya</th>
                                                                        <th className="pb-1 pl-2">Nilai Baru</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-stone-200/50">
                                                                    {log.properties.changes.map((ch, idx) => (
                                                                        <tr key={idx} className="text-stone-700">
                                                                            <td className="py-1.5 pr-2 font-medium text-stone-900">{ch.label}</td>
                                                                            <td className="py-1.5 px-2 text-rose-700 line-through max-w-[200px] truncate">{ch.old || '(kosong)'}</td>
                                                                            <td className="py-1.5 pl-2 text-emerald-700 font-semibold max-w-[200px] truncate">{ch.new || '(kosong)'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {log.properties?.team && log.properties.team.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="font-semibold text-stone-700">Anggota Tim: </span>
                                                            <span className="text-stone-600">{log.properties.team.join(', ')}</span>
                                                        </div>
                                                    )}

                                                    {log.properties?.file_name && (
                                                        <div className="mt-1">
                                                            <span className="font-semibold text-stone-700">Nama File: </span>
                                                            <span className="text-stone-600 font-mono">{log.properties.file_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer: Full Timestamp */}
                                    <div className="mt-2.5 text-[11px] text-stone-400 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{formatDate(log.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
