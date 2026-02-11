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
}

export default function Index({ surveys }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState('');
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

    const filtered = surveys.filter(
        (s) =>
            s.nama_project.toLowerCase().includes(search.toLowerCase()) ||
            s.company_name.toLowerCase().includes(search.toLowerCase()) ||
            s.customer_name.toLowerCase().includes(search.toLowerCase()),
    );

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

            <div className="p-2 sm:p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* HEADER */}
                    <div className="mb-6">
                        <h1
                            className="mb-1 text-3xl font-light text-stone-800"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Survey Ulang
                        </h1>
                        <p className="text-sm text-stone-600">
                            Kelola survey ulang setelah customer melakukan DP
                        </p>
                    </div>

                    {/* SEARCH */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari project, company, atau customer..."
                            className="w-full rounded-xl border-2 border-stone-200 px-4 py-3 pl-10 text-sm text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-indigo-500"
                        />

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
                    </div>

                    {/* LIST */}
                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl border bg-white p-8 text-center shadow">
                                <p className="text-sm text-stone-600">
                                    Tidak ada survey ulang ditemukan.
                                </p>
                            </div>
                        ) : (
                            filtered.map((s) => {
                                const taskResponseRegular =
                                    taskResponses[s.id]?.regular;
                                const taskResponseMarketing =
                                    taskResponses[s.id]?.marketing;

                                return (
                                    <div
                                        key={s.id}
                                        className="rounded-xl border border-stone-200 bg-white p-5 shadow transition-all hover:shadow-lg"
                                    >
                                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-stone-900">
                                                    {s.nama_project}
                                                </h3>
                                                <p className="text-sm text-stone-600">
                                                    {s.company_name} •{' '}
                                                    {s.customer_name}
                                                </p>

                                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                                                    <div>
                                                        <p className="text-xs text-stone-500">
                                                            Survey Ulang
                                                        </p>
                                                        <p className="font-semibold text-stone-900">
                                                            {s.tanggal_survey_ulang
                                                                ? formatDate(
                                                                      s.tanggal_survey_ulang,
                                                                  )
                                                                : '-'}
                                                        </p>
                                                    </div>  

                                                    <div>
                                                        <p className="text-xs text-stone-500">
                                                            Status
                                                        </p>
                                                        <span
                                                            className={`rounded-lg border px-3 py-1 text-xs font-semibold ${getStatusColor(
                                                                s.status_survey_ulang,
                                                            )}`}
                                                        >
                                                            {formatStatus(
                                                                s.status_survey_ulang,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-stone-500">
                                                            Response By
                                                        </p>
                                                        <p className="font-semibold text-stone-900">
                                                            {s.response_by ||
                                                                '-'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-stone-500">
                                                            Response Time
                                                        </p>
                                                        <p className="font-semibold text-stone-900">
                                                            {s.response_time
                                                                ? formatDateTime(
                                                                      s.response_time,
                                                                  )
                                                                : '-'}
                                                        </p>
                                                    </div>

                                                    {/* Deadline & Extend Button - regular */}
                                                    {!isKepalaMarketing && taskResponseRegular &&
                                                        taskResponseRegular.status !==
                                                            'selesai' &&
                                                        taskResponseRegular.status !==
                                                            'menunggu_response' && (
                                                            <div className="col-span-2 mt-2">
                                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                                                    <div>
                                                                        <p className="text-xs font-medium text-yellow-800">
                                                                            Deadline
                                                                            Survey
                                                                            Ulang
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-yellow-900">
                                                                            {formatDeadline(
                                                                                taskResponseRegular.deadline,
                                                                            )}
                                                                        </p>
                                                                        {taskResponseRegular.extend_time >
                                                                            0 && (
                                                                            <p className="mt-1 text-xs text-orange-600">
                                                                                Perpanjangan:{' '}
                                                                                {
                                                                                    taskResponseRegular.extend_time
                                                                                }
                                                                                x
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            setShowExtendModal(
                                                                                {
                                                                                    orderId:
                                                                                        s.id,
                                                                                    tahap: 'survey_ulang',
                                                                                    isMarketing: false,
                                                                                    taskResponse:
                                                                                        taskResponseRegular,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                                                    >
                                                                        Minta
                                                                        Perpanjangan
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* Deadline & Extend Button - marketing (khusus Kepala Marketing) */}
                                                    {isKepalaMarketing &&
                                                        taskResponseMarketing &&
                                                        taskResponseMarketing.status !==
                                                            'selesai' &&
                                                        taskResponseMarketing.status !==
                                                            'menunggu_response' && (
                                                            <div className="col-span-2 mt-2">
                                                                <div className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                                                                    <div>
                                                                        <p className="text-xs font-medium text-purple-800">
                                                                            Deadline
                                                                            Survey
                                                                            Ulang
                                                                            (Marketing)
                                                                        </p>
                                                                        <p className="text-sm font-semibold text-purple-900">
                                                                            {formatDeadline(
                                                                                taskResponseMarketing.deadline,
                                                                            )}
                                                                        </p>
                                                                        {taskResponseMarketing.extend_time >
                                                                            0 && (
                                                                            <p className="mt-1 text-xs text-purple-700">
                                                                                Perpanjangan:{' '}
                                                                                {
                                                                                    taskResponseMarketing.extend_time
                                                                                }
                                                                                x
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            setShowExtendModal(
                                                                                {
                                                                                    orderId:
                                                                                        s.id,
                                                                                    tahap: 'survey_ulang',
                                                                                    isMarketing: true,
                                                                                    taskResponse:
                                                                                        taskResponseMarketing,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                                                                    >
                                                                        Minta
                                                                        Perpanjangan
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* PM Response Badge */}
                                                    {s.pm_response_time && (
                                                        <div className="col-span-2 rounded-lg border border-purple-200 bg-purple-50 p-2">
                                                            <p className="text-xs font-semibold text-purple-900">
                                                                ✓ Marketing
                                                                Response
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                By:{' '}
                                                                {
                                                                    s.pm_response_by
                                                                }
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                {formatDateTime(
                                                                    s.pm_response_time,
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="flex flex-col gap-2">
                                                {/* Marketing Response Button - Hanya untuk Kepala Marketing */}
                                                {isKepalaMarketing &&
                                                    !s.pm_response_time && (
                                                        <button
                                                            onClick={() =>
                                                                handlePmResponse(
                                                                    s.id,
                                                                )
                                                            }
                                                            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
                                                        >
                                                            Marketing Response
                                                        </button>
                                                    )}

                                                {/* Regular Response Button - Hanya untuk Non-Marketing */}
                                                {isNotKepalaMarketing &&
                                                    s.status_survey_ulang ===
                                                        'pending' && (
                                                        <button
                                                            onClick={() =>
                                                                router.post(
                                                                    `/survey-ulang/${s.id}/response`,
                                                                )
                                                            }
                                                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                                                        >
                                                            ✓ Response
                                                        </button>
                                                    )}

                                                {/* Input Hasil Survey - Hanya untuk Non-Marketing */}
                                                {isNotKepalaMarketing &&
                                                    s.status_survey_ulang ===
                                                        'waiting_input' && (
                                                        <Link
                                                            href={`/survey-ulang/create/${s.id}`}
                                                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600"
                                                        >
                                                            📝 Input Hasil Survey
                                                        </Link>
                                                    )}

                                                {/* View & Edit - Hanya untuk Non-Marketing */}
                                                {isNotKepalaMarketing &&
                                                    s.status_survey_ulang ===
                                                        'done' && (
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={`/survey-ulang/show/${s.survey_ulang_id}`}
                                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                href={`/survey-ulang/edit/${s.survey_ulang_id}`}
                                                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                                                            >
                                                                Edit
                                                            </Link>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
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
