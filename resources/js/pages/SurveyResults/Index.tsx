import ExtendModal from '@/components/ExtendModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';

import { useEffect, useState } from 'react';

interface Survey {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_masuk_customer: string;
    tanggal_survey: string | null;
    tahapan_proyek: string;
    payment_status: string;
    project_status: string;
    has_survey: boolean;
    is_draft: boolean;
    has_draft: boolean;
    survey_id: number | null;
    response_time: string | null;
    response_by: string | null;
    pm_response_time: string | null;
    pm_response_by: string | null;
    feedback: string | null;
    is_responded: boolean;
    team: {
        id: number;
        name: string;
        role: string;
    }[];
}

interface Props {
    surveys: Survey[];
}

export default function Index({ surveys }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // Store both regular and marketing TaskResponse for each survey
    const [taskResponses, setTaskResponses] = useState<
        Record<number, { regular?: any; marketing?: any }>
    >({});
    const [showExtendModal, setShowExtendModal] = useState<{
        orderId: number;
        tahap: string;
        taskResponse: any; // Tambah ini
        isMarketing: boolean;
    } | null>(null);

    const { auth } = usePage<{
        auth: { user: { isKepalaMarketing: boolean } };
    }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;

    useEffect(() => {
        setMounted(true);

        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        surveys.forEach((survey) => {
            // Fetch regular TaskResponse
            axios
                .get(`/task-response/${survey.id}/survey`)
                .then((res: any) => {
                    const task = Array.isArray(res.data)
                        ? res.data[0]
                        : res.data;
                    setTaskResponses((prev) => ({
                        ...prev,
                        [survey.id]: {
                            ...prev[survey.id],
                            regular: task ?? null,
                        },
                    }));
                })
                .catch((err: any) =>
                    console.error('Error fetching regular task response:', err),
                );
            // Fetch marketing TaskResponse (is_marketing=1)
            axios
                .get(`/task-response/${survey.id}/survey?is_marketing=1`)
                .then((res: any) => {
                    const task = Array.isArray(res.data)
                        ? res.data[0]
                        : res.data;
                    setTaskResponses((prev) => ({
                        ...prev,
                        [survey.id]: {
                            ...prev[survey.id],
                            marketing: task ?? null,
                        },
                    }));
                })
                .catch((err: any) =>
                    console.error(
                        'Error fetching marketing task response:',
                        err,
                    ),
                );
        });
    }, [surveys]);

    const handleMarkResponse = (orderId: number) => {
        if (confirm('Mark this survey as responded?')) {
            router.post(
                `/survey-results/${orderId}/mark-response`,
                {},
                {
                    onSuccess: () => {
                        console.log('Survey marked as responded');
                        router.reload({ only: ['surveys'] });
                    },
                },
            );
        }
    };

    const handlePmResponse = (surveyId: number) => {
        if (
            confirm(
                'Apakah Anda yakin ingin memberikan Marketing response untuk survey result ini?',
            )
        ) {
            console.log('Marketing Response surveyId:', surveyId);
            router.post(
                `/pm-response/survey-result/${surveyId}`,
                {},
                {
                    onSuccess: () => {
                        console.log('Marketing response recorded successfully');
                        router.visit(window.location.pathname, {
                            preserveScroll: true,
                            preserveState: false,
                        });
                    },
                    onError: (errors) => {
                        console.error('Marketing response error:', errors);
                    },
                },
            );
        }
    };

    // Tambahkan function ini setelah useEffect yang ada
    const refetchTaskResponses = () => {
        surveys.forEach((survey) => {
            // Fetch regular TaskResponse
            axios
                .get(`/task-response/${survey.id}/survey`)
                .then((res: any) => {
                    const task = Array.isArray(res.data)
                        ? res.data[0]
                        : res.data;
                    setTaskResponses((prev) => ({
                        ...prev,
                        [survey.id]: {
                            ...prev[survey.id],
                            regular: task ?? null,
                        },
                    }));
                })
                .catch((err: any) =>
                    console.error('Error fetching regular task response:', err),
                );

            // Fetch marketing TaskResponse (is_marketing=1)
            axios
                .get(`/task-response/${survey.id}/survey?is_marketing=1`)
                .then((res: any) => {
                    const task = Array.isArray(res.data)
                        ? res.data[0]
                        : res.data;
                    setTaskResponses((prev) => ({
                        ...prev,
                        [survey.id]: {
                            ...prev[survey.id],
                            marketing: task ?? null,
                        },
                    }));
                })
                .catch((err: any) =>
                    console.error(
                        'Error fetching marketing task response:',
                        err,
                    ),
                );
        });
    };

    const formatPaymentStatus = (status: string) => {
        switch (status) {
            case 'not_start':
                return 'Not Started';
            case 'cm_fee':
                return 'Commitment Fee';
            case 'dp':
                return 'Down Payment';
            case 'termin':
                return 'Termin';
            case 'lunas':
                return 'Lunas';
            default:
                return status;
        }
    };

    const formatTahapanProyek = (step: string) => {
        switch (step) {
            case 'not_start':
                return 'Not Started';
            case 'survey':
                return 'Survey';
            case 'moodboard':
                return 'Moodboard';
            case 'cm_fee':
                return 'Commitment Fee';
            case 'desain_final':
                return 'Desain Final';
            case 'rab':
                return 'RAB';
            case 'kontrak':
                return 'Kontrak';
            case 'survey_ulang':
                return 'Survey Ulang';
            case 'gambar_kerja':
                return 'Gambar Kerja';
            case 'produksi':
                return 'Produksi';
            default:
                return step;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-300';
            default:
                return 'bg-stone-100 text-stone-700 border-stone-300';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatSimpleDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const filteredSurveys = surveys.filter(
        (survey) =>
            survey.nama_project
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            survey.company_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            survey.customer_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
    );

    if (!mounted) return null;

    return (
        <>
            <Head title="Survey Results" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .slideIn { animation: slideIn 0.4s ease-out forwards; }

                .survey-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .survey-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="survey"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-2 sm:p-3 lg:ml-60">
                <div className="mt-12 p-2 sm:p-3">
                    {/* Header */}
                    <div
                        className={`mb-6 sm:mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                    >
                        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1
                                    className="mb-2 text-2xl font-light text-stone-800 sm:text-3xl lg:text-4xl"
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                    }}
                                >
                                    Survey Results
                                </h1>
                                <p className="text-sm text-stone-600 sm:text-base">
                                    Manage project survey results and feedback
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by project name, company, or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 pl-10 text-sm text-stone-700 placeholder-stone-400 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500 sm:px-5 sm:py-3.5 sm:pl-12 sm:text-base"
                            />
                            <svg
                                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-stone-400 sm:left-4 sm:h-5 sm:w-5"
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

                    {/* Stats Cards */}
                    <div
                        className={`mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4 lg:gap-6 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-blue-100 sm:text-sm">
                                        Total Surveys
                                    </p>
                                    <p className="text-2xl font-bold sm:text-3xl">
                                        {
                                            surveys.filter((s) => s.has_survey)
                                                .length
                                        }
                                    </p>
                                </div>
                                <div className="bg-opacity-20 rounded-lg bg-white p-2 sm:rounded-xl sm:p-3">
                                    <svg
                                        className="h-6 w-6 sm:h-8 sm:w-8"
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
                            </div>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-emerald-100 sm:text-sm">
                                        Responded
                                    </p>
                                    <p className="text-2xl font-bold sm:text-3xl">
                                        {
                                            surveys.filter(
                                                (s) => s.response_time,
                                            ).length
                                        }
                                    </p>
                                </div>
                                <div className="bg-opacity-20 rounded-lg bg-white p-2 sm:rounded-xl sm:p-3">
                                    <svg
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-amber-100 sm:text-sm">
                                        Pending
                                    </p>
                                    <p className="text-2xl font-bold sm:text-3xl">
                                        {
                                            surveys.filter(
                                                (s) =>
                                                    s.has_survey &&
                                                    !s.response_time,
                                            ).length
                                        }
                                    </p>
                                </div>
                                <div className="bg-opacity-20 rounded-lg bg-white p-2 sm:rounded-xl sm:p-3">
                                    <svg
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-rose-100 sm:text-sm">
                                        No Survey
                                    </p>
                                    <p className="text-2xl font-bold sm:text-3xl">
                                        {
                                            surveys.filter((s) => !s.has_survey)
                                                .length
                                        }
                                    </p>
                                </div>
                                <div className="bg-opacity-20 rounded-lg bg-white p-2 sm:rounded-xl sm:p-3">
                                    <svg
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Survey List */}
                    <div className="space-y-3 sm:space-y-4">
                        {filteredSurveys.length === 0 ? (
                            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-lg sm:rounded-2xl sm:p-12">
                                <svg
                                    className="mx-auto mb-4 h-12 w-12 text-stone-300 sm:h-16 sm:w-16"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <p className="text-sm font-medium text-stone-600 sm:text-base">
                                    No surveys found
                                </p>
                                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                                    Try adjusting your search
                                </p>
                            </div>
                        ) : (
                            filteredSurveys.map((survey, index) => (
                                <div
                                    key={survey.id}
                                    className={`survey-card overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg sm:rounded-2xl ${mounted ? 'slideIn' : 'opacity-0'}`}
                                    style={{
                                        animationDelay: `${0.15 + index * 0.05}s`,
                                    }}
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col gap-4">
                                            {/* Header Section */}
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex-1">
                                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-bold text-stone-900 sm:text-xl">
                                                            {
                                                                survey.nama_project
                                                            }
                                                        </h3>
                                                        <span
                                                            className={`rounded-lg border px-3 py-1 text-xs font-semibold ${getStatusColor(survey.project_status)}`}
                                                        >
                                                            {
                                                                survey.project_status
                                                            }
                                                        </span>
                                                        {survey.is_draft &&
                                                            survey.response_time && (
                                                                <span className="flex items-center gap-1.5 rounded-lg border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                                                                    <svg
                                                                        className="h-3.5 w-3.5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2.5
                                                                            }
                                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                        />
                                                                    </svg>
                                                                    DRAFT
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons - Moved to top right */}
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Marketing Response Button */}
                                                    {isKepalaMarketing &&
                                                        !survey.pm_response_time && (
                                                            <button
                                                                onClick={() =>
                                                                    handlePmResponse(
                                                                        survey.survey_id ||
                                                                            survey.id,
                                                                    )
                                                                }
                                                                className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-purple-600 hover:to-purple-700 sm:px-4 sm:text-sm"
                                                            >
                                                                Marketing
                                                                Response
                                                            </button>
                                                        )}

                                                    {/* General Response Buttons */}
                                                    {!survey.response_time ? (
                                                        <button
                                                            onClick={() =>
                                                                handleMarkResponse(
                                                                    survey.id,
                                                                )
                                                            }
                                                            className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 sm:px-4 sm:text-sm"
                                                        >
                                                            <svg
                                                                className="mr-1 h-4 w-4 sm:mr-2"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            Response
                                                        </button>
                                                    ) : survey.is_draft ? (
                                                        <>
                                                            {survey.has_draft ? (
                                                                <Link
                                                                    href={`/survey-results/${survey.survey_id || survey.id}/edit`}
                                                                    className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-amber-600 hover:to-orange-600 sm:px-4 sm:text-sm"
                                                                >
                                                                    <svg
                                                                        className="mr-1 h-4 w-4 sm:mr-2"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                        />
                                                                    </svg>
                                                                    Edit Draft
                                                                </Link>
                                                            ) : (
                                                                <Link
                                                                    href={`/survey-results/order/${survey.id}/create`}
                                                                    className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-cyan-600 hover:to-blue-600 sm:px-4 sm:text-sm"
                                                                >
                                                                    <svg
                                                                        className="mr-1 h-4 w-4 sm:mr-2"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 4v16m8-8H4"
                                                                        />
                                                                    </svg>
                                                                    Create
                                                                    Survey
                                                                </Link>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Link
                                                                href={`/survey-results/${survey.survey_id || survey.id}`}
                                                                className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-600 hover:to-blue-700 sm:px-4 sm:text-sm"
                                                            >
                                                                <svg
                                                                    className="mr-1 h-4 w-4 sm:mr-2"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                    />
                                                                </svg>
                                                                View
                                                            </Link>
                                                            <Link
                                                                href={`/survey-results/${survey.survey_id || survey.id}/edit`}
                                                                className="inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-amber-600 hover:to-amber-700 sm:px-4 sm:text-sm"
                                                            >
                                                                <svg
                                                                    className="mr-1 h-4 w-4 sm:mr-2"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                                Edit
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Project Info Grid */}
                                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Company
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {survey.company_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Customer
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {survey.customer_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Interior Type
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {survey.jenis_interior}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Survey Date
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {survey.tanggal_survey
                                                            ? formatSimpleDate(
                                                                  survey.tanggal_survey,
                                                              )
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Tahapan Proyek
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {formatTahapanProyek(
                                                            survey.tahapan_proyek,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-stone-500">
                                                        Payment Status
                                                    </p>
                                                    <p className="truncate font-semibold text-stone-900">
                                                        {formatPaymentStatus(
                                                            survey.payment_status,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Team Members */}
                                            {survey.team &&
                                                survey.team.length > 0 && (
                                                    <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:rounded-xl sm:p-4">
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <svg
                                                                className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                />
                                                            </svg>
                                                            <p className="text-xs font-bold text-indigo-900 sm:text-sm">
                                                                Project Team (
                                                                {
                                                                    survey.team
                                                                        .length
                                                                }
                                                                )
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {survey.team.map(
                                                                (member) => (
                                                                    <div
                                                                        key={
                                                                            member.id
                                                                        }
                                                                        className="inline-flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-white px-2 py-1.5 shadow-sm transition-all hover:shadow-md sm:px-3 sm:py-2"
                                                                    >
                                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white sm:h-8 sm:w-8">
                                                                            {member.name
                                                                                .charAt(
                                                                                    0,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-xs leading-tight font-semibold text-stone-900 sm:text-sm">
                                                                                {
                                                                                    member.name
                                                                                }
                                                                            </p>
                                                                            <p className="truncate text-xs font-medium text-indigo-600">
                                                                                {
                                                                                    member.role
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            {/* Deadline & Minta Perpanjangan - hanya setelah response */}
                                            {/* Regular TaskResponse Deadline/Extend */}

                                            {taskResponses[survey.id]
                                                ?.regular &&
                                                taskResponses[survey.id].regular
                                                    .status !== 'selesai' && (
                                                    <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 sm:p-4">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex-1">
                                                                <div className="mb-1 flex items-center gap-2">
                                                                    <svg
                                                                        className="h-5 w-5 text-amber-600"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    <p className="text-sm font-bold text-amber-900">
                                                                        Deadline
                                                                        Information
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm text-amber-700">
                                                                    <span className="font-semibold">
                                                                        Deadline:{' '}
                                                                    </span>
                                                                    {formatDeadline(
                                                                        taskResponses[
                                                                            survey
                                                                                .id
                                                                        ]
                                                                            .regular
                                                                            .deadline,
                                                                    )}
                                                                </p>
                                                                {taskResponses[
                                                                    survey.id
                                                                ].regular
                                                                    .extend_time >
                                                                    0 && (
                                                                    <p className="mt-1 text-sm font-semibold text-orange-600">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <svg
                                                                                className="h-4 w-4"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                />
                                                                            </svg>
                                                                            Diperpanjang:{' '}
                                                                            {
                                                                                taskResponses[
                                                                                    survey
                                                                                        .id
                                                                                ]
                                                                                    .regular
                                                                                    .extend_time
                                                                            }
                                                                            x
                                                                        </span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    setShowExtendModal(
                                                                        {
                                                                            orderId:
                                                                                survey.id,
                                                                            tahap: 'survey',
                                                                            taskResponse:
                                                                                taskResponses[
                                                                                    survey
                                                                                        .id
                                                                                ]
                                                                                    .regular, // PENTING: Pass yang regular
                                                                            isMarketing: false, // PENTING: false untuk regular
                                                                        },
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-orange-600 hover:to-orange-700"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                Minta
                                                                Perpanjangan
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            {/* Info Task Response Marketing */}
                                            {/* Marketing TaskResponse Deadline/Extend (for Kepala Marketing) */}
                                            {taskResponses[survey.id]
                                                ?.marketing &&
                                                isKepalaMarketing &&
                                                taskResponses[survey.id]
                                                    .marketing.status !==
                                                    'selesai' && (
                                                    <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex-1">
                                                                <div className="mb-1 flex items-center gap-2">
                                                                    <svg
                                                                        className="h-5 w-5 text-purple-600"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    <p className="text-sm font-bold text-purple-900">
                                                                        Deadline
                                                                        Information
                                                                        (Marketing)
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm text-purple-700">
                                                                    <span className="font-semibold">
                                                                        Deadline:{' '}
                                                                    </span>
                                                                    {formatDeadline(
                                                                        taskResponses[
                                                                            survey
                                                                                .id
                                                                        ]
                                                                            .marketing
                                                                            .deadline,
                                                                    )}
                                                                </p>
                                                                {taskResponses[
                                                                    survey.id
                                                                ].marketing
                                                                    .extend_time >
                                                                    0 && (
                                                                    <p className="mt-1 text-sm font-semibold text-purple-600">
                                                                        <span className="inline-flex items-center gap-1">
                                                                            <svg
                                                                                className="h-4 w-4"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                />
                                                                            </svg>
                                                                            Diperpanjang:{' '}
                                                                            {
                                                                                taskResponses[
                                                                                    survey
                                                                                        .id
                                                                                ]
                                                                                    .marketing
                                                                                    .extend_time
                                                                            }
                                                                            x
                                                                        </span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    setShowExtendModal(
                                                                        {
                                                                            orderId:
                                                                                survey.id,
                                                                            tahap: 'survey',
                                                                            taskResponse:
                                                                                taskResponses[
                                                                                    survey
                                                                                        .id
                                                                                ]
                                                                                    .marketing, // PENTING: Pass yang marketing
                                                                            isMarketing: true, // PENTING: true untuk marketing
                                                                        },
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-purple-600 hover:to-purple-700"
                                                            >
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                Minta
                                                                Perpanjangan
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            {/* Response Info */}
                                            {survey.response_time && (
                                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            className="h-4 w-4 flex-shrink-0 text-emerald-600 sm:h-5 sm:w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-medium text-emerald-700">
                                                                Responded by{' '}
                                                                <span className="font-bold">
                                                                    {
                                                                        survey.response_by
                                                                    }
                                                                </span>
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-emerald-600">
                                                                {formatDate(
                                                                    survey.response_time,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Marketing Response Badge */}
                                                    {survey.pm_response_time && (
                                                        <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-2">
                                                            <p className="text-xs font-semibold text-purple-900">
                                                                ✓ Marketing
                                                                Response
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                By:{' '}
                                                                {
                                                                    survey.pm_response_by
                                                                }
                                                            </p>
                                                            <p className="text-xs text-purple-700">
                                                                {formatDate(
                                                                    survey.pm_response_time,
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Extend Modal - Fixed z-index */}
            {/* Extend Modal - pass correct TaskResponse (marketing if available and isKepalaMarketing) */}
            {showExtendModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
                    <div className="relative w-full max-w-md">
                        <ExtendModal
                            orderId={showExtendModal.orderId}
                            tahap={showExtendModal.tahap}
                            taskResponse={showExtendModal.taskResponse}
                            isMarketing={showExtendModal.isMarketing}
                            refetchTaskResponses={refetchTaskResponses}
                            onClose={() => setShowExtendModal(null)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
