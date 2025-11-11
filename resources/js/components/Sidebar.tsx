import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    currentPage?: string;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, currentPage = 'dashboard', onClose }: SidebarProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLinkClick = () => {
        // Close sidebar on mobile when link is clicked
        if (onClose && window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay blur untuk mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 backdrop-blur-sm bg-white/30 z-30 lg:hidden transition-all"
                    onClick={onClose}
                ></div>
            )}
            
            <aside className={`fixed top-0 left-0 z-40 w-60 h-screen pt-16 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-stone-200 lg:translate-x-0 shadow-lg lg:shadow-none`}>
                <div className="h-full px-2.5 pb-3 overflow-y-auto flex flex-col bg-white">
                {/* Master Data Section */}
                <div className="px-1.5 py-2 mb-2">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Master Data</p>
                </div>

                <ul className="space-y-1.5 font-medium flex-1">
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.1s' }}>
                        <Link
                            href="/dashboard"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'dashboard' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`}>
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                </svg>
                            </div>
                            <span className="flex-1 text-xs">Dashboard</span>
                            {currentPage === 'dashboard' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'dashboard' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.2s' }}>
                        <Link
                            href="/divisi"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'divisi' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.2s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'divisi' ? 'text-amber-700 font-medium' : ''}`}>Divisi</span>
                            {currentPage === 'divisi' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'divisi' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.3s' }}>
                        <Link
                            href="/user"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'user' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.3s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'user' ? 'text-amber-700 font-medium' : ''}`}>Users</span>
                            {currentPage === 'user' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'user' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.4s' }}>
                        <Link
                            href="/role"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'role' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.4s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'role' ? 'text-amber-700 font-medium' : ''}`}>Roles</span>
                            {currentPage === 'role' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'role' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.5s' }}>
                        <Link
                            href="/jenis-interior"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'jenis-interior' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.5s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'jenis-interior' ? 'text-amber-700 font-medium' : ''}`}>Interior</span>
                            {currentPage === 'jenis-interior' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'jenis-interior' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.6s' }}>
                        <Link
                            href="/jenis-item"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'jenis-item' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.6s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'jenis-item' ? 'text-amber-700 font-medium' : ''}`}>Item Type</span>
                            {currentPage === 'jenis-item' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'jenis-item' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.7s' }}>
                        <Link
                            href="/produk"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'produk' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.7s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'produk' ? 'text-amber-700 font-medium' : ''}`}>Products</span>
                            {currentPage === 'produk' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'produk' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.8s' }}>
                        <Link
                            href="/item"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'item' 
                                    ? 'text-stone-900 bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.8s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.96 9H9a2 2 0 100-4H6.75A2.75 2.75 0 004.75 2.5a2.5 2.5 0 00-2.466 2.667L1.897 5H1a1 1 0 000 2v3a1 1 0 001 1h1.17l.04.04a.997.997 0 00.042.01L5.96 18H3a1 1 0 100 2h14a1 1 0 100-2h-2.22l-.305-1.222a.997.997 0 00-.01-.042L14.04 11H11a2 2 0 100 4h2.25a2.75 2.75 0 002.25 2.5 2.5 2.5 0 002.466-2.667l.04-.04H19a1 1 0 100-2v-3a1 1 0 00-1-1h-1.17l-.04-.04a.997.997 0 00-.042-.01L14.04 2H17a1 1 0 100-2H3z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'item' ? 'text-amber-700 font-medium' : ''}`}>Items</span>
                            {currentPage === 'item' && (
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'item' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                </ul>

                {/* Operations Section */}
                <div className="px-1.5 py-3 mt-4 mb-2 border-t border-stone-200 pt-4">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Operations</p>
                </div>

                <ul className="space-y-1.5 font-medium mb-6">
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '0.9s' }}>
                        <Link
                            href="/order"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'order' 
                                    ? 'text-stone-900 bg-gradient-to-r from-cyan-50 to-cyan-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '0.9s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'order' ? 'text-cyan-700 font-medium' : ''}`}>Orders</span>
                            {currentPage === 'order' && (
                                <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'order' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '1s' }}>
                        <Link
                            href="/survey-results"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'survey' 
                                    ? 'text-stone-900 bg-gradient-to-r from-emerald-50 to-emerald-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '1s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'survey' ? 'text-emerald-700 font-medium' : ''}`}>Survey Results</span>
                            {currentPage === 'survey' && (
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'survey' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '1.1s' }}>
                        <Link
                            href="/moodboard"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'moodboard' 
                                    ? 'text-stone-900 bg-gradient-to-r from-violet-50 to-violet-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '1.1s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'moodboard' ? 'text-violet-700 font-medium' : ''}`}>Moodboard</span>
                            {currentPage === 'moodboard' && (
                                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'moodboard' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>

                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '1.2s' }}>
                        <Link
                            href="/estimasi"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'estimasi' 
                                    ? 'text-stone-900 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '1.2s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'estimasi' ? 'text-blue-700 font-medium' : ''}`}>Estimasi</span>
                            {currentPage === 'estimasi' && (
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'estimasi' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                    
                    <li className={mounted ? 'slideInLeft' : 'opacity-0'} style={{ animationDelay: '1.3s' }}>
                        <Link
                            href="/commitment-fee"
                            onClick={handleLinkClick}
                            className={`flex items-center p-2 rounded-lg group transition-all ${
                                currentPage === 'commitment' 
                                    ? 'text-stone-900 bg-gradient-to-r from-teal-50 to-teal-100 shadow-sm' 
                                    : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mr-2 shadow-md group-hover:scale-110 transition-transform float`} style={{ animationDelay: '1.3s' }}>
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className={`flex-1 text-xs ${currentPage === 'commitment' ? 'text-teal-700 font-medium' : ''}`}>Commitment Fee</span>
                            {currentPage === 'commitment' && (
                                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                            {currentPage !== 'commitment' && (
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </Link>
                    </li>
                </ul>
                
                <div className="mt-auto pt-2 border-t border-stone-200">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200">
                        <p className="text-xs font-semibold text-cyan-900 mb-0.5">🚀 Operations</p>
                        <p className="text-xs text-cyan-800">Manage your projects & orders</p>
                    </div>
                </div>
            </div>
        </aside>
        </>
    );
}
