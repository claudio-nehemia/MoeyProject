import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Penyesuaiangaji {
    kode_penyesuaian_gaji: string;
    bulan: number;
    tahun: number;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    penyesuaiangajis: Penyesuaiangaji[];
    tahun: number;
    list_bulan: { [key: number]: string };
}

export default function Index({ penyesuaiangajis, tahun, list_bulan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState<Penyesuaiangaji | null>(null);
    const [mounted, setMounted] = useState(false);
    const [selectedYear, setSelectedYear] = useState(tahun.toString());

    const { data, setData, post, put, processing, errors, reset } = useForm({
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
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

    const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const yr = e.target.value;
        setSelectedYear(yr);
        router.get('/penyesuaian-gaji', { tahun: yr }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedAdjustment(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: Penyesuaiangaji) => {
        setEditMode(true);
        setSelectedAdjustment(item);
        setData({
            bulan: item.bulan,
            tahun: item.tahun,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedAdjustment(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedAdjustment) {
            put(`/penyesuaian-gaji/${selectedAdjustment.kode_penyesuaian_gaji}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/penyesuaian-gaji', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Are you sure you want to delete this salary adjustment period? All associated employee adjustments will be deleted.')) {
            router.delete(`/penyesuaian-gaji/${kode}`);
        }
    };

    // Generate years range for filter
    const currentYear = new Date().getFullYear();
    const yearsRange = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <>
            <Head title="Penyesuaian Gaji" />
            
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
            <Sidebar isOpen={sidebarOpen} currentPage="penyesuaian-gaji" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    {/* Header */}
                    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">Salary Adjustments (Penyesuaian Gaji)</h1>
                            <p className="text-xs text-stone-600">
                                Configure temporary salary additions and deductions on a monthly basis
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedYear}
                                onChange={handleYearFilterChange}
                                className="px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                            >
                                {yearsRange.map(yr => (
                                    <option key={yr} value={yr}>Tahun {yr}</option>
                                ))}
                            </select>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create Period
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Code (Kode Periode)</th>
                                    <th scope="col" className="px-4 py-2.5">Bulan</th>
                                    <th scope="col" className="px-4 py-2.5">Tahun</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Adjustments List</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {penyesuaiangajis.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                            No adjustments periods registered for Year {selectedYear}.
                                        </td>
                                    </tr>
                                ) : (
                                    penyesuaiangajis.map((item, index) => (
                                        <tr key={item.kode_penyesuaian_gaji} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_penyesuaian_gaji}</td>
                                            <td className="px-4 py-2.5 font-medium text-stone-850">{list_bulan[item.bulan]}</td>
                                            <td className="px-4 py-2.5 text-stone-600">{item.tahun}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Link
                                                    href={`/penyesuaian-gaji/set-karyawan/${item.kode_penyesuaian_gaji}`}
                                                    className="inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xxs font-bold rounded hover:bg-amber-100 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    Configure Employees
                                                </Link>
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
                                                        onClick={() => handleDelete(item.kode_penyesuaian_gaji)}
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
                            <h3 className="font-bold text-sm">{editMode ? 'Edit Adjustment Period' : 'Add Adjustment Period'}</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Month (Bulan)</label>
                                <select
                                    required
                                    value={data.bulan}
                                    onChange={e => setData('bulan', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    {Object.entries(list_bulan).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                                {errors.bulan && <p className="text-red-500 text-xs mt-1">{errors.bulan}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Year (Tahun)</label>
                                <select
                                    required
                                    value={data.tahun}
                                    onChange={e => setData('tahun', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    {yearsRange.map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                                {errors.tahun && <p className="text-red-500 text-xs mt-1">{errors.tahun}</p>}
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
