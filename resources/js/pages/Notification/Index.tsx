import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Bell, CheckCheck, Trash2, Clock } from 'lucide-react';
import axios from 'axios';

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
        
        // Navigate to action URL if exists
        if (notification.data?.action_url) {
            router.visit(notification.data.action_url);
        }
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
            case 'final_design_request':
                return '🎯';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type: string, isRead: boolean) => {
        if (isRead) return 'bg-stone-50 border-stone-200';
        
        switch (type) {
            case 'survey_request':
                return 'bg-blue-50 border-blue-200';
            case 'moodboard_request':
                return 'bg-purple-50 border-purple-200';
            case 'estimasi_request':
                return 'bg-emerald-50 border-emerald-200';
            case 'design_approval':
                return 'bg-amber-50 border-amber-200';
            case 'final_design_request':
                return 'bg-rose-50 border-rose-200';
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
        <AppLayout>
            <Head title="Notifikasi" />
            
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
                        notifications.data.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`bg-white rounded-xl border-2 ${getNotificationColor(notification.type, notification.is_read)} p-5 transition-all hover:shadow-md cursor-pointer hover:scale-[1.01]`}
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
                                            {!notification.is_read && (
                                                <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
                                            )}
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
                                        
                                        {notification.data?.action_url && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mt-2">
                                                <span>Klik untuk langsung response →</span>
                                            </div>
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
                        ))
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
        </AppLayout>
    );
}