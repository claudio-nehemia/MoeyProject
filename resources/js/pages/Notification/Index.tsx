import { Head, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Bell, CheckCheck, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
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
    order: {
        id: number;
        nama_project: string;
        customer_name: string;
        survey_results?: {
            response_time: string | null;
            response_by: string | null;
        };
        moodboard?: {
            response_time: string | null;
            response_by: string | null;
            response_final_time: string | null;
            response_final_by: string | null;
        };
        estimasi?: {
            response_time: string | null;
            response_by: string | null;
        };
        item_pekerjaans?: Array<{
            response_time: string | null;
            response_by: string | null;
            rab_internal?: {
                response_time: string | null;
                response_by: string | null;
            };
            kontrak?: {
                response_time: string | null;
                response_by: string | null;
            };
        }>;
        gambar_kerja?: {
            response_time: string | null;
            response_by: string | null;
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
    const isResponded = (notification: Notification): { responded: boolean; responseTime: string | null; responseBy: string | null } => {
        const order = notification.order;
        
        switch (notification.type) {
            case 'survey_request':
                return {
                    responded: !!order.survey_results?.response_time,
                    responseTime: order.survey_results?.response_time || null,
                    responseBy: order.survey_results?.response_by || null
                };
            
            case 'moodboard_request':
                return {
                    responded: !!order.moodboard?.response_time,
                    responseTime: order.moodboard?.response_time || null,
                    responseBy: order.moodboard?.response_by || null
                };
            
            case 'estimasi_request':
                return {
                    responded: !!order.estimasi?.response_time,
                    responseTime: order.estimasi?.response_time || null,
                    responseBy: order.estimasi?.response_by || null
                };
            
            case 'final_design_request':
                return {
                    responded: !!order.moodboard?.response_final_time,
                    responseTime: order.moodboard?.response_final_time || null,
                    responseBy: order.moodboard?.response_final_by || null
                };
            
            case 'item_pekerjaan_request':
                const itemPekerjaan = order.item_pekerjaans?.[0];
                return {
                    responded: !!itemPekerjaan?.response_time,
                    responseTime: itemPekerjaan?.response_time || null,
                    responseBy: itemPekerjaan?.response_by || null
                };
            
            case 'rab_internal_request':
                const rabInternal = order.item_pekerjaans?.[0]?.rab_internal;
                return {
                    responded: !!rabInternal?.response_time,
                    responseTime: rabInternal?.response_time || null,
                    responseBy: rabInternal?.response_by || null
                };
            
            case 'kontrak_request':
                const kontrak = order.item_pekerjaans?.[0]?.kontrak;
                return {
                    responded: !!kontrak?.response_time,
                    responseTime: kontrak?.response_time || null,
                    responseBy: kontrak?.response_by || null
                };
            
            case 'gambar_kerja_request':
                return {
                    responded: !!order.gambar_kerja?.response_time,
                    responseTime: order.gambar_kerja?.response_time || null,
                    responseBy: order.gambar_kerja?.response_by || null
                };
            
            // For commitment_fee_request, check if moodboard.commitment_fee exists
            case 'commitment_fee_request':
                return {
                    responded: !!(order.moodboard as any)?.commitment_fee,
                    responseTime: (order.moodboard as any)?.commitment_fee?.response_time || null,
                    responseBy: (order.moodboard as any)?.commitment_fee?.response_by || null
                };
            
            default:
                return { responded: false, responseTime: null, responseBy: null };
        }
    };

    // Notification types yang MEMERLUKAN response (create record)
    const requiresResponse = (type: string): boolean => {
        const typesWithResponse = [
            'survey_request',
            'moodboard_request',
            'estimasi_request',
            'commitment_fee_request',
            'final_design_request',
            'item_pekerjaan_request',
            'rab_internal_request',
            'kontrak_request',
            'gambar_kerja_request',
        ];
        return typesWithResponse.includes(type);
    };

    // Notification types yang HANYA redirect (tidak perlu response)
    const needsDirectAccess = (type: string): boolean => {
        const typesWithoutResponse = [
            'design_approval',
            'invoice_request',
            'survey_schedule_request',
            'survey_ulang_request',
            'approval_material_request',
            'workplan_request',
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

    const handleResponse = async (notificationId: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        
        try {
            router.post(`/notifications/${notificationId}/response`, {}, {
                preserveScroll: false,
                onSuccess: () => {
                    console.log('Response handled successfully');
                },
                onError: (errors) => {
                    console.error('Error handling response:', errors);
                }
            });
        } catch (error) {
            console.error('Error handling response:', error);
        }
    };

    const handleDirectAccess = (notification: Notification, e?: React.MouseEvent) => {
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
        if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) return;
        
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

    const getNotificationColor = (type: string, isRead: boolean, responded: boolean) => {
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
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <Head title="Notifikasi" />
            <Navbar />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} pt-16`}>
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Notifikasi
                                    </h1>
                                    <p className="text-sm text-stone-600">
                                        {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Tidak ada notifikasi baru'}
                                    </p>
                                </div>
                            </div>
                            
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span className="text-sm font-medium">Tandai Semua Dibaca</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {notifications.data.length === 0 ? (
                            <div className="bg-white rounded-xl border-2 border-stone-200 p-12 text-center">
                                <Bell className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-stone-800 mb-2">Tidak Ada Notifikasi</h3>
                                <p className="text-stone-500">Anda akan menerima notifikasi untuk tugas dan update project di sini</p>
                            </div>
                        ) : (
                            notifications.data.map((notification) => {
                                const responseStatus = isResponded(notification);
                                const hasResponse = requiresResponse(notification.type);
                                
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`bg-white rounded-xl border-2 ${getNotificationColor(notification.type, notification.is_read, responseStatus.responded)} p-5 transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-xl bg-white border-2 border-stone-200 flex items-center justify-center text-2xl shadow-sm">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className="font-semibold text-stone-800 text-base">
                                                        {notification.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {responseStatus.responded && (
                                                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Responded
                                                            </span>
                                                        )}
                                                        {!notification.is_read && !responseStatus.responded && (
                                                            <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1"></span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-stone-600 mb-3 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                
                                                {notification.order && (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg mb-3">
                                                        <span className="text-xs font-medium text-stone-700">
                                                            Project: {notification.order.nama_project}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Response Info (if already responded) */}
                                                {responseStatus.responded && (
                                                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm font-semibold text-green-800">Sudah Di-response</span>
                                                        </div>
                                                        <div className="text-xs text-green-700 space-y-0.5 ml-6">
                                                            {responseStatus.responseBy && (
                                                                <div><strong>Oleh:</strong> {responseStatus.responseBy}</div>
                                                            )}
                                                            {responseStatus.responseTime && (
                                                                <div><strong>Waktu:</strong> {formatDate(responseStatus.responseTime)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Conditional Action Buttons */}
                                                {!responseStatus.responded && (
                                                    <>
                                                        {requiresResponse(notification.type) && (
                                                            <button
                                                                onClick={(e) => handleResponse(notification.id, e)}
                                                                className="w-full mt-2 mb-3 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                            >
                                                                <span>Response & Buat Record</span>
                                                                <span>→</span>
                                                            </button>
                                                        )}

                                                        {needsDirectAccess(notification.type) && (
                                                            <button
                                                                onClick={(e) => handleDirectAccess(notification, e)}
                                                                className="w-full mt-2 mb-3 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                            >
                                                                <span>Buka Halaman</span>
                                                                <span>→</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                
                                                {/* View Details Button (if already responded) */}
                                                {responseStatus.responded && (
                                                    <button
                                                        onClick={(e) => handleDirectAccess(notification, e)}
                                                        className="w-full mt-2 mb-3 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <span>Lihat Detail</span>
                                                        <span>→</span>
                                                    </button>
                                                )}
                                                
                                                {/* Footer */}
                                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200">
                                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{formatDate(notification.created_at)}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(notification.id);
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                                            >
                                                                Tandai Dibaca
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(notification.id);
                                                            }}
                                                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Hapus notifikasi"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
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
                            {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => router.visit(`/notifications?page=${page}`)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        page === notifications.current_page
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
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