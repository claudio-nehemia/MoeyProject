import { FormEventHandler, useState } from "react";

interface ProdukImage {
    id: number;
    image: string;
}

interface Item {
    id: number;
    nama_item: string;
}

interface ProdukModalProps {
    show: boolean;
    editMode: boolean;
    processing: boolean;
    data: {
        nama_produk: string;
        harga: string;
        bahan_baku: number[];
    };
    errors: {
        nama_produk?: string;
        harga?: string;
        produk_images?: string;
        bahan_baku?: string;
    };
    existingImages?: ProdukImage[];
    productId?: number;
    bahanBakuItems: Item[];
    onClose: () => void;
    onSubmit: FormEventHandler;
    onDataChange: (field: string, value: string | number[]) => void;
    onImagesChange: (files: File[]) => void;
    onDeleteImage: (imagePath: string) => void;
}

export default function ProdukModal({
    show,
    editMode,
    processing,
    data,
    errors,
    existingImages = [],
    productId,
    bahanBakuItems,
    onClose,
    onSubmit,
    onDataChange,
    onImagesChange,
    onDeleteImage
}: ProdukModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentExistingIndex, setCurrentExistingIndex] = useState(0);
    const [searchBahan, setSearchBahan] = useState("");

    if (!show) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
        
        const newPreviewUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        
        onImagesChange([...selectedFiles, ...files]);
    };

    const removeSelectedImage = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previewUrls.filter((_, i) => i !== index);
        
        URL.revokeObjectURL(previewUrls[index]);
        
        setSelectedFiles(newFiles);
        setPreviewUrls(newPreviews);
        onImagesChange(newFiles);
        
        if (currentImageIndex >= newPreviews.length && newPreviews.length > 0) {
            setCurrentImageIndex(newPreviews.length - 1);
        } else if (newPreviews.length === 0) {
            setCurrentImageIndex(0);
        }
    };

    const handleDeleteExistingImage = (imagePath: string, index: number) => {
        if (confirm('Are you sure you want to delete this image?')) {
            onDeleteImage(imagePath);
            
            if (currentExistingIndex >= existingImages.length - 1 && existingImages.length > 1) {
                setCurrentExistingIndex(existingImages.length - 2);
            } else if (existingImages.length === 1) {
                setCurrentExistingIndex(0);
            }
        }
    };

    const toggleBahanBaku = (itemId: number) => {
        const currentBahan = data.bahan_baku || [];
        const newBahan = currentBahan.includes(itemId)
            ? currentBahan.filter(id => id !== itemId)
            : [...currentBahan, itemId];
        onDataChange('bahan_baku', newBahan);
    };

    const filteredBahanBaku = bahanBakuItems.filter(item =>
        item.nama_item.toLowerCase().includes(searchBahan.toLowerCase())
    );

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % previewUrls.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
    };

    const nextExistingImage = () => {
        setCurrentExistingIndex((prev) => (prev + 1) % existingImages.length);
    };

    const prevExistingImage = () => {
        setCurrentExistingIndex((prev) => (prev - 1 + existingImages.length) % existingImages.length);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e as any);
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[100]"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto"
                style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-rose-400 to-rose-600 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {editMode ? (
                                <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            ) : (
                                <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                            <h3 className="text-base sm:text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {editMode ? 'Edit Produk' : 'Create New Produk'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors p-1"
                        >
                            <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5">
                            Nama Produk
                        </label>
                        <input
                            type="text"
                            value={data.nama_produk}
                            onChange={(e) => onDataChange('nama_produk', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                            placeholder="Enter product name"
                            disabled={processing}
                        />
                        {errors.nama_produk && (
                            <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.nama_produk}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1.5">
                            Harga
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-stone-500 font-medium text-sm">Rp</span>
                            <input
                                type="number"
                                value={data.harga}
                                onChange={(e) => onDataChange('harga', e.target.value)}
                                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                                placeholder="0"
                                disabled={processing}
                                step="0.01"
                            />
                        </div>
                        {errors.harga && (
                            <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.harga}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                            Bahan Baku
                        </label>
                        
                        <div className="mb-3">
                            <input
                                type="text"
                                value={searchBahan}
                                onChange={(e) => setSearchBahan(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                placeholder="Search materials..."
                            />
                        </div>

                        <div className="border border-stone-300 rounded-lg max-h-48 overflow-y-auto">
                            {filteredBahanBaku.length > 0 ? (
                                <div className="divide-y divide-stone-200">
                                    {filteredBahanBaku.map((item) => (
                                        <label
                                            key={item.id}
                                            className="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.bahan_baku?.includes(item.id) || false}
                                                onChange={() => toggleBahanBaku(item.id)}
                                                className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-rose-500"
                                                disabled={processing}
                                            />
                                            <span className="text-sm text-stone-700">{item.nama_item}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-stone-500">
                                    {searchBahan ? 'No materials found' : 'No materials available'}
                                </div>
                            )}
                        </div>

                        {data.bahan_baku && data.bahan_baku.length > 0 && (
                            <div className="mt-2 text-xs text-stone-600">
                                {data.bahan_baku.length} material{data.bahan_baku.length !== 1 ? 's' : ''} selected
                            </div>
                        )}

                        {errors.bahan_baku && (
                            <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.bahan_baku}
                            </div>
                        )}
                    </div>

                    {editMode && existingImages.length > 0 && (
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                                Existing Images
                            </label>
                            <div className="relative bg-stone-100 rounded-xl overflow-hidden">
                                <div className="relative aspect-video">
                                    <img
                                        src={`/storage/${existingImages[currentExistingIndex].image}`}
                                        alt={`Existing ${currentExistingIndex + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteExistingImage(existingImages[currentExistingIndex].image, currentExistingIndex)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
                                        title="Delete image"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {existingImages.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={prevExistingImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextExistingImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
                                    {currentExistingIndex + 1} / {existingImages.length}
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-stone-700 mb-2">
                            Product Images {editMode ? '(Add New)' : ''}
                        </label>
                        
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-2 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-xs text-stone-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-stone-400 mt-1">PNG, JPG, GIF, SVG (MAX. 2MB)</p>
                            </div>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={processing}
                            />
                        </label>

                        {errors.produk_images && (
                            <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.produk_images}
                            </div>
                        )}

                        {previewUrls.length > 0 && (
                            <div className="mt-4 relative bg-stone-100 rounded-xl overflow-hidden">
                                <div className="relative aspect-video">
                                    <img
                                        src={previewUrls[currentImageIndex]}
                                        alt={`Preview ${currentImageIndex + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={() => removeSelectedImage(currentImageIndex)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
                                        title="Remove image"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {previewUrls.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
                                    {currentImageIndex + 1} / {previewUrls.length}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleFormSubmit}
                            disabled={processing}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-lg hover:from-rose-500 hover:to-rose-700 transition-all font-medium shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}