import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function ApprovalRabEdit({ itemPekerjaan }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );

    const [items, setItems] = useState(
        itemPekerjaan.produks.flatMap((p: any) =>
            p.jenisItems.flatMap((j: any) =>
                j.items.map((i: any) => ({
                    id: i.id,
                    keterangan_material: i.keterangan_material ?? '',
                }))
            )
        )
    );

    const handleChange = (id: number, value: string) => {
        setItems((prev: any[]) =>
            prev.map((i) =>
                i.id === id ? { ...i, keterangan_material: value } : i
            )
        );
    };

    const handleSubmit = () => {
        router.put(`/approval-material/${itemPekerjaan.id}`, { items });
    };

    const handleBack = () => {
        router.get('/approval-material');
    };

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Approval Material" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-3 pb-6 w-full overflow-y-auto">
                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        Approval Material
                    </h1>
                    <p className="text-sm text-stone-600">
                        {itemPekerjaan.order.nama_project} •{' '}
                        {itemPekerjaan.order.company_name}
                    </p>
                </div>

                {/* CONTENT */}
                <div className="space-y-6">
                    {itemPekerjaan.produks.map((p: any) => (
                        <div
                            key={p.id}
                            className="bg-white border rounded-xl p-4 shadow-sm"
                        >
                            <h2 className="font-semibold text-stone-900 mb-3">
                                {p.nama_produk}
                            </h2>

                            {p.jenisItems.map((j: any) => (
                                <div key={j.id} className="mb-4">
                                    <p className="text-sm font-medium text-stone-700 mb-2">
                                        {j.jenis_item_name}
                                    </p>

                                    {j.items.map((i: any) => {
                                        const current = items.find(
                                            (x: any) => x.id === i.id
                                        );

                                        return (
                                            <div key={i.id} className="mb-3">
                                                <div className="text-sm text-stone-800">
                                                    {i.nama_item} (Qty:{' '}
                                                    {i.quantity})
                                                </div>

                                                <textarea
                                                    rows={2}
                                                    value={
                                                        current?.keterangan_material ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            i.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Keterangan material (contoh: Type 1A, Cap Kuda Terbang)"
                                                    className="mt-1 w-full border border-indigo-300 bg-indigo-50 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* ACTION */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg font-semibold hover:bg-stone-100"
                    >
                        ← Kembali
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                    >
                        Simpan Approval
                    </button>
                </div>
            </main>
        </div>
    );
}
