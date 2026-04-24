import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface SurveyUlang {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_survey_ulang: string | null;
    payment_status: string;
    tahapan_proyek: string;
    status_survey_ulang: 'pending' | 'waiting_input' | 'done';
    survey_ulang_id: number | null;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Props {
    surveys: SurveyUlang[];
}

interface TaskResponse {
    id: number;
    order_id: number;
    tahap: string;
    status: string;
    deadline: string | null;
    extend_time: number;
    is_marketing?: number;
    update_data_time?: string | null;
}

export default function Index({ surveys }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [taskResponses, setTaskResponses] = useState<
        Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>
    >({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        isMarketing: boolean;
        taskResponse: TaskResponse;
    } | null>(null);

    const { auth } = usePage<{
        auth: { user: { isKepalaMarketing: boolean } };
    }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    useEffect(() => {
        setMounted(true);
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch task response untuk semua survey ulang (tahap: survey_ulang) - regular & marketing
    useEffect(() => {
        surveys.forEach((survey) => {
            // Regular
            axios
                .get(`/task-response/${survey.id}/survey_ulang`)
                .then((res) => {
                    const task = Array.isArray(res.data)
                        ? res.data[0]
                        : res.data;
                    if (task) {
                        setTaskResponses((prev) => ({
                            ...prev,
                            [survey.id]: {
                                ...prev[survey.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch((err) => {
                    if (err.response?.status !== 404) {
                        console.error(
                            'Error fetching regular task response (survey_ulang):',
                            err,
                        );
                    }
                });

            // Marketing (khusus Kepala Marketing)
            if (isKepalaMarketing) {
                axios
                    .get(
                        `/task-response/${survey.id}/survey_ulang?is_marketing=1`,
                    )
                    .then((res) => {
                        const task = Array.isArray(res.data)
                            ? res.data[0]
                            : res.data;
                        if (task) {
                            setTaskResponses((prev) => ({
                                ...prev,
                                [survey.id]: {
                                    ...prev[survey.id],
                                    marketing: task,
                                },
                            }));
                        }
                    })
                    .catch((err) => {
                        if (err.response?.status !== 404) {
                            console.error(
                                'Error fetching marketing task response (survey_ulang):',
                                err,
                            );
                        }
                    });
            }
        });
    }, [surveys, isKepalaMarketing]);

    const formatStatus = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'waiting_input':
                return 'Awaiting Input';
            case 'done':
                return 'Completed';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done':
                return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'waiting_input':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-amber-100 text-amber-700 border-amber-300';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('id-ID', {
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
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const filtered = surveys.filter((s) => {
        // Status filter
        if (statusFilter !== 'semua' && s.status_survey_ulang !== statusFilter) {
            return false;
        }

        return (
            s.nama_project.toLowerCase().includes(search.toLowerCase()) ||
            s.company_name.toLowerCase().includes(search.toLowerCase()) ||
            s.customer_name.toLowerCase().includes(search.toLowerCase())
        );
    });

    const handlePmResponse = (orderId: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin memberikan Marketing response untuk survey ulang ini?',
            )
        ) {
            router.post(
                `/pm-response/survey-ulang/${orderId}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    return (
        <>
            <Head title="Survey Ulang" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="survey-ulang"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="w-full overflow-y-auto px-2 pt-20 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-md">
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
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Survey Ulang
                            </h1>
                            <p className="text-xs text-stone-600">
                                Kelola survey ulang setelah customer melakukan DP
                            </p>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <svg
                            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-stone-400"
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
                            placeholder="Cari project, company, atau customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-stone-200 py-2.5 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[150px]"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="waiting_input">Awaiting Input</option>
                            <option value="done">Completed</option>
                        </select>
                    </div>
                </div>

                {/* LIST */}
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-4">Project / Client Info</th>
                                <th className="px-5 py-4">Status Survey</th>
                                <th className="px-5 py-4">Deadline Info</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-stone-500">
                                        Tidak ada survey ulang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const taskResponseRegular = taskResponses[s.id]?.regular;
                                    const taskResponseMarketing = taskResponses[s.id]?.marketing;

                                    return (
                                        <tr key={s.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-5 py-4 align-top">
                                                <div className="font-semibold text-slate-800 mb-1 max-w-[200px] whitespace-normal break-words leading-tight">
                                                    {s.nama_project}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                                    <span className="truncate max-w-[150px] font-medium text-slate-700">{s.company_name}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[150px]">{s.customer_name}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    ID: {s.id} | {s.jenis_interior || '-'}
                                                </div>
                                                {s.pm_response_time && (
                                                    <div className="mt-2 inline-flex max-w-fit flex-col items-start gap-0.5 rounded border border-purple-200 bg-purple-50 px-2 py-1.5 text-[10px] text-purple-700">
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500">PM ResBy: {s.pm_response_by}</span>
                                                        <div className="text-purple-500">{formatDateTime(s.pm_response_time)}</div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(s.status_survey_ulang)}`}>
                                                            {formatStatus(s.status_survey_ulang)}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <div className="text-[10px] font-medium text-slate-400">Tgl Survey</div>
                                                            <div className="font-medium text-slate-700">
                                                                {s.tanggal_survey_ulang ? formatDate(s.tanggal_survey_ulang) : '-'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-medium text-slate-400">Response By</div>
                                                            <div className="font-medium text-slate-700">{s.response_by || '-'}</div>
                                                        </div>
                                                    </div>
                                                    {s.response_time && (
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="font-medium">Res Time:</span> {formatDateTime(s.response_time)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 align-top">
                                                <div className="space-y-2">
                                                    {isNotKepalaMarketing && taskResponseRegular && taskResponseRegular.status !== 'selesai' && taskResponseRegular.status !== 'telat_submit' && !taskResponseRegular.update_data_time && taskResponseRegular.status !== 'menunggu_response' && (
                                                        <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-yellow-200 bg-yellow-50 px-2 py-1.5 w-full">
                                                            <p className="text-[10px] font-bold text-yellow-800">Deadline Survey</p>
                                                            <p className="text-[11px] font-semibold text-yellow-900">{formatDeadline(taskResponseRegular.deadline)}</p>
                                                            {taskResponseRegular.extend_time > 0 && (
                                                                <p className="bg-yellow-200 px-1 py-0.5 rounded text-[9px] font-bold text-yellow-800">Ext: {taskResponseRegular.extend_time}x</p>
                                                            )}
                                                            <button 
                                                                onClick={() => setShowExtendModal({ orderId: s.id, tahap: 'survey_ulang', isMarketing: false, taskResponse: taskResponseRegular })}
                                                                className="mt-1 w-full rounded bg-orange-500 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-orange-600"
                                                            >Minta Extend</button>
                                                        </div>
                                                    )}

                                                    {isKepalaMarketing && taskResponseMarketing && taskResponseMarketing.status !== 'selesai' && taskResponseMarketing.status !== 'telat_submit' && !taskResponseMarketing.update_data_time && taskResponseMarketing.status !== 'menunggu_response' && (
                                                        <div className="inline-flex max-w-[200px] flex-col items-start gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-1.5 w-full">
                                                            <p className="text-[10px] font-bold text-purple-800">Deadline (Marketing)</p>
                                                            <p className="text-[11px] font-semibold text-purple-900">{formatDeadline(taskResponseMarketing.deadline)}</p>
                                                            {taskResponseMarketing.extend_time > 0 && (
                                                                <p className="bg-purple-200 px-1 py-0.5 rounded text-[9px] font-bold text-purple-800">Ext: {taskResponseMarketing.extend_time}x</p>
                                                            )}
                                                            <button 
                                                                onClick={() => setShowExtendModal({ orderId: s.id, tahap: 'survey_ulang', isMarketing: true, taskResponse: taskResponseMarketing })}
                                                                className="mt-1 w-full rounded bg-purple-600 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-purple-700"
                                                            >Minta Extend</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 align-top text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    {isKepalaMarketing && !s.pm_response_time && (
                                                        <button
                                                            onClick={() => handlePmResponse(s.id)}
                                                            className="w-full rounded-md bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-purple-700 text-center"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                    {isNotKepalaMarketing && s.status_survey_ulang === 'pending' && (
                                                        <button
                                                            onClick={() => router.post(`/survey-ulang/${s.id}/response`)}
                                                            className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-emerald-700 text-center"
                                                        >
                                                            ✓ Response
                                                        </button>
                                                    )}

                                                    {isNotKepalaMarketing && s.status_survey_ulang === 'waiting_input' && (
                                                        <Link
                                                            href={`/survey-ulang/create/${s.id}`}
                                                            className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-amber-600 inline-block text-center"
                                                        >
                                                            📝 Input Hasil Survey
                                                        </Link>
                                                    )}

                                                    {isNotKepalaMarketing && s.status_survey_ulang === 'done' && (
                                                        <>
                                                            <Link
                                                                href={`/survey-ulang/show/${s.survey_ulang_id}`}
                                                                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 inline-block text-center"
                                                            >
                                                                👁️ View
                                                            </Link>
                                                            <Link
                                                                href={`/survey-ulang/edit/${s.survey_ulang_id}`}
                                                                className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 inline-block mt-1 text-center"
                                                            >
                                                                ✏️ Edit
                                                            </Link>
                                                        </>
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
            </main>
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
