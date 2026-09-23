import React from 'react';
import { Camera } from 'lucide-react';

interface StageUpdateModalProps {
    targetStage: string;
    stageEvidence: File | null;
    stageNotes: string;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onEvidenceChange: (file: File | null) => void;
    onNotesChange: (notes: string) => void;
}

export const StageUpdateModal: React.FC<StageUpdateModalProps> = ({
    targetStage,
    stageEvidence,
    stageNotes,
    onClose,
    onSubmit,
    onEvidenceChange,
    onNotesChange,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-600" />
                            <span>Upload Bukti Tahapan</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
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

                    <div className="mb-4 rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-blue-700">
                            Update ke tahap: <strong>{targetStage}</strong>
                        </p>
                    </div>

                    <form onSubmit={onSubmit}>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Foto Bukti Tahapan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={(e) => onEvidenceChange(e.target.files?.[0] || null)}
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
                                Catatan Progress (Opsional)
                            </label>
                            <textarea
                                value={stageNotes}
                                onChange={(e) => onNotesChange(e.target.value)}
                                rows={3}
                                placeholder="Masukkan catatan mengenai pengerjaan tahapan ini..."
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={!stageEvidence}
                                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                Simpan Progress
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
