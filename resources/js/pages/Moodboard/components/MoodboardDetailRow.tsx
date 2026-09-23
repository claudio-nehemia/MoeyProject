import React from 'react';
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

    return (
        <tr>
            <td colSpan={6} className="bg-slate-50/70 px-10 py-12 border-b border-slate-200">
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-200">
                        <div>
                            <h4 className="text-xl font-bold text-slate-800 tracking-tight">Detail Files Moodboard</h4>
                            <p className="text-sm text-slate-500 mt-1">Review detail desain dari tim designer untuk project ini</p>
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
                            <div className="col-span-full text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm font-medium italic">Belum ada file desain yang diupload</p>
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
                                    <h5 className="font-bold text-orange-900 text-lg tracking-tight">Catatan PM</h5>
                                    <div className="mt-3 text-base text-orange-800 leading-relaxed font-medium bg-white/40 p-5 rounded-2xl border border-orange-100/50 italic">
                                        "{moodboard.notes}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}
