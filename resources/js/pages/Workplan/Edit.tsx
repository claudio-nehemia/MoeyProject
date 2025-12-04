import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface WorkplanItem {
    id: number | null;
    nama_tahapan: string;
    start_date: string | null;
    end_date: string | null;
    duration_days: number | null;
    urutan: number;
    status: 'planned' | 'in_progress' | 'done' | 'cancelled';
    catatan: string | null;
}

interface Produk {
    id: number;
    nama_produk: string;
    quantity: number;
    dimensi: string;
    workplan_items: WorkplanItem[];
}

interface Kontrak {
    durasi_kontrak: number;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
}

interface ItemPekerjaan {
    id: number;
    nama_item: string;
    workplan_start_date: string | null;
    workplan_end_date: string | null;
    kontrak: Kontrak | null;
    produks: Produk[];
}

interface ItemPekerjaanData {
    id: number;
    nama_item: string;
    workplan_start_date: string;
    workplan_end_date: string;
    max_days: number;
    kontrak: Kontrak | null;
    produks: {
        id: number;
        nama_produk: string;
        quantity: number;
        dimensi: string;
        workplan_items: WorkplanItem[];
    }[];
}

interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Props {
    order: Order;
    itemPekerjaans: ItemPekerjaan[];
}

export default function Edit({ order, itemPekerjaans }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [processing, setProcessing] = useState(false);
    const [expandedItemPekerjaans, setExpandedItemPekerjaans] = useState<number[]>([]);
    const [expandedProduks, setExpandedProduks] = useState<number[]>([]);
    
    // State untuk data item pekerjaan dengan workplan
    const [itemPekerjaanData, setItemPekerjaanData] = useState<ItemPekerjaanData[]>([]);

    const getDefaultWorkplanItems = (): WorkplanItem[] => [
        { id: null, nama_tahapan: 'Potong', start_date: null, end_date: null, duration_days: null, urutan: 1, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Rangkai', start_date: null, end_date: null, duration_days: null, urutan: 2, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Finishing', start_date: null, end_date: null, duration_days: null, urutan: 3, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Finishing QC', start_date: null, end_date: null, duration_days: null, urutan: 4, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Packing', start_date: null, end_date: null, duration_days: null, urutan: 5, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Pengiriman', start_date: null, end_date: null, duration_days: null, urutan: 6, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Trap', start_date: null, end_date: null, duration_days: null, urutan: 7, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Install', start_date: null, end_date: null, duration_days: null, urutan: 8, status: 'planned', catatan: null },
        { id: null, nama_tahapan: 'Install QC', start_date: null, end_date: null, duration_days: null, urutan: 9, status: 'planned', catatan: null },
    ];

    // Calculate max days when timeline changes
    const calculateMaxDays = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    // Initialize data dari props
    useEffect(() => {
        const data = itemPekerjaans.map(ip => ({
            id: ip.id,
            nama_item: ip.nama_item || `Item Pekerjaan #${ip.id}`,
            workplan_start_date: ip.workplan_start_date || '',
            workplan_end_date: ip.workplan_end_date || '',
            max_days: calculateMaxDays(ip.workplan_start_date || '', ip.workplan_end_date || ''),
            kontrak: ip.kontrak,
            produks: ip.produks.map(p => ({
                id: p.id,
                nama_produk: p.nama_produk,
                quantity: p.quantity,
                dimensi: p.dimensi,
                workplan_items: p.workplan_items && p.workplan_items.length > 0 
                    ? p.workplan_items 
                    : getDefaultWorkplanItems(),
            })),
        }));
        setItemPekerjaanData(data);
        
        // Expand item pekerjaan that have timeline set
        const ipWithTimeline = data
            .filter(ip => ip.workplan_start_date && ip.workplan_end_date)
            .map(ip => ip.id);
        setExpandedItemPekerjaans(ipWithTimeline.length > 0 ? ipWithTimeline : (data.length > 0 ? [data[0].id] : []));
        
        // Expand produks that have workplan items
        const produksWithWorkplan = data.flatMap(ip => 
            ip.produks.filter(p => p.workplan_items.some(w => w.start_date || w.end_date)).map(p => p.id)
        );
        setExpandedProduks(produksWithWorkplan);
    }, [itemPekerjaans]);

    // Calculate total days used in workplan items for a produk (for display only)
    const calculateTotalDays = (items: WorkplanItem[]): number => {
        return items.reduce((total, item) => total + (item.duration_days || 0), 0);
    };

    // Calculate overall progress
    const getWorkplanProgress = () => {
        let totalItems = 0;
        let doneItems = 0;
        itemPekerjaanData.forEach(ip => {
            ip.produks.forEach(p => {
                totalItems += p.workplan_items.length;
                doneItems += p.workplan_items.filter(i => i.status === 'done').length;
            });
        });
        return totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    };

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

    // Update workplan item
    const updateWorkplanItem = (ipId: number, produkId: number, itemIndex: number, field: string, value: any) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;
            
            return {
                ...ip,
                produks: ip.produks.map(p => {
                    if (p.id !== produkId) return p;
                    
                    const newItems = [...p.workplan_items];
                    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
                    
                    // Auto-calculate duration when dates change
                    if (field === 'start_date' || field === 'end_date') {
                        const item = newItems[itemIndex];
                        if (item.start_date && item.end_date) {
                            const start = new Date(item.start_date);
                            const end = new Date(item.end_date);
                            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            newItems[itemIndex].duration_days = diff > 0 ? diff : null;
                        } else {
                            newItems[itemIndex].duration_days = null;
                        }
                    }
                    
                    return { ...p, workplan_items: newItems };
                }),
            };
        }));
    };

    // Add new workplan item for a produk
    const addWorkplanItem = (ipId: number, produkId: number) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;
            
            return {
                ...ip,
                produks: ip.produks.map(p => {
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
        }));
    };

    // Remove workplan item
    const removeWorkplanItem = (ipId: number, produkId: number, itemIndex: number) => {
        setItemPekerjaanData(prev => prev.map(ip => {
            if (ip.id !== ipId) return ip;
            
            return {
                ...ip,
                produks: ip.produks.map(p => {
                    if (p.id !== produkId) return p;
                    
                    const newItems = p.workplan_items.filter((_, i) => i !== itemIndex);
                    // Re-order urutan
                    newItems.forEach((item, idx) => {
                        item.urutan = idx + 1;
                    });
                    return { ...p, workplan_items: newItems };
                }),
            };
        }));
    };

    // Toggle expand item pekerjaan
    const toggleExpandItemPekerjaan = (ipId: number) => {
        setExpandedItemPekerjaans(prev => 
            prev.includes(ipId) ? prev.filter(id => id !== ipId) : [...prev, ipId]
        );
    };

    // Toggle expand produk
    const toggleExpandProduk = (produkId: number) => {
        setExpandedProduks(prev => 
            prev.includes(produkId) ? prev.filter(id => id !== produkId) : [...prev, produkId]
        );
    };

    // Expand/collapse all
    const expandAll = () => {
        setExpandedItemPekerjaans(itemPekerjaanData.map(ip => ip.id));
        setExpandedProduks(itemPekerjaanData.flatMap(ip => ip.produks.map(p => p.id)));
    };

    const collapseAll = () => {
        setExpandedItemPekerjaans([]);
        setExpandedProduks([]);
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
            
            for (const p of ip.produks) {
                for (const item of p.workplan_items) {
                    if (!item.nama_tahapan.trim()) {
                        alert(`Nama tahapan harus diisi untuk produk "${p.nama_produk}"!`);
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
        return true;
    };

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setProcessing(true);
        
        router.put(`/workplan/${order.id}`, {
            item_pekerjaans: itemPekerjaanData.map(ip => ({
                id: ip.id,
                workplan_start_date: ip.workplan_start_date,
                workplan_end_date: ip.workplan_end_date,
                produks: ip.produks.map(p => ({
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
                })),
            })),
        }, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-50">
            <Head title={`Edit Workplan - ${order.nama_project}`} />
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
                        <span className="text-stone-900 font-medium">Edit Workplan</span>
                    </div>
                    
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
                                Edit Workplan
                            </h1>
                            <p className="text-sm text-stone-600 mt-1">
                                {order.nama_project} • {order.company_name}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Progress Badge */}
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
                                <p className="text-xs text-amber-600">Progress</p>
                                <p className="text-lg font-bold text-amber-700">{getWorkplanProgress()}%</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={expandAll}
                                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                >
                                    Expand All
                                </button>
                                <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Item Pekerjaan List */}
                    <div className="space-y-6">
                        {itemPekerjaanData.map((itemPekerjaan, ipIndex) => {
                            const isIpExpanded = expandedItemPekerjaans.includes(itemPekerjaan.id);
                            
                            // Calculate progress for this item pekerjaan
                            let totalItems = 0;
                            let doneItems = 0;
                            itemPekerjaan.produks.forEach(p => {
                                totalItems += p.workplan_items.length;
                                doneItems += p.workplan_items.filter(i => i.status === 'done').length;
                            });
                            const ipProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
                            
                            return (
                                <div
                                    key={itemPekerjaan.id}
                                    className="overflow-hidden rounded-xl border bg-white shadow-sm transition-all border-stone-200"
                                >
                                    {/* Item Pekerjaan Header */}
                                    <div
                                        className="flex cursor-pointer items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
                                        onClick={() => toggleExpandItemPekerjaan(itemPekerjaan.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-bold text-white shadow-lg">
                                                {ipIndex + 1}
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-stone-900 text-lg">{itemPekerjaan.nama_item}</h2>
                                                <p className="text-xs text-stone-500">
                                                    {itemPekerjaan.produks.length} produk
                                                    {itemPekerjaan.kontrak && (
                                                        <> • Kontrak: {itemPekerjaan.kontrak.durasi_kontrak} hari</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {/* Progress */}
                                            <div className="hidden sm:block">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all"
                                                            style={{ width: `${ipProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-stone-600">{ipProgress}%</span>
                                                </div>
                                            </div>
                                            
                                            {/* Timeline Summary */}
                                            {itemPekerjaan.workplan_start_date && itemPekerjaan.workplan_end_date && (
                                                <div className="text-right text-xs">
                                                    <p className="font-medium text-stone-900">
                                                        {itemPekerjaan.max_days} hari
                                                    </p>
                                                    <p className="text-stone-500">
                                                        {itemPekerjaan.workplan_start_date} - {itemPekerjaan.workplan_end_date}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <svg
                                                className={`h-6 w-6 text-stone-400 transition-transform ${isIpExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isIpExpanded && (
                                        <div className="border-t border-stone-200 p-4">
                                            {/* Timeline Input for Item Pekerjaan */}
                                            <div className="mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                                                <h3 className="mb-4 flex items-center gap-2 font-bold text-amber-900 text-lg">
                                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Timeline Project
                                                </h3>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-stone-700">
                                                            Tanggal Mulai <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={itemPekerjaan.workplan_start_date}
                                                            onChange={(e) => updateItemPekerjaanTimeline(itemPekerjaan.id, 'workplan_start_date', e.target.value)}
                                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-stone-700">
                                                            Tanggal Selesai <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={itemPekerjaan.workplan_end_date}
                                                            onChange={(e) => updateItemPekerjaanTimeline(itemPekerjaan.id, 'workplan_end_date', e.target.value)}
                                                            min={itemPekerjaan.workplan_start_date}
                                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <div className="w-full rounded-lg bg-white p-3 shadow-sm">
                                                            <p className="text-xs text-stone-500">Total Durasi</p>
                                                            <p className="text-2xl font-bold text-amber-700">
                                                                {itemPekerjaan.max_days > 0 ? `${itemPekerjaan.max_days} hari` : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Produks in this Item Pekerjaan */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-stone-900">📦 Daftar Produk</h4>
                                                
                                                {itemPekerjaan.produks.map((produk, produkIndex) => {
                                                    const isProdukExpanded = expandedProduks.includes(produk.id);
                                                    const produkTotalDays = calculateTotalDays(produk.workplan_items);
                                                    const produkProgress = produk.workplan_items.length > 0
                                                        ? Math.round((produk.workplan_items.filter(i => i.status === 'done').length / produk.workplan_items.length) * 100)
                                                        : 0;
                                                    
                                                    return (
                                                        <div
                                                            key={produk.id}
                                                            className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
                                                        >
                                                            {/* Produk Header */}
                                                            <div
                                                                className="flex cursor-pointer items-center justify-between p-3 hover:bg-stone-100"
                                                                onClick={() => toggleExpandProduk(produk.id)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200 text-sm font-semibold text-stone-600">
                                                                        {ipIndex + 1}.{produkIndex + 1}
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-medium text-stone-900">{produk.nama_produk}</h5>
                                                                        <p className="text-xs text-stone-500">
                                                                            Qty: {produk.quantity} • {produk.dimensi}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-4">
                                                                    {/* Progress */}
                                                                    <div className="hidden sm:flex items-center gap-2">
                                                                        <div className="h-2 w-16 overflow-hidden rounded-full bg-stone-200">
                                                                            <div
                                                                                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all"
                                                                                style={{ width: `${produkProgress}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-semibold text-stone-600">{produkProgress}%</span>
                                                                    </div>
                                                                    
                                                                    <div className="text-right text-xs">
                                                                        <p className="text-stone-500">
                                                                            {produkTotalDays} hari • {produk.workplan_items.length} tahapan
                                                                        </p>
                                                                    </div>
                                                                    <svg
                                                                        className={`h-5 w-5 text-stone-400 transition-transform ${isProdukExpanded ? 'rotate-180' : ''}`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>

                                                            {/* Produk Expanded - Workplan Items */}
                                                            {isProdukExpanded && (
                                                                <div className="border-t border-stone-200 bg-white p-4">
                                                                    <div className="space-y-3">
                                                                        {produk.workplan_items.map((item, itemIndex) => (
                                                                            <div
                                                                                key={itemIndex}
                                                                                className={`rounded-lg border p-4 ${
                                                                                    item.status === 'done' 
                                                                                        ? 'border-emerald-200 bg-emerald-50' 
                                                                                        : item.status === 'in_progress'
                                                                                            ? 'border-blue-200 bg-blue-50'
                                                                                            : 'border-stone-200 bg-stone-50'
                                                                                }`}
                                                                            >
                                                                                <div className="mb-3 flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                                                                                            item.status === 'done' ? 'bg-emerald-500' : 
                                                                                            item.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
                                                                                        }`}>
                                                                                            {item.status === 'done' ? '✓' : item.urutan}
                                                                                        </span>
                                                                                        <span className="text-sm font-medium text-stone-700">Tahapan {item.urutan}</span>
                                                                                    </div>
                                                                                    {produk.workplan_items.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeWorkplanItem(itemPekerjaan.id, produk.id, itemIndex)}
                                                                                            className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                                                                                        >
                                                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                                                                    {/* Nama Tahapan */}
                                                                                    <div className="lg:col-span-2">
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Nama Tahapan</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.nama_tahapan}
                                                                                            onChange={(e) => updateWorkplanItem(itemPekerjaan.id, produk.id, itemIndex, 'nama_tahapan', e.target.value)}
                                                                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                                                            placeholder="Nama tahapan"
                                                                                            required
                                                                                        />
                                                                                    </div>

                                                                                    {/* Start Date */}
                                                                                    <div>
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Mulai</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={item.start_date || ''}
                                                                                            onChange={(e) => updateWorkplanItem(itemPekerjaan.id, produk.id, itemIndex, 'start_date', e.target.value)}
                                                                                            min={itemPekerjaan.workplan_start_date}
                                                                                            max={itemPekerjaan.workplan_end_date}
                                                                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                                                        />
                                                                                    </div>

                                                                                    {/* End Date */}
                                                                                    <div>
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Selesai</label>
                                                                                        <input
                                                                                            type="date"
                                                                                            value={item.end_date || ''}
                                                                                            onChange={(e) => updateWorkplanItem(itemPekerjaan.id, produk.id, itemIndex, 'end_date', e.target.value)}
                                                                                            min={item.start_date || itemPekerjaan.workplan_start_date}
                                                                                            max={itemPekerjaan.workplan_end_date}
                                                                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                                                        />
                                                                                    </div>

                                                                                    {/* Duration (readonly) */}
                                                                                    <div>
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Durasi</label>
                                                                                        <div className="flex h-[38px] items-center justify-center rounded-lg border border-stone-200 bg-stone-100 px-3 text-sm font-semibold text-stone-700">
                                                                                            {item.duration_days ? `${item.duration_days} hari` : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                                    {/* Status */}
                                                                                    <div>
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Status</label>
                                                                                        <select
                                                                                            value={item.status}
                                                                                            onChange={(e) => updateWorkplanItem(itemPekerjaan.id, produk.id, itemIndex, 'status', e.target.value)}
                                                                                            className={`w-full rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor(item.status)}`}
                                                                                        >
                                                                                            <option value="planned">📋 Planned</option>
                                                                                            <option value="in_progress">🔄 In Progress</option>
                                                                                            <option value="done">✅ Done</option>
                                                                                            <option value="cancelled">❌ Cancelled</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    {/* Catatan */}
                                                                                    <div>
                                                                                        <label className="mb-1 block text-xs font-medium text-stone-600">Catatan</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.catatan || ''}
                                                                                            onChange={(e) => updateWorkplanItem(itemPekerjaan.id, produk.id, itemIndex, 'catatan', e.target.value)}
                                                                                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                                                            placeholder="Catatan (opsional)"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Add Tahapan Button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addWorkplanItem(itemPekerjaan.id, produk.id)}
                                                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                                                                    >
                                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                        </svg>
                                                                        Tambah Tahapan
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
