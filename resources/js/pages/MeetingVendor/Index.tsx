import ExtendModal from '@/components/ExtendModal';
import WorkStatusTabs from '@/components/WorkStatusTabs';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Check } from 'lucide-react';

interface OrderItem {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    payment_status: string;
    tahapan_proyek: string;
    status_meeting: 'pending' | 'waiting_input' | 'scheduled';
    meeting_vendor_id: number | null;
    tanggal_meeting: string | null;
    jam_meeting: string | null;
    lokasi: string | null;
    catatan: string | null;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Props {
    items: OrderItem[];
    isKepalaMarketing: boolean;
    isProjectManager: boolean;
    isAdmin: boolean;
    isDrafter: boolean;
}

export default function MeetingVendorIndex({
    items,
    isKepalaMarketing,
    isProjectManager,
    isAdmin,
    isDrafter,
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [workTab, setWorkTab] = useState<'belum' | 'sudah'>('belum');
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form modal state
    const [tanggalMeeting, setTanggalMeeting] = useState('');
    const [jamMeeting, setJamMeeting] = useState('');
    const [lokasi, setLokasi] = useState('');
    const [catatan, setCatatan] = useState('');

    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<
        Record<number, { regular?: any; marketing?: any }>
    >({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        isMarketing: boolean;
        taskResponse: any;
    } | null>(null);

    const isNotKepalaMarketing = !isKepalaMarketing;
    const canSchedule = isDrafter || isProjectManager || isAdmin;

    useEffect(() => {
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dual task responses (regular & marketing)
    useEffect(() => {
        items.forEach((item) => {
            const orderId = item.id;
            if (orderId) {
                // Regular
                axios
                    .get(`/task-response/${orderId}/meeting_vendor`)
                    .then((res) => {
                        const task = Array.isArray(res.data)
                            ? res.data[0]
                            : res.data;
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
                            console.error(
                                'Error fetching regular task response (meeting_vendor):',
                                err,
                            );
                        }
                    });
                // Marketing
                axios
                    .get(
                        `/task-response/${orderId}/meeting_vendor?is_marketing=1`,
                    )
                    .then((res) => {
                        const task = Array.isArray(res.data)
                            ? res.data[0]
                            : res.data;
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
                            console.error(
                                'Error fetching marketing task response (meeting_vendor):',
                                err,
                            );
                        }
                    });
            }
        });
    }, [items]);

    /* ================= FILTER ================= */
    const countBelum = useMemo(() =>
        items.filter(i => i.status_meeting !== 'scheduled').length,
        [items]
    );

    const countSudah = useMemo(() =>
        items.filter(i => i.status_meeting === 'scheduled').length,
        [items]
    );

    const filteredItems = items.filter((item) => {
        const isCompleted = item.status_meeting === 'scheduled';
        const matchesWorkTab = workTab === 'belum' ? !isCompleted : isCompleted;
        if (!matchesWorkTab) return false;

        if (statusFilter !== 'semua' && item.status_meeting !== statusFilter) {
            return false;
        }

        const search = searchQuery.toLowerCase();
        return (
            item.nama_project.toLowerCase().includes(search) ||
            item.customer_name.toLowerCase().includes(search) ||
            item.company_name.toLowerCase().includes(search)
        );
    });

    /* ================= ACTIONS ================= */
    const handleResponse = (item: OrderItem) => {
        if (
            window.confirm(
                `Response jadwal meeting vendor untuk project "${item.nama_project}"?`,
            )
        ) {
            setLoading(true);
            router.post(
                `/meeting-vendor/${item.id}/response`,
                {},
                {
                    onFinish: () => setLoading(false),
                },
            );
        }
    };

    const handlePmResponse = (orderId: number) => {
        if (
            window.confirm(
                'Apakah Anda yakin ingin memberikan Marketing Response untuk meeting vendor ini?',
            )
        ) {
            router.post(
                `/pm-response/meeting-vendor/${orderId}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const openScheduleModal = (item: OrderItem) => {
        setSelectedOrder(item);
        setTanggalMeeting(item.tanggal_meeting || '');
        setJamMeeting(item.jam_meeting || '');
        setLokasi(item.lokasi || '');
        setCatatan(item.catatan || '');
        setShowScheduleModal(true);
    };

    const handleSubmitSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !tanggalMeeting || !jamMeeting) {
            alert('Tanggal meeting dan jam meeting wajib diisi.');
            return;
        }

        setLoading(true);
        router.post(
            `/meeting-vendor/${selectedOrder.id}/schedule`,
            {
                tanggal_meeting: tanggalMeeting,
                jam_meeting: jamMeeting,
                lokasi: lokasi,
                catatan: catatan,
            },
            {
                onSuccess: () => {
                    setShowScheduleModal(false);
                    setSelectedOrder(null);
                },
                onFinish: () => setLoading(false),
            },
        );
    };

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

    const formatDateDisplay = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Meeting Vendor Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="meeting-vendor"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-2 pt-20 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Jadwal Meeting Vendor
                            </h1>
                            <p className="text-xs text-stone-600">
                                Buat dan atur jadwal meeting vendor bersama setelah gambar kerja disetujui
                            </p>
                        </div>
                    </div>
                </div>

                {/* Work Status Tabs */}
                <WorkStatusTabs
                    activeTab={workTab}
                    onChange={setWorkTab}
                    countBelum={countBelum}
                    countSudah={countSudah}
                />

                {/* ================= FILTERS ================= */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <svg
                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
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
                        <input
                            type="text"
                            placeholder="Cari nama project, customer, atau company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-stone-200 py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">
                            Status:
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="min-w-[170px] rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="pending">Belum Response</option>
                            <option value="waiting_input">Menunggu Jadwal</option>
                            <option value="scheduled">Jadwal Ditentukan</option>
                        </select>
                    </div>
                </div>

                {/* ================= TABLE ================= */}
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Project / Client Info</th>
                                <th className="px-5 py-4">Jadwal & Detail Meeting</th>
                                <th className="px-5 py-4">Deadline Info</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-12 text-center text-stone-500"
                                    >
                                        Tidak ada data meeting vendor ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const orderId = item.id;
                                    const taskResponse =
                                        taskResponses[orderId]?.regular;
                                    const marketingTaskResponse =
                                        taskResponses[orderId]?.marketing;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            {/* Project Info */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="mb-1 max-w-[220px] whitespace-normal break-words font-semibold leading-tight text-slate-800">
                                                    {item.nama_project}
                                                </div>
                                                <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                                                    <span className="max-w-[150px] truncate font-medium text-slate-700">
                                                        {item.company_name}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="max-w-[150px] truncate">
                                                        {item.customer_name}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {item.status_meeting === 'scheduled' && (
                                                        <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700">
                                                            ✓ Scheduled
                                                        </span>
                                                    )}
                                                    {item.response_time && (
                                                        <span className="inline-flex rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-700">
                                                            ✓ Responded
                                                        </span>
                                                    )}
                                                    {item.pm_response_time && (
                                                        <span className="inline-flex rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-700">
                                                            ✓ Marketing Responded
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Meeting Schedule & Detail */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {item.tanggal_meeting ? (
                                                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 max-w-[260px]">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                                <span className="font-bold text-xs text-blue-900">
                                                                    {formatDateDisplay(item.tanggal_meeting)}
                                                                </span>
                                                                {item.jam_meeting && (
                                                                    <span className="rounded bg-blue-200/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 inline-flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" /> {item.jam_meeting} WIB
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.lokasi && (
                                                                <div className="text-[11px] text-slate-700 flex items-center gap-1.5 mt-1">
                                                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                                    <span className="font-medium truncate">{item.lokasi}</span>
                                                                </div>
                                                            )}
                                                            {item.catatan && (
                                                                <div className="text-[10px] text-slate-600 mt-1.5 pt-1.5 border-t border-blue-100/80 whitespace-pre-wrap">
                                                                    {item.catatan}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 rounded border border-dashed border-amber-300 bg-amber-50/50 px-2.5 py-1.5 text-xs text-amber-800">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            <span>Belum ada jadwal meeting</span>
                                                        </div>
                                                    )}

                                                    {/* Response logs */}
                                                    <div className="space-y-1 mt-1">
                                                        {item.response_time && (
                                                            <div className="text-[10px] text-blue-700">
                                                                <span className="font-semibold">ResBy:</span> {item.response_by || '-'} ({new Date(item.response_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                                                            </div>
                                                        )}
                                                        {item.pm_response_time && (
                                                            <div className="text-[10px] text-purple-700">
                                                                <span className="font-semibold">Marketing ResBy:</span> {item.pm_response_by || '-'} ({new Date(item.pm_response_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Deadline */}
                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {!isKepalaMarketing &&
                                                        taskResponse &&
                                                        taskResponse.status !== 'selesai' &&
                                                        taskResponse.status !== 'telat_submit' &&
                                                        !taskResponse.update_data_time && (
                                                            <div className="inline-flex w-full max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5">
                                                                <p className="text-[10px] font-bold text-yellow-800">
                                                                    Deadline Meeting Vendor
                                                                </p>
                                                                <p className="text-[11px] font-semibold text-yellow-900">
                                                                    {formatDeadline(taskResponse.deadline)}
                                                                </p>
                                                                {taskResponse.extend_time > 0 && (
                                                                    <p className="rounded bg-yellow-200 px-1 py-0.5 text-[9px] font-bold text-yellow-800">
                                                                        Ext: {taskResponse.extend_time}x
                                                                    </p>
                                                                )}
                                                                <button
                                                                    onClick={() =>
                                                                        setShowExtendModal({
                                                                            orderId,
                                                                            tahap: 'meeting_vendor',
                                                                            isMarketing: false,
                                                                            taskResponse,
                                                                        })
                                                                    }
                                                                    className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-center text-[10px] font-medium text-white transition hover:bg-orange-600"
                                                                >
                                                                    Minta Extend
                                                                </button>
                                                            </div>
                                                        )}

                                                    {isKepalaMarketing &&
                                                        marketingTaskResponse &&
                                                        marketingTaskResponse.status !== 'selesai' &&
                                                        marketingTaskResponse.status !== 'telat_submit' &&
                                                        !marketingTaskResponse.update_data_time && (
                                                            <div className="mt-1 inline-flex w-full max-w-[200px] flex-col items-start gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5">
                                                                <p className="text-[10px] font-bold text-purple-800">
                                                                    Deadline (Marketing)
                                                                </p>
                                                                <p className="text-[11px] font-semibold text-purple-900">
                                                                    {formatDeadline(marketingTaskResponse.deadline)}
                                                                </p>
                                                                {marketingTaskResponse.extend_time > 0 && (
                                                                    <p className="rounded bg-purple-200 px-1 py-0.5 text-[9px] font-bold text-purple-800">
                                                                        Ext: {marketingTaskResponse.extend_time}x
                                                                    </p>
                                                                )}
                                                                <button
                                                                    onClick={() =>
                                                                        setShowExtendModal({
                                                                            orderId,
                                                                            tahap: 'meeting_vendor',
                                                                            isMarketing: true,
                                                                            taskResponse: marketingTaskResponse,
                                                                        })
                                                                    }
                                                                    className="mt-1 w-full rounded bg-purple-600 px-2 py-1 text-center text-[10px] font-medium text-white transition hover:bg-purple-700"
                                                                >
                                                                    Minta Extend
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {isKepalaMarketing && !item.pm_response_time && (
                                                        <button
                                                            onClick={() => handlePmResponse(item.id)}
                                                            className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-sm transition hover:bg-purple-700"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                    {isNotKepalaMarketing && !item.response_time && (
                                                        <button
                                                            onClick={() => handleResponse(item)}
                                                            disabled={loading}
                                                            className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center gap-1"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Response</span>
                                                        </button>
                                                    )}

                                                    {canSchedule && (
                                                        <button
                                                            onClick={() => openScheduleModal(item)}
                                                            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-center text-[11px] font-medium text-white shadow-sm transition hover:bg-indigo-700 mt-1 inline-flex items-center justify-center gap-1"
                                                        >
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{item.tanggal_meeting ? 'Edit Jadwal' : 'Atur Jadwal Meeting'}</span>
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

                {/* ================= MODAL ATUR JADWAL MEETING ================= */}
                {showScheduleModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-stone-900">
                                        {selectedOrder.tanggal_meeting
                                            ? 'Edit Jadwal Meeting Vendor'
                                            : 'Atur Jadwal Meeting Vendor'}
                                    </h2>
                                    <p className="text-xs text-stone-600">
                                        Project: <span className="font-semibold">{selectedOrder.nama_project}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="text-stone-400 hover:text-stone-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmitSchedule} className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-stone-700">
                                            <span className="text-red-500">*</span> Tanggal Meeting
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={tanggalMeeting}
                                            onChange={(e) => setTanggalMeeting(e.target.value)}
                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-stone-700">
                                            <span className="text-red-500">*</span> Jam Meeting (WIB)
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={jamMeeting}
                                            onChange={(e) => setJamMeeting(e.target.value)}
                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                                        Lokasi / Link Meeting
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Google Meet / Ruang Rapat Kantor / Lokasi Project"
                                        value={lokasi}
                                        onChange={(e) => setLokasi(e.target.value)}
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-stone-700">
                                        Catatan / Agenda Meeting
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan tambahan, agenda rapat, atau hal yang perlu disiapkan..."
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-stone-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Menyimpan...' : 'Simpan Jadwal Meeting'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ================= EXTEND MODAL ================= */}
                {showExtendModal && (
                    <ExtendModal
                        orderId={showExtendModal.orderId}
                        tahap={showExtendModal.tahap}
                        taskResponse={showExtendModal.taskResponse}
                        isMarketing={showExtendModal.isMarketing}
                        onClose={() => setShowExtendModal(null)}
                    />
                )}
            </main>
        </div>
    );
}
