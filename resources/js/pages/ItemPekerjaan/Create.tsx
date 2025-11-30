import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface BahanBaku {
    id: number;
    nama_item: string;
    harga: number;
}

interface Produk {
    id: number;
    nama_produk: string;
    bahan_bakus: BahanBaku[];
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

interface ItemData {
    temp_id: number;
    item_id: string | number;
    quantity: number;
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

    const addProduk = () => {
        const newProduk: ProdukData = {
            temp_id: Date.now(),
            produk_id: '',
            quantity: 1,
            panjang: '',
            lebar: '',
            tinggi: '',
            jenisItems: [],
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
                                    quantity: 1
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
                    // Cek apakah jenis item adalah Aksesoris
                    const selectedJenisItem = jenisItems.find(ji => ji.id.toString() === j.jenis_item_id.toString());
                    const isAksesoris = selectedJenisItem?.nama_jenis_item?.toLowerCase() === 'aksesoris';
                    
                    return {
                        jenis_item_id: j.jenis_item_id,
                        items: j.items.map(i => ({
                            item_id: i.item_id,
                            // Set quantity default 1 untuk non-Aksesoris
                            quantity: isAksesoris ? i.quantity : 1
                        }))
                    };
                })
            }))
        };
        
        // Use router.post directly
        setProcessing(true);
        router.post(route('item-pekerjaan.store'), formData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    return (
        <>
            <Head title="Tambah Item Pekerjaan" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="item-pekerjaan"
                onClose={() => setSidebarOpen(false)}
            />

            <div className={`p-3 pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Tambah Item Pekerjaan</h2>

                            {/* Project Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold mb-2">Informasi Project</h3>
                                <p><strong>Project:</strong> {itemPekerjaan.moodboard.order.nama_project}</p>
                                <p><strong>Company:</strong> {itemPekerjaan.moodboard.order.company_name}</p>
                                <p><strong>Customer:</strong> {itemPekerjaan.moodboard.order.customer_name}</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Produks */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Produk</h3>
                                        <button
                                            type="button"
                                            onClick={addProduk}
                                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                        >
                                            + Tambah Produk
                                        </button>
                                    </div>

                                    {selectedProduks.map((produk, produkIndex) => {
                                        const selectedProdukData = getSelectedProduk(produk.produk_id);
                                        
                                        return (
                                            <div key={produk.temp_id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-semibold">Produk #{produkIndex + 1}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProduk(produk.temp_id)}
                                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                    >
                                                        Hapus Produk
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Nama Produk *</label>
                                                        <select
                                                            value={produk.produk_id}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'produk_id', e.target.value)}
                                                            className="w-full border rounded px-3 py-2"
                                                            required
                                                        >
                                                            <option value="">Pilih Produk</option>
                                                            {produks.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nama_produk}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Quantity *</label>
                                                        <input
                                                            type="number"
                                                            value={produk.quantity}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'quantity', e.target.value)}
                                                            className="w-full border rounded px-3 py-2"
                                                            min="1"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Panjang (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={produk.panjang}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'panjang', e.target.value)}
                                                            className="w-full border rounded px-3 py-2"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Lebar (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={produk.lebar}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'lebar', e.target.value)}
                                                            className="w-full border rounded px-3 py-2"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Tinggi (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={produk.tinggi}
                                                            onChange={(e) => updateProduk(produk.temp_id, 'tinggi', e.target.value)}
                                                            className="w-full border rounded px-3 py-2"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bahan Baku (Read-only) */}
                                                {selectedProdukData && selectedProdukData.bahan_bakus.length > 0 && (
                                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                                        <h5 className="font-semibold text-sm mb-2 text-blue-800">
                                                            📦 Bahan Baku (Auto-generated dari Produk)
                                                        </h5>
                                                        <ul className="list-disc list-inside text-sm text-gray-700">
                                                            {selectedProdukData.bahan_bakus.map(bb => (
                                                                <li key={bb.id}>{bb.nama_item}</li>
                                                            ))}
                                                        </ul>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            * Bahan baku tidak perlu diinput manual, akan otomatis tersimpan
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Jenis Items (Exclude Bahan Baku) */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h5 className="font-semibold text-sm">Finishing & Aksesoris</h5>
                                                        <button
                                                            type="button"
                                                            onClick={() => addJenisItem(produk.temp_id)}
                                                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                                        >
                                                            + Tambah Kategori
                                                        </button>
                                                    </div>

                                                    {produk.jenisItems.map((jenisItem) => (
                                                        <div key={jenisItem.temp_id} className="border rounded p-3 mb-3 bg-white">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <label className="block text-sm font-medium">Kategori Item</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeJenisItem(produk.temp_id, jenisItem.temp_id)}
                                                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                            
                                                            <select
                                                                value={jenisItem.jenis_item_id}
                                                                onChange={(e) => updateJenisItem(produk.temp_id, jenisItem.temp_id, e.target.value)}
                                                                className="w-full border rounded px-3 py-2 mb-2"
                                                                required
                                                            >
                                                                <option value="">Pilih Kategori</option>
                                                                {jenisItems.map(ji => (
                                                                    <option key={ji.id} value={ji.id}>{ji.nama_jenis_item}</option>
                                                                ))}
                                                            </select>

                                                            {jenisItem.jenis_item_id && (
                                                                <div className="mt-2">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <label className="block text-sm font-medium">Items</label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => addItem(produk.temp_id, jenisItem.temp_id)}
                                                                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                                                        >
                                                                            + Tambah Item
                                                                        </button>
                                                                    </div>

                                                                    {jenisItem.items.map((item) => {
                                                                        // Cek apakah jenis item adalah Aksesoris
                                                                        const selectedJenisItem = jenisItems.find(ji => ji.id.toString() === jenisItem.jenis_item_id.toString());
                                                                        const isAksesoris = selectedJenisItem?.nama_jenis_item?.toLowerCase() === 'aksesoris';
                                                                        
                                                                        return (
                                                                            <div key={item.temp_id} className="flex gap-2 mb-2">
                                                                                <select
                                                                                    value={item.item_id}
                                                                                    onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'item_id', e.target.value)}
                                                                                    className="flex-1 border rounded px-3 py-1 text-sm"
                                                                                    required
                                                                                >
                                                                                    <option value="">Pilih Item</option>
                                                                                    {getAvailableItems(jenisItem.jenis_item_id).map(i => (
                                                                                        <option key={i.id} value={i.id}>{i.nama_item}</option>
                                                                                    ))}
                                                                                </select>
                                                                                {/* Hanya tampilkan quantity jika jenis item adalah Aksesoris */}
                                                                                {isAksesoris && (
                                                                                    <input
                                                                                        type="number"
                                                                                        value={item.quantity}
                                                                                        onChange={(e) => updateItem(produk.temp_id, jenisItem.temp_id, item.temp_id, 'quantity', e.target.value)}
                                                                                        className="w-24 border rounded px-3 py-1 text-sm"
                                                                                        min="1"
                                                                                        placeholder="Qty"
                                                                                        required
                                                                                    />
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeItem(produk.temp_id, jenisItem.temp_id, item.temp_id)}
                                                                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {errors && Object.keys(errors).length > 0 && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                                        <p className="text-red-800 font-semibold mb-2">Terdapat error:</p>
                                        <ul className="list-disc list-inside text-sm text-red-700">
                                            {Object.values(errors).map((error, idx) => (
                                                <li key={idx}>{String(error)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={processing || selectedProduks.length === 0}
                                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                    <a
                                        href={route('item-pekerjaan.index')}
                                        className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                                    >
                                        Batal
                                    </a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}