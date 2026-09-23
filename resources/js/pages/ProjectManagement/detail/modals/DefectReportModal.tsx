import React from 'react';
import { Search, Trash2, Camera, FileEdit, Plus } from 'lucide-react';
import { Produk } from '../types';

interface DefectReportModalProps {
    selectedProduk: Produk;
    defectItems: Array<{ photo: File | null; notes: string }>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onUpdateItem: (index: number, field: 'photo' | 'notes', value: any) => void;
}

export const DefectReportModal: React.FC<DefectReportModalProps> = ({
    selectedProduk,
    defectItems,
    onClose,
    onSubmit,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Search className="w-6 h-6 text-red-600" />
                            Report Defect - {selectedProduk.nama_produk}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 transition-colors hover:text-gray-600"
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

                    <div className="mb-4 rounded-lg bg-red-50 p-3">
                        <p className="text-sm text-red-700">
                            <strong>QC Stage:</strong> {selectedProduk.current_stage || 'Belum Dimulai'}
                        </p>
                    </div>

                    <form onSubmit={onSubmit}>
                        <input
                            type="hidden"
                            name="item_pekerjaan_produk_id"
                            value={selectedProduk.id}
                        />
                        <input
                            type="hidden"
                            name="qc_stage"
                            value={selectedProduk.current_stage || ''}
                        />

                        {defectItems.map((item, index) => (
                            <div
                                key={index}
                                className="mb-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-4"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Cacat #{index + 1}
                                    </h3>
                                    {defectItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveItem(index)}
                                            className="text-red-600 transition-colors hover:text-red-800 inline-flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Hapus</span>
                                        </button>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <Camera className="w-4 h-4 text-slate-500" />
                                        <span>Foto Cacat *</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={(e) =>
                                            onUpdateItem(
                                                index,
                                                'photo',
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                        <FileEdit className="w-4 h-4 text-slate-500" />
                                        <span>Catatan Cacat *</span>
                                    </label>
                                    <textarea
                                        required
                                        value={item.notes}
                                        onChange={(e) =>
                                            onUpdateItem(index, 'notes', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white p-2 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        rows={3}
                                        placeholder="Jelaskan cacat yang ditemukan..."
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={onAddItem}
                            className="mb-6 w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 font-medium text-gray-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 inline-flex items-center justify-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Cacat Lain</span>
                        </button>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-orange-700"
                            >
                                Submit Defect
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
