import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Team {
    id: number;
    name: string;
    role: string;
}

interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    kasar_files: MoodboardFile[];
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
    mode: 'create' | 'upload-kasar' | 'revise';
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

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
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
                files.forEach((file) => {
                    formData.append('moodboard_kasar[]', file);
                });

                router.post('/moodboard/desain-kasar', formData as any, {
                    onSuccess: () => {
                        console.log('Upload kasar success');
                        setFiles([]);
                        onClose();
                    },
                    onError: (errors: any) => {
                        console.error('Upload kasar error:', errors);
                        alert('Gagal upload desain kasar: ' + JSON.stringify(errors));
                    },
                    onFinish: () => {
                        setLoading(false);
                    },
                    preserveScroll: true,
                });
            } else if (mode === 'revise' && notes) {
                console.log('Mode: revise, Moodboard ID:', order.moodboard!.id, 'Notes:', notes);
                router.post(`/moodboard/revise/${order.moodboard!.id}`, { notes }, {
                    onFinish: () => {
                        setLoading(false);
                        setNotes('');
                        onClose();
                    },
                    preserveScroll: true,
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
                    description: order.moodboard?.kasar_files && order.moodboard.kasar_files.length > 0 
                        ? `Tambah file baru ke ${order.moodboard.kasar_files.length} file yang sudah ada`
                        : 'Unggah file desain kasar untuk review',
                    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between sticky top-0 z-10">
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

                    {/* Existing Files Info (for upload-kasar mode) */}
                    {mode === 'upload-kasar' && order.moodboard?.kasar_files && order.moodboard.kasar_files.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-2">
                                📁 File yang sudah ada: {order.moodboard.kasar_files.length}
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {order.moodboard.kasar_files.map((file, idx) => (
                                    <div key={file.id} className="text-xs text-blue-700 flex items-center gap-1">
                                        <span className="font-medium">#{idx + 1}</span>
                                        <span className="truncate">{file.original_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Mode */}
                    {mode === 'create' && (
                        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 sm:p-4">
                            <p className="text-xs sm:text-sm text-violet-900">
                                Moodboard akan dibuat dan siap untuk menerima upload desain kasar.
                            </p>
                        </div>
                    )}

                    {/* File Upload Modes */}
                    {mode === 'upload-kasar' && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                {mode === 'upload-kasar' ? 'Tambah File Desain Kasar' : 'Desain Final'}
                            </label>
                            
                            {/* File Input */}
                            <div className="relative border-2 border-dashed border-violet-300 rounded-lg p-4 sm:p-6 text-center hover:border-violet-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    multiple={mode === 'upload-kasar'}
                                    required={files.length === 0}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <svg className="w-8 h-8 text-violet-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                    </svg>
                                    <p className="text-xs sm:text-sm font-medium text-stone-900">
                                        {mode === 'upload-kasar' ? 'Pilih file (bisa multiple)' : 'Pilih file'}
                                    </p>
                                    <p className="text-xs text-stone-500 mt-1">JPG, PNG, PDF</p>
                                </label>
                            </div>

                            {/* Selected Files List */}
                            {files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-stone-700">
                                        File yang akan diupload ({files.length}):
                                    </p>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-emerald-900 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-emerald-600">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(idx)}
                                                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                    title="Hapus file"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                            <p className="text-xs text-stone-500 mt-1">
                                {notes.length}/500 karakter
                            </p>
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
                            disabled={
                                loading || 
                                (mode === 'upload-kasar' && files.length === 0) || 
                                (mode === 'revise' && !notes.trim())
                            }
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                mode === 'create' ? 'Buat Moodboard' : 
                                mode === 'revise' ? 'Kirim Revisi' :
                                'Upload File'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}