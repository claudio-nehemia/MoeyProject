import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';
import Modal from '@/components/Modal';
import {
    User,
    Users,
    Lock,
    Unlock,
    Edit3,
    Trash2,
    Briefcase,
    Calendar,
    Building,
    Phone,
    Search,
    PlusCircle,
    X,
    Camera,
    CheckCircle,
    AlertCircle,
    UserCheck,
    MapPin,
    ShieldAlert
} from 'lucide-react';

interface Facerecognition {
    id: number;
    nik: string;
    wajah: string;
}

interface Karyawan {
    nik: string;
    user_id: number | null;
    nama_karyawan: string;
    no_ktp: string;
    no_hp: string | null;
    email: string | null;
    jenis_kelamin: string;
    kode_cabang: string;
    kode_dept: string;
    kode_jabatan: string;
    tanggal_masuk: string;
    status_karyawan: string;
    lock_location: string;
    lock_jam_kerja: string;
    status_aktif_karyawan: string;
    kode_jadwal?: string | null;
    user?: {
        name: string;
        email: string;
    } | null;
    cabang?: {
        nama_cabang: string;
    } | null;
    departemen?: {
        nama_dept: string;
    } | null;
    jabatan?: {
        nama_jabatan: string;
    } | null;
    jamkerja?: {
        nama_jam_kerja: string;
    } | null;
    facerecognition?: Facerecognition[];
}

interface UserDropdown {
    id: number;
    name: string;
    email: string;
}

interface CabangDropdown {
    kode_cabang: string;
    nama_cabang: string;
}

interface DeptDropdown {
    kode_dept: string;
    nama_dept: string;
}

interface JabatanDropdown {
    kode_jabatan: string;
    nama_jabatan: string;
}

interface JamkerjaDropdown {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
}

interface Props {
    karyawans: Karyawan[];
    users: UserDropdown[];
    cabangs: CabangDropdown[];
    departemens: DeptDropdown[];
    jabatans: JabatanDropdown[];
    jamkerjas: JamkerjaDropdown[];
}

