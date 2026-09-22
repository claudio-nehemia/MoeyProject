import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
    Wallet,
    Briefcase,
    Calendar,
    Settings,
    Zap,
    Megaphone,
    CheckCircle2,
    XCircle,
    BarChart3,
    FileText,
    Star,
    ClipboardList,
    Clock,
    AlertTriangle,
    Gift,
    Target,
    Edit3,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Download,
    RefreshCw,
    Loader2,
    CreditCard,
    Save,
} from 'lucide-react';

interface PayrollSlip {
    id: number;
    nik: string;
    bulan: number;
    tahun: number;
    hari_kerja: number;
    hari_hadir: number;
    capaian_omzet_internal: number;
    capaian_omzet_eksternal: number;
    gaji_pokok: number;
    tunjangan_jabatan: number;
    transportasi: number;
    makan: number;
    kehadiran: number;
    komisi_cf: number;
    komisi_dp: number;
    komisi_pelunasan: number;
    komisi_success_project: number;
    achievement_omzet: number;
    achievement_pelaksanaan: number;
    total_pendapatan_diluar_komisi: number;
    total_pendapatan_cf: number;
    total_pendapatan_komisi_achievement: number;
    kasbon: number;
    total_diterima: number;
    kpi_skor: number | null;
    kpi_status: string | null;
    status: string;
}

interface RunningSalary {
    has_config: boolean;
    hari_hadir: number;
    hari_tepat_waktu?: number;
    hari_terlambat?: number;
    hari_izin?: number;
    hari_sakit?: number;
    hari_alpha?: number;
    perfect_attendance?: boolean;
    hari_kerja_default: number;
    gaji_pokok_berjalan: number;
    tunjangan_jabatan: number;
    transportasi: number;
    makan: number;
    kehadiran: number;
    total_operasional: number;
    omzet_internal: number;
    omzet_eksternal: number;
    total_omzet: number;
    company_omzet_internal?: number;
    target_omzet_dp?: number;
    is_komisi_dp_unlocked?: boolean;
    target_omzet_achievement?: number;
    is_achievement_omzet_unlocked?: boolean;
    min_success_project_persen?: number;
    timeline_score?: number;
    capaian_persen?: number;
    is_success_project_unlocked?: boolean;
    is_tunjangan_unlocked?: boolean;
    tunjangan_min_omzet?: number;
    jumlah_cf: number;
    cf_target?: number;
    komisi_cf: number;
    komisi_dp: number;
    komisi_pelunasan: number;
    komisi_success_project?: number;
    achievement_omzet: number;
    achievement_pelaksanaan?: number;
    kasbon: number;
    total_sementara: number;
}

interface PositionConfig {
    id: number;
    divisi: string;
    jabatan: string;
    gaji_pokok: number;
    cf_per_client: number;
    cf_max_per_bulan?: number;
    min_omzet_komisi_dp: number;
    min_omzet_achievement: number;
    achievement_rate: number;
    achievement_fixed: number;
    min_success_project_persen: number;
    tunjangan_jabatan: number;
    tunjangan_jabatan_min_omzet: number;
}

interface KaryawanRow {
    nik: string;
    nama: string;
    jabatan: string;
    divisi: string;
    config_id: number | null;
    config?: PositionConfig | null;
    slip: PayrollSlip | null;
    has_slip: boolean;
    gaji_sementara?: RunningSalary;
    hari_hadir: number;
    hari_tepat_waktu?: number;
    hari_terlambat?: number;
    hari_izin?: number;
    hari_sakit?: number;
    hari_alpha?: number;
    perfect_attendance?: boolean;
    hari_kerja_default: number;
    kasbon_aktif?: {
        total_kasbon: number;
        cicilan_per_bulan: number;
        sisa_kasbon: number;
    } | null;
}

interface PayrollSettingProps {
    id: number;
    tanggal_gajian: number;
    tipe_hitung: string;
    auto_generate_on_payday: boolean;
    cutoff_tanggal: number;
    catatan: string | null;
}

interface KomposisiCfItem {
    jabatan: string;
    komposisi: number;
    keterangan: string;
}

interface Props {
    data: KaryawanRow[];
    configs: PositionConfig[];
    divisiList: string[];
    setting: PayrollSettingProps;
    bulan: number;
    tahun: number;
    total_company_cf?: number;
    komposisi_cf_table?: KomposisiCfItem[];
    filters: { divisi?: string };
}

const BULAN_LABELS = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value || 0);
};

