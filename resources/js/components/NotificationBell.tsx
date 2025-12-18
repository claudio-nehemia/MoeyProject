import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    
    useEffect(() => {
        fetchUnreadCount();
        
        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(interval);
    }, []);
    
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };
    
    return (
        <button 
            onClick={() => router.visit('/notifications')}
            className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
        >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
}
