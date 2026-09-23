import React from 'react';
import { router } from '@inertiajs/react';
import { Moodboard, MoodboardFile } from '../types';

interface MoodboardFileCardProps {
    file: MoodboardFile;
    moodboard: Moodboard;
    isNotKepalaMarketing: boolean;
    formatDateTime: (value: string | null | undefined) => string;
    onDeleteFile: (fileId: number, fileName: string) => void;
}

export default function MoodboardFileCard({
    file,
    moodboard,
    isNotKepalaMarketing,
    formatDateTime,
    onDeleteFile,
}: MoodboardFileCardProps) {
    const isAcceptedFile = moodboard.status === 'approved' && moodboard.moodboard_kasar === file.file_path;

    return (
        <div className="group relative">
            <div className={`relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-sm border-4 transition-all group-hover:shadow-2xl group-hover:-translate-y-1.5
                ${isAcceptedFile ? 'border-emerald-500 shadow-emerald-100 ring-8 ring-emerald-500/5' : 'border-white'}
            `}>
                <img 
                    src={file.url} 
                    alt={file.original_name} 
                    className="w-full h-full object-cover"
                />
                
                {isAcceptedFile && (
                    <div className="absolute top-5 right-5 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl border border-white/20">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        TERPILIH
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                    <div className="flex items-center gap-2">
                        <a href={file.url} target="_blank" rel="noreferrer" className="flex-1 bg-white hover:bg-slate-50 text-slate-800 py-2.5 rounded-2xl text-[11px] font-bold transition-all shadow-sm text-center">
                            Preview Full
                        </a>
                        {moodboard?.status !== 'approved' && isNotKepalaMarketing && (
                            <button onClick={() => onDeleteFile(file.id, file.original_name)} className="p-2.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-5 px-3">
                <div className="font-bold text-slate-800 text-sm truncate tracking-tight">{file.original_name}</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Upload: {formatDateTime(moodboard.response_time)}</div>
                
                {moodboard.status === 'pending' && moodboard.has_estimasi && (
                    <button 
                        onClick={() => {
                            if (window.confirm(`Pilih desain "${file.original_name}" sebagai moodboard?`)) {
                                router.post(`/moodboard/accept/${moodboard.id}`, { moodboard_file_id: file.id });
                            }
                        }}
                        className="mt-5 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 transform active:scale-95"
                    >
                        ✓ Pilih Desain Ini
                    </button>
                )}
                
                {/* Linked Estimasi Info */}
                <div className="mt-5 pt-5 border-t border-slate-200">
                    {file.estimasi_file ? (
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm transform transition-all hover:shadow-md hover:border-violet-100 group/est">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover/est:bg-emerald-500 group-hover/est:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[9px] uppercase tracking-widest font-black text-slate-300">File Estimasi</div>
                                    <div className="text-xs font-bold text-slate-700 truncate">{file.estimasi_file.original_name}</div>
                                </div>
                            </div>
                            <a href={file.estimasi_file.url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </a>
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
