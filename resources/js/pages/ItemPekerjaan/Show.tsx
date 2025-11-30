import { useState } from 'react';
import { router, Head, Link } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface Item {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
}

interface JenisItem {
    id: number;
    jenis_item_id: number;
    jenis_item_name: string;
    items: Item[];
}

interface Produk {
    id: number;
    produk_id: number;
    produk_name: string;
    quantity: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    jenisItems: JenisItem[];
}

interface ItemPekerjaan {
    id: number;
    response_by: string;
    response_time: string;
    moodboard: {
        order: {
            nama_project: string;
            company_name: string;
            customer_name: string;
        };
    };
    produks: Produk[];
}

interface Props {
    itemPekerjaan: ItemPekerjaan;
}

export default function Show({ itemPekerjaan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [expandedProduk, setExpandedProduk] = useState<number[]>([]);
    const [expandedJenisItem, setExpandedJenisItem] = useState<number[]>([]);

    const toggleProdukExpand = (produkId: number) => {
        setExpandedProduk(prev =>
            prev.includes(produkId) ? prev.filter(id => id !== produkId) : [...prev, produkId]
        );
    };

    const toggleJenisItemExpand = (jenisItemId: number) => {
        setExpandedJenisItem(prev =>
            prev.includes(jenisItemId) ? prev.filter(id => id !== jenisItemId) : [...prev, jenisItemId]
        );
    };

    const formatDateTime = (datetime: string) => {
        return new Date(datetime).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDimensi = (panjang: number | null, lebar: number | null, tinggi: number | null) => {
        if (!panjang && !lebar && !tinggi) return '-';
        const parts = [];
        if (panjang) parts.push(`P: ${panjang} cm`);
        if (lebar) parts.push(`L: ${lebar} cm`);
        if (tinggi) parts.push(`T: ${tinggi} cm`);
        return parts.join(' × ');
    };

    return (
        <>
            <Head title={`Detail Item Pekerjaan - ${itemPekerjaan.moodboard.order.nama_project}`} />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="item-pekerjaan" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex-1">
                                <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Detail Item Pekerjaan
                                </h1>
                                <p className="text-sm text-stone-500 mt-1">
                                    {itemPekerjaan.moodboard.order.nama_project}
                                </p>
                            </div>
                            <Link
                                href={`/item-pekerjaan/${itemPekerjaan.id}/edit`}
                                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                Edit Item Pekerjaan
                            </Link>
                        </div>

                        {/* Order & Response Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Order Info */}
                            <div className="rounded-lg border border-stone-200 bg-white p-6">
                                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                                    Informasi Project
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-stone-500">Project Name</p>
                                        <p className="text-base font-semibold text-stone-800">
                                            {itemPekerjaan.moodboard.order.nama_project}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500">Company</p>
                                        <p className="text-base text-stone-800">
                                            {itemPekerjaan.moodboard.order.company_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500">Customer</p>
                                        <p className="text-base text-stone-800">
                                            {itemPekerjaan.moodboard.order.customer_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Response Info */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                                <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-4">
                                    Response Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-blue-600">Response By</p>
                                        <p className="text-base font-semibold text-blue-900">
                                            {itemPekerjaan.response_by}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Response Time</p>
                                        <p className="text-base text-blue-900">
                                            {formatDateTime(itemPekerjaan.response_time)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600">Total Produk</p>
                                        <p className="text-base font-bold text-blue-900">
                                            {itemPekerjaan.produks.length} Produk
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Produk List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-stone-800">
                                📦 Daftar Produk
                            </h2>
                        </div>

                        {itemPekerjaan.produks.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 p-12 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-stone-400"
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
                                <p className="mt-4 text-sm text-stone-600">Belum ada produk ditambahkan</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {itemPekerjaan.produks.map((produk, pIndex) => (
                                    <div
                                        key={produk.id}
                                        className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm"
                                    >
                                        {/* Produk Header */}
                                        <div className="p-5 border-b border-purple-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold shadow-md">
                                                            {pIndex + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-purple-900">
                                                                {produk.produk_name}
                                                            </h3>
                                                            <p className="text-sm text-purple-600">
                                                                Quantity: <span className="font-semibold">{produk.quantity}</span> unit
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Dimensi */}
                                                    <div className="rounded-lg bg-white border border-purple-100 p-3">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                            </svg>
                                                            <span className="font-medium text-stone-700">Dimensi:</span>
                                                            <span className="text-stone-600">
                                                                {formatDimensi(produk.panjang, produk.lebar, produk.tinggi)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleProdukExpand(produk.id)}
                                                    className="ml-4 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
                                                >
                                                    {expandedProduk.includes(produk.id) ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                            Tutup Detail
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                            Lihat Detail ({produk.jenisItems.length} Jenis Item)
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Produk Content - Jenis Items */}
                                        {expandedProduk.includes(produk.id) && (
                                            <div className="p-5">
                                                {produk.jenisItems.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                                                        <p className="text-sm text-stone-500">
                                                            Belum ada jenis item untuk produk ini
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                                                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            Jenis Item & Material
                                                        </h4>
                                                        
                                                        {produk.jenisItems.map((jenisItem, jIndex) => (
                                                            <div
                                                                key={jenisItem.id}
                                                                className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white"
                                                            >
                                                                {/* Jenis Item Header */}
                                                                <div className="p-4 border-b border-green-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-bold shadow">
                                                                                {jIndex + 1}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <h5 className="font-semibold text-green-900">
                                                                                        {jenisItem.jenis_item_name}
                                                                                    </h5>
                                                                                    {jenisItem.jenis_item_name === 'Bahan Baku' && (
                                                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                                                                            Auto-load
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs text-green-600">
                                                                                    {jenisItem.items.length} Item
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => toggleJenisItemExpand(jenisItem.id)}
                                                                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
                                                                        >
                                                                            {expandedJenisItem.includes(jenisItem.id) ? (
                                                                                <span className="flex items-center gap-1">
                                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                                    </svg>
                                                                                    Tutup
                                                                                </span>
                                                                            ) : (
                                                                                <span className="flex items-center gap-1">
                                                                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                    </svg>
                                                                                    Lihat Items
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Items List */}
                                                                {expandedJenisItem.includes(jenisItem.id) && (
                                                                    <div className="p-4">
                                                                        {jenisItem.items.length === 0 ? (
                                                                            <p className="text-center text-xs text-stone-500 py-4">
                                                                                Belum ada item
                                                                            </p>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {jenisItem.items.map((item, iIndex) => (
                                                                                    <div
                                                                                        key={item.id}
                                                                                        className="rounded-lg border border-blue-200 bg-white p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                                                                                                {iIndex + 1}
                                                                                            </div>
                                                                                            <span className="font-medium text-stone-800">
                                                                                                {item.item_name}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="rounded-full bg-blue-100 px-3 py-1">
                                                                                            <span className="text-xs font-semibold text-blue-700">
                                                                                                Qty: {item.quantity}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
