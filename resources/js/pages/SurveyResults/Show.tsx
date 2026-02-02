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
    mom_files?: string[] | null;
}

interface JenisPengukuran {
    id: number;
    nama_pengukuran: string;
}

interface Survey {
    id: number;
    order_id: number;
    feedback: string | null;
    layout_files?: Array<{
        path: string;
        original_name: string;
        mime_type: string;
        size: number;
    }>;
    foto_lokasi_files?: Array<{
        path: string;
        original_name: string;
        mime_type: string;
        size: number;
    }>;
    response_time: string | null;
    response_by: string | null;
    created_at: string;
    updated_at: string;
    order: Order;
    jenis_pengukuran?: JenisPengukuran[];
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

    const [currentLayoutIndex, setCurrentLayoutIndex] = useState(0);
    const [currentFotoIndex, setCurrentFotoIndex] = useState(0);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('image')) {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        } else if (mimeType.includes('pdf')) {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        } else {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        }
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

                        {/* Files Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            {/* Layout Files Count */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-blue-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="font-semibold text-blue-900 text-sm sm:text-base">Layout Files</p>
                                </div>
                                {survey.layout_files && survey.layout_files.length > 0 ? (
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-blue-600">{survey.layout_files.length}</p>
                                        <p className="text-blue-700 text-xs mt-1">{survey.layout_files.length === 1 ? 'file' : 'files'} uploaded</p>
                                    </div>
                                ) : (
                                    <p className="text-blue-700 text-xs sm:text-sm">No files uploaded</p>
                                )}
                            </div>

                            {/* Site Photos Count */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-emerald-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-semibold text-emerald-900 text-sm sm:text-base">Site Photos</p>
                                </div>
                                {survey.foto_lokasi_files && survey.foto_lokasi_files.length > 0 ? (
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-emerald-600">{survey.foto_lokasi_files.length}</p>
                                        <p className="text-emerald-700 text-xs mt-1">{survey.foto_lokasi_files.length === 1 ? 'photo' : 'photos'} uploaded</p>
                                    </div>
                                ) : (
                                    <p className="text-emerald-700 text-xs sm:text-sm">No photos uploaded</p>
                                )}
                            </div>

                           {/* Jenis Pengukuran */}
                            {survey.jenis_pengukuran && survey.jenis_pengukuran.length > 0 && (
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-amber-200">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="font-semibold text-amber-900 text-sm sm:text-base">Jenis Pengukuran</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {survey.jenis_pengukuran.map((jp) => (
                                            <span key={jp.id} className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs sm:text-sm font-semibold rounded-full">
                                                {jp.nama_pengukuran}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* MOM File */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-amber-200">
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-semibold text-amber-900 text-sm sm:text-base">MOM File</p>
                                </div>
                                {(() => {
                                    const momFiles: string[] = [
                                        ...((survey.order.mom_files || []) as string[]),
                                        ...(survey.order.mom_file ? [survey.order.mom_file] : []),
                                    ];
                                    const deduped = momFiles.filter((p, i) => momFiles.indexOf(p) === i);

                                    if (deduped.length === 0) {
                                        return <p className="text-amber-700 text-xs sm:text-sm">No MOM file</p>;
                                    }

                                    return (
                                        <div className="space-y-2">
                                            <div className="text-center">
                                                <p className="text-3xl font-bold text-amber-600">{deduped.length}</p>
                                                <p className="text-amber-700 text-xs mt-1">{deduped.length === 1 ? 'file' : 'files'} uploaded</p>
                                            </div>
                                            <a
                                                href={`/storage/${deduped[0]}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors w-full justify-center"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download latest
                                            </a>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Layout Files Carousel */}
                    {survey.layout_files && survey.layout_files.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm sm:text-base lg:text-xl">Layout Files ({survey.layout_files.length})</span>
                            </h2>

                            <div className="relative">
                                <div className="overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
                                    <div className="aspect-video flex items-center justify-center p-8">
                                        {survey.layout_files[currentLayoutIndex].mime_type.includes('image') ? (
                                            <img
                                                src={`/storage/${survey.layout_files[currentLayoutIndex].path}`}
                                                alt={survey.layout_files[currentLayoutIndex].original_name}
                                                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="flex justify-center mb-4">
                                                    {getFileIcon(survey.layout_files[currentLayoutIndex].mime_type)}
                                                </div>
                                                <p className="text-lg font-semibold text-cyan-900 mb-2">
                                                    {survey.layout_files[currentLayoutIndex].original_name}
                                                </p>
                                                <p className="text-sm text-cyan-700 mb-4">
                                                    {(survey.layout_files[currentLayoutIndex].size / 1024).toFixed(1)} KB
                                                </p>
                                                <a
                                                    href={`/storage/${survey.layout_files[currentLayoutIndex].path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download File
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3">
                                        <p className="text-sm font-semibold truncate">{survey.layout_files[currentLayoutIndex].original_name}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs">File {currentLayoutIndex + 1} of {survey.layout_files.length}</p>
                                            <p className="text-xs">{(survey.layout_files[currentLayoutIndex].size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                </div>

                                {survey.layout_files.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentLayoutIndex((prev) => 
                                                prev === 0 ? survey.layout_files!.length - 1 : prev - 1
                                            )}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-cyan-600 p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setCurrentLayoutIndex((prev) => 
                                                prev === survey.layout_files!.length - 1 ? 0 : prev + 1
                                            )}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-cyan-600 p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {survey.layout_files.length > 1 && (
                                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                    {survey.layout_files.map((file, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentLayoutIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                currentLayoutIndex === index
                                                    ? 'border-cyan-600 ring-2 ring-cyan-300'
                                                    : 'border-stone-300 hover:border-cyan-400'
                                            }`}
                                        >
                                            {file.mime_type.includes('image') ? (
                                                <img
                                                    src={`/storage/${file.path}`}
                                                    alt={file.original_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                                                    <div className="text-cyan-600">
                                                        {getFileIcon(file.mime_type)}
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Foto Lokasi Carousel */}
                    {survey.foto_lokasi_files && survey.foto_lokasi_files.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm sm:text-base lg:text-xl">Site Photos ({survey.foto_lokasi_files.length})</span>
                            </h2>

                            <div className="relative">
                                <div className="overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                                    <div className="aspect-video flex items-center justify-center p-8">
                                        <img
                                            src={`/storage/${survey.foto_lokasi_files[currentFotoIndex].path}`}
                                            alt={survey.foto_lokasi_files[currentFotoIndex].original_name}
                                            className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                                        />
                                    </div>

                                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3">
                                        <p className="text-sm font-semibold truncate">{survey.foto_lokasi_files[currentFotoIndex].original_name}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs">Photo {currentFotoIndex + 1} of {survey.foto_lokasi_files.length}</p>
                                            <p className="text-xs">{(survey.foto_lokasi_files[currentFotoIndex].size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                </div>

                                {survey.foto_lokasi_files.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentFotoIndex((prev) => 
                                                prev === 0 ? survey.foto_lokasi_files!.length - 1 : prev - 1
                                            )}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-emerald-600 p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setCurrentFotoIndex((prev) => 
                                                prev === survey.foto_lokasi_files!.length - 1 ? 0 : prev + 1
                                            )}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-emerald-600 p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {survey.foto_lokasi_files.length > 1 && (
                                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                    {survey.foto_lokasi_files.map((file, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentFotoIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                currentFotoIndex === index
                                                    ? 'border-emerald-600 ring-2 ring-emerald-300'
                                                    : 'border-stone-300 hover:border-emerald-400'
                                            }`}
                                        >
                                            <img
                                                src={`/storage/${file.path}`}
                                                alt={file.original_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MOM File Section */}
                    {(() => {
                        const momFiles: string[] = [
                            ...((survey.order.mom_files || []) as string[]),
                            ...(survey.order.mom_file ? [survey.order.mom_file] : []),
                        ];
                        const deduped = momFiles.filter((p, i) => momFiles.indexOf(p) === i);

                        if (deduped.length === 0) return null;

                        return (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 sm:mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm sm:text-base lg:text-xl">Minutes of Meeting</span>
                            </h2>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                                <div className="space-y-3">
                                    {deduped.map((path, index) => (
                                        <div key={`${path}-${index}`} className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <svg className="w-7 h-7 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-semibold text-amber-900 truncate">{path.split('/').pop()}</p>
                                            </div>
                                            <a
                                                href={`/storage/${path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        );
                    })()}

                    {/* Jenis Pengukuran Section */}
                    {survey.jenis_pengukuran && survey.jenis_pengukuran.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                            <h2 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm sm:text-base lg:text-xl">Jenis Pengukuran</span>
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {survey.jenis_pengukuran.map((jp) => (
                                    <span key={jp.id} className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-semibold rounded-lg border border-indigo-200">
                                        {jp.nama_pengukuran}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
