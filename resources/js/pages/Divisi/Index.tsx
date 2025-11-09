import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DivisiModal from '@/components/DivisiModal';
import SearchFilter from '@/components/SearchFilter';

interface Divisi {
    id: number;
    nama_divisi: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    divisis: Divisi[];
}

export default function Index({ divisis }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedDivisi, setSelectedDivisi] = useState<Divisi | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredDivisis, setFilteredDivisis] = useState<Divisi[]>(divisis);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_divisi: '',
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const filtered = divisis.filter((divisi) =>
            divisi.nama_divisi.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDivisis(filtered);
    }, [searchQuery, divisis]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedDivisi(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (divisi: Divisi) => {
        setEditMode(true);
        setSelectedDivisi(divisi);
        setData('nama_divisi', divisi.nama_divisi);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedDivisi(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedDivisi) {
            put(`/divisi/${selectedDivisi.id}`, {
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post('/divisi', {
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this divisi?')) {
            router.delete(`/divisi/${id}`);
        }
    };

    return (
        <>
            <Head title="Divisi" />
            
            {/* Add custom animations and styles */}
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

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.5s ease-out forwards;
                }

                .glass-effect {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .table-row-hover {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .table-row-hover:hover {
                    transform: translateX(4px);
                    background: linear-gradient(to right, #fffbeb, white);
                }
            `}</style>
            
            {/* Navbar */}
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} currentPage="divisi" />

            {/* Main Content */}
            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className={`flex items-center justify-between mb-4 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h1 className="text-2xl font-bold text-stone-900">Divisi Management</h1>
                            </div>
                            <p className="text-xs text-stone-600">
                                Manage your organization divisions and departments
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                            </svg>
                            Create
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <SearchFilter
                        onSearch={(query) => setSearchQuery(query)}
                        searchPlaceholder="Search divisi by name..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Nama Divisi</th>
                                    <th scope="col" className="px-4 py-2.5">Created At</th>
                                    <th scope="col" className="px-4 py-2.5 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDivisis.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-12 h-12 text-stone-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                                <p className="text-stone-600 font-medium text-sm">{searchQuery ? 'No results found' : 'No divisi data available'}</p>
                                                <p className="text-stone-400 text-xs mt-1">{searchQuery ? 'Try adjusting your search' : 'Click "Create" to get started'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDivisis.map((divisi, index) => (
                                        <tr key={divisi.id} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-stone-900 text-xs">{divisi.nama_divisi}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-stone-600 text-xs">
                                                {new Date(divisi.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(divisi)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(divisi.id)}
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
            <DivisiModal
                show={showModal}
                editMode={editMode}
                processing={processing}
                data={data}
                errors={errors}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDataChange={setData}
            />
        </>
    );
}
