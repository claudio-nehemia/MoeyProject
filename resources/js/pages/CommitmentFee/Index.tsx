import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Order {
    id: number;
    nama_project: string;
    company_name: string | null;
    customer_name: string;
}

interface CommitmentFee {
    id: number;
    total_fee: number | null;
    payment_proof: string | null;
    payment_status: string;
    response_by: string;
    response_time: string;
}

interface Moodboard {
    id: number;
    order_id: number;
    status: string;
    order: Order;
    commitmentFee: CommitmentFee | null;
}

interface Props {
    moodboards: Moodboard[];
}

export default function Index({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
    const [totalFee, setTotalFee] = useState('');
    const [paymentFile, setPaymentFile] = useState<File | null>(null);

    const handleResponse = (moodboard: Moodboard) => {
        if (confirm('Yakin akan membuat response Commitment Fee?')) {
            router.post(`/commitment-fee/response/${moodboard.id}`, {}, {
                preserveScroll: true,
            });
        }
    };

    const handleOpenFeeModal = (moodboard: Moodboard) => {
        setSelectedMoodboard(moodboard);
        setTotalFee('');
        setShowFeeModal(true);
    };

    const handleSubmitFee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMoodboard?.commitmentFee) return;

        router.post(`/commitment-fee/update-fee/${selectedMoodboard.commitmentFee.id}`, {
            total_fee: totalFee,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowFeeModal(false);
                setTotalFee('');
                setSelectedMoodboard(null);
            }
        });
    };

    const handleOpenPaymentModal = (moodboard: Moodboard) => {
        setSelectedMoodboard(moodboard);
        setPaymentFile(null);
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMoodboard?.commitmentFee || !paymentFile) return;

        const formData = new FormData();
        formData.append('payment_proof', paymentFile);

        router.post(`/commitment-fee/upload-payment/${selectedMoodboard.commitmentFee.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowPaymentModal(false);
                setPaymentFile(null);
                setSelectedMoodboard(null);
            }
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title="Commitment Fee" />
            <div className="min-h-screen bg-gray-50">
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <Sidebar isOpen={sidebarOpen} currentPage="commitment" onClose={() => setSidebarOpen(false)} />

                <div className="lg:pl-64 pt-16">
                    <div className="px-4 sm:px-6 lg:px-8 py-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Commitment Fee</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Kelola commitment fee untuk moodboard yang sudah approved
                            </p>
                        </div>

                        {/* Moodboard List */}
                        <div className="space-y-4">
                            {moodboards.length === 0 ? (
                                <div className="bg-white rounded-lg shadow p-8 text-center">
                                    <p className="text-gray-500">Tidak ada moodboard yang sudah approved.</p>
                                </div>
                            ) : (
                                moodboards.map((moodboard) => (
                                    <div key={moodboard.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            {/* Order Info */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {moodboard.order.nama_project}
                                                    </h3>
                                                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                                                        <p>Customer: <span className="font-medium">{moodboard.order.customer_name}</span></p>
                                                        {moodboard.order.company_name && (
                                                            <p>Company: <span className="font-medium">{moodboard.order.company_name}</span></p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Status Badge */}
                                                {moodboard.commitmentFee && (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                        moodboard.commitmentFee.payment_status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {moodboard.commitmentFee.payment_status === 'completed' ? 'Completed' : 'Pending'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Commitment Fee Details */}
                                            {moodboard.commitmentFee && (
                                                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-blue-600 font-medium">Response By</p>
                                                            <p className="text-gray-900">{moodboard.commitmentFee.response_by}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-blue-600 font-medium">Response Time</p>
                                                            <p className="text-gray-900">{formatDate(moodboard.commitmentFee.response_time)}</p>
                                                        </div>
                                                        {moodboard.commitmentFee.total_fee && (
                                                            <div className="md:col-span-2">
                                                                <p className="text-blue-600 font-medium">Total Fee</p>
                                                                <p className="text-gray-900 text-lg font-semibold">
                                                                    {formatCurrency(moodboard.commitmentFee.total_fee)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-3">
                                                {!moodboard.commitmentFee ? (
                                                    // State 1: No response yet
                                                    <button
                                                        onClick={() => handleResponse(moodboard)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Response Commitment Fee
                                                    </button>
                                                ) : !moodboard.commitmentFee.total_fee ? (
                                                    // State 2: Response created, need to fill fee
                                                    <button
                                                        onClick={() => handleOpenFeeModal(moodboard)}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                    >
                                                        Isi Total Fee
                                                    </button>
                                                ) : !moodboard.commitmentFee.payment_proof ? (
                                                    // State 3: Fee filled, need to upload payment proof
                                                    <button
                                                        onClick={() => handleOpenPaymentModal(moodboard)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        Upload Bukti Pembayaran
                                                    </button>
                                                ) : (
                                                    // State 4: Completed
                                                    <a
                                                        href={`/storage/${moodboard.commitmentFee.payment_proof}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Download Bukti Pembayaran
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Fee Modal */}
                {showFeeModal && selectedMoodboard && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Isi Total Fee</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Project: <span className="font-medium">{selectedMoodboard.order.nama_project}</span>
                            </p>
                            <form onSubmit={handleSubmitFee}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Total Fee (IDR)
                                    </label>
                                    <input
                                        type="number"
                                        value={totalFee}
                                        onChange={(e) => setTotalFee(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Masukkan nominal fee"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowFeeModal(false);
                                            setTotalFee('');
                                            setSelectedMoodboard(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedMoodboard && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Bukti Pembayaran</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Project: <span className="font-medium">{selectedMoodboard.order.nama_project}</span>
                            </p>
                            <form onSubmit={handleSubmitPayment}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File Bukti Pembayaran
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Format: JPG, JPEG, PNG, PDF (Max: 10MB)
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            setPaymentFile(null);
                                            setSelectedMoodboard(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Upload
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
