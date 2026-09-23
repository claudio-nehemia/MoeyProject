import React from 'react';

interface BastFotoModalProps {
    fotoPath: string;
    onClose: () => void;
}

export const BastFotoModal: React.FC<BastFotoModalProps> = ({
    fotoPath,
    onClose,
}) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                    <span className="text-sm font-medium">Tutup</span>
                    <svg
                        className="h-5 w-5"
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

                <img
                    src={`/storage/${fotoPath}`}
                    alt="BAST Foto dengan Klien"
                    className="max-h-[85vh] w-auto rounded-2xl shadow-2xl"
                />

                <div className="mt-4 rounded-lg bg-white/10 p-3 text-center backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                        📷 Foto BAST dengan Klien
                    </p>
                </div>
            </div>
        </div>
    );
};
