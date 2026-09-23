import ExtendModal from '@/components/ExtendModal';
import MoodboardModal from '@/components/MoodboardModal';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import WorkStatusTabs from '@/components/WorkStatusTabs';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import MoodboardFilterBar from './components/MoodboardFilterBar';
import MoodboardTable from './components/MoodboardTable';
import { Order, TaskResponse } from './types';

interface PageProps {
    orders: Order[];
}

export default function Index({ orders }: PageProps) {
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;
    const isNotKepalaMarketing = !isKepalaMarketing;
    
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [workTab, setWorkTab] = useState<'belum' | 'sudah'>('belum');

    const countBelum = useMemo(() => orders.filter(o => o.moodboard?.status !== 'approved').length, [orders]);
    const countSudah = useMemo(() => orders.filter(o => o.moodboard?.status === 'approved').length, [orders]);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'upload-kasar' | 'revise'>('create');
    const [filteredOrders, setFilteredOrders] = useState(orders);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    
    // State untuk dua jenis TaskResponse
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [approvalDesignTaskResponses, setApprovalDesignTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dua jenis task responses (regular & marketing) untuk semua order
    useEffect(() => {
        orders.forEach(order => {
            // Regular
            axios.get(`/task-response/${order.id}/moodboard`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching regular task response:', err);
                    }
                });
            // Marketing
            axios.get(`/task-response/${order.id}/moodboard?is_marketing=1`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                marketing: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching marketing task response:', err);
                    }
                });

            // approval_design - Regular
            axios.get(`/task-response/${order.id}/approval_design`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setApprovalDesignTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                regular: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching regular approval_design task response:', err);
                    }
                });

            // approval_design - Marketing
            axios.get(`/task-response/${order.id}/approval_design?is_marketing=1`)
                .then(res => {
                    const task = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (task) {
                        setApprovalDesignTaskResponses(prev => ({
                            ...prev,
                            [order.id]: {
                                ...prev[order.id],
                                marketing: task,
                            },
                        }));
                    }
                })
                .catch(err => {
                    if (err.response?.status !== 404) {
                        console.error('Error fetching marketing approval_design task response:', err);
                    }
                });
        });
    }, [orders]);

    useEffect(() => {
        const filtered = orders.filter((order) => {
            const matchesWorkTab = workTab === 'belum' 
                ? order.moodboard?.status !== 'approved' 
                : order.moodboard?.status === 'approved';

            const matchesSearch = 
                order.nama_project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.company_name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const moodboard = order.moodboard;
            const status = moodboard ? moodboard.status : 'no_response';
            
            let matchesStatus = true;
            if (statusFilter !== 'All') {
                if (statusFilter === 'Pending') matchesStatus = status === 'pending';
                if (statusFilter === 'Diterima') matchesStatus = status === 'approved';
                if (statusFilter === 'Revisi') matchesStatus = status === 'revisi';
                if (statusFilter === 'No Response') matchesStatus = status === 'no_response';
            }

            return matchesWorkTab && matchesSearch && matchesStatus;
        });
        setFilteredOrders(filtered);
    }, [searchQuery, statusFilter, workTab, orders]);

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openCreateMoodboard = (order: Order) => {
        router.post(`/moodboard/response/${order.id}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(window.location.pathname, {
                    preserveScroll: true,
                    preserveState: false,
                });
            },
        });
    };

    const openUploadKasarModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('upload-kasar');
        setShowModal(true);
    };

    const openReviseModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('revise');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const handlePmResponse = (orderId: number) => {
        if (confirm('Apakah Anda yakin ingin merespon sebagai Kepala Marketing?')) {
            router.post(`/pm-response/moodboard/${orderId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    const toggleExpand = (orderId: number) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleDeleteFile = (fileId: number, fileName: string) => {
        if (window.confirm(`Hapus file "${fileName}"?`)) {
            router.delete(`/moodboard/file-kasar/${fileId}`, {
                preserveScroll: true,
            });
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-violet-50 to-stone-50 overflow-x-hidden">
            <Head title="Moodboard Management" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="moodboard"
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="px-2 pt-20 pb-10 pl-0 transition-all sm:px-6 sm:pl-64">
                <div className="max-w-[1600px] mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                            Moodboard Management
                        </h1>
                        <p className="mt-1.5 text-slate-500">
                            Kelola dan review moodboard desain dari tim secara efisien
                        </p>
                    </div>

                    {/* Work Status Tabs */}
                    <WorkStatusTabs
                        activeTab={workTab}
                        onChange={setWorkTab}
                        countBelum={countBelum}
                        countSudah={countSudah}
                    />

                    {/* Filters & Search */}
                    <MoodboardFilterBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                    />

                    {/* Data Table */}
                    <MoodboardTable
                        filteredOrders={filteredOrders}
                        expandedCards={expandedCards}
                        isKepalaMarketing={isKepalaMarketing}
                        isNotKepalaMarketing={isNotKepalaMarketing}
                        taskResponses={taskResponses}
                        toggleExpand={toggleExpand}
                        formatDeadline={formatDeadline}
                        formatDateTime={formatDateTime}
                        onOpenCreateMoodboard={openCreateMoodboard}
                        onOpenUploadKasarModal={openUploadKasarModal}
                        onOpenReviseModal={openReviseModal}
                        onHandlePmResponse={handlePmResponse}
                        onDeleteFile={handleDeleteFile}
                        onShowExtendModal={setShowExtendModal}
                    />
                </div>
            </main>

            {/* Moodboard Modal */}
            {selectedOrder && taskResponses[selectedOrder.id]?.regular && (
                <MoodboardModal
                    show={showModal}
                    order={selectedOrder}
                    mode={modalMode}
                    onClose={closeModal}
                    taskResponse={taskResponses[selectedOrder.id]!.regular!}
                    onShowExtendModal={(orderId, tahap) => {
                        const task = taskResponses[orderId]?.regular;
                        if (task) setShowExtendModal({ orderId, tahap, isMarketing: false, taskResponse: task });
                    }}
                />
            )}

            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    taskResponse={showExtendModal.taskResponse}
                    isMarketing={showExtendModal.isMarketing}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </div>
    );
}