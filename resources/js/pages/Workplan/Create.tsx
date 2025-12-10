import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ItemPekerjaanCard } from './components';
import {
    ItemPekerjaan,
    ItemPekerjaanData,
    Order,
    RuanganData,
    ProdukData,
    calculateMaxDays,
    getDefaultWorkplanItems,
    getDefaultRuanganTimeline,
} from './components/types';

interface Props {
    order: Order;
    itemPekerjaans: ItemPekerjaan[];
}

export default function Create({ order, itemPekerjaans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [processing, setProcessing] = useState(false);

    // State untuk data item pekerjaan dengan workplan (grouped by ruangan)
    const [itemPekerjaanData, setItemPekerjaanData] = useState<ItemPekerjaanData[]>([]);

    // Initialize data dari props - group by ruangan
    useEffect(() => {
        const data = itemPekerjaans.map(ip => {
            // Group produks by ruangan
            const ruanganMap = new Map<string, ProdukData[]>();
            
            ip.produks.forEach(p => {
                const ruanganName = p.nama_ruangan || 'Tanpa Ruangan';
                if (!ruanganMap.has(ruanganName)) {
                    ruanganMap.set(ruanganName, []);
                }
                ruanganMap.get(ruanganName)!.push({
                    id: p.id,
                    nama_produk: p.nama_produk,
                    nama_ruangan: p.nama_ruangan,
                    quantity: p.quantity,
                    dimensi: p.dimensi,
                    workplan_items: p.workplan_items && p.workplan_items.length > 0
                        ? p.workplan_items
                        : getDefaultWorkplanItems(),
                });
            });

            // Convert map to array of RuanganData
            const ruangans: RuanganData[] = Array.from(ruanganMap.entries()).map(([nama_ruangan, produks]) => ({
                nama_ruangan,
                produks,
                timeline: getDefaultRuanganTimeline(),
            }));

            return {
                id: ip.id,
                nama_item: ip.nama_item || `Item Pekerjaan #${ip.id}`,
                workplan_start_date: ip.workplan_start_date || '',
                workplan_end_date: ip.workplan_end_date || '',
                max_days: calculateMaxDays(ip.workplan_start_date || '', ip.workplan_end_date || ''),
                kontrak: ip.kontrak,
                ruangans,
            };
        });
        setItemPekerjaanData(data);
    }, [itemPekerjaans]);

    // Update timeline for item pekerjaan
    const updateItemPekerjaanTimeline = (ipId: number, field: 'workplan_start_date' | 'workplan_end_date', value: string) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const updated = { ...ip, [field]: value };
            updated.max_days = calculateMaxDays(
                field === 'workplan_start_date' ? value : ip.workplan_start_date,
                field === 'workplan_end_date' ? value : ip.workplan_end_date
            );
            return updated;
        }));
    };

    // Update ruangan timeline
    const updateRuanganTimeline = (
        ipId: number,
        ruanganIndex: number,
        tahapan: string,
        field: 'start_date' | 'end_date',
        value: string
    ) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const newRuangans = [...ip.ruangans];
            newRuangans[ruanganIndex] = {
                ...newRuangans[ruanganIndex],
                timeline: {
                    ...newRuangans[ruanganIndex].timeline,
                    [tahapan]: {
                        ...newRuangans[ruanganIndex].timeline[tahapan],
                        [field]: value,
                    },
                },
            };

            return { ...ip, ruangans: newRuangans };
        }));
    };

    // Apply ruangan timeline to all produks in that ruangan
    const applyRuanganTimelineToProduks = (ipId: number, ruanganIndex: number, tahapan: string) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const ruangan = ip.ruangans[ruanganIndex];
            const timeline = ruangan.timeline[tahapan];
            if (!timeline.start_date || !timeline.end_date) return ip;

            // Calculate duration
            const duration = calculateMaxDays(timeline.start_date, timeline.end_date);

            const newRuangans = [...ip.ruangans];
            newRuangans[ruanganIndex] = {
                ...ruangan,
                produks: ruangan.produks.map(produk => ({
                    ...produk,
                    workplan_items: produk.workplan_items.map(item => {
                        if (item.nama_tahapan === tahapan) {
                            return {
                                ...item,
                                start_date: timeline.start_date,
                                end_date: timeline.end_date,
                                duration_days: duration,
                            };
                        }
                        return item;
                    }),
                })),
            };

            return { ...ip, ruangans: newRuangans };
        }));
    };

    // Update workplan item
    const updateWorkplanItem = (
        ipId: number,
        ruanganIndex: number,
        produkId: number,
        itemIndex: number,
        field: string,
        value: any
    ) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const newRuangans = ip.ruangans.map((ruangan, rIdx) => {
                if (rIdx !== ruanganIndex) return ruangan;

                return {
                    ...ruangan,
                    produks: ruangan.produks.map(p => {
                        if (p.id !== produkId) return p;

                        const newItems = [...p.workplan_items];
                        newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };

                        // Auto-calculate duration when dates change
                        if (field === 'start_date' || field === 'end_date') {
                            const item = newItems[itemIndex];
                            if (item.start_date && item.end_date) {
                                newItems[itemIndex].duration_days = calculateMaxDays(item.start_date, item.end_date);
                            } else {
                                newItems[itemIndex].duration_days = null;
                            }
                        }

                        return { ...p, workplan_items: newItems };
                    }),
                };
            });

            return { ...ip, ruangans: newRuangans };
        }));
    };

    // Add new workplan item for a produk
    const addWorkplanItem = (ipId: number, ruanganIndex: number, produkId: number) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const newRuangans = ip.ruangans.map((ruangan, rIdx) => {
                if (rIdx !== ruanganIndex) return ruangan;

                return {
                    ...ruangan,
                    produks: ruangan.produks.map(p => {
                        if (p.id !== produkId) return p;

                        const maxUrutan = Math.max(...p.workplan_items.map(i => i.urutan), 0);
                        return {
                            ...p,
                            workplan_items: [
                                ...p.workplan_items,
                                {
                                    id: null,
                                    nama_tahapan: '',
                                    start_date: null,
                                    end_date: null,
                                    duration_days: null,
                                    urutan: maxUrutan + 1,
                                    status: 'planned' as const,
                                    catatan: null,
                                },
                            ],
                        };
                    }),
                };
            });

            return { ...ip, ruangans: newRuangans };
        }));
    };

    // Remove workplan item
    const removeWorkplanItem = (ipId: number, ruanganIndex: number, produkId: number, itemIndex: number) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;

            const newRuangans = ip.ruangans.map((ruangan, rIdx) => {
                if (rIdx !== ruanganIndex) return ruangan;

                return {
                    ...ruangan,
                    produks: ruangan.produks.map(p => {
                        if (p.id !== produkId) return p;

                        const newItems = p.workplan_items.filter((_, i) => i !== itemIndex);
                        // Re-order urutan
                        newItems.forEach((item, idx) => {
                            item.urutan = idx + 1;
                        });
                        return { ...p, workplan_items: newItems };
                    }),
                };
            });

            return { ...ip, ruangans: newRuangans };
        }));
    };

    // Validate form before submit
    const validateForm = (): boolean => {
        for (const ip of itemPekerjaanData) {
            if (!ip.workplan_start_date || !ip.workplan_end_date) {
                alert(`Timeline untuk "${ip.nama_item}" harus diisi!`);
                return false;
            }

            const ipStartDate = new Date(ip.workplan_start_date);
            const ipEndDate = new Date(ip.workplan_end_date);

            for (const ruangan of ip.ruangans) {
                for (const p of ruangan.produks) {
                    for (const item of p.workplan_items) {
                        if (!item.nama_tahapan.trim()) {
                            alert(`Nama tahapan harus diisi untuk produk "${p.nama_produk}" di ruangan "${ruangan.nama_ruangan}"!`);
                            return false;
                        }

                        // Validate dates are within timeline
                        if (item.start_date) {
                            const startDate = new Date(item.start_date);
                            if (startDate < ipStartDate || startDate > ipEndDate) {
                                alert(`Tanggal mulai tahapan "${item.nama_tahapan}" pada produk "${p.nama_produk}" harus dalam rentang timeline project!`);
                                return false;
                            }
                        }
                        if (item.end_date) {
                            const endDate = new Date(item.end_date);
                            if (endDate < ipStartDate || endDate > ipEndDate) {
                                alert(`Tanggal selesai tahapan "${item.nama_tahapan}" pada produk "${p.nama_produk}" harus dalam rentang timeline project!`);
                                return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    };

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setProcessing(true);

        // Flatten ruangans back to produks for submission
        const submitData = {
            item_pekerjaans: itemPekerjaanData.map(ip => ({
                id: ip.id,
                workplan_start_date: ip.workplan_start_date,
                workplan_end_date: ip.workplan_end_date,
                produks: ip.ruangans.flatMap(ruangan =>
                    ruangan.produks.map(p => ({
                        id: p.id,
                        workplan_items: p.workplan_items.map(item => ({
                            id: item.id,
                            nama_tahapan: item.nama_tahapan,
                            start_date: item.start_date,
                            end_date: item.end_date,
                            duration_days: item.duration_days,
                            urutan: item.urutan,
                            status: item.status,
                            catatan: item.catatan,
                        })),
                    }))
                ),
            })),
        };

        router.post(`/workplan/${order.id}`, submitData, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-50">
            <Head title={`Buat Workplan - ${order.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="workplan"
                onClose={() => setSidebarOpen(false)}
            />

            <main className="px-2 pt-12 pb-6 pl-0 transition-all sm:px-4 sm:pl-60">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                        <a href="/workplan" className="hover:text-amber-600">Workplan</a>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-stone-900 font-medium">Buat Workplan</span>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Buat Workplan
                            </h1>
                            <p className="text-sm text-stone-600 mt-1">
                                {order.nama_project} • {order.company_name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Item Pekerjaan List */}
                    <div className="space-y-6">
                        {itemPekerjaanData.map((itemPekerjaan, ipIndex) => (
                            <ItemPekerjaanCard
                                key={itemPekerjaan.id}
                                itemPekerjaan={itemPekerjaan}
                                ipIndex={ipIndex}
                                onUpdateTimeline={updateItemPekerjaanTimeline}
                                onUpdateRuanganTimeline={updateRuanganTimeline}
                                onApplyRuanganTimelineToProduks={applyRuanganTimelineToProduks}
                                onUpdateWorkplanItem={updateWorkplanItem}
                                onAddWorkplanItem={addWorkplanItem}
                                onRemoveWorkplanItem={removeWorkplanItem}
                            />
                        ))}
                    </div>

                    {/* Submit Buttons */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <a
                            href="/workplan"
                            className="rounded-lg border border-stone-300 bg-white px-6 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                        >
                            Batal
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Simpan Workplan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
