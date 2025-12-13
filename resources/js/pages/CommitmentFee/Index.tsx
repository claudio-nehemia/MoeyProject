import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

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

interface Estimasi {
    id: number;
    estimated_cost: string;
}

interface Moodboard {
    id: number;
    order_id: number;
    status: string;
    order: Order;
    commitmentFee: CommitmentFee | null;
    moodboard_kasar: string | null;
    estimasi: Estimasi | null;
}

interface Props {
    moodboards: Moodboard[];
}

export default function Index({ moodboards }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMoodboard, setSelectedMoodboard] =
        useState<Moodboard | null>(null);
    const [totalFee, setTotalFee] = useState('');
    const [isEditMode, setIsEditMode] = useState(false); 
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    const handleResponse = (moodboard: Moodboard) => {
        if (confirm('Yakin akan membuat response Commitment Fee?')) {
            router.post(
                `/commitment-fee/response/${moodboard.id}`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handleOpenFeeModal = (moodboard: Moodboard, isEdit: boolean = false) => {
        setSelectedMoodboard(moodboard);
        setIsEditMode(isEdit);

        // Perbaikan Type Safety: Gunakan Non-Null Assertion Operator (!)
        if (isEdit && moodboard.commitmentFee?.total_fee !== null) {
            setTotalFee(String(moodboard.commitmentFee!.total_fee));
        } else {
            setTotalFee('');
        }
        
        setShowFeeModal(true);
    };

    const handleSubmitFee = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedMoodboard?.commitmentFee) return;

        const commitmentFeeId = selectedMoodboard.commitmentFee.id;

        // Tentukan endpoint berdasarkan mode
        const endpoint = isEditMode
            ? `/commitment-fee/revise-fee/${commitmentFeeId}`
            : `/commitment-fee/update-fee/${commitmentFeeId}`;

        router.post(
            endpoint,
            {
                total_fee: totalFee,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowFeeModal(false);
                    setTotalFee('');
                    setSelectedMoodboard(null);
                    setIsEditMode(false);
                },
            },
        );
    };

    // FUNGSI BARU UNTUK MERESET FEE SETELAH STATUS COMPLETE
    const handleResetFee = (moodboard: Moodboard) => {
        if (!moodboard.commitmentFee) return;

        if (confirm('PERINGATAN! Tindakan ini akan menghapus total fee, bukti pembayaran, dan mengubah status pembayaran menjadi PENDING (reset). Lanjutkan revisi?')) {
            router.post(
                `/commitment-fee/reset-fee/${moodboard.commitmentFee.id}`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Setelah reset di backend, kita arahkan user untuk mengisi fee lagi
                        router.visit(window.location.pathname, { // Refresh halaman
                            onFinish: () => {
                                // Opsional: Tambahkan notifikasi toast di sini jika Inertia mendukung
                            }
                        });
                    }
                }
            );
        }
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

        router.post(
            `/commitment-fee/upload-payment/${selectedMoodboard.commitmentFee.id}`,
            formData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPaymentModal(false);
                    setPaymentFile(null);
                    setSelectedMoodboard(null);
                },
            },
        );
    };

    const handleImagePreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setShowImagePreview(true);
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A';
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
                <Sidebar
                    isOpen={sidebarOpen}
                    currentPage="commitment"
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="pt-16 lg:pl-64">
                    <div className="px-4 py-8 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Commitment Fee
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Kelola commitment fee untuk moodboard yang sudah
                                approved
                            </p>
                        </div>

                        {/* Moodboard List */}
                        <div className="space-y-4">
                            {moodboards.length === 0 ? (
                                <div className="rounded-lg bg-white p-8 text-center shadow">
                                    <p className="text-gray-500">
                                        Tidak ada moodboard yang sudah approved.
                                    </p>
                                </div>
                            ) : (
                                moodboards.map((moodboard) => (
                                    <div
                                        key={moodboard.id}
                                        className="rounded-lg bg-white shadow transition-shadow hover:shadow-md"
                                    >
                                        <div className="p-6">
                                            {/* Order Info */}
                                            <div className="mb-4 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {
                                                            moodboard.order
                                                                .nama_project
                                                        }
                                                    </h3>
                                                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                                                        <p>
                                                            Customer:{' '}
                                                            <span className="font-medium">
                                                                {
                                                                    moodboard
                                                                        .order
                                                                        .customer_name
                                                                }
                                                            </span>
                                                        </p>
                                                        {moodboard.order
                                                            .company_name && (
                                                            <p>
                                                                Company:{' '}
                                                                <span className="font-medium">
                                                                    {
                                                                        moodboard
                                                                            .order
                                                                            .company_name
                                                                    }
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                {moodboard.commitmentFee && (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                                            moodboard
                                                                .commitmentFee
                                                                .payment_status ===
                                                            'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {moodboard.commitmentFee
                                                            .payment_status ===
                                                        'completed'
                                                            ? 'Completed'
                                                            : 'Pending'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Moodboard Kasar & Estimasi Preview (Tidak Berubah) */}
                                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {/* Moodboard Kasar */}
                                                {moodboard.moodboard_kasar && (
                                                    <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                                                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-900">
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
                                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                />
                                                            </svg>
                                                            Desain Moodboard
                                                            Terpilih
                                                        </p>
                                                        <div
                                                            className="group relative cursor-pointer overflow-hidden rounded-lg"
                                                            onClick={() =>
                                                                handleImagePreview(
                                                                    `/storage/${moodboard.moodboard_kasar}`,
                                                                )
                                                            }
                                                        >
                                                            <img
                                                                src={`/storage/${moodboard.moodboard_kasar}`}
                                                                alt="Moodboard Kasar"
                                                                className="h-48 w-full rounded-lg object-cover shadow-md transition-transform group-hover:scale-110"
                                                            />

                                                            {/* FIXED OVERLAY */}
                                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black opacity-0 transition-opacity group-hover:opacity-40">
                                                                <svg
                                                                    className="h-12 w-12 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100"
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
                                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>

                                                        <p className="mt-2 text-center text-xs text-purple-600">
                                                            Klik untuk
                                                            memperbesar
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Estimasi Cost */}
                                                {moodboard.estimasi && (
                                                    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                                                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
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
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            File Estimasi Biaya
                                                        </p>
                                                        <a
                                                            href={`/storage/${moodboard.estimasi.estimated_cost}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block"
                                                        >
                                                            <div className="rounded-lg border-2 border-blue-300 bg-white p-6 shadow-md transition-shadow hover:border-blue-500 hover:shadow-lg">
                                                                <div className="flex flex-col items-center justify-center gap-3">
                                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                                                                        <svg
                                                                            className="h-8 w-8 text-white"
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
                                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-semibold text-blue-900">
                                                                            File
                                                                            Estimasi
                                                                        </p>
                                                                        <p className="mt-1 text-xs text-blue-600">
                                                                            Klik
                                                                            untuk
                                                                            membuka
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Commitment Fee Details */}
                                            {moodboard.commitmentFee && (
                                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                                        <div>
                                                            <p className="font-medium text-amber-700">
                                                                Response By
                                                            </p>
                                                            <p className="text-gray-900">
                                                                {
                                                                    moodboard
                                                                        .commitmentFee
                                                                        .response_by
                                                                }
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-amber-700">
                                                                Response Time
                                                            </p>
                                                            <p className="text-gray-900">
                                                                {formatDate(
                                                                    moodboard
                                                                        .commitmentFee
                                                                        .response_time,
                                                                )}
                                                            </p>
                                                        </div>
                                                        {/* Perbaikan Type Safety: Cek total_fee !== null */}
                                                        {moodboard.commitmentFee
                                                            .total_fee !== null && (
                                                            <div className="md:col-span-2">
                                                                <p className="font-medium text-amber-700">
                                                                    Total Fee
                                                                </p>
                                                                <p className="text-lg font-semibold text-gray-900">
                                                                    {/* Aman menggunakan ! karena sudah dicek !== null */}
                                                                    {formatCurrency(
                                                                        moodboard.commitmentFee.total_fee!,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-3">
                                                {!moodboard.commitmentFee ? (
                                                    <button
                                                        onClick={() => handleResponse(moodboard)}
                                                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                                                    >
                                                        Response Commitment Fee
                                                    </button>
                                                ) : 
                                                moodboard.commitmentFee.total_fee === null ? (
                                                ) : !moodboard.commitmentFee.total_fee ? (
                                                    <button
                                                        onClick={() => handleOpenFeeModal(moodboard)}
                                                        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                                                    >
                                                        Isi Total Fee
                                                    </button>
                                                ) : moodboard.commitmentFee
                                                      .payment_status ===
                                                      'pending' &&
                                                  !moodboard.commitmentFee
                                                      .payment_proof ? (
                                                    // Tombol Revisi Minor & Upload Pembayaran (saat pending)
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleOpenFeeModal(
                                                                    moodboard,
                                                                    true, // Aktifkan mode edit/revisi minor
                                                                )
                                                            }
                                                            className="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white transition-colors hover:bg-yellow-600"
                                                        >
                                                            Revisi Total Fee
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleOpenPaymentModal(
                                                                    moodboard,
                                                                )
                                                            }
                                                            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                                                        >
                                                            Upload Bukti Pembayaran
                                                        </button>
                                                    </>
                                                ) : (
                                                    // Tombol Reset/Revisi Mayor (saat completed)
                                                    <>
                                                        <a
                                                            href={`/storage/${moodboard.commitmentFee.payment_proof!}`} 
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                                                        >
                                                            Download Bukti Pembayaran
                                                        </a>
                                                        <button
                                                            onClick={() =>
                                                                handleResetFee(moodboard)
                                                            }
                                                            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
                                                        >
                                                            Reset & Revisi Fee
                                                        </button>
                                                ) : (
                                                    <>
                                                        {/* Tombol Cetak Commitment Fee — muncul setelah total_fee terisi */}
                                                        <a
                                                            href={`/commitment-fee/${moodboard.commitmentFee.id}/print`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
                                                        >
                                                            Cetak Commitment Fee
                                                        </a>

                                                        {/* Jika payment_proof belum ada, tampilkan tombol upload */}
                                                        {!moodboard.commitmentFee.payment_proof ? (
                                                            <button
                                                                onClick={() => handleOpenPaymentModal(moodboard)}
                                                                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                                                            >
                                                                Upload Bukti Pembayaran
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <a
                                                                    href={`/storage/${moodboard.commitmentFee.payment_proof}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
                                                                >
                                                                    Download Bukti Pembayaran
                                                                </a>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Image Preview Modal (Tidak Berubah) */}
                {showImagePreview && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setShowImagePreview(false)}
                    >
                        <div className="relative w-full max-w-6xl">
                            <button
                                onClick={() => setShowImagePreview(false)}
                                className="absolute -top-12 right-0 rounded-full bg-white p-2 text-gray-700 shadow-lg transition-colors hover:text-gray-900"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="h-auto max-h-[90vh] w-full rounded-lg object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}

                {/* Fee Modal (Direvisi Judul dan Tombol) */}
                {showFeeModal && selectedMoodboard && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                    >
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                {isEditMode ? 'Revisi Total Fee' : 'Isi Total Fee'} 
                            </h2>
                            <p className="mb-4 text-sm text-gray-600">
                                Project:{' '}
                                <span className="font-medium">
                                    {selectedMoodboard.order.nama_project}
                                </span>
                            </p>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Total Fee (IDR)
                                </label>
                                <input
                                    type="number"
                                    value={totalFee}
                                    onChange={(e) =>
                                        setTotalFee(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Masukkan nominal fee"
                                    min="0"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowFeeModal(false);
                                        setTotalFee('');
                                        setSelectedMoodboard(null);
                                        setIsEditMode(false); // Reset mode
                                    }}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitFee}
                                    className={`flex-1 rounded-lg px-4 py-2 text-white transition-colors ${isEditMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'}`} 
                                >
                                    {isEditMode ? 'Simpan Revisi' : 'Simpan'} 
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal (Tidak Berubah) */}
                {showPaymentModal && selectedMoodboard && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                    >
                        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                                Upload Bukti Pembayaran
                            </h2>
                            <p className="mb-4 text-sm text-gray-600">
                                Project:{' '}
                                <span className="font-medium">
                                    {selectedMoodboard.order.nama_project}
                                </span>
                            </p>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    File Bukti Pembayaran
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setPaymentFile(
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Format: JPG, JPEG, PNG, PDF (Max: 10MB)
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setPaymentFile(null);
                                        setSelectedMoodboard(null);
                                    }}
                                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitPayment}
                                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}