const kpiStatusColor = (status: string | null) => {
    switch (status) {
        case 'Sangat Baik': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'Baik': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Cukup': return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'Buruk': return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'Sangat Buruk': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
};

export default function Index({ 
    data, 
    configs, 
    divisiList, 
    setting, 
    bulan, 
    tahun, 
    total_company_cf = 0, 
    komposisi_cf_table = [], 
    filters 
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    const [selectedBulan, setSelectedBulan] = useState(bulan);
    const [selectedTahun, setSelectedTahun] = useState(tahun);
    const [filterDivisi, setFilterDivisi] = useState(filters?.divisi || '');
    const [search, setSearch] = useState('');
    const [generating, setGenerating] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [activeTab, setActiveTab] = useState<'monitoring' | 'slip'>('monitoring');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal Komposisi CF Table
    const [cfModalOpen, setCfModalOpen] = useState(false);

    // Reset pagination on filter or tab change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterDivisi, search, activeTab, selectedBulan, selectedTahun]);

    // Modal Atur Tanggal Gajian
    const [settingModalOpen, setSettingModalOpen] = useState(false);
    const [settingSubmitting, setSettingSubmitting] = useState(false);
    const [settingForm, setSettingForm] = useState({
        tanggal_gajian: setting?.tanggal_gajian || 25,
        tipe_hitung: setting?.tipe_hitung || 'tanggal_gajian',
        auto_generate_on_payday: setting?.auto_generate_on_payday ?? true,
        cutoff_tanggal: setting?.cutoff_tanggal || 20,
        catatan: setting?.catatan || '',
    });

    // Modal Input Manual State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [fetchingSystemData, setFetchingSystemData] = useState(false);
    const [fetchingRab, setFetchingRab] = useState(false);
    const [rabDetails, setRabDetails] = useState<{ project_name: string; internal: number; eksternal: number }[]>([]);
    const [editingKaryawan, setEditingKaryawan] = useState<KaryawanRow | null>(null);
    const [formData, setFormData] = useState({
        nik: '',
        config_id: 0,
        hari_kerja: 26,
        hari_hadir: 26,
        capaian_omzet_internal: 0,
        capaian_omzet_eksternal: 0,
        capaian_project_persen: 75,
        jumlah_cf: 0,
        komisi_pelunasan: 0,
        komisi_success_project: 0,
        achievement_pelaksanaan: 0,
        timeline_score: 100,
        kasbon_cicilan: 0,
        kasbon_total: 0,
    });

    const fetchAllSystemData = async () => {
        if (!formData.nik) return;
        setFetchingSystemData(true);
        try {
            const res = await fetch(`/payroll-komisi/system-data/${formData.nik}?bulan=${selectedBulan}&tahun=${selectedTahun}&config_id=${formData.config_id}`);
            const resData = await res.json();
            setFormData(prev => ({
                ...prev,
                hari_kerja: resData.hari_kerja || prev.hari_kerja,
                hari_hadir: resData.hari_hadir ?? prev.hari_hadir,
                capaian_omzet_internal: resData.capaian_omzet_internal ?? 0,
                capaian_omzet_eksternal: resData.capaian_omzet_eksternal ?? 0,
                jumlah_cf: resData.jumlah_cf ?? 0,
                komisi_pelunasan: resData.komisi_pelunasan ?? 0,
                timeline_score: resData.timeline_score ?? 100,
                kasbon_cicilan: resData.kasbon_cicilan ?? 0,
                kasbon_total: resData.kasbon_total ?? 0,
            }));
            if (resData.rab_details) {
                setRabDetails(resData.rab_details);
            }
        } catch (e) {
            console.error('Failed to fetch system data', e);
        } finally {
            setFetchingSystemData(false);
        }
    };

    const fetchRabInternalOmzet = async () => {
        if (!formData.nik) return;
        setFetchingRab(true);
        try {
            const res = await fetch(`/payroll-komisi/rab-omzet/${formData.nik}?bulan=${selectedBulan}&tahun=${selectedTahun}`);
            const resData = await res.json();
            setFormData(prev => ({
                ...prev,
                capaian_omzet_internal: resData.internal || 0,
                capaian_omzet_eksternal: resData.eksternal || 0,
            }));
            if (resData.details) {
                setRabDetails(resData.details);
            }
        } catch (e) {
            console.error('Failed to fetch RAB omzet', e);
        } finally {
            setFetchingRab(false);
        }
    };

    const { flash } = usePage().props as any;

    const handleFilter = () => {
        router.get('/payroll-komisi', {
            bulan: selectedBulan,
            tahun: selectedTahun,
            divisi: filterDivisi || undefined,
        }, { preserveState: true });
    };

    const handleGenerateAll = () => {
        if (!confirm(`Hitung slip resmi akhir bulan untuk seluruh karyawan pada periode ${BULAN_LABELS[selectedBulan]} ${selectedTahun}?`)) return;
        setGenerating(true);
        router.post('/payroll-komisi/generate', {
            bulan: selectedBulan,
            tahun: selectedTahun,
        }, {
            onFinish: () => setGenerating(false),
        });
    };

    const handleReleaseAll = () => {
        if (!confirm(`Release seluruh slip gaji resmi untuk periode ${BULAN_LABELS[selectedBulan]} ${selectedTahun}? Slip gaji akan dipublikasikan secara resmi ke seluruh karyawan.`)) return;
        setReleasing(true);
        router.post('/payroll-komisi/release', {
            bulan: selectedBulan,
            tahun: selectedTahun,
        }, {
            onFinish: () => setReleasing(false),
        });
    };

    const handleReleaseSingle = (slipId: number, nama: string) => {
        if (!confirm(`Release slip gaji resmi untuk ${nama}?`)) return;
        router.post(`/payroll-komisi/release/${slipId}`);
    };

    const handleSaveSetting = (e: React.FormEvent) => {
        e.preventDefault();
        setSettingSubmitting(true);
        router.post('/payroll-komisi/setting', settingForm, {
            onSuccess: () => setSettingModalOpen(false),
            onFinish: () => setSettingSubmitting(false),
        });
    };

    const openEditModal = (row: KaryawanRow) => {
        setEditingKaryawan(row);
        const slip = row.slip;
        const configId = row.config_id || configs[0]?.id || 0;
        setRabDetails([]);

        if (slip) {
            setFormData({
                nik: row.nik,
                config_id: configId,
                hari_kerja: slip.hari_kerja,
                hari_hadir: slip.hari_hadir,
                capaian_omzet_internal: slip.capaian_omzet_internal,
                capaian_omzet_eksternal: slip.capaian_omzet_eksternal,
                capaian_project_persen: 75,
                jumlah_cf: slip.komisi_cf > 0 ? 4 : 0,
                komisi_pelunasan: slip.komisi_pelunasan,
                komisi_success_project: slip.komisi_success_project,
                achievement_pelaksanaan: slip.achievement_pelaksanaan,
                timeline_score: 100,
                kasbon_cicilan: slip.kasbon,
                kasbon_total: row.kasbon_aktif ? row.kasbon_aktif.total_kasbon : slip.kasbon,
            });
        } else {
            const run = row.gaji_sementara;
            setFormData({
                nik: row.nik,
                config_id: configId,
                hari_kerja: run?.hari_kerja_default || 26,
                hari_hadir: run?.hari_hadir || row.hari_hadir || 26,
                capaian_omzet_internal: run?.omzet_internal || 0,
                capaian_omzet_eksternal: run?.omzet_eksternal || 0,
                capaian_project_persen: run?.timeline_score ?? run?.capaian_persen ?? 75,
                jumlah_cf: run?.jumlah_cf || 0,
                komisi_pelunasan: run?.komisi_pelunasan || 0,
                komisi_success_project: run?.komisi_success_project || 0,
                achievement_pelaksanaan: run?.achievement_pelaksanaan || 0,
                timeline_score: 100,
                kasbon_cicilan: row.kasbon_aktif ? row.kasbon_aktif.cicilan_per_bulan : 0,
                kasbon_total: row.kasbon_aktif ? row.kasbon_aktif.total_kasbon : 0,
            });
        }
        setModalOpen(true);
    };

    const handleSaveSingle = (e: React.FormEvent) => {
        e.preventDefault();
        setModalSubmitting(true);
        router.post('/payroll-komisi/generate-single', {
            nik: formData.nik,
            bulan: selectedBulan,
            tahun: selectedTahun,
            config_id: formData.config_id,
            hari_kerja: Number(formData.hari_kerja),
            hari_hadir: Number(formData.hari_hadir),
            capaian_omzet_internal: Number(formData.capaian_omzet_internal),
            capaian_omzet_eksternal: Number(formData.capaian_omzet_eksternal),
            capaian_project_persen: Number(formData.capaian_project_persen),
            jumlah_cf: Number(formData.jumlah_cf),
            komisi_pelunasan: Number(formData.komisi_pelunasan),
            komisi_success_project: Number(formData.komisi_success_project),
            achievement_pelaksanaan: Number(formData.achievement_pelaksanaan),
            timeline_score: Number(formData.timeline_score),
            kasbon_cicilan: Number(formData.kasbon_cicilan),
            kasbon_total: Number(formData.kasbon_total),
        }, {
            onSuccess: () => {
                setModalOpen(false);
            },
            onFinish: () => setModalSubmitting(false),
        });
    };

    // Filter data
    const filteredData = data.filter(row => {
        const matchDivisi = !filterDivisi || row.divisi === filterDivisi;
        const matchSearch = !search ||
            row.nama.toLowerCase().includes(search.toLowerCase()) ||
            row.nik.toLowerCase().includes(search.toLowerCase()) ||
            row.jabatan.toLowerCase().includes(search.toLowerCase());
        return matchDivisi && matchSearch;
    });

    // Pagination calculation
    const totalItems = filteredData.length;
    const totalPages = perPage === -1 ? 1 : Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = perPage === -1 ? 0 : (safePage - 1) * perPage;
    const endIndex = perPage === -1 ? totalItems : Math.min(startIndex + perPage, totalItems);
    const paginatedData = perPage === -1 ? filteredData : filteredData.slice(startIndex, endIndex);

    // Summary stats
    const totalKaryawan = filteredData.length;
    const totalGenerated = filteredData.filter(r => r.has_slip).length;
    const totalGajiFinal = filteredData.reduce((sum, r) => sum + (r.slip?.total_diterima || 0), 0);
    const totalGajiSementara = filteredData.reduce((sum, r) => sum + (r.gaji_sementara?.total_sementara || 0), 0);
    const totalHariHadir = filteredData.reduce((sum, r) => sum + (r.hari_hadir || 0), 0);

    return (
        <>
            <Head title="Payroll Komisi & Achievement" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="payroll-komisi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20 space-y-6">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-sm">
                                    <Wallet className="w-5 h-5 text-white" />
                                </span>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        Payroll Komisi & Achievement
                                    </h1>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Sistem penggajian berbasis Divisi → Jabatan, Komisi, dan Achievement
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCfModalOpen(true)}
                                className="px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                                title="Lihat Komposisi CF Rp 5.000.000 per client per jabatan"
                            >
                                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                <span>Komposisi CF (Rp 5 Jt / Client)</span>
                                {total_company_cf > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                        {total_company_cf} Deal
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingModalOpen(true)}
                                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                            >
                                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                <span>Atur Tanggal Gajian: <b>Tgl {setting?.tanggal_gajian || 25}</b></span>
                            </button>
                            <a
                                href="/payroll-komisi/config"
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Konfigurasi 11 Jabatan</span>
                            </a>
                        </div>
                    </div>

                    {/* Schedule & Monitoring Banner */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <span>Jadwal Penggajian Rutin: Tanggal {setting?.tanggal_gajian || 25} Setiap Bulan</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-full border border-blue-200">
                                        Cutoff: Tgl {setting?.cutoff_tanggal || 20}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 flex items-center flex-wrap gap-1">
                                    {setting?.auto_generate_on_payday ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Otomatis di-generate sistem setiap tanggal gajian.
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                                            <Settings className="w-3.5 h-3.5 text-gray-500" /> Perhitungan final di-trigger manual di akhir bulan.
                                        </span>
                                    )}
                                    {' '}Setiap harinya Anda dapat memonitor <span className="font-semibold text-blue-900">Gaji Sementara (Berjalan)</span> yang terhubung langsung dengan kehadiran absensi & progress RAB.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                            <button
                                type="button"
                                onClick={handleGenerateAll}
                                disabled={generating}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Menghitung...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5" />
                                        <span>Hitung Final Slip Akhir Bulan</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReleaseAll}
                                disabled={releasing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                            >
                                {releasing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Merilis...</span>
                                    </>
                                ) : (
                                    <>
                                        <Megaphone className="w-3.5 h-3.5" />
                                        <span>Release Semua Slip Gaji</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-3 border-b border-gray-200 pb-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('monitoring')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                activeTab === 'monitoring'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Mode Monitoring: Gaji Berjalan (Harian s/d Hari Ini)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'monitoring' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                Realtime Presensi
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('slip')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                activeTab === 'slip'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Mode Slip Resmi: Slip Akhir Bulan (Final)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'slip' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                {totalGenerated} Terhitung
                            </span>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <div className="text-xs text-gray-500 font-medium">Total Karyawan Aktif</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{totalKaryawan}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">Semua divisi terdaftar</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <div className="text-xs text-gray-500 font-medium">Kehadiran (Presensi)</div>
                            <div className="text-2xl font-bold text-indigo-600 mt-1">{totalHariHadir} Hari</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">Tercatat di tabel presensi</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <div className="text-xs text-gray-500 font-medium">Estimasi Gaji Sementara</div>
                            <div className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalGajiSementara)}</div>
                            <div className="text-[11px] text-blue-600 mt-0.5">Berjalan s/d hari ini</div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                            <div className="text-xs text-gray-500 font-medium">Slip Final Resmi</div>
                            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalGajiFinal)}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{totalGenerated} slip tersimpan</div>
                        </div>
                    </div>

                    {/* Filters & Actions Bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Bulan</label>
                                <select
                                    value={selectedBulan}
                                    onChange={(e) => setSelectedBulan(Number(e.target.value))}
                                    className="rounded-xl border-gray-300 text-xs font-medium focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {BULAN_LABELS.slice(1).map((label, i) => (
                                        <option key={i + 1} value={i + 1}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tahun</label>
                                <select
                                    value={selectedTahun}
                                    onChange={(e) => setSelectedTahun(Number(e.target.value))}
                                    className="rounded-xl border-gray-300 text-xs font-medium focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {[2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Divisi</label>
                                <select
                                    value={filterDivisi}
                                    onChange={(e) => setFilterDivisi(e.target.value)}
                                    className="rounded-xl border-gray-300 text-xs font-medium focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Semua Divisi</option>
                                    {divisiList.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Cari Karyawan</label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Ketik nama, NIK, atau jabatan..."
                                    className="w-full rounded-xl border-gray-300 text-xs focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={handleFilter}
                                className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs hover:bg-gray-700 transition font-semibold shadow-sm"
                            >
                                Filter
                            </button>
                        </div>
                    </div>

                    {/* Master Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    {activeTab === 'monitoring' ? (
                                        <>
                                            <BarChart3 className="w-4 h-4 text-blue-600" />
                                            <span>Tabel Monitoring Gaji Sementara (Berjalan)</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4 text-emerald-600" />
                                            <span>Tabel Slip Gaji Resmi (Final)</span>
                                        </>
                                    )}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                    Periode: {BULAN_LABELS[selectedBulan]} {selectedTahun} ({filteredData.length} Karyawan)
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                                Geser horizontal jika tabel melebihi layar
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
                                        <th className="px-3 py-3 text-center w-10">No</th>
                                        <th className="px-3 py-3 min-w-[170px]">Karyawan</th>
                                        <th className="px-3 py-3 min-w-[140px]">Jabatan & Divisi</th>
                                        <th className="px-3 py-3 text-center min-w-[120px]">Absensi (Presensi)</th>
                                        <th className="px-3 py-3 min-w-[220px]">Target & Syarat Bonus Jabatan</th>
                                        <th className="px-3 py-3 text-right min-w-[110px]">Gaji Pokok</th>
                                        <th className="px-3 py-3 text-right min-w-[100px]">Tunjangan</th>
                                        <th className="px-3 py-3 text-right min-w-[120px]">Operasional</th>
                                        <th className="px-3 py-3 text-right min-w-[90px]">CF</th>
                                        <th className="px-3 py-3 text-right min-w-[110px]">Komisi DP</th>
                                        <th className="px-3 py-3 text-right min-w-[100px]">Pelunasan</th>
                                        <th className="px-3 py-3 text-right min-w-[110px]">Achievement</th>
                                        <th className="px-3 py-3 text-right min-w-[90px]">Kasbon</th>
                                        <th className="px-3 py-3 text-right min-w-[130px]">
                                            {activeTab === 'monitoring' ? 'THP Sementara' : 'Total THP Final'}
                                        </th>
                                        <th className="px-3 py-3 text-center min-w-[90px]">KPI</th>
                                        <th className="px-3 py-3 text-center min-w-[110px]">Status</th>
                                        <th className="px-3 py-3 text-center min-w-[140px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={17} className="px-4 py-12 text-center text-gray-400">
                                                Tidak ada data karyawan
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, i) => {
                                            const run = row.gaji_sementara;
                                            const slip = row.slip;
                                            const isMonitoring = activeTab === 'monitoring';
                                            const cfg = row.config || configs.find(c => c.id === row.config_id);

                                            const displayPokok = isMonitoring ? (run?.gaji_pokok_berjalan || 0) : (slip?.gaji_pokok || 0);
                                            const displayTunjangan = isMonitoring ? (run?.tunjangan_jabatan || 0) : (slip?.tunjangan_jabatan || 0);
                                            const displayOperasional = isMonitoring ? (run?.total_operasional || 0) : ((slip?.transportasi || 0) + (slip?.makan || 0) + (slip?.kehadiran || 0));
                                            const displayCF = isMonitoring ? (run?.komisi_cf || 0) : (slip?.komisi_cf || 0);
                                            const displayDP = isMonitoring ? (run?.komisi_dp || 0) : (slip?.komisi_dp || 0);
                                            const displayPelunasan = isMonitoring ? (run?.komisi_pelunasan || 0) : (slip?.komisi_pelunasan || 0);
                                            const displayAch = isMonitoring 
                                                ? ((run?.achievement_omzet || 0) + (run?.achievement_pelaksanaan || 0)) 
                                                : ((slip?.achievement_omzet || 0) + (slip?.achievement_pelaksanaan || 0));
                                            const displayKasbon = isMonitoring ? (run?.kasbon || 0) : (slip?.kasbon || 0);
                                            const displayTHP = isMonitoring ? (run?.total_sementara || 0) : (slip?.total_diterima || 0);

                                            return (
                                                <tr
                                                    key={row.nik}
                                                    className="hover:bg-blue-50/50 transition font-medium"
                                                >
                                                    <td className="px-3 py-3 text-center text-gray-400 font-mono">{startIndex + i + 1}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="font-bold text-gray-900">{row.nama}</div>
                                                        <div className="text-[11px] text-gray-400 font-mono">{row.nik}</div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="text-gray-800 font-semibold">{row.jabatan}</div>
                                                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            {row.divisi}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                (row.hari_hadir || 0) >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {row.hari_hadir || 0} / {row.hari_kerja_default || 26} Hari
                                                            </span>
                                                            {row.perfect_attendance && (
                                                                <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline" title="Kehadiran Sempurna (0 Telat & 0 Alpa)" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-center gap-1 mt-1 text-[9px] font-mono">
                                                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold inline-flex items-center gap-1" title="Total Hari Izin (Izin Absen/Cuti/Dinas/Sakit)">
                                                                <ClipboardList className="w-2.5 h-2.5" /> {(row.hari_izin || 0) + (row.hari_sakit || 0)} Izin
                                                            </span>
                                                            {(row.hari_terlambat || 0) > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold inline-flex items-center gap-1" title="Keterlambatan">
                                                                    <Clock className="w-2.5 h-2.5" /> {row.hari_terlambat} Telat
                                                                </span>
                                                            )}
                                                            {(row.hari_alpha || 0) > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1" title="Alpa / Mangkir">
                                                                    <AlertTriangle className="w-2.5 h-2.5" /> {row.hari_alpha} Alpa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-emerald-600 mt-0.5 font-mono flex items-center justify-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Terhubung Presensi
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="space-y-1 text-[10px]">
                                                            {/* 1. Komisi DP */}
                                                            {(cfg?.min_omzet_komisi_dp || 0) > 0 && (
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="text-gray-500">Komisi DP:</span>
                                                                    {run?.is_komisi_dp_unlocked ? (
                                                                        <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Cair (Min: {formatCurrency(cfg?.min_omzet_komisi_dp || 0)})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.2 rounded text-gray-500 bg-gray-100 border border-gray-200">
                                                                            Min: {formatCurrency(cfg?.min_omzet_komisi_dp || 0)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 2. Achievement Omzet */}
                                                            {(cfg?.min_omzet_achievement || 0) > 0 && (
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="text-gray-500">Ach. Omzet:</span>
                                                                    {run?.is_achievement_omzet_unlocked ? (
                                                                        <span className="px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-1">
                                                                            <Gift className="w-2.5 h-2.5 text-purple-600" /> Bonus Aktif
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.2 rounded text-gray-500 bg-gray-100 border border-gray-200">
                                                                            Min: {formatCurrency(cfg?.min_omzet_achievement || 0)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 3. Success Project */}
                                                            {(cfg?.min_success_project_persen || 0) > 0 && (
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="text-gray-500">Proyek:</span>
                                                                    {run?.is_success_project_unlocked ? (
                                                                        <span className="px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                                                                            <Target className="w-2.5 h-2.5 text-blue-600" /> {run?.timeline_score || 100}% (Syarat {cfg?.min_success_project_persen}%)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.2 rounded text-amber-700 bg-amber-50 border border-amber-200 inline-flex items-center gap-1">
                                                                            <BarChart3 className="w-2.5 h-2.5 text-amber-600" /> {run?.timeline_score || 0}% / Min: {cfg?.min_success_project_persen}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 4. Tunjangan Jabatan */}
                                                            {(cfg?.tunjangan_jabatan || 0) > 0 && (
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="text-gray-500">Tunj. Jabatan:</span>
                                                                    {run?.is_tunjangan_unlocked ? (
                                                                        <span className="px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                                                            <Briefcase className="w-2.5 h-2.5 text-amber-600" /> Aktif
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-1.5 py-0.2 rounded text-gray-400 bg-gray-50 border border-gray-200">
                                                                            Omzet Persh. &ge; 900 Jt
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono text-gray-900">{formatCurrency(displayPokok)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-gray-900">{formatCurrency(displayTunjangan)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-gray-900">
                                                        <div>{formatCurrency(displayOperasional)}</div>
                                                        <div className="text-[10px] text-gray-400">Mkn/Trn/Hdr</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono text-blue-700">
                                                        <div className="font-bold">{formatCurrency(displayCF)}</div>
                                                        {(cfg?.cf_per_client || 0) > 0 ? (
                                                            <div className="text-[10px] text-gray-500 font-sans">
                                                                {run?.jumlah_cf || (slip?.komisi_cf ? Math.round(slip.komisi_cf / (cfg?.cf_per_client || 1)) : 0)} Deal × {formatCurrency(cfg?.cf_per_client || 0)}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-400 font-sans">-</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono text-purple-700">{formatCurrency(displayDP)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-purple-700">{formatCurrency(displayPelunasan)}</td>
                                                    <td className="px-3 py-3 text-right font-mono text-emerald-700">
                                                        <div>{formatCurrency(displayAch)}</div>
                                                        {displayAch > 0 && (
                                                            <div className="text-[10px] text-emerald-600 font-sans font-semibold">Bonus Aktif</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono text-red-600">
                                                        {displayKasbon > 0 ? `-${formatCurrency(displayKasbon)}` : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                                                        <div className="text-sm">{formatCurrency(displayTHP)}</div>
                                                        <div className="text-[10px] text-gray-400 font-normal">
                                                            {isMonitoring ? 'Sementara Berjalan' : (row.has_slip ? 'Slip Final' : 'Belum Dihitung')}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {slip?.kpi_status ? (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${kpiStatusColor(slip.kpi_status)}`}>
                                                                {slip.kpi_status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-[11px]">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {row.has_slip && row.slip?.status === 'final' ? (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Released
                                                            </span>
                                                        ) : row.has_slip ? (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Draft
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                                                                <BarChart3 className="w-3 h-3 text-blue-600" /> Monitoring
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(row)}
                                                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                                                                title="Edit input manual dan penyesuaian"
                                                            >
                                                                <Edit3 className="w-3 h-3" /> Input
                                                            </button>
                                                            {row.has_slip && row.slip?.status === 'draft' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReleaseSingle(row.slip!.id, row.nama)}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs inline-flex items-center gap-1"
                                                                    title="Release resmi slip gaji karyawan ini"
                                                                >
                                                                    <Megaphone className="w-3 h-3" /> Release
                                                                </button>
                                                            )}
                                                            {row.has_slip && (
                                                                <a
                                                                    href={`/payroll-komisi/detail/${slip?.id}`}
                                                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                                                                >
                                                                    <FileText className="w-3 h-3" /> Slip
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="text-gray-500 font-medium">
                                Menampilkan <span className="font-bold text-gray-800">{totalItems === 0 ? 0 : startIndex + 1}</span> - <span className="font-bold text-gray-800">{endIndex}</span> dari <span className="font-bold text-gray-800">{totalItems}</span> karyawan
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Per halaman:</span>
                                    <select
                                        value={perPage}
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="rounded-lg border-gray-300 py-1 text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={-1}>Semua</option>
                                    </select>
                                </div>

                                {perPage !== -1 && totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={safePage === 1}
                                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition inline-flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
                                        </button>

                                        {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                            .reduce((acc: (number | string)[], p, idx, arr) => {
                                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                                    acc.push('...');
                                                }
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((p, idx) => (
                                                p === '...' ? (
                                                    <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setCurrentPage(p as number)}
                                                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold border transition ${
                                                            safePage === p 
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            ))}

                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={safePage === totalPages}
                                            className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition inline-flex items-center gap-1"
                                        >
                                            Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal Atur Tanggal Gajian */}
                    {settingModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fadeInUp">
                                <form onSubmit={handleSaveSetting}>
                                    <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-base flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-200" />
                                                Pengaturan Tanggal Gajian
                                            </h3>
                                            <p className="text-xs text-blue-200 mt-0.5">Konfigurasi jadwal penggajian rutin sistem</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettingModalOpen(false)}
                                            className="text-gray-300 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-4 text-xs">
                                        <div>
                                            <label className="block font-bold text-gray-700 mb-1 uppercase">
                                                Tanggal Gajian Setiap Bulan (1 - 31)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={31}
                                                required
                                                value={settingForm.tanggal_gajian}
                                                onChange={(e) => setSettingForm({ ...settingForm, tanggal_gajian: Number(e.target.value) })}
                                                className="w-full rounded-xl border-gray-300 text-sm font-bold text-blue-900"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Contoh: Tanggal 25 (sistem akan otomatis menghitung slip final pada tanggal ini)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-gray-700 mb-1 uppercase">
                                                Tanggal Cutoff Data (Presensi & Omzet)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={31}
                                                required
                                                value={settingForm.cutoff_tanggal}
                                                onChange={(e) => setSettingForm({ ...settingForm, cutoff_tanggal: Number(e.target.value) })}
                                                className="w-full rounded-xl border-gray-300 text-sm font-bold text-blue-900"
                                            />
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Batas akhir penarikan data absensi & closing RAB bulan berjalan.
                                            </p>
                                        </div>

                                        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settingForm.auto_generate_on_payday}
                                                    onChange={(e) => setSettingForm({ ...settingForm, auto_generate_on_payday: e.target.checked })}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="font-bold text-gray-800">
                                                    Otomatis Hitung & Rilis pada Tanggal Gajian
                                                </span>
                                            </label>
                                            <p className="text-[11px] text-gray-500 pl-6">
                                                Jika dicentang, sistem otomatis memfinalkan dan merilis slip gaji tepat pada tanggal yang ditentukan. Sebelum tanggal tersebut, seluruh angka tetap dapat dimonitor sebagai gaji sementara berjalan.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-gray-700 mb-1 uppercase">
                                                Catatan / Keterangan
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={settingForm.catatan}
                                                onChange={(e) => setSettingForm({ ...settingForm, catatan: e.target.value })}
                                                placeholder="Kebijakan penggajian..."
                                                className="w-full rounded-xl border-gray-300 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSettingModalOpen(false)}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={settingSubmitting}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow"
                                        >
                                            {settingSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Modal Komposisi Commitment Fee (CF) per Jabatan */}
                    {cfModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fadeInUp">
                                <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-base flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-white" />
                                            <span>Tabel Komposisi Commitment Fee (CF) Per Jabatan</span>
                                        </h3>
                                        <p className="text-xs text-blue-100 mt-0.5">
                                            Sesuai sheet Excel "Simulasi Komposisi Pendapatan Moey" (Baris 48 - 59)
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCfModalOpen(false)}
                                        className="text-white/80 hover:text-white text-xl font-bold p-1"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                                        <div className="font-bold text-sm">Ketentuan Resmi Alokasi Commitment Fee:</div>
                                        <p className="text-gray-700 leading-relaxed">
                                            Setiap closing deal client Commitment Fee (CF) bernilai <b>Rp 5.000.000</b>. 
                                            Komposisi fee tersebut dibagi ke masing-masing <b>JABATAN</b> yang terlibat dalam penanganan awal client (bukan perorangan order).
                                        </p>
                                        <div className="pt-1 flex items-center gap-2 font-semibold">
                                            <span className="inline-flex items-center gap-1.5">
                                                <BarChart3 className="w-4 h-4 text-blue-600" />
                                                <span>Total Deal CF Perusahaan Bulan Ini:</span>
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full font-mono text-[11px] font-bold">
                                                {total_company_cf} Deal Client Completed
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
                                                    <th className="px-3 py-2.5 text-center w-12">No</th>
                                                    <th className="px-3 py-2.5">Jabatan / Alokasi</th>
                                                    <th className="px-3 py-2.5 text-right">Porsi CF / Deal</th>
                                                    <th className="px-3 py-2.5">Keterangan Fungsi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(komposisi_cf_table.length > 0 ? komposisi_cf_table : [
                                                    { jabatan: 'Designer', komposisi: 1000000, keterangan: 'Komisi Desain per Client CF' },
                                                    { jabatan: 'Manager Design', komposisi: 500000, keterangan: 'Supervisi Desain per Client CF' },
                                                    { jabatan: 'Marketing', komposisi: 1000000, keterangan: 'Closing Sales per Client CF' },
                                                    { jabatan: 'Digital Marketing', komposisi: 500000, keterangan: 'Lead Gen per Client CF' },
                                                    { jabatan: 'Estimator', komposisi: 450000, keterangan: 'Estimasi Budget per Client CF' },
                                                    { jabatan: 'Surveyor', komposisi: 250000, keterangan: 'Survey Lapangan per Client CF' },
                                                    { jabatan: 'Admin (Finance & Legal)', komposisi: 100000, keterangan: 'Administrasi & Legal per Client CF' },
                                                    { jabatan: 'Drafter', komposisi: 200000, keterangan: 'Drafting Gambar Kerja per Client CF' },
                                                    { jabatan: 'Operasional + Transport', komposisi: 1000000, keterangan: 'Alokasi Operasional Kantor' },
                                                ]).map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                                        <td className="px-3 py-2 font-bold text-gray-900">{item.jabatan}</td>
                                                        <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">
                                                            {formatCurrency(item.komposisi)}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 text-[11px]">{item.keterangan}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
                                                    <td colSpan={2} className="px-3 py-2.5 text-right uppercase tracking-wider">
                                                        Total Pool CF per Client:
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-emerald-700 text-sm">
                                                        {formatCurrency(5000000)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-500 text-[11px]">100% Alokasi</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setCfModalOpen(false)}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Input Manual */}
                    {modalOpen && editingKaryawan && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                <form onSubmit={handleSaveSingle}>
                                    <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center sticky top-0 z-10">
                                        <div>
                                            <h3 className="font-bold text-base flex items-center gap-2">
                                                <Edit3 className="w-4 h-4" />
                                                <span>Input Manual & Variabel Penggajian</span>
                                            </h3>
                                            <p className="text-xs text-gray-300 mt-0.5">
                                                {editingKaryawan.nama} ({editingKaryawan.nik}) — {BULAN_LABELS[selectedBulan]} {selectedTahun}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="text-gray-300 hover:text-white text-lg font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-5 text-xs">
                                        {/* Otomatisasi Sistem Banner */}
                                        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                            <div>
                                                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                                                    <Zap className="w-4 h-4 text-blue-600" />
                                                    <span>Terhubung Langsung dengan Sistem</span>
                                                </div>
                                                <p className="text-[11px] text-blue-700 mt-0.5">
                                                    Tarik otomatis kehadiran (Presensi), omzet (RAB Internal), Commitment Fee (CF), invoice pelunasan, dan kasbon.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={fetchAllSystemData}
                                                disabled={fetchingSystemData}
                                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                                            >
                                                {fetchingSystemData ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Mengambil Data...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        <span>Tarik Otomatis Data Sistem</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Pilih Posisi / Jabatan Config */}
                                        <div>
                                            <label className="block font-bold text-gray-700 uppercase mb-1">
                                                Pola Jabatan / Konfigurasi Komisi
                                            </label>
                                            <select
                                                value={formData.config_id}
                                                onChange={(e) => setFormData({ ...formData, config_id: Number(e.target.value) })}
                                                className="w-full rounded-xl border-gray-300 text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {configs.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        [{c.divisi}] {c.jabatan} — Pokok: {formatCurrency(c.gaji_pokok)} | CF: {formatCurrency(c.cf_per_client)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Hari Kerja & Hadir */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                                    Hari Kerja Efektif
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.hari_kerja}
                                                    onChange={(e) => setFormData({ ...formData, hari_kerja: Number(e.target.value) })}
                                                    className="w-full rounded-xl border-gray-300 text-xs font-semibold"
                                                    min={1}
                                                    max={31}
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                                    Hari Hadir (Presensi)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.hari_hadir}
                                                    onChange={(e) => setFormData({ ...formData, hari_hadir: Number(e.target.value) })}
                                                    className="w-full rounded-xl border-gray-300 text-xs font-semibold"
                                                    min={0}
                                                    max={31}
                                                />
                                                <p className="text-[10px] text-gray-400 mt-0.5">Uang makan & transport dihitung dari hari hadir</p>
                                            </div>
                                        </div>

                                        {/* Capaian Omzet */}
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="font-bold text-gray-700 uppercase flex items-center gap-1.5">
                                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                                    <span>Capaian Omzet Bulan Ini (RAB Internal)</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={fetchRabInternalOmzet}
                                                    disabled={fetchingRab}
                                                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {fetchingRab ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Memuat...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-3.5 h-3.5" />
                                                            <span>Tarik dari RAB Internal</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-600 mb-1">Omzet Internal (Rp)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.capaian_omzet_internal}
                                                        onChange={(e) => setFormData({ ...formData, capaian_omzet_internal: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-gray-300 text-xs font-mono"
                                                        step={1000000}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-600 mb-1">Omzet Eksternal (Rp)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.capaian_omzet_eksternal}
                                                        onChange={(e) => setFormData({ ...formData, capaian_omzet_eksternal: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-gray-300 text-xs font-mono"
                                                        step={1000000}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-500 font-medium pt-1">
                                                <span>Total Omzet: <span className="font-mono text-gray-900 font-bold">{formatCurrency(formData.capaian_omzet_internal + formData.capaian_omzet_eksternal)}</span></span>
                                                <span className="text-[11px] text-gray-400">Sumber: produk kategori internal & eksternal di RAB Internal</span>
                                            </div>

                                            {rabDetails.length > 0 && (
                                                <div className="mt-2 p-2.5 bg-white rounded-lg border border-gray-200 space-y-1">
                                                    <div className="font-semibold text-gray-700">Rincian Project RAB Internal:</div>
                                                    {rabDetails.map((det, dIdx) => (
                                                        <div key={dIdx} className="flex justify-between text-gray-600 font-mono text-[11px]">
                                                            <span>• {det.project_name}</span>
                                                            <span>Int: {formatCurrency(det.internal)} | Ext: {formatCurrency(det.eksternal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Reference Target Jabatan di Sheet */}
                                        {(() => {
                                            const activeConfig = configs.find(c => c.id === formData.config_id) || editingKaryawan?.config;
                                            if (!activeConfig) return null;
                                            return (
                                                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-[11px]">
                                                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                                        <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                                                        <span>Target & Ketentuan Jabatan {activeConfig.jabatan} ({activeConfig.divisi}):</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-700">
                                                        <div className="bg-white p-2 rounded border border-amber-100">
                                                            <div className="text-[10px] text-gray-400">Min. Omzet DP:</div>
                                                            <div className="font-bold font-mono text-gray-900">{formatCurrency(activeConfig.min_omzet_komisi_dp || 0)}</div>
                                                        </div>
                                                        <div className="bg-white p-2 rounded border border-amber-100">
                                                            <div className="text-[10px] text-gray-400">Min. Omzet Ach.:</div>
                                                            <div className="font-bold font-mono text-gray-900">{formatCurrency(activeConfig.min_omzet_achievement || 0)}</div>
                                                        </div>
                                                        <div className="bg-white p-2 rounded border border-amber-100">
                                                            <div className="text-[10px] text-gray-400">Min. Success Proyek:</div>
                                                            <div className="font-bold font-mono text-blue-700">{activeConfig.min_success_project_persen || 50}%</div>
                                                        </div>
                                                        <div className="bg-white p-2 rounded border border-amber-100">
                                                            <div className="text-[10px] text-gray-400">Tunj. Min Omzet:</div>
                                                            <div className="font-bold font-mono text-amber-800">{formatCurrency(activeConfig.tunjangan_jabatan_min_omzet || 900000000)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Capaian Kinerja / Progress Proyek (%) */}
                                        {(() => {
                                            const activeConfig = configs.find(c => c.id === formData.config_id) || editingKaryawan?.config;
                                            const reqPersen = activeConfig?.min_success_project_persen || 50;
                                            const isMet = formData.capaian_project_persen >= reqPersen;

                                            return (
                                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                                        <label className="block font-bold text-gray-800 uppercase flex items-center gap-1.5">
                                                            <Target className="w-4 h-4 text-blue-600" />
                                                            <span>Capaian Kinerja / Progress Proyek (%)</span>
                                                        </label>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, capaian_project_persen: reqPersen })}
                                                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                            >
                                                                Set Syarat Jabatan ({reqPersen}%)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, capaian_project_persen: 100 })}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                                            >
                                                                Set 100%
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={formData.capaian_project_persen}
                                                        onChange={(e) => setFormData({ ...formData, capaian_project_persen: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-gray-300 text-xs font-mono font-bold text-blue-900"
                                                    />
                                                    {isMet ? (
                                                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                                            <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                            <span>Capaian ({formData.capaian_project_persen}%) memenuhi syarat minimal jabatan ({reqPersen}%) — Komisi & bonus pelaksanaan proyek aktif!</span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] text-gray-500">
                                                            Syarat minimal jabatan ini: <span className="font-bold text-blue-900">{reqPersen}%</span> untuk membuka komisi & bonus pelaksanaan proyek.
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* CF & Komisi Pelunasan */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                {(() => {
                                                    const activeConfig = configs.find(c => c.id === formData.config_id) || editingKaryawan?.config;
                                                    const cfRate = activeConfig?.cf_per_client || 0;
                                                    return (
                                                        <>
                                                            <label className="block font-bold text-gray-700 uppercase mb-1">
                                                                Jumlah Deal CF (Porsi Jabatan: {formatCurrency(cfRate)} / Deal)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={formData.jumlah_cf}
                                                                onChange={(e) => setFormData({ ...formData, jumlah_cf: Number(e.target.value) })}
                                                                className="w-full rounded-xl border-gray-300 text-xs font-mono font-bold text-blue-900"
                                                                min={0}
                                                            />
                                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                                Komposisi CF per jabatan dari pool deal Rp 5 Jt. Total CF: <span className="font-mono font-bold text-blue-700">{formatCurrency(formData.jumlah_cf * cfRate)}</span>
                                                            </p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div>
                                                <label className="block font-bold text-gray-700 uppercase mb-1">
                                                    Komisi Pelunasan (Rp)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.komisi_pelunasan}
                                                    onChange={(e) => setFormData({ ...formData, komisi_pelunasan: Number(e.target.value) })}
                                                    className="w-full rounded-xl border-gray-300 text-xs font-mono"
                                                    step={100000}
                                                />
                                                <p className="text-[10px] text-gray-400 mt-0.5">Dari invoice pelunasan project</p>
                                            </div>
                                        </div>

                                        {/* Kasbon & Timeline */}
                                        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                                            <div className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                                                <CreditCard className="w-4 h-4 text-amber-800" />
                                                <span>Kasbon & Pemotongan Pinjaman</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-600 mb-1">Cicilan Kasbon Bulan Ini (Rp)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.kasbon_cicilan}
                                                        onChange={(e) => setFormData({ ...formData, kasbon_cicilan: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-gray-300 text-xs font-mono"
                                                        step={100000}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-600 mb-1">Total Saldo Pinjaman (Rp)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.kasbon_total}
                                                        onChange={(e) => setFormData({ ...formData, kasbon_total: Number(e.target.value) })}
                                                        className="w-full rounded-xl border-gray-300 text-xs font-mono"
                                                        step={500000}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 z-10">
                                        <button
                                            type="button"
                                            onClick={() => setModalOpen(false)}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={modalSubmitting}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow disabled:opacity-50 inline-flex items-center gap-1.5"
                                        >
                                            {modalSubmitting ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Menyimpan & Menghitung...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    <span>Simpan & Hitung Ulang Slip</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
