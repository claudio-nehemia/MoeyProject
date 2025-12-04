import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ survey }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    return (
        <>
            <Head title="Survey Ulang - Detail" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey-ulang" />

            <div className="p-4 lg:ml-60">
                <div className="mt-10 max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
                    <h1 className="text-2xl font-bold mb-3">
                        Detail Survey Ulang — {survey.order.nama_project}
                    </h1>

                    <p className="text-gray-600 mb-4">
                        Customer: {survey.order.customer_name} — {survey.order.company_name}
                    </p>

                    {/* Catatan */}
                    <div className="mb-6">
                        <h3 className="font-semibold">Catatan</h3>
                        <p className="border p-3 rounded mt-2 bg-gray-50">
                            {survey.catatan ?? '-'}
                        </p>
                    </div>

                    {/* Temuan */}
                    <div className="mb-6">
                        <h3 className="font-semibold">Temuan Lapangan</h3>
                        <ul className="list-disc ml-6 mt-2 text-gray-700">
                            {survey.temuan?.length
                                ? survey.temuan.map((t: string, i: number) => <li key={i}>{t}</li>)
                                : 'Tidak ada temuan'}
                        </ul>
                    </div>

                    {/* Foto */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Foto Survey</h3>

                        {survey.foto && survey.foto.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {survey.foto.map((img: string, i: number) => (
                                    <img
                                        key={i}
                                        src={`/storage/${img}`}
                                        className="rounded shadow"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">Tidak ada foto</div>
                        )}
                    </div>

                    {/* Waktu */}
                    <div>
                        <p className="text-sm text-gray-600">
                            Survey by: <b>{survey.survey_by}</b>
                        </p>
                        <p className="text-sm text-gray-600">
                            Pada: {survey.survey_time ?? '-'}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Link
                            href={`/survey-ulang/${survey.id}/edit`}
                            className="px-4 py-2 bg-amber-500 text-white rounded"
                        >
                            Edit Survey Ulang
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
