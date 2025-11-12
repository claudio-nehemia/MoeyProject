import { useState, useEffect } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Order {
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface RabJasa {
    id: number;
    response_by: string;
    response_time: string;
    total_produks: number;
}

interface ItemPekerjaan {
    id: number;
    order: Order;
    rabJasa: RabJasa | null;
}

interface Props {
    itemPekerjaans: ItemPekerjaan[];
}

export default function Index({ itemPekerjaans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigateToInternal = () => {
        router.get('/rab-internal');
    };

    const navigateToKontrak = () => {
        router.get('/rab-kontrak');
    };

    const navigateToVendor = () => {
        router.get('/rab-vendor');
    };

    const handleGenerate = (itemPekerjaanId: number) => {
        if (confirm('Generate RAB Jasa dari RAB Internal?')) {
            router.post(`/rab-jasa/${itemPekerjaanId}/generate`);
        }
    };

    const handleDelete = (rabJasaId: number) => {
        if (confirm('Hapus RAB Jasa ini?')) {
            router.delete(`/rab-jasa/${rabJasaId}`);
        }
    };

    return (
        <>
            <Head title="RAB Jasa" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-jasa" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={navigateToInternal}
                                    className="whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
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
                                    className="whitespace-nowrap border-b-2 border-amber-500 px-1 py-4 text-sm font-medium text-amber-600 transition-colors dark:border-amber-400 dark:text-amber-400"
                                >
                                    RAB Jasa
                                </button>
                            </nav>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium">RAB Jasa (Harga Asli Tanpa Aksesoris)</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    RAB dengan harga asli tanpa markup, hanya untuk item non-aksesoris
                                </p>
                            </div>

                            {itemPekerjaans.length === 0 ? (
                                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                        Belum ada item pekerjaan dengan RAB Internal. Silakan buat RAB Internal terlebih dahulu.
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
                                                    Status RAB Jasa
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {itemPekerjaans.map((itemPekerjaan) => (
                                                <tr key={itemPekerjaan.id}>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {itemPekerjaan.order.nama_project}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                        {itemPekerjaan.order.company_name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                        {itemPekerjaan.order.customer_name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                        {itemPekerjaan.rabJasa ? (
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Sudah Ada ({itemPekerjaan.rabJasa.total_produks} produk)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                                Belum Ada
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                        {itemPekerjaan.rabJasa ? (
                                                            <div className="flex space-x-2">
                                                                <Link
                                                                    href={`/rab-jasa/${itemPekerjaan.rabJasa.id}/show`}
                                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                >
                                                                    Lihat RAB
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDelete(itemPekerjaan.rabJasa!.id)}
                                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleGenerate(itemPekerjaan.id)}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                            >
                                                                Generate RAB Jasa
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
