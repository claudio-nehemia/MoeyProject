import { useState } from 'react';
import { RuanganData, DEFAULT_TAHAPAN, calculateMaxDays } from './types';
import ProdukCard from './ProdukCard';

interface Props {
    ruangan: RuanganData;
    ipId: number;
    ipIndex: number;
    ruanganIndex: number;
    minDate: string;
    maxDate: string;
    onUpdateRuanganTimeline: (ruanganIndex: number, tahapan: string, field: 'start_date' | 'end_date', value: string) => void;
    onApplyRuanganTimelineToProduks: (ruanganIndex: number, tahapan: string) => void;
    onUpdateWorkplanItem: (ruanganIndex: number, produkId: number, itemIndex: number, field: string, value: any) => void;
    onAddWorkplanItem: (ruanganIndex: number, produkId: number) => void;
    onRemoveWorkplanItem: (ruanganIndex: number, produkId: number, itemIndex: number) => void;
}

export default function RuanganCard({
    ruangan,
    ipId,
    ipIndex,
    ruanganIndex,
    minDate,
    maxDate,
    onUpdateRuanganTimeline,
    onApplyRuanganTimelineToProduks,
    onUpdateWorkplanItem,
    onAddWorkplanItem,
    onRemoveWorkplanItem,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTimelineForm, setShowTimelineForm] = useState(false);

    // Hitung total produk
    const totalProduks = ruangan.produks.length;
    const totalQty = ruangan.produks.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="overflow-hidden rounded-xl border-2 border-cyan-200 bg-white shadow-sm">
            {/* Ruangan Header */}
            <div
                className="flex cursor-pointer items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-sm font-bold text-white shadow">
                        {ipIndex + 1}.{ruanganIndex + 1}
                    </div>
                    <div>
                        <h4 className="font-bold text-cyan-900">🚪 {ruangan.nama_ruangan || 'Tanpa Ruangan'}</h4>
                        <p className="text-xs text-cyan-600">
                            {totalProduks} produk • {totalQty} unit
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTimelineForm(!showTimelineForm);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            showTimelineForm 
                                ? 'bg-cyan-600 text-white' 
                                : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                        }`}
                    >
                        ⏱️ Atur Timeline Ruangan
                    </button>
                    <svg
                        className={`h-5 w-5 text-cyan-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Timeline Form untuk Ruangan */}
            {showTimelineForm && (
                <div className="border-t border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h5 className="font-semibold text-cyan-800 text-sm">
                            ⏱️ Timeline per Tahapan (akan auto-fill ke semua produk di ruangan ini)
                        </h5>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {DEFAULT_TAHAPAN.map((tahapan) => {
                            const timeline = ruangan.timeline[tahapan] || { start_date: null, end_date: null };
                            const duration = calculateMaxDays(timeline.start_date || '', timeline.end_date || '');
                            
                            return (
                                <div key={tahapan} className="flex items-center gap-2 rounded-lg bg-white p-2 border border-cyan-100">
                                    <span className="w-28 text-xs font-medium text-stone-700 truncate">{tahapan}</span>
                                    <input
                                        type="date"
                                        value={timeline.start_date || ''}
                                        onChange={(e) => onUpdateRuanganTimeline(ruanganIndex, tahapan, 'start_date', e.target.value)}
                                        min={minDate}
                                        max={maxDate}
                                        className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                                        placeholder="Mulai"
                                    />
                                    <span className="text-stone-400 text-xs">→</span>
                                    <input
                                        type="date"
                                        value={timeline.end_date || ''}
                                        onChange={(e) => onUpdateRuanganTimeline(ruanganIndex, tahapan, 'end_date', e.target.value)}
                                        min={timeline.start_date || minDate}
                                        max={maxDate}
                                        className="flex-1 rounded border border-stone-300 px-2 py-1 text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                                        placeholder="Selesai"
                                    />
                                    <span className="w-16 text-center text-xs font-semibold text-cyan-700">
                                        {duration > 0 ? `${duration}hr` : '-'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onApplyRuanganTimelineToProduks(ruanganIndex, tahapan)}
                                        disabled={!timeline.start_date || !timeline.end_date}
                                        className="rounded bg-cyan-500 px-2 py-1 text-xs font-medium text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Terapkan ke semua produk"
                                    >
                                        Apply
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            DEFAULT_TAHAPAN.forEach(tahapan => {
                                if (ruangan.timeline[tahapan]?.start_date && ruangan.timeline[tahapan]?.end_date) {
                                    onApplyRuanganTimelineToProduks(ruanganIndex, tahapan);
                                }
                            });
                        }}
                        className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-cyan-600 hover:to-teal-700"
                    >
                        ✨ Apply Semua Timeline ke Produk
                    </button>
                </div>
            )}

            {/* Expanded Content - List Produk */}
            {isExpanded && (
                <div className="border-t border-cyan-200 p-4">
                    <h5 className="mb-3 font-semibold text-stone-700 text-sm">📦 Daftar Produk</h5>
                    <div className="space-y-3">
                        {ruangan.produks.map((produk, produkIndex) => (
                            <ProdukCard
                                key={produk.id}
                                produk={produk}
                                ipIndex={ipIndex}
                                ruanganIndex={ruanganIndex}
                                produkIndex={produkIndex}
                                minDate={minDate}
                                maxDate={maxDate}
                                onUpdateWorkplanItem={(produkId, itemIndex, field, value) => 
                                    onUpdateWorkplanItem(ruanganIndex, produkId, itemIndex, field, value)
                                }
                                onAddWorkplanItem={(produkId) => onAddWorkplanItem(ruanganIndex, produkId)}
                                onRemoveWorkplanItem={(produkId, itemIndex) => 
                                    onRemoveWorkplanItem(ruanganIndex, produkId, itemIndex)
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
