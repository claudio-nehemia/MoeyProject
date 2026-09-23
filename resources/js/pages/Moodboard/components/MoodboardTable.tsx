import React from 'react';
import { Order, TaskResponse } from '../types';
import MoodboardTableRow from './MoodboardTableRow';

interface MoodboardTableProps {
    filteredOrders: Order[];
    expandedCards: Set<number>;
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

export default function MoodboardTable({
    filteredOrders,
    expandedCards,
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
}: MoodboardTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Project & Client</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Files</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Team</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right pr-6"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                                <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-slate-400">Tidak ada project ditemukan</p>
                            </td>
                        </tr>
                    ) : (
                        filteredOrders.map((order) => (
                            <MoodboardTableRow
                                key={order.id}
                                order={order}
                                isExpanded={expandedCards.has(order.id)}
                                isKepalaMarketing={isKepalaMarketing}
                                isNotKepalaMarketing={isNotKepalaMarketing}
                                taskResponses={taskResponses}
                                toggleExpand={toggleExpand}
                                formatDeadline={formatDeadline}
                                formatDateTime={formatDateTime}
                                onOpenCreateMoodboard={onOpenCreateMoodboard}
                                onOpenUploadKasarModal={onOpenUploadKasarModal}
                                onOpenReviseModal={onOpenReviseModal}
                                onHandlePmResponse={onHandlePmResponse}
                                onDeleteFile={onDeleteFile}
                                onShowExtendModal={onShowExtendModal}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
