import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ survey }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const [catatan, setCatatan] = useState(survey.catatan ?? '');
    const [temuan, setTemuan] = useState<string[]>(survey.temuan ?? ['']);
    const [foto, setFoto] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAddTemuan = () => setTemuan([...temuan, '']);
    const handleRemoveTemuan = (index: number) =>
        setTemuan(temuan.filter((_, i) => i !== index));

    const handleTemuanChange = (index: number, value: string) => {
        const upd = [...temuan];
        upd[index] = value;
        setTemuan(upd);
    };

    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFoto([...foto, ...Array.from(e.target.files)]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('catatan', catatan);
        formData.append('temuan', JSON.stringify(temuan));

        foto.forEach((file, index) => {
            formData.append(`foto[${index}]`, file);
        });

        formData.append('_method', 'put');

        router.post(`/survey-ulang/${survey.id}`, formData, {
            forceFormData: true,
            onFinish: () => setLoading(false),
        });
    };

    return (
        <>
            <Head title="Edit Survey Ulang" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey-ulang" />

            <div className="p-4 lg:ml-60">
                <div className="mt-10 max-w-3xl mx-auto bg-white shadow rounded-xl p-6">
                    <h1 className="text-2xl font-bold mb-4">Edit Survey Ulang</h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Catatan */}
                        <div>
                            <label className="font-semibold text-sm">Catatan Umum</label>
                            <textarea
                                className="w-full rounded border p-2 mt-1"
                                rows={3}
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                            />
                        </div>

                        {/* Temuan */}
                        <div>
                            <label className="font-semibold text-sm mb-1 block">
                                Temuan Lapangan
                            </label>

                            <div className="space-y-2">
                                {temuan.map((t, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded border p-2"
                                            placeholder={`Temuan #${index + 1}`}
                                            value={t}
                                            onChange={(e) =>
                                                handleTemuanChange(index, e.target.value)
                                            }
                                        />
                                        {temuan.length > 1 && (
                                            <button
                                                type="button"
                                                className="text-red-600 text-sm"
                                                onClick={() => handleRemoveTemuan(index)}
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddTemuan}
                                    className="text-blue-600 text-sm font-semibold"
                                >
                                    + Tambah Temuan
                                </button>
                            </div>
                        </div>

                        {/* Foto */}
                        <div>
                            <label className="font-semibold text-sm mb-1 block">
                                Upload Foto Tambahan
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFotoChange}
                                className="border p-2 rounded w-full"
                            />

                            {/* Existing Foto */}
                            {survey.foto?.length > 0 && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {survey.foto.map((path: string, i: number) => (
                                        <img
                                            key={i}
                                            src={`/storage/${path}`}
                                            className="rounded shadow"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* New Foto Preview */}
                            {foto.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {foto.map((file, i) => (
                                        <img
                                            key={i}
                                            src={URL.createObjectURL(file)}
                                            className="rounded shadow"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.get('/survey-ulang')}
                                className="px-4 py-2 rounded border"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                className="px-5 py-2 rounded bg-amber-500 text-white"
                                disabled={loading}
                            >
                                {loading ? 'Menyimpan...' : 'Update Survey Ulang'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
