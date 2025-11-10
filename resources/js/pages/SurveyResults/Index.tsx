import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Survey {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_masuk_customer: string;
    project_status: string;
    has_survey: boolean;
    survey_id: number | null;
    response_time: string | null;
    response_by: string | null;
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

    const handleMarkResponse = (orderId: number) => {
        if (confirm('Mark this survey as responded?')) {
            router.post(`/survey-results/${orderId}/mark-response`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Survey marked as responded');
                }
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
            default: return 'bg-stone-100 text-stone-700 border-stone-300';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredSurveys = surveys.filter(survey =>
        survey.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        survey.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        survey.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Sidebar isOpen={sidebarOpen} currentPage="survey" onClose={() => setSidebarOpen(false)} />

            <div className="p-2 sm:p-3 lg:ml-60">
                <div className="p-2 sm:p-3 mt-12">
                    {/* Header */}
                    <div className={`mb-6 sm:mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-stone-800 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Survey Results
                                </h1>
                                <p className="text-sm sm:text-base text-stone-600">Manage project survey results and feedback</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by project name, company, or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-10 sm:pl-12 bg-white border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-sm sm:text-base text-stone-700 placeholder-stone-400"
                            />
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Surveys</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{surveys.filter(s => s.has_survey).length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-xs sm:text-sm font-medium mb-1">Responded</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{surveys.filter(s => s.response_time).length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100 text-xs sm:text-sm font-medium mb-1">Pending</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{surveys.filter(s => s.has_survey && !s.response_time).length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-rose-100 text-xs sm:text-sm font-medium mb-1">No Survey</p>
                                    <p className="text-2xl sm:text-3xl font-bold">{surveys.filter(s => !s.has_survey).length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Survey List */}
                    <div className="space-y-3 sm:space-y-4">
                        {filteredSurveys.length === 0 ? (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-8 sm:p-12 text-center">
                                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-stone-600 font-medium text-sm sm:text-base">No surveys found</p>
                                <p className="text-stone-500 text-xs sm:text-sm mt-1">Try adjusting your search</p>
                            </div>
                        ) : (
                            filteredSurveys.map((survey, index) => (
                                <div
                                    key={survey.id}
                                    className={`survey-card bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 overflow-hidden ${mounted ? 'slideIn' : 'opacity-0'}`}
                                    style={{ animationDelay: `${0.15 + index * 0.05}s` }}
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            {/* Left Section - Project Info */}
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                                    <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                                                        {survey.nama_project}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border w-fit ${getStatusColor(survey.project_status)}`}>
                                                        {survey.project_status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                                                    <div>
                                                        <p className="text-stone-500 text-xs font-medium mb-1">Company</p>
                                                        <p className="text-stone-900 font-semibold truncate">{survey.company_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-stone-500 text-xs font-medium mb-1">Customer</p>
                                                        <p className="text-stone-900 font-semibold truncate">{survey.customer_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-stone-500 text-xs font-medium mb-1">Interior Type</p>
                                                        <p className="text-stone-900 font-semibold truncate">{survey.jenis_interior}</p>
                                                    </div>
                                                </div>

                                                {/* Team Members */}
                                                {survey.team && survey.team.length > 0 && (
                                                    <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            <p className="text-xs sm:text-sm font-bold text-indigo-900">
                                                                Project Team ({survey.team.length})
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {survey.team.map((member) => (
                                                                <div 
                                                                    key={member.id}
                                                                    className="inline-flex items-center gap-2 bg-white border-2 border-indigo-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all"
                                                                >
                                                                    <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white font-bold text-xs">
                                                                        {member.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-tight truncate">
                                                                            {member.name}
                                                                        </p>
                                                                        <p className="text-xs text-indigo-600 font-medium truncate">
                                                                            {member.role}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Response Info */}
                                                {survey.response_time && (
                                                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-emerald-700 font-medium truncate">
                                                                    Responded by <span className="font-bold">{survey.response_by}</span>
                                                                </p>
                                                                <p className="text-xs text-emerald-600 mt-0.5">
                                                                    {formatDate(survey.response_time)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Section - Actions */}
                                            <div className="flex flex-row lg:flex-col gap-2 justify-end lg:justify-start">
                                                {!survey.has_survey ? (
                                                    // Belum ada survey & belum klik response - Tampilkan tombol Response
                                                    <button
                                                        onClick={() => handleMarkResponse(survey.id)}
                                                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                                    >
                                                        <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="hidden sm:inline">Response</span>
                                                        <span className="sm:hidden">Respond</span>
                                                    </button>
                                                ) : (
                                                    // Sudah klik response - Tampilkan tombol Create/View/Edit
                                                    <>
                                                        {!survey.feedback && !survey.response_time ? (
                                                            // Sudah klik response tapi belum isi survey
                                                            <Link
                                                                href={`/survey-results/create/${survey.id}`}
                                                                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                                            >
                                                                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                                <span className="hidden sm:inline">Create Survey</span>
                                                                <span className="sm:hidden">Create</span>
                                                            </Link>
                                                        ) : (
                                                            // Sudah isi survey
                                                            <>
                                                                <Link
                                                                    href={`/survey-results/${survey.survey_id}`}
                                                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    View
                                                                </Link>
                                                                <Link
                                                                    href={`/survey-results/${survey.survey_id}/edit`}
                                                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Edit
                                                                </Link>
                                                            </>
                                                        )}
                                                    </>
                                                )}
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
