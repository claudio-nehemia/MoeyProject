interface Props {
    workplanStartDate: string;
    workplanEndDate: string;
    maxDays: number;
    onUpdateStartDate: (value: string) => void;
    onUpdateEndDate: (value: string) => void;
}

export default function TimelineInput({
    workplanStartDate,
    workplanEndDate,
    maxDays,
    onUpdateStartDate,
    onUpdateEndDate,
}: Props) {
    return (
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-amber-900 text-lg">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Timeline Project
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                        Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={workplanStartDate}
                        onChange={(e) => onUpdateStartDate(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">
                        Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={workplanEndDate}
                        onChange={(e) => onUpdateEndDate(e.target.value)}
                        min={workplanStartDate}
                        className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        required
                    />
                </div>
                <div className="flex items-end">
                    <div className="w-full rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-xs text-stone-500">Total Durasi</p>
                        <p className="text-2xl font-bold text-amber-700">
                            {maxDays > 0 ? `${maxDays} hari` : '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
