import { useState, useEffect } from 'react';
import { router, Link, Head, usePage } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Produk {
    id: number;
    nama_produk: string;
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
}

interface ItemPekerjaanJenisItem {
    id: number;
    jenis_item_id: number;
    jenis_item_name: string;
    items: Item[];
}

interface ItemPekerjaanProduk {
    id: number;
    produk_id: number;
    produk_name: string;
    quantity: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    jenisItems: ItemPekerjaanJenisItem[];
}

interface ItemPekerjaan {
    id: number;
    response_by: string;
    response_time: string;
    pm_response_by: string | null;
    pm_response_time: string | null;
    status: 'draft' | 'published';
    produks: ItemPekerjaanProduk[];
}

interface Moodboard {
    id: number;
    order: Order;
    itemPekerjaan: ItemPekerjaan | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Props {
    moodboards: Moodboard[];
    produks: Produk[];
    jenisItems: JenisItem[];
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    response_time?: string | null;
    response_by?: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
}
function ItemPekerjaanIndex({ moodboards, produks, jenisItems }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [expandedProduk, setExpandedProduk] = useState<number[]>([]);
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dual task response (regular & marketing) untuk semua moodboard
    useEffect(() => {
        moodboards.forEach(moodboard => {
            const orderId = moodboard.order?.id;
            if (orderId) {
                // Regular
                axios.get(`/task-response/${orderId}/item_pekerjaan`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (item_pekerjaan):', err);
                        }
                    });
                // Marketing
                axios.get(`/task-response/${orderId}/item_pekerjaan?is_marketing=1`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (item_pekerjaan):', err);
                        }
                    });
            }
        });
    }, [moodboards]);

    const filteredMoodboards = moodboards.filter((moodboard) => {
        const search = searchQuery.toLowerCase();
        return (
            moodboard.order?.nama_project.toLowerCase().includes(search) ||
            moodboard.order?.customer_name.toLowerCase().includes(search) ||
            moodboard.order?.company_name.toLowerCase().includes(search)
        );
    });

    const handleResponseItemPekerjaan = (moodboardId: number) => {
        if (window.confirm('Buat response untuk Input Item Pekerjaan?')) {
            setLoading(true);
            router.post(`/item-pekerjaan/response/${moodboardId}`, {}, {
                onSuccess: () => setLoading(false),
                onError: () => {
                    alert('Gagal membuat response');
                    setLoading(false);
                },
            });
        }
    };

    const handlePmResponse = (moodboardId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk item pekerjaan ini?')) {
            router.post(`/pm-response/item-pekerjaan-by-moodboard/${moodboardId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    const toggleProdukExpand = (produkId: number) => {
        setExpandedProduk(prev =>
            prev.includes(produkId)
                ? prev.filter(id => id !== produkId)
                : [...prev, produkId]
        );
    };

    const formatDateTime = (datetime: string) => {
        return new Date(datetime).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateDaysLeft = (deadline: string | null | undefined) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (Number.isNaN(deadlineDate.getTime())) return null;
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <>
            <Head title="Input Item Pekerjaan" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="item-pekerjaan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Input Item Pekerjaan
                                    </h1>
                                    <p className="text-sm text-stone-500">
                                        Kelola produk dan item untuk order dengan desain final
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari project, customer, atau company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                            />
                            <svg
                                className="absolute left-3 top-2.5 h-5 w-5 text-stone-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Moodboard List */}
                    <div className="space-y-6">
                        {filteredMoodboards.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 p-12 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-stone-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <p className="mt-4 text-sm text-stone-600">
                                    {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data moodboard dengan desain final'}
                                </p>
                            </div>
                        ) : (
                            filteredMoodboards.map((moodboard) => {

                                const orderId = moodboard.order?.id;
                                const taskResponseRegular = orderId ? taskResponses[orderId]?.regular : null;
                                const taskResponseMarketing = orderId ? taskResponses[orderId]?.marketing : null;
                                const daysLeftRegular = taskResponseRegular?.deadline ? calculateDaysLeft(taskResponseRegular.deadline) : null;
                                const daysLeftMarketing = taskResponseMarketing?.deadline ? calculateDaysLeft(taskResponseMarketing.deadline) : null;

                                return (
                                    <div
                                        key={moodboard.id}
                                        className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        {/* Order Info Header */}
                                        <div className="border-b border-stone-100 bg-gradient-to-r from-purple-50 to-white p-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-stone-800">
                                                        {moodboard.order.nama_project}
                                                    </h3>
                                                    <div className="mt-2 space-y-1 text-sm text-stone-600">
                                                        <p>
                                                            <span className="font-medium">Company:</span> {moodboard.order.company_name}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Customer:</span> {moodboard.order.customer_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {!moodboard.itemPekerjaan ? (
                                                    isNotKepalaMarketing ? (
                                                        <button
                                                            onClick={() => handleResponseItemPekerjaan(moodboard.id)}
                                                            disabled={loading}
                                                            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-stone-300"
                                                        >
                                                            Response Input Item Pekerjaan
                                                        </button>
                                                    ) : null
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {/* Status Badge */}
                                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            moodboard.itemPekerjaan.status === 'published' 
                                                                ? 'bg-emerald-100 text-emerald-700' 
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {moodboard.itemPekerjaan.status === 'published' ? '✓ Published' : '📝 Draft'}
                                                        </span>
                                                        <Link
                                                            href={`/item-pekerjaan/${moodboard.itemPekerjaan.id}/show`}
                                                            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                                        >
                                                            Lihat Detail
                                                        </Link>
                                                        <Link
                                                            href={`/item-pekerjaan/${moodboard.itemPekerjaan.id}/edit`}
                                                            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Marketing Response Button/Badge - available even if item pekerjaan belum ada */}
                                            {isKepalaMarketing && !taskResponseMarketing?.response_time && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() => handlePmResponse(moodboard.id)}
                                                        className="w-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all"
                                                    >
                                                        Marketing Response
                                                    </button>
                                                </div>
                                            )}

                                            {taskResponseMarketing?.response_time && (
                                                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                    <p className="text-xs font-semibold text-purple-900">✓ Marketing Response</p>
                                                    <p className="text-xs text-purple-700">By: {taskResponseMarketing.response_by || '-'}</p>
                                                    <p className="text-xs text-purple-700">
                                                        {formatDateTime(taskResponseMarketing.response_time)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Task Response Deadline - REGULAR */}
                                        {!isKepalaMarketing && taskResponseRegular && taskResponseRegular.status !== 'selesai' && (
                                            <div className="px-6 pt-4">
                                                <div className={`p-3 rounded-lg border ${
                                                    daysLeftRegular !== null && daysLeftRegular < 0 
                                                        ? 'bg-red-50 border-red-200' 
                                                        : daysLeftRegular !== null && daysLeftRegular <= 3
                                                        ? 'bg-orange-50 border-orange-200'
                                                        : 'bg-yellow-50 border-yellow-200'
                                                }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className={`text-xs font-semibold mb-1 ${
                                                                daysLeftRegular !== null && daysLeftRegular < 0
                                                                    ? 'text-red-900'
                                                                    : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                    ? 'text-orange-900'
                                                                    : 'text-yellow-900'
                                                            }`}>
                                                                {daysLeftRegular !== null && daysLeftRegular < 0 ? '⚠️ Deadline Terlewat' : '⏰ Deadline Item Pekerjaan'}
                                                            </p>
                                                            <p className={`text-xs ${
                                                                daysLeftRegular !== null && daysLeftRegular < 0
                                                                    ? 'text-red-700'
                                                                    : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                    ? 'text-orange-700'
                                                                    : 'text-yellow-700'
                                                            }`}>
                                                                {formatDeadline(taskResponseRegular.deadline)}
                                                            </p>
                                                            {daysLeftRegular !== null && (
                                                                <p className={`text-xs mt-1 font-medium ${
                                                                    daysLeftRegular < 0
                                                                        ? 'text-red-700'
                                                                        : daysLeftRegular <= 3
                                                                        ? 'text-orange-700'
                                                                        : 'text-yellow-700'
                                                                }`}>
                                                                    {daysLeftRegular < 0 
                                                                        ? `Terlambat ${Math.abs(daysLeftRegular)} hari` 
                                                                        : `${daysLeftRegular} hari lagi`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'item_pekerjaan', isMarketing: false, taskResponse: taskResponseRegular })}
                                                            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Task Response Deadline - MARKETING (Kepala Marketing only) */}
                                        {isKepalaMarketing && taskResponseMarketing && taskResponseMarketing.status !== 'selesai' && (
                                            <div className="px-6 pt-2">
                                                <div className="p-3 rounded-lg border bg-purple-50 border-purple-200">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-semibold mb-1 text-purple-900">
                                                                ⏰ Deadline Item Pekerjaan (Marketing)
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                {formatDeadline(taskResponseMarketing.deadline)}
                                                            </p>
                                                            {daysLeftMarketing !== null && (
                                                                <p className="text-xs mt-1 font-medium text-purple-700">
                                                                    {daysLeftMarketing < 0 
                                                                        ? `Terlambat ${Math.abs(daysLeftMarketing)} hari` 
                                                                        : `${daysLeftMarketing} hari lagi`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'item_pekerjaan', isMarketing: true, taskResponse: taskResponseMarketing })}
                                                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600 transition-colors"
                                                        >
                                                            Minta Perpanjangan (Marketing)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Content Area */}
                                        {moodboard.itemPekerjaan && (
                                            <div className="p-6">
                                                {/* Response Info */}
                                                <div className={`rounded-lg p-4 ${
                                                    moodboard.itemPekerjaan.status === 'published' 
                                                        ? 'bg-blue-50' 
                                                        : 'bg-amber-50'
                                                }`}>
                                                    <div className={`flex items-center gap-2 text-sm ${
                                                        moodboard.itemPekerjaan.status === 'published' 
                                                            ? 'text-blue-800' 
                                                            : 'text-amber-800'
                                                    }`}>
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>
                                                            <strong>Response by:</strong> {moodboard.itemPekerjaan.response_by} • {formatDateTime(moodboard.itemPekerjaan.response_time)}
                                                        </span>
                                                    </div>

                                                    <div className={`mt-3 text-sm ${
                                                        moodboard.itemPekerjaan.status === 'published' 
                                                            ? 'text-blue-700' 
                                                            : 'text-amber-700'
                                                    }`}>
                                                        <strong>Total Produk:</strong> {moodboard.itemPekerjaan.produks.length} produk
                                                    </div>
                                                    {moodboard.itemPekerjaan.status === 'draft' && (
                                                        <div className="mt-2 text-xs text-amber-600">
                                                            ⚠️ Status masih draft. RAB Internal belum bisa diproses sampai di-publish.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
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
export default ItemPekerjaanIndex;