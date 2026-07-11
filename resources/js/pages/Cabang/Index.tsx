import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

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
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
            <Head title="Manajemen Cabang" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="cabang" onClose={() => setSidebarOpen(false)} />
            
            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Manajemen Cabang</h1>
                            <p className="text-xs text-stone-600">Kelola lokasi cabang dan radius deteksi GPS absensi</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Tambah Cabang
                        </button>
                    </div>

                    <SearchFilter
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari nama, kode, atau alamat cabang..."
                    />

                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-md">
                        <table className="w-full text-sm text-left text-stone-600">
                            <thead className="text-xs text-stone-700 uppercase bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Kode</th>
                                    <th className="px-5 py-3 font-semibold">Nama Cabang</th>
                                    <th className="px-5 py-3 font-semibold">Alamat</th>
                                    <th className="px-5 py-3 font-semibold">No Telepon</th>
                                    <th className="px-5 py-3 font-semibold">Lokasi (GPS)</th>
                                    <th className="px-5 py-3 font-semibold">Radius (Meter)</th>
                                    <th className="px-5 py-3 font-semibold">Timezone</th>
                                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCabangs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                                            Tidak ada data cabang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCabangs.map((cabang) => (
                                        <tr key={cabang.kode_cabang} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="px-5 py-4 font-semibold text-stone-800">{cabang.kode_cabang}</td>
                                            <td className="px-5 py-4 font-medium text-stone-900">{cabang.nama_cabang}</td>
                                            <td className="px-5 py-4 text-stone-600">{cabang.alamat_cabang}</td>
                                            <td className="px-5 py-4 text-stone-600">{cabang.telepon_cabang}</td>
                                            <td className="px-5 py-4 font-mono text-xs text-amber-700">{cabang.lokasi_cabang}</td>
                                            <td className="px-5 py-4 text-stone-600">{cabang.radius_cabang} m</td>
                                            <td className="px-5 py-4 text-stone-600">{cabang.timezone}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(cabang)}
                                                    className="text-amber-600 hover:text-amber-900 font-medium mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cabang.kode_cabang)}
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
                    </div>
                </div>
            </div>

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-5 border-b border-stone-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editMode ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Kode Cabang (3 Karakter)</label>
                                <input
                                    type="text"
                                    maxLength={3}
                                    disabled={editMode}
                                    value={data.kode_cabang}
                                    onChange={e => setData('kode_cabang', e.target.value.toUpperCase())}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.kode_cabang && <span className="text-red-500 text-xs">{errors.kode_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Nama Cabang</label>
                                <input
                                    type="text"
                                    value={data.nama_cabang}
                                    onChange={e => setData('nama_cabang', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.nama_cabang && <span className="text-red-500 text-xs">{errors.nama_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Alamat Cabang</label>
                                <input
                                    type="text"
                                    value={data.alamat_cabang}
                                    onChange={e => setData('alamat_cabang', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.alamat_cabang && <span className="text-red-500 text-xs">{errors.alamat_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Telepon Cabang</label>
                                <input
                                    type="text"
                                    value={data.telepon_cabang}
                                    onChange={e => setData('telepon_cabang', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.telepon_cabang && <span className="text-red-500 text-xs">{errors.telepon_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Titik Koordinat Lokasi (Latitude, Longitude)</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: -6.175392, 106.827153"
                                    value={data.lokasi_cabang}
                                    onChange={e => setData('lokasi_cabang', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.lokasi_cabang && <span className="text-red-500 text-xs">{errors.lokasi_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Radius Deteksi Absensi (Meter)</label>
                                <input
                                    type="number"
                                    value={data.radius_cabang}
                                    onChange={e => setData('radius_cabang', parseInt(e.target.value) || 0)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.radius_cabang && <span className="text-red-500 text-xs">{errors.radius_cabang}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Zona Waktu (Timezone)</label>
                                <select
                                    value={data.timezone}
                                    onChange={e => setData('timezone', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                >
                                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                                </select>
                                {errors.timezone && <span className="text-red-500 text-xs">{errors.timezone}</span>}
                            </div>
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
        </>
    );
}
