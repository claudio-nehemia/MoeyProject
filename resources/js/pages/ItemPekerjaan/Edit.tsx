import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { RuanganCard } from './components';

interface BahanBaku {
    id: number;
    nama_item: string;
    pivot?: {
        harga_dasar: number;
        harga_jasa: number;
    };
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
    temp_id: number;
    item_id: string | number;
    quantity: number;
    notes: string;
}

interface FormJenisItem {
    id?: number;
    temp_id: number;
    jenis_item_id: string | number;
    jenis_item_name?: string;
    items: FormItem[];
}

interface ProdukData {
    id?: number;
    temp_id: number;
    produk_id: string | number;
    produk_name?: string;
    quantity: number;
    panjang: string | number;
    lebar: string | number;
    tinggi: string | number;
    jenisItems: FormJenisItem[];
    selected_bahan_bakus: number[];
}

interface RuanganData {
    temp_id: number;
    nama_ruangan: string;
    produks: ProdukData[];
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
    nama_ruangan: string | null;
    quantity: number;
    panjang: number | null;
    lebar: number | null;
    tinggi: number | null;
    jenisItems: ExistingJenisItem[];
    selected_bahan_bakus?: number[];
}

interface ItemPekerjaanType {
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
    itemPekerjaan: ItemPekerjaanType;
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
    const [ruangans, setRuangans] = useState<RuanganData[]>([]);

    // Helper function to get default jenis items
    const getDefaultJenisItems = (): FormJenisItem[] => {
        const defaultNames = ['finishing dalam', 'finishing luar', 'aksesoris'];
        const defaultJenisItems: FormJenisItem[] = [];

        defaultNames.forEach((name, index) => {
            const jenisItem = jenisItems.find(
                (ji) => ji.nama_jenis_item.toLowerCase() === name,
            );
            if (jenisItem) {
                defaultJenisItems.push({
                    temp_id: Date.now() + index,
                    jenis_item_id: jenisItem.id.toString(),
                    jenis_item_name: jenisItem.nama_jenis_item,
                    items: [],
                });
            }
        });

        return defaultJenisItems;
    };

    // Initialize form with existing data - group by ruangan
    useEffect(() => {
        const ruanganMap = new Map<string, ProdukData[]>();

        itemPekerjaan.produks.forEach((p) => {
            const ruanganName = p.nama_ruangan || 'Ruangan Tanpa Nama';

            const produkData: ProdukData = {
                id: p.id,
                temp_id: Date.now() + Math.random() * 1000,
                produk_id: p.produk_id.toString(),
                produk_name: p.produk_name,
                quantity: p.quantity,
                panjang: p.panjang?.toString() || '',
                lebar: p.lebar?.toString() || '',
                tinggi: p.tinggi?.toString() || '',
                selected_bahan_bakus: p.selected_bahan_bakus || [],
                jenisItems: p.jenisItems.map((j, jIdx) => ({
                    id: j.id,
                    temp_id: Date.now() + jIdx + Math.random() * 1000,
                    jenis_item_id: j.jenis_item_id.toString(),
                    jenis_item_name: j.jenis_item_name,
                    items: j.items.map((i, iIdx) => ({
                        id: i.id,
                        temp_id: Date.now() + iIdx + Math.random() * 1000,
                        item_id: i.item_id.toString(),
                        quantity: i.quantity,
                        notes: i.notes || '',
                    })),
                })),
            };

            if (!ruanganMap.has(ruanganName)) {
                ruanganMap.set(ruanganName, []);
            }
            ruanganMap.get(ruanganName)!.push(produkData);
        });

        const initialRuangans: RuanganData[] = [];
        let ruanganIdx = 0;
        ruanganMap.forEach((prods, ruanganName) => {
            initialRuangans.push({
                temp_id: Date.now() + ruanganIdx++,
                nama_ruangan:
                    ruanganName === 'Ruangan Tanpa Nama' ? '' : ruanganName,
                produks: prods,
            });
        });

        setRuangans(initialRuangans);
    }, [itemPekerjaan]);

    // ============ Ruangan Functions ============
    const addRuangan = () => {
        setRuangans([
            ...ruangans,
            {
                temp_id: Date.now(),
                nama_ruangan: '',
                produks: [],
            },
        ]);
    };

