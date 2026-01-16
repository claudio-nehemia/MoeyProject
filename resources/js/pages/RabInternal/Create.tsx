import { useState, useEffect, FormEvent, useMemo } from 'react';
import { router, Head } from '@inertiajs/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

interface NonAksesorisItem {
    id: number;
    nama: string;
    harga_satuan: number;
}

interface Aksesoris {
    id: number;
    item_pekerjaan_item_id: number;
    nama: string;
    harga_satuan: number;
    qty_item_pekerjaan: number;
}

interface Produk {
    id: number;
    item_pekerjaan_produk_id: number;
    nama_produk: string;
    nama_ruangan: string | null;
    qty_produk: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    harga_dasar: number;
    harga_items_non_aksesoris: number;
    non_aksesoris_items: NonAksesorisItem[];
    bahan_baku_names: string[]; // Nama bahan baku saja (tanpa harga)
    aksesoris: Aksesoris[];
}

interface RabInternal {
    id: number;
    itemPekerjaan: {
        order: {
            nama_project: string;
            company_name: string;
            customer_name: string;
        };
        produks: Produk[];
    };
}

interface Props {
    rabInternal: RabInternal;
}

interface FormNonAksesorisItem {
    id?: number;
    nama: string;
    harga_satuan: number;
}

interface FormAksesoris {
    id?: number;
    item_pekerjaan_item_id?: number;
    nama: string;
    harga_satuan: number;
    qty_item_pekerjaan: number;
    qty_aksesoris: number;
    markup_aksesoris: string | number;
}

interface FormProduk {
    item_pekerjaan_produk_id: number;
    markup_satuan: string | number;
    diskon_per_produk: string | number;
    non_aksesoris_items: FormNonAksesorisItem[];
    aksesoris: FormAksesoris[];
}

