import React from 'react';
import JenisItemCard from '@/pages/ItemPekerjaan/components/JenisItemCard';

interface BahanBaku {
    id: number;
    nama_item: string;
    pivot?: {
        harga_dasar: number;
        harga_jasa: number;
    };
}

interface Produk {
    id: number;
    nama_produk: string;
    harga_dasar?: number;
    harga_jasa?: number;
    bahan_bakus?: BahanBaku[];
}

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

interface ProdukData {
    id?: number;
    temp_id: number;
    produk_id: string | number;
    produk_name?: string;
    quantity: number;
    panjang: string | number;
    lebar: string | number;
    tinggi: string | number;
    jenisItems: FormJenisItem[];
    selected_bahan_bakus: number[];
}

interface ProdukCardProps {
    ruanganTempId: number;
    produk: ProdukData;
    produkIndex: number;
    produksList: Produk[];
    jenisItems: JenisItem[];
    items: Item[];
    onRemoveProduk: (ruanganTempId: number, produkTempId: number) => void;
    onUpdateProduk: (ruanganTempId: number, produkTempId: number, field: string, value: any) => void;
    onToggleBahanBaku: (ruanganTempId: number, produkTempId: number, bahanBakuId: number) => void;
    onSelectAllBahanBaku: (ruanganTempId: number, produkTempId: number, bahanBakuIds: number[]) => void;
    onClearAllBahanBaku: (ruanganTempId: number, produkTempId: number) => void;
    onAddJenisItem: (ruanganTempId: number, produkTempId: number) => void;
    onRemoveJenisItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onUpdateJenisItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, value: string) => void;
    onAddItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onRemoveItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number) => void;
    onUpdateItem: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number, field: string, value: any) => void;
}

export default function ProdukCard({
    ruanganTempId,
    produk,
    produkIndex,
    produksList,
    jenisItems,
    items,
    onRemoveProduk,
    onUpdateProduk,
    onToggleBahanBaku,
    onSelectAllBahanBaku,
    onClearAllBahanBaku,
    onAddJenisItem,
    onRemoveJenisItem,
    onUpdateJenisItem,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
}: ProdukCardProps) {
    const selectedProduk = produksList.find((p) => p.id.toString() === produk.produk_id.toString());
    const masterBahanBakus = selectedProduk?.bahan_bakus || [];

    const getAvailableItems = (jenisItemId: string | number) => {
        return items.filter((item) => item.jenis_item_id === parseInt(jenisItemId.toString()));
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {/* Produk Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex justify-between items-center">
                <h4 className="text-white font-medium flex items-center gap-2">
                    <span className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-xs">
                        {produkIndex + 1}
                    </span>
                    Produk #{produkIndex + 1}
                    {produk.id && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">ID: {produk.id}</span>
                    )}
                </h4>
                <button
                    type="button"
                    onClick={() => onRemoveProduk(ruanganTempId, produk.temp_id)}
                    className="bg-red-500/20 text-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Produk Selection & Quantity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Pilih Produk <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={produk.produk_id}
                            onChange={(e) => onUpdateProduk(ruanganTempId, produk.temp_id, 'produk_id', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            required
                        >
                            <option value="">-- Pilih Produk --</option>
                            {produksList.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama_produk}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={produk.quantity}
                            onChange={(e) => onUpdateProduk(ruanganTempId, produk.temp_id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Dimensi */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Dimensi (m)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Panjang"
                                value={produk.panjang}
                                onChange={(e) => onUpdateProduk(ruanganTempId, produk.temp_id, 'panjang', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                            />
                            <p className="mt-0.5 text-xs text-slate-500">Panjang</p>
                        </div>
                        <div>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Lebar"
                                value={produk.lebar}
                                onChange={(e) => onUpdateProduk(ruanganTempId, produk.temp_id, 'lebar', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                            />
                            <p className="mt-0.5 text-xs text-slate-500">Lebar</p>
                        </div>
                        <div>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Tinggi"
                                value={produk.tinggi}
                                onChange={(e) => onUpdateProduk(ruanganTempId, produk.temp_id, 'tinggi', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                            />
                            <p className="mt-0.5 text-xs text-slate-500">Tinggi</p>
                        </div>
                    </div>
                </div>

                {/* Bahan Baku Selection */}
                {masterBahanBakus.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5">
                            <div className="flex justify-between items-center">
                                <h5 className="text-white font-medium text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Pilih Bahan Baku 
                                    <span className="text-amber-200 text-xs font-normal">
                                        ({produk.selected_bahan_bakus?.length || 0} dipilih)
                                    </span>
                                </h5>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAllBahanBaku(ruanganTempId, produk.temp_id, masterBahanBakus.map(bb => bb.id))}
                                        className="bg-white/20 text-white px-2 py-1 rounded text-xs font-medium hover:bg-white/30 transition-colors"
                                    >
                                        Pilih Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onClearAllBahanBaku(ruanganTempId, produk.temp_id)}
                                        className="bg-white/10 text-white px-2 py-1 rounded text-xs font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {masterBahanBakus.map((bb) => {
                                    const isSelected = produk.selected_bahan_bakus?.includes(bb.id) || false;
                                    return (
                                        <div
                                            key={bb.id}
                                            onClick={() => onToggleBahanBaku(ruanganTempId, produk.temp_id, bb.id)}
                                            className={`rounded-lg p-2.5 border-2 flex items-center gap-2 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-amber-100 border-amber-400 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-amber-300'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'
                                            }`}>
                                                {isSelected && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{bb.nama_item}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Jenis Items Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-slate-800 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Finishing & Aksesoris
                        </h5>
                        <button
                            type="button"
                            onClick={() => onAddJenisItem(ruanganTempId, produk.temp_id)}
                            className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Kategori
                        </button>
                    </div>

                    {produk.jenisItems.filter(j => j.jenis_item_name?.toLowerCase() !== 'bahan baku').length === 0 ? (
                        <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                            <p className="text-slate-400 text-xs">Belum ada kategori. Klik "Tambah Kategori"</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {produk.jenisItems
                                .filter(j => j.jenis_item_name?.toLowerCase() !== 'bahan baku')
                                .map((jenisItem) => (
                                    <JenisItemCard
                                        key={jenisItem.temp_id}
                                        ruanganTempId={ruanganTempId}
                                        produkTempId={produk.temp_id}
                                        jenisItem={jenisItem}
                                        jenisItemsList={jenisItems}
                                        items={items}
                                        getAvailableItems={getAvailableItems}
                                        onRemoveJenisItem={onRemoveJenisItem}
                                        onUpdateJenisItem={onUpdateJenisItem}
                                        onAddItem={onAddItem}
                                        onRemoveItem={onRemoveItem}
                                        onUpdateItem={onUpdateItem}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
