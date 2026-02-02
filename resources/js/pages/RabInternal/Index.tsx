import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { router, Link, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ExtendModal from '@/components/ExtendModal';
import axios from 'axios';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface RabInternal {
    id: number;
    response_by: string;
    response_time: string;
    total_produks: number;
}

interface ItemPekerjaan {
    id: number;
    status: 'draft' | 'published';
    order: Order;
    rabInternal: RabInternal | null;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
}

interface TaskResponse {
    status: string;
    deadline: string | null;
    order_id: number;
    tahap: string;
    extend_time?: number;
    is_marketing?: number;
}
function Index({ itemPekerjaans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [activeTab, setActiveTab] = useState<'internal' | 'kontrak'>('internal');
    // Dual task response state
    const [taskResponses, setTaskResponses] = useState<Record<number, { regular?: TaskResponse; marketing?: TaskResponse }>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string; isMarketing: boolean; taskResponse: TaskResponse } | null>(null);
    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch dual task response (regular & marketing) untuk semua item pekerjaan
    useEffect(() => {
        (itemPekerjaans as ItemPekerjaan[]).forEach((itemPekerjaan: ItemPekerjaan) => {
            const orderId = itemPekerjaan.order?.id;
            if (orderId) {
                // Regular
                axios.get(`/task-response/${orderId}/rab_internal`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                regular: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching regular task response (rab_internal):', err);
                        }
                    });
                // Marketing
                axios.get(`/task-response/${orderId}/rab_internal?is_marketing=1`)
                    .then(res => {
                        const task = Array.isArray(res.data) ? res.data[0] : res.data;
                        setTaskResponses(prev => ({
                            ...prev,
                            [orderId]: {
                                ...prev[orderId],
                                marketing: task ?? null,
                            },
                        }));
                    })
                    .catch(err => {
                        if (err.response?.status !== 404) {
                            console.error('Error fetching marketing task response (rab_internal):', err);
                        }
                    });
            }
        });
    }, [itemPekerjaans]);

    const handleResponse = (itemPekerjaanId: number) => {
        if (confirm('Apakah Anda yakin ingin membuat RAB Internal untuk item pekerjaan ini?')) {
            router.post(`/rab-internal/response/${itemPekerjaanId}`);
        }
    };

    const navigateToKontrak = () => {
        router.get('/rab-kontrak');
    };

    const navigateToVendor = () => {
        router.get('/rab-vendor');
    };

    const navigateToJasa = () => {
        router.get('/rab-jasa');
    };

    const calculateDaysLeft = (deadline: string | null | undefined) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (Number.isNaN(deadlineDate.getTime())) return null;
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDeadline = (value: string | null | undefined) => {
        if (value == null || value === '') return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID');
    };

    return (
        <>
            <Head title="RAB Internal" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-internal" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('internal')}
                                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                                        activeTab === 'internal'
                                            ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                                    }`}
                                >
                                    RAB Internal
                                </button>
                                <button
                                    onClick={navigateToKontrak}
                                    className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                                >
                                    RAB Kontrak
                                </button>
                                <button
                                    onClick={navigateToVendor}
                                    className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                                >
                                    RAB Vendor
                                </button>
                                <button
                                    onClick={navigateToJasa}
                                    className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                                >
                                    RAB Jasa
                                </button>
                            </nav>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium">Daftar Item Pekerjaan</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Kelola RAB Internal untuk setiap item pekerjaan
                                </p>
                            </div>

                            {itemPekerjaans.length === 0 ? (
                                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                        Belum ada item pekerjaan yang tersedia.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Project
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Company
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Status Item Pekerjaan
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Status RAB
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {(itemPekerjaans as ItemPekerjaan[]).map((itemPekerjaan: ItemPekerjaan) => {
                                                const orderId = itemPekerjaan.order?.id;
                                                const taskResponseRegular = orderId ? taskResponses[orderId]?.regular : null;
                                                const taskResponseMarketing = orderId ? taskResponses[orderId]?.marketing : null;
                                                const daysLeftRegular = taskResponseRegular?.deadline ? calculateDaysLeft(taskResponseRegular.deadline) : null;
                                                const daysLeftMarketing = taskResponseMarketing?.deadline ? calculateDaysLeft(taskResponseMarketing.deadline) : null;

                                                return (
                                                    <tr key={itemPekerjaan.id}>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            <div>
                                                                <div className="whitespace-nowrap">
                                                                    {itemPekerjaan.order.nama_project}
                                                                </div>
                                                                {/* Task Response Deadline - REGULAR */}
                                                                {taskResponseRegular && taskResponseRegular.status !== 'selesai' && (
                                                                    <div className="mt-2">
                                                                        <div className={`p-2 rounded border text-xs ${
                                                                            daysLeftRegular !== null && daysLeftRegular < 0 
                                                                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                                                                : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                                ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                                                                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                                                        }`}>
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className={`font-semibold mb-0.5 ${
                                                                                        daysLeftRegular !== null && daysLeftRegular < 0
                                                                                            ? 'text-red-900 dark:text-red-300'
                                                                                            : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                                            ? 'text-orange-900 dark:text-orange-300'
                                                                                            : 'text-yellow-900 dark:text-yellow-300'
                                                                                    }`}>
                                                                                        {daysLeftRegular !== null && daysLeftRegular < 0 ? '⚠️ Terlewat' : '⏰ Deadline'}
                                                                                    </p>
                                                                                    <p className={`${
                                                                                        daysLeftRegular !== null && daysLeftRegular < 0
                                                                                            ? 'text-red-700 dark:text-red-400'
                                                                                            : daysLeftRegular !== null && daysLeftRegular <= 3
                                                                                            ? 'text-orange-700 dark:text-orange-400'
                                                                                            : 'text-yellow-700 dark:text-yellow-400'
                                                                                    }`}>
                                                                                        {formatDeadline(taskResponseRegular.deadline)}
                                                                                    </p>
                                                                                    {daysLeftRegular !== null && (
                                                                                        <p className={`font-medium ${
                                                                                            daysLeftRegular < 0
                                                                                                ? 'text-red-700 dark:text-red-400'
                                                                                                : daysLeftRegular <= 3
                                                                                                ? 'text-orange-700 dark:text-orange-400'
                                                                                                : 'text-yellow-700 dark:text-yellow-400'
                                                                                        }`}>
                                                                                            {daysLeftRegular < 0 
                                                                                                ? `${Math.abs(daysLeftRegular)}h terlambat` 
                                                                                                : `${daysLeftRegular}h lagi`}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'rab_internal', isMarketing: false, taskResponse: taskResponseRegular })}
                                                                                    className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors whitespace-nowrap flex-shrink-0"
                                                                                >
                                                                                    Perpanjang
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Task Response Deadline - MARKETING (Kepala Marketing only) */}
                                                                {isKepalaMarketing && taskResponseMarketing && taskResponseMarketing.status !== 'selesai' && (
                                                                    <div className="mt-2">
                                                                        <div className="p-2 rounded border text-xs bg-purple-50 border-purple-200">
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <div className="min-w-0">
                                                                                    <p className="font-semibold mb-0.5 text-purple-900">
                                                                                        ⏰ Deadline (Marketing)
                                                                                    </p>
                                                                                    <p className="text-purple-700">
                                                                                        {formatDeadline(taskResponseMarketing.deadline)}
                                                                                    </p>
                                                                                    {daysLeftMarketing !== null && (
                                                                                        <p className="font-medium text-purple-700">
                                                                                            {daysLeftMarketing < 0 
                                                                                                ? `${Math.abs(daysLeftMarketing)}h terlambat` 
                                                                                                : `${daysLeftMarketing}h lagi`}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => orderId && setShowExtendModal({ orderId, tahap: 'rab_internal', isMarketing: true, taskResponse: taskResponseMarketing })}
                                                                                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors whitespace-nowrap flex-shrink-0"
                                                                                >
                                                                                    Perpanjang (Marketing)
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                            {itemPekerjaan.order.company_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                            {itemPekerjaan.order.customer_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            {itemPekerjaan.status === 'published' ? (
                                                                <span className="inline-flex rounded-full bg-emerald-100 px-2 text-xs font-semibold leading-5 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                                    ✓ Published
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-amber-100 px-2 text-xs font-semibold leading-5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                                    📝 Draft
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                            {itemPekerjaan.rabInternal ? (
                                                                <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                    Sudah Ada ({itemPekerjaan.rabInternal.total_produks} produk)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                                    Belum Ada
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                            {itemPekerjaan.rabInternal ? (
                                                                <div className="flex space-x-2">
                                                                    <Link
                                                                        href={`/rab-internal/${itemPekerjaan.rabInternal.id}/show`}
                                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                    >
                                                                        Lihat RAB
                                                                    </Link>
                                                                    <span className="text-gray-300">|</span>
                                                                    <Link
                                                                        href={`/rab-internal/${itemPekerjaan.rabInternal.id}/edit`}
                                                                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                </div>
                                                            ) : itemPekerjaan.status === 'published' ? (
                                                                <button
                                                                    onClick={() => handleResponse(itemPekerjaan.id)}
                                                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                >
                                                                    Response RAB
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">
                                                                    Submit Item Pekerjaan dahulu
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
        </>
    );
}
export default Index;