import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ExtendModal from "@/components/ExtendModal";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import axios from "axios";

interface SurveyUlang {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_survey_ulang: string | null;
    payment_status: string;
    tahapan_proyek: string;
    status_survey_ulang: "pending" | "waiting_input" | "done";
    survey_ulang_id: number | null;
    response_by: string | null;
    response_time: string | null;
    pm_response_by: string | null;
    pm_response_time: string | null;
}

interface Props {
    surveys: SurveyUlang[];
}

export default function Index({ surveys }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [taskResponses, setTaskResponses] = useState<Record<number, any>>({});
    const [showExtendModal, setShowExtendModal] = useState<{ orderId: number; tahap: string } | null>(null);

    const { auth } = usePage<{ auth: { user: { isKepalaMarketing: boolean } } }>().props;
    const isKepalaMarketing = auth?.user?.isKepalaMarketing || false;

    useEffect(() => {
        setMounted(true);
        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch task response untuk semua survey ulang (tahap: survey_ulang)
    useEffect(() => {
        surveys.forEach((survey) => {
            axios
                .get(`/task-response/${survey.id}/survey_ulang`)
                .then((res) => {
                    if (res.data) {
                        setTaskResponses((prev) => ({ ...prev, [survey.id]: res.data }));
                    }
                })
                .catch((err) => {
                    if (err.response?.status !== 404) {
                        console.error("Error fetching task response (survey_ulang):", err);
                    }
                });
        });
    }, [surveys]);

    const formatStatus = (status: string) => {
        switch (status) {
            case "pending":
                return "Pending";
            case "waiting_input":
                return "Awaiting Input";
            case "done":
                return "Completed";
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "bg-emerald-100 text-emerald-700 border-emerald-300";
            case "waiting_input":
                return "bg-blue-100 text-blue-700 border-blue-300";
            default:
                return "bg-amber-100 text-amber-700 border-amber-300";
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filtered = surveys.filter(
        (s) =>
            s.nama_project.toLowerCase().includes(search.toLowerCase()) ||
            s.company_name.toLowerCase().includes(search.toLowerCase()) ||
            s.customer_name.toLowerCase().includes(search.toLowerCase())
    );

    const handlePmResponse = (surveyUlangId: number) => {
        if (confirm('Apakah Anda yakin ingin memberikan PM response untuk survey ulang ini?')) {
            router.post(`/pm-response/survey-ulang/${surveyUlangId}`, {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Survey Ulang" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="survey-ulang"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-2 sm:p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* HEADER */}
                    <div className="mb-6">
                        <h1
                            className="text-3xl font-light text-stone-800 mb-1"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Survey Ulang
                        </h1>
                        <p className="text-sm text-stone-600">
                            Kelola survey ulang setelah customer melakukan DP
                        </p>
                    </div>

                    {/* SEARCH */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari project, company, atau customer..."
                            className="w-full rounded-xl border-2 border-stone-200 px-4 py-3 pl-10 text-sm text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-indigo-500"
                        />

                        <svg
                            className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-stone-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    {/* LIST */}
                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl bg-white border p-8 text-center shadow">
                                <p className="text-stone-600 text-sm">
                                    Tidak ada survey ulang ditemukan.
                                </p>
                            </div>
                        ) : (
                            filtered.map((s) => {
                                const taskResponse = taskResponses[s.id];

                                return (
                                <div
                                    key={s.id}
                                    className="rounded-xl bg-white border border-stone-200 p-5 shadow hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-stone-900">
                                                {s.nama_project}
                                            </h3>
                                            <p className="text-sm text-stone-600">
                                                {s.company_name} • {s.customer_name}
                                            </p>

                                            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-stone-500">
                                                        Survey Ulang
                                                    </p>
                                                    <p className="font-semibold text-stone-900">
                                                        {s.tanggal_survey_ulang
                                                            ? formatDate(s.tanggal_survey_ulang)
                                                            : "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-stone-500">
                                                        Status
                                                    </p>
                                                    <span
                                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                                                            s.status_survey_ulang
                                                        )}`}
                                                    >
                                                        {formatStatus(s.status_survey_ulang)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-stone-500">
                                                        Response By
                                                    </p>
                                                    <p className="font-semibold text-stone-900">
                                                        {s.response_by || "-"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-stone-500">
                                                        Response Time
                                                    </p>
                                                    <p className="font-semibold text-stone-900">
                                                        {s.response_time ? formatDateTime(s.response_time) : "-"}
                                                    </p>
                                                </div>

                                                {/* Deadline & Extend Button */}
                                                {taskResponse && taskResponse.status !== "selesai" && (
                                                    <div className="col-span-2 mt-2">
                                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-xs font-medium text-yellow-800">
                                                                    Deadline Survey Ulang
                                                                </p>
                                                                <p className="text-sm font-semibold text-yellow-900">
                                                                    {new Date(taskResponse.deadline).toLocaleDateString("id-ID", {
                                                                        day: "numeric",
                                                                        month: "long",
                                                                        year: "numeric",
                                                                    })}
                                                                </p>
                                                                {taskResponse.extend_time > 0 && (
                                                                    <p className="mt-1 text-xs text-orange-600">
                                                                        Perpanjangan: {taskResponse.extend_time}x
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    setShowExtendModal({
                                                                        orderId: s.id,
                                                                        tahap: "survey_ulang",
                                                                    })
                                                                }
                                                                className="px-3 py-1.5 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                                            >
                                                                Minta Perpanjangan
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PM Response Badge */}
                                                {s.pm_response_time && (
                                                    <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                        <p className="text-xs font-semibold text-purple-900">✓ PM Response</p>
                                                        <p className="text-xs text-purple-700">By: {s.pm_response_by}</p>
                                                        <p className="text-xs text-purple-700">{formatDateTime(s.pm_response_time)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-col gap-2">

                                            {/* Marketing Response Button - INDEPENDENT */}
                                            {isKepalaMarketing && !s.pm_response_time && s.survey_ulang_id && (
                                                <button
                                                    onClick={() => handlePmResponse(s.survey_ulang_id!)}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 shadow"
                                                >
                                                    Marketing Response
                                                </button>
                                            )}

                                            {s.status_survey_ulang === "pending" && (
                                                <button
                                                    onClick={() =>
                                                        router.post(`/survey-ulang/${s.id}/response`)
                                                    }
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow"
                                                >
                                                    ✓ Response
                                                </button>
                                            )}

                                            {s.status_survey_ulang === "waiting_input" && (
                                                <Link
                                                    href={`/survey-ulang/create/${s.id}`}
                                                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 shadow"
                                                >
                                                    📝 Input Hasil Survey
                                                </Link>
                                            )}

                                            {s.status_survey_ulang === "done" && (
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/survey-ulang/show/${s.survey_ulang_id}`}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/survey-ulang/edit/${s.survey_ulang_id}`}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow"
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            </div>
            {/* Extend Modal */}
            {showExtendModal && (
                <ExtendModal
                    orderId={showExtendModal.orderId}
                    tahap={showExtendModal.tahap}
                    onClose={() => setShowExtendModal(null)}
                />
            )}
        </>
    );
}
