import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import CustomerNavbar from '@/components/CustomerNavbar';
import {
    Calendar,
    CreditCard,
    Palette,
    Ruler,
    Wrench,
    FileText,
    CheckCircle2,
    Clock,
    FileCheck,
    Receipt,
    Sparkles,
    Image as ImageIcon,
    Download,
    ExternalLink
} from 'lucide-react';

/* ================= TYPES ================= */

interface FileItem {
    id: number;
    name: string;
    url: string;
    is_pdf?: boolean;
}

interface EvidenceItem {
    stage: string;
    notes: string | null;
    url: string;
    uploaded_at: string;
}

interface ProductItem {
    id: number;
    nama_produk: string;
    nama_ruangan: string;
    quantity: number;
    current_stage: string;
    progress: number;
    is_completed: boolean;
    evidences: EvidenceItem[];
}

interface DefectRepairItem {
    id: number;
    notes: string;
    photo_url: string;
    is_approved: boolean;
    repaired_at: string | null;
}

interface DefectDetailItem {
    id: number;
    notes: string;
    photo_url: string;
    repairs: DefectRepairItem[];
}

interface DefectGroup {
    id: number;
    product_name: string;
    qc_stage: string;
    status: string;
    reported_at: string | null;
    items: DefectDetailItem[];
}

interface OrderDetail {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
    nomor_unit?: string;
    alamat: string;
    tanggal_masuk: string;
    tahapan_proyek: string;
    project_status: string;
    progress: number;
    commitment_fee: {
        total_fee: number;
        payment_status: string;
        payment_proof: string | null;
        verified_at: string | null;
    };
    moodboard: {
        status: string;
        notes: string | null;
        revisi_final: string | null;
        kasar_files: FileItem[];
        final_files: FileItem[];
    };
    gambar_kerja: {
        status: string;
        approved_by: string | null;
        approved_time: string | null;
        files: FileItem[];
    };
    timeline: {
        progress: number;
        tahapan_proyek: string;
        produks: ProductItem[];
        standard_stages: string[];
    };
    defects: DefectGroup[];
    bast: {
        has_bast: boolean;
        bast_number: string | null;
        bast_date: string | null;
        bast_foto_klien: string | null;
        item_pekerjaan_id: number | null;
        download_url: string | null;
    };
}

interface OrderSummary {
    id: number;
    nama_project: string;
    company_name: string;
    customer_name: string;
}

interface Props {
    hasOrders: boolean;
    ordersList: OrderSummary[];
    selectedOrder: OrderDetail | null;
    customer: {
        name: string;
        email: string;
    };
}

