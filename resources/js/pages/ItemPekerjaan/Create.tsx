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
    selected_bahan_bakus: number[];
}

interface RuanganData {
    temp_id: number;
    nama_ruangan: string;
    produks: ProdukData[];
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
    const [ruangans, setRuangans] = useState<RuanganData[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

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

    const addRuangan = () => {
        const newRuangan: RuanganData = {
            temp_id: Date.now(),
            nama_ruangan: '',
            produks: [],
        };
        setRuangans([...ruangans, newRuangan]);
    };

    const removeRuangan = (ruanganTempId: number) => {
        setRuangans(ruangans.filter((r) => r.temp_id !== ruanganTempId));
    };

    const updateRuanganName = (ruanganTempId: number, name: string) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId ? { ...r, nama_ruangan: name } : r,
            ),
        );
    };

    const addProdukToRuangan = (ruanganTempId: number) => {
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
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? { ...r, produks: [...r.produks, newProduk] }
                    : r,
            ),
        );
    };

    const removeProdukFromRuangan = (
        ruanganTempId: number,
        produkTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.filter(
                              (p) => p.temp_id !== produkTempId,
                          ),
                      }
                    : r,
            ),
        );
    };

    const updateProdukInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        field: keyof ProdukData,
        value: any,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? { ...p, [field]: value }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const toggleBahanBakuInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        bahanBakuId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
                              if (p.temp_id === produkTempId) {
                                  const selected = p.selected_bahan_bakus || [];
                                  const isSelected =
                                      selected.includes(bahanBakuId);
                                  return {
                                      ...p,
                                      selected_bahan_bakus: isSelected
                                          ? selected.filter(
                                                (id) => id !== bahanBakuId,
                                            )
                                          : [...selected, bahanBakuId],
                                  };
                              }
                              return p;
                          }),
                      }
                    : r,
            ),
        );
    };

    const selectAllBahanBakuInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        bahanBakuIds: number[],
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? { ...p, selected_bahan_bakus: bahanBakuIds }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const clearAllBahanBakuInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? { ...p, selected_bahan_bakus: [] }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const addJenisItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
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
                      }
                    : r,
            ),
        );
    };

    const removeJenisItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
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
                      }
                    : r,
            ),
        );
    };

    const updateJenisItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisTempId: number,
        value: string | number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
                              if (p.temp_id === produkTempId) {
                                  return {
                                      ...p,
                                      jenisItems: p.jenisItems.map((j) =>
                                          j.temp_id === jenisTempId
                                              ? {
                                                    ...j,
                                                    jenis_item_id: value,
                                                    items: [],
                                                }
                                              : j,
                                      ),
                                  };
                              }
                              return p;
                          }),
                      }
                    : r,
            ),
        );
    };

    const addItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
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
                      }
                    : r,
            ),
        );
    };

    const removeItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisTempId: number,
        itemTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
                              if (p.temp_id === produkTempId) {
                                  return {
                                      ...p,
                                      jenisItems: p.jenisItems.map((j) => {
                                          if (j.temp_id === jenisTempId) {
                                              return {
                                                  ...j,
                                                  items: j.items.filter(
                                                      (i) =>
                                                          i.temp_id !==
                                                          itemTempId,
                                                  ),
                                              };
                                          }
                                          return j;
                                      }),
                                  };
                              }
                              return p;
                          }),
                      }
                    : r,
            ),
        );
    };

    const updateItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisTempId: number,
        itemTempId: number,
        field: keyof ItemData,
        value: any,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) => {
                              if (p.temp_id === produkTempId) {
                                  return {
                                      ...p,
                                      jenisItems: p.jenisItems.map((j) => {
                                          if (j.temp_id === jenisTempId) {
                                              return {
                                                  ...j,
                                                  items: j.items.map((i) =>
                                                      i.temp_id === itemTempId
                                                          ? {
                                                                ...i,
                                                                [field]: value,
                                                            }
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
                      }
                    : r,
            ),
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

    const handleSubmit = (
        e: React.FormEvent,
        status: 'draft' | 'published',
    ) => {
        e.preventDefault();

        const allProduks: any[] = [];
        ruangans.forEach((ruangan) => {
            ruangan.produks.forEach((p) => {
                allProduks.push({
                    produk_id: p.produk_id ? parseInt(p.produk_id.toString()) : null,
                    nama_ruangan: ruangan.nama_ruangan || null,
                    quantity: p.quantity,
                    panjang: p.panjang ? parseFloat(p.panjang.toString()) : null,
                    lebar: p.lebar ? parseFloat(p.lebar.toString()) : null,
                    tinggi: p.tinggi ? parseFloat(p.tinggi.toString()) : null,
                    bahan_bakus: p.selected_bahan_bakus || [],
                    jenisItems: p.jenisItems.map((j) => {
                        const selectedJenisItem = jenisItems.find(
                            (ji) =>
                                ji.id.toString() === j.jenis_item_id.toString(),
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
                });
            });
        });

        // Client-side validation
        if (allProduks.length === 0) {
            alert('Minimal harus ada 1 produk');
            return;
        }

        for (const produk of allProduks) {
            if (!produk.produk_id) {
                alert('Semua produk harus dipilih');
                return;
            }
        }

        const formData = {
            item_pekerjaan_id: itemPekerjaan.id,
            status: status,
            produks: allProduks,
        };

        setProcessing(true);
        router.post('/item-pekerjaan/store', formData, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                // Tidak perlu setProcessing(false) karena akan redirect
            },
            onError: (errors) => {
                console.error(errors);
                alert('Gagal menyimpan data');
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
                        {/* Add Ruangan Button */}
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
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                </span>
                                Daftar Ruangan & Produk
                            </h2>
                            <button
                                type="button"
                                onClick={addRuangan}
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
                                Tambah Ruangan
                            </button>
                        </div>

                        {ruangans.length === 0 ? (
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
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                </div>
                                <p className="mb-2 text-slate-500">
                                    Belum ada ruangan yang ditambahkan
                                </p>
                                <p className="text-sm text-slate-400">
                                    Klik "Tambah Ruangan" untuk memulai
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {ruangans.map((ruangan, ruanganIndex) => (
                                    <div
                                        key={ruangan.temp_id}
                                        className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm"
                                    >
                                        {/* Ruangan Header */}
                                        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-lg font-bold text-white">
                                                    {ruanganIndex + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={ruangan.nama_ruangan}
                                                    onChange={(e) =>
                                                        updateRuanganName(
                                                            ruangan.temp_id,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="rounded-lg border-0 bg-white/20 px-4 py-2 text-lg font-semibold text-white placeholder-white/60 focus:bg-white/30 focus:ring-2 focus:ring-white/50"
                                                    placeholder="Nama Ruangan (misal: Dapur)"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeRuangan(
                                                        ruangan.temp_id,
                                                    )
                                                }
                                                className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30"
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
                                                Hapus Ruangan
                                            </button>
                                        </div>

                                        <div className="p-6">
                                            {/* Add Produk Button - Top */}
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="text-md font-semibold text-slate-700">
                                                    Produk di{' '}
                                                    {ruangan.nama_ruangan ||
                                                        'Ruangan ini'}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addProdukToRuangan(
                                                            ruangan.temp_id,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
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
                                                            d="M12 4v16m8-8H4"
                                                        />
                                                    </svg>
                                                    Tambah Produk
                                                </button>
                                            </div>

                                            {ruangan.produks.length === 0 ? (
                                                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                                    <p className="text-sm text-slate-500">
                                                        Belum ada produk di
                                                        ruangan ini
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-4">
                                                        {ruangan.produks.map(
                                                            (
                                                                produk,
                                                                produkIndex,
                                                            ) => {
                                                                const selectedProdukData =
                                                                    getSelectedProduk(
                                                                        produk.produk_id,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            produk.temp_id
                                                                        }
                                                                        className="rounded-xl border border-slate-200 bg-slate-50"
                                                                    >
                                                                        {/* Produk Header */}
                                                                        <div className="flex items-center justify-between rounded-t-xl bg-slate-700 px-4 py-3">
                                                                            <h5 className="flex items-center gap-2 font-medium text-white">
                                                                                <span className="flex h-6 w-6 items-center justify-center rounded bg-white/20 text-xs">
                                                                                    {produkIndex +
                                                                                        1}
                                                                                </span>
                                                                                Produk
                                                                                #
                                                                                {produkIndex +
                                                                                    1}
                                                                            </h5>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    removeProdukFromRuangan(
                                                                                        ruangan.temp_id,
                                                                                        produk.temp_id,
                                                                                    )
                                                                                }
                                                                                className="text-red-300 hover:text-red-200"
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
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                        <div className="p-4">
                                                                            {/* Produk Selection & Quantity */}
                                                                            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                                                <div>
                                                                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                                                                        Pilih
                                                                                        Produk{' '}
                                                                                        <span className="text-red-500">
                                                                                            *
                                                                                        </span>
                                                                                    </label>
                                                                                    <select
                                                                                        value={
                                                                                            produk.produk_id
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateProdukInRuangan(
                                                                                                ruangan.temp_id,
                                                                                                produk.temp_id,
                                                                                                'produk_id',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                        required
                                                                                    >
                                                                                        <option value="">
                                                                                            --
                                                                                            Pilih
                                                                                            Produk
                                                                                            --
                                                                                        </option>
                                                                                        {produks.map(
                                                                                            (
                                                                                                p,
                                                                                            ) => (
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
                                                                                    <label className="mb-1 block text-sm font-medium text-slate-700">
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
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateProdukInRuangan(
                                                                                                ruangan.temp_id,
                                                                                                produk.temp_id,
                                                                                                'quantity',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                        min="1"
                                                                                        required
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Dimensions */}
                                                                            <div className="mb-4">
                                                                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                                                                    Dimensi
                                                                                    (m)
                                                                                </label>
                                                                                <div className="grid grid-cols-3 gap-3">
                                                                                    <input
                                                                                        type="number"
                                                                                        value={
                                                                                            produk.panjang
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateProdukInRuangan(
                                                                                                ruangan.temp_id,
                                                                                                produk.temp_id,
                                                                                                'panjang',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                        placeholder="Panjang"
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={
                                                                                            produk.lebar
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateProdukInRuangan(
                                                                                                ruangan.temp_id,
                                                                                                produk.temp_id,
                                                                                                'lebar',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                        placeholder="Lebar"
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        value={
                                                                                            produk.tinggi
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateProdukInRuangan(
                                                                                                ruangan.temp_id,
                                                                                                produk.temp_id,
                                                                                                'tinggi',
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                                                        placeholder="Tinggi"
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Bahan Baku Selection */}
                                                                            {selectedProdukData &&
                                                                                selectedProdukData.bahan_bakus &&
                                                                                selectedProdukData
                                                                                    .bahan_bakus
                                                                                    .length >
                                                                                    0 && (
                                                                                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                                        <div className="mb-2 flex items-center justify-between">
                                                                                            <label className="text-sm font-medium text-amber-800">
                                                                                                Pilih
                                                                                                Bahan
                                                                                                Baku
                                                                                            </label>
                                                                                            <div className="flex gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        selectAllBahanBakuInRuangan(
                                                                                                            ruangan.temp_id,
                                                                                                            produk.temp_id,
                                                                                                            selectedProdukData.bahan_bakus.map(
                                                                                                                (
                                                                                                                    b,
                                                                                                                ) =>
                                                                                                                    b.id,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                    className="text-xs text-amber-700 hover:text-amber-900"
                                                                                                >
                                                                                                    Pilih
                                                                                                    Semua
                                                                                                </button>
                                                                                                <span className="text-amber-400">
                                                                                                    |
                                                                                                </span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        clearAllBahanBakuInRuangan(
                                                                                                            ruangan.temp_id,
                                                                                                            produk.temp_id,
                                                                                                        )
                                                                                                    }
                                                                                                    className="text-xs text-amber-700 hover:text-amber-900"
                                                                                                >
                                                                                                    Hapus
                                                                                                    Semua
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {selectedProdukData.bahan_bakus.map(
                                                                                                (
                                                                                                    bb,
                                                                                                ) => (
                                                                                                    <label
                                                                                                        key={
                                                                                                            bb.id
                                                                                                        }
                                                                                                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                                                                                            produk.selected_bahan_bakus?.includes(
                                                                                                                bb.id,
                                                                                                            )
                                                                                                                ? 'border-amber-500 bg-amber-100 text-amber-800'
                                                                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                                                                                                        }`}
                                                                                                    >
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={
                                                                                                                produk.selected_bahan_bakus?.includes(
                                                                                                                    bb.id,
                                                                                                                ) ||
                                                                                                                false
                                                                                                            }
                                                                                                            onChange={() =>
                                                                                                                toggleBahanBakuInRuangan(
                                                                                                                    ruangan.temp_id,
                                                                                                                    produk.temp_id,
                                                                                                                    bb.id,
                                                                                                                )
                                                                                                            }
                                                                                                            className="sr-only"
                                                                                                        />
                                                                                                        {
                                                                                                            bb.nama_item
                                                                                                        }
                                                                                                        {bb.pivot && (
                                                                                                            <span className="text-xs text-amber-600">
                                                                                                                (
                                                                                                                {formatCurrency(
                                                                                                                    bb
                                                                                                                        .pivot
                                                                                                                        .harga_dasar,
                                                                                                                )}
                                                                                                                )
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </label>
                                                                                                ),
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                            {/* Jenis Items */}
                                                                            {produk.jenisItems.map(
                                                                                (
                                                                                    jenisItem,
                                                                                    jiIndex,
                                                                                ) => {
                                                                                    const jenisItemName =
                                                                                        getJenisItemName(
                                                                                            jenisItem.jenis_item_id,
                                                                                        );
                                                                                    const availableItems =
                                                                                        getAvailableItems(
                                                                                            jenisItem.jenis_item_id,
                                                                                        );
                                                                                    const isAksesoris =
                                                                                        jenisItemName.toLowerCase() ===
                                                                                        'aksesoris';

                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                jenisItem.temp_id
                                                                                            }
                                                                                            className="mb-3 rounded-lg border border-slate-200 bg-white p-3"
                                                                                        >
                                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                                <span className="text-sm font-medium text-slate-700">
                                                                                                    {jenisItemName ||
                                                                                                        `Jenis Item ${jiIndex + 1}`}
                                                                                                </span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        addItemInRuangan(
                                                                                                            ruangan.temp_id,
                                                                                                            produk.temp_id,
                                                                                                            jenisItem.temp_id,
                                                                                                        )
                                                                                                    }
                                                                                                    className="text-xs text-indigo-600 hover:text-indigo-800"
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
                                                                                                <p className="text-xs text-slate-400">
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
                                                                                                                className="flex items-center gap-2"
                                                                                                            >
                                                                                                                <select
                                                                                                                    value={
                                                                                                                        item.item_id
                                                                                                                    }
                                                                                                                    onChange={(
                                                                                                                        e,
                                                                                                                    ) =>
                                                                                                                        updateItemInRuangan(
                                                                                                                            ruangan.temp_id,
                                                                                                                            produk.temp_id,
                                                                                                                            jenisItem.temp_id,
                                                                                                                            item.temp_id,
                                                                                                                            'item_id',
                                                                                                                            e
                                                                                                                                .target
                                                                                                                                .value,
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                                                                                                                >
                                                                                                                    <option value="">
                                                                                                                        --
                                                                                                                        Pilih
                                                                                                                        --
                                                                                                                    </option>
                                                                                                                    {availableItems.map(
                                                                                                                        (
                                                                                                                            ai,
                                                                                                                        ) => (
                                                                                                                            <option
                                                                                                                                key={
                                                                                                                                    ai.id
                                                                                                                                }
                                                                                                                                value={
                                                                                                                                    ai.id
                                                                                                                                }
                                                                                                                            >
                                                                                                                                {
                                                                                                                                    ai.nama_item
                                                                                                                                }
                                                                                                                            </option>
                                                                                                                        ),
                                                                                                                    )}
                                                                                                                </select>
                                                                                                                {isAksesoris && (
                                                                                                                    <input
                                                                                                                        type="number"
                                                                                                                        value={
                                                                                                                            item.quantity
                                                                                                                        }
                                                                                                                        onChange={(
                                                                                                                            e,
                                                                                                                        ) =>
                                                                                                                            updateItemInRuangan(
                                                                                                                                ruangan.temp_id,
                                                                                                                                produk.temp_id,
                                                                                                                                jenisItem.temp_id,
                                                                                                                                item.temp_id,
                                                                                                                                'quantity',
                                                                                                                                parseInt(
                                                                                                                                    e
                                                                                                                                        .target
                                                                                                                                        .value,
                                                                                                                                ) ||
                                                                                                                                    1,
                                                                                                                            )
                                                                                                                        }
                                                                                                                        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                                                                                                                        min="1"
                                                                                                                        placeholder="Qty"
                                                                                                                    />
                                                                                                                )}
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() =>
                                                                                                                        removeItemInRuangan(
                                                                                                                            ruangan.temp_id,
                                                                                                                            produk.temp_id,
                                                                                                                            jenisItem.temp_id,
                                                                                                                            item.temp_id,
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className="text-red-500 hover:text-red-700"
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
                                                                                    );
                                                                                },
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>

                                                    {/* Add Produk Button - Bottom */}
                                                    <div className="mt-4 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                addProdukToRuangan(
                                                                    ruangan.temp_id,
                                                                )
                                                            }
                                                            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-600 transition-all hover:border-emerald-400 hover:bg-emerald-100"
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 4v16m8-8H4"
                                                                />
                                                            </svg>
                                                            Tambah Produk Lagi
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Ruangan Button - Bottom */}
                        {ruangans.length > 0 && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={addRuangan}
                                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-3 text-sm font-medium text-indigo-600 transition-all hover:border-indigo-400 hover:bg-indigo-100"
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
                                    Tambah Ruangan Lagi
                                </button>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'draft')}
                                disabled={processing || ruangans.length === 0}
                                className="rounded-xl border border-slate-300 bg-white px-8 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan sebagai Draft'}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e, 'published')}
                                disabled={processing || ruangans.length === 0}
                                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
