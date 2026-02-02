import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Bell, CheckCheck, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    can_marketing_response?: boolean;
    order: {
        id: number;
        nama_project: string;
        customer_name: string;
        survey_response_time: string | null; 
        survey_response_by: string | null; 
        pm_survey_response_time: string | null;
        pm_survey_response_by: string | null;
        survey_results?: {
            response_time: string | null;
            response_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
        };
        survey_ulang?: {
            response_time: string | null;
            response_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
        };
        moodboard?: {
            response_time: string | null;
            response_by: string | null;
            response_final_time: string | null;
            response_final_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
            item_pekerjaans?: Array<{
                produks?: Array<{
                    workplan_items?: Array<{
                        response_time: string | null;
                        response_by: string | null;
                        pm_response_time?: string | null;
                        pm_response_by?: string | null;
                    }>;
                }>;
            }>;
            commitment_fee?: {
                response_time?: string | null;
                response_by?: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            };
            estimasi?: {
                response_time?: string | null;
                response_by?: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            };
        };
        estimasi?: {
            response_time: string | null;
            response_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
        };
        item_pekerjaans?: Array<{
            response_time: string | null;
            response_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
            rab_internal?: {
                response_time: string | null;
                response_by: string | null;
            };
            kontrak?: {
                response_time: string | null;
                response_by: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            };
        }>;
        gambar_kerja?: {
            response_time: string | null;
            response_by: string | null;
            pm_response_time?: string | null;
            pm_response_by?: string | null;
        };
    };
}

interface NotificationsData {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    notifications: NotificationsData;
    unreadCount: number;
}

