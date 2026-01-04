import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface ItemPreview {
    item_name: string;
    keterangan_material: string | null;
}

interface BahanBakuPreview {
    id: number;
    item_name: string;
    harga_dasar: number;
    harga_jasa: number;
    keterangan_bahan_baku: string | null;
}

interface Row {
    id: number;
    project_name: string;
    company_name: string;
    customer_name: string;
    total_items: number;
    total_bahan_baku: number;
    items_preview: ItemPreview[];
    bahan_baku_preview: BahanBakuPreview[];
}

interface Props {
    items: Row[];
}

export default function ApprovalRabIndex({ items }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const resize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const filtered = items.filter((row) => {
        const s = search.toLowerCase();
        return (
            row.project_name.toLowerCase().includes(s) ||
            row.company_name.toLowerCase().includes(s) ||
            row.customer_name.toLowerCase().includes(s)
        );
    });

    return (
        <>
            <Head title="Approval Material (Keterangan RAB)" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-light text-stone-800">
                                Approval Material
                            </h1>
                            <p className="text-sm text-stone-500">
                                Keterangan material item RAB
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari project / company / customer..."
                            className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm focus:ring-amber-300 focus:border-amber-500"
                        />
                    </div>

                    {/* List */}
                    <div className="space-y-6">
                        {filtered.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 p-10 text-center text-sm text-stone-500">
                                Tidak ada data
                            </div>
                        ) : (
                            filtered.map((row) => (
                                <div
                                    key={row.id}
                                    className="rounded-lg border border-stone-200 bg-white shadow-sm hover:shadow-md transition"
                                >
                                    {/* Header */}
                                    <div className="border-b bg-gradient-to-r from-amber-50 to-white p-6 flex justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-stone-800">
                                                {row.project_name}
                                            </h3>
                                            <p className="text-sm text-stone-600 mt-1">
                                                <strong>Company:</strong> {row.company_name}
                                            </p>
                                            <p className="text-sm text-stone-600">
                                                <strong>Customer:</strong> {row.customer_name}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() =>
                                                router.visit(`/approval-material/${row.id}/edit`)
                                            }
                                            className="h-fit rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
                                        >
                                            Edit Item & Isi Keterangan
                                        </button>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6 space-y-4">
                                        {/* Preview Item */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-stone-700 mb-2">
                                                Items
                                            </h4>
                                            {row.items_preview.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                                                >
                                                    <div className="text-sm font-medium text-stone-800">
                                                        • {item.item_name}
                                                    </div>
                                                    <div className="mt-1 text-xs">
                                                        {item.keterangan_material ? (
                                                            <span className="text-stone-600">
                                                                ↳ {item.keterangan_material}
                                                            </span>
                                                        ) : (
                                                            <span className="italic text-amber-600">
                                                                ↳ belum ada keterangan
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Preview Bahan Baku */}
                                        {row.bahan_baku_preview && row.bahan_baku_preview.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold text-stone-700 mb-2">
                                                    Bahan Baku
                                                </h4>
                                                {row.bahan_baku_preview.map((bahan, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-lg border border-green-200 bg-green-50 p-3"
                                                    >
                                                        <div className="text-sm font-medium text-stone-800">
                                                            • {bahan.item_name}
                                                        </div>
                                                        <div className="mt-1 text-xs text-stone-600 space-x-3">
                                                            <span>
                                                                Harga Dasar: Rp {Number(bahan.harga_dasar).toLocaleString('id-ID')}
                                                            </span>
                                                            <span>
                                                                Harga Jasa: Rp {Number(bahan.harga_jasa).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-xs">
                                                            {bahan.keterangan_bahan_baku ? (
                                                                <span className="text-stone-600">
                                                                    ↳ {bahan.keterangan_bahan_baku}
                                                                </span>
                                                            ) : (
                                                                <span className="italic text-amber-600">
                                                                    ↳ belum ada keterangan
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 flex-1">
                                                <strong>Total Item:</strong> {row.total_items}
                                            </div>
                                            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 flex-1">
                                                <strong>Total Bahan Baku:</strong> {row.total_bahan_baku}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
