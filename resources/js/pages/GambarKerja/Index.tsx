import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

/* ================= TYPES ================= */

interface GambarKerja {
    id: number;
    gambar_kerja: string | null;
    response_time: string | null;
    response_by: string | null;
    status: 'pending' | 'uploaded';
    notes: string | null;
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    gambar_kerja?: GambarKerja | null;
}

interface Props {
    orders: Order[];
}

/* ================= HELPER ================= */

const getFileUrl = (path: string) => {
    if (!path) return '';

    // sudah full url
    if (path.startsWith('http')) {
        return path;
    }

    // sudah ada /storage di depan
    if (path.startsWith('/storage')) {
        return path;
    }

    // sudah ada storage/ tapi tanpa slash
    if (path.startsWith('storage/')) {
        return `/${path}`;
    }

    // pure path dari DB
    return `/storage/${path}`;
};

/* ================= COMPONENT ================= */

export default function GambarKerjaIndex({ orders }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
    );

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    /* ================= RESPONSE ================= */
    const handleResponse = (order: Order) => {
        if (!confirm(`Response gambar kerja untuk "${order.nama_project}"?`)) {
            return;
        }

        setLoading(true);
        router.post(
            `/gambar-kerja/response/${order.id}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['orders'] });
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    /* ================= UPLOAD ================= */
    const handleUpload = () => {
        if (!selectedOrder || !file) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('gambar_kerja', file);
        formData.append('notes', notes);

        router.post(
            `/gambar-kerja/upload/${selectedOrder.id}`,
            formData as any,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedOrder(null);
                    setFile(null);
                    setNotes('');
                    router.reload({ only: ['orders'] });
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <div className="flex h-screen bg-stone-50">
            <Head title="Gambar Kerja" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="gambar-kerja"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="pt-12 pl-0 sm:pl-60 px-3 pb-6 w-full overflow-y-auto">
                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        Gambar Kerja
                    </h1>
                    <p className="text-sm text-stone-600">
                        Response dan upload gambar kerja project
                    </p>
                </div>

                {/* LIST */}
                <div className="space-y-4">
                    {orders.length === 0 && (
                        <div className="bg-white border rounded-xl p-6 text-center text-sm text-stone-500">
                            Tidak ada project untuk gambar kerja
                        </div>
                    )}

                    {orders.map((order) => {
                        const gk = order.gambar_kerja;

                        return (
                            <div
                                key={order.id}
                                className="bg-white border rounded-xl p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3">
                                    {/* INFO */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-stone-900">
                                                {order.nama_project}
                                            </p>
                                            <p className="text-sm text-stone-600">
                                                {order.company_name} •{' '}
                                                {order.customer_name}
                                            </p>

                                            {gk?.response_time && (
                                                <p className="mt-1 text-xs text-indigo-600">
                                                    Response oleh{' '}
                                                    <span className="font-semibold">
                                                        {gk.response_by}
                                                    </span>{' '}
                                                    (
                                                    {new Date(
                                                        gk.response_time,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                    )}
                                                    )
                                                </p>
                                            )}
                                        </div>

                                        {/* ACTION */}
                                        <div className="flex items-center gap-2">
                                            {!gk && (
                                                <button
                                                    onClick={() =>
                                                        handleResponse(order)
                                                    }
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    Response
                                                </button>
                                            )}

                                            {gk &&
                                                gk.status === 'pending' && (
                                                    <button
                                                        onClick={() =>
                                                            setSelectedOrder(
                                                                order,
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                                                    >
                                                        Upload Gambar Kerja
                                                    </button>
                                                )}

                                            {gk &&
                                                gk.status === 'uploaded' && (
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                                        ✓ Gambar Kerja Uploaded
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    {/* PREVIEW */}
                                    {gk?.gambar_kerja && (
                                        <div className="mt-3 rounded-lg border bg-stone-50 p-3">
                                            <p className="text-xs font-semibold text-stone-600 mb-2">
                                                Preview Gambar Kerja
                                            </p>

                                            {gk.gambar_kerja.match(
                                                /\.(jpg|jpeg|png)$/i,
                                            ) ? (
                                                <img
                                                    src={getFileUrl(
                                                        gk.gambar_kerja,
                                                    )}
                                                    alt="Gambar Kerja"
                                                    className="max-h-48 rounded-lg border object-contain bg-white"
                                                />
                                            ) : (
                                                <a
                                                    href={getFileUrl(
                                                        gk.gambar_kerja,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                                                >
                                                    📄 Lihat Gambar Kerja (PDF)
                                                </a>
                                            )}

                                            {gk.notes && (
                                                <p className="mt-2 text-xs text-stone-600">
                                                    <span className="font-semibold">
                                                        Catatan:
                                                    </span>{' '}
                                                    {gk.notes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL UPLOAD */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
                        <div className="px-5 py-4 border-b border-stone-300">
                            <h2 className="text-lg font-bold">
                                Upload Gambar Kerja
                            </h2>
                            <p className="text-sm text-stone-600">
                                {selectedOrder.nama_project}
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] || null)
                                }
                                className="w-full text-sm"
                            />

                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Catatan (opsional)"
                                rows={3}
                                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        <div className="flex gap-2 px-5 pb-5">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="flex-1 border rounded-lg py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
