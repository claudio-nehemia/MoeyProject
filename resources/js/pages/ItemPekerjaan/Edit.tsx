import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface Produk {
    id: number;
    nama_produk: string;
}

interface JenisItem {
    id: number;
    nama_jenis_item: string;
}

interface Item {
    id: number;
    nama_item: string;
    jenis_item_id: number;
}

interface FormItem {
    id?: number;
    temp_id: string;
    item_id: string;
    quantity: number;
}

interface FormJenisItem {
    id?: number;
    temp_id: string;
    jenis_item_id: string;
    jenis_item_name?: string;
    items: FormItem[];
}

interface FormProduk {
    id?: number;
    temp_id: string;
    produk_id: string;
    produk_name?: string;
    quantity: number;
    panjang: string;
    lebar: string;
    tinggi: string;
    jenisItems: FormJenisItem[];
}

interface ExistingItem {
    id: number;
    item_id: number;
    item_name: string;
    quantity: number;
}

interface ExistingJenisItem {
    id: number;
    jenis_item_id: number;
    jenis_item_name: string;
    items: ExistingItem[];
}

interface ExistingProduk {
    id: number;
    produk_id: number;
    produk_name: string;
    quantity: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    jenisItems: ExistingJenisItem[];
}

interface ItemPekerjaan {
    id: number;
    moodboard: {
        order: {
            nama_project: string;
            company_name: string;
            customer_name: string;
        };
    };
    produks: ExistingProduk[];
}

interface Props {
    itemPekerjaan: ItemPekerjaan;
    produks: Produk[];
    jenisItems: JenisItem[];
    items: Item[];
}