    const removeRuangan = (ruanganTempId: number) => {
        setRuangans(ruangans.filter((r) => r.temp_id !== ruanganTempId));
    };

    const updateRuanganName = (ruanganTempId: number, nama: string) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId ? { ...r, nama_ruangan: nama } : r,
            ),
        );
    };

    // ============ Produk Functions ============
    const addProdukToRuangan = (ruanganTempId: number) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: [
                              ...r.produks,
                              {
                                  temp_id: Date.now(),
                                  produk_id: '',
                                  quantity: 1,
                                  panjang: '',
                                  lebar: '',
                                  tinggi: '',
                                  jenisItems: getDefaultJenisItems(),
                                  selected_bahan_bakus: [],
                              },
                          ],
                      }
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
        field: string,
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

    // ============ Bahan Baku Functions ============
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

    // ============ Jenis Item Functions ============
    const addJenisItemInRuangan = (
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
                                  ? {
                                        ...p,
                                        jenisItems: [
                                            ...p.jenisItems,
                                            {
                                                temp_id: Date.now(),
                                                jenis_item_id: '',
                                                items: [],
                                            },
                                        ],
                                    }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const removeJenisItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisItemTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? {
                                        ...p,
                                        jenisItems: p.jenisItems.filter(
                                            (j) =>
                                                j.temp_id !== jenisItemTempId,
                                        ),
                                    }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const updateJenisItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisItemTempId: number,
        value: string,
    ) => {
        const selectedJI = jenisItems.find((ji) => ji.id.toString() === value);
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? {
                                        ...p,
                                        jenisItems: p.jenisItems.map((j) =>
                                            j.temp_id === jenisItemTempId
                                                ? {
                                                      ...j,
                                                      jenis_item_id: value,
                                                      jenis_item_name:
                                                          selectedJI?.nama_jenis_item ||
                                                          '',
                                                  }
                                                : j,
                                        ),
                                    }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    // ============ Item Functions ============
    const addItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisItemTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
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
                                                              temp_id:
                                                                  Date.now(),
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
                      }
                    : r,
            ),
        );
    };

    const removeItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisItemTempId: number,
        itemTempId: number,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? {
                                        ...p,
                                        jenisItems: p.jenisItems.map((j) =>
                                            j.temp_id === jenisItemTempId
                                                ? {
                                                      ...j,
                                                      items: j.items.filter(
                                                          (i) =>
                                                              i.temp_id !==
                                                              itemTempId,
                                                      ),
                                                  }
                                                : j,
                                        ),
                                    }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    const updateItemInRuangan = (
        ruanganTempId: number,
        produkTempId: number,
        jenisItemTempId: number,
        itemTempId: number,
        field: string,
        value: any,
    ) => {
        setRuangans(
            ruangans.map((r) =>
                r.temp_id === ruanganTempId
                    ? {
                          ...r,
                          produks: r.produks.map((p) =>
                              p.temp_id === produkTempId
                                  ? {
                                        ...p,
                                        jenisItems: p.jenisItems.map((j) =>
                                            j.temp_id === jenisItemTempId
                                                ? {
                                                      ...j,
                                                      items: j.items.map((i) =>
                                                          i.temp_id ===
                                                          itemTempId
                                                              ? {
                                                                    ...i,
                                                                    [field]:
                                                                        value,
                                                                }
                                                              : i,
                                                      ),
                                                  }
                                                : j,
                                        ),
                                    }
                                  : p,
                          ),
                      }
                    : r,
            ),
        );
    };

    // ============ Submit ============
    const handleSubmit = (e: FormEvent, status: 'draft' | 'published') => {
        e.preventDefault();

        // Flatten ruangans into produks array
        const allProduks: any[] = [];
        ruangans.forEach((ruangan) => {
            ruangan.produks.forEach((p) => {
                allProduks.push({
                    id: p.id,
                    produk_id: parseInt(p.produk_id.toString()),
                    nama_ruangan: ruangan.nama_ruangan || null,
                    quantity: p.quantity,
                    panjang: p.panjang
                        ? parseFloat(p.panjang.toString())
                        : null,
                    lebar: p.lebar ? parseFloat(p.lebar.toString()) : null,
                    tinggi: p.tinggi ? parseFloat(p.tinggi.toString()) : null,
                    bahan_bakus: p.selected_bahan_bakus || [],
                    jenisItems: p.jenisItems
                        .filter(
                            (j) =>
                                j.jenis_item_name?.toLowerCase() !==
                                'bahan baku',
                        )
                        .map((j) => {
                            const isAksesoris =
                                j.jenis_item_name?.toLowerCase() ===
                                'aksesoris';
                            return {
                                id: j.id,
                                jenis_item_id: parseInt(
                                    j.jenis_item_id.toString(),
                                ),
                                items: j.items.map((i) => ({
                                    id: i.id,
                                    item_id: parseInt(i.item_id.toString()),
                                    quantity: isAksesoris ? i.quantity : 1,
                                    notes: i.notes || null,
                                })),
                            };
                        }),
                });
            });
        });

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

        setLoading(true);

        router.put(
            `/item-pekerjaan/${itemPekerjaan.id}/update`,
            {
                status: status,
                produks: allProduks,
            },
            {
                preserveState: false, // ← TAMBAHKAN INI
                preserveScroll: true,
                onSuccess: () => {
                    // Tidak perlu setLoading(false) karena akan redirect
                },
                onError: (errors) => {
                    console.error(errors);
                    alert('Gagal update data');
                    setLoading(false);
                },
            },
        );
    };

    // ============ Count total produks ============
    const totalProduks = ruangans.reduce((acc, r) => acc + r.produks.length, 0);

    return (
        <>
            <Head title="Edit Item Pekerjaan" />

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
                                    Edit Item Pekerjaan
                                </h1>
                                <p className="mt-1 text-slate-500">
                                    {itemPekerjaan.moodboard.order.nama_project}{' '}
                                    •{' '}
                                    {itemPekerjaan.moodboard.order.company_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add Ruangan Button */}
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                <svg
                                    className="h-5 w-5 text-blue-600"
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
                            Daftar Ruangan
                            <span className="text-sm font-normal text-slate-500">
                                ({ruangans.length} ruangan, {totalProduks}{' '}
                                produk)
                            </span>
                        </h2>
                        <button
                            type="button"
                            onClick={addRuangan}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
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

                    {/* Empty State */}
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
                            {ruangans.map((ruangan, rIndex) => (
                                <RuanganCard
                                    key={ruangan.temp_id}
                                    ruangan={ruangan}
                                    ruanganIndex={rIndex}
                                    produks={produks}
                                    jenisItems={jenisItems}
                                    items={items}
                                    onUpdateRuanganName={updateRuanganName}
                                    onRemoveRuangan={removeRuangan}
                                    onAddProdukToRuangan={addProdukToRuangan}
                                    onRemoveProdukFromRuangan={
                                        removeProdukFromRuangan
                                    }
                                    onUpdateProdukInRuangan={
                                        updateProdukInRuangan
                                    }
                                    onToggleBahanBakuInRuangan={
                                        toggleBahanBakuInRuangan
                                    }
                                    onSelectAllBahanBakuInRuangan={
                                        selectAllBahanBakuInRuangan
                                    }
                                    onClearAllBahanBakuInRuangan={
                                        clearAllBahanBakuInRuangan
                                    }
                                    onAddJenisItemInRuangan={
                                        addJenisItemInRuangan
                                    }
                                    onRemoveJenisItemInRuangan={
                                        removeJenisItemInRuangan
                                    }
                                    onUpdateJenisItemInRuangan={
                                        updateJenisItemInRuangan
                                    }
                                    onAddItemInRuangan={addItemInRuangan}
                                    onRemoveItemInRuangan={removeItemInRuangan}
                                    onUpdateItemInRuangan={updateItemInRuangan}
                                />
                            ))}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="mt-8 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.visit('/item-pekerjaan')}
                            className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'draft')}
                            disabled={loading || totalProduks === 0}
                            className="flex items-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-6 py-3 font-medium text-amber-700 transition-all hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
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
                            disabled={loading || totalProduks === 0}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
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
        </>
    );
}
