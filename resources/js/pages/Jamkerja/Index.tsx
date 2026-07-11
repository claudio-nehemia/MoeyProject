import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import SearchFilter from '@/components/SearchFilter';

interface Jamkerja {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
    istirahat: string;
    jam_awal_istirahat: string | null;
    jam_akhir_istirahat: string | null;
    total_jam: number;
    lintashari: string;
    batas_presensi_pulang: string | null;
    keterangan: string | null;
    color: string | null;
}

interface Props {
    jamkerjas: Jamkerja[];
}

export default function Index({ jamkerjas }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedJamkerja, setSelectedJamkerja] = useState<Jamkerja | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredJamkerjas, setFilteredJamkerjas] = useState<Jamkerja[]>(jamkerjas);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        kode_jam_kerja: '',
        nama_jam_kerja: '',
        jam_masuk: '08:00',
        jam_pulang: '17:00',
        istirahat: '1',
        jam_awal_istirahat: '12:00',
        jam_akhir_istirahat: '13:00',
        total_jam: 8,
        lintashari: '0',
        batas_presensi_pulang: '18:00',
        keterangan: '',
        color: '#f59e0b',
    });

    useEffect(() => {
        const filtered = jamkerjas.filter((jk) =>
            jk.nama_jam_kerja.toLowerCase().includes(searchQuery.toLowerCase()) ||
            jk.kode_jam_kerja.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredJamkerjas(filtered);
    }, [searchQuery, jamkerjas]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedJamkerja(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (jk: Jamkerja) => {
        setEditMode(true);
        setSelectedJamkerja(jk);
        
        // Helper to format time strings (HH:mm:ss to HH:mm)
        const formatTime = (time: string | null) => {
            if (!time) return '';
            const parts = time.split(':');
            return `${parts[0]}:${parts[1]}`;
        };

        setData({
            kode_jam_kerja: jk.kode_jam_kerja,
            nama_jam_kerja: jk.nama_jam_kerja,
            jam_masuk: formatTime(jk.jam_masuk),
            jam_pulang: formatTime(jk.jam_pulang),
            istirahat: jk.istirahat,
            jam_awal_istirahat: formatTime(jk.jam_awal_istirahat),
            jam_akhir_istirahat: formatTime(jk.jam_akhir_istirahat),
            total_jam: jk.total_jam,
            lintashari: jk.lintashari,
            batas_presensi_pulang: formatTime(jk.batas_presensi_pulang),
            keterangan: jk.keterangan || '',
            color: jk.color || '#f59e0b',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditMode(false);
        setSelectedJamkerja(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editMode && selectedJamkerja) {
            put(`/jamkerja/${selectedJamkerja.kode_jam_kerja}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/jamkerja', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (kode: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus jam kerja ini?')) {
            router.delete(`/jamkerja/${kode}`);
        }
    };

    return (
        <>
            <Head title="Manajemen Jam Kerja" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="jamkerja" onClose={() => setSidebarOpen(false)} />
            
            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Manajemen Jam Kerja</h1>
                            <p className="text-xs text-stone-600">Kelola shift kerja, jam masuk, jam pulang, dan durasi istirahat karyawan</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Tambah Jam Kerja
                        </button>
                    </div>

                    <SearchFilter
                        onSearch={setSearchQuery}
                        searchPlaceholder="Cari nama atau kode jam kerja..."
                    />

                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-md">
                        <table className="w-full text-sm text-left text-stone-600">
                            <thead className="text-xs text-stone-700 uppercase bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Kode</th>
                                    <th className="px-5 py-3 font-semibold">Nama Jam Kerja</th>
                                    <th className="px-5 py-3 font-semibold">Jam Masuk</th>
                                    <th className="px-5 py-3 font-semibold">Jam Pulang</th>
                                    <th className="px-5 py-3 font-semibold">Istirahat</th>
                                    <th className="px-5 py-3 font-semibold">Durasi Kerja</th>
                                    <th className="px-5 py-3 font-semibold">Lintas Hari</th>
                                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJamkerjas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                                            Tidak ada data jam kerja ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredJamkerjas.map((jk) => (
                                        <tr key={jk.kode_jam_kerja} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="px-5 py-4">
                                                <span 
                                                    className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm"
                                                    style={{ backgroundColor: jk.color || '#9ca3af' }}
                                                >
                                                    {jk.kode_jam_kerja}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-stone-900">{jk.nama_jam_kerja}</td>
                                            <td className="px-5 py-4 font-mono font-medium text-stone-700">{jk.jam_masuk}</td>
                                            <td className="px-5 py-4 font-mono font-medium text-stone-700">{jk.jam_pulang}</td>
                                            <td className="px-5 py-4 text-stone-600">
                                                {jk.istirahat === '1' ? (
                                                    <span className="text-emerald-600 font-medium">Aktif ({jk.jam_awal_istirahat} - {jk.jam_akhir_istirahat})</span>
                                                ) : (
                                                    <span className="text-stone-400">Tidak ada</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-stone-600">{jk.total_jam} Jam</td>
                                            <td className="px-5 py-4 text-stone-600">
                                                {jk.lintashari === '1' ? (
                                                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs font-semibold">Ya</span>
                                                ) : (
                                                    <span className="text-stone-400 text-xs">Tidak</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(jk)}
                                                    className="text-amber-600 hover:text-amber-900 font-medium mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(jk.kode_jam_kerja)}
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
                                {editMode ? 'Edit Jam Kerja' : 'Tambah Jam Kerja Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Kode Jam Kerja (Max 4 Karakter)</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    disabled={editMode}
                                    value={data.kode_jam_kerja}
                                    onChange={e => setData('kode_jam_kerja', e.target.value.toUpperCase())}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.kode_jam_kerja && <span className="text-red-500 text-xs">{errors.kode_jam_kerja}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Nama Jam Kerja</label>
                                <input
                                    type="text"
                                    value={data.nama_jam_kerja}
                                    onChange={e => setData('nama_jam_kerja', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                />
                                {errors.nama_jam_kerja && <span className="text-red-500 text-xs">{errors.nama_jam_kerja}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Jam Masuk</label>
                                    <input
                                        type="time"
                                        value={data.jam_masuk}
                                        onChange={e => setData('jam_masuk', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.jam_masuk && <span className="text-red-500 text-xs">{errors.jam_masuk}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Jam Pulang</label>
                                    <input
                                        type="time"
                                        value={data.jam_pulang}
                                        onChange={e => setData('jam_pulang', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.jam_pulang && <span className="text-red-500 text-xs">{errors.jam_pulang}</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Apakah Ada Istirahat?</label>
                                <select
                                    value={data.istirahat}
                                    onChange={e => setData('istirahat', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                    required
                                >
                                    <option value="1">Ya, Ada Istirahat</option>
                                    <option value="0">Tidak Ada</option>
                                </select>
                                {errors.istirahat && <span className="text-red-500 text-xs">{errors.istirahat}</span>}
                            </div>
                            {data.istirahat === '1' && (
                                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200">
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Mulai Istirahat</label>
                                        <input
                                            type="time"
                                            value={data.jam_awal_istirahat}
                                            onChange={e => setData('jam_awal_istirahat', e.target.value)}
                                            className="w-full bg-white border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Selesai Istirahat</label>
                                        <input
                                            type="time"
                                            value={data.jam_akhir_istirahat}
                                            onChange={e => setData('jam_akhir_istirahat', e.target.value)}
                                            className="w-full bg-white border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Total Jam Kerja</label>
                                    <input
                                        type="number"
                                        value={data.total_jam}
                                        onChange={e => setData('total_jam', parseInt(e.target.value) || 0)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    {errors.total_jam && <span className="text-red-500 text-xs">{errors.total_jam}</span>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Lintas Hari (Shift Malam)?</label>
                                    <select
                                        value={data.lintashari}
                                        onChange={e => setData('lintashari', e.target.value)}
                                        className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                        required
                                    >
                                        <option value="0">Tidak (Selesai Hari yang Sama)</option>
                                        <option value="1">Ya (Melewati Tengah Malam)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Batas Presensi Pulang</label>
                                <input
                                    type="time"
                                    value={data.batas_presensi_pulang}
                                    onChange={e => setData('batas_presensi_pulang', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Warna Label (Hex Code)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={data.color}
                                        onChange={e => setData('color', e.target.value)}
                                        className="w-10 h-10 border border-stone-300 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        maxLength={7}
                                        value={data.color}
                                        onChange={e => setData('color', e.target.value)}
                                        className="border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500 w-full font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase">Keterangan</label>
                                <input
                                    type="text"
                                    value={data.keterangan}
                                    onChange={e => setData('keterangan', e.target.value)}
                                    className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                                />
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
