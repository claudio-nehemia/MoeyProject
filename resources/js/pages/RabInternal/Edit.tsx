import { useState, useEffect, FormEvent } from 'react';
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
    nama_aksesoris: string;
    harga_satuan_aksesoris: number;
    qty_aksesoris: number;
    markup_aksesoris: number;
}

interface Produk {
    id: number;
    item_pekerjaan_produk_id: number;
    nama_produk: string;
    qty_produk: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    harga_dasar: number;
    harga_items_non_aksesoris: number;
    markup_satuan: number;
    non_aksesoris_items: NonAksesorisItem[];
    aksesoris: Aksesoris[];
    bahan_baku_names: string[];
    harga_produk: number;
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
    nama_aksesoris: string;
    harga_satuan_aksesoris: number;
    qty_aksesoris: number;
    markup_aksesoris: string | number;
}

interface FormProduk {
    id: number;
    item_pekerjaan_produk_id: number;
    markup_satuan: string | number;
    non_aksesoris_items: FormNonAksesorisItem[];
    aksesoris: FormAksesoris[];
}

export default function Edit({ rabInternal }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [formData, setFormData] = useState<FormProduk[]>([]);
    const [markupGeneral, setMarkupGeneral] = useState<string>(''); // 🔹 Markup General
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Initialize form data with existing RAB data
        const initialData = rabInternal.itemPekerjaan.produks.map(produk => ({
            id: produk.id,
            item_pekerjaan_produk_id: produk.item_pekerjaan_produk_id,
            markup_satuan: produk.markup_satuan,
            non_aksesoris_items: produk.non_aksesoris_items?.map(item => ({
                id: item.id,
                nama: item.nama,
                harga_satuan: item.harga_satuan,
            })) || [],
            aksesoris: produk.aksesoris.map(aks => ({
                id: aks.id,
                item_pekerjaan_item_id: aks.item_pekerjaan_item_id,
                nama_aksesoris: aks.nama_aksesoris,
                harga_satuan_aksesoris: aks.harga_satuan_aksesoris,
                qty_aksesoris: aks.qty_aksesoris,
                markup_aksesoris: aks.markup_aksesoris,
            })),
        }));
        setFormData(initialData);
    }, [rabInternal]);

    // 🔹 Handler Markup General: apply ke semua produk & aksesoris
    const handleMarkupGeneralChange = (value: string) => {
        setMarkupGeneral(value);

        const num = parseFloat(value);
        if (isNaN(num)) {
            // Kalau bukan angka valid, jangan paksa isi ke child
            return;
        }

        setFormData(prev =>
            prev.map(prod => ({
                ...prod,
                markup_satuan: value,
                aksesoris: prod.aksesoris.map(aks => ({
                    ...aks,
                    markup_aksesoris: value,
                })),
            }))
        );
    };

    const handleMarkupChange = (produkIndex: number, value: string) => {
        const newFormData = [...formData];
        newFormData[produkIndex].markup_satuan = value;
        setFormData(newFormData);
    };

    const handleNonAksesorisChange = (
        produkIndex: number,
        itemIndex: number,
        field: 'nama' | 'harga_satuan',
        value: string | number
    ) => {
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
            nama_aksesoris: '',
            harga_satuan_aksesoris: 0,
            qty_aksesoris: 1,
            markup_aksesoris: 5,
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

    const handleAksesorisChange = (
        produkIndex: number,
        aksesorisIndex: number,
        field: 'nama_aksesoris' | 'harga_satuan_aksesoris',
        value: string | number
    ) => {
        const newFormData = [...formData];
        if (field === 'nama_aksesoris') {
            newFormData[produkIndex].aksesoris[aksesorisIndex].nama_aksesoris = value as string;
        } else {
            newFormData[produkIndex].aksesoris[aksesorisIndex].harga_satuan_aksesoris = Number(value);
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
        
        // Calculate total harga items non-aksesoris from form data
        const totalHargaItemsNonAksesoris = formProduk.non_aksesoris_items.reduce(
            (sum, item) => sum + (Number(item.harga_satuan) || 0),
            0
        );
        
        // Ensure numbers are parsed correctly
        const hargaDasar = Number(produk.harga_dasar) || 0;
        
        return (hargaDasar + totalHargaItemsNonAksesoris) * (1 + markup / 100) * hargaDimensi;
    };

    const calculateHargaAksesoris = (aksesoris: FormAksesoris) => {
        const markup =
            typeof aksesoris.markup_aksesoris === 'string'
                ? parseFloat(aksesoris.markup_aksesoris) || 0
                : aksesoris.markup_aksesoris;

        return aksesoris.harga_satuan_aksesoris * aksesoris.qty_aksesoris * (1 + markup / 100);
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

        setLoading(true);
        router.put(
            `/rab-internal/${rabInternal.id}/update`,
            {
                produks: formData as any,
            },
            {
                onFinish: () => setLoading(false),
            }
        );
    };

    return (
        <>
            <Head title="Edit RAB Internal" />
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="rab-internal"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header Project */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Edit RAB Internal
                            </h2>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>
                                    <strong>Project:</strong> {rabInternal.itemPekerjaan.order.nama_project}
                                </p>
                                <p>
                                    <strong>Company:</strong> {rabInternal.itemPekerjaan.order.company_name}
                                </p>
                                <p>
                                    <strong>Customer:</strong> {rabInternal.itemPekerjaan.order.customer_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 🔹 Markup General (GLOBAL) */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Markup General
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Jika diisi, nilai ini akan di-copy ke <b>Markup Satuan</b> semua produk dan{' '}
                                <b>Markup Aksesoris</b> semua aksesoris. Setelah itu Anda tetap bisa edit manual per produk / aksesoris.
                            </p>
                            <div className="mt-3 max-w-xs">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Markup General (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={markupGeneral}
                                    onChange={(e) => handleMarkupGeneralChange(e.target.value)}
                                    placeholder="Contoh: 5"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FORM PRODUK */}
                    <form onSubmit={handleSubmit}>
                        {rabInternal.itemPekerjaan.produks.map((produk, produkIndex) => {
                            const formProduk = formData[produkIndex];
                            if (!formProduk) return <div key={produk.item_pekerjaan_produk_id} />;

                            const hargaSatuan = calculateHargaSatuan(
                                produk,
                                formProduk,
                                formProduk.markup_satuan
                            );
                            const totalAksesoris = formProduk.aksesoris.reduce(
                                (sum, aks) => sum + calculateHargaAksesoris(aks),
                                0
                            );
                            const hargaAkhir = hargaSatuan + totalAksesoris;

                            return (
                                <div
                                    key={produk.item_pekerjaan_produk_id}
                                    className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800"
                                >
                                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {produk.nama_produk}
                                        </h3>
                                        <p className="text-sm text-amber-100">
                                            Qty: {produk.qty_produk} |{' '}
                                            {produk.panjang &&
                                                produk.lebar &&
                                                produk.tinggi &&
                                                ` Dimensi: ${produk.panjang} × ${produk.lebar} × ${produk.tinggi} m`}
                                        </p>
                                    </div>

                                    <div className="p-6">
                                        {/* Bahan Baku - Display Only (names) */}
                                        {produk.bahan_baku_names && produk.bahan_baku_names.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                                    Bahan Baku
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {produk.bahan_baku_names.map((name, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                        >
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items Non-Aksesoris - Editable */}
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
                                                            {formProduk.non_aksesoris_items.map(
                                                                (item, itemIndex) => (
                                                                    <tr key={itemIndex}>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <input
                                                                                type="text"
                                                                                value={item.nama}
                                                                                onChange={(e) =>
                                                                                    handleNonAksesorisChange(
                                                                                        produkIndex,
                                                                                        itemIndex,
                                                                                        'nama',
                                                                                        e.target.value
                                                                                    )
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
                                                                                    handleNonAksesorisChange(
                                                                                        produkIndex,
                                                                                        itemIndex,
                                                                                        'harga_satuan',
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                                placeholder="0"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleDeleteNonAksesoris(
                                                                                        produkIndex,
                                                                                        itemIndex
                                                                                    )
                                                                                }
                                                                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                                            >
                                                                                🗑️ Hapus
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                            <tr className="bg-blue-50 dark:bg-blue-900/20">
                                                                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                    Total:
                                                                </td>
                                                                <td
                                                                    colSpan={2}
                                                                    className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400"
                                                                >
                                                                    {formatCurrency(
                                                                        formProduk.non_aksesoris_items.reduce(
                                                                            (sum, item) =>
                                                                                sum +
                                                                                (Number(
                                                                                    item.harga_satuan
                                                                                ) || 0),
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

                                        {/* Harga Breakdown */}
                                        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                Breakdown Harga
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Harga Dasar:
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(produk.harga_dasar)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Harga Items (Non-Aksesoris):
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(
                                                            formProduk.non_aksesoris_items.reduce(
                                                                (sum, item) =>
                                                                    sum +
                                                                    (Number(
                                                                        item.harga_satuan
                                                                    ) || 0),
                                                                0
                                                            )
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Dimensi (P×L×T×Qty):
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {(produk.panjang || 0) *
                                                            (produk.lebar || 0) *
                                                            (produk.tinggi || 0) *
                                                            produk.qty_produk}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Markup Satuan Input */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Markup Satuan (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formProduk.markup_satuan}
                                                onChange={(e) =>
                                                    handleMarkupChange(
                                                        produkIndex,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="0"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Harga Satuan = (Harga Dasar + Items Non-Aksesoris) × (1 + Markup%) × Harga Dimensi
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                Harga Satuan: {formatCurrency(hargaSatuan)}
                                            </p>
                                        </div>

                                        {/* Aksesoris */}
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
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Nama Aksesoris
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Harga Satuan
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Qty
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Markup (%)
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Harga Total
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                                                    Aksi
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                            {formProduk.aksesoris.map(
                                                                (aksesoris, aksesorisIndex) => (
                                                                    <tr
                                                                        key={`${produkIndex}-${aksesorisIndex}`}
                                                                    >
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <input
                                                                                type="text"
                                                                                value={
                                                                                    aksesoris.nama_aksesoris
                                                                                }
                                                                                onChange={(e) =>
                                                                                    handleAksesorisChange(
                                                                                        produkIndex,
                                                                                        aksesorisIndex,
                                                                                        'nama_aksesoris',
                                                                                        e.target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                                placeholder="Nama aksesoris"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={
                                                                                    aksesoris.harga_satuan_aksesoris
                                                                                }
                                                                                onChange={(e) =>
                                                                                    handleAksesorisChange(
                                                                                        produkIndex,
                                                                                        aksesorisIndex,
                                                                                        'harga_satuan_aksesoris',
                                                                                        e.target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                                placeholder="0"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                value={
                                                                                    aksesoris.qty_aksesoris
                                                                                }
                                                                                onChange={(e) =>
                                                                                    handleAksesorisQtyChange(
                                                                                        produkIndex,
                                                                                        aksesorisIndex,
                                                                                        e.target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={
                                                                                    aksesoris.markup_aksesoris
                                                                                }
                                                                                onChange={(e) =>
                                                                                    handleAksesorisMarkupChange(
                                                                                        produkIndex,
                                                                                        aksesorisIndex,
                                                                                        e.target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                                                required
                                                                            />
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                            {formatCurrency(
                                                                                calculateHargaAksesoris(
                                                                                    aksesoris
                                                                                )
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleDeleteAksesoris(
                                                                                        produkIndex,
                                                                                        aksesorisIndex
                                                                                    )
                                                                                }
                                                                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                                            >
                                                                                🗑️ Hapus
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                            <tr className="bg-amber-50 dark:bg-amber-900/20">
                                                                <td
                                                                    colSpan={4}
                                                                    className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100"
                                                                >
                                                                    Total Aksesoris:
                                                                </td>
                                                                <td
                                                                    colSpan={2}
                                                                    className="whitespace-nowrap px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400"
                                                                >
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

                                        {/* Harga Akhir */}
                                        <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    Harga Akhir:
                                                </span>
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

                        <div className="flex justify-end space-x-3">
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
                                {loading ? 'Menyimpan...' : 'Update RAB Internal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
