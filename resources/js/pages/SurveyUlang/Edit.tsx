import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";

interface Survey {
    id: number;
    catatan: string | null;
    temuan: string[];
    foto: string[]; // stored paths
    survey_time: string | null;
    survey_by: string | null;
    order: {
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    };
}

export default function Edit({ survey }: { survey: Survey }) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    const [catatan, setCatatan] = useState(survey.catatan ?? "");
    const [temuan, setTemuan] = useState<string[]>(survey.temuan ?? [""]);

    const [fotoLama, setFotoLama] = useState<string[]>(survey.foto ?? []);
    const [fotoBaru, setFotoBaru] = useState<File[]>([]);

    const [loading, setLoading] = useState(false);

    // Add temuan input
    const handleAddTemuan = () => setTemuan([...temuan, ""]);

    const handleRemoveTemuan = (index: number) => {
        setTemuan(temuan.filter((_, i) => i !== index));
    };

    const handleTemuanChange = (index: number, value: string) => {
        const upd = [...temuan];
        upd[index] = value;
        setTemuan(upd);
    };

    // New photos
    const handleFotoBaruChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFotoBaru([...fotoBaru, ...Array.from(e.target.files)]);
    };

    // Remove old photo (UI only – backend keeps old photo unless updated)
    const handleRemoveFotoLama = (path: string) => {
        setFotoLama(fotoLama.filter((f) => f !== path));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();

        formData.append("catatan", catatan);
        
        // Send temuan as array items, not JSON string
        temuan.forEach((t, i) => formData.append(`temuan[${i}]`, t));
        
        formData.append("foto_lama", JSON.stringify(fotoLama)); // FOTO LAMA

        fotoBaru.forEach((file, index) => {
            formData.append(`foto[${index}]`, file);
        });

        formData.append("_method", "PUT");

        router.post(
            `/survey-ulang/edit/${survey.id}`,
            formData,
            {
                forceFormData: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    // Format URL for preview image
    const storageUrl = (path: string) =>
        path.startsWith("http")
            ? path
            : `/storage/${path}`;

    return (
        <>
            <Head title="Survey Ulang - Edit" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey-ulang" />

            <div className="p-4 lg:ml-60">
                <div className="mt-10 max-w-3xl mx-auto bg-white shadow rounded-xl p-6">

                    <h1 className="text-2xl font-bold mb-3">
                        Edit Survey Ulang — {survey.order.nama_project}
                    </h1>

                    <p className="text-sm text-gray-600 mb-6">
                        Company: {survey.order.company_name} • Customer: {survey.order.customer_name}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* CATATAN */}
                        <div>
                            <label className="font-semibold text-sm">Catatan Umum</label>
                            <textarea
                                className="w-full rounded border p-2 mt-1"
                                rows={3}
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                            />
                        </div>

                        {/* TEMUAN */}
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
                                            onChange={(e) => handleTemuanChange(index, e.target.value)}
                                        />
                                        {temuan.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTemuan(index)}
                                                className="text-red-600 text-sm"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddTemuan}
                                    className="text-blue-600 font-semibold text-sm"
                                >
                                    + Tambah Temuan
                                </button>
                            </div>
                        </div>

                        {/* FOTO LAMA */}
                        {fotoLama.length > 0 && (
                            <div>
                                <label className="font-semibold text-sm block mb-1">
                                    Foto Lama
                                </label>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {fotoLama.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img
                                                src={storageUrl(src)}
                                                className="rounded shadow w-full h-28 object-cover"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                                                onClick={() => handleRemoveFotoLama(src)}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FOTO BARU */}
                        <div>
                            <label className="font-semibold text-sm mb-1 block">
                                Upload Foto Baru
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFotoBaruChange}
                                className="border p-2 rounded w-full"
                            />

                            {fotoBaru.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                    {fotoBaru.map((file, i) => (
                                        <img
                                            key={i}
                                            src={URL.createObjectURL(file)}
                                            className="rounded shadow h-28 object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-5">
                            <button
                                type="button"
                                onClick={() => router.get("/survey-ulang")}
                                className="px-4 py-2 border rounded"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 rounded bg-emerald-600 text-white shadow hover:bg-emerald-700"
                            >
                                {loading ? "Menyimpan..." : "Update Survey Ulang"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
