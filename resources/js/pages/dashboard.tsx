import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface JenisInterior {
    id: number;
    nama_jenis: string;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    customer_additional_info?: string;
    nomor_unit?: string;
    phone_number: string;
    tanggal_masuk_customer: string;
    project_status: 'pending' | 'in_progress' | 'deal' | 'cancel';
    priority_level: 'low' | 'medium' | 'high' | 'urgent';
    jenis_interior_id: number;
    jenis_interior?: JenisInterior;
    mom_file?: string;
    tanggal_survey?: string;
    payment_status: string;
    tahapan_proyek: string;
    alamat: string;
    created_at: string;
    updated_at: string;
}

interface CurrentUser {
    name: string;
    email: string;
    role: string | null;
    divisi: string | null;
}

interface DashboardProps {
    totalOrders: number;
    activeOrders: number;
    completeProjects: number;
    recentOrders: Order[];
    completePercentage: number;
    currentUser: CurrentUser;
}

export default function Dashboard({ 
    totalOrders, 
    activeOrders, 
    completeProjects, 
    recentOrders, 
    completePercentage,
    currentUser
}: DashboardProps) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState<boolean>(false);

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
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    // ... rest of your existing functions (getRelativeTime, getEmojiForInterior, etc.)
    const getRelativeTime = (date: string): string => {
        const now = new Date();
        const created = new Date(date);
        const diffInMs = now.getTime() - created.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInDays === 1) return '1 day ago';
        return `${diffInDays} days ago`;
    };

    const getEmojiForInterior = (jenisInterior?: string): string => {
        const emojiMap: Record<string, string> = {
            'Living Room': '🏠',
            'Bedroom': '🛏️',
            'Kitchen': '🍽️',
            'Office': '🛋️',
            'Restaurant': '🍽️',
            'Hotel': '🏢',
            'Cafe': '☕',
            'Retail': '🏪',
            'Bathroom': '🚿',
            'Dining Room': '🍴'
        };
        return jenisInterior ? (emojiMap[jenisInterior] || '🏠') : '🏠';
    };

    const getColorGradient = (index: number): string => {
        const colors = [
            'from-pink-400 to-pink-600',
            'from-purple-400 to-purple-600',
            'from-blue-400 to-blue-600',
            'from-green-400 to-green-600'
        ];
        return colors[index % colors.length];
    };

    const getPriorityColor = (priority: string): string => {
        const priorityMap: Record<string, string> = {
            'low': 'bg-gray-100 text-gray-700',
            'medium': 'bg-blue-100 text-blue-700',
            'high': 'bg-orange-100 text-orange-700',
            'urgent': 'bg-red-100 text-red-700'
        };
        return priorityMap[priority] || 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (order: Order): string => {
        if (order.tahapan_proyek === 'selesai') return 'Project completed successfully';
        if (order.project_status === 'deal') return 'Contract signed and active';
        if (order.project_status === 'in_progress') return 'Design phase in progress';
        if (order.project_status === 'pending') return 'Awaiting client approval';
        if (order.project_status === 'cancel') return 'Project has been cancelled';
        return 'Status being updated';
    };

    const getStatusDisplay = (status: string): string => {
        const statusMap: Record<string, string> = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'deal': 'Active',
            'cancel': 'Cancelled'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (order: Order): string => {
        if (order.tahapan_proyek === 'selesai') return 'bg-green-100 text-green-700';
        if (order.project_status === 'deal') return 'bg-blue-100 text-blue-700';
        if (order.project_status === 'in_progress') return 'bg-amber-100 text-amber-700';
        if (order.project_status === 'cancel') return 'bg-red-100 text-red-700';
        return 'bg-stone-100 text-stone-700';
    };

    return (
        <>
            <Head title="Dashboard" />
            
            {/* Add custom animations and styles */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }

                .animate-slideInLeft {
                    animation: slideInLeft 0.5s ease-out forwards;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .card-hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                }

                .glass-effect {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .gradient-border {
                    position: relative;
                }

                .gradient-border::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 0.75rem;
                    padding: 1px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .gradient-border:hover::before {
                    opacity: 1;
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar 
                isOpen={sidebarOpen} 
                currentPage="dashboard" 
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60 bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-50 min-h-screen">
                <div className="p-3 mt-12">
                    {/* Header with User Info */}
                    <div className={`mb-6 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Welcome Back</span>
                                </div>
                                <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1.5 bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Dashboard Overview
                                </h1>
                                <p className="text-xs text-stone-600 flex items-center space-x-1.5">
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                    </svg>
                                    <span>Here's what's happening with your projects today</span>
                                </p>
                            </div>

                            {/* User Profile Card */}
                            <div className="hidden lg:block">
                                <div className="card-hover bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientFromName(currentUser.name)} flex items-center justify-center shadow-lg`}>
                                            <span className="text-white font-bold text-sm">
                                                {getInitials(currentUser.name)}
                                            </span>
                                        </div>
                                        
                                        {/* User Info */}
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-stone-900">
                                                {currentUser.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {currentUser.role && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                                                        {currentUser.role}
                                                    </span>
                                                )}
                                                {currentUser.divisi && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                        {currentUser.divisi}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile User Card */}
                        <div className="lg:hidden mb-4">
                            <div className="card-hover bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradientFromName(currentUser.name)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                        <span className="text-white font-bold text-base">
                                            {getInitials(currentUser.name)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-stone-900 truncate">
                                            {currentUser.name}
                                        </h3>
                                        <p className="text-xs text-stone-500 truncate mb-1">
                                            {currentUser.email}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {currentUser.role && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                                                    {currentUser.role}
                                                </span>
                                            )}
                                            {currentUser.divisi && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                    {currentUser.divisi}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-3.5 mb-5 md:grid-cols-3">
                        {/* ... existing stats cards ... */}
                        {/* Total Orders */}
                        <div className={`card-hover gradient-border bg-white rounded-xl border border-stone-200 p-5 shadow-sm overflow-hidden relative ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-100 to-transparent rounded-full -mr-14 -mt-14 opacity-50"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg animate-float">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-1.5">
                                    Total Orders
                                </p>
                                <h3 className="text-3xl font-light text-stone-800 mb-1">{totalOrders}</h3>
                                <p className="text-xs text-stone-500">All time projects</p>
                            </div>
                        </div>

                        {/* Active Orders */}
                        <div className={`card-hover gradient-border bg-white rounded-xl border border-stone-200 p-5 shadow-sm overflow-hidden relative ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-14 -mt-14 opacity-50"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">
                                    Active Projects
                                </p>
                                <h3 className="text-4xl font-light text-stone-800 mb-1">{activeOrders}</h3>
                                <p className="text-xs text-stone-500">Currently in progress</p>
                            </div>
                        </div>

                        {/* Completion Rate */}
                        <div className={`card-hover gradient-border bg-white rounded-xl border border-stone-200 p-6 shadow-sm overflow-hidden relative ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">
                                    Completion Rate
                                </p>
                                <h3 className="text-4xl font-light text-stone-800 mb-1">{completePercentage}%</h3>
                                <p className="text-xs text-stone-500">{completeProjects} projects completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity - rest of your code... */}
                    <div className={`card-hover bg-white rounded-xl border border-stone-200 p-6 shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-light text-stone-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Recent Activity
                                </h2>
                                <p className="text-sm text-stone-500">Latest updates from your projects</p>
                            </div>
                            <button className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all">
                                View All
                            </button>
                        </div>
                        
                        {recentOrders && recentOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recentOrders.map((order, index) => (
                                    <div 
                                        key={order.id} 
                                        className={`group p-4 rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} 
                                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorGradient(index)} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                                <span className="text-lg">
                                                    {getEmojiForInterior(order.jenis_interior?.nama_jenis)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1 text-stone-400">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                                </svg>
                                                <span className="text-xs">{getRelativeTime(order.created_at)}</span>
                                            </div>
                                        </div>
                                        
                                        <h4 className="text-sm font-semibold text-stone-800 mb-1 group-hover:text-amber-700 transition-colors truncate">
                                            {order.nama_project || 'Untitled Project'}
                                        </h4>
                                        
                                        <div className="mb-2 space-y-0.5">
                                            <p className="text-xs text-stone-600 flex items-center">
                                                <svg className="w-3 h-3 mr-1 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                                </svg>
                                                <span className="truncate">{order.customer_name}</span>
                                            </p>
                                            {order.company_name && (
                                                <p className="text-xs text-stone-500 flex items-center">
                                                    <svg className="w-3 h-3 mr-1 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"></path>
                                                    </svg>
                                                    <span className="truncate">{order.company_name}</span>
                                                </p>
                                            )}
                                            <p className="text-xs text-stone-500">
                                                {order.jenis_interior?.nama_jenis || 'Interior Design'} {order.nomor_unit ? `• Unit ${order.nomor_unit}` : ''}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order)}`}>
                                                {order.tahapan_proyek === 'selesai' 
                                                    ? 'Completed' 
                                                    : getStatusDisplay(order.project_status)
                                                }
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(order.priority_level)}`}>
                                                {order.priority_level.charAt(0).toUpperCase() + order.priority_level.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-stone-500 text-sm">No recent activity yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}