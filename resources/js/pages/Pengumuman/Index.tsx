import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { 
    Calendar, 
    Search, 
    FileText, 
    Edit3, 
    Trash2, 
    Megaphone,
    X,
    Paperclip,
    PlusCircle
} from 'lucide-react';

interface PengumumanItem {
    id: number;
    judul: string;
    isi: string;
    lampiran: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    pengumuman: {
        data: PengumumanItem[];
        links: PaginationLink[];
        total: number;
    };
    filters: {
        search: string | null;
    };
}

export default function Index({ pengumuman, filters }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PengumumanItem | null>(null);

    const { data: createData, setData: setCreateData, post: submitCreate, processing: creating, reset: resetCreate } = useForm({
        judul: '',
        isi: '',
        lampiran_file: null as File | null
    });

    const { data: editData, setData: setEditData, post: submitEdit, processing: updating, reset: resetEdit } = useForm({
        judul: '',
        isi: '',
        lampiran_file: null as File | null
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/pengumuman-presensi', { search }, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        submitCreate('/pengumuman-presensi', {
            onSuccess: () => {
                setShowCreateModal(false);
                resetCreate();
                alert('Pengumuman berhasil diterbitkan!');
            }
        });
    };

    const handleEditClick = (item: PengumumanItem) => {
        setSelectedItem(item);
        setEditData({
            judul: item.judul,
            isi: item.isi,
            lampiran_file: null
        });
        setShowEditModal(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        submitEdit(`/pengumuman-presensi/${selectedItem.id}`, {
            onSuccess: () => {
                setShowEditModal(false);
                resetEdit();
                alert('Pengumuman berhasil diperbarui!');
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
            router.delete(`/pengumuman-presensi/${id}`, {
                onSuccess: () => {
                    alert('Pengumuman berhasil dihapus.');
                }
            });
        }
    };

    return (
        <>
            <Head title="Pengumuman Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .grid-hover-effect {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .grid-hover-effect:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 25px -5px rgba(0, 0, 0, 0.08);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pengumuman-presensi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                    📢 Pengumuman Karyawan
                                </h1>
                                <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                    Beranda Mobile
                                </span>
                            </div>
                            <p className="text-xs text-stone-500">
                                Kelola pengumuman internal perusahaan yang akan langsung tayang pada beranda aplikasi mobile karyawan.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                                <PlusCircle size={14} />
                                Buat Pengumuman Baru
                            </button>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-4.5">
                        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                                <input
                                    type="text"
                                    value={search}
                                    placeholder="Cari berdasarkan judul atau isi..."
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Cards Grid of Announcements */}
                    {pengumuman.data.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
                            <Megaphone className="mx-auto mb-3 text-stone-300" size={36} />
                            <p className="font-semibold text-sm">Belum ada pengumuman.</p>
                            <p className="text-xs text-stone-400 mt-1">Diterbitkan oleh administrator untuk dilihat seluruh staf.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {pengumuman.data.map((item) => {
                                const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                });

                                return (
                                    <div 
                                        key={item.id} 
                                        className="bg-white rounded-2xl border border-stone-200/70 p-5 shadow-sm grid-hover-effect flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Card Header Category Icon & Date */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                                    <Megaphone size={14} />
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-[10px] text-stone-400 font-bold">
                                                    <Calendar size={10} />
                                                    {formattedDate}
                                                </span>
                                            </div>

                                            {/* Title & Body */}
                                            <h3 className="font-extrabold text-stone-850 text-sm mb-2 line-clamp-1" title={item.judul}>
                                                {item.judul}
                                            </h3>
                                            <p className="text-xs text-stone-550 leading-relaxed line-clamp-4 mb-4" title={item.isi}>
                                                {item.isi}
                                            </p>
                                        </div>

                                        <div className="border-t border-stone-100 pt-3 mt-1 space-y-3.5">
                                            {/* Attachment Preview (if any) */}
                                            {item.lampiran ? (
                                                <div className="flex items-center">
                                                    <a
                                                        href={`/storage/${item.lampiran}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-lg text-[10px] text-stone-600 font-bold transition-all"
                                                    >
                                                        <Paperclip size={10} className="text-stone-400" />
                                                        Lihat Lampiran File
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-stone-300 font-medium italic flex items-center gap-1.5 py-1">
                                                    <Paperclip size={10} />
                                                    Tidak ada lampiran
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex justify-between items-center">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-all"
                                                >
                                                    <Edit3 size={10} />
                                                    Ubah
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition-all"
                                                >
                                                    <Trash2 size={10} />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Links */}
                    {pengumuman.total > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/80 shadow-sm gap-4">
                            <div className="text-[11px] text-stone-500 font-bold">
                                Total {pengumuman.total} pengumuman terbit
                            </div>
                            <div className="flex gap-1">
                                {pengumuman.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                                            link.active
                                                ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                        } disabled:opacity-30`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Create Announcement Modal */}
            <Modal 
                show={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                maxWidth="lg"
            >
                <div className="p-6 relative">
                    {/* Close Trigger */}
                    <button 
                        onClick={() => setShowCreateModal(false)}
                        className="absolute right-4 top-4 w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                    >
                        <X size={16} />
                    </button>

                    <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        📢 Terbitkan Pengumuman Baru
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Judul Pengumuman</label>
                            <input
                                type="text"
                                value={createData.judul}
                                onChange={(e) => setCreateData('judul', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Masukkan judul..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Isi Pengumuman</label>
                            <textarea
                                value={createData.isi}
                                rows={5}
                                onChange={(e) => setCreateData('isi', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                                placeholder="Tuliskan detail pengumuman..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Lampiran Dokumen / Gambar (Opsional)</label>
                            <input
                                type="file"
                                onChange={(e) => setCreateData('lampiran_file', e.target.files ? e.target.files[0] : null)}
                                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-stone-200 file:text-[10px] file:font-extrabold file:bg-stone-50 file:text-stone-700 hover:file:bg-stone-100"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md disabled:opacity-50"
                            >
                                Terbitkan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Announcement Modal */}
            <Modal 
                show={showEditModal} 
                onClose={() => setShowEditModal(false)}
                maxWidth="lg"
            >
                <div className="p-6 relative">
                    {/* Close Trigger */}
                    <button 
                        onClick={() => setShowEditModal(false)}
                        className="absolute right-4 top-4 w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all"
                    >
                        <X size={16} />
                    </button>

                    <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        ✏️ Ubah Pengumuman
                    </h3>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Judul Pengumuman</label>
                            <input
                                type="text"
                                value={editData.judul}
                                onChange={(e) => setEditData('judul', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Isi Pengumuman</label>
                            <textarea
                                value={editData.isi}
                                rows={5}
                                onChange={(e) => setEditData('isi', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Update Lampiran Dokumen / Gambar (Opsional)</label>
                            <input
                                type="file"
                                onChange={(e) => setEditData('lampiran_file', e.target.files ? e.target.files[0] : null)}
                                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-stone-200 file:text-[10px] file:font-extrabold file:bg-stone-50 file:text-stone-700 hover:file:bg-stone-100"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md disabled:opacity-50"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
