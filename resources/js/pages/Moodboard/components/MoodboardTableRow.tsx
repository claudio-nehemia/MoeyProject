import React, { Fragment } from 'react';
import { Order, TaskResponse, statusLabelTranslations } from '../types';
import MoodboardDetailRow from './MoodboardDetailRow';

interface MoodboardTableRowProps {
    order: Order;
    isExpanded: boolean;
    isKepalaMarketing: boolean;
    isNotKepalaMarketing: boolean;
    taskResponses: Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>;
    toggleExpand: (orderId: number) => void;
    formatDeadline: (value: string | null | undefined) => string;
    formatDateTime: (value: string | null | undefined) => string;
    onOpenCreateMoodboard: (order: Order) => void;
    onOpenUploadKasarModal: (order: Order) => void;
    onOpenReviseModal: (order: Order) => void;
    onHandlePmResponse: (orderId: number) => void;
    onDeleteFile: (fileId: number, fileName: string) => void;
    onShowExtendModal: (params: { orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse }) => void;
}

export default function MoodboardTableRow({
    order,
    isExpanded,
    isKepalaMarketing,
    isNotKepalaMarketing,
    taskResponses,
    toggleExpand,
    formatDeadline,
    formatDateTime,
    onOpenCreateMoodboard,
    onOpenUploadKasarModal,
    onOpenReviseModal,
    onHandlePmResponse,
    onDeleteFile,
    onShowExtendModal,
}: MoodboardTableRowProps) {
    const moodboard = order.moodboard;
    const status = moodboard ? moodboard.status : null;

    const isActiveTaskResponse = (task?: TaskResponse) => {
        return !!task && task.status !== 'selesai' && task.status !== 'telat_submit' && !task.update_data_time;
    };

    const regularTask = taskResponses[order.id]?.regular;
    const marketingTask = taskResponses[order.id]?.marketing;
    const activeTask = isKepalaMarketing
        ? (isActiveTaskResponse(marketingTask)
            ? marketingTask
            : isActiveTaskResponse(regularTask)
                ? regularTask
                : undefined)
        : (isActiveTaskResponse(regularTask)
            ? regularTask
            : isActiveTaskResponse(marketingTask)
                ? marketingTask
                : undefined);

    const renderActionButtons = () => {
        if (!moodboard || (!moodboard.response_time && !moodboard.response_by)) {
            return isNotKepalaMarketing ? (
                <button
                    onClick={() => onOpenCreateMoodboard(order)}
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-violet-700 transition-all active:scale-95"
                >
                    Response
                </button>
            ) : null;
        }

        return (
            <div className="flex flex-col gap-2 sm:flex-row">
                {moodboard.kasar_files.length === 0 && (
                    <button
                        onClick={() => onOpenUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Upload Moodboard
                    </button>
                )}

                {moodboard.kasar_files.length > 0 && moodboard.status !== 'approved' && isNotKepalaMarketing && (
                    <button
                        onClick={() => onOpenUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        + Tambah File
                    </button>
                )}

                {moodboard.status === 'revisi' && isNotKepalaMarketing && (
                    <button
                        onClick={() => onOpenUploadKasarModal(order)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Upload Ulang
                    </button>
                )}
            </div>
        );
    };

    return (
        <Fragment>
            <tr 
                className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-violet-50/40' : 'hover:bg-slate-50/70'}`}
                onClick={() => toggleExpand(order.id)}
            >
                {/* Project Info */}
                <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800 text-sm leading-tight">{order.nama_project}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{order.company_name}</div>
                    <span className="mt-1.5 inline-block text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider italic">{order.jenis_interior}</span>
                </td>

                {/* Deadline */}
                <td className="px-5 py-3.5">
                    {activeTask ? (
                        <>
                            <div className="text-xs text-slate-600 font-medium">
                                {formatDeadline(activeTask.deadline)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] text-slate-400 font-bold">7 HARI</span>
                                {typeof activeTask.extend_time === 'number' && activeTask.extend_time > 0 && (
                                    <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-bold rounded border border-violet-100 uppercase tracking-tighter">
                                        {activeTask.extend_time}x Ext
                                    </span>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="text-[10px] text-slate-400 italic">Tidak ada deadline</span>
                    )}
                </td>

                {/* Files */}
                <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center -space-x-1.5">
                        {moodboard?.kasar_files.slice(0, 3).map((file) => (
                            <div key={file.id} className="relative">
                                <img 
                                    src={file.url} 
                                    className={`w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm
                                        ${moodboard.moodboard_kasar === file.file_path && moodboard.status === 'approved' ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}
                                    `}
                                    alt="Moodboard"
                                />
                                {moodboard.moodboard_kasar === file.file_path && moodboard.status === 'approved' && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                                        <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                        {moodboard && moodboard.kasar_files.length > 3 && (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">
                                +{moodboard.kasar_files.length - 3}
                            </div>
                        )}
                        {(!moodboard || moodboard.kasar_files.length === 0) && (
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </td>

                {/* Status */}
                <td className="px-5 py-3.5 text-center">
                    {moodboard && status && statusLabelTranslations[status] ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${statusLabelTranslations[status].color}`}>
                            {statusLabelTranslations[status].label}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Response</span>
                    )}
                </td>

                {/* Team */}
                <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center -space-x-1.5">
                        {order.team.slice(0, 3).map((member, idx) => (
                            <div 
                                key={member.id} 
                                title={member.name}
                                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm
                                    ${idx % 3 === 0 ? 'bg-violet-500 text-white' : idx % 3 === 1 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}
                                `}
                            >
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                        ))}
                    </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 text-slate-400">
                        {/* Chevron toggle indicator */}
                        <div 
                            className={`p-1.5 rounded-lg transition-all pointer-events-none ${isExpanded ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-300'}`}
                        >
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        
                        <button 
                            className="p-1.5 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all" 
                            title="Download All"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>

                        {moodboard && (status === 'pending' || status === 'revisi') && isNotKepalaMarketing && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onOpenReviseModal(order); }}
                                className="p-1.5 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all" 
                                title="Revisi"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </button>
                        )}

                        <div className="ml-0.5" onClick={(e) => e.stopPropagation()}>
                            {renderActionButtons()}
                        </div>
                    </div>
                </td>
            </tr>
            
            {/* Expanded Detail View */}
            {isExpanded && (
                <MoodboardDetailRow
                    order={order}
                    isKepalaMarketing={isKepalaMarketing}
                    isNotKepalaMarketing={isNotKepalaMarketing}
                    taskResponses={taskResponses}
                    formatDateTime={formatDateTime}
                    onOpenUploadKasarModal={onOpenUploadKasarModal}
                    onHandlePmResponse={onHandlePmResponse}
                    onDeleteFile={onDeleteFile}
                    onShowExtendModal={onShowExtendModal}
                />
            )}
        </Fragment>
    );
}
