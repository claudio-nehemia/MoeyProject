export type StageMap = Record<string, number>;

export type StageEvidence = {
    id: number;
    evidence_path: string;
    notes: string | null;
    uploaded_by: string;
    created_at: string;
};

export type WorkplanItem = {
    id: number | null;
    nama_tahapan: string;
    start_date: string | null;
    end_date: string | null;
    duration_days: number | null;
    status: string;
    catatan: string | null;
    urutan: number;
};

export type Produk = {
    id: number;
    nama_produk: string;
    nama_ruangan: string | null;
    quantity: number;
    dimensi: string;
    total_harga: number;
    progress: number;
    current_stage?: string | null;
    weight_percentage: number;
    actual_contribution: number;
    can_report_defect: boolean;
    has_active_defect: boolean;
    has_pending_approval: boolean;
    defect_id: number | null;
    is_completed: boolean;
    stage_evidences: Record<string, StageEvidence[]>;
    workplan_items: WorkplanItem[];
};

export type PaymentStep = {
    step: number;
    text: string;
    persentase: number;
    nominal: number;
    status: 'locked' | 'available' | 'pending' | 'paid' | 'waiting_bast';
    can_pay: boolean;
    is_last_step: boolean;
    locked_reason: string | null;
    invoice: {
        id: number;
        invoice_number: string;
        total_amount: number;
        status: string;
        paid_at: string | null;
    } | null;
};

export type PaymentInfo = {
    termin_nama: string;
    total_steps: number;
    unlocked_step: number;
    last_paid_step: number;
    harga_kontrak: number;
    sisa_pembayaran: number;
    total_paid: number;
    remaining: number;
    is_fully_paid: boolean;
    can_unlock_next: boolean;
    next_step_to_unlock: number | null;
    steps: PaymentStep[];
} | null;

export type PengajuanPerpanjangan = {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | 'none';
    reason: string | null;
};

export type Item = {
    id: number;
    produks: Produk[];
    progress: number;
    total_harga: number;
    workplan_start_date: string | null;
    workplan_end_date: string | null;
    workplan_duration: number | null;
    payment_info: PaymentInfo;
    is_completed: boolean;
    has_bast: boolean;
    bast_number: string | null;
    bast_date: string | null;
    bast_pdf_path: string | null;
    has_bast_foto_klien: boolean;
    bast_foto_klien: string | null;
    bast_foto_klien_uploaded_at: string | null;
    pengajuan_perpanjangan: PengajuanPerpanjangan | null;
};

export type Order = {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    progress: number;
    item_pekerjaans: Item[];
};

export type KontrakInfo = {
    id: number;
    durasi_kontrak: number;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    sisa_hari: number | null;
    deadline_status: 'overdue' | 'urgent' | 'warning' | 'normal' | null;
} | null;

export type QcCounts = {
    finishing_qc: number;
    install_qc: number;
};
