import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import {
    Award,
    ArrowLeft,
    Check,
    Download,
    Edit3,
    FileText,
    PlusCircle,
    Search,
    Trash2,
    Upload,
    Users,
    X,
    AlertCircle
} from 'lucide-react';

interface Karyawan {
    nik: string;
    nik_show: string;
    nama_karyawan: string;
}

interface Pelatihan {
    kode_pelatihan: string;
    nama_pelatihan: string;
    penyelenggara: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    deskripsi: string | null;
}

interface Participant {
    id: number;
    kode_pelatihan: string;
    nik: string;
    status_kelulusan: 'Mengikuti' | 'Lulus' | 'Tidak Lulus';
    nilai: string | null;
    file_sertifikat: string | null;
    karyawan: Karyawan;
}

interface Props {
    pelatihan: Pelatihan;
    participants: Participant[];
    karyawans: Karyawan[]; // unassigned employees
}

export default function KelolaPeserta({ pelatihan, participants, karyawans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    
    // Search unassigned employees in Add modal
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [filteredEmployees, setFilteredEmployees] = useState<Karyawan[]>(karyawans);

    // Selected NIKs to add
    const [selectedNiks, setSelectedNiks] = useState<string[]>([]);

    useEffect(() => {
        setFilteredEmployees(
            karyawans.filter(k => 
                k.nama_karyawan.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                k.nik_show.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                k.nik.toLowerCase().includes(employeeSearch.toLowerCase())
            )
        );
    }, [employeeSearch, karyawans]);

    // Form for Add Participants
    const addForm = useForm({
        niks: [] as string[]
    });

    // Form for Update Participant Status
    const updateForm = useForm({
        status_kelulusan: 'Mengikuti',
        nilai: '',
        file_sertifikat: null as File | null,
    });

    const openAddModal = () => {
        setEmployeeSearch("");
        setSelectedNiks([]);
        setShowAddModal(true);
    };

    const toggleSelectEmployee = (nik: string) => {
        setSelectedNiks(prev => 
            prev.includes(nik) ? prev.filter(n => n !== nik) : [...prev, nik]
        );
    };

    const handleAddSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (selectedNiks.length === 0) {
            alert('Silakan pilih minimal 1 karyawan.');
            return;
        }
        
        router.post(`/pelatihan/${pelatihan.kode_pelatihan}/peserta`, {
            niks: selectedNiks
        }, {
            onSuccess: () => {
                setShowAddModal(false);
                setSelectedNiks([]);
            }
        });
    };

    const openUpdateModal = (participant: Participant) => {
        setSelectedParticipant(participant);
        updateForm.setData({
            status_kelulusan: participant.status_kelulusan,
            nilai: participant.nilai || '',
            file_sertifikat: null
        });
        setShowUpdateModal(true);
    };

    const handleUpdateSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedParticipant) return;

        // Since we may upload a certificate file, we use router.post directly 
        // to handle multipart form data correctly
        const formData = new FormData();
        formData.append('status_kelulusan', updateForm.data.status_kelulusan);
        formData.append('nilai', updateForm.data.nilai);
        if (updateForm.data.file_sertifikat) {
            formData.append('file_sertifikat', updateForm.data.file_sertifikat);
        }

        router.post(`/pelatihan/peserta/${selectedParticipant.id}/update`, formData, {
            onSuccess: () => {
                setShowUpdateModal(false);
                setSelectedParticipant(null);
                updateForm.reset();
            }
        });
    };

    const handleRemoveParticipant = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin mengeluarkan ${name} dari program pelatihan ini?`)) {
            router.delete(`/pelatihan/peserta/${id}`);
        }
    };

    const getStatusBadge = (status: 'Mengikuti' | 'Lulus' | 'Tidak Lulus') => {
        switch (status) {
            case 'Lulus':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-extrabold uppercase">
                        <Check size={10} />
                        Lulus
                    </span>
                );
            case 'Tidak Lulus':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-250 text-rose-700 text-[10px] font-extrabold uppercase">
                        <X size={10} />
                        Tidak Lulus
                    </span>
                );
            case 'Mengikuti':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase">
                        Mengikuti
                    </span>
                );
        }
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
            <Head title={`Peserta Pelatihan - ${pelatihan.nama_pelatihan}`} />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pelatihan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/5 to-stone-100">
                <div className="p-3 mt-20 space-y-6 fadeInUp">

                    {/* Back button & Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Link href="/pelatihan" className="hover:text-amber-600 transition-colors font-semibold">
                            Daftar Pelatihan
                        </Link>
                        <span>/</span>
                        <span className="text-stone-800 font-extrabold">Kelola Peserta</span>
                    </div>

                    {/* Class Details Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-stone-850">
                                    {pelatihan.nama_pelatihan}
                                </h1>
                                <span className="font-mono text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md border border-stone-200">
                                    {pelatihan.kode_pelatihan}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-stone-600">
                                <p><strong>Penyelenggara:</strong> {pelatihan.penyelenggara}</p>
                                <p><strong>Periode:</strong> {formatDate(pelatihan.tanggal_mulai)} s/d {formatDate(pelatihan.tanggal_selesai)}</p>
                                {pelatihan.deskripsi && (
                                    <p className="md:col-span-2 mt-1"><strong>Deskripsi:</strong> {pelatihan.deskripsi}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] flex-shrink-0"
                            >
                                <PlusCircle size={14} />
                                Tambah Peserta Kelas
                            </button>
                        </div>
                    </div>

                    {/* Participants Table */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-stone-150 flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                                <Users size={16} className="text-amber-500" />
                                Daftar Peserta Terdaftar ({participants.length} Orang)
                            </h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600">
                                <thead className="text-[10px] text-stone-500 font-bold uppercase tracking-wider bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-5 py-4 text-center">No</th>
                                        <th scope="col" className="px-5 py-4">NIK</th>
                                        <th scope="col" className="px-5 py-4">Nama Karyawan</th>
                                        <th scope="col" className="px-5 py-4 text-center">Nilai</th>
                                        <th scope="col" className="px-5 py-4 text-center">Status Kelulusan</th>
                                        <th scope="col" className="px-5 py-4 text-center">Sertifikat</th>
                                        <th scope="col" className="px-5 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {participants.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Users size={36} className="text-stone-300" />
                                                    <p className="font-semibold text-sm">Belum ada peserta terdaftar.</p>
                                                    <p className="text-xs text-stone-400">Klik "Tambah Peserta Kelas" untuk menambahkan karyawan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        participants.map((participant, index) => (
                                            <tr key={participant.id} className="hover:bg-amber-50/10 transition-colors">
                                                <td className="px-5 py-4 text-center font-bold text-stone-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-4 font-mono font-semibold text-stone-700">
                                                    {participant.karyawan.nik_show || participant.nik}
                                                </td>
                                                <td className="px-5 py-4 font-extrabold text-stone-900">
                                                    {participant.karyawan.nama_karyawan}
                                                </td>
                                                <td className="px-5 py-4 text-center font-bold text-stone-850">
                                                    {participant.nilai || '-'}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {getStatusBadge(participant.status_kelulusan)}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {participant.file_sertifikat ? (
                                                        <a
                                                            href={`/storage/${participant.file_sertifikat}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-800 text-[10px] font-extrabold rounded-md shadow-sm transition-colors"
                                                        >
                                                            <Download size={11} />
                                                            Unduh
                                                        </a>
                                                    ) : (
                                                        <span className="text-stone-400 italic text-[11px]">Belum diunggah</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openUpdateModal(participant)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                                                            title="Update Status & Nilai"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveParticipant(participant.id, participant.karyawan.nama_karyawan)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                                                            title="Keluarkan Peserta"
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
                    </div>

                </div>
            </div>

            {/* Add Participants Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="lg">
                <div className="p-6 relative">
                    <button
                        onClick={() => setShowAddModal(false)}
                        className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <PlusCircle size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-850 text-base">
                                Tambah Peserta Pelatihan
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                Pilih karyawan yang belum mengikuti kelas pelatihan ini.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        {/* Search Employee Box */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-stone-400" size={14} />
                            <input
                                type="text"
                                placeholder="Cari karyawan berdasarkan nama atau NIK..."
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        {/* Employee Checkbox List */}
                        <div className="border border-stone-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-stone-100">
                            {filteredEmployees.length === 0 ? (
                                <div className="p-8 text-center text-stone-400 text-xs">
                                    Tidak ada karyawan yang tersedia.
                                </div>
                            ) : (
                                filteredEmployees.map((karyawan) => (
                                    <label
                                        key={karyawan.nik}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 cursor-pointer transition-colors text-xs font-semibold text-stone-750"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedNiks.includes(karyawan.nik)}
                                            onChange={() => toggleSelectEmployee(karyawan.nik)}
                                            className="rounded border-stone-300 text-amber-550 focus:ring-amber-500 focus:border-amber-500"
                                        />
                                        <div className="flex-1">
                                            <p className="font-extrabold text-stone-900">{karyawan.nama_karyawan}</p>
                                            <p className="text-[10px] text-stone-400 font-mono">NIK: {karyawan.nik_show || karyawan.nik}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800 font-medium">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            <p>Terpilih <span className="font-black text-amber-900">{selectedNiks.length}</span> karyawan untuk dimasukkan ke kelas.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-colors shadow-md"
                            >
                                Tambahkan Peserta
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Update Participant Modal */}
            <Modal show={showUpdateModal} onClose={() => setShowUpdateModal(false)} maxWidth="md">
                <div className="p-6 relative">
                    <button
                        onClick={() => setShowUpdateModal(false)}
                        className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                            <Edit3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-stone-850 text-base">
                                Update Status & Nilai Peserta
                            </h3>
                            <p className="text-[11px] text-stone-400">
                                {selectedParticipant?.karyawan.nama_karyawan}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Status Kelulusan <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={updateForm.data.status_kelulusan}
                                onChange={(e) => updateForm.setData('status_kelulusan', e.target.value as any)}
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                                required
                            >
                                <option value="Mengikuti">Mengikuti</option>
                                <option value="Lulus">Lulus</option>
                                <option value="Tidak Lulus">Tidak Lulus</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Nilai (Score)
                            </label>
                            <input
                                type="text"
                                value={updateForm.data.nilai}
                                onChange={(e) => updateForm.setData('nilai', e.target.value)}
                                placeholder="Contoh: A / 85 / 100"
                                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                                Berkas Sertifikat (PDF / JPG / PNG, Max: 4MB)
                            </label>
                            <div className="mt-1 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative cursor-pointer">
                                <input
                                    type="file"
                                    onChange={(e) => updateForm.setData('file_sertifikat', e.target.files?.[0] || null)}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload size={24} className="text-stone-400 mb-1" />
                                <span className="text-xs font-bold text-stone-700">
                                    {updateForm.data.file_sertifikat ? updateForm.data.file_sertifikat.name : 'Pilih file sertifikat'}
                                </span>
                                <span className="text-[10px] text-stone-400 mt-0.5">Klik atau seret file ke sini</span>
                            </div>
                            
                            {selectedParticipant?.file_sertifikat && !updateForm.data.file_sertifikat && (
                                <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                                    <FileText size={12} className="text-stone-400" />
                                    Sertifikat saat ini sudah diunggah. Unggah berkas baru untuk memperbarui.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => setShowUpdateModal(false)}
                                className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 font-bold text-xs rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-colors shadow-md"
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
