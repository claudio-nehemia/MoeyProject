import { FormEventHandler } from 'react';

interface DivisiModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        nama_divisi: string;
    };
    errors: {
        nama_divisi?: string;
    };
    onClose: () => void;
    onSubmit: FormEventHandler;
    onDataChange: (field: string, value: string) => void;
}

export default function DivisiModal({
    show,
    editMode,
    processing,
    data,
    errors,
    onClose,
    onSubmit,
    onDataChange
}: DivisiModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-stone-900 bg-opacity-75 transition-opacity fadeIn" 
                    onClick={onClose}
                    aria-hidden="true"
                ></div>

                {/* Center modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full fadeInUp">
                    <form onSubmit={onSubmit}>
                        <div className="bg-white px-4 pt-4 pb-3 sm:p-5 sm:pb-3">
                            <div className="mb-5">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {editMode ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            )}
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {editMode ? 'Edit Divisi' : 'Create New Divisi'}
                                        </h3>
                                        <p className="text-xs text-stone-600">
                                            {editMode ? 'Update divisi information' : 'Add a new division to your organization'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="nama_divisi" className="block text-sm font-semibold text-stone-700 mb-1.5">
                                    Nama Divisi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nama_divisi"
                                    value={data.nama_divisi}
                                    onChange={(e) => onDataChange('nama_divisi', e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all hover:border-stone-300"
                                    placeholder="e.g., Human Resources, IT Department"
                                    autoFocus
                                />
                                {errors.nama_divisi && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.nama_divisi}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-4 py-3 sm:px-5 sm:flex sm:flex-row-reverse gap-2.5">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-lg px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-medium text-white hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {editMode ? 'Update Divisi' : 'Create Divisi'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="w-full inline-flex justify-center items-center rounded-lg border-2 border-stone-300 shadow-sm px-5 py-2.5 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
