import React from 'react';
import { Camera } from 'lucide-react';
import { StageEvidence } from '../types';

interface EvidenceViewerModalProps {
    stage: string;
    evidences: StageEvidence[];
    onClose: () => void;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
    stage,
    evidences,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Camera className="w-6 h-6 text-blue-600" />
                            <span>Bukti Tahapan: {stage}</span>
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

                    <div className="flex flex-row overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-gray-300">
                        {evidences.map((evidence) => (
                            <div
                                key={evidence.id}
                                className="w-80 flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 shadow-md"
                            >
                                <div className="relative aspect-video bg-gray-100">
                                    <img
                                        src={`/storage/${evidence.evidence_path}`}
                                        alt={`Bukti ${stage}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="bg-white p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
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
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span className="font-medium">
                                            {evidence.uploaded_by}
                                        </span>
                                    </div>
                                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
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
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>{evidence.created_at}</span>
                                    </div>
                                    {evidence.notes && (
                                        <div className="mt-3 rounded-lg bg-gray-50 p-3">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-semibold">Catatan:</span>{' '}
                                                {evidence.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
