import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

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

export default function Create({ auth, itemPekerjaan, produks, jenisItems, items }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [selectedProduks, setSelectedProduks] = useState<ProdukData[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    // Helper function to get default jenis items (Finishing Dalam, Finishing Luar, Aksesoris)
    const getDefaultJenisItems = (): JenisItemData[] => {
        const defaultNames = ['finishing dalam', 'finishing luar', 'aksesoris'];
        const defaultJenisItems: JenisItemData[] = [];
        
        defaultNames.forEach((name, index) => {
            const jenisItem = jenisItems.find(ji => 
                ji.nama_jenis_item.toLowerCase() === name
            );
            if (jenisItem) {
                defaultJenisItems.push({
                    temp_id: Date.now() + index,
                    jenis_item_id: jenisItem.id,
                    items: []
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
        };
        setSelectedProduks([...selectedProduks, newProduk]);
    };

    const removeProduk = (tempId: number) => {
        setSelectedProduks(selectedProduks.filter(p => p.temp_id !== tempId));
    };

    const updateProduk = (tempId: number, field: keyof ProdukData, value: any) => {
        setSelectedProduks(selectedProduks.map(p => 
            p.temp_id === tempId ? { ...p, [field]: value } : p
        ));
    };

    const addJenisItem = (produkTempId: number) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: [...p.jenisItems, {
                        temp_id: Date.now(),
                        jenis_item_id: '',
                        items: []
                    }]
                };
            }
            return p;
        }));
    };

    const removeJenisItem = (produkTempId: number, jenisTempId: number) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: p.jenisItems.filter(j => j.temp_id !== jenisTempId)
                };
            }
            return p;
        }));
    };

    const updateJenisItem = (produkTempId: number, jenisTempId: number, value: string | number) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: p.jenisItems.map(j => 
                        j.temp_id === jenisTempId ? { ...j, jenis_item_id: value, items: [] } : j
                    )
                };
            }
            return p;
        }));
    };

    const addItem = (produkTempId: number, jenisTempId: number) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: p.jenisItems.map(j => {
                        if (j.temp_id === jenisTempId) {
                            return {
                                ...j,
                                items: [...j.items, {
                                    temp_id: Date.now(),
                                    item_id: '',
                                    quantity: 1,
                                    notes: ''
                                }]
                            };
                        }
                        return j;
                    })
                };
            }
            return p;
        }));
    };

    const removeItem = (produkTempId: number, jenisTempId: number, itemTempId: number) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: p.jenisItems.map(j => {
                        if (j.temp_id === jenisTempId) {
                            return {
                                ...j,
                                items: j.items.filter(i => i.temp_id !== itemTempId)
                            };
                        }
                        return j;
                    })
                };
            }
            return p;
        }));
    };

    const updateItem = (produkTempId: number, jenisTempId: number, itemTempId: number, field: keyof ItemData, value: any) => {
        setSelectedProduks(selectedProduks.map(p => {
            if (p.temp_id === produkTempId) {
                return {
                    ...p,
                    jenisItems: p.jenisItems.map(j => {
                        if (j.temp_id === jenisTempId) {
                            return {
                                ...j,
                                items: j.items.map(i => 
                                    i.temp_id === itemTempId ? { ...i, [field]: value } : i
                                )
                            };
                        }
                        return j;
                    })
                };
            }
            return p;
        }));
    };

    const getAvailableItems = (jenisItemId: string | number): Item[] => {
        return items.filter(item => item.jenis_item_id == jenisItemId);
    };

    const getSelectedProduk = (produkId: string | number): Produk | undefined => {
        return produks.find(p => p.id == produkId);
    };

    const getJenisItemName = (jenisItemId: string | number): string => {
        const jenisItem = jenisItems.find(ji => ji.id == jenisItemId);
        return jenisItem?.nama_jenis_item || '';
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = {
            item_pekerjaan_id: itemPekerjaan.id,
            produks: selectedProduks.map(p => ({
                produk_id: p.produk_id,
                quantity: p.quantity,
                panjang: p.panjang || null,
                lebar: p.lebar || null,
                tinggi: p.tinggi || null,
                jenisItems: p.jenisItems.map(j => {
                    const selectedJenisItem = jenisItems.find(ji => ji.id.toString() === j.jenis_item_id.toString());
                    const isAksesoris = selectedJenisItem?.nama_jenis_item?.toLowerCase() === 'aksesoris';
                    
                    return {
                        jenis_item_id: j.jenis_item_id,
                        items: j.items.map(i => ({
                            item_id: i.item_id,
                            quantity: isAksesoris ? i.quantity : 1,
                            notes: i.notes || null
                        }))
                    };
                })
            }))
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
                                <h1 className="text-3xl font-bold text-slate-800">Tambah Item Pekerjaan</h1>
                                <p className="text-slate-500 mt-1">Konfigurasi produk dan material untuk project</p>
                            </div>
                        </div>
                    </div>

                    {/* Project Info Card */}
                    <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Informasi Project</h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-sm mb-1">Nama Project</p>
                                <p className="font-semibold">{itemPekerjaan.moodboard.order.nama_project}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-sm mb-1">Company</p>
                                <p className="font-semibold">{itemPekerjaan.moodboard.order.company_name}</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-white/70 text-sm mb-1">Customer</p>
                                <p className="font-semibold">{itemPekerjaan.moodboard.order.customer_name}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Add Produk Button */}
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </span>
                                Daftar Produk
                            </h2>
                            <button
                                type="button"
                                onClick={addProduk}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Produk
                            </button>
                        </div>

                        {selectedProduks.length === 0 ? (
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
                                {selectedProduks.map((produk, produkIndex) => {
                                    const selectedProdukData = getSelectedProduk(produk.produk_id);
                                    
                                    return (
                                        <div key={produk.temp_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            {/* Produk Header */}
                                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex justify-between items-center">
                                                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">
                                                        {produkIndex + 1}
                                                    </span>
                                                    Produk #{produkIndex + 1}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduk(produk.temp_id)}
                                                    className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Hapus Produk
                                                </button>
                                            </div>

                                            <div className="p-6">
                                                {/* Produk Selection & Dimensions */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Pilih Produk <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={produk.produk_id}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'produk_id', e.target.value)}
                                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                            required
                                                        >
                                                            <option value="">-- Pilih Produk --</option>
                                                            {produks.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Quantity <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={produk.quantity}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'quantity', e.target.value)}
                                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                            min="1"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dimensions */}
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
                                                                value={produk.panjang}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'panjang', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                                placeholder="Panjang"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={produk.lebar}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'lebar', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                                placeholder="Lebar"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={produk.tinggi}
                                                                onChange={(e) => updateProduk(produk.temp_id, 'tinggi', e.target.value)}
                                                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                                placeholder="Tinggi"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bahan Baku Card */}
                                                {selectedProdukData && selectedProdukData.bahan_bakus && selectedProdukData.bahan_bakus.length > 0 && (
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
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {selectedProdukData.bahan_bakus.map(bb => (
                                                                    <div key={bb.id} className="bg-white rounded-lg p-3 border border-amber-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
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
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Bahan baku otomatis dari master produk, tidak perlu input manual
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

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

                                                    {produk.jenisItems.length === 0 ? (
                                                        <div className="bg-white rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
                                                            <p className="text-slate-400 text-sm">Belum ada kategori item. Klik "Tambah Kategori" untuk menambahkan.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {produk.jenisItems.map((jenisItem) => {
                                                                const jenisName = getJenisItemName(jenisItem.jenis_item_id);
                                                                const isAksesoris = jenisName.toLowerCase() === 'aksesoris';
                                                                
                                                                return (
                                                                    <div key={jenisItem.temp_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex justify-between items-center">
                                                                            <div className="flex items-center gap-3 flex-1">
                                                                                <select
                                                                                    value={jenisItem.jenis_item_id}
                                                                                    onChange={(e) => updateJenisItem(produk.temp_id, jenisItem.temp_id, e.target.value)}
                                                                                    className="bg-white/20 text-white border-0 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-white/50 [&>option]:text-slate-800"
                                                                                    required
                                                                                >
                                                                                    <option value="">Pilih Kategori</option>
                                                                                    {jenisItems.map(ji => (
                                                                                        <option key={ji.id} value={ji.id}>{ji.nama_jenis_item}</option>
                                                                                    ))}
                                                                                </select>
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
                                                                                        {jenisItem.items.map((item) => (
                                                                                            <div key={item.temp_id} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                                                                                                <select
                                                                                                    value={item.item_id}
                                                                                                    onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'item_id', e.target.value)}
                                                                                                    className={`${isAksesoris ? 'flex-1' : 'w-1/2'} border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                                                                                                    required
                                                                                                >
                                                                                                    <option value="">Pilih Item</option>
                                                                                                    {getAvailableItems(jenisItem.jenis_item_id).map(i => (
                                                                                                        <option key={i.id} value={i.id}>{i.nama_item}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                                {!isAksesoris && (
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={item.notes}
                                                                                                        onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'notes', e.target.value)}
                                                                                                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                                                        placeholder="Notes (opsional)"
                                                                                                    />
                                                                                                )}
                                                                                                {isAksesoris && (
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={item.quantity}
                                                                                                        onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'quantity', e.target.value)}
                                                                                                        className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                                                        min="1"
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
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Error Display */}
                        {errors && Object.keys(errors).length > 0 && (
                            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-800 font-semibold">Terdapat error:</p>
                                </div>
                                <ul className="list-disc list-inside text-sm text-red-700">
                                    {Object.values(errors).map((error, idx) => (
                                        <li key={idx}>{String(error)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="mt-8 flex gap-4 justify-end">
                            <a
                                href="/item-pekerjaan"
                                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </a>
                            <button
                                type="submit"
                                disabled={processing || selectedProduks.length === 0}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processing ? (
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
                                        Simpan
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