export default function CustomerPortal({
    hasOrders,
    ordersList,
    selectedOrder,
    customer,
}: Props) {
    const [activeTab, setActiveTab] = useState<
        'timeline' | 'cf' | 'moodboard' | 'gambarkerja' | 'defect' | 'bast'
    >('timeline');

    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    const formatCurrency = (val: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const handleSelectProject = (orderId: number) => {
        router.visit(`/customer/portal?order_id=${orderId}`, { preserveState: false });
    };

    if (!hasOrders || !selectedOrder) {
        return (
            <div className="min-h-screen bg-stone-50">
                <CustomerNavbar
                    customerName={customer.name}
                    customerEmail={customer.email}
                    ordersList={[]}
                />
                <div className="pt-28 pb-12 max-w-md mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-sm">
                        📁
                    </div>
                    <h2 className="text-xl font-bold text-stone-900 font-serif">Belum Ada Proyek Tertaut</h2>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                        Akun Anda ({customer.email}) belum ditautkan ke proyek aktif di sistem Moey Living. Silakan hubungi tim Customer Service atau Project Manager kami untuk menghubungkan proyek Anda.
                    </p>
                </div>
            </div>
        );
    }

    const {
        nama_project,
        company_name,
        nomor_unit,
        alamat,
        progress,
        tahapan_proyek,
        commitment_fee,
        moodboard,
        gambar_kerja,
        timeline,
        defects,
        bast,
    } = selectedOrder;

    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-800">
            <Head title={`Client Portal — ${nama_project}`} />

            {/* Custom Luxury Navbar */}
            <CustomerNavbar
                customerName={customer.name}
                customerEmail={customer.email}
                ordersList={ordersList}
                selectedOrderId={selectedOrder.id}
                onSelectOrder={handleSelectProject}
            />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
                {/* Hero Project Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Tahap: {tahapan_proyek.replace('_', ' ')}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
                                {nama_project}
                            </h1>
                            <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                                {company_name} {nomor_unit ? `• Unit: ${nomor_unit}` : ''} • {alamat}
                            </p>
                        </div>

                        {/* Progress Meter */}
                        <div className="bg-stone-800/80 backdrop-blur border border-stone-700/60 rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 min-w-[240px]">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-16 h-16 transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        className="text-stone-700"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        strokeDasharray={175.9}
                                        strokeDashoffset={175.9 - (175.9 * (progress || 0)) / 100}
                                        strokeLinecap="round"
                                        className="text-amber-400 transition-all duration-1000 ease-out"
                                        fill="transparent"
                                    />
                                </svg>
                                <span className="absolute text-sm font-bold font-mono text-white">
                                    {Math.round(progress || 0)}%
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
                                    Status Pengerjaan
                                </span>
                                <span className="text-sm font-bold text-white block mt-0.5">
                                    {progress >= 100 ? 'Proyek Selesai' : 'Sedang Berjalan'}
                                </span>
                                <span className="text-[11px] text-stone-400 block mt-0.5">
                                    Moey Living Studio
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6 Modular Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                        { key: 'timeline', label: 'Timeline & Progres', icon: Calendar },
                        { key: 'cf', label: 'Commitment Fee', icon: CreditCard },
                        { key: 'moodboard', label: 'Moodboard & Desain', icon: Palette },
                        { key: 'gambarkerja', label: 'Gambar Kerja', icon: Ruler },
                        { key: 'defect', label: 'Defect & QC', icon: Wrench },
                        { key: 'bast', label: 'Dokumen BAST', icon: FileCheck },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition shadow-sm border ${
                                    activeTab === tab.key
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-amber-600/20'
                                        : 'bg-white text-stone-600 hover:text-stone-900 border-stone-200/80 hover:bg-stone-50'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT 1: TIMELINE & PROGRES */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Milestone Stepper */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif mb-6">
                                Alur Tahapan Produksi & Instalasi
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                                {timeline.standard_stages.map((stage, idx) => {
                                    const isDone = progress >= ((idx + 1) / timeline.standard_stages.length) * 100;
                                    return (
                                        <div key={stage} className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-stone-50 border border-stone-200/60">
                                            <div
                                                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold mb-2 shadow-sm ${
                                                    isDone
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-stone-200 text-stone-500'
                                                }`}
                                            >
                                                {isDone ? '✓' : idx + 1}
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-700 leading-tight">
                                                {stage}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* List of Products & Real-time Progress */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
                                Rincian Item Pengerjaan Ruangan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {timeline.produks.length === 0 ? (
                                    <p className="text-xs text-stone-400 italic">Belum ada item pekerjaan produksi yang diinput.</p>
                                ) : (
                                    timeline.produks.map((p) => (
                                        <div key={p.id} className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                                                        {p.nama_ruangan}
                                                    </span>
                                                    <h4 className="text-sm font-bold text-stone-900">{p.nama_produk}</h4>
                                                    <p className="text-[11px] text-stone-500">Jumlah: {p.quantity} Unit</p>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                    {p.current_stage}
                                                </span>
                                            </div>

                                            {/* Progress Bar Item */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-semibold text-stone-500">
                                                    <span>Progres Item</span>
                                                    <span>{Math.round(p.progress || 0)}%</span>
                                                </div>
                                                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${p.progress || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Stage Evidences / Foto Lapangan */}
                                            {p.evidences.length > 0 && (
                                                <div className="pt-2 border-t border-stone-200/60">
                                                    <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1.5">
                                                        Foto Bukti Pengerjaan Lapangan
                                                    </span>
                                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                        {p.evidences.map((ev, eIdx) => (
                                                            <div
                                                                key={eIdx}
                                                                onClick={() => setPreviewImage({ url: ev.url, title: `${p.nama_produk} - ${ev.stage}` })}
                                                                className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0 cursor-pointer hover:opacity-90 transition group relative"
                                                            >
                                                                <img src={ev.url} alt={ev.stage} className="w-full h-full object-cover" />
                                                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center truncate py-0.5">
                                                                    {ev.stage}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 2: COMMITMENT FEE */}
                {activeTab === 'cf' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Financial Milestone</span>
                            <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Status Commitment Fee</h3>
                            <p className="text-xs text-stone-500 mt-1">Uang komitmen awal untuk memulai perancangan konsep desain dan moodboard.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Nominal Terverifikasi</span>
                                <span className="text-lg font-bold font-mono text-stone-900 mt-1 block">
                                    {commitment_fee.total_fee > 0 ? formatCurrency(commitment_fee.total_fee) : 'Rp 0'}
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Status Pembayaran</span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mt-1 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {commitment_fee.payment_status?.toUpperCase() || 'LUNAS / DITERIMA'}
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tanggal Verifikasi</span>
                                <span className="text-xs font-semibold text-stone-700 mt-1 block">
                                    {commitment_fee.verified_at || selectedOrder.tanggal_masuk || '-'}
                                </span>
                            </div>
                        </div>

                        {commitment_fee.payment_proof && (
                            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                                        <Receipt className="w-5 h-5 text-amber-700" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900">Bukti Pembayaran / Tanda Terima</h4>
                                        <p className="text-[11px] text-stone-500">Tersedia untuk ditinjau secara digital</p>
                                    </div>
                                </div>
                                <a
                                    href={commitment_fee.payment_proof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-sm"
                                >
                                    Lihat Bukti Bayar ↗
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT 3: MOODBOARD & DESAIN */}
                {activeTab === 'moodboard' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Visual Concept</span>
                            <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Konsep Moodboard & Desain 3D</h3>
                            <p className="text-xs text-stone-500 mt-1">Eksplorasi material, palet warna, dan visual render interior untuk ruangan Anda.</p>
                        </div>

                        {/* Desain Final 3D */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Palette className="w-4 h-4 text-amber-600" /> Desain Final & Render 3D ({moodboard.final_files.length} Gambar)
                                </h4>
                            </div>
                            {moodboard.final_files.length === 0 ? (
                                <p className="text-xs text-stone-400 italic p-4 bg-stone-50 rounded-2xl border border-stone-200/50">
                                    Desain final sedang dalam tahap perancangan oleh tim desainer.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {moodboard.final_files.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => setPreviewImage({ url: file.url, title: file.name })}
                                            className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 aspect-video cursor-pointer hover:shadow-md transition"
                                        >
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex items-end">
                                                <span className="text-[10px] text-white font-medium truncate">{file.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Moodboard Kasar */}
                        <div className="space-y-3 pt-4 border-t border-stone-100">
                            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-amber-600" /> Konsep Sketsa Awal & Moodboard Kasar ({moodboard.kasar_files.length} Gambar)
                            </h4>
                            {moodboard.kasar_files.length === 0 ? (
                                <p className="text-xs text-stone-400 italic p-4 bg-stone-50 rounded-2xl border border-stone-200/50">
                                    Belum ada sketsa kasar yang diunggah.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {moodboard.kasar_files.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => setPreviewImage({ url: file.url, title: file.name })}
                                            className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 aspect-video cursor-pointer hover:shadow-md transition"
                                        >
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex items-end">
                                                <span className="text-[10px] text-white font-medium truncate">{file.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT 4: GAMBAR KERJA */}
                {activeTab === 'gambarkerja' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Technical Drawings</span>
                                <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Gambar Kerja Arsitektur & Detail</h3>
                                <p className="text-xs text-stone-500 mt-1">Gambar kerja teknis terukur sebagai acuan produksi pabrikasi.</p>
                            </div>
                            {gambar_kerja.approved_by && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Disetujui oleh: {gambar_kerja.approved_by}</span>
                                </div>
                            )}
                        </div>

                        {gambar_kerja.files.length === 0 ? (
                            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200/60">
                                <Ruler className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                                <p className="text-xs text-stone-500">Gambar kerja sedang dipersiapkan oleh tim drafter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {gambar_kerja.files.map((f) => (
                                    <div key={f.id} className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/50 flex items-center justify-between gap-3 hover:bg-stone-50 transition">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                                                {f.is_pdf ? <FileText className="w-5 h-5 text-indigo-600" /> : <ImageIcon className="w-5 h-5 text-indigo-600" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-stone-900 truncate">{f.name}</p>
                                                <p className="text-[10px] text-stone-400">Dokumen Gambar Kerja</p>
                                            </div>
                                        </div>
                                        <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition shadow-sm whitespace-nowrap"
                                        >
                                            Buka File ↗
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT 5: DEFECT & QC */}
                {activeTab === 'defect' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Quality Assurance</span>
                            <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Laporan Defect & Bukti Perbaikan</h3>
                            <p className="text-xs text-stone-500 mt-1">Monitoring transparansi temuan cacat saat Quality Control (QC) dan foto bukti perbaikannya.</p>
                        </div>

                        {defects.length === 0 ? (
                            <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                <h4 className="text-xs font-bold text-emerald-900">Tidak Ada Defect Ditemukan</h4>
                                <p className="text-[11px] text-emerald-700 mt-0.5">Semua item produk berada dalam standar kualitas mutu tinggi.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {defects.map((d) => (
                                    <div key={d.id} className="p-4 sm:p-5 rounded-2xl border border-stone-200/80 bg-stone-50/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-stone-900">{d.product_name}</h4>
                                                <span className="text-[10px] text-stone-500">Tahap QC: {d.qc_stage}</span>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                                    d.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 border-amber-200'
                                                }`}
                                            >
                                                {d.status === 'completed' ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sudah Diperbaiki
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3 h-3 text-amber-600" /> Dalam Perbaikan
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        {/* Defect items detail */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {d.items.map((item) => (
                                                <div key={item.id} className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                                                    <div className="flex gap-2">
                                                        {/* Before Photo */}
                                                        <div
                                                            onClick={() => setPreviewImage({ url: item.photo_url, title: `Temuan Defect: ${item.notes}` })}
                                                            className="w-16 h-16 rounded-lg overflow-hidden border border-red-200 flex-shrink-0 cursor-pointer relative"
                                                        >
                                                            <img src={item.photo_url} alt="Defect" className="w-full h-full object-cover" />
                                                            <span className="absolute bottom-0 inset-x-0 bg-red-600/80 text-white text-[8px] text-center">
                                                                Temuan
                                                            </span>
                                                        </div>

                                                        {/* Repairs After Photo (if any) */}
                                                        {item.repairs.map((r) => (
                                                            <div
                                                                key={r.id}
                                                                onClick={() => setPreviewImage({ url: r.photo_url, title: `Hasil Perbaikan: ${r.notes}` })}
                                                                className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-200 flex-shrink-0 cursor-pointer relative"
                                                            >
                                                                <img src={r.photo_url} alt="Repair" className="w-full h-full object-cover" />
                                                                <span className="absolute bottom-0 inset-x-0 bg-emerald-600/80 text-white text-[8px] text-center">
                                                                    Hasil
                                                                </span>
                                                            </div>
                                                        ))}

                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-stone-800 line-clamp-2">{item.notes}</p>
                                                            <p className="text-[10px] text-stone-400 mt-1">
                                                                {item.repairs.length > 0 ? 'Sudah ada dokumentasi perbaikan' : 'Menunggu tindakan vendor'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT 6: DOKUMEN BAST */}
                {activeTab === 'bast' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Handover Official</span>
                            <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">Berita Acara Serah Terima (BAST)</h3>
                            <p className="text-xs text-stone-500 mt-1">Dokumen legalitas serah terima hasil pengerjaan proyek kepada klien.</p>
                        </div>

                        {!bast.has_bast ? (
                            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200/60">
                                <FileCheck className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                                <h4 className="text-xs font-bold text-stone-800">BAST Belum Diterbitkan</h4>
                                <p className="text-[11px] text-stone-500 mt-1">Dokumen BAST akan diterbitkan saat seluruh tahapan instalasi dan QC telah selesai 100%.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800">
                                            NOMOR: {bast.bast_number}
                                        </span>
                                        <h4 className="text-sm font-bold text-stone-900">Dokumen BAST Resmi Moey Living</h4>
                                        <p className="text-xs text-stone-500">Tanggal Serah Terima: {bast.bast_date || '-'}</p>
                                    </div>

                                    {bast.download_url && (
                                        <a
                                            href={bast.download_url}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-sm text-center justify-center"
                                        >
                                            📥 Download PDF BAST
                                        </a>
                                    )}
                                </div>

                                {bast.bast_foto_klien && (
                                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                                        <h5 className="text-xs font-bold text-stone-800">Foto Dokumentasi Serah Terima</h5>
                                        <div
                                            onClick={() => setPreviewImage({ url: bast.bast_foto_klien!, title: 'Dokumentasi Serah Terima BAST' })}
                                            className="w-48 h-32 rounded-xl overflow-hidden border border-stone-200 cursor-pointer hover:opacity-90 transition"
                                        >
                                            <img src={bast.bast_foto_klien} alt="BAST Foto" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Lightbox Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold hover:bg-black transition"
                        >
                            ✕
                        </button>
                        <img src={previewImage.url} alt={previewImage.title} className="max-h-[80vh] w-auto mx-auto rounded-2xl object-contain" />
                        <p className="text-xs text-stone-300 text-center py-2 font-medium">{previewImage.title}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