export default function Create({ rabInternal }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [formData, setFormData] = useState<FormProduk[]>([]);
    const [markupGeneral, setMarkupGeneral] = useState<string>(''); 
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initialData = rabInternal.itemPekerjaan.produks.map(produk => ({
            item_pekerjaan_produk_id: produk.item_pekerjaan_produk_id,
            markup_satuan: 5,
            diskon_per_produk: 0,
            non_aksesoris_items: produk.non_aksesoris_items?.map(item => ({
                id: item.id,
                nama: item.nama,
                harga_satuan: item.harga_satuan,
            })) || [],
            aksesoris: produk.aksesoris.map(aks => ({
                id: aks.id,
                item_pekerjaan_item_id: aks.item_pekerjaan_item_id,
                nama: aks.nama,
                harga_satuan: aks.harga_satuan,
                qty_item_pekerjaan: aks.qty_item_pekerjaan,
                qty_aksesoris: aks.qty_item_pekerjaan, // Gunakan quantity dari item pekerjaan
                markup_aksesoris: 5,
            })),
        }));
        setFormData(initialData as any);
    }, [rabInternal]);

    // === 🔥 Markup General Setter =====
    const applyMarkupGeneral = (value: string) => {
        setMarkupGeneral(value);

        if (value === '' || value === null) return;

        const num = parseFloat(value) || 0;

        const updated = formData.map(p => ({
            ...p,
            markup_satuan: num,
            aksesoris: p.aksesoris.map(a => ({
                ...a,
                markup_aksesoris: num
            }))
        }));

        setFormData(updated);
    };
    const handleMarkupChange = (produkIndex: number, value: string) => {
        const newFormData = [...formData];
        newFormData[produkIndex].markup_satuan = value;
        setFormData(newFormData);
    };

    const handleNonAksesorisChange = (produkIndex: number, itemIndex: number, field: 'nama' | 'harga_satuan', value: string | number) => {
        const newFormData = [...formData];
        if (field === 'nama') {
            newFormData[produkIndex].non_aksesoris_items[itemIndex].nama = value as string;
        } else {
            newFormData[produkIndex].non_aksesoris_items[itemIndex].harga_satuan = Number(value);
        }
        setFormData(newFormData);
    };

    const handleDeleteNonAksesoris = (produkIndex: number, itemIndex: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
            const newFormData = [...formData];
            newFormData[produkIndex].non_aksesoris_items.splice(itemIndex, 1);
            setFormData(newFormData);
        }
    };

    const handleAddNonAksesoris = (produkIndex: number) => {
        const newFormData = [...formData];
        newFormData[produkIndex].non_aksesoris_items.push({
            nama: '',
            harga_satuan: 0,
        });
        setFormData(newFormData);
    };

    const handleAddAksesoris = (produkIndex: number) => {
        const newFormData = [...formData];
        newFormData[produkIndex].aksesoris.push({
            nama: '',
            harga_satuan: 0,
            qty_item_pekerjaan: 1,
            qty_aksesoris: 1,
            markup_aksesoris: markupGeneral !== '' ? Number(markupGeneral) : 5,
        });
        setFormData(newFormData);
    };

    const handleDeleteAksesoris = (produkIndex: number, aksesorisIndex: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus aksesoris ini?')) {
            const newFormData = [...formData];
            newFormData[produkIndex].aksesoris.splice(aksesorisIndex, 1);
            setFormData(newFormData);
        }
    };

    const handleAksesorisChange = (produkIndex: number, aksesorisIndex: number, field: 'nama' | 'harga_satuan', value: string | number) => {
        const newFormData = [...formData];
        if (field === 'nama') {
            newFormData[produkIndex].aksesoris[aksesorisIndex].nama = value as string;
        } else {
            newFormData[produkIndex].aksesoris[aksesorisIndex].harga_satuan = Number(value);
        }
        setFormData(newFormData);
    };

    const handleAksesorisQtyChange = (produkIndex: number, aksesorisIndex: number, value: string) => {
        const newFormData = [...formData];
        newFormData[produkIndex].aksesoris[aksesorisIndex].qty_aksesoris = parseInt(value) || 1;
        setFormData(newFormData);
    };

    const handleAksesorisMarkupChange = (produkIndex: number, aksesorisIndex: number, value: string) => {
        const newFormData = [...formData];
        newFormData[produkIndex].aksesoris[aksesorisIndex].markup_aksesoris = value;
        setFormData(newFormData);
    };

    const calculateHargaSatuan = (produk: Produk, formProduk: FormProduk, markupSatuan: string | number) => {
        const markup = typeof markupSatuan === 'string' ? parseFloat(markupSatuan) || 0 : markupSatuan;

        // Use Math.max(1, value) to match backend calculation logic
        // Values are stored as-is (e.g., 0.8), but minimum 1 is used for calculation
        const panjang = Math.max(1, produk.panjang || 1);
        const lebar = Math.max(1, produk.lebar || 1);
        const tinggi = Math.max(1, produk.tinggi || 1);
        const hargaDimensi = panjang * lebar * tinggi * produk.qty_produk;

        const totalHargaItemsNonAksesoris = formProduk.non_aksesoris_items.reduce((sum, item) => sum + (Number(item.harga_satuan) || 0), 0);

        const hargaDasar = Number(produk.harga_dasar) || 0;

        // ✅ RUMUS RAB INTERNAL: (Harga BB + Finishing) ÷ (Markup/100) × Dimensi
        const markupDivider = markup / 100; // 150 → 1.5
        return (hargaDasar + totalHargaItemsNonAksesoris) / markupDivider * hargaDimensi;
    };

    const calculateHargaAksesoris = (aksesoris: FormAksesoris) => {
        const markup = typeof aksesoris.markup_aksesoris === 'string' ? parseFloat(aksesoris.markup_aksesoris) || 0 : aksesoris.markup_aksesoris;
        // ✅ RUMUS AKSESORIS: Harga Aks ÷ (Markup/100) × Qty
        const markupDivider = markup / 100; // 150 → 1.5
        return (aksesoris.harga_satuan / markupDivider) * aksesoris.qty_aksesoris;
    };

    const calculateHargaAkhir = (produk: Produk, formProduk: FormProduk) => {
        const hargaSatuan = calculateHargaSatuan(produk, formProduk, formProduk.markup_satuan);
        const totalAksesoris = formProduk.aksesoris.reduce((sum, aks) => sum + calculateHargaAksesoris(aks), 0);
        const hargaSebelumDiskon = hargaSatuan + totalAksesoris;
        
        // ✅ APPLY DISKON: Harga Jual (Diskon) = Harga Jual (Sebelum Diskon) × (1 - Diskon/100)
        const diskon = typeof formProduk.diskon_per_produk === 'string' ? parseFloat(formProduk.diskon_per_produk) || 0 : formProduk.diskon_per_produk;
        return hargaSebelumDiskon * (1 - diskon / 100);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const cleanedData = formData.map(produk => ({
            ...produk,
            aksesoris: produk.aksesoris.filter(aks => aks.qty_aksesoris > 0),
        }));

        setLoading(true);
        router.post('/rab-internal/store', {
            rab_internal_id: rabInternal.id,
            produks: cleanedData as any,
        }, {
            onFinish: () => setLoading(false),
        });
    };

    // Group products by ruangan
    const groupedByRuangan = useMemo(() => {
        const groups: { [key: string]: { produk: Produk; formIndex: number }[] } = {};
        rabInternal.itemPekerjaan.produks.forEach((produk, index) => {
            const ruangan = produk.nama_ruangan || 'Tanpa Ruangan';
            if (!groups[ruangan]) {
                groups[ruangan] = [];
            }
            groups[ruangan].push({ produk, formIndex: index });
        });
        return Object.entries(groups).map(([nama_ruangan, items]) => ({
            nama_ruangan,
            items,
        }));
    }, [rabInternal.itemPekerjaan.produks]);

    return (
        <>
            <Head title="Input RAB Internal" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="rab-internal" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">

                    {/* 🔹 Formula RAB Internal */}
                    <div className="mb-6 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-sm sm:rounded-lg dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    Formula Perhitungan RAB Internal
                                </h3>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-indigo-500">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📦 Harga Satuan Produk:</p>
                                        <code className="text-sm bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded block">
                                            (Harga BB + Finishing) ÷ (Markup / 100) × Dimensi × Qty
                                        </code>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            💡 Contoh: Markup <strong>150%</strong> → 150/100 = 1.5, lalu harga <strong>dibagi</strong> 1.5
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🎨 Harga Aksesoris:</p>
                                        <code className="text-sm bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded block">
                                            (Harga Satuan Aks ÷ (Markup / 100)) × Qty
                                        </code>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">🏷️ Komponen:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                                <span className="text-gray-600 dark:text-gray-400">Harga BB (Bahan Baku)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                                <span className="text-gray-600 dark:text-gray-400">Finishing (Dalam + Luar)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                                <span className="text-gray-600 dark:text-gray-400">Markup (dibagi)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                                <span className="text-gray-600 dark:text-gray-400">Dimensi (P × L × T)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==== MARKUP GENERAL HERE ==== */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Markup General (%)
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={markupGeneral}
                                onChange={(e) => applyMarkupGeneral(e.target.value)}
                                placeholder="Jika diisi, semua markup ikut nilai ini"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Mengisi field ini akan mengubah seluruh Markup Satuan & Markup Aksesoris.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {groupedByRuangan.map((ruangan, ruanganIndex) => (
                            <div key={ruanganIndex} className="mb-8">
                                {/* Ruangan Header */}
                                <div className="mb-4 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 p-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <h2 className="text-xl font-bold text-white">{ruangan.nama_ruangan}</h2>
                                        <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">
                                            {ruangan.items.length} produk
                                        </span>
                                    </div>
                                </div>

                                {/* Products in this Ruangan */}
                                {ruangan.items.map(({ produk, formIndex: produkIndex }) => {
                            const formProduk = formData[produkIndex];
                            if (!formProduk) return <div key={produk.id} />;

                            const hargaSatuan = calculateHargaSatuan(produk, formProduk, formProduk.markup_satuan);
                            const totalAksesoris = formProduk.aksesoris.reduce((sum, aks) => sum + calculateHargaAksesoris(aks), 0);
                            const hargaAkhir = hargaSatuan + totalAksesoris;

                            return (
                                <div key={produk.id} className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">

                                    {/* HEADER PRODUK */}
                                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {produk.nama_produk}
                                        </h3>
                                        <p className="text-sm text-amber-100">
                                            Qty: {produk.qty_produk} | 
                                            {produk.panjang && produk.lebar && produk.tinggi && 
                                                ` Dimensi: ${produk.panjang} × ${produk.lebar} × ${produk.tinggi} m`
                                            }
                                        </p>
                                    </div>

                                    <div className="p-6">

                                        {/* BAHAN BAKU (nama saja, tanpa harga) */}
                                        {produk.bahan_baku_names && produk.bahan_baku_names.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                    Bahan Baku
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {produk.bahan_baku_names.map((nama, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                                        >
                                                            {nama}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    * Harga bahan baku sudah termasuk dalam Harga Dasar produk
                                                </p>
                                            </div>
                                        )}

                                        {/* ITEMS NON AKSESORIS (Finishing Dalam/Luar) */}
                                        <div className="mb-6">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    Items Non-Aksesoris
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddNonAksesoris(produkIndex)}
                                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                                >
                                                    + Tambah Item
                                                </button>
                                            </div>

                                            {formProduk.non_aksesoris_items.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Nama Item
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Harga Satuan
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Aksi
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                            {formProduk.non_aksesoris_items.map((item, itemIndex) => (
                                                                <tr key={itemIndex}>
                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="text"
                                                                            value={item.nama}
                                                                            onChange={(e) =>
                                                                                handleNonAksesorisChange(produkIndex, itemIndex, 'nama', e.target.value)
                                                                            }
                                                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                            placeholder="Nama item"
                                                                            required
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={item.harga_satuan}
                                                                            onChange={(e) =>
                                                                                handleNonAksesorisChange(produkIndex, itemIndex, 'harga_satuan', e.target.value)
                                                                            }
                                                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                            placeholder="0"
                                                                            required
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteNonAksesoris(produkIndex, itemIndex)}
                                                                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                                        >
                                                                            🗑️ Hapus
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}

                                                            {/* TOTAL */}
                                                            <tr className="bg-blue-50 dark:bg-blue-900/20">
                                                                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                    Total:
                                                                </td>
                                                                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                    {formatCurrency(
                                                                        formProduk.non_aksesoris_items.reduce(
                                                                            (sum, item) => sum + (Number(item.harga_satuan) || 0),
                                                                            0
                                                                        )
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Belum ada item non-aksesoris
                                                </p>
                                            )}
                                        </div>

                                        {/* BREAKDOWN */}
                                        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                Breakdown Harga
                                            </h4>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Harga Dasar:</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(produk.harga_dasar)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Harga Items (Non-Aksesoris):</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(
                                                            formProduk.non_aksesoris_items.reduce(
                                                                (sum, item) => sum + (Number(item.harga_satuan) || 0),
                                                                0
                                                            )
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Dimensi (P×L×T×Qty):</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {(produk.panjang || 0) *
                                                            (produk.lebar || 0) *
                                                            (produk.tinggi || 0) *
                                                            produk.qty_produk}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MARKUP SATUAN */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Markup Satuan (%)
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formProduk.markup_satuan}
                                                onChange={(e) => handleMarkupChange(produkIndex, e.target.value)}
                                                placeholder="0"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />

                                            <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                Harga Satuan: {formatCurrency(hargaSatuan)}
                                            </p>
                                        </div>

                                        {/* DISKON PER PRODUK */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Diskon Per Produk (%)
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formProduk.diskon_per_produk}
                                                onChange={(e) => {
                                                    const updated = [...formData];
                                                    updated[produkIndex].diskon_per_produk = e.target.value;
                                                    setFormData(updated);
                                                }}
                                                placeholder="0"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                            />

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Diskon diterapkan setelah harga satuan + aksesoris
                                            </p>
                                        </div>

                                        {/* AKSESORIS */}
                                        <div className="mb-6">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    Aksesoris
                                                </h4>

                                                <button
                                                    type="button"
                                                    onClick={() => handleAddAksesoris(produkIndex)}
                                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                                                >
                                                    + Tambah Aksesoris
                                                </button>
                                            </div>

                                            {formProduk.aksesoris.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-4 py-3">Nama</th>
                                                                <th className="px-4 py-3">Harga</th>
                                                                <th className="px-4 py-3">Qty</th>
                                                                <th className="px-4 py-3">Markup (%)</th>
                                                                <th className="px-4 py-3">Total</th>
                                                                <th className="px-4 py-3">Aksi</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                            {formProduk.aksesoris.map((aks, aksIndex) => (
                                                                <tr key={`${produkIndex}-${aksIndex}`}>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="text"
                                                                            value={aks.nama}
                                                                            onChange={(e) =>
                                                                                handleAksesorisChange(produkIndex, aksIndex, 'nama', e.target.value)
                                                                            }
                                                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={aks.harga_satuan}
                                                                            onChange={(e) =>
                                                                                handleAksesorisChange(produkIndex, aksIndex, 'harga_satuan', e.target.value)
                                                                            }
                                                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={aks.qty_aksesoris}
                                                                            onChange={(e) =>
                                                                                handleAksesorisQtyChange(produkIndex, aksIndex, e.target.value)
                                                                            }
                                                                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={aks.markup_aksesoris}
                                                                            onChange={(e) =>
                                                                                handleAksesorisMarkupChange(produkIndex, aksIndex, e.target.value)
                                                                            }
                                                                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm font-bold">
                                                                        {formatCurrency(calculateHargaAksesoris(aks))}
                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteAksesoris(produkIndex, aksIndex)}
                                                                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </td>

                                                                </tr>
                                                            ))}

                                                            {/* TOTAL */}
                                                            <tr className="bg-amber-50 dark:bg-amber-900/20">
                                                                <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                                                                    Total Aksesoris:
                                                                </td>
                                                                <td colSpan={2} className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">
                                                                    {formatCurrency(totalAksesoris)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Belum ada aksesoris
                                                </p>
                                            )}
                                        </div>

                                        {/* HARGA AKHIR */}
                                        <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold">Harga Akhir:</span>
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(hargaAkhir)}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                Harga Akhir = Harga Satuan + Total Aksesoris
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        ))}

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={() => router.visit('/rab-internal')}
                                className="rounded-lg bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Batal
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 text-sm font-medium text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan RAB Internal'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
