import { FormEventHandler, useEffect, useState } from 'react';

interface ItemModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        nama_item: string;
        jenis_item_id: string;
        harga: string;
    };
    errors: {
        [key: string]: string;
    };
    onClose: () => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onDataChange: (key: string, value: string) => void;
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

export default function ItemModal({
    show,
    editMode,
    processing,
    data,
    errors,
    onClose,
    onSubmit,
    onDataChange,
}: ItemModalProps) {
    const [jenisItems, setJenisItems] = useState<JenisItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setLoading(true);
            fetch('/api/jenis-item')
                .then((res) => res.json())
                .then((data) => {
                    setJenisItems(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm fadeIn">
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 fadeInUp max-h-screen sm:max-h-none overflow-y-auto sm:overflow-visible"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            {editMode ? (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-white">
                            {editMode ? 'Edit Item' : 'Create Item'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-3">
                    {/* Item Name */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Item Name
                        </label>
                        <input
                            type="text"
                            value={data.nama_item}
                            onChange={(e) => onDataChange('nama_item', e.target.value)}
                            placeholder="Enter item name"
                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg transition-colors focus:outline-none ${
                                errors.nama_item
                                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                                    : 'border-stone-200 focus:border-orange-500 bg-stone-50'
                            }`}
                        />
                        {errors.nama_item && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-red-600">{errors.nama_item}</p>
                            </div>
                        )}
                    </div>

                    {/* Item Type */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Item Type
                        </label>
                        <select
                            value={data.jenis_item_id}
                            onChange={(e) => onDataChange('jenis_item_id', e.target.value)}
                            disabled={loading}
                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg transition-colors focus:outline-none ${
                                errors.jenis_item_id
                                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                                    : 'border-stone-200 focus:border-orange-500 bg-stone-50'
                            }`}
                        >
                            <option value="">
                                {loading ? 'Loading...' : 'Select item type'}
                            </option>
                            {jenisItems.map((jenis) => (
                                <option key={jenis.id} value={jenis.id}>
                                    {jenis.nama_jenis_item}
                                </option>
                            ))}
                        </select>
                        {errors.jenis_item_id && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-red-600">{errors.jenis_item_id}</p>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-600 text-sm font-semibold">
                                Rp
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                value={data.harga}
                                onChange={(e) => onDataChange('harga', e.target.value)}
                                placeholder="0"
                                className={`w-full pl-10 pr-3 py-2 text-sm border-2 rounded-lg transition-colors focus:outline-none ${
                                    errors.harga
                                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                                        : 'border-stone-200 focus:border-orange-500 bg-stone-50'
                                }`}
                            />
                        </div>
                        {errors.harga && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-red-600">{errors.harga}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-2.5 pt-2 sm:pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Processing...' : editMode ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
