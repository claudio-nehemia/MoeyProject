export interface Team {
    id: number;
    name: string;
    role: string;
}

export interface EstimasiFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

export interface MoodboardFile {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
    estimasi_file: EstimasiFile | null;
}

export interface Moodboard {
    id: number;
    moodboard_kasar: string | null;
    moodboard_final: string | null;
    kasar_files: MoodboardFile[];
    final_files: MoodboardFile[];
    response_time: string;
    response_by: string;
    pm_response_time: string | null;
    pm_response_by: string | null;
    status: 'pending' | 'approved' | 'revisi';
    notes: string | null;
    has_estimasi: boolean;
    has_commitment_fee_completed: boolean;
    has_item_pekerjaan: boolean;
}

export interface Order {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    jenis_interior: string;
    tanggal_masuk_customer: string;
    project_status: string;
    moodboard: Moodboard | null;
    team: Team[];
}

export interface TaskResponse {
    id: number;
    order_id: number;
    tahap: string;
    status: string;
    deadline: string | null;
    extend_time: number;
    is_marketing?: number;
    update_data_time?: string | null;
}

export const statusLabelTranslations: Record<string, { label: string; color: string }> = {
    pending: { label: 'Menunggu Review', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    approved: { label: 'Diterima', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    revisi: { label: 'Perlu Revisi', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};
