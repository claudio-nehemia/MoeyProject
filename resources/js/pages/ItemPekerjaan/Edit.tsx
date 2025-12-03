import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface BahanBakuPivot {
    harga_dasar: number;
    harga_jasa: number;
}

interface BahanBaku {
    id: number;
    nama_item: string;
    pivot?: BahanBakuPivot;
}

interface Produk {
    id: number;
    nama_produk: string;
    harga_dasar?: number;
    harga_jasa?: number;
    bahan_bakus?: BahanBaku[];
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
    notes: string;
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
    notes: string | null;
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

    // Helper function to get default jenis items (Finishing Dalam, Finishing Luar, Aksesoris)
    const getDefaultJenisItems = (): FormJenisItem[] => {
        const defaultNames = ['finishing dalam', 'finishing luar', 'aksesoris'];
        const defaultJenisItems: FormJenisItem[] = [];
        
        defaultNames.forEach((name, index) => {
            const jenisItem = jenisItems.find(ji => 
                ji.nama_jenis_item.toLowerCase() === name
            );
            if (jenisItem) {
                defaultJenisItems.push({
                    temp_id: `new_${Date.now() + index}`,
                    jenis_item_id: jenisItem.id.toString(),
                    jenis_item_name: jenisItem.nama_jenis_item,
                    items: []
                });
            }
        });
        
        return defaultJenisItems;
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

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
                    notes: i.notes || '',
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
                jenisItems: getDefaultJenisItems(),
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
                                                notes: '',
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

        // Transform data - filter out Bahan Baku
        const dataToSend = {
            produks: formProduks.map((p) => ({
                id: p.id,
                produk_id: parseInt(p.produk_id),
                quantity: p.quantity,
                panjang: p.panjang ? parseFloat(p.panjang) : null,
                lebar: p.lebar ? parseFloat(p.lebar) : null,
                tinggi: p.tinggi ? parseFloat(p.tinggi) : null,
                jenisItems: p.jenisItems
                    .filter((j) => j.jenis_item_name?.toLowerCase() !== 'bahan baku')
                    .map((j) => {
                        const isAksesoris = j.jenis_item_name?.toLowerCase() === 'aksesoris';
                        return {
                            id: j.id,
                            jenis_item_id: parseInt(j.jenis_item_id),
                            items: j.items.map((i) => ({
                                id: i.id,
                                item_id: parseInt(i.item_id),
                                // Set quantity default 1 untuk non-Aksesoris
                                quantity: isAksesoris ? i.quantity : 1,
                                notes: i.notes || null,
                            })),
                        };
                    }),
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

            <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:shadow-md"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">Edit Item Pekerjaan</h1>
                                <p className="text-slate-500 mt-1">
                                    {itemPekerjaan.moodboard.order.nama_project} • {itemPekerjaan.moodboard.order.company_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Add Produk Button */}
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </span>
                                Daftar Produk
                            </h2>
                            <button
                                type="button"
                                onClick={addProduk}
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Produk
                            </button>
                        </div>

                        {formProduks.length === 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <p className="text-slate-500 mb-2">Belum ada produk yang ditambahkan</p>
                                <p className="text-slate-400 text-sm">Klik "Tambah Produk" untuk memulai</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formProduks.map((produk, pIndex) => {
                                    const selectedProduk = produks.find(
                                        (pr) => pr.id.toString() === produk.produk_id,
                                    );

                                    return (
                                        <div key={produk.temp_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            {/* Produk Header */}
                                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                                                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                                                        {pIndex + 1}
                                                    </span>
                                                    Produk #{pIndex + 1}
                                                    {produk.id && (
                                                        <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                                                            ID: {produk.id}
                                                        </span>
                                                    )}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduk(produk.temp_id)}
                                                    className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Hapus
                                                </button>
                                            </div>

                                            <div className="p-6">
                                                {/* Produk Selection & Quantity */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Pilih Produk <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={produk.produk_id}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'produk_id', e.target.value)}
                                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            required
                                                        >
                                                            <option value="">-- Pilih --</option>
                                                            {produks.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.nama_produk}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Quantity <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={produk.quantity}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'quantity', parseInt(e.target.value))}
                                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dimensi */}
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                        </svg>
                                                        Dimensi (cm)
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Panjang"
                                                                value={produk.panjang}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'panjang', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            />
                                                            <p className="mt-1 text-xs text-slate-500">Panjang</p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Lebar"
                                                                value={produk.lebar}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'lebar', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            />
                                                            <p className="mt-1 text-xs text-slate-500">Lebar</p>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                min="0"
                                                                placeholder="Tinggi"
                                                                value={produk.tinggi}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'tinggi', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                                            />
                                                            <p className="mt-1 text-xs text-slate-500">Tinggi</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bahan Baku Card */}
                                                {(() => {
                                                    const masterBahanBakus = selectedProduk?.bahan_bakus || [];
                                                    const existingBahanBaku = produk.jenisItems.find(
                                                        (j) => j.jenis_item_name?.toLowerCase() === 'bahan baku'
                                                    );
                                                    const allBahanBakus = existingBahanBaku?.items || [];
                                                    
                                                    if (masterBahanBakus.length > 0 || allBahanBakus.length > 0) {
                                                        return (
                                                            <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
                                                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                                                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                        Bahan Baku (Auto dari Produk)
                                                                    </h4>
                                                                </div>
                                                                <div className="p-4">
                                                                    {allBahanBakus.length > 0 ? (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {allBahanBakus.map((item) => {
                                                                                const itemData = items.find(i => i.id.toString() === item.item_id);
                                                                                return (
                                                                                    <div key={item.temp_id || item.id} className="bg-white rounded-lg p-3 border border-amber-100 flex items-center gap-3">
                                                                                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="font-medium text-slate-800">
                                                                                                {itemData?.nama_item || `Item ID: ${item.item_id}`}
                                                                                            </p>
                                                                                            {item.quantity > 1 && (
                                                                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {masterBahanBakus.map((bb: BahanBaku) => (
                                                                                <div key={bb.id} className="bg-white rounded-lg p-3 border border-amber-100 flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-medium text-slate-800">{bb.nama_item}</p>
                                                                                        {bb.pivot && (
                                                                                            <div className="text-xs text-slate-500 space-x-2">
                                                                                                <span>Dasar: {formatCurrency(bb.pivot.harga_dasar)}</span>
                                                                                                <span>•</span>
                                                                                                <span>Jasa: {formatCurrency(bb.pivot.harga_jasa)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Bahan baku otomatis dari master produk, tidak bisa diubah manual
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {/* Jenis Items Section */}
                                                <div className="bg-slate-50 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                            Finishing & Aksesoris
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => addJenisItem(produk.temp_id)}
                                                            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            Tambah Kategori
                                                        </button>
                                                    </div>

                                                    {(() => {
                                                        const editableJenisItems = produk.jenisItems.filter(
                                                            (j) => j.jenis_item_name?.toLowerCase() !== 'bahan baku'
                                                        );
                                                        
                                                        return editableJenisItems.length === 0 ? (
                                                            <div className="bg-white rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
                                                                <p className="text-slate-400 text-sm">Belum ada kategori item. Klik "Tambah Kategori" untuk menambahkan.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {editableJenisItems.map((jenisItem, jIndex) => {
                                                                    const isAksesoris = jenisItem.jenis_item_name?.toLowerCase() === 'aksesoris';
                                                                    
                                                                    return (
                                                                        <div key={jenisItem.temp_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex justify-between items-center">
                                                                                <div className="flex items-center gap-3 flex-1">
                                                                                    <select
                                                                                        value={jenisItem.jenis_item_id}
                                                                                        onChange={(e) => {
                                                                                            const selectedJI = jenisItems.find(ji => ji.id.toString() === e.target.value);
                                                                                            updateJenisItem(produk.temp_id, jenisItem.temp_id, 'jenis_item_id', e.target.value);
                                                                                            if (selectedJI) {
                                                                                                updateJenisItem(produk.temp_id, jenisItem.temp_id, 'jenis_item_name', selectedJI.nama_jenis_item);
                                                                                            }
                                                                                        }}
                                                                                        className="bg-white/20 text-white border-0 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                                                                                        required
                                                                                    >
                                                                                        <option value="">-- Pilih Jenis Item --</option>
                                                                                        {jenisItems.map((j) => (
                                                                                            <option key={j.id} value={j.id}>
                                                                                                {j.nama_jenis_item}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {jenisItem.id && (
                                                                                        <span className="text-xs text-white/70 bg-white/20 px-2 py-1 rounded">
                                                                                            ID: {jenisItem.id}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeJenisItem(produk.temp_id, jenisItem.temp_id)}
                                                                                    className="w-8 h-8 bg-red-500/20 text-white rounded-lg flex items-center justify-center hover:bg-red-500/40 transition-colors"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>

                                                                            {jenisItem.jenis_item_id && (
                                                                                <div className="p-4">
                                                                                    <div className="flex justify-between items-center mb-3">
                                                                                        <span className="text-sm font-medium text-slate-700">Daftar Item</span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => addItem(produk.temp_id, jenisItem.temp_id)}
                                                                                            className="bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                                                                        >
                                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                                            </svg>
                                                                                            Tambah Item
                                                                                        </button>
                                                                                    </div>

                                                                                    {jenisItem.items.length === 0 ? (
                                                                                        <p className="text-center text-slate-400 text-sm py-4">Belum ada item</p>
                                                                                    ) : (
                                                                                        <div className="space-y-2">
                                                                                            {jenisItem.items.map((item, iIndex) => (
                                                                                                <div key={item.temp_id} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                                                                                                    <select
                                                                                                        value={item.item_id}
                                                                                                        onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'item_id', e.target.value)}
                                                                                                        className={`${isAksesoris ? 'flex-1' : 'w-1/2'} border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                                                                                                        required
                                                                                                    >
                                                                                                        <option value="">-- Pilih Item --</option>
                                                                                                        {getAvailableItems(jenisItem.jenis_item_id).map((i) => (
                                                                                                            <option key={i.id} value={i.id}>
                                                                                                                {i.nama_item}
                                                                                                            </option>
                                                                                                        ))}
                                                                                                    </select>

                                                                                                    {!isAksesoris && (
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={item.notes}
                                                                                                            onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'notes', e.target.value)}
                                                                                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                                                                            placeholder="Notes (opsional)"
                                                                                                        />
                                                                                                    )}

                                                                                                    {isAksesoris && (
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            min="1"
                                                                                                            value={item.quantity}
                                                                                                            onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'quantity', parseInt(e.target.value))}
                                                                                                            className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                                                                            placeholder="Qty"
                                                                                                            required
                                                                                                        />
                                                                                                    )}

                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => removeItem(produk.temp_id, jenisItem.temp_id, item.temp_id)}
                                                                                                        className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                                                                                                    >
                                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-8 flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => router.visit('/item-pekerjaan')}
                                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading || formProduks.length === 0}
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Update Semua
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}