import React from 'react';
import ProdukCard from '@/pages/ItemPekerjaan/components/ProdukCard';

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

interface RuanganData {
    temp_id: number;
    nama_ruangan: string;
    produks: ProdukData[];
}

interface RuanganCardProps {
    ruangan: RuanganData;
    ruanganIndex: number;
    produks: Produk[];
    jenisItems: JenisItem[];
    items: Item[];
    onUpdateRuanganName: (ruanganTempId: number, nama: string) => void;
    onRemoveRuangan: (ruanganTempId: number) => void;
    onAddProdukToRuangan: (ruanganTempId: number) => void;
    onRemoveProdukFromRuangan: (ruanganTempId: number, produkTempId: number) => void;
    onUpdateProdukInRuangan: (ruanganTempId: number, produkTempId: number, field: string, value: any) => void;
    onToggleBahanBakuInRuangan: (ruanganTempId: number, produkTempId: number, bahanBakuId: number) => void;
    onSelectAllBahanBakuInRuangan: (ruanganTempId: number, produkTempId: number, bahanBakuIds: number[]) => void;
    onClearAllBahanBakuInRuangan: (ruanganTempId: number, produkTempId: number) => void;
    onAddJenisItemInRuangan: (ruanganTempId: number, produkTempId: number) => void;
    onRemoveJenisItemInRuangan: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onUpdateJenisItemInRuangan: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, value: string) => void;
    onAddItemInRuangan: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number) => void;
    onRemoveItemInRuangan: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number) => void;
    onUpdateItemInRuangan: (ruanganTempId: number, produkTempId: number, jenisItemTempId: number, itemTempId: number, field: string, value: any) => void;
}

export default function RuanganCard({
    ruangan,
    ruanganIndex,
    produks,
    jenisItems,
    items,
    onUpdateRuanganName,
    onRemoveRuangan,
    onAddProdukToRuangan,
    onRemoveProdukFromRuangan,
    onUpdateProdukInRuangan,
    onToggleBahanBakuInRuangan,
    onSelectAllBahanBakuInRuangan,
    onClearAllBahanBakuInRuangan,
    onAddJenisItemInRuangan,
    onRemoveJenisItemInRuangan,
    onUpdateJenisItemInRuangan,
    onAddItemInRuangan,
    onRemoveItemInRuangan,
    onUpdateItemInRuangan,
}: RuanganCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Ruangan Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <label className="text-white/80 text-xs font-medium block mb-1">
                                Ruangan #{ruanganIndex + 1}
                            </label>
                            <input
                                type="text"
                                value={ruangan.nama_ruangan}
                                onChange={(e) => onUpdateRuanganName(ruangan.temp_id, e.target.value)}
                                className="w-full bg-white/20 border-0 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
                                placeholder="Nama Ruangan (cth: Dapur, Kamar Tidur)"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemoveRuangan(ruangan.temp_id)}
                        className="ml-4 bg-red-500/20 text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Ruangan
                    </button>
                </div>
            </div>

            {/* Ruangan Content */}
            <div className="p-6">
                {/* Produk List */}
                {ruangan.produks.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <p className="text-slate-500 text-sm mb-1">Belum ada produk di ruangan ini</p>
                        <p className="text-slate-400 text-xs">Klik tombol "Tambah Produk" di bawah</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ruangan.produks.map((produk, pIndex) => (
                            <ProdukCard
                                key={produk.temp_id}
                                ruanganTempId={ruangan.temp_id}
                                produk={produk}
                                produkIndex={pIndex}
                                produksList={produks}
                                jenisItems={jenisItems}
                                items={items}
                                onRemoveProduk={onRemoveProdukFromRuangan}
                                onUpdateProduk={onUpdateProdukInRuangan}
                                onToggleBahanBaku={onToggleBahanBakuInRuangan}
                                onSelectAllBahanBaku={onSelectAllBahanBakuInRuangan}
                                onClearAllBahanBaku={onClearAllBahanBakuInRuangan}
                                onAddJenisItem={onAddJenisItemInRuangan}
                                onRemoveJenisItem={onRemoveJenisItemInRuangan}
                                onUpdateJenisItem={onUpdateJenisItemInRuangan}
                                onAddItem={onAddItemInRuangan}
                                onRemoveItem={onRemoveItemInRuangan}
                                onUpdateItem={onUpdateItemInRuangan}
                            />
                        ))}
                    </div>
                )}

                {/* Add Produk Button */}
                <button
                    type="button"
                    onClick={() => onAddProdukToRuangan(ruangan.temp_id)}
                    className="mt-4 w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Produk ke Ruangan Ini
                </button>
            </div>
        </div>
    );
}
