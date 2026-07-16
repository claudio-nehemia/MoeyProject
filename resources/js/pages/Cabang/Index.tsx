import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';
import Modal from '@/components/Modal';
import {
    Building,
    MapPin,
    Clock,
    Compass,
    Phone,
    PlusCircle,
    Edit3,
    Trash2,
    Search,
    X
} from 'lucide-react';

interface Cabang {
    kode_cabang: string;
    nama_cabang: string;
    alamat_cabang: string;
    telepon_cabang: string;
    lokasi_cabang: string;
    radius_cabang: number;
    timezone: string;
}

interface Props {
    cabangs: Cabang[];
}

export default function Index({ cabangs }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCabang, setSelectedCabang] = useState<Cabang | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCabangs, setFilteredCabangs] = useState<Cabang[]>(cabangs);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_cabang: '',
        nama_cabang: '',
        alamat_cabang: '',
        telepon_cabang: '',
        lokasi_cabang: '',
        radius_cabang: 100,
        timezone: 'Asia/Jakarta',
    });

    useEffect(() => {
        const filtered = cabangs.filter((cabang) =>
            cabang.nama_cabang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cabang.kode_cabang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cabang.alamat_cabang.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCabangs(filtered);
    }, [searchQuery, cabangs]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedCabang(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (cabang: Cabang) => {
        setEditMode(true);
        setSelectedCabang(cabang);
        setData({
            kode_cabang: cabang.kode_cabang,
            nama_cabang: cabang.nama_cabang,
            alamat_cabang: cabang.alamat_cabang,
            telepon_cabang: cabang.telepon_cabang,
            lokasi_cabang: cabang.lokasi_cabang,
            radius_cabang: cabang.radius_cabang,
            timezone: cabang.timezone,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditMode(false);
        setSelectedCabang(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedCabang) {
            put(`/cabang/${selectedCabang.kode_cabang}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/cabang', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus cabang ini?')) {
            router.delete(`/cabang/${kode}`);
        }
    };

    return (
        <>
            <Head title="Manajemen Cabang Kantor" />

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
            <Sidebar isOpen={sidebarOpen} currentPage="cabang" onClose={() => setSidebarOpen(false)} />
            
            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    🏢 Manajemen Cabang Kantor
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    Data Lokasi
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola data cabang kantor operasional serta pengaturan koordinat GPS dan radius toleransi deteksi absensi karyawan.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                                <PlusCircle size={14} />
                                Tambah Cabang Baru
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
                                    placeholder="Cari cabang berdasarkan kode, nama, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Card Lists */}
                    {filteredCabangs.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
                            <Building className="mx-auto mb-3 text-stone-350" size={36} />
                            <p className="font-semibold text-sm">Cabang tidak ditemukan.</p>
                            <p className="text-xs text-stone-400 mt-1">Silakan sesuaikan filter pencarian atau tambahkan cabang baru.</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {filteredCabangs.map((cabang) => (
                                <div
                                    key={cabang.kode_cabang}
                                    className="bg-white rounded-2xl border border-stone-200/70 p-5 shadow-sm card-hover-effect transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                        
                                        {/* Main Identity (Col 1) */}
                                        <div className="flex items-start gap-4 lg:w-1/3">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                <Building size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-extrabold text-stone-850 text-sm truncate">
                                                        {cabang.nama_cabang.toUpperCase()}
                                                    </h3>
                                                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-extrabold border border-stone-200">
                                                        {cabang.kode_cabang}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 leading-normal flex items-start gap-1">
                                                    <MapPin size={12} className="text-stone-450 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2" title={cabang.alamat_cabang}>
                                                        {cabang.alamat_cabang}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Technical GPS & Radius (Col 2) */}
                                        <div className="flex-1 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                
                                                {/* Timezone */}
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">Timezone</span>
                                                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                                                        <Clock size={12} className="text-stone-400" />
                                                        {cabang.timezone}
                                                    </span>
                                                </div>

                                                {/* Radius */}
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">Radius Absensi</span>
                                                    <span className="text-xs font-bold text-stone-750 flex items-center gap-1">
                                                        <Compass size={12} className="text-stone-400" />
                                                        {cabang.radius_cabang} Meter
                                                    </span>
                                                </div>

                                                {/* Coordinates */}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">GPS Koordinat</span>
                                                    <span className="text-xs font-semibold text-amber-700 font-mono truncate" title={cabang.lokasi_cabang}>
                                                        {cabang.lokasi_cabang}
                                                    </span>
                                                </div>

                                            </div>
                                        </div>

                                        {/* Phone & Actions (Col 3) */}
                                        <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                            
                                            {/* Phone number */}
                                            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-bold">
                                                <Phone size={12} className="text-stone-400" />
                                                {cabang.telepon_cabang}
                                            </div>

                                            {/* Action triggers */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(cabang)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all"
                                                    title="Ubah Cabang"
                                                >
                                                    <Edit3 size={11} />
                                                    Ubah
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cabang.kode_cabang)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition-all"
                                                    title="Hapus Cabang"
                                                >
                                                    <Trash2 size={11} />
                                                    Hapus
                                                </button>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {/* Modal Create/Edit */}
            <Modal
                show={showModal}
                onClose={closeModal}
                maxWidth="md"
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
                        🏢 {editMode ? 'Ubah Informasi Cabang' : 'Tambah Cabang Baru'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Kode Cabang (3 Karakter)</label>
                            <input
                                type="text"
                                maxLength={3}
                                disabled={editMode}
                                value={data.kode_cabang}
                                onChange={e => setData('kode_cabang', e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 uppercase disabled:bg-stone-50 disabled:text-stone-400 disabled:border-stone-200"
                                required
                                placeholder="CONTOH: JKT"
                            />
                            {errors.kode_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.kode_cabang}</span>}
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Nama Cabang</label>
                            <input
                                type="text"
                                value={data.nama_cabang}
                                onChange={e => setData('nama_cabang', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Masukkan nama cabang..."
                            />
                            {errors.nama_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.nama_cabang}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Alamat Cabang</label>
                            <input
                                type="text"
                                value={data.alamat_cabang}
                                onChange={e => setData('alamat_cabang', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Masukkan alamat lengkap..."
                            />
                            {errors.alamat_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.alamat_cabang}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Telepon Cabang</label>
                            <input
                                type="text"
                                value={data.telepon_cabang}
                                onChange={e => setData('telepon_cabang', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Contoh: (021) 1234567"
                            />
                            {errors.telepon_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.telepon_cabang}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Titik Koordinat Lokasi (Latitude, Longitude)</label>
                            <input
                                type="text"
                                placeholder="Contoh: -6.175392,106.827153"
                                value={data.lokasi_cabang}
                                onChange={e => setData('lokasi_cabang', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            {errors.lokasi_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.lokasi_cabang}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Radius Deteksi Absensi (Meter)</label>
                            <input
                                type="number"
                                value={data.radius_cabang}
                                onChange={e => setData('radius_cabang', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            {errors.radius_cabang && <span className="text-red-500 text-xs mt-1 block">{errors.radius_cabang}</span>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Zona Waktu (Timezone)</label>
                            <select
                                value={data.timezone}
                                onChange={e => setData('timezone', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white"
                                required
                            >
                                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                            </select>
                            {errors.timezone && <span className="text-red-500 text-xs mt-1 block">{errors.timezone}</span>}
                        </div>

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
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
