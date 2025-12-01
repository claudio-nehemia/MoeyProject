import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type StageMap = Record<string, number>;

type StageEvidence = {
    id: number;
    evidence_path: string;
    notes: string | null;
    uploaded_by: string;
    created_at: string;
};

type Produk = {
    id: number;
    nama_produk: string;
    quantity: number;
    dimensi: string;
    total_harga: number;
    progress: number;
    current_stage?: string | null;
    weight_percentage: number;
    actual_contribution: number;
    can_report_defect: boolean;
    has_active_defect: boolean;
    has_pending_approval: boolean;
    defect_id: number | null;
    is_completed: boolean;
    has_bast: boolean;
    bast_number: string | null;
    bast_date: string | null;
    bast_pdf_path: string | null;
    stage_evidences: Record<string, StageEvidence[]>;
};

type Item = {
    id: number;
    produks: Produk[];
    progress: number;
    total_harga: number;
};

type Order = {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    progress: number;
    item_pekerjaans: Item[];
};

type KontrakInfo = {
    id: number;
    durasi_kontrak: number;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    sisa_hari: number | null;
    deadline_status: 'overdue' | 'urgent' | 'warning' | 'normal' | null;
} | null;

export default function Detail({
    order,
    kontrak,
    stages,
}: {
    order: Order;
    kontrak: KontrakInfo;
    stages: StageMap;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [updatingProduk, setUpdatingProduk] = useState<number | null>(null);
    const [animatedProgress, setAnimatedProgress] = useState<{
        [key: number]: number;
    }>({});
    const [showStageModal, setShowStageModal] = useState<number | null>(null);
    const [showDefectModal, setShowDefectModal] = useState<number | null>(null);
    const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
    const [defectItems, setDefectItems] = useState([
        { photo: null as File | null, notes: '' },
    ]);
    
    // State for stage update with evidence
    const [showStageUpdateModal, setShowStageUpdateModal] = useState<{produkId: number; targetStage: string} | null>(null);
    const [stageEvidence, setStageEvidence] = useState<File | null>(null);
    const [stageNotes, setStageNotes] = useState('');
    const [generatingBast, setGeneratingBast] = useState<number | null>(null);
    
    // State for evidence viewer modal
    const [showEvidenceModal, setShowEvidenceModal] = useState<{stage: string; evidences: StageEvidence[]} | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const progress: { [key: number]: number } = {};
            order.item_pekerjaans.forEach((item) => {
                item.produks.forEach((produk) => {
                    progress[produk.id] = produk.progress;
                });
            });
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [order]);

    const openStageUpdateModal = (produkId: number, targetStage: string) => {
        setShowStageUpdateModal({ produkId, targetStage });
        setStageEvidence(null);
        setStageNotes('');
    };

    const handleStageUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStageUpdateModal || !stageEvidence) return;

        setUpdatingProduk(showStageUpdateModal.produkId);
        
        const formData = new FormData();
        formData.append('current_stage', showStageUpdateModal.targetStage);
        formData.append('evidence', stageEvidence);
        formData.append('notes', stageNotes);

        router.post(
            `/produk/${showStageUpdateModal.produkId}/update-stage`,
            formData,
            {
                onFinish: () => {
                    setTimeout(() => setUpdatingProduk(null), 500);
                    setShowStageUpdateModal(null);
                    setStageEvidence(null);
                    setStageNotes('');
                },
            },
        );
    };

    const handleGenerateBast = (produkId: number) => {
        if (confirm('Generate BAST untuk produk ini?')) {
            setGeneratingBast(produkId);
            router.post(
                `/produk/${produkId}/generate-bast`,
                {},
                {
                    onFinish: () => {
                        setGeneratingBast(null);
                    },
                },
            );
        }
    };

        const addDefectItem = () => {
        setDefectItems([...defectItems, { photo: null, notes: '' }]);
    };

    const removeDefectItem = (index: number) => {
        setDefectItems(defectItems.filter((_, i) => i !== index));
    };

    const updateDefectItem = (index: number, field: string, value: any) => {
        const updated = [...defectItems];
        updated[index] = { ...updated[index], [field]: value };
        setDefectItems(updated);
    };

    const handleSubmitDefect = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedProduk) return;

        const formData = new FormData();
        formData.append('item_pekerjaan_produk_id', selectedProduk.id.toString());
        formData.append('qc_stage', selectedProduk.current_stage || '');

        defectItems.forEach((item, index) => {
            if (item.photo) {
                formData.append(`defect_items[${index}][photo]`, item.photo);
            }
            formData.append(`defect_items[${index}][notes]`, item.notes);
        });

        router.post('/defects', formData, {
            onSuccess: () => {
                setShowDefectModal(null);
                setSelectedProduk(null);
                setDefectItems([{ photo: null, notes: '' }]);
            },
        });
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'from-emerald-500 to-green-600';
        if (progress >= 75) return 'from-blue-500 to-indigo-600';
        if (progress >= 50) return 'from-yellow-400 to-orange-500';
        if (progress >= 25) return 'from-orange-500 to-red-500';
        if (progress > 0) return 'from-pink-500 to-rose-600';
        return 'from-gray-400 to-gray-500';
    };

    const getProgressBgColor = (progress: number) => {
        if (progress >= 100)
            return 'bg-gradient-to-br from-emerald-50 to-green-100';
        if (progress >= 75)
            return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        if (progress >= 50)
            return 'bg-gradient-to-br from-yellow-50 to-orange-100';
        if (progress >= 25)
            return 'bg-gradient-to-br from-orange-50 to-red-100';
        if (progress > 0) return 'bg-gradient-to-br from-pink-50 to-rose-100';
        return 'bg-gradient-to-br from-gray-50 to-gray-100';
    };

    const getStageColor = (stage?: string | null) => {
        if (!stage) return 'bg-gray-100 text-gray-600 border-gray-200';
        const stageIndex = Object.keys(stages).indexOf(stage);
        const totalStages = Object.keys(stages).length;
        const progress = ((stageIndex + 1) / totalStages) * 100;

        if (progress >= 100)
            return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-green-600';
        if (progress >= 75)
            return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-indigo-600';
        if (progress >= 50)
            return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-orange-500';
        if (progress >= 25)
            return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-red-500';
        return 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-rose-600';
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getDeadlineStatusColor = (status: string | null) => {
        switch (status) {
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'urgent':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'normal':
                return 'bg-green-100 text-green-800 border-green-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getDeadlineIcon = (status: string | null) => {
        switch (status) {
            case 'overdue':
                return '⚠️';
            case 'urgent':
                return '🔴';
            case 'warning':
                return '🟡';
            case 'normal':
                return '🟢';
            default:
                return '⏳';
        }
    };

    const getDeadlineText = (status: string | null, sisaHari: number | null) => {
        if (sisaHari === null) return 'Belum ditentukan';
        if (status === 'overdue') return `Terlambat ${Math.abs(sisaHari)} hari`;
        if (sisaHari === 0) return 'Deadline hari ini!';
        return `${sisaHari} hari lagi`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Detail Project - ${order.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="project-management"
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
            >
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() =>
                                    router.get('/project-management')
                                }
                                className="mb-6 inline-flex transform items-center rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:shadow-lg"
                            >
                                <svg
                                    className="mr-2 h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Kembali
                            </button>

                            <div
                                className={`${getProgressBgColor(order.progress)} relative overflow-hidden rounded-2xl border-2 border-gray-200 p-8 shadow-xl`}
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                                <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/20" />

                                <div className="relative z-10">
                                    <div className="mb-4 flex items-center">
                                        <div className="mr-3 h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                                        <h1 className="text-4xl font-bold text-gray-900">
                                            {order.nama_project}
                                        </h1>
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
                                            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                                Perusahaan
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {order.company_name}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
                                            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                                Customer
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {order.customer_name}
                                            </p>
                                        </div>
                                        
                                        {/* Kontrak Info */}
                                        {kontrak && (
                                            <div className={`rounded-xl p-4 shadow-md backdrop-blur-sm border-2 ${getDeadlineStatusColor(kontrak.deadline_status)}`}>
                                                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
                                                    📅 Durasi Kontrak
                                                </p>
                                                <p className="text-lg font-bold">
                                                    {kontrak.durasi_kontrak} Hari
                                                </p>
                                                <div className="mt-2 text-xs">
                                                    <p>Mulai: {kontrak.tanggal_mulai || '-'}</p>
                                                    <p>Deadline: {kontrak.tanggal_selesai || '-'}</p>
                                                </div>
                                                <div className="mt-2 flex items-center gap-1 font-bold">
                                                    <span>{getDeadlineIcon(kontrak.deadline_status)}</span>
                                                    <span>{getDeadlineText(kontrak.deadline_status, kontrak.sisa_hari)}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="rounded-xl bg-white/70 p-4 shadow-md backdrop-blur-sm">
                                            <p className="mb-3 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                                Total Progress
                                            </p>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1">
                                                    <div className="h-5 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${getProgressColor(order.progress)} relative overflow-hidden transition-all duration-1000 ease-out`}
                                                            style={{
                                                                width: `${order.progress}%`,
                                                            }}
                                                        >
                                                            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`bg-gradient-to-r text-2xl font-bold ${getProgressColor(order.progress)} min-w-[70px] bg-clip-text text-transparent`}
                                                >
                                                    {order.progress.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Item Pekerjaan List */}
                        <div className="space-y-6">
                            {order.item_pekerjaans.map((item, itemIndex) => (
                                <div
                                    key={item.id}
                                    className="transform overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:scale-[1.01]"
                                    style={{
                                        animation: `slideInUp 0.5s ease-out ${itemIndex * 0.1}s backwards`,
                                    }}
                                >
                                    <div
                                        className={`${getProgressBgColor(item.progress)} relative overflow-hidden border-b border-gray-200 px-6 py-5`}
                                    >
                                        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    Item Pekerjaan #
                                                    {itemIndex + 1}
                                                </h2>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {item.produks.length} Produk
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="mb-1 text-xs text-gray-600">
                                                        Progress Item
                                                    </p>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-4 w-40 overflow-hidden rounded-full bg-white/50 shadow-inner backdrop-blur-sm">
                                                            <div
                                                                className={`h-full bg-gradient-to-r ${getProgressColor(item.progress)} relative overflow-hidden transition-all duration-1000 ease-out`}
                                                                style={{
                                                                    width: `${item.progress}%`,
                                                                }}
                                                            >
                                                                <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`bg-gradient-to-r text-lg font-bold ${getProgressColor(item.progress)} min-w-[60px] bg-clip-text text-transparent`}
                                                        >
                                                            {item.progress.toFixed(
                                                                1,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Produk List */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {item.produks.map(
                                                (produk, produkIndex) => {
                                                    const isUpdating =
                                                        updatingProduk ===
                                                        produk.id;
                                                    const progress =
                                                        animatedProgress[
                                                            produk.id
                                                        ] ?? 0;

                                                    return (
                                                        <div
                                                            key={produk.id}
                                                            className={`${getProgressBgColor(produk.progress)} rounded-xl border-2 ${isUpdating ? 'scale-[1.02] border-blue-500' : 'border-transparent'} group relative overflow-hidden p-6 transition-all duration-300 hover:shadow-xl`}
                                                            style={{
                                                                animation: `fadeIn 0.4s ease-out ${produkIndex * 0.1}s backwards`,
                                                            }}
                                                        >
                                                            {/* Decorative background */}
                                                            <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 transition-transform duration-500 group-hover:scale-150" />

                                                            {/* Loading overlay */}
                                                            {isUpdating && (
                                                                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-sm">
                                                                    <div className="rounded-full bg-white p-3 shadow-lg">
                                                                        <svg
                                                                            className="h-6 w-6 animate-spin text-blue-600"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"
                                                                            ></circle>
                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                            ></path>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
                                                                {/* Produk Info */}
                                                                <div className="lg:col-span-5">
                                                                    <h3 className="mb-3 flex items-center text-lg font-bold text-gray-900">
                                                                        <span
                                                                            className={`mr-2 h-2 w-2 rounded-full ${produk.progress > 0 ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`}
                                                                        />
                                                                        {
                                                                            produk.nama_produk
                                                                        }
                                                                    </h3>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center rounded-lg bg-white/50 px-3 py-2 text-gray-700">
                                                                            <svg
                                                                                className="mr-3 h-5 w-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                                                />
                                                                            </svg>
                                                                            <span className="text-sm">
                                                                                Qty:
                                                                            </span>
                                                                            <span className="ml-2 font-bold">
                                                                                {
                                                                                    produk.quantity
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center rounded-lg bg-white/50 px-3 py-2 text-gray-700">
                                                                            <svg
                                                                                className="mr-3 h-5 w-5 text-purple-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                                                                />
                                                                            </svg>
                                                                            <span className="text-sm">
                                                                                Dimensi:
                                                                            </span>
                                                                            <span className="ml-2 font-bold">
                                                                                {
                                                                                    produk.dimensi
                                                                                }{' '}
                                                                                cm
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center rounded-lg bg-white/50 px-3 py-2 text-gray-700">
                                                                            <svg
                                                                                className="mr-3 h-5 w-5 text-green-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                />
                                                                            </svg>
                                                                            <span className="text-sm">
                                                                                Harga:
                                                                            </span>
                                                                            <span className="ml-2 font-bold">
                                                                                {formatRupiah(
                                                                                    produk.total_harga,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* BAST Section */}
                                                                    {produk.is_completed && (
                                                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                                                            {produk.has_bast ? (
                                                                                <div className="rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 p-4 border border-green-200">
                                                                                    <div className="flex items-center mb-2">
                                                                                        <span className="text-green-600 text-xl mr-2">✅</span>
                                                                                        <span className="font-bold text-green-800">BAST Sudah Dibuat</span>
                                                                                    </div>
                                                                                    <p className="text-sm text-green-700 mb-1">No: {produk.bast_number}</p>
                                                                                    <p className="text-sm text-green-700 mb-3">Tanggal: {produk.bast_date}</p>
                                                                                    <a
                                                                                        href={`/produk/${produk.id}/download-bast`}
                                                                                        className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                                                                    >
                                                                                        📥 Download BAST
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleGenerateBast(produk.id)}
                                                                                    disabled={generatingBast === produk.id}
                                                                                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-white font-bold shadow-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                                                                                >
                                                                                    {generatingBast === produk.id ? (
                                                                                        <span className="flex items-center justify-center">
                                                                                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                            </svg>
                                                                                            Generating BAST...
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="flex items-center justify-center">
                                                                                            📋 CREATE BAST
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Stage Evidences */}
                                                                    {produk.stage_evidences && Object.keys(produk.stage_evidences).length > 0 && (
                                                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                                                            <p className="text-sm font-semibold text-gray-700 mb-2">📸 Bukti Tahapan (Klik untuk lihat):</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {Object.entries(produk.stage_evidences).map(([stage, evidences]) => (
                                                                                    <button 
                                                                                        key={stage} 
                                                                                        onClick={() => setShowEvidenceModal({ stage, evidences })}
                                                                                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                                                                                    >
                                                                                        ✓ {stage} ({evidences.length})
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Progress */}
                                                                <div className="lg:col-span-3">
                                                                    <p className="mb-3 text-sm font-semibold text-gray-700">
                                                                        Progress
                                                                        &
                                                                        Kontribusi
                                                                    </p>
                                                                    <div className="space-y-3">
                                                                        {/* Contribution Comparison */}
                                                                        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-3 shadow-sm">
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <span className="flex items-center text-xs font-semibold text-indigo-700">
                                                                                    <svg
                                                                                        className="mr-1.5 h-4 w-4"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                                                        />
                                                                                    </svg>
                                                                                    Kontribusi
                                                                                    ke
                                                                                    Progress
                                                                                    Item
                                                                                </span>
                                                                            </div>

                                                                            {/* Visual Bar Comparison */}
                                                                            <div className="relative h-8 overflow-hidden rounded-lg bg-white/60 backdrop-blur-sm">
                                                                                {/* Max Weight Background */}
                                                                                <div
                                                                                    className="absolute inset-y-0 left-0 border-r-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-200 to-purple-200"
                                                                                    style={{
                                                                                        width: `${Math.min(produk.weight_percentage, 100)}%`,
                                                                                    }}
                                                                                >
                                                                                    <div className="absolute top-1/2 right-2 -translate-y-1/2 text-xs font-bold text-indigo-700">
                                                                                        {produk.weight_percentage.toFixed(
                                                                                            1,
                                                                                        )}

                                                                                        %
                                                                                    </div>
                                                                                </div>

                                                                                {/* Actual Contribution */}
                                                                                <div
                                                                                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(produk.progress)} transition-all duration-1000 ease-out`}
                                                                                    style={{
                                                                                        width: `${Math.min(produk.actual_contribution, 100)}%`,
                                                                                    }}
                                                                                >
                                                                                    <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                                                                                </div>
                                                                            </div>

                                                                            {/* Legend */}
                                                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="flex items-center">
                                                                                        <div className="mr-1.5 h-3 w-3 rounded-sm border border-indigo-300 bg-gradient-to-r from-indigo-200 to-purple-200"></div>
                                                                                        <span className="text-gray-600">
                                                                                            Maks
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center">
                                                                                        <div
                                                                                            className={`h-3 w-3 rounded-sm bg-gradient-to-r ${getProgressColor(produk.progress)} mr-1.5`}
                                                                                        ></div>
                                                                                        <span className="text-gray-600">
                                                                                            Tercapai
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <span
                                                                                    className={`rounded-md px-2 py-0.5 font-bold ${getProgressColor(produk.progress)} bg-gradient-to-r bg-clip-text text-transparent`}
                                                                                >
                                                                                    {produk.actual_contribution.toFixed(
                                                                                        1,
                                                                                    )}

                                                                                    %
                                                                                    /{' '}
                                                                                    {produk.weight_percentage.toFixed(
                                                                                        1,
                                                                                    )}

                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Progress Produk Bar */}
                                                                        <div className="flex items-center space-x-3">
                                                                            <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/60 shadow-inner backdrop-blur-sm">
                                                                                <div
                                                                                    className={`h-full bg-gradient-to-r ${getProgressColor(produk.progress)} relative overflow-hidden transition-all duration-1000 ease-out`}
                                                                                    style={{
                                                                                        width: `${progress}%`,
                                                                                    }}
                                                                                >
                                                                                    <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0" />
                                                                                </div>
                                                                            </div>
                                                                            <span
                                                                                className={`bg-gradient-to-r text-xl font-bold ${getProgressColor(produk.progress)} min-w-[60px] bg-clip-text text-transparent`}
                                                                            >
                                                                                {
                                                                                    produk.progress
                                                                                }

                                                                                %
                                                                            </span>
                                                                        </div>

                                                                        {/* Current Stage Badge */}
                                                                        {produk.current_stage ? (
                                                                            <div>
                                                                                <span
                                                                                    className={`inline-flex transform items-center rounded-lg px-4 py-2 text-sm font-bold shadow-md transition-transform hover:scale-105 ${getStageColor(produk.current_stage)}`}
                                                                                >
                                                                                    <svg
                                                                                        className="mr-2 h-4 w-4"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                        />
                                                                                    </svg>
                                                                                    {
                                                                                        produk.current_stage
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <span className="inline-flex items-center rounded-lg border-2 border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500">
                                                                                    <svg
                                                                                        className="mr-2 h-4 w-4"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                        />
                                                                                    </svg>
                                                                                    Belum
                                                                                    Dimulai
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Stage Navigation Controls */}
                                                                <div className="lg:col-span-4">
                                                                    <label className="mb-3 block text-sm font-semibold text-gray-700">
                                                                        Update
                                                                        Tahapan
                                                                    </label>

                                                                    <div className="space-y-3">
                                                                        {/* Current Stage Display */}
                                                                        <div
                                                                            className={`rounded-xl border-2 p-4 ${getProgressBgColor(produk.progress)} border-gray-200 shadow-sm`}
                                                                        >
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <span className="text-xs font-medium text-gray-600">
                                                                                    Tahap
                                                                                    Saat
                                                                                    Ini
                                                                                </span>
                                                                                {produk.current_stage && (
                                                                                    <span className="text-xs font-bold text-indigo-600">
                                                                                        {Object.keys(
                                                                                            stages,
                                                                                        ).indexOf(
                                                                                            produk.current_stage,
                                                                                        ) +
                                                                                            1}{' '}
                                                                                        /{' '}
                                                                                        {
                                                                                            Object.keys(
                                                                                                stages,
                                                                                            )
                                                                                                .length
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="font-bold text-gray-900">
                                                                                {produk.current_stage ||
                                                                                    'Belum Dimulai'}
                                                                            </div>
                                                                            {produk.current_stage && (
                                                                                <div className="mt-1 text-xs text-gray-500">
                                                                                    Bobot:{' '}
                                                                                    {
                                                                                        stages[
                                                                                            produk
                                                                                                .current_stage
                                                                                        ]
                                                                                    }

                                                                                    %
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Next Button Only - No Previous */}
                                                                        <div className="space-y-2">
                                                                            {/* Warning jika ada pending approval */}
                                                                            {produk.has_pending_approval && (
                                                                                <div className="rounded-lg bg-orange-100 border border-orange-300 p-3 text-sm text-orange-800">
                                                                                    ⚠️ Ada perbaikan defect yang menunggu approval. Tidak dapat melanjutkan ke tahap berikutnya.
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Next Button */}
                                                                            <button
                                                                                disabled={
                                                                                    isUpdating ||
                                                                                    produk.has_active_defect ||
                                                                                    produk.has_pending_approval ||
                                                                                    (!!produk.current_stage &&
                                                                                        Object.keys(
                                                                                            stages,
                                                                                        ).indexOf(
                                                                                            produk.current_stage,
                                                                                        ) ===
                                                                                            Object.keys(
                                                                                                stages,
                                                                                            )
                                                                                                .length -
                                                                                                1)
                                                                                }
                                                                                onClick={() => {
                                                                                    const currentIndex =
                                                                                        produk.current_stage
                                                                                            ? Object.keys(
                                                                                                  stages,
                                                                                              ).indexOf(
                                                                                                  produk.current_stage,
                                                                                              )
                                                                                            : -1;
                                                                                    const nextStage =
                                                                                        Object.keys(
                                                                                            stages,
                                                                                        )[
                                                                                            currentIndex +
                                                                                                1
                                                                                        ];
                                                                                    openStageUpdateModal(
                                                                                        produk.id,
                                                                                        nextStage,
                                                                                    );
                                                                                }}
                                                                                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                                                                    isUpdating ||
                                                                                    produk.has_active_defect ||
                                                                                    produk.has_pending_approval ||
                                                                                    (produk.current_stage &&
                                                                                        Object.keys(
                                                                                            stages,
                                                                                        ).indexOf(
                                                                                            produk.current_stage,
                                                                                        ) ===
                                                                                            Object.keys(
                                                                                                stages,
                                                                                            )
                                                                                                .length -
                                                                                                1)
                                                                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                                                        : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md hover:scale-105 hover:from-green-500 hover:to-emerald-600 hover:shadow-lg'
                                                                                }`}
                                                                            >
                                                                                {!produk.current_stage ? 'Mulai Produksi' : 'Next Stage'}
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M9 5l7 7-7 7"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        {produk.can_report_defect && (
                                                                            <div className="mt-4 border-t border-gray-200 pt-4">
                                                                                {produk.has_active_defect ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="flex-1 text-sm font-medium text-orange-600">
                                                                                            ⚠️
                                                                                            Ada
                                                                                            defect
                                                                                            yang
                                                                                            sedang
                                                                                            ditangani
                                                                                        </span>
                                                                                        <Link
                                                                                            href={`/defect-management/${produk.defect_id}`}
                                                                                            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                                                                                        >
                                                                                            Lihat
                                                                                            Defect
                                                                                        </Link>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectedProduk(produk);
                                                                                            setShowDefectModal(produk.id);
                                                                                        }}
                                                                                        className="w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-600 px-4 py-2 font-medium text-white shadow-lg hover:from-red-600 hover:to-orange-700"
                                                                                    >
                                                                                        🔍
                                                                                        Report
                                                                                        Defect
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {showDefectModal === produk.id && (
                                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                                                                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
                                                                                    <div className="p-6">
                                                                                        <h2 className="mb-4 text-2xl font-bold">
                                                                                            Report
                                                                                            Defect
                                                                                            -{' '}
                                                                                            {
                                                                                                selectedProduk?.nama_produk
                                                                                            }
                                                                                        </h2>

                                                                                        <form
                                                                                            onSubmit={
                                                                                                handleSubmitDefect
                                                                                            }
                                                                                        >
                                                                                            <input
                                                                                                type="hidden"
                                                                                                name="item_pekerjaan_produk_id"
                                                                                                value={
                                                                                                    selectedProduk?.id || ''
                                                                                                }
                                                                                            />
                                                                                            <input
                                                                                                type="hidden"
                                                                                                name="qc_stage"
                                                                                                value={
                                                                                                    selectedProduk?.current_stage || ''
                                                                                                }
                                                                                            />

                                                                                            {/* Dynamic Defect Items */}
                                                                                            {defectItems.map(
                                                                                                (
                                                                                                    item,
                                                                                                    index,
                                                                                                ) => (
                                                                                                    <div
                                                                                                        key={
                                                                                                            index
                                                                                                        }
                                                                                                        className="mb-4 rounded-lg border-2 border-gray-200 p-4"
                                                                                                    >
                                                                                                        <div className="mb-2 flex items-center justify-between">
                                                                                                            <h3 className="font-semibold">
                                                                                                                Cacat
                                                                                                                #
                                                                                                                {index +
                                                                                                                    1}
                                                                                                            </h3>
                                                                                                            {defectItems.length >
                                                                                                                1 && (
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() =>
                                                                                                                        removeDefectItem(
                                                                                                                            index,
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="text-red-600 hover:text-red-800"
                                                                                                                >
                                                                                                                    🗑️
                                                                                                                    Hapus
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        <div className="mb-2">
                                                                                                            <label className="mb-1 block text-sm font-medium">
                                                                                                                Foto
                                                                                                                Cacat
                                                                                                            </label>
                                                                                                            <input
                                                                                                                type="file"
                                                                                                                accept="image/*"
                                                                                                                required
                                                                                                                onChange={(e) =>
                                                                                                                    updateDefectItem(
                                                                                                                        index,
                                                                                                                        'photo',
                                                                                                                        e.target.files?.[0] || null,
                                                                                                                    )
                                                                                                                }
                                                                                                                className="w-full rounded-lg border border-gray-300 p-2"
                                                                                                            />
                                                                                                        </div>

                                                                                                        <div>
                                                                                                            <label className="mb-1 block text-sm font-medium">
                                                                                                                Catatan
                                                                                                                Cacat
                                                                                                            </label>
                                                                                                            <textarea
                                                                                                                required
                                                                                                                value={
                                                                                                                    item.notes
                                                                                                                }
                                                                                                                onChange={(
                                                                                                                    e,
                                                                                                                ) =>
                                                                                                                    updateDefectItem(
                                                                                                                        index,
                                                                                                                        'notes',
                                                                                                                        e
                                                                                                                            .target
                                                                                                                            .value,
                                                                                                                    )
                                                                                                                }
                                                                                                                className="w-full rounded-lg border border-gray-300 p-2"
                                                                                                                rows={
                                                                                                                    3
                                                                                                                }
                                                                                                                placeholder="Jelaskan cacat yang ditemukan..."
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ),
                                                                                            )}

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={
                                                                                                    addDefectItem
                                                                                                }
                                                                                                className="mb-4 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 font-medium text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                                                                            >
                                                                                                +
                                                                                                Tambah
                                                                                                Cacat
                                                                                                Lain
                                                                                            </button>

                                                                                            <div className="flex gap-3">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        setShowDefectModal(null);
                                                                                                        setSelectedProduk(null);
                                                                                                    }}
                                                                                                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                                                                                                >
                                                                                                    Batal
                                                                                                </button>
                                                                                                <button
                                                                                                    type="submit"
                                                                                                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                                                                                >
                                                                                                    Submit
                                                                                                    Defect
                                                                                                </button>
                                                                                            </div>
                                                                                        </form>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Stage Progress Modal */}
                                                                    {showStageModal ===
                                                                        produk.id && (
                                                                        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl lg:w-96">
                                                                            <div className="max-h-[800px] overflow-y-auto p-4">
                                                                                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                                                                                    <h4 className="text-sm font-bold text-gray-900">
                                                                                        Pilih
                                                                                        Tahapan
                                                                                    </h4>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            setShowStageModal(
                                                                                                null,
                                                                                            )
                                                                                        }
                                                                                        className="text-gray-400 transition-colors hover:text-gray-600"
                                                                                    >
                                                                                        <svg
                                                                                            className="h-5 w-5"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M6 18L18 6M6 6l12 12"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>

                                                                                <div className="space-y-2 pb-2">
                                                                                    {Object.entries(
                                                                                        stages,
                                                                                    ).map(
                                                                                        (
                                                                                            [
                                                                                                stage,
                                                                                                weight,
                                                                                            ],
                                                                                            index,
                                                                                        ) => {
                                                                                            const isActive =
                                                                                                produk.current_stage ===
                                                                                                stage;
                                                                                            const stageProgress =
                                                                                                Object.keys(
                                                                                                    stages,
                                                                                                ).indexOf(
                                                                                                    stage,
                                                                                                );
                                                                                            const currentProgress =
                                                                                                produk.current_stage
                                                                                                    ? Object.keys(
                                                                                                          stages,
                                                                                                      ).indexOf(
                                                                                                          produk.current_stage,
                                                                                                      )
                                                                                                    : -1;
                                                                                            const isPassed =
                                                                                                stageProgress <
                                                                                                currentProgress;
                                                                                            const isFinalStage =
                                                                                                weight ===
                                                                                                0; // BAST

                                                                                            return (
                                                                                                <button
                                                                                                    key={
                                                                                                        stage
                                                                                                    }
                                                                                                    onClick={() =>
                                                                                                        openStageUpdateModal(
                                                                                                            produk.id,
                                                                                                            stage,
                                                                                                        )
                                                                                                    }
                                                                                                    className={`w-full transform rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.02] ${
                                                                                                        isFinalStage
                                                                                                            ? isActive
                                                                                                                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg ring-2 ring-purple-300'
                                                                                                                : 'border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:shadow-md'
                                                                                                            : isActive
                                                                                                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                                                                              : isPassed
                                                                                                                ? 'border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:shadow-md'
                                                                                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                                                                                                    }`}
                                                                                                >
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div
                                                                                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                                                                                                    isFinalStage
                                                                                                                        ? isActive
                                                                                                                            ? 'bg-white text-purple-600'
                                                                                                                            : 'bg-purple-200 text-purple-700'
                                                                                                                        : isActive
                                                                                                                          ? 'bg-white text-blue-600'
                                                                                                                          : isPassed
                                                                                                                            ? 'bg-green-500 text-white'
                                                                                                                            : 'bg-gray-200 text-gray-600'
                                                                                                                }`}
                                                                                                            >
                                                                                                                {isFinalStage
                                                                                                                    ? '🏁'
                                                                                                                    : isPassed
                                                                                                                      ? '✓'
                                                                                                                      : index +
                                                                                                                        1}
                                                                                                            </div>
                                                                                                            <div className="flex flex-col">
                                                                                                                <span className="font-semibold">
                                                                                                                    {
                                                                                                                        stage
                                                                                                                    }
                                                                                                                </span>
                                                                                                                {isFinalStage && (
                                                                                                                    <span className="text-xs opacity-75">
                                                                                                                        Serah
                                                                                                                        Terima
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div
                                                                                                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                                                                                isFinalStage
                                                                                                                    ? isActive
                                                                                                                        ? 'bg-white/20 text-white'
                                                                                                                        : 'bg-purple-200 text-purple-800'
                                                                                                                    : isActive
                                                                                                                      ? 'bg-white/20 text-white'
                                                                                                                      : isPassed
                                                                                                                        ? 'bg-green-200 text-green-800'
                                                                                                                        : 'bg-gray-200 text-gray-600'
                                                                                                            }`}
                                                                                                        >
                                                                                                            {isFinalStage
                                                                                                                ? '✓ Selesai'
                                                                                                                : `${weight}%`}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </button>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {order.item_pekerjaans.length === 0 && (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white py-16 text-center shadow-lg">
                                <svg
                                    className="mx-auto h-16 w-16 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <h3 className="mt-4 text-lg font-bold text-gray-900">
                                    Belum ada item pekerjaan
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Project ini belum memiliki item pekerjaan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stage Update Modal with Evidence */}
            {showStageUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    📸 Upload Bukti Tahapan
                                </h2>
                                <button
                                    onClick={() => setShowStageUpdateModal(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4 rounded-lg bg-blue-50 p-4">
                                <p className="text-sm text-blue-700">
                                    Update ke tahap: <strong>{showStageUpdateModal.targetStage}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleStageUpdate}>
                                <div className="mb-4">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Foto Bukti Tahapan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={(e) => setStageEvidence(e.target.files?.[0] || null)}
                                        className="w-full rounded-lg border border-gray-300 p-2"
                                    />
                                    {stageEvidence && (
                                        <p className="mt-2 text-sm text-green-600">
                                            ✓ {stageEvidence.name}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Catatan (Opsional)
                                    </label>
                                    <textarea
                                        value={stageNotes}
                                        onChange={(e) => setStageNotes(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 p-2"
                                        rows={3}
                                        placeholder="Tambahkan catatan jika diperlukan..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowStageUpdateModal(null)}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!stageEvidence}
                                        className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                                    >
                                        Update Tahap
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence Viewer Modal */}
            {showEvidenceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                        <div className="p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    📸 Bukti Tahapan: {showEvidenceModal.stage}
                                </h2>
                                <button
                                    onClick={() => setShowEvidenceModal(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {showEvidenceModal.evidences.map((evidence) => (
                                    <div key={evidence.id} className="rounded-xl border-2 border-gray-200 overflow-hidden shadow-md">
                                        <div className="aspect-video bg-gray-100 relative">
                                            <img
                                                src={`/storage/${evidence.evidence_path}`}
                                                alt={`Bukti ${showEvidenceModal.stage}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4 bg-white">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="font-medium">{evidence.uploaded_by}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{evidence.created_at}</span>
                                            </div>
                                            {evidence.notes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-semibold">Catatan:</span> {evidence.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowEvidenceModal(null)}
                                    className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
