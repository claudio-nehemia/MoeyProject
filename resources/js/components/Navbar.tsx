import { Link, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import NotificationBell from '@/components/NotificationBell';

interface NavbarProps {
    onToggleSidebar?: () => void;
}

interface User {
    name: string;
    email: string;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth?.user;

    const handleLogout = () => {
        router.post('/logout');
    };

    // Get initials from name
    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get gradient color based on name
    const getGradientFromName = (name: string): string => {
        const gradients = [
            'from-violet-400 to-violet-600',
            'from-blue-400 to-blue-600',
            'from-indigo-400 to-indigo-600',
            'from-purple-400 to-purple-600',
            'from-pink-400 to-pink-600',
            'from-amber-400 to-amber-600',
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-stone-200 shadow-sm">
            <div className="px-3 py-2.5 lg:px-5 lg:pl-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start">
                        {onToggleSidebar && (
                            <button
                                onClick={onToggleSidebar}
                                className="inline-flex items-center p-2 text-sm text-stone-500 rounded-lg lg:hidden hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                            >
                                <span className="sr-only">Open sidebar</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                                </svg>
                            </button>
                        )}
                        <Link href="/" className="flex ml-2 md:mr-24 items-center">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-2.5 shadow-lg">
                                <span className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>M</span>
                            </div>
                            <span className="self-center text-lg font-semibold sm:text-xl whitespace-nowrap text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Moey Admin
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        
                        {/* User Info with Avatar */}
                        <div className="relative flex items-center">
                            <button 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 text-sm rounded-full focus:ring-4 focus:ring-amber-200 transition-all hover:bg-stone-50 px-2 py-1.5 rounded-lg"
                            >
                                <span className="sr-only">Open user menu</span>
                                
                                {/* User Name - Hidden on small screens */}
                                <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[150px] truncate">
                                    {user?.name || 'User'}
                                </span>
                                
                                {/* Avatar with Dynamic Initials */}
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradientFromName(user?.name || 'User')} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <span className="text-xs font-bold text-white">
                                        {getInitials(user?.name || 'User')}
                                    </span>
                                </div>
                                
                                {/* Dropdown Arrow */}
                                <svg 
                                    className={`hidden sm:block w-4 h-4 text-stone-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* User Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    {/* Backdrop overlay */}
                                    <div 
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    ></div>
                                    
                                    <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden">
                                        {/* User Info Header */}
                                        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50">
                                            <p className="text-sm font-semibold text-stone-900 truncate">
                                                {user?.name || 'User'}
                                            </p>
                                            <p className="text-xs text-stone-500 truncate">
                                                {user?.email || 'user@example.com'}
                                            </p>
                                        </div>
                                        
                                        {/* Menu Items */}
                                        <div className="py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 flex items-center transition-all group"
                                            >
                                                <svg className="w-4 h-4 mr-3 text-stone-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span className="group-hover:text-red-700">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}