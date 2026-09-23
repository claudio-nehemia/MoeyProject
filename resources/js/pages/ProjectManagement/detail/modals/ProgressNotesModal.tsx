import React from 'react';
import { Produk } from '../types';

interface ProgressNotesModalProps {
    allProducts: Produk[];
    selectedProductId: number;
    orderProjectName: string;
    onSelectProduct: (id: number) => void;
    onClose: () => void;
    onZoomImage: (imageSrc: string) => void;
}

export const ProgressNotesModal: React.FC<ProgressNotesModalProps> = ({
    allProducts,
    selectedProductId,
    orderProjectName,
    onSelectProduct,
    onClose,
    onZoomImage,
}) => {
    const selectedProduct = allProducts.find((p) => p.id === selectedProductId);

    const completedStages = selectedProduct
        ? Object.entries(selectedProduct.stage_evidences)
              .flatMap(([stageName, evList]) =>
                  evList.map((ev) => ({
                      ...ev,
                      stageName,
                  })),
              )
              .sort(
                  (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime(),
              )
        : [];

    const productImages = completedStages.filter((ev) => ev.evidence_path);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Modal Header */}
                <div className="p-6 pb-3 flex-shrink-0 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 pr-8">
                        Catatan Pengerjaan Progress
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Proyek: <span className="font-semibold text-slate-700">{orderProjectName}</span>
                    </p>

                    {/* Product Switch Selector */}
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Pilih Produk (Switch)
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => onSelectProduct(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        >
                            {allProducts.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.nama_produk} {prod.nama_ruangan ? `(${prod.nama_ruangan})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Modal Body Container */}
                <div className="flex-1 overflow-y-auto p-6 pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                    {productImages.length > 0 && (
                        <div className="mb-6 rounded-lg border border-slate-150 bg-slate-50/50 p-4">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                                Galeri Foto Progress (Berderet)
                            </h5>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {productImages.map((stage, i) => (
                                    <div key={i} className="flex-shrink-0 relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white p-1">
                                        <img
                                            src={`/storage/${stage.evidence_path}`}
                                            alt={stage.stageName}
                                            className="h-20 w-28 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => onZoomImage(`/storage/${stage.evidence_path}`)}
                                        />
                                        <div className="mt-1 text-[9px] font-bold text-center text-slate-600 truncate w-28 px-0.5">
                                            {stage.stageName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Timeline Catatan & Bukti
                    </h5>

                    {completedStages.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-6 text-center">
                            Belum ada progress pengerjaan yang diselesaikan untuk produk ini.
                        </p>
                    ) : (
                        <div className="relative border-l border-slate-200 pl-6 space-y-6">
                            {completedStages.map((stage, index) => (
                                <div key={index} className="relative">
                                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-white">
                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                    </span>
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <span className="text-sm font-bold text-slate-900">
                                                {stage.stageName}
                                            </span>
                                            <span className="text-xs text-slate-500 font-semibold">
                                                {new Date(stage.created_at).toLocaleString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                                            Oleh: {stage.uploaded_by || 'System'}
                                        </div>

                                        <div className="mt-2 flex flex-col md:flex-row gap-4 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {stage.notes || <span className="text-slate-400 italic">Tidak ada catatan tertulis</span>}
                                            </div>
                                            {stage.evidence_path && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={`/storage/${stage.evidence_path}`}
                                                        alt={stage.stageName}
                                                        className="h-16 w-24 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => onZoomImage(`/storage/${stage.evidence_path}`)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-150 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
