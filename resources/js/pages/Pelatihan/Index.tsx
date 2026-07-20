import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
    Award,
    Calendar,
    Edit3,
    Trash2,
    PlusCircle,
    Search,
    Users,
    X,
    Clock,
    Briefcase,
    ChevronRight,
    RotateCcw
} from 'lucide-react';

interface Pelatihan {
    kode_pelatihan: string;
    nama_pelatihan: string;
    penyelenggara: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    deskripsi: string | null;
    created_at?: string;
    updated_at?: string;
}

interface Karyawan {
    nik: string;
    nik_show: string;
    nama_karyawan: string;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    pelatihans: Paginator<Pelatihan>;
    karyawans: Karyawan[];
    filters: {
        search?: string;
    };
}

export default function Index({ pelatihans, karyawans, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPelatihan, setSelectedPelatihan] = useState<Pelatihan | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [mounted, setMounted] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nama_pelatihan: '',
        penyelenggara: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        deskripsi: '',
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

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedPelatihan(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (pelatihan: Pelatihan) => {
        setEditMode(true);
        setSelectedPelatihan(pelatihan);
        setData({
            nama_pelatihan: pelatihan.nama_pelatihan,
            penyelenggara: pelatihan.penyelenggara,
            tanggal_mulai: pelatihan.tanggal_mulai,
            tanggal_selesai: pelatihan.tanggal_selesai,
            deskripsi: pelatihan.deskripsi || '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setSelectedPelatihan(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedPelatihan) {
            put(`/pelatihan/${selectedPelatihan.kode_pelatihan}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/pelatihan', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus program pelatihan ini?')) {
            router.delete(`/pelatihan/${kode}`);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/pelatihan', { search: searchQuery }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearchQuery("");
        router.get('/pelatihan', { search: "" }, { preserveState: true });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head title="Manajemen Pelatihan Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                
                .glass-effect {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                
                .card-hover-effect {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px -6px rgba(245, 158, 11, 0.12);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pelatihan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/5 to-stone-100">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    🎓 Manajemen Pelatihan Karyawan
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    Upskilling
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola program pelatihan, penugasan sertifikasi, dan pantau kelulusan kompetensi karyawan.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                                <PlusCircle size={14} />
                                Tambah Pelatihan Baru
                            </button>
                        </div>
                    </div>

                    {/* Search Panel */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4">
                        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[280px]">
                                <Search className="absolute left-3.5 top-3 text-stone-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Cari pelatihan berdasarkan nama program atau penyelenggara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 focus:outline-none bg-stone-55"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                                >
                                    Cari
                                </button>
                                {(filters.search || searchQuery) && (
                                    <button
                                        type="button"
                                        onClick={handleResetSearch}
                                        className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                                    >
                                        <RotateCcw size={12} />
                                        Reset
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Data List */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600">
                                <thead className="text-[10px] text-stone-500 font-bold uppercase tracking-wider bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-5 py-4">Kode</th>
                                        <th scope="col" className="px-5 py-4">Nama Program</th>
                                        <th scope="col" className="px-5 py-4">Penyelenggara</th>
                                        <th scope="col" className="px-5 py-4">Periode</th>
                                        <th scope="col" className="px-5 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {pelatihans.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Award size={36} className="text-stone-300 animate-pulse" />
                                                    <p className="font-semibold text-sm">Belum ada program pelatihan.</p>
                                                    <p className="text-xs text-stone-400">Klik "Tambah Pelatihan Baru" untuk mendaftarkan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pelatihans.data.map((pelatihan) => (
                                            <tr key={pelatihan.kode_pelatihan} className="hover:bg-amber-50/10 transition-colors">
                                                <td className="px-5 py-4 font-mono font-bold text-stone-850">
                                                    {pelatihan.kode_pelatihan}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-extrabold text-stone-900 text-sm">
                                                        {pelatihan.nama_pelatihan}
                                                    </div>
                                                    {pelatihan.deskripsi && (
                                                        <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                                                            {pelatihan.deskripsi}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-stone-700">
                                                    {pelatihan.penyelenggara}
                                                </td>
                                                <td className="px-5 py-4 text-stone-600">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Calendar size={12} className="text-amber-500" />
                                                        <span>{formatDate(pelatihan.tanggal_mulai)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-stone-400 ml-4.5">
                                                        s/d {formatDate(pelatihan.tanggal_selesai)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={`/pelatihan/${pelatihan.kode_pelatihan}/peserta`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-extrabold rounded-lg shadow-sm transition-colors"
                                                        >
                                                            <Users size={11} />
                                                            Kelola Peserta
                                                        </Link>
                                                        <button
                                                            onClick={() => openEditModal(pelatihan)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pelatihan.kode_pelatihan)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={14} />
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
                        {pelatihans.total > pelatihans.per_page && (
                            <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-stone-150">
                                <div className="flex justify-between flex-1 sm:hidden">
                                    {pelatihans.prev_page_url ? (
                                        <Link
                                            href={pelatihans.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                        >
                                            Sebelumnya
                                        </Link>
                                    ) : (
                                        <span className="relative inline-flex items-center px-4 py-2 text-xs font-bold text-stone-300 bg-white border border-stone-200 rounded-lg cursor-not-allowed">
                                            Sebelumnya
                                        </span>
                                    )}
                                    {pelatihans.next_page_url ? (
                                        <Link
                                            href={pelatihans.next_page_url}
                                            className="relative inline-flex items-center px-4 py-2 ml-3 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                        >
                                            Selanjutnya
                                        </Link>
                                    ) : (
                                        <span className="relative inline-flex items-center px-4 py-2 ml-3 text-xs font-bold text-stone-300 bg-white border border-stone-200 rounded-lg cursor-not-allowed">
                                            Selanjutnya
                                        </span>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">
                                            Menampilkan <span className="font-bold text-stone-800">{pelatihans.from || 0}</span> sampai{' '}
                                            <span className="font-bold text-stone-800">{pelatihans.to || 0}</span> dari{' '}
                                            <span className="font-bold text-stone-800">{pelatihans.total}</span> data
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                                            {pelatihans.links.map((link, idx) => {
                                                let label = link.label;
                                                if (label.includes('Previous')) {
                                                    label = '‹';
                                                } else if (label.includes('Next')) {
                                                    label = '›';
                                                }

                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="relative inline-flex items-center px-3 py-1.5 border border-stone-200 bg-stone-50 text-stone-400 text-xs font-semibold cursor-not-allowed first:rounded-l-lg last:rounded-r-lg"
                                                            dangerouslySetInnerHTML={{ __html: label }}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-bold transition-colors first:rounded-l-lg last:rounded-r-lg ${
                                                            link.active
                                                                ? 'z-10 bg-amber-500 border-amber-500 text-white'
                                                                : 'bg-white border-stone-200 text-stone-600 hover:bg-amber-50 hover:text-amber-600'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: label }}
                                                    />
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Create & Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <div className="p-6 relative">
                    <button
                        onClick={closeModal}
                        className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-850 text-base">
                                {editMode ? 'Edit Program Pelatihan' : 'Tambah Program Pelatihan Baru'}
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Isi formulir berikut dengan lengkap dan benar.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Nama Pelatihan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nama_pelatihan}
                                onChange={(e) => setData('nama_pelatihan', e.target.value)}
                                placeholder="Contoh: Pelatihan Flutter Intermediate"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                required
                            />
                            {errors.nama_pelatihan && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.nama_pelatihan}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Penyelenggara <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.penyelenggara}
                                onChange={(e) => setData('penyelenggara', e.target.value)}
                                placeholder="Contoh: Dicoding Academy / Internal HR"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                required
                            />
                            {errors.penyelenggara && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.penyelenggara}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                    Tanggal Mulai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_mulai}
                                    onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                    required
                                />
                                {errors.tanggal_mulai && (
                                    <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.tanggal_mulai}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                    Tanggal Selesai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal_selesai}
                                    onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                    required
                                />
                                {errors.tanggal_selesai && (
                                    <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.tanggal_selesai}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Deskripsi Pelatihan
                            </label>
                            <textarea
                                value={data.deskripsi}
                                onChange={(e) => setData('deskripsi', e.target.value)}
                                placeholder="Tulis deskripsi detail materi pelatihan..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none resize-none"
                            />
                            {errors.deskripsi && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.deskripsi}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-colors shadow-md"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Program'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
