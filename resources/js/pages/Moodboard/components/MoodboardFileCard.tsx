import React from 'react';
import { router } from '@inertiajs/react';
import { Moodboard, MoodboardFile } from '../types';

interface MoodboardFileCardProps {
    file: MoodboardFile;
    moodboard: Moodboard;
    isNotKepalaMarketing: boolean;
    formatDateTime: (value: string | null | undefined) => string;
    onDeleteFile: (fileId: number, fileName: string) => void;
    onPreviewFile: (url: string, fileName: string, type: 'desain' | 'estimasi') => void;
    onDownloadFile: (url: string, fileName: string) => void;
}

const isPdf = (nameOrUrl: string) => nameOrUrl.toLowerCase().split('?')[0].endsWith('.pdf');

export default function MoodboardFileCard({
    file,
    moodboard,
    isNotKepalaMarketing,
    formatDateTime,
    onDeleteFile,
    onPreviewFile,
    onDownloadFile,
}: MoodboardFileCardProps) {
    const isAcceptedFile = moodboard.status === 'approved' && moodboard.moodboard_kasar === file.file_path;
    const fileIsPdf = isPdf(file.original_name || file.url);

    return (
        <div className="group relative">
            <div
                onClick={() => onPreviewFile(file.url, file.original_name, 'desain')}
                className={`relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-sm border-4 cursor-pointer transition-all group-hover:shadow-2xl group-hover:-translate-y-1.5
                ${isAcceptedFile ? 'border-emerald-500 shadow-emerald-100 ring-8 ring-emerald-500/5' : 'border-white'}
            `}
            >
                {fileIsPdf ? (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 via-white to-slate-100 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm border border-rose-200 mb-3">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                            Dokumen PDF
                        </span>
                        <p className="mt-2 text-xs font-semibold text-slate-600 line-clamp-1 max-w-full px-2">
                            {file.original_name}
                        </p>
                    </div>
                ) : (
                    <img 
                        src={file.url} 
                        alt={file.original_name} 
                        className="w-full h-full object-cover"
                    />
                )}
                
                {isAcceptedFile && (
                    <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl border border-white/20">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        TERPILIH
                    </div>
                )}

                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5"
                >
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPreviewFile(file.url, file.original_name, 'desain')}
                            className="flex-1 bg-white hover:bg-violet-50 text-slate-800 hover:text-violet-700 py-2.5 px-3 rounded-2xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview Desain
                        </button>
                        <button
                            type="button"
                            onClick={() => onDownloadFile(file.url, file.original_name)}
                            title="Download Desain"
                            className="p-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-violet-600 rounded-2xl transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        {moodboard?.status !== 'approved' && isNotKepalaMarketing && (
                            <button
                                type="button"
                                onClick={() => onDeleteFile(file.id, file.original_name)}
                                title="Hapus Desain"
                                className="p-2.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-5 px-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate tracking-tight" title={file.original_name}>
                            {file.original_name}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            Upload: {formatDateTime(moodboard.response_time)}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => onPreviewFile(file.url, file.original_name, 'desain')}
                            className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                            title="Preview Desain"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => onDownloadFile(file.url, file.original_name)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download Desain"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {moodboard.status === 'pending' && moodboard.has_estimasi && (
                    <button 
                        onClick={() => {
                            if (window.confirm(`Pilih desain "${file.original_name}" sebagai moodboard?`)) {
                                router.post(`/moodboard/accept/${moodboard.id}`, { moodboard_file_id: file.id });
                            }
                        }}
                        className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 transform active:scale-95"
                    >
                        ✓ Pilih Desain Ini
                    </button>
                )}
                
                {/* Linked Estimasi Info */}
                <div className="mt-5 pt-5 border-t border-slate-200">
                    {file.estimasi_file ? (
                        <div className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm transition-all hover:shadow-md hover:border-violet-100 group/est">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover/est:bg-emerald-500 group-hover/est:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600">File Estimasi</div>
                                    <div className="text-xs font-bold text-slate-700 truncate" title={file.estimasi_file.original_name}>
                                        {file.estimasi_file.original_name}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onPreviewFile(file.estimasi_file!.url, file.estimasi_file!.original_name, 'estimasi')}
                                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview Estimasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDownloadFile(file.estimasi_file!.url, file.estimasi_file!.original_name)}
                                    title="Download File Estimasi"
                                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors border border-slate-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[10px] font-bold text-slate-400 text-center py-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200 uppercase tracking-widest">
                            No Estimation File
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
