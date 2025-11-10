import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Item {
    id: number;
    nama_item: string;
    jenis_item_id: number;
    created_at: string;
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
    items: Item[];
    created_at: string;
    updated_at: string;
}

interface Props {
    jenisItem: JenisItem;
}

export default function Show({ jenisItem }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
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
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <Head title={`Jenis Item: ${jenisItem.nama_jenis_item}`} />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="jenis-item" onClose={() => setSidebarOpen(false)} />

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
                            href="/jenis-item"
                            className="hover:text-teal-600 transition-colors"
                        >
                            Jenis Item
                        </Link>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-stone-900 font-medium">
                            {jenisItem.nama_jenis_item}
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
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-8 border-b border-teal-200/50">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-3xl font-bold text-white">
                                        {jenisItem.nama_jenis_item.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h1
                                        className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent mb-2"
                                        style={{ fontFamily: "Playfair Display, serif" }}
                                    >
                                        {jenisItem.nama_jenis_item}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-stone-600">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span>{jenisItem.items?.length || 0} Items</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Created: {new Date(jenisItem.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/jenis-item"
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

                {/* Items List */}
                <div
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200"
                    style={{
                        animation: mounted ? "fadeInUp 0.6s ease-out" : "none",
                        animationDelay: "0.1s",
                    }}
                >
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-5 py-4 border-b border-teal-200/50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-800">
                                    Associated Items
                                </h2>
                                <p className="text-xs text-stone-500">
                                    Items under this category
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {jenisItem.items && jenisItem.items.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200">
                                        <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                            No
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                            Item Name
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold text-stone-700 uppercase tracking-wider">
                                            Created Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200">
                                    {jenisItem.items.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-teal-50/30 transition-colors"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {item.nama_item.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-stone-800">
                                                            {item.nama_item}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="text-xs text-stone-600">
                                                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-teal-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                </div>
                                <p className="text-stone-500 font-medium">
                                    No items found
                                </p>
                                <p className="text-stone-400 text-sm mt-1">
                                    This category doesn't have any items yet
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
