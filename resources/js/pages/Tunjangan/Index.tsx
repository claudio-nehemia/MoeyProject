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

interface JenisTunjangan {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
    status_tunjangan: string;
}

interface Tunjangan {
    kode_tunjangan: string;
    nik: string;
    nama_karyawan: string;
    nik_show: string;
    tanggal_berlaku: string;
    [key: string]: any; // dynamic columns like jumlah_TJ01
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
    tunjangans: PaginatedData<Tunjangan>;
    jenis_tunjangan: JenisTunjangan[];
    karyawans: Karyawan[];
    filters: {
        search?: string;
    };
}

export default function Index({ tunjangans, jenis_tunjangan, karyawans, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTunjangan, setSelectedTunjangan] = useState<Tunjangan | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || "");

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nik: '',
        tanggal_berlaku: new Date().toISOString().split('T')[0],
        details: [] as { kode_jenis_tunjangan: string; jumlah: number }[],
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
        router.get('/tunjangan', { search: query }, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedTunjangan(null);
        reset();
        
        const detailsInit = jenis_tunjangan
            .filter(jt => jt.status_tunjangan === '1')
            .map(jt => ({
                kode_jenis_tunjangan: jt.kode_jenis_tunjangan,
                jumlah: 0
            }));
            
        setData({
            nik: '',
            tanggal_berlaku: new Date().toISOString().split('T')[0],
            details: detailsInit
        });
        setShowModal(true);
    };

    const openEditModal = (item: Tunjangan) => {
        setEditMode(true);
        setSelectedTunjangan(item);
        
        const detailsInit = jenis_tunjangan.map(jt => ({
            kode_jenis_tunjangan: jt.kode_jenis_tunjangan,
            jumlah: Number(item[`jumlah_${jt.kode_jenis_tunjangan}`] || 0)
        }));
        
        setData({
            nik: item.nik,
            tanggal_berlaku: item.tanggal_berlaku.split(' ')[0],
            details: detailsInit
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedTunjangan(null);
        reset();
    };

    const handleDetailChange = (kodeJT: string, value: string) => {
        const valNum = Number(value) || 0;
        const newDetails = data.details.map(d => {
            if (d.kode_jenis_tunjangan === kodeJT) {
                return { ...d, jumlah: valNum };
            }
            return d;
        });
        setData('details', newDetails);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedTunjangan) {
            put(`/tunjangan/${selectedTunjangan.kode_tunjangan}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/tunjangan', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Are you sure you want to delete this allowance record?')) {
            router.delete(`/tunjangan/${kode}`);
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
            <Head title="Tunjangan Karyawan" />
            
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
            <Sidebar isOpen={sidebarOpen} currentPage="tunjangan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-4 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">Allowance Matrix (Tunjangan Karyawan)</h1>
                            <p className="text-xs text-stone-600">
                                Configure various allowances (e.g. food, transport, bonuses) on a per-employee basis
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Allowances
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={handleSearch}
                        searchPlaceholder="Search by employee name or NIK..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600 font-sans min-w-[800px]">
                                <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5">No</th>
                                        <th scope="col" className="px-4 py-2.5">Code (Kode)</th>
                                        <th scope="col" className="px-4 py-2.5">Employee (Karyawan)</th>
                                        {jenis_tunjangan.map(jt => (
                                            <th key={jt.kode_jenis_tunjangan} scope="col" className="px-4 py-2.5">
                                                {jt.jenis_tunjangan} ({jt.kode_jenis_tunjangan})
                                            </th>
                                        ))}
                                        <th scope="col" className="px-4 py-2.5 text-center">Effective Date</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tunjangans.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5 + jenis_tunjangan.length} className="px-4 py-8 text-center text-stone-400">
                                                No allowance records configured. Click "Add Allowances" to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        tunjangans.data.map((item, index) => (
                                            <tr key={item.kode_tunjangan} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                        {(tunjangans.current_page - 1) * 10 + index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_tunjangan}</td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-stone-955">{item.nama_karyawan}</span>
                                                        <span className="text-stone-500 text-xxs font-mono">{item.nik_show}</span>
                                                    </div>
                                                </td>
                                                {jenis_tunjangan.map(jt => {
                                                    const key = `jumlah_${jt.kode_jenis_tunjangan}`;
                                                    const val = item[key] || 0;
                                                    return (
                                                        <td key={jt.kode_jenis_tunjangan} className="px-4 py-2.5 text-stone-850 font-medium">
                                                            {formatRupiah(val)}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2.5 text-center text-stone-600">
                                                    {new Date(item.tanggal_berlaku).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'short',
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
                                                            onClick={() => handleDelete(item.kode_tunjangan)}
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
                        </div>

                        {/* Pagination Links */}
                        {tunjangans.links && tunjangans.links.length > 3 && (
                            <div className="flex justify-between items-center px-4 py-3 bg-stone-50 border-t border-stone-200">
                                <div className="text-xs text-stone-600">
                                    Showing {tunjangans.data.length} of {tunjangans.total} results
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {tunjangans.links.map((link, i) => (
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
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editMode ? 'Edit Allowance Matrix' : 'Add Allowance Setup'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
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
                                        value={`${selectedTunjangan?.nama_karyawan} (${selectedTunjangan?.nik_show})`}
                                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-100 text-stone-500"
                                    />
                                </div>
                            )}

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

                            <div className="border-t border-stone-100 pt-3">
                                <h4 className="text-xs font-bold text-stone-900 mb-3">Allowances Rates (Jumlah Tunjangan)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {jenis_tunjangan.map(jt => {
                                        const detailItem = data.details.find(d => d.kode_jenis_tunjangan === jt.kode_jenis_tunjangan);
                                        const countVal = detailItem ? detailItem.jumlah : 0;
                                        return (
                                            <div key={jt.kode_jenis_tunjangan}>
                                                <label className="block text-xxs font-semibold text-stone-600 mb-1">
                                                    {jt.jenis_tunjangan} ({jt.kode_jenis_tunjangan})
                                                </label>
                                                <input
                                                    type="number"
                                                    value={countVal === 0 ? '' : countVal}
                                                    onChange={e => handleDetailChange(jt.kode_jenis_tunjangan, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                                    placeholder="0"
                                                    min={0}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.details && <p className="text-red-500 text-xs mt-1">{errors.details}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
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
