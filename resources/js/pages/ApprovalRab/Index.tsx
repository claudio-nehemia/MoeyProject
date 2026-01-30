import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

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
    order_id: number;
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
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: any } | null>(null);
    // Kepala Marketing
    const isKepalaMarketing = (window as any)?.Inertia?.page?.props?.auth?.user?.isKepalaMarketing || false;

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    useEffect(() => {
        const resize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Fetch dual task responses (regular & marketing)
    useEffect(() => {
        items.forEach((row) => {
            const orderId = row.order_id;
            if (orderId) {
                // Regular
                axios
                    .get(`/task-response/${orderId}/approval_material`)
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses((prev) => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (approval_material):', err);
                        }
                    });
                // Marketing
                axios
                    .get(`/task-response/${orderId}/approval_material?is_marketing=1`)
                    .then((res) => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses((prev) => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (approval_material):', err);
                        }
                    });
            }
        });
    }, [items]);

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
                            filtered.map((row) => {
                                const orderId = row.order_id;
                                const taskResponse = orderId ? taskResponses[orderId]?.regular : null;
                                const marketingTaskResponse = orderId ? taskResponses[orderId]?.marketing : null;

                                return (
                                <div
                                    key={row.id}
                                    className="rounded-lg border border-stone-200 bg-white shadow-sm hover:shadow-md transition"
                                >
                                    {/* Header */}
                                    <div className="border-b bg-gradient-to-r from-amber-50 to-white p-6 flex justify-between gap-4">
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

                                            {/* Deadline & Minta Perpanjangan - REGULAR */}
                                            {taskResponse && taskResponse.status !== 'selesai' && (
                                                <div className="mt-3">
                                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-yellow-800">
                                                                Deadline Approval Material
                                                            </p>
                                                            <p className="text-sm font-semibold text-yellow-900">
                                                                {formatDeadline(taskResponse.deadline)}
                                                            </p>
                                                            {taskResponse.extend_time > 0 && (
                                                                <p className="mt-1 text-xs text-orange-600">
                                                                    Perpanjangan: {taskResponse.extend_time}x
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: false, taskResponse })}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Deadline & Minta Perpanjangan - MARKETING (Kepala Marketing only) */}
                                            {isKepalaMarketing && marketingTaskResponse && marketingTaskResponse.status !== 'selesai' && (
                                                <div className="mt-3">
                                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-purple-800">
                                                                Deadline Approval Material (Marketing)
                                                            </p>
                                                            <p className="text-sm font-semibold text-purple-900">
                                                                {formatDeadline(marketingTaskResponse.deadline)}
                                                            </p>
                                                            {marketingTaskResponse.extend_time > 0 && (
                                                                <p className="mt-1 text-xs text-purple-600">
                                                                    Perpanjangan: {marketingTaskResponse.extend_time}x
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: true, taskResponse: marketingTaskResponse })}
                                                            className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan (Marketing)
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
                            )})
                        )}
                    </div>
                </div>
            </div>

            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    taskResponse={showExtendModal.taskResponse}
                    isMarketing={showExtendModal.isMarketing}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </>
    );
}
