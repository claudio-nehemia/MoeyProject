import { FormEventHandler } from "react";

interface Divisi {
    id: number;
    nama_divisi: string;
}

interface RoleModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        nama_role: string;
        divisi_id: number;
    };
    errors: {
        nama_role?: string;
        divisi_id?: string;
    };
    divisis: Divisi[];
    onClose: () => void;
    onSubmit: FormEventHandler;
    onDataChange: (field: string, value: string | number) => void;
}

export default function RoleModal({
    show,
    editMode,
    processing,
    data,
    errors,
    divisis,
    onClose,
    onSubmit,
    onDataChange
}: RoleModalProps) {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-100"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {editMode ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {editMode ? 'Edit Role' : 'Create New Role'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {/* Nama Role Field */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Nama Role
                        </label>
                        <input
                            type="text"
                            value={data.nama_role}
                            onChange={(e) => onDataChange('nama_role', e.target.value)}
                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter role name"
                            disabled={processing}
                        />
                        {errors.nama_role && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.nama_role}
                            </div>
                        )}
                    </div>

                    {/* Divisi Field */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Divisi
                        </label>
                        <select
                            value={data.divisi_id}
                            onChange={(e) => onDataChange('divisi_id', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            disabled={processing}
                        >
                            <option value="">Select Divisi</option>
                            {divisis.map((divisi) => (
                                <option key={divisi.id} value={divisi.id}>
                                    {divisi.nama_divisi}
                                </option>
                            ))}
                        </select>
                        {errors.divisi_id && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-red-600 text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.divisi_id}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700 transition-all font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}