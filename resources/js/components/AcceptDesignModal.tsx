import { useState } from 'react';
import { router } from '@inertiajs/react';

interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface Moodboard {
    id: number;
    kasar_files: MoodboardFile[];
}

interface Order {
    id: number;
    nama_project: string;
    moodboard: Moodboard;
}

interface Props {
    show: boolean;
    order: Order;
    onClose: () => void;
}

export default function AcceptDesignModal({ show, order, onClose }: Props) {
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAccept = () => {
        if (!selectedFileId) {
            alert('Pilih file moodboard kasar yang ingin di-approve');
            return;
        }

        setLoading(true);
        router.post(`/moodboard/accept/${order.moodboard.id}`, {
            moodboard_file_id: selectedFileId,
        }, {
            onSuccess: () => {
                setLoading(false);
                onClose();
            },
            onError: (errors: any) => {
                console.error('Accept error:', errors);
                alert('Gagal approve desain: ' + JSON.stringify(errors));
                setLoading(false);
            },
        });
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">Approve Desain Kasar</h2>
                            <p className="text-xs text-emerald-100 mt-0.5">{order.nama_project}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    <p className="text-sm text-stone-600 mb-4">
                        Pilih file desain kasar yang ingin Anda approve. File yang dipilih akan menjadi desain utama yang akan digunakan untuk proses selanjutnya.
                    </p>

                    {/* File Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {order.moodboard.kasar_files.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => setSelectedFileId(file.id)}
                                className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                                    selectedFileId === file.id
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-stone-200 hover:border-emerald-300'
                                }`}
                            >
                                <div className="relative">
                                    {/* Preview Image */}
                                    <img
                                        src={file.url}
                                        alt={file.original_name}
                                        className="w-full h-40 object-cover rounded-lg mb-2"
                                    />
                                    
                                    {/* Selected Indicator */}
                                    {selectedFileId === file.id && (
                                        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <p className="text-xs font-medium text-stone-900 truncate">
                                    {file.original_name}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={loading || !selectedFileId}
                            className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : 'Approve Desain'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
