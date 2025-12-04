import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface JenisPengukuran {
    id: number;
    nama_pengukuran: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    jenisPengukuran: JenisPengukuran;
}

export default function Show({ jenisPengukuran }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <Head title={`Jenis Pengukuran: ${jenisPengukuran.nama_pengukuran}`} />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar 
                isOpen={sidebarOpen} 
                currentPage="jenis-pengukuran" 
                onClose={() => setSidebarOpen(false)} 
            />

            <div
                className={`transition-all duration-300 ${
                    sidebarOpen ? "ml-60" : "ml-0"
                } p-3 mt-12`}
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                }}
            >
                {/* Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex items-center gap-2 text-sm text-stone-600 mb-3">
                        <Link
                            href="/jenis-pengukuran"
                            className="hover:text-indigo-600 transition-colors"
                        >
                            Jenis Pengukuran
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-stone-900 font-medium">
                            {jenisPengukuran.nama_pengukuran}
                        </span>
                    </nav>
                </div>

                {/* Header Card */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 mb-6"
                    style={{
                        animation: mounted ? "fadeInUp 0.6s ease-out" : "none",
                    }}
                >
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-6 py-8 border-b border-indigo-200/50">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-3xl font-bold text-white">
                                        {jenisPengukuran.nama_pengukuran.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                <div>
                                    <h1
                                        className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-2"
                                        style={{ fontFamily: "Playfair Display, serif" }}
                                    >
                                        {jenisPengukuran.nama_pengukuran}
                                    </h1>

                                    <div className="flex items-center gap-4 text-sm text-stone-600">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>
                                                Created: {new Date(jenisPengukuran.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href="/jenis-pengukuran"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-all shadow-sm text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to List
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Detail Section */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200"
                    style={{
                        animation: mounted ? "fadeInUp 0.6s ease-out" : "none",
                        animationDelay: "0.15s",
                    }}
                >
                    <div className="px-6 py-6">
                        <h2 className="text-xl font-bold text-stone-800 mb-4">Measurement Details</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-stone-500">Name</p>
                                <p className="text-base font-semibold text-stone-800">
                                    {jenisPengukuran.nama_pengukuran}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-stone-500">Created At</p>
                                <p className="text-base font-medium text-stone-700">
                                    {new Date(jenisPengukuran.created_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-stone-500">Last Updated</p>
                                <p className="text-base font-medium text-stone-700">
                                    {new Date(jenisPengukuran.updated_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
