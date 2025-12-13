import { useState } from 'react';
import { ItemPekerjaanData } from './types';
import TimelineInput from './TimelineInput';
import RuanganCard from './RuanganCard';

interface Props {
    itemPekerjaan: ItemPekerjaanData;
    ipIndex: number;
    onUpdateTimeline: (ipId: number, field: 'workplan_start_date' | 'workplan_end_date', value: string) => void;
    onUpdateRuanganTimeline: (ipId: number, ruanganIndex: number, tahapan: string, field: 'start_date' | 'end_date', value: string) => void;
    onApplyRuanganTimelineToProduks: (ipId: number, ruanganIndex: number, tahapan: string) => void;
    onUpdateWorkplanItem: (ipId: number, ruanganIndex: number, produkId: number, itemIndex: number, field: string, value: any) => void;
    onAddWorkplanItem: (ipId: number, ruanganIndex: number, produkId: number) => void;
    onRemoveWorkplanItem: (ipId: number, ruanganIndex: number, produkId: number, itemIndex: number) => void;
}

export default function ItemPekerjaanCard({
    itemPekerjaan,
    ipIndex,
    onUpdateTimeline,
    onUpdateRuanganTimeline,
    onApplyRuanganTimelineToProduks,
    onUpdateWorkplanItem,
    onAddWorkplanItem,
    onRemoveWorkplanItem,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(ipIndex === 0);

    // Hitung total
    const totalRuangans = itemPekerjaan.ruangans.length;
    const totalProduks = itemPekerjaan.ruangans.reduce((sum, r) => sum + r.produks.length, 0);

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition-all border-stone-200">
            {/* Item Pekerjaan Header */}
            <div
                className="flex cursor-pointer items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-bold text-white shadow-lg">
                        {ipIndex + 1}
                    </div>
                    <div>
                        <h2 className="font-bold text-stone-900 text-lg">{itemPekerjaan.nama_item}</h2>
                        <p className="text-xs text-stone-500">
                            {totalRuangans} ruangan • {totalProduks} produk
                            {itemPekerjaan.kontrak && (
                                <> • Kontrak: {itemPekerjaan.kontrak.durasi_kontrak} hari</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timeline Summary */}
                    {itemPekerjaan.workplan_start_date && itemPekerjaan.workplan_end_date && (
                        <div className="text-right text-xs">
                            <p className="font-medium text-stone-900">
                                {itemPekerjaan.max_days} hari
                            </p>
                            <p className="text-stone-500">
                                {itemPekerjaan.workplan_start_date} - {itemPekerjaan.workplan_end_date}
                            </p>
                        </div>
                    )}

                    <svg
                        className={`h-6 w-6 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-stone-200 p-4">
                    {/* Timeline Input for Item Pekerjaan */}
                    <TimelineInput
                        workplanStartDate={itemPekerjaan.workplan_start_date}
                        workplanEndDate={itemPekerjaan.workplan_end_date}
                        maxDays={itemPekerjaan.max_days}
                        onUpdateStartDate={(value) => onUpdateTimeline(itemPekerjaan.id, 'workplan_start_date', value)}
                        onUpdateEndDate={(value) => onUpdateTimeline(itemPekerjaan.id, 'workplan_end_date', value)}
                    />

                    {/* Ruangan List */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-stone-900">🚪 Daftar Ruangan</h4>

                        {itemPekerjaan.ruangans.map((ruangan, ruanganIndex) => (
                            <RuanganCard
                                key={ruangan.nama_ruangan || `ruangan-${ruanganIndex}`}
                                ruangan={ruangan}
                                ipId={itemPekerjaan.id}
                                ipIndex={ipIndex}
                                ruanganIndex={ruanganIndex}
                                minDate={itemPekerjaan.workplan_start_date}
                                maxDate={itemPekerjaan.workplan_end_date}
                                onUpdateRuanganTimeline={(rIdx, tahapan, field, value) =>
                                    onUpdateRuanganTimeline(itemPekerjaan.id, rIdx, tahapan, field, value)
                                }
                                onApplyRuanganTimelineToProduks={(rIdx, tahapan) =>
                                    onApplyRuanganTimelineToProduks(itemPekerjaan.id, rIdx, tahapan)
                                }
                                onUpdateWorkplanItem={(rIdx, produkId, itemIndex, field, value) =>
                                    onUpdateWorkplanItem(itemPekerjaan.id, rIdx, produkId, itemIndex, field, value)
                                }
                                onAddWorkplanItem={(rIdx, produkId) =>
                                    onAddWorkplanItem(itemPekerjaan.id, rIdx, produkId)
                                }
                                onRemoveWorkplanItem={(rIdx, produkId, itemIndex) =>
                                    onRemoveWorkplanItem(itemPekerjaan.id, rIdx, produkId, itemIndex)
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
