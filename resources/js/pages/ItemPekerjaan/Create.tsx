import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface BahanBakuPivot {
    harga_dasar: number;
    harga_jasa: number;
}

interface BahanBaku {
    id: number;
    nama_item: string;
    harga: number;
    pivot?: BahanBakuPivot;
}

interface Produk {
    id: number;
    nama_produk: string;
    harga_dasar: number;
    harga_jasa: number;
    bahan_bakus: BahanBaku[];
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    nama_item: string;
    harga: number;
    jenis_item_id: number;
}

interface ItemData {
    temp_id: number;
    item_id: string | number;
    quantity: number;
    notes: string;
}

interface JenisItemData {
    temp_id: number;
    jenis_item_id: string | number;
    items: ItemData[];
}

interface ProdukData {
    temp_id: number;
    produk_id: string | number;
    quantity: number;
    panjang: string | number;
    lebar: string | number;
    tinggi: string | number;
    jenisItems: JenisItemData[];
    selected_bahan_bakus: number[]; // IDs of selected bahan baku
}

interface Props {
    auth: {
        user: any;
    };
    itemPekerjaan: {
        id: number;
        moodboard: {
            order: {
                nama_project: string;
                company_name: string;
                customer_name: string;
            };
        };
    };
    produks: Produk[];
    jenisItems: JenisItem[];
    items: Item[];
}

