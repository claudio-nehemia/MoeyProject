import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        nama_role: string;
    };
}

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface Divisi {
    id: number;
    nama_divisi: string;
}

interface OrderDetail {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    customer_additional_info: string;
    nomor_unit: string;
    phone_number: string;
    tanggal_masuk_customer: string;
    project_status: string;
    priority_level: string;
    jenis_interior: JenisInterior;
    users: User[];
    mom_file: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    order: OrderDetail;
}

export default function Show({ order }: Props) {
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

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border border-blue-300';
            case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-300';
            default: return 'bg-stone-100 text-stone-700 border border-stone-300';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch(priority.toLowerCase()) {
            case 'urgent': return 'bg-red-100 text-red-700 border border-red-300';
            case 'high': return 'bg-orange-100 text-orange-700 border border-orange-300';
            case 'medium': return 'bg-blue-100 text-blue-700 border border-blue-300';
            case 'low': return 'bg-stone-100 text-stone-700 border border-stone-300';
            default: return 'bg-stone-100 text-stone-700 border border-stone-300';
        }
    };

    const getRoleColor = (role: string) => {
        switch(role.toLowerCase()) {
            case 'marketing': return 'bg-amber-100 text-amber-700';
            case 'surveyor':
            case 'drafter': return 'bg-emerald-100 text-emerald-700';
            case 'desainer': return 'bg-rose-100 text-rose-700';
            default: return 'bg-stone-100 text-stone-700';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            router.delete(`/order/${order.id}`, {
                onSuccess: () => {
                    router.visit('/order');
                }
            });
        }
    };

    if (!mounted) return null;

    return (
        <>
            <Head title={`Order: ${order.nama_project}`} />

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

                .fadeInUp {
                    animation: fadeInUp 0.5s ease-out forwards;
                }

                .detail-section {
                    transition: all 0.3s ease;
                }

                .detail-section:hover {
                    transform: translateX(4px);
                }

                .member-card {
                    transition: all 0.2s ease;
                }

                .member-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .info-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                }

                .info-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }

                .info-value {
                    font-size: 1rem;
                    font-weight: 500;
                    color: #1e293b;
                    line-height: 1.5;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .action-button {
                    transition: all 0.2s ease;
                }

                .action-button:hover {
                    transform: translateY(-2px);
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="order" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className={`mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/order"
                                    className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Link>
                                <div>
                                    <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {order.nama_project}
                                    </h1>
                                    <p className="text-sm text-stone-500 mt-1">{order.company_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={`/order/${order.id}/edit`}
                                    className="action-button inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="action-button inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Badges */}
                    <div className={`mb-8 flex gap-3 flex-wrap ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                        <div className={`badge ${getStatusColor(order.project_status)}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H2a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-2a1 1 0 000 2h2v14H2V5z" clipRule="evenodd"></path>
                            </svg>
                            {order.project_status}
                        </div>
                        <div className={`badge ${getPriorityColor(order.priority_level)}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"></path>
                            </svg>
                            {order.priority_level} Priority
                        </div>
                    </div>

                    {/* Project Details */}
                    <div className={`bg-white rounded-2xl shadow-lg border border-stone-200 p-8 mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Project Information
                        </h2>

                        <div className="info-grid">
                            <div className="info-card detail-section">
                                <div className="info-label">Interior Type</div>
                                <div className="info-value">{order.jenis_interior.nama_interior}</div>
                            </div>
                            <div className="info-card detail-section">
                                <div className="info-label">Customer Name</div>
                                <div className="info-value">{order.customer_name}</div>
                            </div>
                            <div className="info-card detail-section">
                                <div className="info-label">Unit Number</div>
                                <div className="info-value">{order.nomor_unit}</div>
                            </div>
                            <div className="info-card detail-section">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">{order.phone_number}</div>
                            </div>
                            <div className="info-card detail-section">
                                <div className="info-label">Entry Date</div>
                                <div className="info-value">{formatDate(order.tanggal_masuk_customer)}</div>
                            </div>
                        </div>

                        {order.customer_additional_info && (
                            <div className="mt-6 pt-6 border-t border-stone-200">
                                <h3 className="text-sm font-semibold text-stone-700 uppercase mb-3">Additional Information</h3>
                                <p className="text-stone-700 leading-relaxed bg-stone-50 rounded-lg p-4">
                                    {order.customer_additional_info}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Team Members */}
                    <div className={`bg-white rounded-2xl shadow-lg border border-stone-200 p-8 mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.15s' }}>
                        <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.048M12 4.354L8.646 7.708a4 4 0 000 5.686m0 0l3.354 3.354M12 4.354l3.354 3.354a4 4 0 010 5.686m0 0l-3.354 3.354m9.172-15.172a9 9 0 010 12.728m-5.656-5.656a5 5 0 010 7.072" />
                            </svg>
                            Team Members
                            <span className="ml-auto text-sm font-normal text-stone-500">
                                {order.users.length} {order.users.length === 1 ? 'member' : 'members'}
                            </span>
                        </h2>

                        {order.users.length === 0 ? (
                            <div className="bg-stone-50 rounded-lg p-8 text-center">
                                <svg className="w-12 h-12 text-stone-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 8.048M12 4.354L8.646 7.708a4 4 0 000 5.686m0 0l3.354 3.354M12 4.354l3.354 3.354a4 4 0 010 5.686m0 0l-3.354 3.354" />
                                </svg>
                                <p className="text-stone-600 font-medium">No team members assigned yet</p>
                                <p className="text-stone-500 text-sm mt-1">
                                    <Link href={`/order/${order.id}/edit`} className="text-cyan-600 hover:text-cyan-700 font-semibold">
                                        Edit this order
                                    </Link>
                                    {' '}to add team members
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {order.users.map((user, index) => (
                                    <div
                                        key={user.id}
                                        className={`member-card bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-stone-200 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                                        style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`badge ${getRoleColor(user.role.nama_role)} text-xs`}>
                                                {user.role.nama_role}
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-stone-900 text-sm line-clamp-1">
                                            {user.name}
                                        </h4>
                                        <p className="text-xs text-stone-600 line-clamp-1 mt-1">
                                            {user.email}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-4 text-center">
                            <p className="text-xs font-semibold text-stone-600 uppercase">Created</p>
                            <p className="text-sm text-stone-900 mt-2">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-4 text-center">
                            <p className="text-xs font-semibold text-stone-600 uppercase">Last Updated</p>
                            <p className="text-sm text-stone-900 mt-2">{formatDate(order.updated_at)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-4 text-center">
                            <p className="text-xs font-semibold text-stone-600 uppercase">Order ID</p>
                            <p className="text-sm text-stone-900 mt-2">#{String(order.id).padStart(4, '0')}</p>
                        </div>
                        {order.mom_file && (
                            <div className="bg-white rounded-lg shadow-md border border-stone-200 p-4 text-center">
                                <p className="text-xs font-semibold text-stone-600 uppercase">File</p>
                                <a
                                    href={`/storage/${order.mom_file}`}
                                    download
                                    className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold mt-2 inline-block"
                                >
                                    Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