export default function Index({ karyawans, users, cabangs, departemens, jabatans, jamkerjas }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredKaryawans, setFilteredKaryawans] = useState<Karyawan[]>(karyawans);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    // Form for Employee Data
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nik: '',
        user_id: '' as string | number,
        nama_karyawan: '',
        no_ktp: '',
        no_hp: '',
        email: '',
        jenis_kelamin: 'L',
        kode_cabang: '',
        kode_dept: '',
        kode_jabatan: '',
        tanggal_masuk: new Date().toISOString().split('T')[0],
        status_karyawan: 'K001',
        lock_location: '1',
        lock_jam_kerja: '1',
        status_aktif_karyawan: '1',
        kode_jadwal: '',
    });

    // Form for Face Photo Upload
    const faceForm = useForm({
        image: null as File | null,
    });

    useEffect(() => {
        const filtered = karyawans.filter((kar) =>
            kar.nama_karyawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            kar.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (kar.email && kar.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredKaryawans(filtered);
        setCurrentPage(1);
    }, [searchQuery, karyawans]);

    const totalPages = Math.ceil(filteredKaryawans.length / perPage);
    const paginatedKaryawans = filteredKaryawans.slice((currentPage - 1) * perPage, currentPage * perPage);

    useEffect(() => {
        if (selectedKaryawan) {
            const updated = karyawans.find(k => k.nik === selectedKaryawan.nik);
            if (updated) {
                setSelectedKaryawan(updated);
            }
        }
    }, [karyawans]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedKaryawan(null);
        reset();
        if (cabangs.length > 0) setData('kode_cabang', cabangs[0].kode_cabang);
        if (departemens.length > 0) setData('kode_dept', departemens[0].kode_dept);
        if (jabatans.length > 0) setData('kode_jabatan', jabatans[0].kode_jabatan);
        setShowModal(true);
    };

    const openEditModal = (kar: Karyawan) => {
        setEditMode(true);
        setSelectedKaryawan(kar);
        setData({
            nik: kar.nik,
            user_id: kar.user_id || '',
            nama_karyawan: kar.nama_karyawan,
            no_ktp: kar.no_ktp,
            no_hp: kar.no_hp || '',
            email: kar.email || '',
            jenis_kelamin: kar.jenis_kelamin,
            kode_cabang: kar.kode_cabang,
            kode_dept: kar.kode_dept,
            kode_jabatan: kar.kode_jabatan,
            tanggal_masuk: kar.tanggal_masuk,
            status_karyawan: kar.status_karyawan,
            lock_location: kar.lock_location,
            lock_jam_kerja: kar.lock_jam_kerja,
            status_aktif_karyawan: kar.status_aktif_karyawan,
            kode_jadwal: kar.kode_jadwal || '',
        });
        setShowModal(true);
    };

    const openFaceModal = (kar: Karyawan) => {
        setSelectedKaryawan(kar);
        faceForm.reset();
        setShowFaceModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditMode(false);
        setSelectedKaryawan(null);
    };

    const handleKaryawanSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedKaryawan) {
            put(`/karyawan/${selectedKaryawan.nik}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/karyawan', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const toggleLockLocation = (kar: Karyawan) => {
        router.put(`/karyawan/${kar.nik}`, {
            ...kar,
            lock_location: kar.lock_location === '1' ? '0' : '1',
            kode_jadwal: kar.kode_jadwal || '',
        }, { preserveScroll: true });
    };

    const toggleLockJamKerja = (kar: Karyawan) => {
        router.put(`/karyawan/${kar.nik}`, {
            ...kar,
            lock_jam_kerja: kar.lock_jam_kerja === '1' ? '0' : '1',
            kode_jadwal: kar.kode_jadwal || '',
        }, { preserveScroll: true });
    };

    const handleFaceUpload: FormEventHandler = (e) => {
        e.preventDefault();
        if (!faceForm.data.image || !selectedKaryawan) return;

        faceForm.post(`/karyawan/${selectedKaryawan.nik}/upload-face`, {
            onSuccess: () => {
                faceForm.reset();
                alert('Foto wajah master berhasil didaftarkan!');
            }
        });
    };

    const handleFaceDelete = (id: number) => {
        if (!selectedKaryawan) return;
        if (confirm('Apakah Anda yakin ingin menghapus foto wajah ini?')) {
            router.delete(`/karyawan/${selectedKaryawan.nik}/delete-face/${id}`, {
                onSuccess: () => {
                    alert('Foto wajah master berhasil dihapus.');
                }
            });
        }
    };

    const handleDelete = (nik: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
            router.delete(`/karyawan/${nik}`);
        }
    };

    const getMasaKerja = (tanggalMasuk: string) => {
        const start = new Date(tanggalMasuk);
        const end = new Date();
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} Th ${months} Bln`;
    };

    return (
        <>
            <Head title="Manajemen Data Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .card-hover-effect {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover-effect:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.06);
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="karyawan" onClose={() => setSidebarOpen(false)} />
            
            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    👥 Manajemen Data Karyawan
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    Staf & Kepegawaian
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola biodata karyawan, status akun login, verifikasi foto wajah master (Face Recognition), dan batasan operasional absensi.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                                <PlusCircle size={14} />
                                Tambah Karyawan Baru
                            </button>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4.5">
                        <div className="flex gap-3 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari karyawan berdasarkan NIK, nama lengkap, atau email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Card Lists */}
                    {filteredKaryawans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
                            <Users className="mx-auto mb-3 text-stone-350" size={36} />
                            <p className="font-semibold text-sm">Data karyawan tidak ditemukan.</p>
                            <p className="text-xs text-stone-400 mt-1">Silakan sesuaikan filter pencarian atau daftarkan karyawan baru.</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {paginatedKaryawans.map((kar) => (
                                <div
                                    key={kar.nik}
                                    className="bg-white rounded-2xl border border-stone-200/70 p-4.5 shadow-sm card-hover-effect transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                        
                                        {/* Avatar & Core Identity (Col 1) */}
                                        <div className="flex items-center gap-4 lg:w-1/3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm flex-shrink-0">
                                                {kar.nama_karyawan.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-extrabold text-stone-850 text-xs sm:text-sm truncate">
                                                        {kar.nama_karyawan}
                                                    </h3>
                                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 text-[9px] font-extrabold border border-stone-200 font-mono">
                                                        {kar.nik}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-400 truncate mb-1.5">{kar.email || 'Belum ada email'}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-150">
                                                        {kar.jabatan?.nama_jabatan || '-'}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold border border-purple-150">
                                                        {kar.departemen?.nama_dept || '-'}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-150">
                                                        {kar.cabang?.nama_cabang || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Work details (Col 2) */}
                                        <div className="flex-1 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                
                                                {/* Active Status & Masa Kerja */}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1">Keaktifan</span>
                                                    <div className="flex items-center gap-2">
                                                        {kar.status_aktif_karyawan === '1' ? (
                                                            <span className="inline-flex px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150">
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex px-2 py-0.5 rounded bg-stone-100 text-stone-400 text-[10px] font-bold border border-stone-200">
                                                                Nonaktif
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-stone-500 font-bold" title="Masa Kerja">
                                                            ⏱️ {getMasaKerja(kar.tanggal_masuk)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Lock Settings GPS & Hours */}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1">Gembok Akses Absen</span>
                                                    <div className="flex items-center gap-3">
                                                        
                                                        {/* Lock GPS Location */}
                                                        <button
                                                            onClick={() => toggleLockLocation(kar)}
                                                            className="flex items-center gap-1 text-[10px] text-stone-600 hover:text-amber-600 transition-colors"
                                                            title="Klik untuk ubah status Lock GPS"
                                                        >
                                                            {kar.lock_location === '1' ? (
                                                                <Lock size={12} className="text-emerald-600" />
                                                            ) : (
                                                                <Unlock size={12} className="text-rose-500" />
                                                            )}
                                                            <span>GPS</span>
                                                        </button>

                                                        {/* Lock Jam Kerja */}
                                                        <button
                                                            onClick={() => toggleLockJamKerja(kar)}
                                                            className="flex items-center gap-1 text-[10px] text-stone-600 hover:text-amber-600 transition-colors"
                                                            title="Klik untuk ubah status Lock Jam Kerja"
                                                        >
                                                            {kar.lock_jam_kerja === '1' ? (
                                                                <Lock size={12} className="text-emerald-600" />
                                                            ) : (
                                                                <Unlock size={12} className="text-rose-500" />
                                                            )}
                                                            <span>Jam Kerja</span>
                                                        </button>

                                                    </div>
                                                </div>

                                                {/* Face Recognition status */}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-1">Face Recognition</span>
                                                    <div>
                                                        {kar.facerecognition && kar.facerecognition.length > 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150">
                                                                Registered ({kar.facerecognition.length} Wajah)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-150">
                                                                Belum Terdaftar
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* Actions (Col 3) */}
                                        <div className="flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0 flex-shrink-0">
                                            
                                            <button
                                                onClick={() => openFaceModal(kar)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg text-[10px] border border-emerald-150 transition-all"
                                            >
                                                <Camera size={11} />
                                                Kelola Wajah
                                            </button>
                                            
                                            <button
                                                onClick={() => openEditModal(kar)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all"
                                            >
                                                <Edit3 size={11} />
                                                Ubah
                                            </button>

                                            <button
                                                onClick={() => handleDelete(kar.nik)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition-all"
                                            >
                                                <Trash2 size={11} />
                                                Hapus
                                            </button>

                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm gap-4">
                            <p className="text-[11px] text-stone-500 font-bold">
                                Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, filteredKaryawans.length)} dari {filteredKaryawans.length} staf terdaftar
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-[10px] font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    « Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        typeof p === 'string' ? (
                                            <span key={`dots-${idx}`} className="px-2 text-xs text-stone-400">...</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                                                    currentPage === p
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )
                                }
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-[10px] font-bold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Next »
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Create/Edit */}
            <Modal
                show={showModal}
                onClose={closeModal}
                maxWidth="lg"
            >
                <div className="p-6 relative">
                    {/* Close Trigger */}
                    <button
                        onClick={closeModal}
                        className="absolute right-4 top-4 w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                    >
                        <X size={16} />
                    </button>

                    <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        👥 {editMode ? 'Ubah Informasi Biodata Staf' : 'Daftarkan Staf Baru'}
                    </h3>
                    
                    <form onSubmit={handleKaryawanSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">NIK (Nomor Induk Karyawan)</label>
                                <input
                                    type="text"
                                    maxLength={9}
                                    disabled={editMode}
                                    value={data.nik}
                                    onChange={e => setData('nik', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-50 disabled:text-stone-400"
                                    required
                                    placeholder="Masukkan 9 digit NIK..."
                                />
                                {errors.nik && <span className="text-red-500 text-xs mt-1 block">{errors.nik}</span>}
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">No KTP (16 Digit)</label>
                                <input
                                    type="text"
                                    maxLength={16}
                                    value={data.no_ktp}
                                    onChange={e => setData('no_ktp', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    required
                                    placeholder="Masukkan 16 digit NIK KTP..."
                                />
                                {errors.no_ktp && <span className="text-red-500 text-xs mt-1 block">{errors.no_ktp}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Nama Lengkap Karyawan</label>
                            <input
                                type="text"
                                value={data.nama_karyawan}
                                onChange={e => setData('nama_karyawan', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Tuliskan nama lengkap..."
                            />
                            {errors.nama_karyawan && <span className="text-red-500 text-xs mt-1 block">{errors.nama_karyawan}</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">No Handphone</label>
                                <input
                                    type="text"
                                    value={data.no_hp}
                                    onChange={e => setData('no_hp', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Contoh: 08123456789..."
                                />
                                {errors.no_hp && <span className="text-red-500 text-xs mt-1 block">{errors.no_hp}</span>}
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Alamat Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Masukkan email aktif..."
                                />
                                {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Jenis Kelamin</label>
                                <select
                                    value={data.jenis_kelamin}
                                    onChange={e => setData('jenis_kelamin', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    required
                                >
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Hubungkan Akun User Web</label>
                                <select
                                    value={data.user_id}
                                    onChange={e => setData('user_id', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                >
                                    <option value="">-- Tanpa Hubungkan Akun --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                    ))}
                                </select>
                                {errors.user_id && <span className="text-red-500 text-xs mt-1 block">{errors.user_id}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Cabang Kantor</label>
                                <select
                                    value={data.kode_cabang}
                                    onChange={e => setData('kode_cabang', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    required
                                >
                                    {cabangs.map(c => (
                                        <option key={c.kode_cabang} value={c.kode_cabang}>{c.nama_cabang}</option>
                                    ))}
                                </select>
                                {errors.kode_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.kode_cabang}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Departemen / Divisi</label>
                                <select
                                    value={data.kode_dept}
                                    onChange={e => setData('kode_dept', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    required
                                >
                                    {departemens.map(d => (
                                        <option key={d.kode_dept} value={d.kode_dept}>{d.nama_dept}</option>
                                    ))}
                                </select>
                                {errors.kode_dept && <span className="text-red-500 text-xs mt-1 block">{errors.kode_dept}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Jabatan Kepegawaian</label>
                                <select
                                    value={data.kode_jabatan}
                                    onChange={e => setData('kode_jabatan', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    required
                                >
                                    {jabatans.map(j => (
                                        <option key={j.kode_jabatan} value={j.kode_jabatan}>{j.nama_jabatan}</option>
                                    ))}
                                </select>
                                {errors.kode_jabatan && <span className="text-red-500 text-xs mt-1 block">{errors.kode_jabatan}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Tanggal Masuk</label>
                                <input
                                    type="date"
                                    value={data.tanggal_masuk}
                                    onChange={e => setData('tanggal_masuk', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                                {errors.tanggal_masuk && <span className="text-red-500 text-xs mt-1 block">{errors.tanggal_masuk}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Status Staf</label>
                                <input
                                    type="text"
                                    value={data.status_karyawan}
                                    onChange={e => setData('status_karyawan', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                    required
                                    placeholder="Contoh: KONTRAK / TETAP"
                                />
                                {errors.status_karyawan && <span className="text-red-500 text-xs mt-1 block">{errors.status_karyawan}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Jam Kerja Khusus</label>
                                <select
                                    value={data.kode_jadwal}
                                    onChange={e => setData('kode_jadwal', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                >
                                    <option value="">-- Gunakan Jadwal Global --</option>
                                    {jamkerjas.map(jk => (
                                        <option key={jk.kode_jam_kerja} value={jk.kode_jam_kerja}>{jk.nama_jam_kerja}</option>
                                    ))}
                                </select>
                                {errors.kode_jadwal && <span className="text-red-500 text-xs mt-1 block">{errors.kode_jadwal}</span>}
                            </div>
                        </div>

                        {editMode && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-stone-100 pt-4">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Lock Lokasi GPS?</label>
                                    <select
                                        value={data.lock_location}
                                        onChange={e => setData('lock_location', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    >
                                        <option value="1">Kunci (Wajib di Kantor)</option>
                                        <option value="0">Bebas / WFH</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Lock Jam Kerja?</label>
                                    <select
                                        value={data.lock_jam_kerja}
                                        onChange={e => setData('lock_jam_kerja', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    >
                                        <option value="1">Kunci Sesuai Jam Kerja</option>
                                        <option value="0">Bebas Absen Kapan Saja</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Status Keaktifan</label>
                                    <select
                                        value={data.status_aktif_karyawan}
                                        onChange={e => setData('status_aktif_karyawan', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    >
                                        <option value="1">Aktif Bekerja</option>
                                        <option value="0">Nonaktif / Resign</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-2 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md disabled:opacity-50"
                            >
                                Simpan Biodata
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal Face Recognition Management */}
            <Modal
                show={showFaceModal}
                onClose={() => setShowFaceModal(false)}
                maxWidth="md"
            >
                <div className="p-6 relative">
                    {/* Close Trigger */}
                    <button
                        onClick={() => setShowFaceModal(false)}
                        className="absolute right-4 top-4 w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                    >
                        <X size={16} />
                    </button>

                    <div className="mb-4">
                        <h3 className="text-base font-extrabold text-slate-800">
                            👤 Kelola Master Wajah (Face Recognition)
                        </h3>
                        {selectedKaryawan && (
                            <p className="text-xs text-stone-500 mt-0.5">
                                {selectedKaryawan.nama_karyawan} ({selectedKaryawan.nik})
                            </p>
                        )}
                    </div>

                    <div className="space-y-5">
                        {/* Registered Images List */}
                        <div>
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-2">Master Wajah Terdaftar</h4>
                            
                            {(!selectedKaryawan?.facerecognition || selectedKaryawan.facerecognition.length === 0) ? (
                                <div className="text-center py-8 border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs flex flex-col items-center justify-center gap-1 bg-stone-50/50">
                                    <Camera size={24} className="text-stone-300 mb-1 animate-pulse" />
                                    <p className="font-semibold">Belum ada data wajah master.</p>
                                    <p className="text-[10px] text-stone-400">Harap daftarkan minimal 1 foto selfie wajah staf.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                    {selectedKaryawan.facerecognition.map((face) => (
                                        <div 
                                            key={face.id} 
                                            className="relative rounded-xl border border-stone-200 p-2 flex flex-col items-center bg-stone-50 group hover:border-amber-200 transition-all"
                                        >
                                            <img
                                                src={`/storage/uploads/facerecognition/${selectedKaryawan.nik}-${selectedKaryawan.nama_karyawan.split(' ')[0].toLowerCase()}/${face.wajah}`}
                                                onError={(e) => {
                                                    // Fallback to placeholder if not yet linked in public storage
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                                }}
                                                className="w-18 h-18 rounded-full object-cover shadow-sm bg-white mb-2 border border-stone-150"
                                                alt="Master Face"
                                            />
                                            <span className="text-[9px] text-stone-400 font-mono truncate w-full text-center" title={face.wajah}>
                                                {face.wajah}
                                            </span>
                                            
                                            <button
                                                onClick={() => handleFaceDelete(face.id)}
                                                className="absolute top-1.5 right-1.5 p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors border border-rose-100"
                                                title="Hapus foto wajah"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload New Face Form */}
                        {selectedKaryawan && (
                            <form onSubmit={handleFaceUpload} className="border-t border-stone-100 pt-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1.5">Daftarkan Wajah Baru</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => faceForm.setData('image', e.target.files?.[0] || null)}
                                        className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-stone-200 file:text-[10px] file:font-extrabold file:bg-stone-50 file:text-stone-700 hover:file:bg-stone-100 cursor-pointer"
                                        required
                                    />
                                    {faceForm.errors.image && <span className="text-red-500 text-xs mt-1 block">{faceForm.errors.image}</span>}
                                </div>
                                
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={faceForm.processing || !faceForm.data.image}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-extrabold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 shadow-md"
                                    >
                                        {faceForm.processing ? 'Uploading...' : 'Upload & Registrasi Wajah'}
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            </Modal>
        </>
    );
}