export default function Create({
    auth,
    itemPekerjaan,
    produks,
    jenisItems,
    items,
}: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [selectedProduks, setSelectedProduks] = useState<ProdukData[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    // Helper function to get default jenis items (Finishing Dalam, Finishing Luar, Aksesoris)
    const getDefaultJenisItems = (): JenisItemData[] => {
        const defaultNames = ['finishing dalam', 'finishing luar', 'aksesoris'];
        const defaultJenisItems: JenisItemData[] = [];

        defaultNames.forEach((name, index) => {
            const jenisItem = jenisItems.find(
                (ji) => ji.nama_jenis_item.toLowerCase() === name,
            );
            if (jenisItem) {
                defaultJenisItems.push({
                    temp_id: Date.now() + index,
                    jenis_item_id: jenisItem.id,
                    items: [],
                });
            }
        });

        return defaultJenisItems;
    };

    const addProduk = () => {
        const newProduk: ProdukData = {
            temp_id: Date.now(),
            produk_id: '',
            quantity: 1,
            panjang: '',
            lebar: '',
            tinggi: '',
            jenisItems: getDefaultJenisItems(),
            selected_bahan_bakus: [],
        };
        setSelectedProduks([...selectedProduks, newProduk]);
    };

    const removeProduk = (tempId: number) => {
        setSelectedProduks(selectedProduks.filter((p) => p.temp_id !== tempId));
    };

    const updateProduk = (
        tempId: number,
        field: keyof ProdukData,
        value: any,
    ) => {
        setSelectedProduks(
            selectedProduks.map((p) =>
                p.temp_id === tempId ? { ...p, [field]: value } : p,
            ),
        );
    };

    const toggleBahanBaku = (produkTempId: number, bahanBakuId: number) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    const selected = p.selected_bahan_bakus || [];
                    const isSelected = selected.includes(bahanBakuId);
                    return {
                        ...p,
                        selected_bahan_bakus: isSelected
                            ? selected.filter((id) => id !== bahanBakuId)
                            : [...selected, bahanBakuId],
                    };
                }
                return p;
            }),
        );
    };

    const selectAllBahanBaku = (
        produkTempId: number,
        bahanBakuIds: number[],
    ) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return { ...p, selected_bahan_bakus: bahanBakuIds };
                }
                return p;
            }),
        );
    };

    const clearAllBahanBaku = (produkTempId: number) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return { ...p, selected_bahan_bakus: [] };
                }
                return p;
            }),
        );
    };

    const addJenisItem = (produkTempId: number) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: [
                            ...p.jenisItems,
                            {
                                temp_id: Date.now(),
                                jenis_item_id: '',
                                items: [],
                            },
                        ],
                    };
                }
                return p;
            }),
        );
    };

    const removeJenisItem = (produkTempId: number, jenisTempId: number) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: p.jenisItems.filter(
                            (j) => j.temp_id !== jenisTempId,
                        ),
                    };
                }
                return p;
            }),
        );
    };

    const updateJenisItem = (
        produkTempId: number,
        jenisTempId: number,
        value: string | number,
    ) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: p.jenisItems.map((j) =>
                            j.temp_id === jenisTempId
                                ? { ...j, jenis_item_id: value, items: [] }
                                : j,
                        ),
                    };
                }
                return p;
            }),
        );
    };

    const addItem = (produkTempId: number, jenisTempId: number) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: p.jenisItems.map((j) => {
                            if (j.temp_id === jenisTempId) {
                                return {
                                    ...j,
                                    items: [
                                        ...j.items,
                                        {
                                            temp_id: Date.now(),
                                            item_id: '',
                                            quantity: 1,
                                            notes: '',
                                        },
                                    ],
                                };
                            }
                            return j;
                        }),
                    };
                }
                return p;
            }),
        );
    };

    const removeItem = (
        produkTempId: number,
        jenisTempId: number,
        itemTempId: number,
    ) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: p.jenisItems.map((j) => {
                            if (j.temp_id === jenisTempId) {
                                return {
                                    ...j,
                                    items: j.items.filter(
                                        (i) => i.temp_id !== itemTempId,
                                    ),
                                };
                            }
                            return j;
                        }),
                    };
                }
                return p;
            }),
        );
    };

    const updateItem = (
        produkTempId: number,
        jenisTempId: number,
        itemTempId: number,
        field: keyof ItemData,
        value: any,
    ) => {
        setSelectedProduks(
            selectedProduks.map((p) => {
                if (p.temp_id === produkTempId) {
                    return {
                        ...p,
                        jenisItems: p.jenisItems.map((j) => {
                            if (j.temp_id === jenisTempId) {
                                return {
                                    ...j,
                                    items: j.items.map((i) =>
                                        i.temp_id === itemTempId
                                            ? { ...i, [field]: value }
                                            : i,
                                    ),
                                };
                            }
                            return j;
                        }),
                    };
                }
                return p;
            }),
        );
    };

    const getAvailableItems = (jenisItemId: string | number): Item[] => {
        return items.filter((item) => item.jenis_item_id == jenisItemId);
    };

    const getSelectedProduk = (
        produkId: string | number,
    ): Produk | undefined => {
        return produks.find((p) => p.id == produkId);
    };

    const getJenisItemName = (jenisItemId: string | number): string => {
        const jenisItem = jenisItems.find((ji) => ji.id == jenisItemId);
        return jenisItem?.nama_jenis_item || '';
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = (e: React.FormEvent, status: 'draft' | 'published') => {
        e.preventDefault();

        const formData = {
            item_pekerjaan_id: itemPekerjaan.id,
            status: status,
            produks: selectedProduks.map((p) => ({
                produk_id: p.produk_id,
                quantity: p.quantity,
                panjang: p.panjang || null,
                lebar: p.lebar || null,
                tinggi: p.tinggi || null,
                bahan_bakus: p.selected_bahan_bakus || [], // Send selected bahan baku IDs
                jenisItems: p.jenisItems.map((j) => {
                    const selectedJenisItem = jenisItems.find(
                        (ji) => ji.id.toString() === j.jenis_item_id.toString(),
                    );
                    const isAksesoris =
                        selectedJenisItem?.nama_jenis_item?.toLowerCase() ===
                        'aksesoris';

                    return {
                        jenis_item_id: j.jenis_item_id,
                        items: j.items.map((i) => ({
                            item_id: i.item_id,
                            quantity: isAksesoris ? i.quantity : 1,
                            notes: i.notes || null,
                        })),
                    };
                }),
            })),
        };

        setProcessing(true);
        router.post('/item-pekerjaan/store', formData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head title="Tambah Item Pekerjaan" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="item-pekerjaan"
                onClose={() => setSidebarOpen(false)}
            />

            <div
                className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}
            >
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">
                                    Tambah Item Pekerjaan
                                </h1>
                                <p className="mt-1 text-slate-500">
                                    Konfigurasi produk dan material untuk
                                    project
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Project Info Card */}
                    <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Informasi Project
                                </h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl bg-white/10 p-4">
                                <p className="mb-1 text-sm text-white/70">
                                    Nama Project
                                </p>
                                <p className="font-semibold">
                                    {itemPekerjaan.moodboard.order.nama_project}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/10 p-4">
                                <p className="mb-1 text-sm text-white/70">
                                    Company
                                </p>
                                <p className="font-semibold">
                                    {itemPekerjaan.moodboard.order.company_name}
                                </p>
                            </div>
                            <div className="rounded-xl bg-white/10 p-4">
                                <p className="mb-1 text-sm text-white/70">
                                    Customer
                                </p>
                                <p className="font-semibold">
                                    {
                                        itemPekerjaan.moodboard.order
                                            .customer_name
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Add Produk Button */}
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                                    <svg
                                        className="h-5 w-5 text-indigo-600"
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
                                </span>
                                Daftar Produk
                            </h2>
                            <button
                                type="button"
                                onClick={addProduk}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Tambah Produk
                            </button>
                        </div>

                        {selectedProduks.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                                    <svg
                                        className="h-8 w-8 text-slate-400"
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
                                <p className="mb-2 text-slate-500">
                                    Belum ada produk yang ditambahkan
                                </p>
                                <p className="text-sm text-slate-400">
                                    Klik "Tambah Produk" untuk memulai
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {selectedProduks.map((produk, produkIndex) => {
                                    const selectedProdukData =
                                        getSelectedProduk(produk.produk_id);

                                    return (
                                        <div
                                            key={produk.temp_id}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                        >
                                            {/* Produk Header */}
                                            <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                                                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm">
                                                        {produkIndex + 1}
                                                    </span>
                                                    Produk #{produkIndex + 1}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeProduk(
                                                            produk.temp_id,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                    Hapus Produk
                                                </button>
                                            </div>

                                            <div className="p-6">
                                                {/* Produk Selection & Dimensions */}
                                                <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                                            Pilih Produk{' '}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <select
                                                            value={
                                                                produk.produk_id
                                                            }
                                                            onChange={(e) =>
                                                                updateProduk(
                                                                    produk.temp_id,
                                                                    'produk_id',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                            required
                                                        >
                                                            <option value="">
                                                                -- Pilih Produk
                                                                --
                                                            </option>
                                                            {produks.map(
                                                                (p) => (
                                                                    <option
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        value={
                                                                            p.id
                                                                        }
                                                                    >
                                                                        {
                                                                            p.nama_produk
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                                            Quantity{' '}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={
                                                                produk.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateProduk(
                                                                    produk.temp_id,
                                                                    'quantity',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                            min="1"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dimensions */}
                                                <div className="mb-6">
                                                    <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <svg
                                                            className="h-4 w-4 text-slate-500"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                                            />
                                                        </svg>
                                                        Dimensi (m)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    produk.panjang
                                                                }
                                                                onChange={(e) =>
                                                                    updateProduk(
                                                                        produk.temp_id,
                                                                        'panjang',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="Panjang"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    produk.lebar
                                                                }
                                                                onChange={(e) =>
                                                                    updateProduk(
                                                                        produk.temp_id,
                                                                        'lebar',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="Lebar"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    produk.tinggi
                                                                }
                                                                onChange={(e) =>
                                                                    updateProduk(
                                                                        produk.temp_id,
                                                                        'tinggi',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="Tinggi"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bahan Baku Card - Selectable */}
                                                {selectedProdukData &&
                                                    selectedProdukData.bahan_bakus &&
                                                    selectedProdukData
                                                        .bahan_bakus.length >
                                                        0 && (
                                                        <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                                                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="flex items-center gap-2 font-semibold text-white">
                                                                        <svg
                                                                            className="h-5 w-5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                                            />
                                                                        </svg>
                                                                        Pilih
                                                                        Bahan
                                                                        Baku{' '}
                                                                        <span className="ml-2 text-xs font-normal text-amber-200">
                                                                            (
                                                                            {produk
                                                                                .selected_bahan_bakus
                                                                                ?.length ||
                                                                                0}{' '}
                                                                            dipilih)
                                                                        </span>
                                                                    </h4>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                selectAllBahanBaku(
                                                                                    produk.temp_id,
                                                                                    selectedProdukData.bahan_bakus.map(
                                                                                        (
                                                                                            bb,
                                                                                        ) =>
                                                                                            bb.id,
                                                                                    ),
                                                                                )
                                                                            }
                                                                            className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/30"
                                                                        >
                                                                            Pilih
                                                                            Semua
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                clearAllBahanBaku(
                                                                                    produk.temp_id,
                                                                                )
                                                                            }
                                                                            className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    {selectedProdukData.bahan_bakus.map(
                                                                        (
                                                                            bb,
                                                                        ) => {
                                                                            const isSelected =
                                                                                produk.selected_bahan_bakus?.includes(
                                                                                    bb.id,
                                                                                ) ||
                                                                                false;
                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        bb.id
                                                                                    }
                                                                                    onClick={() =>
                                                                                        toggleBahanBaku(
                                                                                            produk.temp_id,
                                                                                            bb.id,
                                                                                        )
                                                                                    }
                                                                                    className={`flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition-all ${
                                                                                        isSelected
                                                                                            ? 'border-amber-400 bg-amber-100 shadow-sm'
                                                                                            : 'border-slate-200 bg-white hover:border-amber-300'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div
                                                                                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                                                                                isSelected
                                                                                                    ? 'border-amber-500 bg-amber-500'
                                                                                                    : 'border-slate-300'
                                                                                            }`}
                                                                                        >
                                                                                            {isSelected && (
                                                                                                <svg
                                                                                                    className="h-3 w-3 text-white"
                                                                                                    fill="none"
                                                                                                    stroke="currentColor"
                                                                                                    viewBox="0 0 24 24"
                                                                                                >
                                                                                                    <path
                                                                                                        strokeLinecap="round"
                                                                                                        strokeLinejoin="round"
                                                                                                        strokeWidth={
                                                                                                            3
                                                                                                        }
                                                                                                        d="M5 13l4 4L19 7"
                                                                                                    />
                                                                                                </svg>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                                                                            <svg
                                                                                                className="h-5 w-5 text-amber-600"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                            >
                                                                                                <path
                                                                                                    strokeLinecap="round"
                                                                                                    strokeLinejoin="round"
                                                                                                    strokeWidth={
                                                                                                        2
                                                                                                    }
                                                                                                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                                                                                />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-medium text-slate-800">
                                                                                                {
                                                                                                    bb.nama_item
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                                <p className="mt-3 flex items-center gap-1 text-xs text-amber-700">
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    Klik untuk
                                                                    memilih/membatalkan
                                                                    bahan baku.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Jenis Items Section */}
                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                                                            <svg
                                                                className="h-5 w-5 text-emerald-600"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                                />
                                                            </svg>
                                                            Finishing &
                                                            Aksesoris
                                                        </h4>
                                                    </div>

                                                    {produk.jenisItems
                                                        .length === 0 ? (
                                                        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                                                            <p className="text-sm text-slate-400">
                                                                Belum ada
                                                                kategori item.
                                                                Klik "Tambah
                                                                Kategori" untuk
                                                                menambahkan.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {produk.jenisItems.map(
                                                                (jenisItem) => {
                                                                    const jenisName =
                                                                        getJenisItemName(
                                                                            jenisItem.jenis_item_id,
                                                                        );
                                                                    const isAksesoris =
                                                                        jenisName.toLowerCase() ===
                                                                        'aksesoris';

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                jenisItem.temp_id
                                                                            }
                                                                            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                                        >
                                                                            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                                                                                <div className="flex flex-1 items-center gap-3">
                                                                                    <select
                                                                                        value={
                                                                                            jenisItem.jenis_item_id
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateJenisItem(
                                                                                                produk.temp_id,
                                                                                                jenisItem.temp_id,
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="rounded-lg border-0 bg-white/20 px-3 py-1.5 text-sm font-medium text-white focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                                                                                        required
                                                                                    >
                                                                                        <option value="">
                                                                                            Pilih
                                                                                            Kategori
                                                                                        </option>
                                                                                        {jenisItems.map(
                                                                                            (
                                                                                                ji,
                                                                                            ) => (
                                                                                                <option
                                                                                                    key={
                                                                                                        ji.id
                                                                                                    }
                                                                                                    value={
                                                                                                        ji.id
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        ji.nama_jenis_item
                                                                                                    }
                                                                                                </option>
                                                                                            ),
                                                                                        )}
                                                                                    </select>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeJenisItem(
                                                                                            produk.temp_id,
                                                                                            jenisItem.temp_id,
                                                                                        )
                                                                                    }
                                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-white transition-colors hover:bg-red-500/40"
                                                                                >
                                                                                    <svg
                                                                                        className="h-4 w-4"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M6 18L18 6M6 6l12 12"
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>

                                                                            {jenisItem.jenis_item_id && (
                                                                                <div className="p-4">
                                                                                    <div className="mb-3 flex items-center justify-between">
                                                                                        <span className="text-sm font-medium text-slate-700">
                                                                                            Daftar
                                                                                            Item
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                addItem(
                                                                                                    produk.temp_id,
                                                                                                    jenisItem.temp_id,
                                                                                                )
                                                                                            }
                                                                                            className="flex items-center gap-1 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-200"
                                                                                        >
                                                                                            <svg
                                                                                                className="h-3 w-3"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                            >
                                                                                                <path
                                                                                                    strokeLinecap="round"
                                                                                                    strokeLinejoin="round"
                                                                                                    strokeWidth={
                                                                                                        2
                                                                                                    }
                                                                                                    d="M12 4v16m8-8H4"
                                                                                                />
                                                                                            </svg>
                                                                                            Tambah
                                                                                            Item
                                                                                        </button>
                                                                                    </div>

                                                                                    {jenisItem
                                                                                        .items
                                                                                        .length ===
                                                                                    0 ? (
                                                                                        <p className="py-4 text-center text-sm text-slate-400">
                                                                                            Belum
                                                                                            ada
                                                                                            item
                                                                                        </p>
                                                                                    ) : (
                                                                                        <div className="space-y-2">
                                                                                            {jenisItem.items.map(
                                                                                                (
                                                                                                    item,
                                                                                                ) => (
                                                                                                    <div
                                                                                                        key={
                                                                                                            item.temp_id
                                                                                                        }
                                                                                                        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                                                                                                    >
                                                                                                        <select
                                                                                                            value={
                                                                                                                item.item_id
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e,
                                                                                                            ) =>
                                                                                                                updateItem(
                                                                                                                    produk.temp_id,
                                                                                                                    jenisItem.temp_id,
                                                                                                                    item.temp_id,
                                                                                                                    'item_id',
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value,
                                                                                                                )
                                                                                                            }
                                                                                                            className={`${isAksesoris ? 'flex-1' : 'w-1/2'} rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500`}
                                                                                                            required
                                                                                                        >
                                                                                                            <option value="">
                                                                                                                Pilih
                                                                                                                Item
                                                                                                            </option>
                                                                                                            {getAvailableItems(
                                                                                                                jenisItem.jenis_item_id,
                                                                                                            ).map(
                                                                                                                (
                                                                                                                    i,
                                                                                                                ) => (
                                                                                                                    <option
                                                                                                                        key={
                                                                                                                            i.id
                                                                                                                        }
                                                                                                                        value={
                                                                                                                            i.id
                                                                                                                        }
                                                                                                                    >
                                                                                                                        {
                                                                                                                            i.nama_item
                                                                                                                        }
                                                                                                                    </option>
                                                                                                                ),
                                                                                                            )}
                                                                                                        </select>
                                                                                                        {!isAksesoris && (
                                                                                                            <input
                                                                                                                type="text"
                                                                                                                value={
                                                                                                                    item.notes
                                                                                                                }
                                                                                                                onChange={(
                                                                                                                    e,
                                                                                                                ) =>
                                                                                                                    updateItem(
                                                                                                                        produk.temp_id,
                                                                                                                        jenisItem.temp_id,
                                                                                                                        item.temp_id,
                                                                                                                        'notes',
                                                                                                                        e
                                                                                                                            .target
                                                                                                                            .value,
                                                                                                                    )
                                                                                                                }
                                                                                                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                                                placeholder="Notes (opsional)"
                                                                                                            />
                                                                                                        )}
                                                                                                        {isAksesoris && (
                                                                                                            <input
                                                                                                                type="number"
                                                                                                                value={
                                                                                                                    item.quantity
                                                                                                                }
                                                                                                                onChange={(
                                                                                                                    e,
                                                                                                                ) =>
                                                                                                                    updateItem(
                                                                                                                        produk.temp_id,
                                                                                                                        jenisItem.temp_id,
                                                                                                                        item.temp_id,
                                                                                                                        'quantity',
                                                                                                                        e
                                                                                                                            .target
                                                                                                                            .value,
                                                                                                                    )
                                                                                                                }
                                                                                                                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                                                min="1"
                                                                                                                placeholder="Qty"
                                                                                                                required
                                                                                                            />
                                                                                                        )}
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() =>
                                                                                                                removeItem(
                                                                                                                    produk.temp_id,
                                                                                                                    jenisItem.temp_id,
                                                                                                                    item.temp_id,
                                                                                                                )
                                                                                                            }
                                                                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-200"
                                                                                                        >
                                                                                                            <svg
                                                                                                                className="h-4 w-4"
                                                                                                                fill="none"
                                                                                                                stroke="currentColor"
                                                                                                                viewBox="0 0 24 24"
                                                                                                            >
                                                                                                                <path
                                                                                                                    strokeLinecap="round"
                                                                                                                    strokeLinejoin="round"
                                                                                                                    strokeWidth={
                                                                                                                        2
                                                                                                                    }
                                                                                                                    d="M6 18L18 6M6 6l12 12"
                                                                                                                />
                                                                                                            </svg>
                                                                                                        </button>
                                                                                                    </div>
                                                                                                ),
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='flex'>
                                                {/* Add Jenis Item Button */}
                                                <button
                                                    type="button"
                                                    onClick={addProduk}
                                                    className="mb-8 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                                                >
                                                    <svg
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 4v16m8-8H4"
                                                        />
                                                    </svg>
                                                    Tambah Produk
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Error Display */}
                        {errors && Object.keys(errors).length > 0 && (
                            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-red-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="font-semibold text-red-800">
                                        Terdapat error:
                                    </p>
                                </div>
                                <ul className="list-inside list-disc text-sm text-red-700">
                                    {Object.values(errors).map((error, idx) => (
                                        <li key={idx}>{String(error)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="mt-8 flex justify-end gap-4">
                            <a
                                href="/item-pekerjaan"
                                className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </a>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'draft')}
                                disabled={
                                    processing || selectedProduks.length === 0
                                }
                                className="flex items-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-6 py-3 font-medium text-amber-700 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="h-5 w-5 animate-spin"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                            />
                                        </svg>
                                        Simpan Draft
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'published')}
                                disabled={
                                    processing || selectedProduks.length === 0
                                }
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="h-5 w-5 animate-spin"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Publish
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
