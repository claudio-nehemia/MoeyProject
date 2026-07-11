import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface PendingRequest {
    id: string;
    tanggal: string;
    keterangan: string;
    dari: string;
    sampai: string;
    tipe: string;
    nama_karyawan: string;
    nik: string;
}

interface Props {
    pendingList: PendingRequest[];
}

export default function Approval({ pendingList }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [processing, setProcessing] = useState(false);

    const handleAction = (id: string, tipe: string, action: '1' | '2') => {
        if (confirm(`Apakah Anda yakin ingin ${action === '1' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) {
            setProcessing(true);
            router.post('/approve-cuti', { id, tipe, action }, {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    alert('Pengajuan berhasil diproses.');
                }
            });
        }
    };

    const getTipeBadgeClass = (tipe: string) => {
        switch (tipe) {
            case 'Cuti': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'Sakit': return 'bg-rose-100 text-rose-800 border border-rose-200';
            case 'Dinas': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'Lembur': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'Koreksi Absen': return 'bg-teal-100 text-teal-800 border border-teal-200';
            default: return 'bg-stone-100 text-stone-850 border border-stone-200';
        }
    };

    return (
        <>
            <Head title="Persetujuan Izin / Cuti Karyawan" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="approve-cuti" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                📝 Persetujuan Izin / Cuti Karyawan
                            </h1>
                            <p className="text-xs text-stone-500 mt-1">
                                Daftar pengajuan cuti, izin, sakit, dinas, lembur, dan koreksi absensi yang sedang menunggu persetujuan Anda.
                            </p>
                        </div>
                    </div>

                    {/* Table List */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-150 text-stone-600 font-bold uppercase tracking-wider">
                                        <th className="p-4">Karyawan</th>
                                        <th className="p-4">Tipe Pengajuan</th>
                                        <th className="p-4">Tanggal Diajukan</th>
                                        <th className="p-4">Rentang Tanggal</th>
                                        <th className="p-4">Keterangan</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-150">
                                    {pendingList.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                                                Tidak ada pengajuan izin/cuti/lembur yang sedang menunggu persetujuan.
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingList.map((item) => (
                                            <tr key={`${item.tipe}-${item.id}`} className="hover:bg-amber-50/20 transition-all">
                                                <td className="p-4">
                                                    <div className="font-bold text-stone-800">{item.nama_karyawan}</div>
                                                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">{item.nik}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getTipeBadgeClass(item.tipe)}`}>
                                                        {item.tipe}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-stone-600 font-medium">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-4 text-stone-700 font-bold">
                                                    {item.dari === item.sampai ? (
                                                        <span>{new Date(item.dari).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            <div>{new Date(item.dari).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                            <div className="text-[10px] text-stone-400 font-normal">s.d.</div>
                                                            <div>{new Date(item.sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-stone-600 max-w-xs truncate" title={item.keterangan}>
                                                    {item.keterangan}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="inline-flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(item.id, item.tipe, '1')}
                                                            disabled={processing}
                                                            className="inline-flex items-center px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
                                                        >
                                                            Setujui
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(item.id, item.tipe, '2')}
                                                            disabled={processing}
                                                            className="inline-flex items-center px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
                                                        >
                                                            Tolak
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
        </>
    );
}
