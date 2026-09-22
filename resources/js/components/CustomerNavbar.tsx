import { useState } from 'react';
import { router } from '@inertiajs/react';

interface OrderSummary {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface CustomerNavbarProps {
    ordersList?: OrderSummary[];
    selectedOrderId?: number;
    customerName: string;
    customerEmail: string;
    onSelectOrder?: (orderId: number) => void;
}

export default function CustomerNavbar({
    ordersList = [],
    selectedOrderId,
    customerName,
    customerEmail,
    onSelectOrder,
}: CustomerNavbarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-stone-200/80 shadow-sm transition">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-sm text-white font-bold tracking-widest text-lg">
                            M
                        </div>
                        <div>
                            <span className="text-sm font-extrabold tracking-wider text-stone-900 block font-serif">
                                MOEY LIVING
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold block">
                                Client Portal
                            </span>
                        </div>
                    </div>

                    {/* Project Switcher (if multi-project) & Customer Profile */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {ordersList.length > 1 && (
                            <div className="relative">
                                <select
                                    value={selectedOrderId}
                                    onChange={(e) => onSelectOrder && onSelectOrder(Number(e.target.value))}
                                    className="bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer shadow-sm"
                                >
                                    {ordersList.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.nama_project}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Customer Avatar & Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-stone-50 transition border border-transparent hover:border-stone-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-stone-800 to-stone-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                    {getInitials(customerName || 'Customer')}
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="text-xs font-bold text-stone-800 leading-none">{customerName}</p>
                                    <p className="text-[10px] text-stone-400 leading-none mt-1">Klien</p>
                                </div>
                                <svg className="w-3.5 h-3.5 text-stone-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-2.5 border-b border-stone-100">
                                            <p className="text-xs font-bold text-stone-900 truncate">{customerName}</p>
                                            <p className="text-[11px] text-stone-500 truncate mt-0.5">{customerEmail}</p>
                                        </div>
                                        <div className="p-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition text-left"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Keluar (Logout)
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
