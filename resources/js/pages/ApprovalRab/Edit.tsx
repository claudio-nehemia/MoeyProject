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
    available_items: ItemOption[];
}

interface BahanBakuRow {
    id: number;
    item_name: string;
    produk: string;
    harga_dasar: number;
    harga_jasa: number;
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
    const [items, setItems] = useState<ItemRow[]>(itemPekerjaan.items);

    const updateItem = (id: number, itemId: number) => {
        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, item_id: itemId } : i,
            ),
        );
    };

    const updateKeterangan = (id: number, value: string) => {
        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, keterangan_material: value } : i,
            ),
        );
    };

    const handleSave = () => {
        setSaving(true);
        router.put(
            `/approval-material/${itemPekerjaan.id}`,
            {
                items: items.map((i) => ({
                    id: i.id,
                    item_id: i.item_id,
                    keterangan_material: i.keterangan_material,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Edit Keterangan Material" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3 max-w-6xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-light text-stone-800">
                            Keterangan Material RAB
                        </h1>
                        <p className="text-sm text-stone-500">
                            {itemPekerjaan.project_name} •{' '}
                            {itemPekerjaan.company_name}
                        </p>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm mb-6">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-100 text-stone-700">
                                <tr>
                                    <th className="p-3 text-left">Item</th>
                                    <th className="p-3 text-left">Qty</th>
                                    <th className="p-3 text-left">
                                        Keterangan Material
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        {/* ITEM (EDITABLE) */}
                                        <td className="p-3">
                                            <select
                                                value={row.item_id}
                                                onChange={(e) =>
                                                    updateItem(
                                                        row.id,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                            >
                                                {row.available_items.map(
                                                    (opt) => (
                                                        <option
                                                            key={opt.id}
                                                            value={opt.id}
                                                        >
                                                            {opt.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <div className="text-xs text-stone-500 mt-1">
                                                {row.produk} • {row.jenis_item}
                                            </div>
                                        </td>

                                        {/* QTY (LOCKED) */}
                                        <td className="p-3 text-stone-700">
                                            {row.quantity}
                                        </td>

                                        {/* KETERANGAN */}
                                        <td className="p-3">
                                            <textarea
                                                value={
                                                    row.keterangan_material ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    updateKeterangan(
                                                        row.id,
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                                placeholder="Contoh: type 1A, cap Kuda Terbang"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bahan Baku Section */}
                    {itemPekerjaan.bahan_bakus && itemPekerjaan.bahan_bakus.length > 0 && (
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm mb-6">
                            <div className="bg-green-50 border-b p-4">
                                <h3 className="text-lg font-semibold text-stone-800">
                                    Bahan Baku (Read-Only)
                                </h3>
                                <p className="text-sm text-stone-600 mt-1">
                                    Bahan baku yang dipilih saat pembuatan produk
                                </p>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-stone-100 text-stone-700">
                                    <tr>
                                        <th className="p-3 text-left">Nama Bahan</th>
                                        <th className="p-3 text-left">Produk</th>
                                        <th className="p-3 text-right">Harga Dasar</th>
                                        <th className="p-3 text-right">Harga Jasa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemPekerjaan.bahan_bakus.map((bahan) => (
                                        <tr key={bahan.id} className="border-t">
                                            <td className="p-3 text-stone-800">
                                                {bahan.item_name}
                                            </td>
                                            <td className="p-3 text-stone-600">
                                                {bahan.produk}
                                            </td>
                                            <td className="p-3 text-right text-stone-700">
                                                Rp {Number(bahan.harga_dasar).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3 text-right text-stone-700">
                                                Rp {Number(bahan.harga_jasa).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Action */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() =>
                                router.visit('/approval-material')
                            }
                            className="rounded-lg border border-stone-300 px-6 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
