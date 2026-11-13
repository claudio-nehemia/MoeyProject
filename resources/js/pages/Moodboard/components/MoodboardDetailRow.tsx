import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, TaskResponse } from '../types';
import MoodboardFileCard from './MoodboardFileCard';

interface MoodboardDetailRowProps {
    order: Order;
    isKepalaMarketing: boolean;
    isNotKepalaMarketing: boolean;
    taskResponses: Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>;
    formatDateTime: (value: string | null | undefined) => string;
    onOpenUploadKasarModal: (order: Order) => void;
    onHandlePmResponse: (orderId: number) => void;
    onDeleteFile: (fileId: number, fileName: string) => void;
    onShowExtendModal: (params: { orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse }) => void;
}

const isImageFile = (fileNameOrUrl: string): boolean => {
    const clean = fileNameOrUrl.toLowerCase().split('?')[0];
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].some((ext) => clean.endsWith(ext));
};

const isPdfFile = (fileNameOrUrl: string): boolean => {
    const clean = fileNameOrUrl.toLowerCase().split('?')[0];
    return clean.endsWith('.pdf');
};

export default function MoodboardDetailRow({
    order,
    isKepalaMarketing,
    isNotKepalaMarketing,
    taskResponses,
    formatDateTime,
    onOpenUploadKasarModal,
    onHandlePmResponse,
    onDeleteFile,
    onShowExtendModal,
}: MoodboardDetailRowProps) {
    const moodboard = order.moodboard;
    const [previewFile, setPreviewFile] = useState<{
        url: string;
        name: string;
        type: 'desain' | 'estimasi';
    } | null>(null);

    const handlePreviewFile = (url: string, fileName: string, type: 'desain' | 'estimasi') => {
        setPreviewFile({ url, name: fileName, type });
    };

    const handleDownloadFile = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <tr>
            <td colSpan={6} className="bg-slate-50/70 px-10 py-12 border-b border-slate-200">
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
                        <div>
                            <h4 className="text-xl font-bold text-slate-800 tracking-tight">Detail Files Moodboard</h4>
                            <p className="text-sm text-slate-500 mt-1">Review detail desain dan estimasi biaya dari tim untuk project ini</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {taskResponses[order.id]?.regular && 
                             taskResponses[order.id]?.regular?.status !== 'selesai' && 
                             taskResponses[order.id]?.regular?.status !== 'telat_submit' && 
                             !taskResponses[order.id]?.regular?.update_data_time && (
                                <button
                                    onClick={() => onShowExtendModal({
                                        orderId: order.id,
                                        tahap: 'moodboard',
                                        isMarketing: false,
                                        taskResponse: taskResponses[order.id]!.regular!
                                    })}
                                    className="px-4 py-2.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-wider"
                                >
                                    Minta Perpanjangan
                                </button>
                            )}
                            {moodboard?.status !== 'approved' && isNotKepalaMarketing && (
                                <button 
                                    onClick={() => onOpenUploadKasarModal(order)}
                                    className="px-5 py-2.5 bg-slate-800 text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    + Tambah File Baru
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Response Logging Integration */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                        {isKepalaMarketing && (!order.moodboard?.pm_response_time) && (
                            <button
                                onClick={() => onHandlePmResponse(order.id)}
                                className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
                            >
                                Inisiasi Marketing Response
                            </button>
                        )}
                        
                        {order.moodboard?.pm_response_time && (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-800">Marketing Response Selesai</p>
                                    <p className="text-[10px] text-emerald-600 font-medium">Oleh {order.moodboard.pm_response_by} pada {formatDateTime(order.moodboard.pm_response_time)}</p>
                                </div>
                            </div>
                        )}

                        {order.moodboard?.response_time && (
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-800">Desain Selesai Diupload</p>
                                    <p className="text-[10px] text-blue-600 font-medium">Oleh {order.moodboard.response_by} pada {formatDateTime(order.moodboard.response_time)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {!moodboard || moodboard?.kasar_files.length === 0 ? (
                            <div className="col-span-full text-center py-14 px-6 bg-white rounded-[32px] border-2 border-dashed border-violet-200 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center mb-4 shadow-sm">
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-5" />
                                    </svg>
                                </div>
                                <h5 className="text-base font-bold text-slate-800">Belum Ada File Moodboard</h5>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md">
                                    Silakan unggah file desain konsep moodboard (JPG, PNG, atau PDF) untuk proyek <span className="font-semibold text-slate-700">{order.nama_project}</span>.
                                </p>
                                {isNotKepalaMarketing && moodboard && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenUploadKasarModal(order)}
                                        className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload File Moodboard Sekarang
                                    </button>
                                )}
                            </div>
                        ) : (
                            moodboard?.kasar_files.map((file) => (
                                <MoodboardFileCard
                                    key={file.id}
                                    file={file}
                                    moodboard={moodboard}
                                    isNotKepalaMarketing={isNotKepalaMarketing}
                                    formatDateTime={formatDateTime}
                                    onDeleteFile={onDeleteFile}
                                    onPreviewFile={handlePreviewFile}
                                    onDownloadFile={handleDownloadFile}
                                />
                            ))
                        )}
                    </div>

                    {moodboard?.notes && (
                        <div className="mt-12 p-8 bg-orange-50/50 border border-orange-200/50 rounded-[40px] relative overflow-hidden group/note">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full -mr-16 -mt-16 transition-transform group-hover/note:scale-150 duration-700"></div>
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 shadow-sm border border-orange-200">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-orange-900 text-lg tracking-tight">Catatan Moodboard</h5>
                                    <div className="mt-3 text-base text-orange-800 leading-relaxed font-medium bg-white/40 p-5 rounded-2xl border border-orange-100/50 italic">
                                        "{moodboard.notes}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Modal for Desain & Estimasi */}
                {previewFile &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200"
                            onClick={() => setPreviewFile(null)}
                        >
                            <div
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                previewFile.type === 'desain'
                                                    ? 'bg-violet-100 text-violet-600'
                                                    : 'bg-indigo-100 text-indigo-600'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <span
                                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                    previewFile.type === 'desain'
                                                        ? 'bg-violet-50 text-violet-700'
                                                        : 'bg-indigo-50 text-indigo-700'
                                                }`}
                                            >
                                                {previewFile.type === 'desain' ? 'Preview Desain Moodboard' : 'Preview File Estimasi'}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-800 truncate mt-0.5" title={previewFile.name}>
                                                {previewFile.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <a
                                            href={previewFile.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                                            title="Buka di Tab Baru"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            <span className="hidden sm:inline">Tab Baru</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadFile(previewFile.url, previewFile.name)}
                                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span className="hidden sm:inline">Download</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile(null)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-colors"
                                            title="Tutup Preview"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="flex-1 overflow-auto p-6 bg-slate-100/60 flex items-center justify-center min-h-[55vh]">
                                    {isImageFile(previewFile.name || previewFile.url) ? (
                                        <img
                                            src={previewFile.url}
                                            alt={previewFile.name}
                                            className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-lg bg-white"
                                        />
                                    ) : isPdfFile(previewFile.name || previewFile.url) ? (
                                        <iframe
                                            src={previewFile.url}
                                            title={previewFile.name}
                                            className="w-full h-[72vh] rounded-2xl border border-slate-200 bg-white shadow-sm"
                                        />
                                    ) : (
                                        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-sm">
                                            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 mb-1">{previewFile.name}</p>
                                            <p className="text-xs text-slate-500 mb-5">
                                                Format file ini tidak dapat ditampilkan langsung di dalam browser. Silakan unduh untuk membuka file.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadFile(previewFile.url, previewFile.name)}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body,
                    )}
            </td>
        </tr>
    );
}
