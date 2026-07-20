import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface Denda {
    id: number;
    dari: number;
    sampai: number;
    denda: number;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    dendas: Denda[];
}

export default function Index({ dendas }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedDenda, setSelectedDenda] = useState<Denda | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredDendas, setFilteredDendas] = useState<Denda[]>(dendas);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        dari: '',
        sampai: '',
        denda: '',
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
        const filtered = dendas.filter((item) =>
            item.dari.toString().includes(searchQuery) ||
            item.sampai.toString().includes(searchQuery) ||
            item.denda.toString().includes(searchQuery)
        );
        setFilteredDendas(filtered);
    }, [searchQuery, dendas]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedDenda(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: Denda) => {
        setEditMode(true);
        setSelectedDenda(item);
        setData({
            dari: item.dari.toString(),
            sampai: item.sampai.toString(),
            denda: item.denda.toString(),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedDenda(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedDenda) {
            put(`/denda/${selectedDenda.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/denda', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this fine rule?')) {
            router.delete(`/denda/${id}`);
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
            <Head title="Denda Keterlambatan" />
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                .glass-effect {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="denda" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-4 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">Fine Rules (Denda Keterlambatan)</h1>
                            <p className="text-xs text-stone-600">
                                Configure late arrival fine calculation rules based on minutes range
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Rule
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={(query) => setSearchQuery(query)}
                        searchPlaceholder="Search by minutes or fine amount..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Min Late (Dari Menit)</th>
                                    <th scope="col" className="px-4 py-2.5">Max Late (Sampai Menit)</th>
                                    <th scope="col" className="px-4 py-2.5">Fine Amount (Denda)</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDendas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                                            No fine rules configured. Click "Add Rule" to configure.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDendas.map((item, index) => (
                                        <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-stone-900">{item.dari} Menit</td>
                                            <td className="px-4 py-2.5 font-medium text-stone-900">{item.sampai} Menit</td>
                                            <td className="px-4 py-2.5 text-amber-600 font-semibold">{formatRupiah(item.denda)}</td>
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
                                                        onClick={() => handleDelete(item.id)}
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
                            <h3 className="font-bold text-sm">{editMode ? 'Edit Fine Rule' : 'Add New Fine Rule'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Dari (Menit Keterlambatan)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.dari}
                                    onChange={e => setData('dari', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 5"
                                />
                                {errors.dari && <p className="text-red-500 text-xs mt-1">{errors.dari}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Sampai (Menit Keterlambatan)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.sampai}
                                    onChange={e => setData('sampai', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 15"
                                />
                                {errors.sampai && <p className="text-red-500 text-xs mt-1">{errors.sampai}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Jumlah Denda (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.denda}
                                    onChange={e => setData('denda', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 5000"
                                />
                                {errors.denda && <p className="text-red-500 text-xs mt-1">{errors.denda}</p>}
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
