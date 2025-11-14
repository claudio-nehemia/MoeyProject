import { FormEventHandler, useEffect } from 'react';

interface TerminModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        kode_tipe: string;
        nama_tipe: string;
        deskripsi: string;
        tahapan: { tahapan: string }[];
    };
    errors: {
        kode_tipe?: string;
        nama_tipe?: string;
        deskripsi?: string;
        tahapan?: string;
    };
    onClose: () => void;
    onSubmit: FormEventHandler;
    onDataChange: (field: string, value: string) => void;
    onTahapanChange: (index: number, value: string) => void;
    onAddTahapan: () => void;
    onRemoveTahapan: (index: number) => void;
    onSetTahapan?: (tahapan: { tahapan: string }[]) => void;
    selectedTerminId?: number | null;
}

export default function TerminModal({
    show,
    editMode,
    processing,
    data,
    errors,
    onClose,
    onSubmit,
    onDataChange,
    onTahapanChange,
    onAddTahapan,
    onRemoveTahapan,
    onSetTahapan,
    selectedTerminId,
}: TerminModalProps) {
    // Fetch data when in edit mode
    useEffect(() => {
        if (editMode && selectedTerminId && show) {
            fetch(`/termin/${selectedTerminId}/edit`)
                .then(res => res.json())
                .then(termin => {
                    onDataChange('kode_tipe', termin.kode_tipe);
                    onDataChange('nama_tipe', termin.nama_tipe);
                    onDataChange('deskripsi', termin.deskripsi || '');
                    
                    // Set tahapan data
                    if (onSetTahapan && termin.tahapan) {
                        onSetTahapan(termin.tahapan);
                    }
                })
                .catch(err => console.error('Error fetching termin:', err));
        }
    }, [editMode, selectedTerminId, show]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
            onClick={onClose}
        >
            <div
                className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
                style={{
                    animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    maxHeight: 'calc(100vh - 2rem)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed */}
                <div className="flex-shrink-0 bg-gradient-to-r from-rose-400 to-rose-600 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {editMode ? (
                                <svg
                                    className="h-5 w-5 text-white sm:h-6 sm:w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-5 w-5 text-white sm:h-6 sm:w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            )}
                            <h3
                                className="text-base font-bold text-white sm:text-xl"
                                style={{
                                    fontFamily: 'Playfair Display, serif',
                                }}
                            >
                                {editMode ? 'Edit Termin' : 'Create New Termin'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-white/80 transition-colors hover:text-white"
                        >
                            <svg
                                className="h-5 w-5 sm:h-6 sm:w-6"
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
                </div>

                {/* Form - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <form
                        onSubmit={onSubmit}
                        className="flex flex-col"
                    >
                        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                            {/* Kode Tipe Field */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-stone-700 sm:text-sm">
                                    Kode Tipe
                                </label>
                                <input
                                    type="text"
                                    value={data.kode_tipe}
                                    onChange={(e) =>
                                        onDataChange('kode_tipe', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-rose-500 sm:px-4 sm:py-2.5"
                                    placeholder="Enter code (e.g., T30, T60)"
                                    disabled={processing}
                                />
                                {errors.kode_tipe && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                                        <svg
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.kode_tipe}
                                    </div>
                                )}
                            </div>

                            {/* Nama Tipe Field */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-stone-700 sm:text-sm">
                                    Nama Tipe
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_tipe}
                                    onChange={(e) =>
                                        onDataChange('nama_tipe', e.target.value)
                                    }
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-rose-500 sm:px-4 sm:py-2.5"
                                    placeholder="Enter type name"
                                    disabled={processing}
                                />
                                {errors.nama_tipe && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                                        <svg
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.nama_tipe}
                                    </div>
                                )}
                            </div>

                            {/* Deskripsi Field */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-stone-700 sm:text-sm">
                                    Deskripsi
                                    <span className="ml-1 font-normal text-stone-400">
                                        (Optional)
                                    </span>
                                </label>
                                <textarea
                                    value={data.deskripsi}
                                    onChange={(e) =>
                                        onDataChange('deskripsi', e.target.value)
                                    }
                                    className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-rose-500 sm:px-4 sm:py-2.5"
                                    placeholder="Enter description (optional)"
                                    disabled={processing}
                                    rows={3}
                                />
                                {errors.deskripsi && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                                        <svg
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.deskripsi}
                                    </div>
                                )}
                            </div>

                            {/* Tahapan Pembayaran */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-stone-700 sm:text-sm">
                                    Tahapan Pembayaran
                                </label>

                                <div className="space-y-2">
                                    {data.tahapan.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 text-xs font-bold text-rose-700">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={item.tahapan}
                                                onChange={(e) =>
                                                    onTahapanChange(index, e.target.value)
                                                }
                                                className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-rose-500"
                                                placeholder={`Tahapan ke-${index + 1}`}
                                                disabled={processing}
                                            />
                                            {data.tahapan.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveTahapan(index)}
                                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                                    disabled={processing}
                                                >
                                                    <svg
                                                        className="h-4 w-4"
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
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={onAddTahapan}
                                    disabled={processing}
                                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    Tambah Tahapan
                                </button>

                                {errors.tahapan && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                                        <svg
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.tahapan}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="flex-shrink-0 border-t border-stone-200 bg-stone-50 p-4 sm:p-6">
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 sm:px-4 sm:py-2.5 sm:text-sm"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-gradient-to-r from-rose-400 to-rose-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:from-rose-500 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : editMode
                                          ? 'Update'
                                          : 'Create'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}