export default function Edit({
    itemPekerjaan,
    produks,
    jenisItems,
    items,
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [loading, setLoading] = useState(false);
    const [formProduks, setFormProduks] = useState<FormProduk[]>([]);

    // Initialize form with existing data
    useEffect(() => {
        const initialProduks: FormProduk[] = itemPekerjaan.produks.map((p) => ({
            id: p.id,
            temp_id: `existing_${p.id}`,
            produk_id: p.produk_id.toString(),
            produk_name: p.produk_name,
            quantity: p.quantity,
            panjang: p.panjang?.toString() || '',
            lebar: p.lebar?.toString() || '',
            tinggi: p.tinggi?.toString() || '',
            jenisItems: p.jenisItems.map((j) => ({
                id: j.id,
                temp_id: `existing_${j.id}`,
                jenis_item_id: j.jenis_item_id.toString(),
                jenis_item_name: j.jenis_item_name,
                items: j.items.map((i) => ({
                    id: i.id,
                    temp_id: `existing_${i.id}`,
                    item_id: i.item_id.toString(),
                    quantity: i.quantity,
                })),
            })),
        }));
        setFormProduks(initialProduks);
    }, [itemPekerjaan]);

    const addProduk = () => {
        setFormProduks([
            ...formProduks,
            {
                temp_id: `new_${Date.now()}`,
                produk_id: '',
                quantity: 1,
                panjang: '',
                lebar: '',
                tinggi: '',
                jenisItems: [],
            },
        ]);
    };

    const removeProduk = (tempId: string) => {
        setFormProduks(formProduks.filter((p) => p.temp_id !== tempId));
    };

    const updateProduk = (tempId: string, field: string, value: any) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === tempId ? { ...p, [field]: value } : p,
            ),
        );
    };

    const addJenisItem = (produkTempId: string) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: [
                              ...p.jenisItems,
                              {
                                  temp_id: `new_${Date.now()}`,
                                  jenis_item_id: '',
                                  items: [],
                              },
                          ],
                      }
                    : p,
            ),
        );
    };

    const removeJenisItem = (produkTempId: string, jenisItemTempId: string) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: p.jenisItems.filter(
                              (j) => j.temp_id !== jenisItemTempId,
                          ),
                      }
                    : p,
            ),
        );
    };

    const updateJenisItem = (
        produkTempId: string,
        jenisItemTempId: string,
        field: string,
        value: any,
    ) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: p.jenisItems.map((j) =>
                              j.temp_id === jenisItemTempId
                                  ? { ...j, [field]: value }
                                  : j,
                          ),
                      }
                    : p,
            ),
        );
    };

    const addItem = (produkTempId: string, jenisItemTempId: string) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: p.jenisItems.map((j) =>
                              j.temp_id === jenisItemTempId
                                  ? {
                                        ...j,
                                        items: [
                                            ...j.items,
                                            {
                                                temp_id: `new_${Date.now()}`,
                                                item_id: '',
                                                quantity: 1,
                                            },
                                        ],
                                    }
                                  : j,
                          ),
                      }
                    : p,
            ),
        );
    };

    const removeItem = (
        produkTempId: string,
        jenisItemTempId: string,
        itemTempId: string,
    ) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: p.jenisItems.map((j) =>
                              j.temp_id === jenisItemTempId
                                  ? {
                                        ...j,
                                        items: j.items.filter(
                                            (i) => i.temp_id !== itemTempId,
                                        ),
                                    }
                                  : j,
                          ),
                      }
                    : p,
            ),
        );
    };

    const updateItem = (
        produkTempId: string,
        jenisItemTempId: string,
        itemTempId: string,
        field: string,
        value: any,
    ) => {
        setFormProduks(
            formProduks.map((p) =>
                p.temp_id === produkTempId
                    ? {
                          ...p,
                          jenisItems: p.jenisItems.map((j) =>
                              j.temp_id === jenisItemTempId
                                  ? {
                                        ...j,
                                        items: j.items.map((i) =>
                                            i.temp_id === itemTempId
                                                ? { ...i, [field]: value }
                                                : i,
                                        ),
                                    }
                                  : j,
                          ),
                      }
                    : p,
            ),
        );
    };

    const getAvailableItems = (jenisItemId: string) => {
        return items.filter(
            (item) => item.jenis_item_id === parseInt(jenisItemId),
        );
    };

    const getUsedJenisItemIds = (produkTempId: string) => {
        const produk = formProduks.find((p) => p.temp_id === produkTempId);
        return produk
            ? produk.jenisItems.map((j) => j.jenis_item_id).filter((id) => id)
            : [];
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (formProduks.length === 0) {
            alert('Minimal harus ada 1 produk');
            return;
        }

        // Validate
        for (const produk of formProduks) {
            if (!produk.produk_id) {
                alert('Semua produk harus dipilih');
                return;
            }
        }

        setLoading(true);

        // Transform data
        const dataToSend = {
            produks: formProduks.map((p) => ({
                id: p.id,
                produk_id: parseInt(p.produk_id),
                quantity: p.quantity,
                panjang: p.panjang ? parseFloat(p.panjang) : null,
                lebar: p.lebar ? parseFloat(p.lebar) : null,
                tinggi: p.tinggi ? parseFloat(p.tinggi) : null,
                jenisItems: p.jenisItems.map((j) => ({
                    id: j.id,
                    jenis_item_id: parseInt(j.jenis_item_id),
                    items: j.items.map((i) => ({
                        id: i.id,
                        item_id: parseInt(i.item_id),
                        quantity: i.quantity,
                    })),
                })),
            })),
        };

        router.put(`/item-pekerjaan/${itemPekerjaan.id}/update`, dataToSend, {
            onSuccess: () => {
                setLoading(false);
            },
            onError: (errors) => {
                console.error(errors);
                alert('Gagal update data');
                setLoading(false);
            },
        });
    };

    return (
        <>
            <Head title="Edit Item Pekerjaan" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="item-pekerjaan"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50"
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
                                <h1
                                    className="text-3xl font-light text-stone-800"
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                    }}
                                >
                                    Edit Item Pekerjaan
                                </h1>
                                <p className="text-sm text-stone-500">
                                    {itemPekerjaan.moodboard.order.nama_project}{' '}
                                    •{' '}
                                    {itemPekerjaan.moodboard.order.company_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Produks */}
                        <div className="rounded-lg border border-stone-200 bg-white p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-stone-800">
                                    📦 Produk
                                </h3>
                                <button
                                    type="button"
                                    onClick={addProduk}
                                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                                >
                                    + Tambah Produk
                                </button>
                            </div>

                            {formProduks.length === 0 ? (
                                <div className="rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                                    <p className="text-sm text-stone-500">
                                        Klik "Tambah Produk" untuk memulai
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {formProduks.map((produk, pIndex) => (
                                        <div
                                            key={produk.temp_id}
                                            className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                                        >
                                            {/* Produk Header */}
                                            <div className="mb-4 flex items-start justify-between">
                                                <h4 className="font-semibold text-purple-900">
                                                    Produk #{pIndex + 1}
                                                    {produk.id && (
                                                        <span className="ml-2 text-xs text-purple-600">
                                                            (ID: {produk.id})
                                                        </span>
                                                    )}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeProduk(
                                                            produk.temp_id,
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Hapus Produk
                                                </button>
                                            </div>

                                            {/* Produk Form */}
                                            <div className="mb-4 space-y-4">
                                                {/* Produk & Quantity */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-stone-700">
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
                                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                                                            required
                                                        >
                                                            <option value="">
                                                                -- Pilih --
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
                                                        <label className="mb-2 block text-sm font-medium text-stone-700">
                                                            Quantity{' '}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                produk.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateProduk(
                                                                    produk.temp_id,
                                                                    'quantity',
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dimensi */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-medium text-stone-700">
                                                        📏 Dimensi (cm)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Panjang"
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
                                                                className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                                                            />
                                                            <p className="mt-1 text-xs text-stone-500">
                                                                Panjang
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Lebar"
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
                                                                className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                                                            />
                                                            <p className="mt-1 text-xs text-stone-500">
                                                                Lebar
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Tinggi"
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
                                                                className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
                                                            />
                                                            <p className="mt-1 text-xs text-stone-500">
                                                                Tinggi
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Jenis Items Section */}
                                            <div className="mt-4 rounded-lg border border-green-200 bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h5 className="text-sm font-semibold text-green-800">
                                                        🔧 Jenis Item & Material
                                                    </h5>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addJenisItem(
                                                                produk.temp_id,
                                                            )
                                                        }
                                                        className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                                    >
                                                        + Tambah Jenis Item
                                                    </button>
                                                </div>

                                                {produk.jenisItems.length ===
                                                0 ? (
                                                    <p className="text-center text-xs text-stone-500">
                                                        Belum ada jenis item
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {produk.jenisItems.map(
                                                            (
                                                                jenisItem,
                                                                jIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        jenisItem.temp_id
                                                                    }
                                                                    className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                                                                >
                                                                    <div className="mb-3 flex items-start justify-between">
                                                                        <span className="text-sm font-medium text-blue-900">
                                                                            Jenis
                                                                            Item
                                                                            #
                                                                            {jIndex +
                                                                                1}
                                                                            {jenisItem.id && (
                                                                                <span className="ml-2 text-xs text-blue-600">
                                                                                    (ID:{' '}
                                                                                    {
                                                                                        jenisItem.id
                                                                                    }
                                                                                    )
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeJenisItem(
                                                                                    produk.temp_id,
                                                                                    jenisItem.temp_id,
                                                                                )
                                                                            }
                                                                            className="text-xs text-red-600 hover:text-red-800"
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    </div>

                                                                    <div className="mb-3">
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
                                                                                    'jenis_item_id',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                                                            required
                                                                        >
                                                                            <option value="">
                                                                                --
                                                                                Pilih
                                                                                Jenis
                                                                                Item
                                                                                --
                                                                            </option>
                                                                            {jenisItems
                                                                                .filter(
                                                                                    (
                                                                                        j,
                                                                                    ) =>
                                                                                        !getUsedJenisItemIds(
                                                                                            produk.temp_id,
                                                                                        ).includes(
                                                                                            j.id.toString(),
                                                                                        ) ||
                                                                                        j.id.toString() ===
                                                                                            jenisItem.jenis_item_id,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        j,
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                j.id
                                                                                            }
                                                                                            value={
                                                                                                j.id
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                j.nama_jenis_item
                                                                                            }
                                                                                        </option>
                                                                                    ),
                                                                                )}
                                                                        </select>
                                                                    </div>

                                                                    {/* Items */}
                                                                    {jenisItem.jenis_item_id && (
                                                                        <div className="mt-3 rounded bg-white p-3">
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <span className="text-xs font-medium text-stone-700">
                                                                                    Item
                                                                                    Material
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        addItem(
                                                                                            produk.temp_id,
                                                                                            jenisItem.temp_id,
                                                                                        )
                                                                                    }
                                                                                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                                                                                >
                                                                                    +
                                                                                    Tambah
                                                                                    Item
                                                                                </button>
                                                                            </div>

                                                                            {jenisItem
                                                                                .items
                                                                                .length ===
                                                                            0 ? (
                                                                                <p className="text-center text-xs text-stone-400">
                                                                                    Belum
                                                                                    ada
                                                                                    item
                                                                                </p>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    {jenisItem.items.map(
                                                                                        (
                                                                                            item,
                                                                                            iIndex,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    item.temp_id
                                                                                                }
                                                                                                className="flex items-center gap-2"
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
                                                                                                    className="flex-1 rounded border border-stone-300 px-2 py-1.5 text-xs"
                                                                                                    required
                                                                                                >
                                                                                                    <option value="">
                                                                                                        --
                                                                                                        Pilih
                                                                                                        Item
                                                                                                        --
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

                                                                                                {/* Hanya tampilkan quantity jika jenis item Aksesoris */}
                                                                                                {jenisItem.jenis_item_name?.toLowerCase() ===
                                                                                                    'aksesoris' && (
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min="1"
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
                                                                                                                parseInt(
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value,
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        className="w-20 rounded border border-stone-300 px-2 py-1.5 text-xs"
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
                                                                                                    className="text-red-600 hover:text-red-800"
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
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="rounded-lg border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading || formProduks.length === 0}
                                className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-stone-300"
                            >
                                {loading ? 'Menyimpan...' : 'Update Semua'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
