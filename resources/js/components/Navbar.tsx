import { Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface NavbarProps {
    onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <nav className="fixed top-0 z-50 w-full glass-effect border-b border-stone-200 shadow-sm">
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
                        <button className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="relative flex items-center">
                            <button 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex text-sm rounded-full focus:ring-4 focus:ring-amber-200 transition-all hover:scale-105"
                            >
                                <span className="sr-only">Open user menu</span>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                                    <span className="text-xs font-semibold text-white">A</span>
                                </div>
                            </button>
                            
                            {/* User Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden">
                                    <div className="py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 flex items-center transition-all"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
