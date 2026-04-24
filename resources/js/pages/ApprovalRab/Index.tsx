import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
    approval_rab_response_time: string | null;
    approval_rab_response_by: string | null;
    pm_approval_rab_response_time: string | null;
    pm_approval_rab_response_by: string | null;
}

interface Props {
    items: Row[];
}

export default function ApprovalRabIndex({ items }: Props) {
    const { props } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: any; marketing?: any }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: any } | null>(null);
    // Kepala Marketing
    const isKepalaMarketing = (props.auth as any)?.user?.isKepalaMarketing || false;

    console.log('Debug isKepalaMarketing:', isKepalaMarketing);
    console.log('Debug auth:', props.auth);

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

    const formatDateTime = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin akan merespon Approval Material ini?')) {
            router.post(`/approval-material/${itemPekerjaanId}/responses`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Refresh page to get updated data
                    router.reload();
                },
            });
        }
    };

    const handlePmResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin akan merespon sebagai Marketing untuk Approval Material ini?')) {
            router.post(`/pm-response/approval-rab/${itemPekerjaanId}`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Refresh page to get updated data
                    router.reload();
                },
            });
        }
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
        // Status filter
        let meetsStatus = true;
        if (statusFilter === 'pending_response') {
            meetsStatus = !row.approval_rab_response_time;
        } else if (statusFilter === 'responded') {
            meetsStatus = !!row.approval_rab_response_time;
        } else if (statusFilter === 'marketing_responded') {
            meetsStatus = !!row.pm_approval_rab_response_time;
        }

        if (!meetsStatus) return false;

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
                <div className="mt-20 p-3">
                    {/* Header */}
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                                Approval Material
                            </h1>
                            <p className="text-sm text-stone-500">
                                Keterangan material item RAB
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari project / company / customer..."
                                className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none transition-shadow"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-none min-w-[180px]"
                            >
                                <option value="semua">Semua Status</option>
                                <option value="pending_response">Belum Response</option>
                                <option value="responded">Sudah Response</option>
                                <option value="marketing_responded">Marketing Responded</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                            <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Project / Client Info</th>
                                    <th className="px-5 py-4">Items & Keterangan</th>
                                    <th className="px-5 py-4">Deadline Info</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-stone-500">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row) => {
                                        const orderId = row.order_id;
                                        const taskResponse = orderId ? taskResponses[orderId]?.regular : null;
                                        const marketingTaskResponse = orderId ? taskResponses[orderId]?.marketing : null;

                                        return (
                                            <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                                                {/* Project Info */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                                        {row.project_name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                                        <span className="truncate max-w-[150px] font-medium text-slate-700">{row.company_name}</span>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[150px]">{row.customer_name}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 mt-2">
                                                        {row.approval_rab_response_time && (
                                                            <div className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded max-w-fit">
                                                                <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">✓ Response: {row.approval_rab_response_by}</span>
                                                                <span className="text-[10px] text-green-600">{formatDateTime(row.approval_rab_response_time)}</span>
                                                            </div>
                                                        )}
                                                        {row.pm_approval_rab_response_time && (
                                                            <div className="inline-flex flex-col gap-0.5 px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded max-w-fit">
                                                                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">✓ PM Res: {row.pm_approval_rab_response_by}</span>
                                                                <span className="text-[10px] text-indigo-600">{formatDateTime(row.pm_approval_rab_response_time)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Items & Keterangan */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="max-w-[300px] max-h-[160px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                                        <div className="space-y-1.5">
                                                            <h4 className="text-[10px] font-bold text-stone-500 uppercase">Items ({row.total_items})</h4>
                                                            {row.items_preview.map((item, idx) => (
                                                                <div key={idx} className="rounded border border-stone-200 bg-stone-50 p-1.5 whitespace-normal">
                                                                    <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                                                                        • {item.item_name}
                                                                    </div>
                                                                    <div className="mt-0.5 text-[10px]">
                                                                        {item.keterangan_material ? (
                                                                            <span className="text-stone-600">↳ {item.keterangan_material}</span>
                                                                        ) : (
                                                                            <span className="italic text-amber-600">↳ belum ada keterangan</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {row.bahan_baku_preview && row.bahan_baku_preview.length > 0 && (
                                                            <div className="space-y-1.5">
                                                                <h4 className="text-[10px] font-bold text-green-600 uppercase">Bahan Baku ({row.total_bahan_baku})</h4>
                                                                {row.bahan_baku_preview.map((bahan, idx) => (
                                                                    <div key={idx} className="rounded border border-green-200 bg-green-50 p-1.5 whitespace-normal">
                                                                        <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                                                                            • {bahan.item_name}
                                                                        </div>
                                                                        <div className="mt-0.5 text-[9px] text-stone-600 flex gap-2">
                                                                            <span>Dasar: Rp{Number(bahan.harga_dasar).toLocaleString('id-ID')}</span>
                                                                            <span>Jasa: Rp{Number(bahan.harga_jasa).toLocaleString('id-ID')}</span>
                                                                        </div>
                                                                        <div className="mt-0.5 text-[10px]">
                                                                            {bahan.keterangan_bahan_baku ? (
                                                                                <span className="text-stone-600">↳ {bahan.keterangan_bahan_baku}</span>
                                                                            ) : (
                                                                                <span className="italic text-amber-600">↳ belum ada keterangan</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Deadline */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="space-y-2">
                                                        {taskResponse && taskResponse.status !== 'selesai' && taskResponse.status !== 'telat_submit' && !taskResponse.update_data_time && (
                                                            <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 w-full">
                                                                <p className="text-[10px] font-bold text-yellow-800">Deadline Approval</p>
                                                                <p className="text-[11px] font-semibold text-yellow-900">{formatDeadline(taskResponse.deadline)}</p>
                                                                {taskResponse.extend_time > 0 && (
                                                                    <p className="bg-yellow-200 px-1 py-0.5 rounded text-[9px] font-bold text-yellow-800">Ext: {taskResponse.extend_time}x</p>
                                                                )}
                                                                <button
                                                                    onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: false, taskResponse })}
                                                                    className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-orange-600 shadow-sm text-center"
                                                                >Minta Extend</button>
                                                            </div>
                                                        )}

                                                        {isKepalaMarketing && marketingTaskResponse && marketingTaskResponse.status !== 'selesai' && marketingTaskResponse.status !== 'telat_submit' && !marketingTaskResponse.update_data_time && (
                                                            <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5 w-full mt-1">
                                                                <p className="text-[10px] font-bold text-purple-800">Deadline (Marketing)</p>
                                                                <p className="text-[11px] font-semibold text-purple-900">{formatDeadline(marketingTaskResponse.deadline)}</p>
                                                                {marketingTaskResponse.extend_time > 0 && (
                                                                    <p className="bg-purple-200 px-1 py-0.5 rounded text-[9px] font-bold text-purple-800">Ext: {marketingTaskResponse.extend_time}x</p>
                                                                )}
                                                                <button
                                                                    onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'approval_material', isMarketing: true, taskResponse: marketingTaskResponse })}
                                                                    className="mt-1 w-full rounded bg-purple-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-purple-600 shadow-sm text-center"
                                                                >Minta Extend</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 align-top text-right">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <button
                                                            onClick={() => router.visit(`/approval-material/${row.id}/edit`)}
                                                            className="w-full rounded-md bg-amber-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-amber-700 text-center"
                                                        >
                                                            ✏️ Edit & Isi Keterangan
                                                        </button>

                                                        {isKepalaMarketing && !row.pm_approval_rab_response_time && (
                                                            <button
                                                                onClick={() => handlePmResponse(row.id)}
                                                                className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-purple-700 text-center mt-1"
                                                            >
                                                                Marketing Response
                                                            </button>
                                                        )}

                                                        {!isKepalaMarketing && !row.approval_rab_response_time && (
                                                            <button
                                                                onClick={() => handleResponse(row.id)}
                                                                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 text-center mt-1"
                                                            >
                                                                ✓ Response Approval
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
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
