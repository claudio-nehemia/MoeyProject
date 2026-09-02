import React from 'react';

interface WorkStatusTabsProps {
    activeTab: 'belum' | 'sudah';
    onChange: (tab: 'belum' | 'sudah') => void;
    countBelum: number;
    countSudah: number;
    belumLabel?: string;
    sudahLabel?: string;
}

export default function WorkStatusTabs({
    activeTab,
    onChange,
    countBelum,
    countSudah,
    belumLabel = 'Belum Dikerjakan',
    sudahLabel = 'Sudah Dikerjakan',
}: WorkStatusTabsProps) {
    return (
        <div className="flex items-center gap-2 mb-5 border-b border-slate-200">
            <button
                type="button"
                onClick={() => onChange('belum')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'belum'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
                <span>⏳ {belumLabel}</span>
                <span
                    className={`px-2 py-0.5 text-xs rounded-full font-bold transition-all ${
                        activeTab === 'belum'
                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {countBelum}
                </span>
            </button>
            <button
                type="button"
                onClick={() => onChange('sudah')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'sudah'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
                <span>✓ {sudahLabel}</span>
                <span
                    className={`px-2 py-0.5 text-xs rounded-full font-bold transition-all ${
                        activeTab === 'sudah'
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {countSudah}
                </span>
            </button>
        </div>
    );
}
