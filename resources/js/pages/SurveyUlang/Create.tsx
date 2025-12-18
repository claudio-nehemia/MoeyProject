import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

export default function Create({ order }: { order: Order }) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const [catatan, setCatatan] = useState('');
    const [temuan, setTemuan] = useState<string[]>(['']);
    const [foto, setFoto] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    // ---------------------
    // TEMUAN HANDLER
    // ---------------------
    const addTemuan = () => setTemuan([...temuan, ""]);

    const removeTemuan = (index: number) =>
        setTemuan(temuan.filter((_, i) => i !== index));

    const updateTemuan = (index: number, value: string) => {
        const newArr = [...temuan];
        newArr[index] = value;
        setTemuan(newArr);
    };

    // ---------------------
    // FOTO HANDLER
    // ---------------------
    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFoto([...foto, ...Array.from(e.target.files)]);
    };

    // ---------------------
    // SUBMIT FORM
    // ---------------------
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        const form = new FormData();
        form.append('catatan', catatan);

        temuan.forEach((t, i) => form.append(`temuan[${i}]`, t));
        foto.forEach((file, i) => form.append(`foto[${i}]`, file));

        // URL PASTI BENAR sesuai routes terbaru
        router.post(`/survey-ulang/create/${order.id}`, form, {
            forceFormData: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Survey Ulang - Input" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey-ulang" />

            <div className="p-4 lg:ml-60">
                <div className="mt-12 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-800">
                            Input Survey Ulang
                        </h1>
                        <p className="text-stone-500 mt-1 text-sm">
                            Project: <b>{order.nama_project}</b> — {order.company_name}
                        </p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* CATATAN */}
                        <div>
                            <label className="block font-medium mb-1 text-sm">Catatan Umum</label>
                            <textarea
                                rows={4}
                                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                                placeholder="Tulis catatan tambahan..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                            />
                        </div>

                        {/* TEMUAN */}
                        <div>
                            <label className="block font-medium mb-1 text-sm">Temuan Lapangan</label>

                            <div className="space-y-3">
                                {temuan.map((t, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Temuan #${i + 1}`}
                                            className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400"
                                            value={t}
                                            onChange={(e) => updateTemuan(i, e.target.value)}
                                        />

                                        {temuan.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTemuan(i)}
                                                className="px-3 py-2 text-red-600"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addTemuan}
                                    className="text-indigo-600 font-semibold text-sm"
                                >
                                    + Tambah Temuan
                                </button>
                            </div>
                        </div>

                        {/* FOTO */}
                        <div>
                            <label className="block font-medium mb-1 text-sm">Upload Foto</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFotoChange}
                                className="border p-2 rounded-lg w-full"
                            />

                            {foto.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                    {foto.map((file, i) => (
                                        <img
                                            key={i}
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-28 object-cover rounded-lg shadow"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BUTTONS */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get('/survey-ulang')}
                                className="px-4 py-2 rounded border text-sm"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 rounded bg-indigo-600 text-white text-sm shadow hover:bg-indigo-700"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Survey Ulang'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </>
    );
}
