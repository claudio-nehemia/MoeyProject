import React from 'react';

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    nama_item: string;
    jenis_item_id: number;
}

interface FormItem {
    id?: number;
    temp_id: number;
    item_id: string | number;
    quantity: number;
    notes: string;
}

interface FormJenisItem {
    id?: number;
    temp_id: number;
    jenis_item_id: string | number;
    jenis_item_name?: string;
    items: FormItem[];
}

interface JenisItemCardProps {
    ruanganTempId: number;
    produkTempId: number;
    jenisItem: FormJenisItem;
    jenisItemsList: JenisItem[];
    items: Item[];
    getAvailableItems: (jenisItemId: string | number) => Item[];
    onRemoveJenisItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onUpdateJenisItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, value: string) => void;
    onAddItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onRemoveItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number) => void;
    onUpdateItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number, field: string, value: any) => void;
}

export default function JenisItemCard({
    ruanganTempId,
    produkTempId,
    jenisItem,
    jenisItemsList,
    items,
    getAvailableItems,
    onRemoveJenisItem,
    onUpdateJenisItem,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
}: JenisItemCardProps) {
    const isAksesoris = jenisItem.jenis_item_name?.toLowerCase() === 'aksesoris';
    const availableItems = getAvailableItems(jenisItem.jenis_item_id);

    return (
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            {/* Jenis Item Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                    <select
                        value={jenisItem.jenis_item_id}
                        onChange={(e) => onUpdateJenisItem(ruanganTempId, produkTempId, jenisItem.temp_id, e.target.value)}
                        className="bg-white/20 text-white border-0 rounded px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                        required
                    >
                        <option value="">-- Pilih Jenis --</option>
                        {jenisItemsList.map((j) => (
                            <option key={j.id} value={j.id}>
                                {j.nama_jenis_item}
                            </option>
                        ))}
                    </select>
                    {jenisItem.id && (
                        <span className="text-xs text-white/70 bg-white/20 px-1.5 py-0.5 rounded">
                            ID: {jenisItem.id}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => onRemoveJenisItem(ruanganTempId, produkTempId, jenisItem.temp_id)}
                    className="w-6 h-6 bg-red-500/20 text-white rounded flex items-center justify-center hover:bg-red-500/40 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Items List */}
            {jenisItem.jenis_item_id && (
                <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-600">Daftar Item</span>
                        <button
                            type="button"
                            onClick={() => onAddItem(ruanganTempId, produkTempId, jenisItem.temp_id)}
                            className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs font-medium hover:bg-indigo-200 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah
                        </button>
                    </div>

                    {jenisItem.items.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-2">Belum ada item</p>
                    ) : (
                        <div className="space-y-2">
                            {jenisItem.items.map((item) => (
                                <div key={item.temp_id} className="flex gap-2 items-center bg-white rounded-lg p-2 border border-slate-200">
                                    <select
                                        value={item.item_id}
                                        onChange={(e) => onUpdateItem(ruanganTempId, produkTempId, jenisItem.temp_id, item.temp_id, 'item_id', e.target.value)}
                                        className={`${isAksesoris ? 'flex-1' : 'w-1/2'} border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                        required
                                    >
                                        <option value="">-- Pilih Item --</option>
                                        {availableItems.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.nama_item}
                                            </option>
                                        ))}
                                    </select>

                                    {!isAksesoris && (
                                        <input
                                            type="text"
                                            value={item.notes}
                                            onChange={(e) => onUpdateItem(ruanganTempId, produkTempId, jenisItem.temp_id, item.temp_id, 'notes', e.target.value)}
                                            className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Notes"
                                        />
                                    )}

                                    {isAksesoris && (
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => onUpdateItem(ruanganTempId, produkTempId, jenisItem.temp_id, item.temp_id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-16 border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="Qty"
                                            required
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => onRemoveItem(ruanganTempId, produkTempId, jenisItem.temp_id, item.temp_id)}
                                        className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center hover:bg-red-200 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
