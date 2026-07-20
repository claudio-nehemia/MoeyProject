import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface JenisTunjangan {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
    status_tunjangan: string; // '0' or '1'
    created_at?: string;
    updated_at?: string;
}

interface Props {
    jenistunjangans: JenisTunjangan[];
}

export default function Index({ jenistunjangans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedJT, setSelectedJT] = useState<JenisTunjangan | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredJT, setFilteredJT] = useState<JenisTunjangan[]>(jenistunjangans);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_jenis_tunjangan: '',
        jenis_tunjangan: '',
        status_tunjangan: '1',
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

    useEffect(() => {
        const filtered = jenistunjangans.filter((item) =>
            item.kode_jenis_tunjangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.jenis_tunjangan.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredJT(filtered);
    }, [searchQuery, jenistunjangans]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedJT(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: JenisTunjangan) => {
        setEditMode(true);
        setSelectedJT(item);
        setData({
            kode_jenis_tunjangan: item.kode_jenis_tunjangan,
            jenis_tunjangan: item.jenis_tunjangan,
            status_tunjangan: item.status_tunjangan,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedJT(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedJT) {
            put(`/jenis-tunjangan/${selectedJT.kode_jenis_tunjangan}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/jenis-tunjangan', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Are you sure you want to delete this allowance type?')) {
            router.delete(`/jenis-tunjangan/${kode}`);
        }
    };

    return (
        <>
            <Head title="Jenis Tunjangan" />
            
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
            <Sidebar isOpen={sidebarOpen} currentPage="jenis-tunjangan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-4 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">Allowance Types (Jenis Tunjangan)</h1>
                            <p className="text-xs text-stone-600">
                                Manage the types of salary allowances and bonuses available
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Allowance Type
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={(query) => setSearchQuery(query)}
                        searchPlaceholder="Search by allowance code or name..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Code (Kode)</th>
                                    <th scope="col" className="px-4 py-2.5">Allowance Type (Jenis Tunjangan)</th>
                                    <th scope="col" className="px-4 py-2.5">Status</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJT.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                                            No allowance types found. Click "Add Allowance Type" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJT.map((item, index) => (
                                        <tr key={item.kode_jenis_tunjangan} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_jenis_tunjangan}</td>
                                            <td className="px-4 py-2.5 text-stone-800 font-medium">{item.jenis_tunjangan}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold ${
                                                    item.status_tunjangan === '1'
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                    {item.status_tunjangan === '1' ? 'Aktif' : 'Non-Aktif'}
                                                </span>
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
                                                        onClick={() => handleDelete(item.kode_jenis_tunjangan)}
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
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editMode ? 'Edit Allowance Type' : 'Add Allowance Type'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Code (Kode) - Max 4 characters</label>
                                <input
                                    type="text"
                                    required
                                    disabled={editMode}
                                    value={data.kode_jenis_tunjangan}
                                    onChange={e => setData('kode_jenis_tunjangan', e.target.value)}
                                    maxLength={4}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 uppercase disabled:bg-stone-100 disabled:text-stone-500"
                                    placeholder="e.g. TJ01"
                                />
                                {errors.kode_jenis_tunjangan && <p className="text-red-500 text-xs mt-1">{errors.kode_jenis_tunjangan}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Jenis Tunjangan (Name)</label>
                                <input
                                    type="text"
                                    required
                                    value={data.jenis_tunjangan}
                                    onChange={e => setData('jenis_tunjangan', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. Tunjangan Makan"
                                />
                                {errors.jenis_tunjangan && <p className="text-red-500 text-xs mt-1">{errors.jenis_tunjangan}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                                <select
                                    value={data.status_tunjangan}
                                    onChange={e => setData('status_tunjangan', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Non-Aktif</option>
                                </select>
                                {errors.status_tunjangan && <p className="text-red-500 text-xs mt-1">{errors.status_tunjangan}</p>}
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
