import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface ItemOption {
    id: number;
    name: string;
}

interface ItemRow {
    id: number;
    item_id: number;
    item_name: string;
    produk: string;
    jenis_item: string;
    quantity: number;
    keterangan_material: string | null;
    kode_material: string[];
    brand_spek: string[];
    area: string | null;
    foto: string | null;
    foto_file?: File | null;
    available_items: ItemOption[];
}

interface BahanBakuRow {
    id: number;
    item_name: string;
    produk: string;
    harga_dasar: number;
    harga_jasa: number;
    keterangan_bahan_baku: string | null;
    kode_material: string[];
    brand_spek: string[];
    area: string | null;
    foto: string | null;
    foto_file?: File | null;
}

interface Props {
    itemPekerjaan: {
        id: number;
        project_name: string;
        company_name: string;
        customer_name: string;
        items: ItemRow[];
        bahan_bakus: BahanBakuRow[];
    };
}

export default function ApprovalRabEdit({ itemPekerjaan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<ItemRow[]>(
        itemPekerjaan.items.map(i => ({
            ...i,
            kode_material: i.kode_material ?? [],
            brand_spek: i.brand_spek ?? [],
            foto_file: null,
        }))
    );
    const [bahanBakus, setBahanBakus] = useState<BahanBakuRow[]>(
        itemPekerjaan.bahan_bakus.map(b => ({
            ...b,
            kode_material: b.kode_material ?? [],
            brand_spek: b.brand_spek ?? [],
            foto_file: null,
        }))
    );

    // ===== ITEM HELPERS =====
    const updateItem = (id: number, itemId: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, item_id: itemId } : i));
    };

    const updateKeterangan = (id: number, value: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, keterangan_material: value } : i));
    };

    const updateArea = (id: number, value: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, area: value } : i));
    };

    const updateKodeMaterial = (id: number, index: number, value: string) => {
        setItems(prev => prev.map(i => {
            if (i.id !== id) return i;
            const arr = [...i.kode_material];
            arr[index] = value;
            return { ...i, kode_material: arr };
        }));
    };

    const addKodeMaterial = (id: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, kode_material: [...i.kode_material, ''] } : i));
    };

    const removeKodeMaterial = (id: number, index: number) => {
        setItems(prev => prev.map(i => {
            if (i.id !== id) return i;
            return { ...i, kode_material: i.kode_material.filter((_, idx) => idx !== index) };
        }));
    };

    const updateBrandSpek = (id: number, index: number, value: string) => {
        setItems(prev => prev.map(i => {
            if (i.id !== id) return i;
            const arr = [...i.brand_spek];
            arr[index] = value;
            return { ...i, brand_spek: arr };
        }));
    };

    const addBrandSpek = (id: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, brand_spek: [...i.brand_spek, ''] } : i));
    };

    const removeBrandSpek = (id: number, index: number) => {
        setItems(prev => prev.map(i => {
            if (i.id !== id) return i;
            return { ...i, brand_spek: i.brand_spek.filter((_, idx) => idx !== index) };
        }));
    };

    const updateFoto = (id: number, file: File | null) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, foto_file: file } : i));
    };

    // ===== BAHAN BAKU HELPERS =====
    const updateKeteranganBahanBaku = (id: number, value: string) => {
        setBahanBakus(prev => prev.map(b => b.id === id ? { ...b, keterangan_bahan_baku: value } : b));
    };

    const updateAreaBahanBaku = (id: number, value: string) => {
        setBahanBakus(prev => prev.map(b => b.id === id ? { ...b, area: value } : b));
    };

    const updateKodeMaterialBB = (id: number, index: number, value: string) => {
        setBahanBakus(prev => prev.map(b => {
            if (b.id !== id) return b;
            const arr = [...b.kode_material];
            arr[index] = value;
            return { ...b, kode_material: arr };
        }));
    };

    const addKodeMaterialBB = (id: number) => {
        setBahanBakus(prev => prev.map(b => b.id === id ? { ...b, kode_material: [...b.kode_material, ''] } : b));
    };

    const removeKodeMaterialBB = (id: number, index: number) => {
        setBahanBakus(prev => prev.map(b => {
            if (b.id !== id) return b;
            return { ...b, kode_material: b.kode_material.filter((_, idx) => idx !== index) };
        }));
    };

    const updateBrandSpekBB = (id: number, index: number, value: string) => {
        setBahanBakus(prev => prev.map(b => {
            if (b.id !== id) return b;
            const arr = [...b.brand_spek];
            arr[index] = value;
            return { ...b, brand_spek: arr };
        }));
    };

    const addBrandSpekBB = (id: number) => {
        setBahanBakus(prev => prev.map(b => b.id === id ? { ...b, brand_spek: [...b.brand_spek, ''] } : b));
    };

    const removeBrandSpekBB = (id: number, index: number) => {
        setBahanBakus(prev => prev.map(b => {
            if (b.id !== id) return b;
            return { ...b, brand_spek: b.brand_spek.filter((_, idx) => idx !== index) };
        }));
    };

    const updateFotoBB = (id: number, file: File | null) => {
        setBahanBakus(prev => prev.map(b => b.id === id ? { ...b, foto_file: file } : b));
    };

    const handleSave = () => {
        // Validate required photos
        const missingItemPhotos = items.some(i => !i.foto && !i.foto_file);
        const missingBahanPhotos = bahanBakus.some(b => !b.foto && !b.foto_file);
        
        if (missingItemPhotos || missingBahanPhotos) {
            alert('Semua item dan bahan baku wajib memiliki foto!');
            return;
        }

        setSaving(true);
        router.post(
            `/approval-material/${itemPekerjaan.id}`,
            {
                _method: 'put',
                items: items.map((i) => ({
                    id: i.id,
                    item_id: i.item_id,
                    keterangan_material: i.keterangan_material,
                    kode_material: i.kode_material.filter(k => k.trim() !== ''),
                    brand_spek: i.brand_spek.filter(b => b.trim() !== ''),
                    area: i.area,
                    foto: i.foto_file,
                })),
                bahan_bakus: bahanBakus.map((b) => ({
                    id: b.id,
                    keterangan_bahan_baku: b.keterangan_bahan_baku,
                    kode_material: b.kode_material.filter(k => k.trim() !== ''),
                    brand_spek: b.brand_spek.filter(bs => bs.trim() !== ''),
                    area: b.area,
                    foto: b.foto_file,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    /** Reusable tag-list input component */
    const TagListInput = ({
        label,
        values,
        onUpdate,
        onAdd,
        onRemove,
        placeholder,
    }: {
        label: string;
        values: string[];
        onUpdate: (index: number, value: string) => void;
        onAdd: () => void;
        onRemove: (index: number) => void;
        placeholder: string;
    }) => (
        <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1">{label}</label>
            <div className="space-y-1.5">
                {values.map((val, idx) => (
                    <div key={idx} className="flex gap-1.5">
                        <input
                            type="text"
                            value={val}
                            onChange={(e) => onUpdate(idx, e.target.value)}
                            className="flex-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                            placeholder={placeholder}
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                            title="Hapus"
                        >
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={onAdd}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 mt-1"
                >
                    <span className="text-base leading-none">+</span> Tambah {label}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Edit Approval Material" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-20 p-3 max-w-7xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-light text-stone-800">
                            Approval Material
                        </h1>
                        <p className="text-sm text-stone-500">
                            {itemPekerjaan.project_name} •{' '}
                            {itemPekerjaan.company_name}
                        </p>
                    </div>

                    {/* ===== FINISHING & AKSESORIS TABLE ===== */}
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm mb-6">
                        <div className="bg-amber-50 border-b border-amber-100 p-4">
                            <h3 className="text-lg font-semibold text-stone-800">Finishing & Aksesoris</h3>
                            <p className="text-sm text-stone-600 mt-0.5">Detail material per item pekerjaan</p>
                        </div>

                        <div className="divide-y">
                            {items.map((row) => (
                                <div key={row.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                                    {/* Row 1: Item select + produk info */}
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-stone-500 mb-1">Item</label>
                                            <select
                                                value={row.item_id}
                                                onChange={(e) => updateItem(row.id, Number(e.target.value))}
                                                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                            >
                                                {row.available_items.map((opt) => (
                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <div className="text-xs text-stone-400 mt-1">
                                                {row.produk} • {row.jenis_item} • Qty: {row.quantity}
                                            </div>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-semibold text-stone-500 mb-1">Area</label>
                                            <input
                                                type="text"
                                                value={row.area || ''}
                                                onChange={(e) => updateArea(row.id, e.target.value)}
                                                className="w-full rounded-md border border-stone-300 px-2.5 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                                placeholder="Contoh: Dapur"
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label className="block text-xs font-semibold text-stone-500 mb-1">Foto <span className="text-red-500">*</span></label>
                                            <div className="flex flex-col gap-2">
                                                {(row.foto || row.foto_file) && (
                                                    <div className="relative h-20 w-20 overflow-hidden rounded border border-stone-200">
                                                        <img 
                                                            src={row.foto_file ? URL.createObjectURL(row.foto_file) : row.foto!} 
                                                            alt="Preview" 
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => updateFoto(row.id, e.target.files?.[0] || null)}
                                                    className="w-full text-[10px] text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-stone-100 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-stone-700 hover:file:bg-stone-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: kode material, brand/spek, notes */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <TagListInput
                                            label="Kode Material"
                                            values={row.kode_material}
                                            onUpdate={(idx, val) => updateKodeMaterial(row.id, idx, val)}
                                            onAdd={() => addKodeMaterial(row.id)}
                                            onRemove={(idx) => removeKodeMaterial(row.id, idx)}
                                            placeholder="Contoh: MDF-001"
                                        />
                                        <TagListInput
                                            label="Brand / Spek"
                                            values={row.brand_spek}
                                            onUpdate={(idx, val) => updateBrandSpek(row.id, idx, val)}
                                            onAdd={() => addBrandSpek(row.id)}
                                            onRemove={(idx) => removeBrandSpek(row.id, idx)}
                                            placeholder="Contoh: Dulux Weathershield"
                                        />
                                        <div>
                                            <label className="block text-xs font-semibold text-stone-500 mb-1">Notes</label>
                                            <textarea
                                                value={row.keterangan_material || ''}
                                                onChange={(e) => updateKeterangan(row.id, e.target.value)}
                                                rows={2}
                                                className="w-full rounded-md border border-stone-300 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                                placeholder="Catatan tambahan..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ===== BAHAN BAKU TABLE ===== */}
                    {bahanBakus && bahanBakus.length > 0 && (
                        <div className="overflow-hidden rounded-xl border bg-white shadow-sm mb-6">
                            <div className="bg-green-50 border-b border-green-100 p-4">
                                <h3 className="text-lg font-semibold text-stone-800">Bahan Baku</h3>
                                <p className="text-sm text-stone-600 mt-0.5">Bahan baku yang digunakan dalam produksi</p>
                            </div>

                            <div className="divide-y">
                                {bahanBakus.map((bahan) => (
                                    <div key={bahan.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                                        {/* Row 1: Nama + produk + area */}
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-stone-500 mb-1">Nama Bahan</label>
                                                <div className="text-sm font-medium text-stone-800">{bahan.item_name}</div>
                                                <div className="text-xs text-stone-400 mt-0.5">{bahan.produk}</div>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-semibold text-stone-500 mb-1">Area</label>
                                                <input
                                                    type="text"
                                                    value={bahan.area || ''}
                                                    onChange={(e) => updateAreaBahanBaku(bahan.id, e.target.value)}
                                                    className="w-full rounded-md border border-stone-300 px-2.5 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                                    placeholder="Contoh: Seluruh area"
                                                />
                                            </div>
                                            <div className="w-48">
                                                <label className="block text-xs font-semibold text-stone-500 mb-1">Foto <span className="text-red-500">*</span></label>
                                                <div className="flex flex-col gap-2">
                                                    {(bahan.foto || bahan.foto_file) && (
                                                        <div className="relative h-20 w-20 overflow-hidden rounded border border-stone-200">
                                                            <img 
                                                                src={bahan.foto_file ? URL.createObjectURL(bahan.foto_file) : bahan.foto!} 
                                                                alt="Preview" 
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => updateFotoBB(bahan.id, e.target.files?.[0] || null)}
                                                        className="w-full text-[10px] text-stone-500 file:mr-2 file:rounded file:border-0 file:bg-stone-100 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-stone-700 hover:file:bg-stone-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: kode material, brand/spek, notes */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <TagListInput
                                                label="Kode Material"
                                                values={bahan.kode_material}
                                                onUpdate={(idx, val) => updateKodeMaterialBB(bahan.id, idx, val)}
                                                onAdd={() => addKodeMaterialBB(bahan.id)}
                                                onRemove={(idx) => removeKodeMaterialBB(bahan.id, idx)}
                                                placeholder="Contoh: PLY-18MM"
                                            />
                                            <TagListInput
                                                label="Brand / Spek"
                                                values={bahan.brand_spek}
                                                onUpdate={(idx, val) => updateBrandSpekBB(bahan.id, idx, val)}
                                                onAdd={() => addBrandSpekBB(bahan.id)}
                                                onRemove={(idx) => removeBrandSpekBB(bahan.id, idx)}
                                                placeholder="Contoh: Kayu albasia"
                                            />
                                            <div>
                                                <label className="block text-xs font-semibold text-stone-500 mb-1">Notes</label>
                                                <textarea
                                                    value={bahan.keterangan_bahan_baku || ''}
                                                    onChange={(e) => updateKeteranganBahanBaku(bahan.id, e.target.value)}
                                                    rows={2}
                                                    className="w-full rounded-md border border-stone-300 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                                                    placeholder="Catatan tambahan..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => router.visit('/approval-material')}
                            className="rounded-lg border border-stone-300 px-6 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
