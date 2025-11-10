import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
    // Set sidebar terbuka di desktop, tertutup di mobile
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024; // lg breakpoint
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Handle window resize
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true); // Auto buka di desktop
            } else {
                setSidebarOpen(false); // Auto tutup di mobile
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            
            {/* Navbar */}
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                currentPage="dashboard" 
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="p-3 lg:ml-60 bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-50 min-h-screen">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className={`mb-5 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div className="flex items-center space-x-2 mb-1.5">
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-3.5 mb-5 md:grid-cols-3">
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
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                                        </svg>
                                        <span className="text-xs font-semibold">+12%</span>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-1.5">
                                    Total Projects
                                </p>
                                <h3 className="text-3xl font-light text-stone-800 mb-1">24</h3>
                                <p className="text-xs text-stone-500">Active this month</p>
                            </div>
                        </div>

                        <div className={`card-hover gradient-border bg-white rounded-xl border border-stone-200 p-5 shadow-sm overflow-hidden relative ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-14 -mt-14 opacity-50"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '0.5s' }}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                                        </svg>
                                    </div>
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                                        </svg>
                                        <span className="text-xs font-semibold">+8%</span>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">
                                    Active Clients
                                </p>
                                <h3 className="text-4xl font-light text-stone-800 mb-1">18</h3>
                                <p className="text-xs text-stone-500">Growing steadily</p>
                            </div>
                        </div>

                        <div className={`card-hover gradient-border bg-white rounded-xl border border-stone-200 p-6 shadow-sm overflow-hidden relative ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                                        </svg>
                                        <span className="text-xs font-semibold">+3%</span>
                                    </div>
                                </div>
                                <p className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2">
                                    Completion Rate
                                </p>
                                <h3 className="text-4xl font-light text-stone-800 mb-1">94%</h3>
                                <p className="text-xs text-stone-500">Above target</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { emoji: '🏠', title: 'Modern Living Room Design', desc: 'Client review completed for minimalist interior concept', time: '2 hours ago', color: 'from-pink-400 to-pink-600' },
                                { emoji: '🛋️', title: 'Office Space Renovation', desc: 'Material selection phase initiated', time: '5 hours ago', color: 'from-purple-400 to-purple-600' },
                                { emoji: '🍽️', title: 'Restaurant Interior', desc: 'Final presentation scheduled', time: '1 day ago', color: 'from-blue-400 to-blue-600' },
                                { emoji: '🏢', title: 'Boutique Hotel Lobby', desc: 'Concept approval received', time: '2 days ago', color: 'from-green-400 to-green-600' },
                            ].map((item, index) => (
                                <div key={index} className={`group p-4 rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                            <span className="text-lg">{item.emoji}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-stone-400">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                            </svg>
                                            <span className="text-xs">{item.time}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-semibold text-stone-800 mb-1 group-hover:text-amber-700 transition-colors">{item.title}</h4>
                                    <p className="text-xs text-stone-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
