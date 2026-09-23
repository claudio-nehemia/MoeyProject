import React from 'react';

interface MoodboardFilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

export default function MoodboardFilterBar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: MoodboardFilterBarProps) {
    return (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-500 transition-colors text-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Cari project atau company..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full rounded-xl border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none"
                />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <select 
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="flex-1 sm:flex-none py-3 pl-4 pr-10 rounded-xl border-slate-200 bg-white text-sm text-slate-600 shadow-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none"
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending (Menunggu Review)</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Revisi">Revisi</option>
                    <option value="No Response">No Response</option>
                </select>
            </div>
        </div>
    );
}
