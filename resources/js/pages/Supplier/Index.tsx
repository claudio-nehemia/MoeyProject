import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface Supplier {
    id: number;
    name: string;
    code: string | null;
    phone: string | null;
    address: string | null;
    category: 'internal' | 'fisik' | 'eksternal';
    created_at: string;
    updated_at: string;
}

interface Props {
    suppliers: Supplier[];
}

export default function Index({ suppliers }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>(suppliers);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        code: '',
        phone: '',
        address: '',
        category: 'internal' as 'internal' | 'fisik' | 'eksternal',
    });

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const filtered = suppliers.filter((supplier) =>
            supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (supplier.code && supplier.code.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredSuppliers(filtered);
    }, [searchQuery, suppliers]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedSupplier(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (supplier: Supplier) => {
        setEditMode(true);
        setSelectedSupplier(supplier);
        setData({
            name: supplier.name,
            code: supplier.code || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            category: supplier.category,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedSupplier(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedSupplier) {
            put(`/suppliers/${selectedSupplier.id}`, {
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post('/suppliers', {
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
            router.delete(`/suppliers/${id}`);
        }
    };

    const categoryLabels: Record<string, string> = {
        internal: 'Workshop / Internal',
        fisik: 'Fisik / Kontraktor',
        eksternal: 'Vendor Eksternal',
    };

    const categoryGradients: Record<string, string> = {
        internal: 'from-emerald-400 to-emerald-600',
        fisik: 'from-blue-400 to-blue-600',
        eksternal: 'from-amber-400 to-amber-600',
    };

    return (
        <>
            <Head title="Supplier / Vendor" />
            
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="suppliers" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-stone-50 text-stone-800">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-6 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-stone-900">Master Data Supplier / Vendor</h1>
                                <span className="inline-flex px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                                    Partners
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola data mitra supplier dan vendor untuk bahan baku, jasa fisik, atau item eksternal.
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                            </svg>
                            Tambah Supplier
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <SearchFilter
                            onSearch={(query) => setSearchQuery(query)}
                            searchPlaceholder="Cari supplier berdasarkan nama atau kode..."
                        />
                    </div>

                    {/* Table */}
                    <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600">
                                <thead className="text-[10px] text-stone-500 font-semibold bg-stone-50 border-b border-stone-200 uppercase tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">No</th>
                                        <th scope="col" className="px-4 py-3">Nama Supplier</th>
                                        <th scope="col" className="px-4 py-3">Kode</th>
                                        <th scope="col" className="px-4 py-3">Kategori</th>
                                        <th scope="col" className="px-4 py-3">No. Telepon</th>
                                        <th scope="col" className="px-4 py-3">Alamat</th>
                                        <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredSuppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-stone-400 italic">
                                                Tidak ada data supplier ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSuppliers.map((supplier, index) => (
                                            <tr key={supplier.id} className="hover:bg-amber-50/20 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-stone-400">{index + 1}</td>
                                                <td className="px-4 py-3 font-bold text-stone-900">{supplier.name}</td>
                                                <td className="px-4 py-3 font-mono text-stone-600">{supplier.code || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${categoryGradients[supplier.category]}`}>
                                                        {categoryLabels[supplier.category]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-stone-700">{supplier.phone || '—'}</td>
                                                <td className="px-4 py-3 text-stone-500 max-w-xs truncate" title={supplier.address || ''}>
                                                    {supplier.address || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(supplier)}
                                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(supplier.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus"
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
            </div>

            {/* Modal Dialog */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-fadeInUp">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-150 bg-stone-50">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                                {editMode ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 text-lg font-bold">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Nama Supplier / Vendor *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                                    placeholder="Masukkan nama supplier"
                                />
                                {errors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Kode Supplier</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                                        placeholder="SUP001"
                                    />
                                    {errors.code && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.code}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Kategori *</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value as any)}
                                        className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="internal">Workshop / Internal</option>
                                        <option value="fisik">Fisik / Kontraktor</option>
                                        <option value="eksternal">Vendor Eksternal</option>
                                    </select>
                                    {errors.category && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.category}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">No. Telepon</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                                    placeholder="08123456789"
                                />
                                {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Alamat</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 h-20 resize-none"
                                    placeholder="Masukkan alamat supplier"
                                />
                                {errors.address && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.address}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition duration-150"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-sm hover:shadow transition duration-150 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
