import { useMemo, useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import JenisPengukuranModal from '@/components/JenisPengukuranModal';
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
        mom_files?: Array<string | { path: string; original_name?: string }> | null;
    users: User[];
}

interface Survey {
    id: number;
    order_id: number;
    response_time: string;
    response_by: string;
}

interface Pengukuran {
    id: number;
    nama_pengukuran: string;
}

interface Props {
    order: Order;
    survey: Survey;
    jenisPengukuran: { id: number; nama_pengukuran: string }[];
    selectedPengukuranIds: number[];
}

export default function Create({ order, survey, jenisPengukuran, selectedPengukuranIds }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const initialSelectedPengukuran = selectedPengukuranIds || [];

    const { data, setData, post, processing, errors, progress, transform } = useForm({
        survey_id: survey.id,
        feedback: '',
        layout_files: [] as File[],
        foto_lokasi_files: [] as File[],
        mom_files: [] as File[],
        jenis_pengukuran_ids: initialSelectedPengukuran as number[],
        action: 'publish' as 'save_draft' | 'publish',
    });

    const [showJenisModal, setShowJenisModal] = useState(false);

    // list & selection
    const [jenisList, setJenisList] = useState<Pengukuran[]>(jenisPengukuran);
    const [selectedPengukuran, setSelectedPengukuran] = useState<number[]>(initialSelectedPengukuran);

    // form untuk create jenis
    const {
        data: jenisData,
        setData: setJenisData,
        post: postJenis,
        processing: jenisProcessing,
        errors: jenisErrors,
        reset: resetJenis,
    } = useForm({
        nama_pengukuran: '',
    });

    const handleCreateJenisPengukuran = () => {
        postJenis('/jenis-pengukuran', {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const newJenis = page.props.flash?.newJenisPengukuran;
                if (!newJenis) return;

                // tambah ke list
                setJenisList(prev => [...prev, newJenis]);

                // auto check (opsional, sama seperti Edit)
                const updated = [...selectedPengukuran, newJenis.id];
                setSelectedPengukuran(updated);
                setData('jenis_pengukuran_ids', updated);

                resetJenis();
                setShowJenisModal(false);
            },
        });
    };

    const [submitAction, setSubmitAction] = useState<'save_draft' | 'publish' | null>(null);

    const totalUploadBytes = useMemo(() => {
        const files = [
            ...(data.layout_files || []),
            ...(data.foto_lokasi_files || []),
            ...(data.mom_files || []),
        ];
        return files.reduce((sum, f) => sum + (f?.size || 0), 0);
    }, [data.layout_files, data.foto_lokasi_files, data.mom_files]);

    const handleSubmit = (action: 'save_draft' | 'publish') => {
        if (processing) return;

        setSubmitAction(action);

        // Ensure action is sent in the request payload
        transform((form) => ({ ...form, action }));

        post('/survey-results', {
            preserveScroll: true,
            forceFormData: true,
            onError: (errs) => {
                console.log('Validation errors:', errs);
            },
            onFinish: () => {
                // Reset transform to identity for subsequent submits
                transform((form) => ({ ...form }));
                setSubmitAction(null);
            },
        });
    };

    return (
        <>
            <Head title={`Create Survey - ${order.nama_project}`} />

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
                                    Create Survey Result
                                </h1>
                                <p className="text-sm text-stone-500 mt-1">Add survey result for {order.nama_project}</p>
                            </div>
                        </div>
                    </div>

                    {/* Response Status */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-5 mb-8 fadeInUp" style={{ animationDelay: '0.05s' }}>
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-700">Response Recorded</p>
                                <p className="text-xs text-emerald-600">
                                    By <span className="font-bold">{survey.response_by}</span> at{' '}
                                    {new Date(survey.response_time).toLocaleDateString('id-ID', {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8 fadeInUp" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-blue-900">{order.nama_project}</h2>
                                <p className="text-blue-700 text-sm">{order.company_name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Customer</p>
                                <p className="text-blue-900 font-semibold">{order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Phone</p>
                                <p className="text-blue-900 font-semibold">{order.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium mb-1">Interior Type</p>
                                <p className="text-blue-900 font-semibold">{order.jenis_interior.nama_interior}</p>
                            </div>
                        </div>
                    </div>

                    {/* Team Members */}
                    {order.users && order.users.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-8 fadeInUp" style={{ animationDelay: '0.12s' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-indigo-600 p-3 rounded-xl">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-indigo-900">Project Team</h2>
                                    <p className="text-indigo-600 text-sm">{order.users.length} {order.users.length === 1 ? 'Member' : 'Members'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {order.users.map((member) => (
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
                    <div>
                        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden fadeInUp" style={{ animationDelay: '0.15s' }}>
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Survey Information
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
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Enter feedback, observations, or notes from the survey..."
                                    />
                                    {errors.feedback && <p className="text-red-500 text-xs mt-1">{errors.feedback}</p>}
                                </div>

                                {/* Layout Files (Multiple) */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
                                        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Layout Files (Multiple)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setData('layout_files', [...data.layout_files, ...files]);
                                            e.target.value = ''; // Reset input agar bisa pilih file yang sama lagi
                                        }}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        Upload multiple layout files. Supported: PDF, Images, CAD
                                    </p>
                                    {data.layout_files.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-stone-700">Selected files ({data.layout_files.length}):</p>
                                            {data.layout_files.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-stone-600 bg-cyan-50 px-3 py-2 rounded-lg">
                                                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="flex-1 truncate">{file.name}</span>
                                                    <span className="text-stone-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const next = data.layout_files.filter((_, i) => i !== index);
                                                            setData('layout_files', next);
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.layout_files && <p className="text-red-500 text-xs mt-1">{errors.layout_files}</p>}
                                </div>

                                {/* Foto Lokasi (Multiple) */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-3">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Foto Lokasi (Multiple)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setData('foto_lokasi_files', [...data.foto_lokasi_files, ...files]);
                                            e.target.value = ''; // Reset input agar bisa pilih file yang sama lagi
                                        }}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        Upload multiple photos. Supported: JPG, PNG
                                    </p>
                                    {data.foto_lokasi_files.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-stone-700">Selected files ({data.foto_lokasi_files.length}):</p>
                                            {data.foto_lokasi_files.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-stone-600 bg-emerald-50 px-3 py-2 rounded-lg">
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="flex-1 truncate">{file.name}</span>
                                                    <span className="text-stone-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const next = data.foto_lokasi_files.filter((_, i) => i !== index);
                                                            setData('foto_lokasi_files', next);
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.foto_lokasi_files && <p className="text-red-500 text-xs mt-1">{errors.foto_lokasi_files}</p>}
                                </div>

                                {/* Jenis Pengukuran */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700">
                                        Jenis Pengukuran
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowJenisModal(true)}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        + Tambah
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {jenisList.map((jp) => (
                                            <label
                                                key={jp.id}
                                                className="flex items-center gap-2 p-3 border-2 border-stone-200 rounded-xl"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPengukuran.includes(jp.id)}
                                                    onChange={() => {
                                                        const updated = selectedPengukuran.includes(jp.id)
                                                            ? selectedPengukuran.filter(id => id !== jp.id)
                                                            : [...selectedPengukuran, jp.id];

                                                        setSelectedPengukuran(updated);
                                                        setData('jenis_pengukuran_ids', updated);
                                                    }}
                                                    className="h-4 w-4 text-cyan-600"
                                                />
                                                <span className="text-sm">{jp.nama_pengukuran}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.jenis_pengukuran_ids && <p className="text-red-500 text-xs mt-1">{errors.jenis_pengukuran_ids}</p>}
                                </div>

                                {/* MOM File */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                                        MOM File (Minutes of Meeting) - Optional
                                    </label>

                                    {(() => {
                                            const raw: Array<string | { path: string; original_name?: string }> = [
                                                ...((order.mom_files || []) as Array<string | { path: string; original_name?: string }>),
                                                ...(order.mom_file ? [order.mom_file] : []),
                                            ];

                                            const existingMomFiles = raw
                                                .map((entry) => {
                                                    if (typeof entry === 'string') {
                                                        return {
                                                            path: entry,
                                                            original_name: entry.split('/').pop() || entry,
                                                        };
                                                    }
                                                    return {
                                                        path: entry.path,
                                                        original_name:
                                                            entry.original_name || entry.path.split('/').pop() || entry.path,
                                                    };
                                                })
                                                .filter((x) => !!x.path);

                                        if (existingMomFiles.length === 0 || data.mom_files.length > 0) return null;

                                        // de-dupe
                                            const seen = new Set<string>();
                                            const deduped = existingMomFiles.filter((f) => {
                                                if (seen.has(f.path)) return false;
                                                seen.add(f.path);
                                                return true;
                                            });

                                        return (
                                            <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                                    Existing MOM files ({deduped.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {deduped.map((file, idx) => (
                                                        <div
                                                            key={`${file.path}-${idx}`}
                                                            className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-blue-800 truncate">{file.original_name}</p>
                                                                <p className="text-[11px] text-blue-600 truncate">{file.path}</p>
                                                            </div>
                                                            <a
                                                                href={`/storage/${file.path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                                            >
                                                                Download
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setData('mom_files', [...data.mom_files, ...files]);
                                            e.target.value = ''; // Reset input agar bisa pilih file yang sama lagi
                                        }}
                                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-2">
                                        Supported formats: PDF, DOC, DOCX - Will be appended to Order MOM files
                                    </p>
                                    {data.mom_files.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-stone-700">New MOM files to upload ({data.mom_files.length}):</p>
                                            {data.mom_files.map((file, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs text-stone-600 bg-amber-50 px-3 py-2 rounded-lg">
                                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="flex-1 truncate">{file.name}</span>
                                                    <span className="text-stone-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const next = data.mom_files.filter((_, i) => i !== index);
                                                            setData('mom_files', next);
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(errors as any).mom_files && <p className="text-red-500 text-xs mt-1">{(errors as any).mom_files}</p>}
                                    {(errors as any)['mom_files.0'] && <p className="text-red-500 text-xs mt-1">{(errors as any)['mom_files.0']}</p>}
                                    {(errors as any).mom_file && <p className="text-red-500 text-xs mt-1">{(errors as any).mom_file}</p>}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="bg-stone-50 px-8 py-6 flex items-center justify-between border-t border-stone-200">
                                <Link
                                    href="/survey-results"
                                    className="px-6 py-3 bg-white text-stone-700 rounded-xl font-medium hover:bg-stone-100 transition-all border-2 border-stone-200"
                                >
                                    Cancel
                                </Link>

                                {/* Upload progress (large files can take time) */}
                                {processing && totalUploadBytes > 0 && (
                                    <div className="mx-4 hidden flex-1 flex-col justify-center gap-1 md:flex">
                                        <div className="flex items-center justify-between text-xs text-stone-600">
                                            <span>
                                                {submitAction === 'publish'
                                                    ? 'Uploading & processing (Publish)'
                                                    : 'Uploading & processing (Draft)'}
                                            </span>
                                            <span>
                                                {progress?.percentage != null
                                                    ? `${Math.round(progress.percentage)}%`
                                                    : 'Processing...'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 transition-all"
                                                style={{
                                                    width:
                                                        progress?.percentage != null
                                                            ? `${progress.percentage}%`
                                                            : '100%',
                                                }}
                                            />
                                        </div>
                                        <div className="text-[11px] text-stone-500">
                                            {progress?.percentage != null
                                                ? 'Uploading files...'
                                                : 'Server is processing images & thumbnails...'}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSubmit('save_draft')}
                                        disabled={processing}
                                        className="px-6 py-3 bg-white text-amber-700 rounded-xl font-medium hover:bg-amber-50 transition-all border-2 border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                </svg>
                                                <span>Save as Draft</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSubmit('publish')}
                                        disabled={processing}
                                        className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Publish Survey</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <JenisPengukuranModal
                        show={showJenisModal}
                        editMode={false}
                        deleteMode={false}
                        processing={jenisProcessing}
                        data={jenisData}
                        errors={jenisErrors}
                        onClose={() => {
                            setShowJenisModal(false);
                            resetJenis();
                        }}
                        onSubmit={handleCreateJenisPengukuran}
                        onDataChange={(field, value) => setJenisData(field as any, value)}
                    />
                </div>
            </div>
        </>
    );
}
