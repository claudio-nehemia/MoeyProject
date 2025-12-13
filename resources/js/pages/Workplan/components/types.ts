export interface WorkplanItem {
    id: number | null;
    nama_tahapan: string;
    start_date: string | null;
    end_date: string | null;
    duration_days: number | null;
    urutan: number;
    status: 'planned' | 'in_progress' | 'done' | 'cancelled';
    catatan: string | null;
}

export interface Produk {
    id: number;
    nama_produk: string;
    nama_ruangan: string;
    quantity: number;
    dimensi: string;
    workplan_items: WorkplanItem[];
}

export interface Kontrak {
    durasi_kontrak: number;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
}

export interface ItemPekerjaan {
    id: number;
    nama_item: string;
    workplan_start_date: string | null;
    workplan_end_date: string | null;
    kontrak: Kontrak | null;
    produks: Produk[];
}

export interface RuanganData {
    nama_ruangan: string;
    produks: ProdukData[];
    // Timeline per ruangan untuk setiap tahapan
    timeline: {
        [tahapan: string]: {
            start_date: string | null;
            end_date: string | null;
        };
    };
}

export interface ProdukData {
    id: number;
    nama_produk: string;
    nama_ruangan: string;
    quantity: number;
    dimensi: string;
    workplan_items: WorkplanItem[];
}

export interface ItemPekerjaanData {
    id: number;
    nama_item: string;
    workplan_start_date: string;
    workplan_end_date: string;
    max_days: number;
    kontrak: Kontrak | null;
    ruangans: RuanganData[];
}

export interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

export const DEFAULT_TAHAPAN = [
    'Potong',
    'Rangkai',
    'Finishing',
    'Finishing QC',
    'Packing',
    'Pengiriman',
    'Trap',
    'Install',
    'Install QC',
];

export const getDefaultWorkplanItems = (): WorkplanItem[] => DEFAULT_TAHAPAN.map((tahapan, index) => ({
    id: null,
    nama_tahapan: tahapan,
    start_date: null,
    end_date: null,
    duration_days: null,
    urutan: index + 1,
    status: 'planned' as const,
    catatan: null,
}));

export const getDefaultRuanganTimeline = () => {
    const timeline: { [tahapan: string]: { start_date: string | null; end_date: string | null } } = {};
    DEFAULT_TAHAPAN.forEach(tahapan => {
        timeline[tahapan] = { start_date: null, end_date: null };
    });
    return timeline;
};

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
        default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
};

export const calculateMaxDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
};

export const calculateTotalDays = (items: WorkplanItem[]): number => {
    return items.reduce((total, item) => total + (item.duration_days || 0), 0);
};
