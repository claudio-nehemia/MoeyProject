import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

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
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pengumuman-presensi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                📢 Pengumuman Karyawan
                            </h1>
                            <p className="text-xs text-stone-500 mt-1">
                                Kelola pengumuman internal perusahaan yang akan langsung tayang pada beranda aplikasi mobile karyawan.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-all transform hover:scale-[1.02]"
                            >
                                ➕ Buat Pengumuman Baru
                            </button>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-4">
                        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
                            <input
                                type="text"
                                value={search}
                                placeholder="Cari berdasarkan judul atau isi..."
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-all"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Table List */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-150 text-stone-600 font-bold uppercase tracking-wider">
                                        <th className="p-4">Tanggal Rilis</th>
                                        <th className="p-4">Judul Pengumuman</th>
                                        <th className="p-4">Isi Pengumuman</th>
                                        <th className="p-4">Lampiran</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-150">
                                    {pengumuman.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-stone-400 font-medium">
                                                Tidak ada pengumuman yang diterbitkan.
                                            </td>
                                        </tr>
                                    ) : (
                                        pengumuman.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-amber-50/10 transition-all">
                                                <td className="p-4 text-stone-650 font-bold">
                                                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 font-bold text-stone-800">
                                                    {item.judul}
                                                </td>
                                                <td className="p-4 text-stone-550 max-w-sm truncate" title={item.isi}>
                                                    {item.isi}
                                                </td>
                                                <td className="p-4">
                                                    {item.lampiran ? (
                                                        <a
                                                            href={`/storage/${item.lampiran}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-amber-600 hover:text-amber-700 font-bold underline"
                                                        >
                                                            Lihat Lampiran 📄
                                                        </a>
                                                    ) : (
                                                        <span className="text-stone-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="inline-flex gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(item)}
                                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                                                        >
                                                            Ubah
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px]"
                                                        >
                                                            Hapus
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
                        {pengumuman.total > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-stone-150">
                                <div className="text-[10px] text-stone-500 font-medium">
                                    Total {pengumuman.total} pengumuman
                                </div>
                                <div className="flex gap-1">
                                    {pengumuman.links.map((link, idx) => (
                                        <button
                                            key={idx}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                                                link.active
                                                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                            } disabled:opacity-30`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Create Announcement Modal */}
                    {showCreateModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-stone-150 transform transition-all max-h-[90vh] overflow-y-auto">
                                <h3 className="text-base font-bold text-slate-800 mb-4">📢 Tambah Pengumuman Baru</h3>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Judul Pengumuman</label>
                                        <input
                                            type="text"
                                            value={createData.judul}
                                            onChange={(e) => setCreateData('judul', e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Isi Pengumuman</label>
                                        <textarea
                                            value={createData.isi}
                                            rows={5}
                                            onChange={(e) => setCreateData('isi', e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Lampiran Dokumen / Gambar (Opsional)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setCreateData('lampiran_file', e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4 border-t border-stone-150">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                                        >
                                            Terbitkan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Announcement Modal */}
                    {showEditModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-stone-150 transform transition-all max-h-[90vh] overflow-y-auto">
                                <h3 className="text-base font-bold text-slate-800 mb-4">✏️ Ubah Pengumuman</h3>
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Judul Pengumuman</label>
                                        <input
                                            type="text"
                                            value={editData.judul}
                                            onChange={(e) => setEditData('judul', e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Isi Pengumuman</label>
                                        <textarea
                                            value={editData.isi}
                                            rows={5}
                                            onChange={(e) => setEditData('isi', e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-stone-250 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-stone-500 mb-1">Update Lampiran Dokumen / Gambar (Opsional)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setEditData('lampiran_file', e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-xs text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4 border-t border-stone-150">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
                                        >
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
