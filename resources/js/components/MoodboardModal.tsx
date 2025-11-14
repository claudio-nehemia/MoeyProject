import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Team {
    id: number;
    name: string;
    role: string;
}

interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    response_time: string;
    response_by: string;
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
}

interface Order {
    id: number;
    nama_project: string;
    moodboard: Moodboard | null;
    team: Team[];
}

interface Props {
    show: boolean;
    order: Order;
    mode: 'create' | 'upload-kasar' | 'upload-final' | 'revise';
    onClose: () => void;
}

export default function MoodboardModal({ show, order, mode, onClose }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'create') {
                console.log('Mode: create, Order ID:', order.id);
                router.post(`/moodboard/response/${order.id}`, {}, {
                    onFinish: () => {
                        setLoading(false);
                        onClose();
                    }
                });
            } else if (mode === 'upload-kasar' && files.length > 0) {
                console.log('Mode: upload-kasar, Moodboard ID:', order.moodboard!.id, 'Files:', files.length);
                const formData = new FormData();
                formData.append('moodboard_id', order.moodboard!.id.toString());
                
                // Append multiple files
                files.forEach((file, index) => {
                    formData.append('moodboard_kasar[]', file);
                });

                router.post('/moodboard/desain-kasar', formData as any, {
                    onSuccess: () => {
                        console.log('Upload kasar success');
                        router.visit('/moodboard');
                    },
                    onError: (errors: any) => {
                        console.error('Upload kasar error:', errors);
                        alert('Gagal upload desain kasar: ' + JSON.stringify(errors));
                        setLoading(false);
                    },
                    onFinish: () => {
                        setLoading(false);
                    }
                });
            } else if (mode === 'upload-final' && files.length > 0) {
                console.log('Mode: upload-final, Moodboard ID:', order.moodboard!.id, 'File:', files[0].name);
                const formData = new FormData();
                formData.append('moodboard_final', files[0]);

                router.post(`/moodboard/desain-final/${order.moodboard!.id}`, formData as any, {
                    onSuccess: () => {
                        console.log('Upload final success');
                        router.visit('/moodboard');
                    },
                    onError: (errors: any) => {
                        console.error('Upload final error:', errors);
                        alert('Gagal upload desain final: ' + JSON.stringify(errors));
                        setLoading(false);
                    },
                    onFinish: () => {
                        setLoading(false);
                    }
                });
            } else if (mode === 'revise' && notes) {
                console.log('Mode: revise, Moodboard ID:', order.moodboard!.id, 'Notes:', notes);
                router.post(`/moodboard/revise/${order.moodboard!.id}`, { notes }, {
                    onFinish: () => {
                        setLoading(false);
                        onClose();
                    }
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    if (!show) return null;

    const getTitleAndDesc = () => {
        switch (mode) {
            case 'create':
                return {
                    title: 'Buat Moodboard',
                    description: 'Mulai proses review desain untuk project ini',
                    icon: 'M12 4v16m8-8H4',
                };
            case 'upload-kasar':
                return {
                    title: 'Upload Desain Kasar',
                    description: 'Unggah file desain kasar untuk review',
                    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5',
                };
            case 'upload-final':
                return {
                    title: 'Upload Desain Final',
                    description: 'Unggah file desain final yang sudah disetujui',
                    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                };
            case 'revise':
                return {
                    title: 'Minta Revisi',
                    description: 'Berikan catatan untuk revisi desain',
                    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
                };
        }
    };

    const { title, description, icon } = getTitleAndDesc();

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen sm:max-h-none overflow-y-auto sm:overflow-visible">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-white">{title}</h2>
                            <p className="text-xs text-violet-100 mt-0.5">{order.nama_project}</p>
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
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    {/* Description */}
                    <p className="text-xs sm:text-sm text-stone-600">{description}</p>

                    {/* Create Mode */}
                    {mode === 'create' && (
                        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-violet-900">
                                Moodboard akan dibuat dan siap untuk menerima upload desain kasar.
                            </p>
                        </div>
                    )}

                    {/* File Upload Modes */}
                    {(mode === 'upload-kasar' || mode === 'upload-final') && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                {mode === 'upload-kasar' ? 'Desain Kasar (Multiple Files)' : 'Desain Final'}
                            </label>
                            <div className="relative border-2 border-dashed border-violet-300 rounded-lg p-4 sm:p-6 text-center hover:border-violet-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    multiple={mode === 'upload-kasar'}
                                    required
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {files.length > 0 ? (
                                        <div className="text-center">
                                            <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-xs sm:text-sm font-medium text-emerald-700">
                                                {files.length} file{files.length > 1 ? 's' : ''} dipilih
                                            </p>
                                            <div className="mt-2 max-h-24 overflow-y-auto">
                                                {files.map((f, idx) => (
                                                    <p key={idx} className="text-xs text-stone-600">
                                                        {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <svg className="w-8 h-8 text-violet-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                            </svg>
                                            <p className="text-xs sm:text-sm font-medium text-stone-900">
                                                Drag & drop atau klik untuk upload
                                            </p>
                                            <p className="text-xs text-stone-500 mt-1">JPG, PNG, PDF (Max 10MB)</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Revise Mode */}
                    {mode === 'revise' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                Catatan Revisi
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Jelaskan bagian mana yang perlu direvisi..."
                                required
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none h-24 sm:h-28"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (mode === 'upload-kasar' && files.length === 0) || (mode === 'upload-final' && files.length === 0) || (mode === 'revise' && !notes)}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : mode === 'create' ? 'Buat Moodboard' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
