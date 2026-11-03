import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
    Cpu,
    MapPin,
    PlusCircle,
    Edit3,
    Trash2,
    Search,
    X,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface MesinFingerprint {
    id: number;
    sn: string;
    nama_mesin: string;
    merk: string | null;
    lokasi: string | null;
    titik_koordinat: string | null;
    status: 'Aktif' | 'Nonaktif';
}

interface Props {
    mesinFingerprints: MesinFingerprint[];
}

export default function Index({ mesinFingerprints }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedMesin, setSelectedMesin] = useState<MesinFingerprint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredList, setFilteredList] = useState<MesinFingerprint[]>(mesinFingerprints);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        sn: '',
        nama_mesin: '',
        merk: '',
        lokasi: '',
        titik_koordinat: '',
        status: 'Aktif' as 'Aktif' | 'Nonaktif',
    });

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        const filtered = mesinFingerprints.filter(
            (item) =>
                item.nama_mesin.toLowerCase().includes(q) ||
                item.sn.toLowerCase().includes(q) ||
                (item.merk || '').toLowerCase().includes(q) ||
                (item.lokasi || '').toLowerCase().includes(q)
        );
        setFilteredList(filtered);
    }, [searchQuery, mesinFingerprints]);

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedMesin(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (mesin: MesinFingerprint) => {
        setEditMode(true);
        setSelectedMesin(mesin);
        setData({
            sn: mesin.sn,
            nama_mesin: mesin.nama_mesin,
            merk: mesin.merk || '',
            lokasi: mesin.lokasi || '',
            titik_koordinat: mesin.titik_koordinat || '',
            status: mesin.status,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
        setEditMode(false);
        setSelectedMesin(null);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editMode && selectedMesin) {
            put(`/mesin-fingerprint/${selectedMesin.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/mesin-fingerprint', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus data mesin fingerprint ini?')) {
            router.delete(`/mesin-fingerprint/${id}`);
        }
    };

    return (
        <>
            <Head title="Mesin Fingerprint" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="mesin-fingerprint" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                    <Cpu className="w-6 h-6 text-amber-600" />
                                    Manajemen Mesin Fingerprint
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    ADMS / Cloud
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola daftar perangkat mesin absensi sidik jari / wajah dan serial number (SN) yang terhubung ke sistem.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                                <PlusCircle size={14} />
                                Tambah Mesin Baru
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4">
                        <div className="flex gap-3 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari berdasarkan nama mesin, SN, merk, atau lokasi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    {filteredList.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
                            <Cpu className="mx-auto mb-3 text-stone-300" size={36} />
                            <p className="font-semibold text-sm">Belum ada data mesin fingerprint.</p>
                            <p className="text-xs text-stone-400 mt-1">Tambahkan perangkat baru untuk mulai sinkronisasi presensi.</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {filteredList.map((mesin) => (
                                <div
                                    key={mesin.id}
                                    className="bg-white rounded-2xl border border-stone-200/70 p-5 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                        <div className="flex items-start gap-4 lg:w-1/3">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                <Cpu size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-extrabold text-stone-800 text-sm truncate">
                                                        {mesin.nama_mesin}
                                                    </h3>
                                                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[10px] font-mono font-bold border border-stone-200">
                                                        SN: {mesin.sn}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 flex items-center gap-1">
                                                    <MapPin size={12} className="text-stone-400 flex-shrink-0" />
                                                    <span>{mesin.lokasi || 'Lokasi belum diatur'}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">Merk / Tipe</span>
                                                <span className="text-xs font-bold text-stone-700">{mesin.merk || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">Titik Koordinat</span>
                                                <span className="text-xs font-mono text-amber-700">{mesin.titik_koordinat || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider mb-0.5">Status</span>
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${mesin.status === 'Aktif' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {mesin.status === 'Aktif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                    {mesin.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 border-t lg:border-t-0 border-stone-100 pt-3 lg:pt-0">
                                            <button
                                                onClick={() => openEditModal(mesin)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all"
                                            >
                                                <Edit3 size={11} />
                                                Ubah
                                            </button>
                                            <button
                                                onClick={() => handleDelete(mesin.id)}
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
                </div>
            </div>

            <Modal show={showModal} onClose={closeModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                        <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                            <Cpu size={16} className="text-amber-600" />
                            {editMode ? 'Ubah Data Mesin Fingerprint' : 'Tambah Mesin Fingerprint Baru'}
                        </h3>
                        <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">Serial Number (SN) *</label>
                            <input
                                type="text"
                                value={data.sn}
                                onChange={(e) => setData('sn', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                placeholder="Contoh: CJH223456001"
                                required
                            />
                            {errors.sn && <p className="text-rose-500 text-[10px] mt-1">{errors.sn}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">Nama Mesin *</label>
                            <input
                                type="text"
                                value={data.nama_mesin}
                                onChange={(e) => setData('nama_mesin', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                placeholder="Contoh: Mesin Lobby Utama"
                                required
                            />
                            {errors.nama_mesin && <p className="text-rose-500 text-[10px] mt-1">{errors.nama_mesin}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">Merk / Tipe</label>
                                <input
                                    type="text"
                                    value={data.merk}
                                    onChange={(e) => setData('merk', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                    placeholder="Solution / ZKTeco"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">Status *</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as 'Aktif' | 'Nonaktif')}
                                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">Lokasi Penempatan</label>
                            <input
                                type="text"
                                value={data.lokasi}
                                onChange={(e) => setData('lokasi', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                placeholder="Contoh: Kantor Pusat Lt. 1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">Titik Koordinat (Lat, Long)</label>
                            <input
                                type="text"
                                value={data.titik_koordinat}
                                onChange={(e) => setData('titik_koordinat', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
                                placeholder="-6.200000, 106.816666"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}

