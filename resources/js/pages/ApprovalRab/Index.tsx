import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function ApprovalMaterialIndex({ items }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Approval RAB" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="approval-material"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-3 pb-6 w-full overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        Approval RAB
                    </h1>
                    <p className="text-sm text-stone-600">
                        Approval material & keterangan item
                    </p>
                </div>

                <div className="space-y-4">
                    {items.map((item: any) => {
                        const hasKeterangan = item.has_keterangan;

                        return (
                            <div
                                key={item.id}
                                className="bg-white border rounded-xl p-4 shadow-sm flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-stone-900">
                                        {item.order.nama_project}
                                    </p>
                                    <p className="text-sm text-stone-600">
                                        {item.order.company_name} •{' '}
                                        {item.order.customer_name}
                                    </p>
                                    <p className="text-xs text-stone-500 mt-1">
                                        Total Item: {item.total_items}
                                    </p>

                                    {hasKeterangan && (
                                        <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1 inline-block">
                                            ✓ Keterangan sudah diisi
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={`/approval-material/${item.id}/edit`}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                                        hasKeterangan
                                            ? 'bg-amber-500 hover:bg-amber-600'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    {hasKeterangan ? 'Edit' : 'Approval'}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
