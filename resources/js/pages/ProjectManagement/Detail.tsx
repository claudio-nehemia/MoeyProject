import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

type StageMap = Record<string, number>;

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

export default function Detail({
    order,
    stages,
}: {
    order: Order;
    stages: StageMap;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [updatingProduk, setUpdatingProduk] = useState<number | null>(null);
    const [animatedProgress, setAnimatedProgress] = useState<{[key: number]: number}>({});
    const [showStageModal, setShowStageModal] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const progress: {[key: number]: number} = {};
            order.item_pekerjaans.forEach(item => {
                item.produks.forEach(produk => {
                    progress[produk.id] = produk.progress;
                });
            });
            setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
    }, [order]);

    const updateStage = (produkId: number, stage: string) => {
        setUpdatingProduk(produkId);
        setShowStageModal(null);
        router.post(`/produk/${produkId}/update-stage`, {
            current_stage: stage,
        }, {
            onFinish: () => {
                setTimeout(() => setUpdatingProduk(null), 500);
            }
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
        if (progress >= 100) return 'bg-gradient-to-br from-emerald-50 to-green-100';
        if (progress >= 75) return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        if (progress >= 50) return 'bg-gradient-to-br from-yellow-50 to-orange-100';
        if (progress >= 25) return 'bg-gradient-to-br from-orange-50 to-red-100';
        if (progress > 0) return 'bg-gradient-to-br from-pink-50 to-rose-100';
        return 'bg-gradient-to-br from-gray-50 to-gray-100';
    };

    const getStageColor = (stage?: string | null) => {
        if (!stage) return 'bg-gray-100 text-gray-600 border-gray-200';
        const stageIndex = Object.keys(stages).indexOf(stage);
        const totalStages = Object.keys(stages).length;
        const progress = ((stageIndex + 1) / totalStages) * 100;
        
        if (progress >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-green-600';
        if (progress >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-indigo-600';
        if (progress >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-orange-500';
        if (progress >= 25) return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-red-500';
        return 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-rose-600';
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Detail Project - ${order.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="project-management" onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.get('/project-management')}
                                className="mb-6 inline-flex items-center px-5 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold text-sm text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 hover:scale-105 transform transition-all duration-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Kembali
                            </button>
                            
                            <div className={`${getProgressBgColor(order.progress)} rounded-2xl shadow-xl p-8 border-2 border-gray-200 relative overflow-hidden`}>
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center mb-4">
                                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse mr-3" />
                                        <h1 className="text-4xl font-bold text-gray-900">{order.nama_project}</h1>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Perusahaan</p>
                                            <p className="text-lg font-bold text-gray-900">{order.company_name}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Customer</p>
                                            <p className="text-lg font-bold text-gray-900">{order.customer_name}</p>
                                        </div>
                                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md">
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Total Progress</p>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1">
                                                    <div className="w-full bg-white/60 rounded-full h-5 overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${getProgressColor(order.progress)} transition-all duration-1000 ease-out relative overflow-hidden`}
                                                            style={{ width: `${order.progress}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-2xl font-bold bg-gradient-to-r ${getProgressColor(order.progress)} bg-clip-text text-transparent min-w-[70px]`}>
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
                                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transform hover:scale-[1.01] transition-all duration-300"
                                    style={{
                                        animation: `slideInUp 0.5s ease-out ${itemIndex * 0.1}s backwards`
                                    }}
                                >
                                    <div className={`${getProgressBgColor(item.progress)} px-6 py-5 border-b border-gray-200 relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    Item Pekerjaan #{itemIndex + 1}
                                                </h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {item.produks.length} Produk
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-600 mb-1">Progress Item</p>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-40 bg-white/50 rounded-full h-4 backdrop-blur-sm overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full bg-gradient-to-r ${getProgressColor(item.progress)} transition-all duration-1000 ease-out relative overflow-hidden`}
                                                                style={{ width: `${item.progress}%` }}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                                                            </div>
                                                        </div>
                                                        <span className={`text-lg font-bold bg-gradient-to-r ${getProgressColor(item.progress)} bg-clip-text text-transparent min-w-[60px]`}>
                                                            {item.progress.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Produk List */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {item.produks.map((produk, produkIndex) => {
                                                const isUpdating = updatingProduk === produk.id;
                                                const progress = animatedProgress[produk.id] ?? 0;
                                                
                                                return (
                                                    <div
                                                        key={produk.id}
                                                        className={`${getProgressBgColor(produk.progress)} rounded-xl border-2 ${isUpdating ? 'border-blue-500 scale-[1.02]' : 'border-transparent'} p-6 transition-all duration-300 hover:shadow-xl group relative overflow-hidden`}
                                                        style={{
                                                            animation: `fadeIn 0.4s ease-out ${produkIndex * 0.1}s backwards`
                                                        }}
                                                    >
                                                        {/* Decorative background */}
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                                                        
                                                        {/* Loading overlay */}
                                                        {isUpdating && (
                                                            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                                                                <div className="bg-white rounded-full p-3 shadow-lg">
                                                                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                                                            {/* Produk Info */}
                                                            <div className="lg:col-span-5">
                                                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                                    <span className={`w-2 h-2 rounded-full mr-2 ${produk.progress > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                                    {produk.nama_produk}
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center text-gray-700 bg-white/50 rounded-lg px-3 py-2">
                                                                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                        </svg>
                                                                        <span className="text-sm">Qty:</span>
                                                                        <span className="font-bold ml-2">{produk.quantity}</span>
                                                                    </div>
                                                                    <div className="flex items-center text-gray-700 bg-white/50 rounded-lg px-3 py-2">
                                                                        <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                                        </svg>
                                                                        <span className="text-sm">Dimensi:</span>
                                                                        <span className="font-bold ml-2">{produk.dimensi} cm</span>
                                                                    </div>
                                                                    <div className="flex items-center text-gray-700 bg-white/50 rounded-lg px-3 py-2">
                                                                        <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <span className="text-sm">Harga:</span>
                                                                        <span className="font-bold ml-2">{formatRupiah(produk.total_harga)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Progress */}
                                                            <div className="lg:col-span-3">
                                                                <p className="text-sm font-semibold text-gray-700 mb-3">Progress & Kontribusi</p>
                                                                <div className="space-y-3">
                                                                    {/* Contribution Comparison */}
                                                                    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-xl p-3 border-2 border-indigo-200 shadow-sm">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-semibold text-indigo-700 flex items-center">
                                                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                                </svg>
                                                                                Kontribusi ke Progress Item
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Visual Bar Comparison */}
                                                                        <div className="relative h-8 bg-white/60 rounded-lg overflow-hidden backdrop-blur-sm">
                                                                            {/* Max Weight Background */}
                                                                            <div 
                                                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-200 to-purple-200 border-r-2 border-indigo-300 border-dashed"
                                                                                style={{ width: `${Math.min(produk.weight_percentage, 100)}%` }}
                                                                            >
                                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-700">
                                                                                    {produk.weight_percentage.toFixed(1)}%
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Actual Contribution */}
                                                                            <div 
                                                                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(produk.progress)} transition-all duration-1000 ease-out`}
                                                                                style={{ width: `${Math.min(produk.actual_contribution, 100)}%` }}
                                                                            >
                                                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Legend */}
                                                                        <div className="flex items-center justify-between mt-2 text-xs">
                                                                            <div className="flex items-center space-x-3">
                                                                                <div className="flex items-center">
                                                                                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-200 to-purple-200 border border-indigo-300 mr-1.5"></div>
                                                                                    <span className="text-gray-600">Maks</span>
                                                                                </div>
                                                                                <div className="flex items-center">
                                                                                    <div className={`w-3 h-3 rounded-sm bg-gradient-to-r ${getProgressColor(produk.progress)} mr-1.5`}></div>
                                                                                    <span className="text-gray-600">Tercapai</span>
                                                                                </div>
                                                                            </div>
                                                                            <span className={`font-bold px-2 py-0.5 rounded-md ${getProgressColor(produk.progress)} bg-gradient-to-r bg-clip-text text-transparent`}>
                                                                                {produk.actual_contribution.toFixed(1)}% / {produk.weight_percentage.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Progress Produk Bar */}
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="flex-1 bg-white/60 rounded-full h-4 backdrop-blur-sm overflow-hidden shadow-inner">
                                                                            <div
                                                                                className={`h-full bg-gradient-to-r ${getProgressColor(produk.progress)} transition-all duration-1000 ease-out relative overflow-hidden`}
                                                                                style={{ width: `${progress}%` }}
                                                                            >
                                                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-shimmer" />
                                                                            </div>
                                                                        </div>
                                                                        <span className={`text-xl font-bold bg-gradient-to-r ${getProgressColor(produk.progress)} bg-clip-text text-transparent min-w-[60px]`}>
                                                                            {produk.progress}%
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {/* Current Stage Badge */}
                                                                    {produk.current_stage ? (
                                                                        <div>
                                                                            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-md transform hover:scale-105 transition-transform ${getStageColor(produk.current_stage)}`}>
                                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                {produk.current_stage}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-500 border-2 border-gray-200">
                                                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                Belum Dimulai
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Stage Navigation Controls */}
                                                            <div className="lg:col-span-4">
                                                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                                    Update Tahapan
                                                                </label>
                                                                
                                                                <div className="space-y-3">
                                                                    {/* Current Stage Display */}
                                                                    <div className={`p-4 rounded-xl border-2 ${getProgressBgColor(produk.progress)} border-gray-200 shadow-sm`}>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-medium text-gray-600">Tahap Saat Ini</span>
                                                                            {produk.current_stage && (
                                                                                <span className="text-xs font-bold text-indigo-600">
                                                                                    {Object.keys(stages).indexOf(produk.current_stage) + 1} / {Object.keys(stages).length}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="font-bold text-gray-900">
                                                                            {produk.current_stage || 'Belum Dimulai'}
                                                                        </div>
                                                                        {produk.current_stage && (
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                Bobot: {stages[produk.current_stage]}%
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Navigation Buttons */}
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {/* Previous Button */}
                                                                        <button
                                                                            disabled={isUpdating || !produk.current_stage || Object.keys(stages).indexOf(produk.current_stage) === 0}
                                                                            onClick={() => {
                                                                                const currentIndex = produk.current_stage ? Object.keys(stages).indexOf(produk.current_stage) : -1;
                                                                                if (currentIndex > 0) {
                                                                                    const prevStage = Object.keys(stages)[currentIndex - 1];
                                                                                    updateStage(produk.id, prevStage);
                                                                                }
                                                                            }}
                                                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                                                                isUpdating || !produk.current_stage || Object.keys(stages).indexOf(produk.current_stage) === 0
                                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                    : 'bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600 hover:scale-105 shadow-md hover:shadow-lg'
                                                                            }`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                            </svg>
                                                                            Previous
                                                                        </button>

                                                                        {/* Next Button */}
                                                                        <button
                                                                            disabled={isUpdating || (!!produk.current_stage && Object.keys(stages).indexOf(produk.current_stage) === Object.keys(stages).length - 1)}
                                                                            onClick={() => {
                                                                                const currentIndex = produk.current_stage ? Object.keys(stages).indexOf(produk.current_stage) : -1;
                                                                                const nextStage = Object.keys(stages)[currentIndex + 1];
                                                                                updateStage(produk.id, nextStage);
                                                                            }}
                                                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                                                                isUpdating || (produk.current_stage && Object.keys(stages).indexOf(produk.current_stage) === Object.keys(stages).length - 1)
                                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                    : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 hover:scale-105 shadow-md hover:shadow-lg'
                                                                            }`}
                                                                        >
                                                                            Next
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Stage Progress Modal */}
                                                                {showStageModal === produk.id && (
                                                                    <div className="absolute z-30 mt-2 w-full lg:w-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
                                                                        <div className="p-4 max-h-[800px] overflow-y-auto">
                                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                                                            <h4 className="text-sm font-bold text-gray-900">Pilih Tahapan</h4>
                                                                            <button 
                                                                                onClick={() => setShowStageModal(null)}
                                                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-2 pb-2">
                                                                            {Object.entries(stages).map(([stage, weight], index) => {
                                                                                const isActive = produk.current_stage === stage;
                                                                                const stageProgress = Object.keys(stages).indexOf(stage);
                                                                                const currentProgress = produk.current_stage ? Object.keys(stages).indexOf(produk.current_stage) : -1;
                                                                                const isPassed = stageProgress < currentProgress;
                                                                                const isFinalStage = weight === 0; // BAST
                                                                                
                                                                                return (
                                                                                    <button
                                                                                        key={stage}
                                                                                        onClick={() => updateStage(produk.id, stage)}
                                                                                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                                                                                            isFinalStage
                                                                                                ? isActive
                                                                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg ring-2 ring-purple-300'
                                                                                                    : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:shadow-md border-2 border-purple-200 border-dashed'
                                                                                                : isActive 
                                                                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                                                                                                    : isPassed
                                                                                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:shadow-md border border-green-200'
                                                                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                                                                    isFinalStage
                                                                                                        ? isActive
                                                                                                            ? 'bg-white text-purple-600'
                                                                                                            : 'bg-purple-200 text-purple-700'
                                                                                                        : isActive 
                                                                                                            ? 'bg-white text-blue-600' 
                                                                                                            : isPassed
                                                                                                            ? 'bg-green-500 text-white'
                                                                                                            : 'bg-gray-200 text-gray-600'
                                                                                                }`}>
                                                                                                    {isFinalStage ? '🏁' : isPassed ? '✓' : index + 1}
                                                                                                </div>
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-semibold">{stage}</span>
                                                                                                    {isFinalStage && (
                                                                                                        <span className="text-xs opacity-75">Serah Terima</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                                                isFinalStage
                                                                                                    ? isActive
                                                                                                        ? 'bg-white/20 text-white'
                                                                                                        : 'bg-purple-200 text-purple-800'
                                                                                                    : isActive 
                                                                                                        ? 'bg-white/20 text-white' 
                                                                                                        : isPassed
                                                                                                        ? 'bg-green-200 text-green-800'
                                                                                                        : 'bg-gray-200 text-gray-600'
                                                                                            }`}>
                                                                                                {isFinalStage ? '✓ Selesai' : `${weight}%`}
                                                                                            </div>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {order.item_pekerjaans.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-4 text-lg font-bold text-gray-900">Belum ada item pekerjaan</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Project ini belum memiliki item pekerjaan.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
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
