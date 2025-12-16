import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */

interface SurveyUser {
    id: number;
    name: string;
    email?: string;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    tanggal_survey: string | null;
    survey_users: SurveyUser[];
}

interface Props {
    orders: Order[];
    surveyUsers: SurveyUser[];
}

/* ================= COMPONENT ================= */

export default function Index({ orders, surveyUsers }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [tanggalSurvey, setTanggalSurvey] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        setMounted(true);
        setSidebarOpen(window.innerWidth >= 1024);
    }, []);

    const toggleUser = (id: number) => {
        setSelectedUsers(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id],
        );
    };

    const closeModal = () => {
        setSelectedOrder(null);
        setTanggalSurvey('');
        setSelectedUsers([]);
    };

    const submitSurvey = () => {
        if (!selectedOrder || !tanggalSurvey || selectedUsers.length === 0) {
            alert('Tanggal survey dan minimal 1 member wajib diisi.');
            return;
        }

        router.post(
            `/survey-schedule/${selectedOrder.id}`,
            {
                tanggal_survey: tanggalSurvey,
                survey_schedule_users: selectedUsers,
            },
            {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            },
        );
    };

    if (!mounted) return null;

    return (
        <>
            <Head title="Survey Schedule" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="survey-schedule"
                onClose={() => setSidebarOpen(false)}
            />

            {/* ================= CONTENT ================= */}
            <div className="p-4 lg:ml-60">
                <div className="mt-10 max-w-5xl mx-auto">
                    <h1 className="text-3xl font-light text-stone-800 mb-2">
                        Survey Schedule
                    </h1>
                    <p className="text-sm text-stone-600 mb-6">
                        Order yang perlu dijadwalkan survey
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
                                    className="rounded-xl bg-white border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-semibold text-stone-900">
                                            {order.nama_project}
                                        </p>
                                        <p className="text-sm text-stone-600">
                                            {order.company_name} •{' '}
                                            {order.customer_name}
                                        </p>

                                        {/* STATUS */}
                                        {order.tanggal_survey && (
                                            <div className="mt-2">
                                                <p className="text-sm font-medium text-green-600">
                                                    ✔ Survey dijadwalkan (
                                                    {new Date(
                                                        order.tanggal_survey,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                    )}
                                                    )
                                                </p>
                                                <p className="text-xs text-stone-500 mt-1">
                                                    {order.survey_users
                                                        .map(u => u.name)
                                                        .join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ACTION */}
                                    {!order.tanggal_survey && (
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                                        >
                                            Response Survey
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODAL ================= */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-1">
                            Response Survey
                        </h2>
                        <p className="text-sm text-stone-600 mb-4">
                            {selectedOrder.nama_project}
                        </p>

                        {/* TANGGAL */}
                        <label className="block text-sm font-medium mb-1">
                            Tanggal Survey
                        </label>
                        <input
                            type="date"
                            value={tanggalSurvey}
                            onChange={e =>
                                setTanggalSurvey(e.target.value)
                            }
                            className="w-full rounded-lg border px-3 py-2 mb-4"
                        />

                        {/* USER PICKER */}
                        <label className="block text-sm font-medium mb-2">
                            Tim Survey
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {surveyUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`cursor-pointer rounded-lg border p-3 transition ${
                                        selectedUsers.includes(user.id)
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'hover:border-stone-300'
                                    }`}
                                >
                                    <p className="text-sm font-semibold text-stone-900">
                                        {user.name}
                                    </p>
                                    {user.email && (
                                        <p className="text-xs text-stone-500">
                                            {user.email}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded border text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitSurvey}
                                className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-semibold"
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
