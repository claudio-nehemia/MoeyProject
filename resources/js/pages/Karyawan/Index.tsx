import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

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
    const [sidebarOpen, setSidebarOpen] = useState(true);
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

    const handleFaceUpload: FormEventHandler = (e) => {
        e.preventDefault();
        if (!faceForm.data.image || !selectedKaryawan) return;

        faceForm.post(`/karyawan/${selectedKaryawan.nik}/upload-face`, {
            onSuccess: () => {
                faceForm.reset();
                // Refresh data
                const updated = karyawans.find(k => k.nik === selectedKaryawan.nik);
                if (updated) setSelectedKaryawan(updated);
            }
        });
    };

    const handleFaceDelete = (id: number) => {
        if (!selectedKaryawan) return;
        if (confirm('Apakah Anda yakin ingin menghapus foto wajah ini?')) {
            router.delete(`/karyawan/${selectedKaryawan.nik}/delete-face/${id}`, {
                onSuccess: () => {
                    // Refresh data
                    const updated = karyawans.find(k => k.nik === selectedKaryawan.nik);
                    if (updated) setSelectedKaryawan(updated);
                }
            });
        }
    };

    const handleDelete = (nik: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) {
            router.delete(`/karyawan/${nik}`);
        }
    };

    return (
        <>
            <Head title="Data Karyawan" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="karyawan" onClose={() => setSidebarOpen(false)} />
            
            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Data Karyawan</h1>
                            <p className="text-xs text-stone-600">Kelola biodata, akun login, dan foto master face recognition karyawan</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Tambah Karyawan
                        </button>
                    </div>

                    <SearchFilter
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari nama, NIK, atau email karyawan..."
                    />

                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-md">
                        <table className="w-full text-sm text-left text-stone-600">
                            <thead className="text-xs text-stone-700 uppercase bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">NIK</th>
                                    <th className="px-5 py-3 font-semibold">Nama Lengkap</th>
                                    <th className="px-5 py-3 font-semibold">Cabang</th>
                                    <th className="px-5 py-3 font-semibold">Departemen</th>
                                    <th className="px-5 py-3 font-semibold">Jabatan</th>
                                    <th className="px-5 py-3 font-semibold">Jam Kerja Utama</th>
                                    <th className="px-5 py-3 font-semibold">Face Registration</th>
                                    <th className="px-5 py-3 font-semibold">Status Aktif</th>
                                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKaryawans.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                                            Tidak ada data karyawan ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedKaryawans.map((kar) => (
                                        <tr key={kar.nik} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="px-5 py-4 font-semibold text-stone-800">{kar.nik}</td>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-stone-900">{kar.nama_karyawan}</div>
                                                <div className="text-xs text-stone-400">{kar.email || '-'}</div>
                                            </td>
                                            <td className="px-5 py-4 text-stone-600">{kar.cabang?.nama_cabang || '-'}</td>
                                            <td className="px-5 py-4 text-stone-600">{kar.departemen?.nama_dept || '-'}</td>
                                            <td className="px-5 py-4 text-stone-600">{kar.jabatan?.nama_jabatan || '-'}</td>
                                            <td className="px-5 py-4 text-stone-600 font-semibold">{kar.jamkerja?.nama_jam_kerja || 'Global / Default'}</td>
                                            <td className="px-5 py-4">
                                                {kar.facerecognition && kar.facerecognition.length > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Registered ({kar.facerecognition.length} Foto)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                                        Belum Terdaftar
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {kar.status_aktif_karyawan === '1' ? (
                                                    <span className="text-emerald-600 font-semibold text-xs">Aktif</span>
                                                ) : (
                                                    <span className="text-stone-400 text-xs">Nonaktif</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => openFaceModal(kar)}
                                                    className="text-emerald-600 hover:text-emerald-900 font-medium mr-3"
                                                >
                                                    Kelola Wajah
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(kar)}
                                                    className="text-amber-600 hover:text-amber-900 font-medium mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(kar.nik)}
                                                    className="text-red-600 hover:text-red-900 font-medium"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50">
                                <p className="text-xs text-stone-500">
                                    Menampilkan {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, filteredKaryawans.length)} dari {filteredKaryawans.length} karyawan
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                                        currentPage === p
                                                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                            : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
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
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next »
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleKaryawanSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">NIK (Nomor Induk Karyawan)</label>
                                    <input
                                        type="text"
                                        maxLength={9}
                                        disabled={editMode}
                                        value={data.nik}
                                        onChange={e => setData('nik', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.nik && <span className="text-red-500 text-xs">{errors.nik}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">No KTP (16 Digit)</label>
                                    <input
                                        type="text"
                                        maxLength={16}
                                        value={data.no_ktp}
                                        onChange={e => setData('no_ktp', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.no_ktp && <span className="text-red-500 text-xs">{errors.no_ktp}</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Nama Lengkap Karyawan</label>
                                <input
                                    type="text"
                                    value={data.nama_karyawan}
                                    onChange={e => setData('nama_karyawan', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.nama_karyawan && <span className="text-red-500 text-xs">{errors.nama_karyawan}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">No HP</label>
                                    <input
                                        type="text"
                                        value={data.no_hp}
                                        onChange={e => setData('no_hp', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    />
                                    {errors.no_hp && <span className="text-red-500 text-xs">{errors.no_hp}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    />
                                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Jenis Kelamin</label>
                                    <select
                                        value={data.jenis_kelamin}
                                        onChange={e => setData('jenis_kelamin', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                    {errors.jenis_kelamin && <span className="text-red-500 text-xs">{errors.jenis_kelamin}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Link ke Akun User Web</label>
                                    <select
                                        value={data.user_id}
                                        onChange={e => setData('user_id', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="">-- Tanpa Hubungkan Akun --</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                        ))}
                                    </select>
                                    {errors.user_id && <span className="text-red-500 text-xs">{errors.user_id}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Cabang</label>
                                    <select
                                        value={data.kode_cabang}
                                        onChange={e => setData('kode_cabang', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        {cabangs.map(c => (
                                            <option key={c.kode_cabang} value={c.kode_cabang}>{c.nama_cabang}</option>
                                        ))}
                                    </select>
                                    {errors.kode_cabang && <span className="text-red-500 text-xs">{errors.kode_cabang}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Departemen</label>
                                    <select
                                        value={data.kode_dept}
                                        onChange={e => setData('kode_dept', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        {departemens.map(d => (
                                            <option key={d.kode_dept} value={d.kode_dept}>{d.nama_dept}</option>
                                        ))}
                                    </select>
                                    {errors.kode_dept && <span className="text-red-500 text-xs">{errors.kode_dept}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Jabatan</label>
                                    <select
                                        value={data.kode_jabatan}
                                        onChange={e => setData('kode_jabatan', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        {jabatans.map(j => (
                                            <option key={j.kode_jabatan} value={j.kode_jabatan}>{j.nama_jabatan}</option>
                                        ))}
                                    </select>
                                    {errors.kode_jabatan && <span className="text-red-500 text-xs">{errors.kode_jabatan}</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Tanggal Masuk</label>
                                    <input
                                        type="date"
                                        value={data.tanggal_masuk}
                                        onChange={e => setData('tanggal_masuk', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.tanggal_masuk && <span className="text-red-500 text-xs">{errors.tanggal_masuk}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Status Karyawan</label>
                                    <input
                                        type="text"
                                        value={data.status_karyawan}
                                        onChange={e => setData('status_karyawan', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.status_karyawan && <span className="text-red-500 text-xs">{errors.status_karyawan}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Jam Kerja Utama</label>
                                    <select
                                        value={data.kode_jadwal}
                                        onChange={e => setData('kode_jadwal', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="">-- Gunakan Jadwal Global --</option>
                                        {jamkerjas.map(jk => (
                                            <option key={jk.kode_jam_kerja} value={jk.kode_jam_kerja}>{jk.nama_jam_kerja}</option>
                                        ))}
                                    </select>
                                    {errors.kode_jadwal && <span className="text-red-500 text-xs">{errors.kode_jadwal}</span>}
                                </div>
                            </div>
                            {editMode && (
                                <div className="grid grid-cols-3 gap-4 border-t border-stone-100 pt-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Lock GPS?</label>
                                        <select
                                            value={data.lock_location}
                                            onChange={e => setData('lock_location', e.target.value)}
                                            className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="1">Ya</option>
                                            <option value="0">Tidak</option>
                                        </select>
                                        {errors.lock_location && <span className="text-red-500 text-xs">{errors.lock_location}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Lock Jam Kerja?</label>
                                        <select
                                            value={data.lock_jam_kerja}
                                            onChange={e => setData('lock_jam_kerja', e.target.value)}
                                            className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="1">Ya</option>
                                            <option value="0">Tidak</option>
                                        </select>
                                        {errors.lock_jam_kerja && <span className="text-red-500 text-xs">{errors.lock_jam_kerja}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Status Aktif</label>
                                        <select
                                            value={data.status_aktif_karyawan}
                                            onChange={e => setData('status_aktif_karyawan', e.target.value)}
                                            className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="1">Aktif</option>
                                            <option value="0">Nonaktif</option>
                                        </select>
                                        {errors.status_aktif_karyawan && <span className="text-red-500 text-xs">{errors.status_aktif_karyawan}</span>}
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex justify-end space-x-2 border-t border-stone-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Face Recognition Management */}
            {showFaceModal && selectedKaryawan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                            <div>
                                <h3 className="text-md font-bold text-slate-800">
                                    Kelola Master Wajah (Face Recognition)
                                </h3>
                                <p className="text-xs text-stone-500">{selectedKaryawan.nama_karyawan} ({selectedKaryawan.nik})</p>
                            </div>
                            <button onClick={() => setShowFaceModal(false)} className="text-stone-400 hover:text-stone-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Registered Images List */}
                            <div>
                                <h4 className="text-xs font-semibold text-stone-500 mb-2 uppercase">Wajah Terdaftar</h4>
                                {!selectedKaryawan.facerecognition || selectedKaryawan.facerecognition.length === 0 ? (
                                    <div className="text-center py-6 border border-dashed border-stone-300 rounded-lg text-stone-400 text-sm">
                                        Belum ada data wajah terdaftar.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                        {selectedKaryawan.facerecognition.map((face) => (
                                            <div key={face.id} className="relative rounded-lg border border-stone-200 p-2 flex flex-col items-center bg-stone-50">
                                                <img
                                                    src={`/storage/uploads/facerecognition/${selectedKaryawan.nik}-${selectedKaryawan.nama_karyawan.split(' ')[0].toLowerCase()}/${face.wajah}`}
                                                    onError={(e) => {
                                                        // Fallback to placeholder if not yet linked in public storage
                                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                                    }}
                                                    className="w-20 h-20 rounded-full object-cover shadow-sm bg-white mb-2"
                                                    alt="Master Face"
                                                />
                                                <span className="text-[10px] text-stone-500 font-mono truncate w-full text-center">{face.wajah}</span>
                                                <button
                                                    onClick={() => handleFaceDelete(face.id)}
                                                    className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Upload New Face Form */}
                            <form onSubmit={handleFaceUpload} className="border-t border-stone-200 pt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Daftarkan Wajah Baru</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => faceForm.setData('image', e.target.files?.[0] || null)}
                                        className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                                        required
                                    />
                                    {faceForm.errors.image && <span className="text-red-500 text-xs">{faceForm.errors.image}</span>}
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={faceForm.processing || !faceForm.data.image}
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                                    >
                                        Upload Wajah
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
