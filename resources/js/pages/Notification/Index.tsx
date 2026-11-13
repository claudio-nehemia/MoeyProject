import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowRight,
    BarChart3,
    Bell,
    Building2,
    Calendar,
    Check,
    CheckCheck,
    CheckCircle2,
    CheckSquare,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    Edit3,
    Eye,
    FileText,
    LucideIcon,
    Megaphone,
    Palette,
    Receipt,
    RefreshCw,
    Ruler,
    Target,
    Trash2,
    User,
} from 'lucide-react';
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
    can_update_data?: boolean;
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
            pm_response_final_time?: string | null;
            pm_response_final_by?: string | null;
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
            approval_rab_response_time?: string | null;
            approval_rab_response_by?: string | null;
            pm_approval_rab_response_time?: string | null;
            pm_approval_rab_response_by?: string | null;
            rab_internal?: {
                response_time: string | null;
                response_by: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            };
            kontrak?: {
                response_time: string | null;
                response_by: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            };
            invoices?: Array<{
                response_time: string | null;
                response_by: string | null;
                pm_response_time?: string | null;
                pm_response_by?: string | null;
            }>;
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
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const [notificationsList, setNotificationsList] = useState<Notification[]>(
        notifications.data,
    );
    const [localUnreadCount, setLocalUnreadCount] = useState<number>(unreadCount);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        setNotificationsList(notifications.data);
    }, [notifications.data]);

    useEffect(() => {
        setLocalUnreadCount(unreadCount);
    }, [unreadCount]);

    useEffect(() => {
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

    const removeNotificationOptimistically = (id: number) => {
        setNotificationsList((prev) => prev.filter((item) => item.id !== id));
        setLocalUnreadCount((prev) => Math.max(0, prev - 1));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('notifications-updated'));
        }
    };

    // Check if notification has been responded
    const isResponded = (
        notification: Notification,
    ): {
        responded: boolean;
        responseTime: string | null;
        responseBy: string | null;
    } => {
        const order = notification.order;
        if (!order) {
            return {
                responded: false,
                responseTime: null,
                responseBy: null,
            };
        }

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

            case 'item_pekerjaan_request': {
                const itemPekerjaan = order.item_pekerjaans?.[0];
                return {
                    responded: !!itemPekerjaan?.response_time,
                    responseTime: itemPekerjaan?.response_time || null,
                    responseBy: itemPekerjaan?.response_by || null,
                };
            }

            case 'rab_internal_request':
            case 'approval_rab_update': {
                const rabInternal = order.item_pekerjaans?.[0]?.rab_internal;
                return {
                    responded: !!rabInternal?.response_time,
                    responseTime: rabInternal?.response_time || null,
                    responseBy: rabInternal?.response_by || null,
                };
            }

            case 'kontrak_request': {
                const kontrak = order.item_pekerjaans?.[0]?.kontrak;
                return {
                    responded: !!kontrak?.response_time,
                    responseTime: kontrak?.response_time || null,
                    responseBy: kontrak?.response_by || null,
                };
            }

            case 'survey_schedule_request':
                return {
                    responded: !!order.survey_response_time,
                    responseTime: order.survey_response_time || null,
                    responseBy: order.survey_response_by || null,
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

            case 'invoice_request': {
                const invoice = order.item_pekerjaans?.[0]?.invoices?.[0];
                return {
                    responded: !!invoice?.response_time,
                    responseTime: invoice?.response_time || null,
                    responseBy: invoice?.response_by || null,
                };
            }

            case 'workplan_request': {
                const hasAnyWorkplanResponse =
                    order.moodboard?.item_pekerjaans?.some((ip) =>
                        ip.produks?.some((produk) =>
                            produk.workplan_items?.some(
                                (workplan) => workplan.response_time,
                            ),
                        ),
                    ) || false;

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
            }

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

            case 'approval_material_request': {
                const itemPekerjaanApproval = order.item_pekerjaans?.[0];
                return {
                    responded:
                        !!itemPekerjaanApproval?.approval_rab_response_time,
                    responseTime:
                        itemPekerjaanApproval?.approval_rab_response_time ||
                        null,
                    responseBy:
                        itemPekerjaanApproval?.approval_rab_response_by || null,
                };
            }

            case 'jadwal_meeting_vendor_request':
            case 'jadwal_meeting_approval_request':
                return {
                    responded: !!(order as any).meeting_vendor?.response_time,
                    responseTime:
                        (order as any).meeting_vendor?.response_time || null,
                    responseBy:
                        (order as any).meeting_vendor?.response_by || null,
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
        if (!order) {
            return {
                responded: false,
                responseTime: null,
                responseBy: null,
            };
        }

        switch (notification.type) {
            case 'survey_request':
                return {
                    responded: !!order.survey_results?.pm_response_time,
                    responseTime:
                        order.survey_results?.pm_response_time || null,
                    responseBy: order.survey_results?.pm_response_by || null,
                };

            case 'survey_schedule_request':
                return {
                    responded: !!order.pm_survey_response_time,
                    responseTime: order.pm_survey_response_time || null,
                    responseBy: order.pm_survey_response_by || null,
                };

            case 'moodboard_request':
                return {
                    responded: !!order.moodboard?.pm_response_time,
                    responseTime: order.moodboard?.pm_response_time || null,
                    responseBy: order.moodboard?.pm_response_by || null,
                };

            case 'final_design_request':
                return {
                    responded: !!order.moodboard?.pm_response_final_time,
                    responseTime:
                        order.moodboard?.pm_response_final_time || null,
                    responseBy: order.moodboard?.pm_response_final_by || null,
                };

            case 'estimasi_request':
                return {
                    responded: !!(order.estimasi as any)?.pm_response_time,
                    responseTime:
                        (order.estimasi as any)?.pm_response_time || null,
                    responseBy:
                        (order.estimasi as any)?.pm_response_by || null,
                };

            case 'commitment_fee_request':
                return {
                    responded: !!(order.moodboard as any)?.commitment_fee
                        ?.pm_response_time,
                    responseTime:
                        (order.moodboard as any)?.commitment_fee
                            ?.pm_response_time || null,
                    responseBy:
                        (order.moodboard as any)?.commitment_fee
                            ?.pm_response_by || null,
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

            case 'rab_internal_request':
            case 'approval_rab_update': {
                const rabInternal = order.item_pekerjaans?.[0]?.rab_internal;
                return {
                    responded: !!rabInternal?.pm_response_time,
                    responseTime: rabInternal?.pm_response_time || null,
                    responseBy: rabInternal?.pm_response_by || null,
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

            case 'invoice_request': {
                const invoice = order.item_pekerjaans?.[0]?.invoices?.[0];
                return {
                    responded: !!invoice?.pm_response_time,
                    responseTime: invoice?.pm_response_time || null,
                    responseBy: invoice?.pm_response_by || null,
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

            case 'approval_material_request': {
                const itemPekerjaanApprovalPm = order.item_pekerjaans?.[0];
                return {
                    responded:
                        !!itemPekerjaanApprovalPm?.pm_approval_rab_response_time,
                    responseTime:
                        itemPekerjaanApprovalPm?.pm_approval_rab_response_time ||
                        null,
                    responseBy:
                        itemPekerjaanApprovalPm?.pm_approval_rab_response_by ||
                        null,
                };
            }

            case 'jadwal_meeting_vendor_request':
            case 'jadwal_meeting_approval_request':
                return {
                    responded: !!(order as any).meeting_vendor?.pm_response_time,
                    responseTime:
                        (order as any).meeting_vendor?.pm_response_time || null,
                    responseBy:
                        (order as any).meeting_vendor?.pm_response_by || null,
                };

            default:
                return {
                    responded: false,
                    responseTime: null,
                    responseBy: null,
                };
        }
    };

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
            'invoice_request',
            'gambar_kerja_request',
            'jadwal_meeting_vendor_request',
            'jadwal_meeting_approval_request',
            'approval_material_request',
            'workplan_request',
        ];
        return typesWithResponse.includes(type);
    };

    const handleMarketingResponse = (
        notificationId: number,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }
        if (processingId === notificationId) return;
        setProcessingId(notificationId);
        removeNotificationOptimistically(notificationId);

        router.post(
            `/notifications/${notificationId}/response`,
            { is_marketing: 1 },
            {
                preserveScroll: false,
                onError: (errors) => {
                    console.error('Error handling marketing response:', errors);
                    setProcessingId(null);
                    router.reload();
                },
            },
        );
    };

    const handleResponse = (
        notificationId: number,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }
        if (processingId === notificationId) return;
        setProcessingId(notificationId);
        removeNotificationOptimistically(notificationId);

        router.post(
            `/notifications/${notificationId}/response`,
            {},
            {
                preserveScroll: false,
                onError: (errors) => {
                    console.error('Error handling response:', errors);
                    setProcessingId(null);
                    router.reload();
                },
            },
        );
    };

    const handleViewOrderDetail = (
        notification: Notification,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }
        if (processingId === notification.id) return;
        setProcessingId(notification.id);
        removeNotificationOptimistically(notification.id);

        router.post(
            `/notifications/${notification.id}/response`,
            { is_detail_only: 1 },
            {
                preserveScroll: false,
                onError: (errors) => {
                    console.error('Error navigating to order detail:', errors);
                    setProcessingId(null);
                    router.reload();
                },
            },
        );
    };

    // Clicking anywhere on the notification card immediately removes it and navigates to the detail/action page
    const handleNotificationClick = (notification: Notification) => {
        const marketingStatus = notification.can_marketing_response
            ? isMarketingResponded(notification)
            : null;

        if (
            isKepalaMarketing &&
            notification.can_marketing_response &&
            requiresResponse(notification.type) &&
            !marketingStatus?.responded
        ) {
            handleMarketingResponse(notification.id);
            return;
        }

        if (isKepalaMarketing || notification.can_update_data === false) {
            handleViewOrderDetail(notification);
            return;
        }

        handleResponse(notification.id);
    };

    const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        removeNotificationOptimistically(id);
        try {
            await axios.post(`/notifications/${id}/mark-as-read`);
        } catch (error) {
            console.error('Error marking as read:', error);
            router.reload();
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotificationsList([]);
        setLocalUnreadCount(0);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('notifications-updated'));
        }
        try {
            await axios.post('/notifications/mark-all-as-read');
            router.reload();
        } catch (error) {
            console.error('Error marking all as read:', error);
            router.reload();
        }
    };

    const handleDelete = async (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?'))
            return;

        removeNotificationOptimistically(id);
        try {
            await axios.delete(`/notifications/${id}`);
        } catch (error) {
            console.error('Error deleting notification:', error);
            router.reload();
        }
    };

    const getNotificationIcon = (type: string): LucideIcon => {
        switch (type) {
            case 'survey_request':
                return ClipboardList;
            case 'moodboard_request':
                return Palette;
            case 'estimasi_request':
                return Coins;
            case 'design_approval':
                return Check;
            case 'commitment_fee_request':
                return CreditCard;
            case 'final_design_request':
                return Target;
            case 'item_pekerjaan_request':
                return Edit3;
            case 'rab_internal_request':
            case 'approval_rab_update':
                return BarChart3;
            case 'kontrak_request':
                return FileText;
            case 'invoice_request':
                return Receipt;
            case 'survey_schedule_request':
                return Calendar;
            case 'survey_ulang_request':
                return RefreshCw;
            case 'gambar_kerja_request':
                return Ruler;
            case 'approval_material_request':
                return CheckSquare;
            case 'workplan_request':
                return ClipboardList;
            case 'project_management_request':
                return BarChart3;
            default:
                return Megaphone;
        }
    };

    const getStageBadge = (type: string): { label: string; badgeClass: string; iconBg: string } => {
        switch (type) {
            case 'survey_request':
                return { label: 'Hasil Survey', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-50 text-blue-600 border-blue-200' };
            case 'survey_schedule_request':
                return { label: 'Jadwal Survey', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200', iconBg: 'bg-sky-50 text-sky-600 border-sky-200' };
            case 'survey_ulang_request':
                return { label: 'Survey Ulang', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
            case 'moodboard_request':
            case 'design_approval':
                return { label: 'Moodboard & Desain', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', iconBg: 'bg-purple-50 text-purple-600 border-purple-200' };
            case 'estimasi_request':
                return { label: 'Estimasi Harga', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            case 'commitment_fee_request':
                return { label: 'Commitment Fee', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-50 text-amber-600 border-amber-200' };
            case 'final_design_request':
                return { label: 'Desain Final', badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', iconBg: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' };
            case 'gambar_kerja_request':
                return { label: 'Gambar Kerja', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', iconBg: 'bg-rose-50 text-rose-600 border-rose-200' };
            case 'item_pekerjaan_request':
                return { label: 'Item Pekerjaan', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200', iconBg: 'bg-orange-50 text-orange-600 border-orange-200' };
            case 'approval_material_request':
                return { label: 'Gambar Kerja Final', badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200', iconBg: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
            case 'rab_internal_request':
            case 'approval_rab_update':
                return { label: 'RAB Internal', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200', iconBg: 'bg-teal-50 text-teal-600 border-teal-200' };
            case 'kontrak_request':
                return { label: 'Kontrak Kerja', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200', iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200' };
            case 'invoice_request':
                return { label: 'Invoice Pembayaran', badgeClass: 'bg-violet-50 text-violet-700 border-violet-200', iconBg: 'bg-violet-50 text-violet-600 border-violet-200' };
            case 'jadwal_meeting_vendor_request':
            case 'jadwal_meeting_approval_request':
                return { label: 'Meeting Vendor', badgeClass: 'bg-lime-50 text-lime-700 border-lime-200', iconBg: 'bg-lime-50 text-lime-600 border-lime-200' };
            case 'workplan_request':
                return { label: 'Workplan Proyek', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
            case 'project_management_request':
                return { label: 'Project Management', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-50 text-blue-600 border-blue-200' };
            default:
                return { label: 'Notifikasi Proyek', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200', iconBg: 'bg-stone-100 text-stone-600 border-stone-200' };
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
                <div className="mx-auto max-w-5xl p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                            Kotak Masuk Notifikasi
                                        </h1>
                                        {localUnreadCount > 0 && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                                {localUnreadCount} Baru
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-sm text-stone-500">
                                        Klik pada notifikasi untuk langsung menuju halaman detail pengerjaan proyek.
                                    </p>
                                </div>
                            </div>

                            {notificationsList.length > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100"
                                >
                                    <CheckCheck className="h-4 w-4 text-amber-600" />
                                    <span>Bersihkan Semua Dibaca</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {notificationsList.length === 0 ? (
                            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                                    <Bell className="h-8 w-8" />
                                </div>
                                <h3 className="mb-1.5 text-lg font-bold text-slate-800">
                                    Semua Tugas Telah Ditindaklanjuti
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-stone-500">
                                    Tidak ada notifikasi baru saat ini. Setiap pembaruan tahap proyek atau permintaan aksi akan muncul di halaman ini.
                                </p>
                            </div>
                        ) : (
                            notificationsList.map((notification) => {
                                const responseStatus = isResponded(notification);
                                const marketingStatus =
                                    notification.can_marketing_response
                                        ? isMarketingResponded(notification)
                                        : null;
                                const stageMeta = getStageBadge(notification.type);
                                const NotifIcon = getNotificationIcon(
                                    notification.type,
                                );
                                const isMarketingAction =
                                    isKepalaMarketing &&
                                    notification.can_marketing_response &&
                                    requiresResponse(notification.type) &&
                                    !marketingStatus?.responded;
                                const isNonActionRole =
                                    isKepalaMarketing ||
                                    notification.can_update_data === false;

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() =>
                                            handleNotificationClick(notification)
                                        }
                                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                                    >
                                        {/* Left Accent Bar */}
                                        <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500 transition-all group-hover:w-2" />

                                        <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-start">
                                            {/* Icon */}
                                            <div className="flex items-center justify-between sm:block">
                                                <div
                                                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border ${stageMeta.iconBg}`}
                                                >
                                                    <NotifIcon className="h-5 w-5" />
                                                </div>
                                                <span className="text-xs text-stone-400 sm:hidden">
                                                    {formatDate(
                                                        notification.created_at,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${stageMeta.badgeClass}`}
                                                        >
                                                            {stageMeta.label}
                                                        </span>
                                                        {responseStatus.responded && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Sudah Di-response
                                                            </span>
                                                        )}
                                                        {marketingStatus?.responded && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Marketing Responded
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="hidden items-center gap-1.5 text-xs text-stone-400 sm:flex">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>
                                                            {formatDate(
                                                                notification.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                    {notification.title}
                                                </h3>

                                                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                                                    {notification.message}
                                                </p>

                                                {/* Project Info Bar */}
                                                {notification.order && (
                                                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80 px-3.5 py-2 text-xs text-stone-700">
                                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                                            <Building2 className="h-3.5 w-3.5 text-amber-600" />
                                                            <span>
                                                                {
                                                                    notification
                                                                        .order
                                                                        .nama_project
                                                                }
                                                            </span>
                                                        </div>
                                                        {notification.order
                                                            .customer_name && (
                                                            <>
                                                                <span className="text-stone-300">
                                                                    •
                                                                </span>
                                                                <div className="flex items-center gap-1 text-stone-600">
                                                                    <User className="h-3.5 w-3.5 text-stone-400" />
                                                                    <span>
                                                                        {
                                                                            notification
                                                                                .order
                                                                                .customer_name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Footer */}
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {isMarketingAction ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleMarketingResponse(
                                                                            notification.id,
                                                                            e,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-700"
                                                                >
                                                                    <span>
                                                                        Marketing Response
                                                                    </span>
                                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                                </button>
                                                                {notification.order && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) =>
                                                                            handleViewOrderDetail(
                                                                                notification,
                                                                                e,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5 text-amber-600" />
                                                                        <span>
                                                                            Detail Order
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : isNonActionRole ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) =>
                                                                    handleViewOrderDetail(
                                                                        notification,
                                                                        e,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all group-hover:bg-amber-600"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                <span>
                                                                    Detail Order
                                                                </span>
                                                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleResponse(
                                                                            notification.id,
                                                                            e,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all group-hover:bg-amber-600"
                                                                >
                                                                    <span>
                                                                        {requiresResponse(
                                                                            notification.type,
                                                                        ) &&
                                                                        isNotKepalaMarketing &&
                                                                        !responseStatus.responded
                                                                            ? 'Terima Tugas & Buka Detail'
                                                                            : 'Buka Detail Pengerjaan'}
                                                                    </span>
                                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                                </button>
                                                                {notification.order && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) =>
                                                                            handleViewOrderDetail(
                                                                                notification,
                                                                                e,
                                                                            )
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5 text-amber-600" />
                                                                        <span>
                                                                            Detail Order
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleMarkAsRead(
                                                                    notification.id,
                                                                    e,
                                                                )
                                                            }
                                                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                                                        >
                                                            Tandai Selesai
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleDelete(
                                                                    notification.id,
                                                                    e,
                                                                )
                                                            }
                                                            className="rounded-lg p-1.5 text-stone-400 transition-all hover:bg-red-50 hover:text-red-600"
                                                            title="Hapus notifikasi"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                        page === notifications.current_page
                                            ? 'bg-amber-500 text-white shadow-sm'
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
