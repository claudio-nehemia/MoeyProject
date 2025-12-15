import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    tanggal_survey: string | null;
}

export default function Index({ orders }: { orders: Order[] }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [tanggalSurvey, setTanggalSurvey] = useState('');

    useEffect(() => {
        setMounted(true);
        setSidebarOpen(window.innerWidth >= 1024);
    }, []);

    const submitSurveyDate = () => {
        if (!selectedOrder || !tanggalSurvey) return;

        router.post(
            `/survey-schedule/${selectedOrder.id}`,
            { tanggal_survey: tanggalSurvey },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSelectedOrder(null);
                    setTanggalSurvey('');
                },
            }
        );
    };

    if (!mounted) return null;

    return (
        <>
            <Head title="Input Tanggal Survey" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="survey-schedule"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-4 lg:ml-60">
                <div className="mt-10 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-light text-stone-800 mb-2">
                        Input Tanggal Survey
                    </h1>
                    <p className="text-sm text-stone-600 mb-6">
                        PM mengatur jadwal survey ke lokasi customer
                    </p>

                    {orders.length === 0 ? (
                        <div className="rounded-xl bg-white border p-6 text-center text-sm text-stone-600">
                            Tidak ada order.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className="rounded-xl bg-white border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
                                >
                                    <div>
                                        <p className="font-semibold text-stone-900">
                                            {order.nama_project}
                                        </p>
                                        <p className="text-sm text-stone-600">
                                            {order.company_name} • {order.customer_name}
                                        </p>
                                    </div>

                                    {/* ACTION / STATUS */}
                                    {order.tanggal_survey ? (
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-green-600">
                                                ✔ Survey dijadwalkan
                                            </p>
                                            <p className="text-xs text-stone-500">
                                                {new Date(order.tanggal_survey).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                                        >
                                            Input Tanggal
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL INPUT */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-2">
                            Input Tanggal Survey
                        </h2>

                        <p className="text-sm text-stone-600 mb-4">
                            {selectedOrder.nama_project}
                        </p>

                        <input
                            type="date"
                            value={tanggalSurvey}
                            onChange={(e) => setTanggalSurvey(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 rounded border text-sm"
                            >
                                Batal
                            </button>

                            <button
                                onClick={submitSurveyDate}
                                disabled={!tanggalSurvey}
                                className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
