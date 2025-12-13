import { useState } from 'react';
import { ProdukData, calculateTotalDays } from './types';
import WorkplanItemForm from './WorkplanItemForm';

interface Props {
    produk: ProdukData;
    ipIndex: number;
    ruanganIndex: number;
    produkIndex: number;
    minDate: string;
    maxDate: string;
    onUpdateWorkplanItem: (produkId: number, itemIndex: number, field: string, value: any) => void;
    onAddWorkplanItem: (produkId: number) => void;
    onRemoveWorkplanItem: (produkId: number, itemIndex: number) => void;
}

export default function ProdukCard({
    produk,
    ipIndex,
    ruanganIndex,
    produkIndex,
    minDate,
    maxDate,
    onUpdateWorkplanItem,
    onAddWorkplanItem,
    onRemoveWorkplanItem,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const produkTotalDays = calculateTotalDays(produk.workplan_items);

    return (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            {/* Produk Header */}
            <div
                className="flex cursor-pointer items-center justify-between p-3 hover:bg-stone-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-stone-200 text-xs font-semibold text-stone-600">
                        {ipIndex + 1}.{ruanganIndex + 1}.{produkIndex + 1}
                    </div>
                    <div>
                        <h6 className="font-medium text-stone-900 text-sm">{produk.nama_produk}</h6>
                        <p className="text-xs text-stone-500">
                            Qty: {produk.quantity} • {produk.dimensi}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                        <p className="text-stone-500">
                            {produkTotalDays} hari • {produk.workplan_items.length} tahapan
                        </p>
                    </div>
                    <svg
                        className={`h-4 w-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Produk Expanded - Workplan Items */}
            {isExpanded && (
                <div className="border-t border-stone-200 bg-stone-50 p-4">
                    <div className="space-y-3">
                        {produk.workplan_items.map((item, itemIndex) => (
                            <WorkplanItemForm
                                key={itemIndex}
                                item={item}
                                itemIndex={itemIndex}
                                canDelete={produk.workplan_items.length > 1}
                                minDate={minDate}
                                maxDate={maxDate}
                                onUpdate={(idx, field, value) => onUpdateWorkplanItem(produk.id, idx, field, value)}
                                onRemove={(idx) => onRemoveWorkplanItem(produk.id, idx)}
                            />
                        ))}
                    </div>

                    {/* Add Tahapan Button */}
                    <button
                        type="button"
                        onClick={() => onAddWorkplanItem(produk.id)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Tahapan
                    </button>
                </div>
            )}
        </div>
    );
}
