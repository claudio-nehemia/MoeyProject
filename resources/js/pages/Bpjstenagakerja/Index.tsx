import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface Karyawan {
    nik: string;
    nik_show: string;
    nama_karyawan: string;
}

interface Bpjstenagakerja {
    kode_bpjs_tk: string;
    nik: string;
    nama_karyawan: string;
    nik_show: string;
    jumlah: number;
    tanggal_berlaku: string;
    created_at?: string;
    updated_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
    links: PaginationLink[];
}

interface Props {
    bpjstenagakerjas: PaginatedData<Bpjstenagakerja>;
    karyawans: Karyawan[];
    filters: {
        search?: string;
    };
}

export default function Index({ bpjstenagakerjas, karyawans, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedBpjs, setSelectedBpjs] = useState<Bpjstenagakerja | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || "");

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nik: '',
        jumlah: '',
        tanggal_berlaku: new Date().toISOString().split('T')[0],
    });

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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        router.get('/bpjs-ketenagakerjaan', { search: query }, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedBpjs(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: Bpjstenagakerja) => {
        setEditMode(true);
        setSelectedBpjs(item);
        setData({
            nik: item.nik,
            jumlah: item.jumlah.toString(),
            tanggal_berlaku: item.tanggal_berlaku.split(' ')[0],
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedBpjs(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedBpjs) {
            put(`/bpjs-ketenagakerjaan/${selectedBpjs.kode_bpjs_tk}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/bpjs-ketenagakerjaan', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Are you sure you want to delete this BPJS Ketenagakerjaan record?')) {
            router.delete(`/bpjs-ketenagakerjaan/${kode}`);
        }
    };

    const formatRupiah = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    return (
        <>
            <Head title="BPJS Ketenagakerjaan" />
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="bpjs-ketenagakerjaan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-4 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">BPJS Ketenagakerjaan</h1>
                            <p className="text-xs text-stone-600">
                                Configure monthly BPJS Ketenagakerjaan employment insurance allowances or deductions for employees
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Record
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={handleSearch}
                        searchPlaceholder="Search by employee name or NIK..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Code (Kode BPJS TK)</th>
                                    <th scope="col" className="px-4 py-2.5">Employee (Karyawan)</th>
                                    <th scope="col" className="px-4 py-2.5">BPJS TK Amount (Jumlah)</th>
                                    <th scope="col" className="px-4 py-2.5">Effective Date (Tgl Berlaku)</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bpjstenagakerjas.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                            No BPJS Ketenagakerjaan records available. Click "Add Record" to configure.
                                        </td>
                                    </tr>
                                ) : (
                                    bpjstenagakerjas.data.map((item, index) => (
                                        <tr key={item.kode_bpjs_tk} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {(bpjstenagakerjas.current_page - 1) * 10 + index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_bpjs_tk}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-stone-950">{item.nama_karyawan}</span>
                                                    <span className="text-stone-500 text-xxs font-mono">{item.nik_show}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-stone-950 font-bold">{formatRupiah(item.jumlah)}</td>
                                            <td className="px-4 py-2.5 text-stone-600">
                                                {new Date(item.tanggal_berlaku).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.kode_bpjs_tk)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Links */}
                        {bpjstenagakerjas.links && bpjstenagakerjas.links.length > 3 && (
                            <div className="flex justify-between items-center px-4 py-3 bg-stone-50 border-t border-stone-200">
                                <div className="text-xs text-stone-600">
                                    Showing {bpjstenagakerjas.data.length} of {bpjstenagakerjas.total} results
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {bpjstenagakerjas.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url || link.active}
                                            onClick={() => router.get(link.url!, { search: searchQuery }, { preserveState: true })}
                                            className={`px-3 py-1.5 rounded text-xxs font-semibold transition-all ${
                                                link.active
                                                    ? 'bg-amber-500 text-white font-bold'
                                                    : link.url
                                                    ? 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
                                                    : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editMode ? 'Edit BPJS Ketenagakerjaan' : 'Add BPJS Ketenagakerjaan'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {!editMode ? (
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">Employee (Karyawan)</label>
                                    <select
                                        required
                                        value={data.nik}
                                        onChange={e => setData('nik', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="">Select Employee...</option>
                                        {karyawans.map((emp) => (
                                            <option key={emp.nik} value={emp.nik}>
                                                {emp.nama_karyawan} ({emp.nik_show})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">Employee (Karyawan)</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={`${selectedBpjs?.nama_karyawan} (${selectedBpjs?.nik_show})`}
                                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-100 text-stone-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">BPJS Ketenagakerjaan Amount (Jumlah Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.jumlah}
                                    onChange={e => setData('jumlah', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 200000"
                                    min={0}
                                />
                                {errors.jumlah && <p className="text-red-500 text-xs mt-1">{errors.jumlah}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Effective Date (Tanggal Berlaku)</label>
                                <input
                                    type="date"
                                    required
                                    value={data.tanggal_berlaku}
                                    onChange={e => setData('tanggal_berlaku', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                />
                                {errors.tanggal_berlaku && <p className="text-red-500 text-xs mt-1">{errors.tanggal_berlaku}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
