import { useState } from "react";
import { router, Head } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface DefectItem {
    id: number;
    photo_url: string;
    notes: string;
    order: number;
    repairs: Repair[];
}

interface Repair {
    id: number;
    photo_url: string;
    notes: string;
    repaired_by: string;
    repaired_at: string;
    is_approved: boolean;
    approved_by: string | null;
    approved_at: string | null;
}
interface Defect {
    nama_project: string;
    company_name: string;
    customer_name: string;
    nama_produk: string;
    qc_stage: string;
    status: string;
    defect_items: DefectItem[];
    has_pending_approval: boolean;
}

export default function Show({ defect }: { defect: Defect }) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [showRepairModal, setShowRepairModal] = useState<number | null>(null);
    const [repairPhoto, setRepairPhoto] = useState<File | null>(null);
    const [repairNotes, setRepairNotes] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [approvingRepair, setApprovingRepair] = useState<number | null>(null);
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRepairPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmitRepair = (defectItemId: number) => {
        const formData = new FormData();
        formData.append('photo', repairPhoto!);
        formData.append('notes', repairNotes);
        
        router.post(`/defect-items/${defectItemId}/repair`, formData, {
            onSuccess: () => {
                setShowRepairModal(null);
                setRepairPhoto(null);
                setRepairNotes('');
                setPhotoPreview(null);
            }
        });
    };

    const handleApproveRepair = (repairId: number) => {
        if (confirm('Apakah Anda yakin ingin menyetujui perbaikan ini?')) {
            setApprovingRepair(repairId);
            router.post(`/defect-repairs/${repairId}/approve`, {}, {
                onFinish: () => setApprovingRepair(null)
            });
        }
    };

    const handleRejectRepair = (repairId: number) => {
        if (confirm('Apakah Anda yakin ingin menolak perbaikan ini? Foto perbaikan akan dihapus dan harus diupload ulang.')) {
            setApprovingRepair(repairId);
            router.post(`/defect-repairs/${repairId}/reject`, {}, {
                onFinish: () => setApprovingRepair(null)
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'in_repair': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'completed': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    
    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending': return 'Menunggu Perbaikan';
            case 'in_repair': return 'Sedang Diperbaiki';
            case 'completed': return 'Selesai';
            default: return status;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Detail Defect - ${defect.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="defect-management"
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
            >
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Tombol Kembali */}
                        <button
                            onClick={() => router.get('/defect-management')}
                            className="mb-6 inline-flex transform items-center rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:shadow-lg"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke List
                        </button>

                        {/* Header */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-8 shadow-xl mb-8">
                            <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/20" />
                            
                            <div className="relative z-10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="mb-2 flex items-center">
                                            <div className="mr-3 h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-red-500 to-orange-600" />
                                            <h1 className="text-4xl font-bold text-gray-900">{defect.nama_project}</h1>
                                        </div>
                                        <p className="text-lg text-gray-700">{defect.company_name} - {defect.customer_name}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-md ${getStatusColor(defect.status)}`}>
                                        {getStatusLabel(defect.status)}
                                    </span>
                                </div>
                                
                                {/* Pending Approval Warning */}
                                {defect.has_pending_approval && (
                                    <div className="mb-4 rounded-xl bg-yellow-100 border-2 border-yellow-300 p-4 shadow-md">
                                        <div className="flex items-center">
                                            <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <p className="font-bold text-yellow-800">Ada perbaikan yang menunggu approval</p>
                                                <p className="text-sm text-yellow-700">Silakan review dan approve/tolak perbaikan yang sudah diupload agar proses produksi dapat dilanjutkan.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
                                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase">Produk</p>
                                        <p className="text-lg font-bold text-gray-900">{defect.nama_produk}</p>
                                    </div>
                                    <div className="rounded-xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
                                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase">QC Stage</p>
                                        <p className="text-lg font-bold text-gray-900">{defect.qc_stage}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Defect Items List */}
                        <div className="space-y-6">
                            {defect.defect_items.map((item, index) => (
                                <div key={item.id} className="transform overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:scale-[1.01]">
                                    <div className="border-b-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-4">
                                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                            <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                            Cacat #{index + 1}
                                        </h3>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Foto Cacat */}
                                            <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6">
                                                <h4 className="mb-4 flex items-center text-lg font-bold text-red-700">
                                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Foto Cacat
                                                </h4>
                                                <div className="relative overflow-hidden rounded-lg shadow-lg">
                                                    <img 
                                                        src={item.photo_url} 
                                                        alt="Defect" 
                                                        className="w-full rounded-lg border-2 border-red-300 transition-transform duration-300 hover:scale-105"
                                                    />
                                                </div>
                                                <div className="mt-4 rounded-lg border-2 border-red-200 bg-white p-4 shadow-sm">
                                                    <p className="text-sm font-semibold text-red-700 mb-2">Catatan Cacat:</p>
                                                    <p className="text-sm text-gray-700">{item.notes}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Foto Perbaikan */}
                                            <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="flex items-center text-lg font-bold text-green-700">
                                                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Foto Perbaikan
                                                    </h4>
                                                    {item.repairs.length === 0 && (
                                                        <button
                                                            onClick={() => setShowRepairModal(item.id)}
                                                            className="transform rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg"
                                                        >
                                                            + Upload Perbaikan
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {item.repairs.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {item.repairs.map(repair => (
                                                            <div key={repair.id} className={`rounded-lg border-2 ${repair.is_approved ? 'border-green-400 bg-green-50' : 'border-yellow-400 bg-yellow-50'} p-4 shadow-sm`}>
                                                                <div className="relative overflow-hidden rounded-lg shadow-lg mb-3">
                                                                    <img 
                                                                        src={repair.photo_url} 
                                                                        alt="Repair" 
                                                                        className={`w-full rounded-lg border-2 ${repair.is_approved ? 'border-green-300' : 'border-yellow-300'} transition-transform duration-300 hover:scale-105`}
                                                                    />
                                                                    {/* Approval Status Badge */}
                                                                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${repair.is_approved ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                                                        {repair.is_approved ? '✓ Approved' : '⏳ Pending Approval'}
                                                                    </div>
                                                                </div>
                                                                <div className={`rounded-lg ${repair.is_approved ? 'bg-white' : 'bg-white/80'} p-3`}>
                                                                    <p className="mb-2 text-sm"><strong className="text-green-700">Catatan:</strong> <span className="text-gray-700">{repair.notes}</span></p>
                                                                    <p className="text-xs text-gray-600 flex items-center">
                                                                        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                        </svg>
                                                                        Diperbaiki oleh: <strong className="ml-1">{repair.repaired_by}</strong>
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 flex items-center mt-1">
                                                                        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {new Date(repair.repaired_at).toLocaleString('id-ID')}
                                                                    </p>
                                                                    
                                                                    {/* Approval Info */}
                                                                    {repair.is_approved && repair.approved_by && (
                                                                        <div className="mt-3 pt-3 border-t border-green-200">
                                                                            <p className="text-xs text-green-700 flex items-center">
                                                                                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                Disetujui oleh: <strong className="ml-1">{repair.approved_by}</strong>
                                                                            </p>
                                                                            {repair.approved_at && (
                                                                                <p className="text-xs text-green-600 ml-5">
                                                                                    {new Date(repair.approved_at).toLocaleString('id-ID')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Action Buttons */}
                                                                <div className="mt-3 flex gap-2">
                                                                    {!repair.is_approved && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleApproveRepair(repair.id)}
                                                                                disabled={approvingRepair === repair.id}
                                                                                className="flex-1 flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:hover:scale-100"
                                                                            >
                                                                                {approvingRepair === repair.id ? (
                                                                                    <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                    </svg>
                                                                                ) : (
                                                                                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                )}
                                                                                Approve
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleRejectRepair(repair.id)}
                                                                                disabled={approvingRepair === repair.id}
                                                                                className="flex items-center justify-center rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 disabled:opacity-50"
                                                                                title="Tolak perbaikan - harus upload ulang"
                                                                            >
                                                                                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                                Tolak & Hapus
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <button
                                                                        onClick={() => router.delete(`/defect-repairs/${repair.id}`)}
                                                                        className="flex items-center text-sm font-semibold text-red-600 transition-colors hover:text-red-800"
                                                                    >
                                                                        <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                                                        <svg className="mb-3 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <p className="text-sm font-medium text-gray-500">Belum ada foto perbaikan</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
            
            {/* Modal Upload Perbaikan */}
            {showRepairModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                        <div className="border-b-2 border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Foto Perbaikan
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Foto Hasil Perbaikan</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-full cursor-pointer rounded-lg border-2 border-gray-300 p-2 transition-all duration-200 hover:border-green-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                    />
                                </div>
                                {photoPreview && (
                                    <div className="mt-3 overflow-hidden rounded-lg border-2 border-green-300 shadow-md">
                                        <img src={photoPreview} alt="Preview" className="w-full" />
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Catatan Perbaikan</label>
                                <textarea
                                    value={repairNotes}
                                    onChange={(e) => setRepairNotes(e.target.value)}
                                    className="w-full rounded-lg border-2 border-gray-300 p-3 transition-all duration-200 hover:border-green-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                    rows={4}
                                    placeholder="Jelaskan perbaikan yang dilakukan..."
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
                            <button
                                onClick={() => {
                                    setShowRepairModal(null);
                                    setPhotoPreview(null);
                                }}
                                className="flex-1 transform rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:shadow-md"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleSubmitRepair(showRepairModal)}
                                disabled={!repairPhoto || !repairNotes}
                                className="flex-1 transform rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