export default function Index({ notifications, unreadCount }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check if notification has been responded
    const isResponded = (
        notification: Notification,
    ): {
        responded: boolean;
        responseTime: string | null;
        responseBy: string | null;
    } => {
        const order = notification.order;

        switch (notification.type) {
            case 'survey_request':
                return {
                    responded: !!order.survey_results?.response_time,
                    responseTime: order.survey_results?.response_time || null,
                    responseBy: order.survey_results?.response_by || null,
                };

            case 'moodboard_request':
                return {
                    responded: !!order.moodboard?.response_time,
                    responseTime: order.moodboard?.response_time || null,
                    responseBy: order.moodboard?.response_by || null,
                };

            case 'estimasi_request':
                return {
                    responded: !!order.estimasi?.response_time,
                    responseTime: order.estimasi?.response_time || null,
                    responseBy: order.estimasi?.response_by || null,
                };

            case 'final_design_request':
                return {
                    responded: !!order.moodboard?.response_final_time,
                    responseTime: order.moodboard?.response_final_time || null,
                    responseBy: order.moodboard?.response_final_by || null,
                };

            case 'item_pekerjaan_request':
                const itemPekerjaan = order.item_pekerjaans?.[0];
                return {
                    responded: !!itemPekerjaan?.response_time,
                    responseTime: itemPekerjaan?.response_time || null,
                    responseBy: itemPekerjaan?.response_by || null,
                };

            case 'rab_internal_request':
                const rabInternal = order.item_pekerjaans?.[0]?.rab_internal;
                return {
                    responded: !!rabInternal?.response_time,
                    responseTime: rabInternal?.response_time || null,
                    responseBy: rabInternal?.response_by || null,
                };

            case 'kontrak_request':
                const kontrak = order.item_pekerjaans?.[0]?.kontrak;
                return {
                    responded: !!kontrak?.response_time,
                    responseTime: kontrak?.response_time || null,
                    responseBy: kontrak?.response_by || null,
                };

            case 'survey_schedule_request':
                return {
                    responded: !!order.survey_response_time,
                    responseTime: order.survey_response_time || null,
                    responseBy: order.survey_response_by || null
                };

            case 'gambar_kerja_request':
                return {
                    responded: !!order.gambar_kerja?.response_time,
                    responseTime: order.gambar_kerja?.response_time || null,
                    responseBy: order.gambar_kerja?.response_by || null,
                };

            case 'survey_ulang_request':
                return {
                    responded: !!order.survey_ulang?.response_time,
                    responseTime: order.survey_ulang?.response_time || null,
                    responseBy: order.survey_ulang?.response_by || null,
                };

            case 'workplan_request':
                // Check if any workplan item has response_time
                const hasAnyWorkplanResponse =
                    order.moodboard?.item_pekerjaans?.some((ip) =>
                        ip.produks?.some((produk) =>
                            produk.workplan_items?.some(
                                (workplan) => workplan.response_time,
                            ),
                        ),
                    ) || false;

                // Get first responded workplan item
                let workplanResponseTime = null;
                let workplanResponseBy = null;
                if (hasAnyWorkplanResponse) {
                    for (const ip of order.moodboard?.item_pekerjaans || []) {
                        for (const produk of ip.produks || []) {
                            const respondedWorkplan =
                                produk.workplan_items?.find(
                                    (w) => w.response_time,
                                );
                            if (respondedWorkplan) {
                                workplanResponseTime =
                                    respondedWorkplan.response_time;
                                workplanResponseBy =
                                    respondedWorkplan.response_by;
                                break;
                            }
                        }
                        if (workplanResponseTime) break;
                    }
                }

                return {
                    responded: hasAnyWorkplanResponse,
                    responseTime: workplanResponseTime,
                    responseBy: workplanResponseBy,
                };

            // For commitment_fee_request, check if moodboard.commitment_fee exists
            case 'commitment_fee_request':
                return {
                    responded: !!(order.moodboard as any)?.commitment_fee,
                    responseTime:
                        (order.moodboard as any)?.commitment_fee
                            ?.response_time || null,
                    responseBy:
                        (order.moodboard as any)?.commitment_fee?.response_by ||
                        null,
                };

            default:
                return {
                    responded: false,
                    responseTime: null,
                    responseBy: null,
                };
        }
    };

    const isMarketingResponded = (
        notification: Notification,
    ): {
        responded: boolean;
        responseTime: string | null;
        responseBy: string | null;
    } => {
        const order = notification.order;

        switch (notification.type) {
            case 'survey_request':
                return {
                    responded: !!order.survey_results?.pm_response_time,
                    responseTime: order.survey_results?.pm_response_time || null,
                    responseBy: order.survey_results?.pm_response_by || null,
                };

            case 'survey_schedule_request':
                return {
                    responded: !!order.pm_survey_response_time,
                    responseTime: order.pm_survey_response_time || null,
                    responseBy: order.pm_survey_response_by || null,
                };

            case 'moodboard_request':
            case 'final_design_request':
                return {
                    responded: !!order.moodboard?.pm_response_time,
                    responseTime: order.moodboard?.pm_response_time || null,
                    responseBy: order.moodboard?.pm_response_by || null,
                };

            case 'estimasi_request':
                return {
                    responded: !!(order.estimasi as any)?.pm_response_time,
                    responseTime: (order.estimasi as any)?.pm_response_time || null,
                    responseBy: (order.estimasi as any)?.pm_response_by || null,
                };

            case 'commitment_fee_request':
                return {
                    responded: !!(order.moodboard as any)?.commitment_fee?.pm_response_time,
                    responseTime: (order.moodboard as any)?.commitment_fee?.pm_response_time || null,
                    responseBy: (order.moodboard as any)?.commitment_fee?.pm_response_by || null,
                };

            case 'survey_ulang_request':
                return {
                    responded: !!order.survey_ulang?.pm_response_time,
                    responseTime: order.survey_ulang?.pm_response_time || null,
                    responseBy: order.survey_ulang?.pm_response_by || null,
                };

            case 'gambar_kerja_request':
                return {
                    responded: !!order.gambar_kerja?.pm_response_time,
                    responseTime: order.gambar_kerja?.pm_response_time || null,
                    responseBy: order.gambar_kerja?.pm_response_by || null,
                };

            case 'item_pekerjaan_request': {
                const itemPekerjaan = order.item_pekerjaans?.[0];
                return {
                    responded: !!itemPekerjaan?.pm_response_time,
                    responseTime: itemPekerjaan?.pm_response_time || null,
                    responseBy: itemPekerjaan?.pm_response_by || null,
                };
            }

            case 'kontrak_request': {
                const kontrak = order.item_pekerjaans?.[0]?.kontrak;
                return {
                    responded: !!kontrak?.pm_response_time,
                    responseTime: kontrak?.pm_response_time || null,
                    responseBy: kontrak?.pm_response_by || null,
                };
            }

            case 'workplan_request': {
                const hasAnyPmWorkplanResponse =
                    order.moodboard?.item_pekerjaans?.some((ip) =>
                        ip.produks?.some((produk) =>
                            produk.workplan_items?.some(
                                (workplan) => workplan.pm_response_time,
                            ),
                        ),
                    ) || false;

                let pmWorkplanResponseTime = null;
                let pmWorkplanResponseBy = null;
                if (hasAnyPmWorkplanResponse) {
                    for (const ip of order.moodboard?.item_pekerjaans || []) {
                        for (const produk of ip.produks || []) {
                            const respondedWorkplan =
                                produk.workplan_items?.find(
                                    (w) => w.pm_response_time,
                                );
                            if (respondedWorkplan) {
                                pmWorkplanResponseTime =
                                    respondedWorkplan.pm_response_time || null;
                                pmWorkplanResponseBy =
                                    respondedWorkplan.pm_response_by || null;
                                break;
                            }
                        }
                        if (pmWorkplanResponseTime) break;
                    }
                }

                return {
                    responded: hasAnyPmWorkplanResponse,
                    responseTime: pmWorkplanResponseTime,
                    responseBy: pmWorkplanResponseBy,
                };
            }

            default:
                return {
                    responded: false,
                    responseTime: null,
                    responseBy: null,
                };
        }
    };

    const handleMarketingResponse = async (
        notificationId: number,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }

        try {
            router.post(
                `/notifications/${notificationId}/response`,
                { is_marketing: 1 },
                {
                    preserveScroll: false,
                    onError: (errors) => {
                        console.error('Error handling marketing response:', errors);
                    },
                },
            );
        } catch (error) {
            console.error('Error handling marketing response:', error);
        }
    };

    // Notification types yang MEMERLUKAN response (create record)
    const requiresResponse = (type: string): boolean => {
        const typesWithResponse = [
            'survey_request',
            'survey_ulang_request',
            'survey_schedule_request', 
            'moodboard_request',
            'estimasi_request',
            'commitment_fee_request',
            'final_design_request',
            'item_pekerjaan_request',
            'rab_internal_request',
            'kontrak_request',
            'gambar_kerja_request',
            'workplan_request',
        ];
        return typesWithResponse.includes(type);
    };

    // Notification types yang HANYA redirect (tidak perlu response)
    const needsDirectAccess = (type: string): boolean => {
        const typesWithoutResponse = [
            'design_approval',
            'invoice_request',
            'approval_material_request',
            'project_management_request',
        ];
        return typesWithoutResponse.includes(type);
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await axios.post(`/notifications/${id}/mark-as-read`);
            router.reload();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
    };

    const handleResponse = async (
        notificationId: number,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }

        try {
            router.post(
                `/notifications/${notificationId}/response`,
                {},
                {
                    preserveScroll: false,
                    onSuccess: () => {
                        console.log('Response handled successfully');
                    },
                    onError: (errors) => {
                        console.error('Error handling response:', errors);
                    },
                },
            );
        } catch (error) {
            console.error('Error handling response:', error);
        }
    };

    const handleDirectAccess = (
        notification: Notification,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }

        // Mark as read and navigate directly
        handleResponse(notification.id, e);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-as-read');
            router.reload();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?'))
            return;

        try {
            await axios.delete(`/notifications/${id}`);
            router.reload();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'survey_request':
                return '📋';
            case 'moodboard_request':
                return '🎨';
            case 'estimasi_request':
                return '💰';
            case 'design_approval':
                return '✅';
            case 'commitment_fee_request':
                return '💳';
            case 'final_design_request':
                return '🎯';
            case 'item_pekerjaan_request':
                return '📝';
            case 'rab_internal_request':
                return '📊';
            case 'kontrak_request':
                return '📄';
            case 'invoice_request':
                return '🧾';
            case 'survey_schedule_request':
                return '📅';
            case 'survey_ulang_request':
                return '🔄';
            case 'gambar_kerja_request':
                return '📐';
            case 'approval_material_request':
                return '✔️';
            case 'workplan_request':
                return '📋';
            case 'project_management_request':
                return '📊';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (
        type: string,
        isRead: boolean,
        responded: boolean,
    ) => {
        if (responded) return 'bg-green-50 border-green-300';
        if (isRead) return 'bg-stone-50 border-stone-200';

        switch (type) {
            case 'survey_request':
            case 'survey_schedule_request':
            case 'survey_ulang_request':
                return 'bg-blue-50 border-blue-200';
            case 'moodboard_request':
            case 'final_design_request':
                return 'bg-purple-50 border-purple-200';
            case 'estimasi_request':
            case 'rab_internal_request':
                return 'bg-emerald-50 border-emerald-200';
            case 'design_approval':
            case 'approval_material_request':
                return 'bg-amber-50 border-amber-200';
            case 'commitment_fee_request':
            case 'invoice_request':
                return 'bg-indigo-50 border-indigo-200';
            case 'item_pekerjaan_request':
            case 'gambar_kerja_request':
                return 'bg-rose-50 border-rose-200';
            case 'kontrak_request':
                return 'bg-cyan-50 border-cyan-200';
            case 'workplan_request':
            case 'project_management_request':
                return 'bg-teal-50 border-teal-200';
            default:
                return 'bg-stone-50 border-stone-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)} menit lalu`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
        if (diffInSeconds < 604800)
            return `${Math.floor(diffInSeconds / 86400)} hari lalu`;

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <Head title="Notifikasi" />
            <Navbar />
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} pt-16`}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                                    <Bell className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1
                                        className="text-2xl font-bold text-stone-800"
                                        style={{
                                            fontFamily:
                                                "'Playfair Display', serif",
                                        }}
                                    >
                                        Notifikasi
                                    </h1>
                                    <p className="text-sm text-stone-600">
                                        {unreadCount > 0
                                            ? `${unreadCount} notifikasi belum dibaca`
                                            : 'Tidak ada notifikasi baru'}
                                    </p>
                                </div>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white shadow-sm transition-all hover:bg-amber-600"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Tandai Semua Dibaca
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {notifications.data.length === 0 ? (
                            <div className="rounded-xl border-2 border-stone-200 bg-white p-12 text-center">
                                <Bell className="mx-auto mb-4 h-16 w-16 text-stone-300" />
                                <h3 className="mb-2 text-lg font-semibold text-stone-800">
                                    Tidak Ada Notifikasi
                                </h3>
                                <p className="text-stone-500">
                                    Anda akan menerima notifikasi untuk tugas
                                    dan update project di sini
                                </p>
                            </div>
                        ) : (
                            notifications.data.map((notification) => {
                                const responseStatus =
                                    isResponded(notification);
                                const hasResponse = requiresResponse(
                                    notification.type,
                                );

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification,
                                            )
                                        }
                                        className={`rounded-xl border-2 bg-white ${getNotificationColor(notification.type, notification.is_read, responseStatus.responded)} cursor-pointer p-5 transition-all hover:scale-[1.01] hover:shadow-md`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-stone-200 bg-white text-2xl shadow-sm">
                                                    {getNotificationIcon(
                                                        notification.type,
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex items-start justify-between gap-3">
                                                    <h3 className="text-base font-semibold text-stone-800">
                                                        {notification.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {responseStatus.responded && (
                                                            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Responded
                                                            </span>
                                                        )}
                                                        {!notification.is_read &&
                                                            !responseStatus.responded && (
                                                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></span>
                                                            )}
                                                    </div>
                                                </div>

                                                <p className="mb-3 text-sm leading-relaxed text-stone-600">
                                                    {notification.message}
                                                </p>

                                                {notification.order && (
                                                    <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1.5">
                                                        <span className="text-xs font-medium text-stone-700">
                                                            Project:{' '}
                                                            {
                                                                notification
                                                                    .order
                                                                    .nama_project
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Response Info (if already responded) */}
                                                {responseStatus.responded && (
                                                    <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            <span className="text-sm font-semibold text-green-800">
                                                                Sudah
                                                                Di-response
                                                            </span>
                                                        </div>
                                                        <div className="ml-6 space-y-0.5 text-xs text-green-700">
                                                            {responseStatus.responseBy && (
                                                                <div>
                                                                    <strong>
                                                                        Oleh:
                                                                    </strong>{' '}
                                                                    {
                                                                        responseStatus.responseBy
                                                                    }
                                                                </div>
                                                            )}
                                                            {responseStatus.responseTime && (
                                                                <div>
                                                                    <strong>
                                                                        Waktu:
                                                                    </strong>{' '}
                                                                    {formatDate(
                                                                        responseStatus.responseTime,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Marketing Response Info (Kepala Marketing only) */}
                                                {notification.can_marketing_response && (() => {
                                                    const marketingStatus = isMarketingResponded(notification);
                                                    if (!marketingStatus.responded) return null;

                                                    return (
                                                        <div className="mb-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                                                <span className="text-sm font-semibold text-purple-800">
                                                                    Marketing sudah response
                                                                </span>
                                                            </div>
                                                            <div className="ml-6 space-y-0.5 text-xs text-purple-700">
                                                                {marketingStatus.responseBy && (
                                                                    <div>
                                                                        <strong>Oleh:</strong>{' '}
                                                                        {marketingStatus.responseBy}
                                                                    </div>
                                                                )}
                                                                {marketingStatus.responseTime && (
                                                                    <div>
                                                                        <strong>Waktu:</strong>{' '}
                                                                        {formatDate(marketingStatus.responseTime)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Conditional Action Buttons */}
                                                {!responseStatus.responded && (
                                                    <>
                                                        {requiresResponse(
                                                            notification.type,
                                                        ) && (
                                                            notification.can_marketing_response ? (
                                                                (() => {
                                                                    const marketingStatus = isMarketingResponded(notification);
                                                                    if (marketingStatus.responded) return null;

                                                                    return (
                                                                        <button
                                                                            onClick={(e) =>
                                                                                handleMarketingResponse(
                                                                                    notification.id,
                                                                                    e,
                                                                                )
                                                                            }
                                                                            className="mt-2 mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg"
                                                                        >
                                                                            <span>
                                                                                Marketing Response
                                                                            </span>
                                                                            <span>→</span>
                                                                        </button>
                                                                    );
                                                                })()
                                                            ) : (
                                                                <button
                                                                    onClick={(e) =>
                                                                        handleResponse(
                                                                            notification.id,
                                                                            e,
                                                                        )
                                                                    }
                                                                    className="mt-2 mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
                                                                >
                                                                    <span>
                                                                        Response &
                                                                        Buat Record
                                                                    </span>
                                                                    <span>→</span>
                                                                </button>
                                                            )
                                                        )}

                                                        {needsDirectAccess(
                                                            notification.type,
                                                        ) && (
                                                            <button
                                                                onClick={(e) =>
                                                                    handleDirectAccess(
                                                                        notification,
                                                                        e,
                                                                    )
                                                                }
                                                                className="mt-2 mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
                                                            >
                                                                <span>
                                                                    Buka Halaman
                                                                </span>
                                                                <span>→</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {/* View Details Button (if already responded) */}
                                                {responseStatus.responded && (
                                                    <button
                                                        onClick={(e) =>
                                                            handleDirectAccess(
                                                                notification,
                                                                e,
                                                            )
                                                        }
                                                        className="mt-2 mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:from-green-600 hover:to-green-700 hover:shadow-lg"
                                                    >
                                                        <span>
                                                            Lihat Detail
                                                        </span>
                                                        <span>→</span>
                                                    </button>
                                                )}

                                                {/* View Details Button (marketing responded but regular not responded) */}
                                                {!responseStatus.responded &&
                                                    notification.can_marketing_response &&
                                                    isMarketingResponded(notification).responded && (
                                                        <button
                                                            onClick={(e) =>
                                                                handleDirectAccess(
                                                                    notification,
                                                                    e,
                                                                )
                                                            }
                                                            className="mt-2 mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-lg"
                                                        >
                                                            <span>
                                                                Lihat Detail
                                                            </span>
                                                            <span>→</span>
                                                        </button>
                                                    )}

                                                {/* Footer */}
                                                <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-2">
                                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>
                                                            {formatDate(
                                                                notification.created_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(
                                                                        notification.id,
                                                                    );
                                                                }}
                                                                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                                                            >
                                                                Tandai Dibaca
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(
                                                                    notification.id,
                                                                );
                                                            }}
                                                            className="rounded-lg p-1.5 text-stone-400 transition-all hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus notifikasi"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {notifications.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {Array.from(
                                { length: notifications.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() =>
                                        router.visit(
                                            `/notifications?page=${page}`,
                                        )
                                    }
                                    className={`rounded-lg px-4 py-2 font-medium transition-all ${
                                        page === notifications.current_page
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
