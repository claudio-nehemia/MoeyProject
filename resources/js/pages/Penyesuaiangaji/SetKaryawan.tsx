import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface Karyawan {
    nik: string;
    nik_show: string;
    nama_karyawan: string;
}

interface DetailAdjustment {
    id: number;
    nik: string;
    nama_karyawan: string;
    nik_show: string;
    penambah: number;
    pengurang: number;
    keterangan: string;
    kode_penyesuaian_gaji: string;
}

interface Penyesuaiangaji {
    kode_penyesuaian_gaji: string;
    bulan: number;
    tahun: number;
}

interface Props {
    penyesuaiangaji: Penyesuaiangaji;
    detailpenyesuaian: DetailAdjustment[];
    karyawans: Karyawan[];
}

export default function SetKaryawan({ penyesuaiangaji, detailpenyesuaian, karyawans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<DetailAdjustment | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredDetails, setFilteredDetails] = useState<DetailAdjustment[]>(detailpenyesuaian);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nik: '',
        penambah: '0',
        pengurang: '0',
        keterangan: '',
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
        const filtered = detailpenyesuaian.filter(item =>
            item.nama_karyawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.nik_show.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keterangan.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDetails(filtered);
    }, [searchQuery, detailpenyesuaian]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedDetail(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (item: DetailAdjustment) => {
        setEditMode(true);
        setSelectedDetail(item);
        setData({
            nik: item.nik,
            penambah: item.penambah.toString(),
            pengurang: item.pengurang.toString(),
            keterangan: item.keterangan,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedDetail(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const urlKode = penyesuaiangaji.kode_penyesuaian_gaji;
        if (editMode && selectedDetail) {
            put(`/penyesuaian-gaji/update-karyawan/${urlKode}/${selectedDetail.nik}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post(`/penyesuaian-gaji/store-karyawan/${urlKode}`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (nik: string) => {
        if (confirm('Are you sure you want to remove this employee adjustment?')) {
            const urlKode = penyesuaiangaji.kode_penyesuaian_gaji;
            router.delete(`/penyesuaian-gaji/destroy-karyawan/${urlKode}/${nik}`);
        }
    };

    const formatRupiah = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    const list_bulan_id: { [key: number]: string } = {
        1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
        5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
        9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
    };

    return (
        <>
            <Head title={`Adjustments ${penyesuaiangaji.kode_penyesuaian_gaji}`} />
            
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
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/penyesuaian-gaji" className="text-amber-600 hover:text-amber-700 font-medium text-xs flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </Link>
                            </div>
                            <h1 className="text-2xl font-bold text-stone-900">
                                Set Adjustments: {list_bulan_id[penyesuaiangaji.bulan]} {penyesuaiangaji.tahun}
                            </h1>
                            <p className="text-xs text-stone-600">
                                Period Code: <span className="font-mono font-semibold">{penyesuaiangaji.kode_penyesuaian_gaji}</span>
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Employee
                        </button>
                    </div>

                    {/* Search Filter */}
                    <SearchFilter
                        onSearch={(query) => setSearchQuery(query)}
                        searchPlaceholder="Search adjustments by employee name, NIK, or description..."
                    />

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Employee (Karyawan)</th>
                                    <th scope="col" className="px-4 py-2.5 text-green-700">Additions (Penambah)</th>
                                    <th scope="col" className="px-4 py-2.5 text-red-700">Deductions (Pengurang)</th>
                                    <th scope="col" className="px-4 py-2.5">Description (Keterangan)</th>
                                    <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDetails.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                            No employee adjustments configured for this period. Click "Add Employee" to set adjustments.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDetails.map((item, index) => (
                                        <tr key={item.nik} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-stone-955">{item.nama_karyawan}</span>
                                                    <span className="text-stone-500 text-xxs font-mono">{item.nik_show}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-bold text-green-700">+{formatRupiah(item.penambah)}</td>
                                            <td className="px-4 py-2.5 font-bold text-red-700">-{formatRupiah(item.pengurang)}</td>
                                            <td className="px-4 py-2.5 text-stone-600 italic font-medium">{item.keterangan}</td>
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
                                                        onClick={() => handleDelete(item.nik)}
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
                            <h3 className="font-bold text-sm">{editMode ? 'Edit Adjustment' : 'Add Employee Adjustment'}</h3>
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
                                        value={`${selectedDetail?.nama_karyawan} (${selectedDetail?.nik_show})`}
                                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-100 text-stone-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Addition (Penambah Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.penambah}
                                    onChange={e => setData('penambah', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 500000"
                                    min={0}
                                />
                                {errors.penambah && <p className="text-red-500 text-xs mt-1">{errors.penambah}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Deduction (Pengurang Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.pengurang}
                                    onChange={e => setData('pengurang', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 100000"
                                    min={0}
                                />
                                {errors.pengurang && <p className="text-red-500 text-xs mt-1">{errors.pengurang}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Keterangan (Description)</label>
                                <input
                                    type="text"
                                    required
                                    value={data.keterangan}
                                    onChange={e => setData('keterangan', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. Bonus project atau potongan kasbon"
                                    maxLength={255}
                                />
                                {errors.keterangan && <p className="text-red-500 text-xs mt-1">{errors.keterangan}</p>}
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
