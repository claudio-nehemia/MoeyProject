import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ActivityLogTimeline, { ActivityLogItem } from '@/components/ActivityLogTimeline';

interface Props {
    survey: any;
    activityLogs?: ActivityLogItem[];
}

export default function Show({ survey, activityLogs = [] }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const formatDate = (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <Head title="Detail Survey Ulang" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="survey-ulang" />

            <div className="p-4 lg:ml-60">
                <div className="mt-20 max-w-4xl mx-auto space-y-6">
                    <div className="bg-white shadow rounded-xl p-6 sm:p-8">

                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100">
                            <h1 className="text-xl sm:text-2xl font-bold text-stone-800">
                                Detail Survey Ulang — {survey.order?.nama_project}
                            </h1>

                            <Link
                                href={`/survey-ulang/edit/${survey.id}`}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 text-sm font-semibold transition"
                            >
                                Edit
                            </Link>
                        </div>

                        {/* CATATAN */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg text-stone-800">Catatan Umum</h3>
                            <p className="text-stone-700 mt-1 whitespace-pre-line bg-stone-50 p-4 rounded-lg border border-stone-200">
                                {survey.catatan || "-"}
                            </p>
                        </div>

                        {/* TEMUAN */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg text-stone-800">Temuan Lapangan</h3>

                            {survey.temuan?.length ? (
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {survey.temuan.map((t: string, i: number) => (
                                        <li key={i} className="text-stone-700">{t}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-stone-500 mt-2">Tidak ada temuan.</p>
                            )}
                        </div>

                        {/* FOTO */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg text-stone-800 mb-2">Foto Dokumentasi</h3>

                            {survey.foto?.length ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                    {survey.foto.map((src: string, i: number) => (
                                        <img
                                            key={i}
                                            src={`/storage/${src}`}
                                            alt={`Foto ${i + 1}`}
                                            className="rounded-lg shadow object-cover w-full h-32 hover:scale-[1.02] transition-transform"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-stone-500 mt-2">Tidak ada foto.</p>
                            )}
                        </div>

                        {/* FOOTER INFO */}
                        <div className="text-xs text-stone-500 pt-4 border-t border-stone-100 flex flex-wrap justify-between items-center gap-2">
                            <span>Survey by <b>{survey.survey_by || '-'}</b></span>
                            <span>{formatDate(survey.survey_time || survey.created_at)}</span>
                        </div>
                    </div>

                    {/* Activity & Change Log */}
                    <ActivityLogTimeline logs={activityLogs} title="Log Perubahan & Riwayat Survey Ulang" />
                </div>
            </div>
        </>
    );
}

