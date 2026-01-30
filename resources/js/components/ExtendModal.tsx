import { router } from '@inertiajs/react';
import React, { useState } from 'react';

interface ExtendModalProps {
    orderId: number;
    tahap: string;
    taskResponse: any; // Tambah ini
    isMarketing: boolean; // Tambah ini
    onClose: () => void;
}

export default function ExtendModal({
    orderId,
    tahap,
    taskResponse,
    isMarketing,
    onClose,
    refetchTaskResponses,
}: ExtendModalProps & { refetchTaskResponses?: () => void }) {
    const [days, setDays] = useState<number>(1);
    const [reason, setReason] = useState<string>('');
    const [errors, setErrors] = useState<{ days?: string; reason?: string }>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tahapNames: Record<string, string> = {
        survey: 'Survey',
        moodboard: 'Moodboard',
        estimasi: 'Estimasi',
        cm_fee: 'Commitment Fee',
        approval_design: 'Approval Design',
        desain_final: 'Desain Final',
        item_pekerjaan: 'Item Pekerjaan',
        rab_internal: 'RAB Internal',
        kontrak: 'Kontrak',
        invoice: 'Invoice',
        survey_schedule: 'Survey Schedule',
        survey_ulang: 'Survey Ulang',
        gambar_kerja: 'Gambar Kerja',
        approval_material: 'Approval Material',
        workplan: 'Workplan',
        produksi: 'Produksi',
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { days?: string; reason?: string } = {};

        if (!days || days < 1 || days > 30) {
            newErrors.days = 'Hari harus antara 1-30 hari';
        }

        if (!reason.trim()) {
            newErrors.reason = 'Alasan perpanjangan wajib diisi';
        } else if (reason.trim().length < 10) {
            newErrors.reason = 'Alasan minimal 10 karakter';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        router.post(
            `/task-response/${orderId}/${tahap}/extend`,
            {
                days,
                reason: reason.trim(),
                is_marketing: isMarketing,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (refetchTaskResponses) refetchTaskResponses();
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors as any);
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Minta Perpanjangan - {tahapNames[tahap] || tahap}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 transition-colors hover:text-gray-500"
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
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            {/* Days Input */}
                            <div>
                                <label
                                    htmlFor="days"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Tambah Hari{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="days"
                                    min="1"
                                    max="30"
                                    value={days}
                                    onChange={(e) => {
                                        const value =
                                            parseInt(e.target.value) || 1;
                                        setDays(
                                            Math.max(1, Math.min(30, value)),
                                        );
                                        if (errors.days) {
                                            setErrors({
                                                ...errors,
                                                days: undefined,
                                            });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                                        errors.days
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan jumlah hari (1-30)"
                                    disabled={isSubmitting}
                                />
                                {errors.days && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.days}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Maksimal 30 hari per perpanjangan
                                </p>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label
                                    htmlFor="reason"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Alasan Perpanjangan{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (errors.reason) {
                                            setErrors({
                                                ...errors,
                                                reason: undefined,
                                            });
                                        }
                                    }}
                                    className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                                        errors.reason
                                            ? 'border-red-500'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Jelaskan alasan mengapa perlu perpanjangan deadline..."
                                    disabled={isSubmitting}
                                />
                                {errors.reason && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.reason}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimal 10 karakter. {reason.length}/500
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || !reason.trim() || days < 1
                                }
                                className="flex items-center gap-2 rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting && (
                                    <svg
                                        className="h-4 w-4 animate-spin text-white"
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
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                )}
                                {isSubmitting
                                    ? 'Mengirim...'
                                    : 'Ajukan Perpanjangan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
