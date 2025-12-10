import { WorkplanItem, getStatusColor } from './types';

interface Props {
    item: WorkplanItem;
    itemIndex: number;
    canDelete: boolean;
    minDate: string;
    maxDate: string;
    onUpdate: (itemIndex: number, field: string, value: any) => void;
    onRemove: (itemIndex: number) => void;
}

export default function WorkplanItemForm({
    item,
    itemIndex,
    canDelete,
    minDate,
    maxDate,
    onUpdate,
    onRemove,
}: Props) {
    return (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                        {item.urutan}
                    </span>
                    <span className="text-sm font-medium text-stone-700">Tahapan {item.urutan}</span>
                </div>
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => onRemove(itemIndex)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Nama Tahapan */}
                <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-stone-600">Nama Tahapan</label>
                    <input
                        type="text"
                        value={item.nama_tahapan}
                        onChange={(e) => onUpdate(itemIndex, 'nama_tahapan', e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Nama tahapan"
                        required
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Mulai</label>
                    <input
                        type="date"
                        value={item.start_date || ''}
                        onChange={(e) => onUpdate(itemIndex, 'start_date', e.target.value)}
                        min={minDate}
                        max={maxDate}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Selesai</label>
                    <input
                        type="date"
                        value={item.end_date || ''}
                        onChange={(e) => onUpdate(itemIndex, 'end_date', e.target.value)}
                        min={item.start_date || minDate}
                        max={maxDate}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                </div>

                {/* Duration (readonly) */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Durasi</label>
                    <div className="flex h-[38px] items-center justify-center rounded-lg border border-stone-200 bg-stone-100 px-3 text-sm font-semibold text-stone-700">
                        {item.duration_days ? `${item.duration_days} hari` : '-'}
                    </div>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Status */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Status</label>
                    <select
                        value={item.status}
                        onChange={(e) => onUpdate(itemIndex, 'status', e.target.value)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor(item.status)}`}
                    >
                        <option value="planned">📋 Planned</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="done">✅ Done</option>
                        <option value="cancelled">❌ Cancelled</option>
                    </select>
                </div>

                {/* Catatan */}
                <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Catatan</label>
                    <input
                        type="text"
                        value={item.catatan || ''}
                        onChange={(e) => onUpdate(itemIndex, 'catatan', e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Catatan (opsional)"
                    />
                </div>
            </div>
        </div>
    );
}
