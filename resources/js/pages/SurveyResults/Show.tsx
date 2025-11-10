import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface User {
    id: number;
    name: string;
    email: string;
    role: { nama_role: string };
}

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    phone_number: string;
    tanggal_masuk_customer: string;
    project_status: string;
    jenis_interior: JenisInterior;
    users: User[];
    mom_file: string | null;
}

interface Survey {
    id: number;
    order_id: number;
    feedback: string | null;
    layout: string | null;
    foto_lokasi: string | null;
    response_time: string | null;
    response_by: string | null;
    created_at: string;
    updated_at: string;
    order: Order;
}

interface Props {
    survey: Survey;
}

export default function Show({ survey }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this survey result? This action cannot be undone.')) {
            router.delete(`/survey-results/${survey.id}`, {
                onSuccess: () => {
                    router.visit('/survey-results');
                }
            });
        }
    };

    return (
        <>
            <Head title={`Survey - ${survey.order.nama_project}`} />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey" onClose={() => setSidebarOpen(false)} />

            <div className="p-2 sm:p-3 lg:ml-60">
                <div className="p-2 sm:p-3 mt-12">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link
                                    href="/survey-results"
                                    className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <div>
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Survey Result Details
                                    </h1>
                                    <p className="text-xs sm:text-sm text-stone-500 mt-1 truncate">{survey.order.nama_project}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/survey-results/${survey.id}/edit`}
                                    className="inline-flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="hidden sm:inline">Edit</span>
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Response Status */}
                    {survey.response_time && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="bg-emerald-600 p-3 sm:p-4 rounded-xl flex-shrink-0">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-emerald-700">Survey Responded</p>
                                    <p className="text-base sm:text-lg font-bold text-emerald-900 truncate">By {survey.response_by}</p>
                                    <p className="text-xs sm:text-sm text-emerald-600">{formatDate(survey.response_time)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Project Information */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm sm:text-base lg:text-xl">Project Information</span>
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Project Name</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-stone-900 truncate">{survey.order.nama_project}</p>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Company</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-stone-900 truncate">{survey.order.company_name}</p>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Customer</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-stone-900 truncate">{survey.order.customer_name}</p>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Phone</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-stone-900">{survey.order.phone_number}</p>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Interior Type</p>
                                <p className="text-sm sm:text-base lg:text-lg font-bold text-stone-900 truncate">{survey.order.jenis_interior.nama_interior}</p>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Status</p>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-semibold">
                                    {survey.order.project_status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    {survey.order.users && survey.order.users.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-sm sm:text-base lg:text-xl">Project Team</span>
                                </div>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold rounded-full w-fit">
                                    {survey.order.users.length} {survey.order.users.length === 1 ? 'Member' : 'Members'}
                                </span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {survey.order.users.map((member) => (
                                    <div 
                                        key={member.id}
                                        className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 hover:shadow-lg transition-all hover:scale-105"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white font-bold text-lg sm:text-xl shadow-lg">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate">
                                                    {member.name}
                                                </h3>
                                                <p className="text-xs sm:text-sm font-semibold text-indigo-600 mt-1">
                                                    {member.role.nama_role}
                                                </p>
                                                <p className="text-xs text-stone-500 mt-1 truncate">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Survey Details */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm sm:text-base lg:text-xl">Survey Details</span>
                        </h2>

                        {/* Feedback */}
                        <div className="mb-4 sm:mb-6">
                            <p className="text-xs sm:text-sm font-semibold text-stone-700 mb-2">Feedback / Notes</p>
                            <div className="bg-stone-50 rounded-lg p-3 sm:p-4">
                                <p className="text-sm sm:text-base text-stone-900 whitespace-pre-wrap">{survey.feedback || 'No feedback provided'}</p>
                            </div>
                        </div>

                        {/* Files */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            {/* Layout */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-blue-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-semibold text-blue-900 text-sm sm:text-base">Layout File</p>
                                </div>
                                {survey.layout ? (
                                    <a
                                        href={`/storage/${survey.layout}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors w-full justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                ) : (
                                    <p className="text-blue-700 text-xs sm:text-sm">No file uploaded</p>
                                )}
                            </div>

                            {/* Foto Lokasi */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-emerald-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-semibold text-emerald-900 text-sm sm:text-base">Site Photo</p>
                                </div>
                                {survey.foto_lokasi ? (
                                    <a
                                        href={`/storage/${survey.foto_lokasi}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors w-full justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Photo
                                    </a>
                                ) : (
                                    <p className="text-emerald-700 text-xs sm:text-sm">No photo uploaded</p>
                                )}
                            </div>

                            {/* MOM File */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-amber-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-semibold text-amber-900 text-sm sm:text-base">MOM File</p>
                                </div>
                                {survey.order.mom_file ? (
                                    <a
                                        href={`/storage/${survey.order.mom_file}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors w-full justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                ) : (
                                    <p className="text-amber-700 text-xs sm:text-sm">No MOM file</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-3 sm:p-4 text-center">
                            <p className="text-xs font-semibold text-stone-600 uppercase">Created</p>
                            <p className="text-xs sm:text-sm text-stone-900 mt-2">{formatDate(survey.created_at)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-3 sm:p-4 text-center">
                            <p className="text-xs font-semibold text-stone-600 uppercase">Last Updated</p>
                            <p className="text-xs sm:text-sm text-stone-900 mt-2">{formatDate(survey.updated_at)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
