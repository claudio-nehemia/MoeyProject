import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface ItemRow {
    id: number;
    ruangan: string | null;
    produk: string;
    jenis_item: string;
    item_name: string;
    quantity: number;
    keterangan_material: string | null;
}

interface Props {
    itemPekerjaan: {
        id: number;
        project_name: string;
        company_name: string;
        customer_name: string;
        items: ItemRow[];
    };
}

export default function ApprovalRabEdit({ itemPekerjaan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<ItemRow[]>(itemPekerjaan.items);

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
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-100 text-stone-700">
                                <tr>
                                    <th className="p-3 text-left">Item</th>
                                    <th className="p-3 text-left">Keterangan Material</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="p-3">
                                            <div className="font-medium text-stone-800">
                                                {row.item_name}
                                            </div>
                                            <div className="text-xs text-stone-500">
                                                {row.produk} • {row.jenis_item} • Qty:{' '}
                                                {row.quantity}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <textarea
                                                value={row.keterangan_material || ''}
                                                onChange={(e) =>
                                                    updateKeterangan(
                                                        row.id,
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-amber-300 focus:border-amber-500"
                                                placeholder="Contoh: type 1A, cap Kuda Terbang"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Action */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => router.visit('/approval-material')}
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
