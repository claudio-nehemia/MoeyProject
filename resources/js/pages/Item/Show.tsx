import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface JenisItem {
    id: number;
    nama_item: string;
}

interface Item {
    id: number;
    nama_item: string;
    jenis_item_id: number;
    jenis_item: JenisItem;
    harga: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    item: Item;
}

export default function Show({ item }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-stone-50">
            <Head title={`Item - ${item.nama_item}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="item" />

            {/* Main Content */}
            <main className="pt-12 pl-60 px-4 pb-6 transition-all">
                {/* Breadcrumb */}
                <div className="mb-4 text-xs text-stone-600 flex items-center gap-2">
                    <Link href="/dashboard" className="hover:text-stone-900">Dashboard</Link>
                    <span>/</span>
                    <Link href="/item" className="hover:text-stone-900">Items</Link>
                    <span>/</span>
                    <span className="text-stone-900 font-medium">{item.nama_item}</span>
                </div>

                {/* Header Section */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042L5.96 9H9a2 2 0 100-4H6.75A2.75 2.75 0 004.75 2.5a2.5 2.5 0 00-2.466 2.667L1.897 5H1a1 1 0 000 2v3a1 1 0 001 1h1.17l.04.04a.997.997 0 00.042.01L5.96 18H3a1 1 0 100 2h14a1 1 0 100-2h-2.22l-.305-1.222a.997.997 0 00-.01-.042L14.04 11H11a2 2 0 100 4h2.25a2.75 2.75 0 002.25 2.5 2.5 2.5 0 002.466-2.667l.04-.04H19a1 1 0 100-2v-3a1 1 0 00-1-1h-1.17l-.04-.04a.997.997 0 00-.042-.01L14.04 2H17a1 1 0 100-2H3z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-stone-900">{item.nama_item}</h1>
                                <p className="text-xs text-stone-600">Item Details</p>
                            </div>
                        </div>
                        <Link
                            href="/item"
                            className="px-3.5 py-2 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    {/* Name Card */}
                    <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
                        <div className="text-xs text-stone-600 font-medium mb-1.5">Item Name</div>
                        <div className="text-lg font-bold text-stone-900">{item.nama_item}</div>
                        <div className="text-xs text-stone-500 mt-2">Complete item identifier</div>
                    </div>

                    {/* Type Card */}
                    <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
                        <div className="text-xs text-stone-600 font-medium mb-1.5">Item Type</div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 font-medium text-xs">
                                {item.jenis_item.nama_item}
                            </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-2">Classification</div>
                    </div>

                    {/* Price Card */}
                    <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
                        <div className="text-xs text-stone-600 font-medium mb-1.5">Price</div>
                        <div className="text-lg font-bold text-orange-700">{formatPrice(item.harga)}</div>
                        <div className="text-xs text-stone-500 mt-2">Unit price</div>
                    </div>
                </div>

                {/* Metadata Section */}
                <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-stone-900 mb-3">Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-stone-600">Created Date:</span>
                            <span className="font-medium text-stone-900">{formatDate(item.created_at)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-stone-600">Last Updated:</span>
                            <span className="font-medium text-stone-900">{formatDate(item.updated_at)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-stone-600">Item ID:</span>
                            <span className="font-medium text-stone-900">#{item.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-stone-600">Type ID:</span>
                            <span className="font-medium text-stone-900">#{item.jenis_item_id}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
