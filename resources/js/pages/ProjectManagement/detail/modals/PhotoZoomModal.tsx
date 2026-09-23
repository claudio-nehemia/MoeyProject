import React from 'react';

interface PhotoZoomModalProps {
    imageSrc: string;
    onClose: () => void;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({
    imageSrc,
    onClose,
}) => {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
            onClick={onClose}
        >
            <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-lg bg-white p-2">
                <img
                    src={imageSrc}
                    alt="Zoomed Evidence"
                    className="max-w-full max-h-[85vh] object-contain rounded"
                />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
