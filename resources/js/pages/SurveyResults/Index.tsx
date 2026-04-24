import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ExtendModal from '@/components/ExtendModal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Eye, Edit2, PlusCircle, PenTool, CheckCircle, Clock } from 'lucide-react';

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
    can_marketing_response?: boolean;
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
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tahapanFilter, setTahapanFilter] = useState('all');

    const ITEMS_PER_PAGE = 15;
    const [currentPage, setCurrentPage] = useState(1);

    // TaskResponse (deadline & extension) state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

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

    const fetchTaskResponse = async (orderId: number, isMarketing: boolean) => {
        const url = isMarketing
            ? `/task-response/${orderId}/survey?is_marketing=1`
            : `/task-response/${orderId}/survey`;

        try {
            console.debug('[SurveyResults] fetchTaskResponse:start', { orderId, isMarketing, url });
            const res = await axios.get(url);
            const task = Array.isArray(res.data) ? res.data[0] : res.data;
            console.debug('[SurveyResults] fetchTaskResponse:response', { orderId, isMarketing, task, raw: res.data });
            if (!task) return;

            setTaskResponses((prev) => ({
                ...prev,
                [orderId]: {
                    ...prev[orderId],
                    ...(isMarketing ? { marketing: task } : { regular: task }),
                },
            }));
        } catch (err: any) {
            console.debug('[SurveyResults] fetchTaskResponse:error', { orderId, isMarketing, url, err });
            if (err?.response?.status !== 404) {
                console.error('Error fetching task response (survey):', err);
            }
        }
    };

    const refetchTaskResponsesForOrder = (orderId: number) => {
        fetchTaskResponse(orderId, false);
        if (isKepalaMarketing) {
            fetchTaskResponse(orderId, true);
        }
    };

    // Fetch task responses for survey stage
    useEffect(() => {
        surveys
            .filter((s) => s.tahapan_proyek === 'survey')
            .forEach((s) => {
                fetchTaskResponse(s.id, false);
                if (isKepalaMarketing) {
                    fetchTaskResponse(s.id, true);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surveys, isKepalaMarketing]);

    const handleMarkResponse = (orderId: number) => {
        if (confirm('Mark this survey as responded?')) {
            router.post(
                `/survey-results/${orderId}/mark-response`,
                {},
                {
                    onSuccess: () => {
                        console.log('Survey marked as responded');
                        // Force reload to get fresh data
                        router.reload({ only: ['surveys'] });
                    },
                },
            );
        }
    };

    const handlePmResponse = (orderId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan Marketing response untuk survey result ini?')) {
            console.log('Marketing Response orderId:', orderId);
            router.post(`/pm-response/survey-result/${orderId}`, {}, {
                onSuccess: () => {
                    console.log('Marketing response recorded successfully');
                    // Force full page reload untuk update tampilan
                    router.visit(window.location.pathname, {
                        preserveScroll: true,
                        preserveState: false,
                    });
                },
                onError: (errors) => {
                    console.error('Marketing response error:', errors);
                },
            });
        }
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
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'in_progress':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'pending':
                return 'bg-amber-50 text-amber-600 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };
    
    const getTahapanStyle = (tahapan: string) => {
        switch (tahapan) {
            case 'produksi':
                return { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '✨' };
            case 'kontrak':
                return { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '📄' };
            case 'rab':
                return { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: '💰' };
            case 'desain_final':
                return { color: 'bg-cyan-50 text-cyan-600 border-cyan-200', icon: '🎨' };
            case 'cm_fee':
                return { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: '💳' };
            case 'moodboard':
                return { color: 'bg-pink-50 text-pink-600 border-pink-200', icon: '🎨' };
            case 'survey':
                return { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: '📋' };
            case 'not_start':
            default:
                return { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: '⏳' };
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

    const filteredSurveys = surveys.filter((survey) => {
        const matchesSearch =
            survey.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
            survey.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            survey.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesStatus = statusFilter === 'all' || survey.project_status.toLowerCase() === statusFilter.toLowerCase();
        const matchesTahapan = tahapanFilter === 'all' || survey.tahapan_proyek.toLowerCase() === tahapanFilter.toLowerCase();
        
        return matchesSearch && matchesStatus && matchesTahapan;
    });

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, tahapanFilter]);

    const totalPages = Math.ceil(filteredSurveys.length / ITEMS_PER_PAGE);
    
    // Get current page data
    const currentSurveys = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSurveys.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSurveys, currentPage]);

    if (!mounted) return null;

    const renderCompactDeadlineSection = (task: TaskResponse | undefined, orderId: number, tahap: string, isMarketing: boolean) => {
        if (!task || task.status === 'selesai' || task.status === 'telat_submit' || task.update_data_time) return null;
        return (
            <div className={`mt-1 flex flex-col gap-1 rounded border p-1.5 ${isMarketing ? 'border-purple-200 bg-purple-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex flex-col">
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${isMarketing ? 'text-purple-700' : 'text-yellow-700'}`}>
                            <Clock size={10} /> 
                            {formatDeadline(task.deadline)}
                        </span>
                        {task.extend_time > 0 && (
                            <span className={`text-[9px] font-bold ${isMarketing ? 'text-purple-600' : 'text-orange-600'}`}>
                                Ext: {task.extend_time}x
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowExtendModal({ orderId, tahap, isMarketing, taskResponse: task }); }}
                        className={`flex-shrink-0 rounded px-1.5 py-1 text-[9px] font-bold text-white transition-colors ${isMarketing ? 'bg-purple-500 hover:bg-purple-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                        title="Minta Perpanjangan"
                    >
                        Ext
                    </button>
                </div>
            </div>
        );
    };

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
                <div className="mt-20 p-2 sm:p-3">
                    {/* Header */}
                    <div
                        className={`mb-6 sm:mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                    >
                        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                                    Survey Results
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Manage project survey results and feedback
                                </p>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by project name, company, or customer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-2.5 pl-10 text-sm text-stone-700 placeholder-stone-400 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500 sm:px-5 sm:py-3 sm:pl-12 sm:text-base"
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
                            <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex-1 sm:w-40 rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500 sm:py-3"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <select
                                    value={tahapanFilter}
                                    onChange={(e) => setTahapanFilter(e.target.value)}
                                    className="flex-1 sm:w-44 rounded-xl border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500 sm:py-3"
                                >
                                    <option value="all">All Stage</option>
                                    <option value="not_start">Not Start</option>
                                    <option value="survey">Survey</option>
                                    <option value="moodboard">Moodboard</option>
                                    <option value="cm_fee">Commitment Fee</option>
                                    <option value="desain_final">Desain Final</option>
                                    <option value="rab">RAB</option>
                                    <option value="kontrak">Kontrak</option>
                                    <option value="produksi">Produksi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div
                        className={`mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4 lg:gap-5 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '0.1s' }}
                    >
                        {/* Total Surveys */}
                        <div className="rounded-xl border-l-4 border-blue-400 bg-white p-4 shadow-md sm:rounded-2xl sm:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-slate-500 sm:text-sm">
                                        Total Surveys
                                    </p>
                                    <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                                        {surveys.filter((s) => s.has_survey).length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-2 text-blue-400 sm:rounded-xl sm:p-3">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Responded */}
                        <div className="rounded-xl border-l-4 border-emerald-400 bg-white p-4 shadow-md sm:rounded-2xl sm:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-slate-500 sm:text-sm">
                                        Responded
                                    </p>
                                    <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                                        {surveys.filter((s) => s.response_time).length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-400 sm:rounded-xl sm:p-3">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div className="rounded-xl border-l-4 border-amber-400 bg-white p-4 shadow-md sm:rounded-2xl sm:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-slate-500 sm:text-sm">
                                        Pending
                                    </p>
                                    <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                                        {surveys.filter((s) => s.has_survey && !s.response_time).length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2 text-amber-400 sm:rounded-xl sm:p-3">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* No Survey */}
                        <div className="rounded-xl border-l-4 border-rose-400 bg-white p-4 shadow-md sm:rounded-2xl sm:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs font-medium text-slate-500 sm:text-sm">
                                        No Survey
                                    </p>
                                    <p className="text-2xl font-bold text-slate-800 sm:text-3xl">
                                        {surveys.filter((s) => !s.has_survey).length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-rose-50 p-2 text-rose-400 sm:rounded-xl sm:p-3">
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    
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

                    {/* Survey Table Mode */}
                    <div className="space-y-3 sm:space-y-4">
                        {filteredSurveys.length === 0 ? (
                            <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-50">
                                    <svg className="h-8 w-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="mb-2 text-lg font-semibold text-slate-800">Tidak ada survey</p>
                                <p className="text-sm text-stone-500">Coba sesuaikan pencarian Anda</p>
                            </div>
                        ) : (
                            <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${mounted ? 'slideIn' : 'opacity-0'} survey-card`}>
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap text-left text-sm">
                                        <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">Project / Client Info</th>
                                                <th className="px-6 py-4">Service Type</th>
                                                <th className="px-6 py-4">Survey Date & Deadline</th>
                                                <th className="px-6 py-4">Stage / Tahapan</th>
                                                <th className="px-6 py-4">Survey Status</th>
                                                <th className="px-6 py-4">Team</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {currentSurveys.map((survey, index) => {
                                                const tahapan = getTahapanStyle(survey.tahapan_proyek);
                                                return (
                                                <tr key={survey.id} className="hover:bg-slate-50/50 transition-colors duration-200">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-slate-900 truncate max-w-[200px]">{survey.nama_project}</div>
                                                            {survey.is_draft && survey.response_time && (
                                                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-200">
                                                                    DRAFT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{survey.company_name}</div>
                                                        <div className="text-[11px] text-slate-400 font-bold tracking-tight mt-0.5">{survey.customer_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-700 font-medium">{survey.jenis_interior || '-'}</div>
                                                        <div className="mt-1">
                                                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold border rounded-full ${getStatusColor(survey.project_status)}`}>
                                                                {survey.project_status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-700">{survey.tanggal_survey ? formatSimpleDate(survey.tanggal_survey) : '-'}</div>
                                                        { survey.tahapan_proyek === "survey" && (
                                                            <div className="max-w-[160px]">
                                                                {!isKepalaMarketing && renderCompactDeadlineSection(taskResponses[survey.id]?.regular, survey.id, 'survey', false)}
                                                                {(survey.can_marketing_response ?? isKepalaMarketing) && renderCompactDeadlineSection(taskResponses[survey.id]?.marketing, survey.id, 'survey', true)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide border rounded-full ${tahapan.color}`}>
                                                            <span>{tahapan.icon}</span>
                                                            {formatTahapanProyek(survey.tahapan_proyek)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {survey.response_time ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded max-w-fit">
                                                                    <CheckCircle size={10} />
                                                                    <div>
                                                                        <span className="font-semibold">{survey.response_by}</span>
                                                                        <span className="text-emerald-500 ml-1">{formatDate(survey.response_time)}</span>
                                                                    </div>
                                                                </div>
                                                                {survey.pm_response_time && (
                                                                    <div className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded max-w-fit">
                                                                        <CheckCircle size={10} />
                                                                        <div>
                                                                            <span className="font-semibold">Mkt: {survey.pm_response_by}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic">Belum ada respon</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex -space-x-2">
                                                            {survey.team && survey.team.length > 0 ? (
                                                                <>
                                                                    {survey.team.slice(0, 3).map((member, i) => {
                                                                        const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-teal-500', 'bg-amber-500', 'bg-emerald-500'];
                                                                        const colorClass = colors[member.id % colors.length];
                                                                        return (
                                                                            <div key={member.id} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm hover:z-10 transition-all cursor-default ${colorClass}`} title={`${member.name} - ${member.role}`}>
                                                                                {member.name.substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {survey.team.length > 3 && (
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border-2 border-white shadow-sm hover:z-10 transition-all cursor-default" title={`${survey.team.length - 3} more`}>
                                                                            +{survey.team.length - 3}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* General Response Workflow Actions */}
                                                            {!survey.response_time ? (
                                                                isNotKepalaMarketing ? (
                                                                    <button onClick={() => handleMarkResponse(survey.id)} className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                                        <CheckCircle size={12} /> Respond
                                                                    </button>
                                                                ) : null
                                                            ) : survey.is_draft ? (
                                                                // Draft Mode
                                                                survey.has_draft ? (
                                                                    <Link href={`/survey-results/${survey.survey_id || survey.id}/edit`} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors">
                                                                        <PenTool size={12} /> Edit Draft
                                                                    </Link>
                                                                ) : (
                                                                    <Link href={`/survey-results/order/${survey.id}/create`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors">
                                                                        <PlusCircle size={12} /> Create
                                                                    </Link>
                                                                )
                                                            ) : (
                                                                // Published Mode (Icons only for clean look)
                                                                <div className="flex items-center gap-3 mr-2">
                                                                    <Link href={`/survey-results/${survey.survey_id || survey.id}`} className="text-slate-400 hover:text-indigo-600 transition-colors" title="View Detail">
                                                                        <Eye size={18} />
                                                                    </Link>
                                                                    <Link href={`/survey-results/${survey.survey_id || survey.id}/edit`} className="text-slate-400 hover:text-amber-600 transition-colors" title="Edit Survey">
                                                                        <Edit2 size={18} />
                                                                    </Link>
                                                                </div>
                                                            )}

                                                            {/* Marketing Response Button Extra */}
                                                            {(survey.can_marketing_response ?? isKepalaMarketing) && !survey.pm_response_time && (
                                                                <button onClick={() => handlePmResponse(survey.survey_id || survey.id)} className="inline-flex items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors">
                                                                    MKT Res
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Footer */}
                                <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-500 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div>
                                        Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSurveys.length)}</span> of <span className="font-semibold text-slate-700">{filteredSurveys.length}</span> surveys
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                            >
                                                Prev
                                            </button>
                                            <div className="flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
                                                {currentPage} / {totalPages}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    isMarketing={showExtendModal.isMarketing}
                    taskResponse={showExtendModal.taskResponse}
                    onClose={() => setShowExtendModal(null)}
                    refetchTaskResponses={() => refetchTaskResponsesForOrder(showExtendModal.orderId)}
                />
            )}
        </>
    );
}
