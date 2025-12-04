import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    currentPage?: string;
    onClose?: () => void;
}

interface AuthUser {
    permissions: string[];
}

export default function Sidebar({
    isOpen,
    currentPage = 'dashboard',
    onClose,
}: SidebarProps) {
    const [mounted, setMounted] = useState(false);
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const userPermissions = auth?.user?.permissions || [];

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLinkClick = () => {
        if (onClose && window.innerWidth < 1024) {
            onClose();
        }
    };

    // Helper function to check if user has permission
    const hasPermission = (permission: string): boolean => {
        return userPermissions.includes(permission);
    };

    // Define menu items with their required permissions
    const masterDataMenus = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            page: 'dashboard',
            permission: null, // Dashboard accessible to all
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
            ),
            gradient: 'from-amber-400 to-amber-600',
        },
        {
            name: 'Divisi',
            href: '/divisi',
            page: 'divisi',
            permission: 'divisi.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                </svg>
            ),
            gradient: 'from-blue-400 to-blue-600',
        },
        {
            name: 'Users',
            href: '/user',
            page: 'user',
            permission: 'user.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                </svg>
            ),
            gradient: 'from-green-400 to-green-600',
        },
        {
            name: 'Roles',
            href: '/role',
            page: 'role',
            permission: 'role.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            gradient: 'from-purple-400 to-purple-600',
        },
        {
            name: 'Interior',
            href: '/jenis-interior',
            page: 'jenis-interior',
            permission: 'jenis-interior.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            ),
            gradient: 'from-teal-400 to-teal-600',
        },
        {
            name: 'Termin',
            href: '/termin',
            page: 'termin',
            permission: 'termin.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            gradient: 'from-pink-400 to-pink-600',
        },
        {
            name: 'Item Type',
            href: '/jenis-item',
            page: 'jenis-item',
            permission: 'jenis-item.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            gradient: 'from-indigo-400 to-indigo-600',
        },
        {
            name: 'Products',
            href: '/produk',
            page: 'produk',
            permission: 'produk.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            gradient: 'from-rose-400 to-rose-600',
        },
        {
            name: 'Items',
            href: '/item',
            page: 'item',
            permission: 'item.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.96 9H9a2 2 0 100-4H6.75A2.75 2.75 0 004.75 2.5a2.5 2.5 0 00-2.466 2.667L1.897 5H1a1 1 0 000 2v3a1 1 0 001 1h1.17l.04.04a.997.997 0 00.042.01L5.96 18H3a1 1 0 100 2h14a1 1 0 100-2h-2.22l-.305-1.222a.997.997 0 00-.01-.042L14.04 11H11a2 2 0 100 4h2.25a2.75 2.75 0 002.25 2.5 2.5 2.5 0 002.466-2.667l.04-.04H19a1 1 0 100-2v-3a1 1 0 00-1-1h-1.17l-.04-.04a.997.997 0 00-.042-.01L14.04 2H17a1 1 0 100-2H3z" />
                </svg>
            ),
            gradient: 'from-orange-400 to-orange-600',
        },
        {
            name: 'Jenis Pengukuran',
            href: '/jenis-pengukuran',
            page: 'jenis-pengukuran',
            permission: null,
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.96 9H9a2 2 0 100-4H6.75A2.75 2.75 0 004.75 2.5a2.5 2.5 0 00-2.466 2.667L1.897 5H1a1 1 0 000 2v3a1 1 0 001 1h1.17l.04.04a.997.997 0 00.042.01L5.96 18H3a1 1 0 100 2h14a1 1 0 100-2h-2.22l-.305-1.222a.997.997 0 00-.01-.042L14.04 11H11a2 2 0 100 4h2.25a2.75 2.75 0 002.25 2.5 2.5 2.5 0 002.466-2.667l.04-.40H19a1 1 0 100-2v-3a1 1 0 00-1-1h-1.17l-.04-.04a.997.997 0 00-.042-.01L14.04 2H17a1 1 0 100-2H3z" />
                </svg>
            ),
            gradient: 'from-yellow-400 to-yellow-600',
        },
    ];

    const operationsMenus = [
        {
            name: 'Orders',
            href: '/order',
            page: 'order',
            permission: 'order.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            gradient: 'from-cyan-400 to-cyan-600',
        },
        {
            name: 'Survey Results',
            href: '/survey-results',
            page: 'survey',
            permission: 'survey-results.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            gradient: 'from-emerald-400 to-emerald-600',
        },
        {
            name: 'Moodboard',
            href: '/moodboard',
            page: 'moodboard',
            permission: 'moodboard.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            ),
            gradient: 'from-violet-400 to-violet-600',
        },
        {
            name: 'Estimasi',
            href: '/estimasi',
            page: 'estimasi',
            permission: 'estimasi.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            gradient: 'from-blue-400 to-blue-600',
        },
        {
            name: 'Commitment Fee',
            href: '/commitment-fee',
            page: 'commitment',
            permission: 'commitment-fee.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: 'from-teal-400 to-teal-600',
        },
        {
            name: 'Desain Final',
            href: '/desain-final',
            page: 'desain-final',
            permission: 'desain-final.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: 'from-indigo-400 to-indigo-600',
        },
        {
            name: 'Item Pekerjaan',
            href: '/item-pekerjaan',
            page: 'item-pekerjaan',
            permission: 'item-pekerjaan.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            gradient: 'from-fuchsia-400 to-fuchsia-600',
        },
        {
            name: 'RAB',
            href: '/rab-internal',
            page: 'rab-internal',
            permission: 'rab-internal.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            gradient: 'from-amber-400 to-amber-600',
        },
        {
            name: 'Kontrak',
            href: '/kontrak',
            page: 'kontrak',
            permission: 'kontrak.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            gradient: 'from-indigo-400 to-indigo-600',
        },
        {
            name: 'Invoice',
            href: '/invoice',
            page: 'invoice',
            permission: 'invoice.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
            ),
            gradient: 'from-purple-400 to-purple-600',
        },
        {
            name: 'Project Management',
            href: '/project-management',
            page: 'project-management',
            permission: 'project-management.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            gradient: 'from-teal-400 to-teal-600',
        },
        {
            name: 'Defect Management',
            href: '/defect-management',
            page: 'defect-management',
            permission: 'defect.index',
            icon: (
                <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            gradient: 'from-red-400 to-red-600',
        },
    ];

    // Filter menus based on permissions
    const visibleMasterData = masterDataMenus.filter(
        menu => !menu.permission || hasPermission(menu.permission)
    );
    
    const visibleOperations = operationsMenus.filter(
        menu => !menu.permission || hasPermission(menu.permission)
    );

    const renderMenuItem = (menu: typeof masterDataMenus[0], index: number) => (
        <li
            key={menu.href}
            className={mounted ? 'slideInLeft' : 'opacity-0'}
            style={{ animationDelay: `${0.1 * (index + 1)}s` }}
        >
            <Link
                href={menu.href}
                onClick={handleLinkClick}
                className={`group flex items-center rounded-lg p-2 transition-all ${
                    currentPage === menu.page
                        ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-stone-900 shadow-sm'
                        : 'text-stone-600 hover:bg-gradient-to-r hover:from-stone-50 hover:to-stone-100'
                }`}
            >
                <div
                    className={`float mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${menu.gradient} shadow-md transition-transform group-hover:scale-110`}
                >
                    {menu.icon}
                </div>
                <span className={`flex-1 text-xs ${currentPage === menu.page ? 'font-medium text-amber-700' : ''}`}>
                    {menu.name}
                </span>
                {currentPage === menu.page && (
                    <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                )}
                {currentPage !== menu.page && (
                    <svg className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </Link>
        </li>
    );

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-white/30 backdrop-blur-sm transition-all lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            <aside
                className={`fixed top-0 left-0 z-40 h-screen w-60 pt-16 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-stone-200 bg-white shadow-lg lg:translate-x-0 lg:shadow-none`}
            >
                <div className="flex h-full flex-col overflow-y-auto bg-white px-2.5 pb-3">
                    {/* Master Data Section */}
                    {visibleMasterData.length > 0 && (
                        <>
                            <div className="mb-2 px-1.5 py-2">
                                <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                                    Master Data
                                </p>
                            </div>
                            <ul className="flex-1 space-y-1.5 font-medium">
                                {visibleMasterData.map((menu, index) => renderMenuItem(menu, index))}
                            </ul>
                        </>
                    )}

                    {/* Operations Section */}
                    {visibleOperations.length > 0 && (
                        <>
                            <div className="mt-4 mb-2 border-t border-stone-200 px-1.5 py-3 pt-4">
                                <p className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                                    Operations
                                </p>
                            </div>
                            <ul className="mb-6 space-y-1.5 font-medium">
                                {visibleOperations.map((menu, index) => 
                                    renderMenuItem(menu, visibleMasterData.length + index)
                                )}
                            </ul>
                        </>
                    )}

                    <div className="mt-auto border-t border-stone-200 pt-2">
                        <div className="rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 p-2">
                            <p className="mb-0.5 text-xs font-semibold text-cyan-900">
                                🚀 Operations
                            </p>
                            <p className="text-xs text-cyan-800">
                                Manage your projects & orders
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}