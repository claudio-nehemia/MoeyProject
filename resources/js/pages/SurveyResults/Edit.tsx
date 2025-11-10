import { useState, FormEventHandler } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: { nama_role: string };
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    phone_number: string;
    jenis_interior: JenisInterior;
    mom_file: string | null;
    users: User[];
}

interface Survey {
    id: number;
    order_id: number;
    feedback: string | null;
    layout: string | null;
    foto_lokasi: string | null;
    response_time: string | null;
    response_by: string | null;
    order: Order;
}

interface Props {
    survey: Survey;
}

export default function Edit({ survey }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const { data, setData, post, processing, errors } = useForm({
        feedback: survey.feedback || '',
        layout: null as File | null,
        foto_lokasi: null as File | null,
        mom_file: null as File | null,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('=== DEBUG UPDATE SURVEY ===');
        console.log('Survey ID:', survey.id);
        console.log('Feedback:', data.feedback);
        console.log('Has new layout:', data.layout ? 'Yes' : 'No');
        console.log('Has new foto_lokasi:', data.foto_lokasi ? 'Yes' : 'No');
        console.log('Has new mom_file:', data.mom_file ? 'Yes' : 'No');

        router.post(`/survey-results/${survey.id}`, {
            ...data,
            _method: 'PUT'
        }, {
            preserveScroll: true,
            onError: (errors) => {
                console.log('Validation errors:', errors);
            },
            onSuccess: () => {
                console.log('Survey updated successfully!');
            }
        });
    };

    return (
        <>
            <Head title={`Edit Survey - ${survey.order.nama_project}`} />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className="mb-8 fadeInUp">
                        <div className="flex items-center gap-3 mb-6">
                            <Link
                                href="/survey-results"
                                className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Edit Survey Result
                                </h1>
                                <p className="text-sm text-stone-500 mt-1">Update survey for {survey.order.nama_project}</p>
                            </div>
                        </div>
                    </div>

                    {/* Response Status */}
                    {survey.response_time && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-5 mb-8 fadeInUp" style={{ animationDelay: '0.05s' }}>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-600 p-3 rounded-xl">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-700">Responded by <span className="font-bold">{survey.response_by}</span></p>
                                    <p className="text-xs text-emerald-600">
                                        {new Date(survey.response_time).toLocaleDateString('id-ID', {
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8 fadeInUp" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-blue-900">{survey.order.nama_project}</h2>
                                <p className="text-blue-700 text-sm">{survey.order.company_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Customer</p>
                                <p className="text-blue-900 font-semibold">{survey.order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Phone</p>
                                <p className="text-blue-900 font-semibold">{survey.order.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Interior Type</p>
                                <p className="text-blue-900 font-semibold">{survey.order.jenis_interior.nama_interior}</p>
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    {survey.order.users && survey.order.users.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-8 fadeInUp" style={{ animationDelay: '0.12s' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-indigo-600 p-3 rounded-xl">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-indigo-900">Project Team</h2>
                                    <p className="text-indigo-600 text-sm">{survey.order.users.length} {survey.order.users.length === 1 ? 'Member' : 'Members'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {survey.order.users.map((member) => (
                                    <div 
                                        key={member.id}
                                        className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white font-bold text-lg shadow">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-stone-900 truncate">
                                                    {member.name}
                                                </h3>
                                                <p className="text-xs font-semibold text-indigo-600">
                                                    {member.role.nama_role}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate mt-0.5">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden fadeInUp" style={{ animationDelay: '0.15s' }}>
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Update Survey Information
                                </h2>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Feedback */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                                        Feedback / Notes
                                    </label>
                                    <textarea
                                        value={data.feedback}
                                        onChange={(e) => setData('feedback', e.target.value)}
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Enter feedback, observations, or notes from the survey..."
                                    />
                                    {errors.feedback && <p className="text-red-500 text-xs mt-1">{errors.feedback}</p>}
                                </div>

                                {/* Layout File */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                                        Layout File
                                    </label>
                                    
                                    {survey.layout && !data.layout && (
                                        <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-900">Current File</p>
                                                    <p className="text-xs text-blue-700">{survey.layout.split('/').pop()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/storage/${survey.layout}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                                        onChange={(e) => setData('layout', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        {survey.layout && !data.layout
                                            ? 'Upload a new file to replace the existing one'
                                            : 'Supported formats: PDF, JPG, PNG, DWG, DXF (Max 10MB)'}
                                    </p>
                                    {errors.layout && <p className="text-red-500 text-xs mt-1">{errors.layout}</p>}
                                </div>

                                {/* Foto Lokasi */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                                        Foto Lokasi / Site Photo
                                    </label>
                                    
                                    {survey.foto_lokasi && !data.foto_lokasi && (
                                        <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-900">Current Photo</p>
                                                    <p className="text-xs text-emerald-700">{survey.foto_lokasi.split('/').pop()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/storage/${survey.foto_lokasi}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </a>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => setData('foto_lokasi', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        {survey.foto_lokasi && !data.foto_lokasi
                                            ? 'Upload a new photo to replace the existing one'
                                            : 'Supported formats: JPG, PNG (Max 5MB)'}
                                    </p>
                                    {errors.foto_lokasi && <p className="text-red-500 text-xs mt-1">{errors.foto_lokasi}</p>}
                                </div>

                                {/* MOM File */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                                        MOM File (Minutes of Meeting) - Optional
                                    </label>
                                    
                                    {survey.order.mom_file && !data.mom_file && (
                                        <div className="mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">Current MOM File</p>
                                                    <p className="text-xs text-amber-700">{survey.order.mom_file.split('/').pop()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/storage/${survey.order.mom_file}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setData('mom_file', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        {survey.order.mom_file && !data.mom_file
                                            ? 'Upload a new file to replace the existing MOM in Order'
                                            : 'Supported formats: PDF, DOC, DOCX (Max 2MB) - Will be saved to Order'}
                                    </p>
                                    {errors.mom_file && <p className="text-red-500 text-xs mt-1">{errors.mom_file}</p>}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="bg-stone-50 px-8 py-6 flex items-center justify-end gap-3 border-t border-stone-200">
                                <Link
                                    href="/survey-results"
                                    className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 transition-all"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Updating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Update Survey
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
