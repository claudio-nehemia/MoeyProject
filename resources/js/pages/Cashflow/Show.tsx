import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface OrderInfo { id: number; nama_project: string; customer_name: string; company_name: string; payment_status: string; tahapan_proyek: string; pm_name: string; }
interface Split { internal: number; fisik: number; eksternal: number; total: number; }
interface Pembayaran { amount_dp?: number; amount_termin?: number; amount_pelunasan?: number; dp: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; termin: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; pelunasan: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; total_diterima: number; sisa_piutang: number; }
interface Spk { internal: number; fisik: number; external: number; internal_fix: number; upgrade_material: number; fisik_fix: number; external_fix: number; saldo_efisiensi_internal: number; saldo_efisiensi_fisik: number; saldo_efisiensi_external: number; total_fix: number; total_saldo_efisiensi: number; }
interface Realisasi { internal: number; fisik: number; external: number; addendum: number; sisa_saldo_internal: number; sisa_saldo_fisik: number; sisa_saldo_external: number; total: number; }
interface FeeTeamItem { label: string; amount: number; }
interface BreakdownItem { label: string; pct: number; base: 'internal_margin' | 'fisik_eksternal' | 'total_kontrak' | 'fixed'; amount?: number; }
interface Margin { target_internal: number; target_fisik: number; target_external: number; total_target: number; pct_internal: number; pct_fisik: number; pct_external: number; pct_total: number; fee_team: number; pct_fee_team: number; fee_team_detail: FeeTeamItem[]; breakdown_items: BreakdownItem[]; sisa_margin: number; pct_sisa_margin: number; }
interface RpkDp { cash_in: number; dp_vendor: number; cadangan_vendor: number; dp_fisik: number; dp_external: number; fee_team_detail: FeeTeamItem[]; breakdown_items: BreakdownItem[]; sisa_cash_sebelum_mgmt: number; management: number; sisa_cash: number; }
interface RpkTermin { cash_in: number; sisa_cash_sebelumnya: number; total_cash: number; termin_vendor: number; material_hutang_vendor: number; termin_fisik: number; termin_external: number; sisa_cash_sebelum_mgmt: number; management: number; sisa_cash: number; }
interface RpkPelunasan { sisa_cash_sebelumnya: number; total_cash: number; pelunasan_vendor: number; material_hutang_vendor: number; pelunasan_fisik: number; pelunasan_external: number; sisa_cash_sebelum_mgmt: number; management: number; addendum_cadangan_gaji: number; pengeluaran_lain_lain: number; }

interface VendorMainEntry {
    id: number;
    label: string;
    persentase: number|null;
    nilai: number;
    pembayaran: number;
    tanggal_pembayaran: string|null;
    flag_af: string|null;
    flag_fb: string|null;
    flag_jw: string|null;
    notes?: string|null;
}
interface MaterialItem {
    id?: number;
    label: string;
    nilai: number;
    pembayaran: number;
    tanggal_inv: string|null;
    tanggal_pembayaran: string|null;
    umur_inv?: number|null;
    flag_af: string|null;
    flag_fb: string|null;
    flag_jw: string|null;
}
interface MaterialGroup {
    name: string;
    items: MaterialItem[];
}
interface ExternalEntry {
    id?: number;
    label: string;
    vendor_name: string;
    nilai: number;
    spk_amount: number;
    tanggal_perencanaan: string|null;
    pembayaran: number;
    tanggal_pembayaran: string|null;
    pembayaran_termin: number;
    tanggal_pembayaran_termin: string|null;
    status_sisa?: number;
    flag_af: string|null;
    flag_fb: string|null;
    flag_jw: string|null;
    flag_af_termin: string|null;
    flag_fb_termin: string|null;
    flag_jw_termin: string|null;
}

interface Props {
    order: OrderInfo;
    split: Split;
    pembayaran: Pembayaran;
    spk: Spk;
    realisasi: Realisasi;
    margin: Margin;
    rpk: { dp: RpkDp; termin: RpkTermin; pelunasan: RpkPelunasan };
    status_project: number;
    vendor_internal: {
        main_entries: VendorMainEntry[];
        material_groups: MaterialGroup[];
        total_material_nilai: number;
        total_material_pembayaran: number;
        status_po: string;
    };
    vendor_fisik: {
        main_entries: VendorMainEntry[];
        material_groups: MaterialGroup[];
        budget_material: number;
        total_material_pembayaran: number;
        sisa_budget: number;
    };
    vendor_external: {
        items: ExternalEntry[];
        addendums: ExternalEntry[];
        pengeluaran_luar: ExternalEntry[];
    };
}

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function Show({
    order, split, pembayaran, spk, realisasi, margin, rpk, status_project,
    vendor_internal, vendor_fisik, vendor_external
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
    const [activeTab, setActiveTab] = useState<'kontrak'|'spk'|'margin'|'rpk'|'vendor_internal'|'vendor_fisik'|'vendor_external'>('kontrak');
    const [newGroupName, setNewGroupName] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [modalTargetType, setModalTargetType] = useState<'internal'|'fisik'>('internal');

    useEffect(() => {
        const h = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    // ──────────────────────────────────────────
    // FORM 1: GENERAL MANUAL ENTRIES
    // ──────────────────────────────────────────
    const generalForm = useForm({
        spk_internal: spk.internal.toString(),
        spk_fisik: spk.fisik.toString(),
        spk_external: spk.external.toString(),
        spk_internal_fix: spk.internal_fix.toString(),
        upgrade_material: spk.upgrade_material.toString(),
        spk_fisik_fix: spk.fisik_fix.toString(),
        spk_external_fix: spk.external_fix.toString(),
        fee_team_items: margin.fee_team_detail.map(item => ({ label: item.label, amount: item.amount })),
        margin_breakdown_items: margin.breakdown_items.map(item => ({ label: item.label, pct: item.pct, base: item.base }))
    });

    // ──────────────────────────────────────────
    // FORM 2: VENDOR TAB ENTRIES (DYNAMIC)
    // ──────────────────────────────────────────
    const vendorForm = useForm({
        pembayaran_vendor_internal: vendor_internal.main_entries,
        material_groups_internal: vendor_internal.material_groups,
        pembayaran_vendor_fisik: vendor_fisik.main_entries,
        material_groups_fisik: vendor_fisik.material_groups,
        external_items: vendor_external.items,
        external_addendums: vendor_external.addendums,
        external_pengeluaran_luar: vendor_external.pengeluaran_luar,
    });

    // ──────────────────────────────────────────
    // REACTIVE CALCULATOR ENGINE (GENERAL FORM)
    // ──────────────────────────────────────────
    const computed = useMemo(() => {
        const spk_internal = parseFloat(generalForm.data.spk_internal) || 0;
        const spk_fisik = parseFloat(generalForm.data.spk_fisik) || 0;
        const spk_external = parseFloat(generalForm.data.spk_external) || 0;

        const spk_internal_fix = parseFloat(generalForm.data.spk_internal_fix) || 0;
        const spk_fisik_fix = parseFloat(generalForm.data.spk_fisik_fix) || 0;
        const spk_external_fix = vendorForm.data.external_items.reduce((sum, item) => sum + (parseFloat(item.spk_amount as any) || 0), 0);

        const total_fix = spk_internal_fix + spk_fisik_fix + spk_external_fix;
        const saldo_efisiensi_internal = spk_internal_fix > 0 ? spk_internal - spk_internal_fix : 0;
        const saldo_efisiensi_fisik = spk_fisik_fix > 0 ? spk_fisik - spk_fisik_fix : 0;
        const saldo_efisiensi_external = spk_external_fix > 0 ? spk_external - spk_external_fix : 0;
        const total_saldo_efisiensi = saldo_efisiensi_internal + saldo_efisiensi_fisik + saldo_efisiensi_external;

        const target_internal = split.internal - spk_internal;
        const target_fisik = split.fisik - spk_fisik;
        const target_external = split.eksternal - spk_external;
        const total_target = target_internal + target_fisik + target_external;

        const pct_internal = split.internal > 0 ? target_internal / split.internal : 0;
        const pct_fisik = split.fisik > 0 ? target_fisik / split.fisik : 0;
        const pct_external = split.eksternal > 0 ? target_external / split.eksternal : 0;
        const pct_total = split.total > 0 ? total_target / split.total : 0;

        const marginBase = (pct_internal <= 0.30) ? target_internal : (0.30 * split.internal);

        let total_breakdown_amount = 0;
        const breakdown_list_computed = generalForm.data.margin_breakdown_items.map(item => {
            let amount = 0;
            const pctVal = parseFloat(item.pct as any) || 0;
            if (item.base === 'internal_margin') {
                amount = marginBase * (pctVal / 100);
            } else if (item.base === 'fisik_eksternal') {
                amount = (split.fisik + split.eksternal) * (pctVal / 100);
            } else if (item.base === 'total_kontrak') {
                amount = split.total * (pctVal / 100);
            } else if (item.base === 'fixed') {
                amount = pctVal;
            }
            const roundedAmount = Math.round(amount);
            total_breakdown_amount += roundedAmount;
            return { ...item, amount: roundedAmount };
        });

        const total_fee_team = generalForm.data.fee_team_items.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
        const pct_fee_team = split.internal > 0 ? (total_fee_team / split.internal) * 100 : 0;

        const sisa_margin = total_target - total_breakdown_amount - total_fee_team;
        const pct_sisa_margin = split.total > 0 ? sisa_margin / split.total : 0;

        return {
            total_fix,
            saldo_efisiensi_internal,
            saldo_efisiensi_fisik,
            saldo_efisiensi_external,
            total_saldo_efisiensi,
            target_internal,
            target_fisik,
            target_external,
            total_target,
            pct_internal,
            pct_fisik,
            pct_external,
            pct_total,
            total_breakdown_amount,
            breakdown_items: breakdown_list_computed,
            total_fee_team,
            pct_fee_team,
            sisa_margin,
            pct_sisa_margin,
        };
    }, [generalForm.data, split]);

    // ──────────────────────────────────────────
    // SUBMIT HANDLERS
    // ──────────────────────────────────────────
    const handleGeneralSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generalForm.post(`/cashflow/${order.id}/manual-entry`, {
            preserveScroll: true,
            onSuccess: () => alert('Konfigurasi cashflow berhasil disimpan')
        });
    };

    const handleVendorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        vendorForm.post(`/cashflow/${order.id}/vendor-entries`, {
            preserveScroll: true,
            onSuccess: () => alert('Rincian detail vendor berhasil disimpan')
        });
    };

    // ──────────────────────────────────────────
    // GENERAL CONFIG EDIT LIST HANDLERS
    // ──────────────────────────────────────────
    const handleAddFeeMember = () => {
        generalForm.setData('fee_team_items', [...generalForm.data.fee_team_items, { label: 'Role Baru', amount: 0 }]);
    };
    const handleRemoveFeeMember = (idx: number) => {
        generalForm.setData('fee_team_items', generalForm.data.fee_team_items.filter((_, i) => i !== idx));
    };
    const handleUpdateFeeMember = (idx: number, key: 'label'|'amount', val: any) => {
        const current = [...generalForm.data.fee_team_items];
        current[idx] = { ...current[idx], [key]: val };
        generalForm.setData('fee_team_items', current);
    };

    const handleAddBreakdownItem = () => {
        generalForm.setData('margin_breakdown_items', [...generalForm.data.margin_breakdown_items, { label: 'Alokasi Baru', pct: 0, base: 'internal_margin' }]);
    };
    const handleRemoveBreakdownItem = (idx: number) => {
        generalForm.setData('margin_breakdown_items', generalForm.data.margin_breakdown_items.filter((_, i) => i !== idx));
    };
    const handleUpdateBreakdownItem = (idx: number, key: 'label'|'pct'|'base', val: any) => {
        const current = [...generalForm.data.margin_breakdown_items];
        current[idx] = { ...current[idx], [key]: val };
        generalForm.setData('margin_breakdown_items', current);
    };

    // ──────────────────────────────────────────
    // VENDOR INTERNAL & FISIK LIST EDIT HANDLERS
    // ──────────────────────────────────────────
    const handleAddMaterialGroup = () => {
        if (!newGroupName.trim()) return;
        const key = modalTargetType === 'internal' ? 'material_groups_internal' : 'material_groups_fisik';
        const current = [...vendorForm.data[key]];
        vendorForm.setData(key, [...current, { name: newGroupName, items: [] }]);
        setNewGroupName('');
        setShowGroupModal(false);
    };

    const handleRemoveMaterialGroup = (type: 'internal'|'fisik', groupIdx: number) => {
        const key = type === 'internal' ? 'material_groups_internal' : 'material_groups_fisik';
        const current = vendorForm.data[key].filter((_, i) => i !== groupIdx);
        vendorForm.setData(key, current);
    };

    const handleAddInvoiceRow = (type: 'internal'|'fisik', groupIdx: number) => {
        const key = type === 'internal' ? 'material_groups_internal' : 'material_groups_fisik';
        const current = [...vendorForm.data[key]];
        current[groupIdx].items.push({
            label: '',
            nilai: 0,
            pembayaran: 0,
            tanggal_inv: null,
            tanggal_pembayaran: null,
            flag_af: null,
            flag_fb: null,
            flag_jw: null,
        });
        vendorForm.setData(key, current);
    };

    const handleRemoveInvoiceRow = (type: 'internal'|'fisik', groupIdx: number, itemIdx: number) => {
        const key = type === 'internal' ? 'material_groups_internal' : 'material_groups_fisik';
        const current = [...vendorForm.data[key]];
        current[groupIdx].items = current[groupIdx].items.filter((_, i) => i !== itemIdx);
        vendorForm.setData(key, current);
    };

    const handleInvoiceCheckboxChange = (type: 'internal'|'fisik', groupIdx: number, itemIdx: number, field: 'flag_af'|'flag_fb'|'flag_jw', checked: boolean) => {
        const val = checked ? '✔' : null;
        handleUpdateInvoiceRow(type, groupIdx, itemIdx, field, val);
    };

    const handleUpdateInvoiceRow = (type: 'internal'|'fisik', groupIdx: number, itemIdx: number, field: keyof MaterialItem, val: any) => {
        const key = type === 'internal' ? 'material_groups_internal' : 'material_groups_fisik';
        const current = [...vendorForm.data[key]];
        current[groupIdx].items[itemIdx] = { ...current[groupIdx].items[itemIdx], [field]: val };
        vendorForm.setData(key, current);
    };

    const handleUpdateMainVendorField = (type: 'internal'|'fisik', idx: number, field: keyof VendorMainEntry, val: any) => {
        const key = type === 'internal' ? 'pembayaran_vendor_internal' : 'pembayaran_vendor_fisik';
        const current = [...vendorForm.data[key]];
        current[idx] = { ...current[idx], [field]: val };
        vendorForm.setData(key, current);
    };

    const handleAddMainPaymentRow = (type: 'internal'|'fisik') => {
        const key = type === 'internal' ? 'pembayaran_vendor_internal' : 'pembayaran_vendor_fisik';
        const current = [...vendorForm.data[key]];
        vendorForm.setData(key, [...current, {
            id: 0, // transient/new
            label: '',
            persentase: 0,
            nilai: 0,
            pembayaran: 0,
            tanggal_pembayaran: null,
            flag_af: null,
            flag_fb: null,
            flag_jw: null,
            notes: 'dp'
        } as any]);
    };

    const handleRemoveMainPaymentRow = (type: 'internal'|'fisik', idx: number) => {
        const key = type === 'internal' ? 'pembayaran_vendor_internal' : 'pembayaran_vendor_fisik';
        const current = vendorForm.data[key].filter((_, i) => i !== idx);
        vendorForm.setData(key, current);
    };

    // ──────────────────────────────────────────
    // VENDOR EXTERNAL HANDLERS
    // ──────────────────────────────────────────
    const handleAddExternalRow = (section: 'items'|'addendums'|'pengeluaran_luar') => {
        const key = section === 'items' ? 'external_items' : section === 'addendums' ? 'external_addendums' : 'external_pengeluaran_luar';
        const current = [...vendorForm.data[key]];
        vendorForm.setData(key, [...current, {
            label: '',
            vendor_name: '',
            nilai: 0,
            spk_amount: 0,
            tanggal_perencanaan: null,
            pembayaran: 0,
            tanggal_pembayaran: null,
            pembayaran_termin: 0,
            tanggal_pembayaran_termin: null,
            flag_af: null,
            flag_fb: null,
            flag_jw: null,
            flag_af_termin: null,
            flag_fb_termin: null,
            flag_jw_termin: null,
        }]);
    };

    const handleRemoveExternalRow = (section: 'items'|'addendums'|'pengeluaran_luar', idx: number) => {
        const key = section === 'items' ? 'external_items' : section === 'addendums' ? 'external_addendums' : 'external_pengeluaran_luar';
        const current = vendorForm.data[key].filter((_, i) => i !== idx);
        vendorForm.setData(key, current);
    };

    const handleUpdateExternalRow = (section: 'items'|'addendums'|'pengeluaran_luar', idx: number, field: keyof ExternalEntry, val: any) => {
        const key = section === 'items' ? 'external_items' : section === 'addendums' ? 'external_addendums' : 'external_pengeluaran_luar';
        const current = [...vendorForm.data[key]];
        current[idx] = { ...current[idx], [field]: val };
        vendorForm.setData(key, current);
    };

    // ──────────────────────────────────────────
    // RENDER HELPERS
    // ──────────────────────────────────────────
    const renderInputCard = (label: string, name: string, icon?: string) => {
        let val = parseFloat((generalForm.data as any)[name]) || 0;
        let isReadOnly = false;

        if (name === 'spk_external_fix') {
            val = vendorForm.data.external_items.reduce((sum, item) => sum + (parseFloat(item.spk_amount as any) || 0), 0);
            isReadOnly = true;
        }

        return (
            <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/10 transition">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{label}</label>
                    {icon && <span className="text-xs text-stone-400">{icon}</span>}
                </div>
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-xs">Rp</span>
                    <input
                        type="number"
                        value={isReadOnly ? val : (generalForm.data as any)[name]}
                        onChange={(e) => !isReadOnly && generalForm.setData(name as any, e.target.value)}
                        readOnly={isReadOnly}
                        className={`w-full pl-8 pr-3 py-1.5 text-right font-mono text-xs font-semibold rounded-lg focus:outline-none focus:ring-0 ${isReadOnly ? 'bg-stone-100/80 text-stone-500 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-700 border-stone-200 focus:border-stone-300'}`}
                        placeholder="0"
                    />
                </div>
                {val > 0 && (
                    <div className="text-[10px] text-stone-400 font-mono text-right mt-1.5">{fmt(val)}</div>
                )}
            </div>
        );
    };

    const pctPayment = split.total > 0 ? (pembayaran.total_diterima / split.total) * 100 : 0;

    return (
        <>
            <Head title={`Cashflow Dashboard — ${order.nama_project}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="cashflow" onClose={() => setSidebarOpen(false)} />

            <div className="p-4 lg:ml-60 min-h-screen bg-stone-50/50">
                <div className="p-2 mt-20 max-w-5xl mx-auto space-y-6">

                    {/* Header Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.visit('/cashflow')} className="p-2 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm">
                                <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-stone-800 tracking-tight">{order.nama_project}</h1>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">{order.payment_status}</span>
                                </div>
                                <p className="text-xs text-stone-500">{order.customer_name} &bull; {order.company_name} &bull; PM: {order.pm_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-medium">Status Akhir:</span>
                            <span className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-mono text-sm font-bold rounded-xl shadow-md shadow-emerald-500/10">
                                {fmt(status_project)}
                            </span>
                        </div>
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Kontrak</p>
                            <h3 className="text-lg font-bold text-stone-800 font-mono mt-1">{fmt(split.total)}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Int: {pct(split.total > 0 ? split.internal / split.total : 0)}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Fis: {pct(split.total > 0 ? split. fisik / split.total : 0)}</span>
                            </div>
                        </div>
                        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Terbayar</p>
                            <h3 className="text-lg font-bold text-emerald-600 font-mono mt-1">{fmt(pembayaran.total_diterima)}</h3>
                            <div className="w-full bg-stone-100 rounded-full h-1.5 mt-3.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(pctPayment, 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sisa Piutang</p>
                            <h3 className="text-lg font-bold text-amber-600 font-mono mt-1">{fmt(pembayaran.sisa_piutang)}</h3>
                            <p className="text-[10px] text-stone-400 mt-2 font-mono">Outstanding: {pct(split.total > 0 ? pembayaran.sisa_piutang / split.total : 0)}</p>
                        </div>
                        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Margin Target</p>
                            <h3 className={`text-lg font-bold font-mono mt-1 ${computed.total_target >= 0 ? 'text-violet-600' : 'text-red-500'}`}>{fmt(computed.total_target)}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-bold mt-2 inline-block">{pct(computed.pct_total)} Target</span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-stone-200 gap-1 overflow-x-auto pb-px">
                        {[
                            { id: 'kontrak', label: 'Kontrak & RPK', color: 'emerald' },
                            { id: 'spk', label: 'SPK & Realisasi', color: 'amber' },
                            { id: 'margin', label: 'Margin & Fee Config', color: 'violet' },
                            { id: 'vendor_internal', label: 'Vendor Internal (Detail)', color: 'rose' },
                            { id: 'vendor_fisik', label: 'Vendor Fisik (Detail)', color: 'blue' },
                            { id: 'vendor_external', label: 'Vendor External (Detail)', color: 'teal' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition border-b-2 -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-amber-500 text-amber-600 bg-amber-50/30'
                                        : 'border-transparent text-stone-500 hover:text-stone-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Alert Reminders Info */}
                    <div className="bg-indigo-50/60 border border-indigo-200/70 p-4 rounded-2xl flex items-start gap-3">
                        <span className="text-lg">⏰</span>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-900">Legal Admin Payment Reminder System</h4>
                            <p className="text-[11px] text-indigo-700/80 mt-1 leading-relaxed">
                                Pengisian kolom tanggal pembayaran di dalam tab **Vendor Detail** otomatis mengirimkan notifikasi pengingat jatuh tempo ke user Legal Admin pada tanggal pembayaran tersebut.
                            </p>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB VIEW: GENERAL FORMS */}
                    {/* ========================================================================= */}
                    {['kontrak', 'spk', 'margin', 'rpk'].includes(activeTab) ? (
                        <form onSubmit={handleGeneralSubmit} className="space-y-6">

                            {/* TAB: KONTRAK & RPK OVERVIEW */}
                            {activeTab === 'kontrak' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50"><h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Pembagian Kontrak</h3></div>
                                            <div className="p-5 space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-stone-100"><span className="text-xs font-semibold text-stone-600">Kontrak Internal</span><span className="text-xs font-mono font-bold text-stone-800">{fmt(split.internal)}</span></div>
                                                <div className="flex justify-between items-center py-2 border-b border-stone-100"><span className="text-xs font-semibold text-stone-600">Kontrak Fisik</span><span className="text-xs font-mono font-bold text-stone-800">{fmt(split.fisik)}</span></div>
                                                <div className="flex justify-between items-center py-2 border-b border-stone-100"><span className="text-xs font-semibold text-stone-600">Kontrak Eksternal</span><span className="text-xs font-mono font-bold text-stone-800">{fmt(split.eksternal)}</span></div>
                                                <div className="flex justify-between items-center pt-2 font-bold text-stone-900"><span className="text-xs">Total Kontrak</span><span className="text-sm font-mono">{fmt(split.total)}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50"><h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Histori Pembayaran Klien</h3></div>
                                            <div className="p-5 space-y-4">
                                                {[
                                                    { label: 'Pembayaran DP', info: pembayaran.dp },
                                                    { label: 'Pembayaran Termin II', info: pembayaran.termin },
                                                    { label: 'Pembayaran Pelunasan', info: pembayaran.pelunasan }
                                                ].map((p, idx) => (
                                                    <div key={idx} className="flex justify-between items-start py-2.5 border-b border-stone-100">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-stone-700">{p.label}</h4>
                                                            <span className="text-[10px] text-stone-400">{p.info.tanggal ? `Lunas: ${new Date(p.info.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}` : 'Belum Lunas'}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-mono font-bold text-stone-800">{fmt(p.info.amount)}</p>
                                                            <span className="text-[10px] text-stone-400 font-mono">Proyeksi ({p.info.pct}%): {fmt(p.info.proyeksi)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RPK Detailed Phases Summary */}
                                    <div className="space-y-6">
                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50"><h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Fase I: Rencana Penggunaan DP</h3></div>
                                            <div className="p-5 space-y-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                    <div className="p-2 border border-stone-150 rounded-lg">DP Vendor Internal: <span className="font-bold block mt-0.5">{fmt(rpk.dp.dp_vendor)}</span></div>
                                                    <div className="p-2 border border-stone-150 rounded-lg">Cadangan Vendor: <span className="font-bold block mt-0.5">{fmt(rpk.dp.cadangan_vendor)}</span></div>
                                                    <div className="p-2 border border-stone-150 rounded-lg">DP Fisik: <span className="font-bold block mt-0.5">{fmt(rpk.dp.dp_fisik)}</span></div>
                                                    <div className="p-2 border border-stone-150 rounded-lg">DP External: <span className="font-bold block mt-0.5">{fmt(rpk.dp.dp_external)}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: SPK & REALISASI */}
                            {activeTab === 'spk' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Estimasi SPK</h3>
                                            {renderInputCard('SPK Internal', 'spk_internal')}
                                            {renderInputCard('SPK Fisik', 'spk_fisik')}
                                            {renderInputCard('SPK External', 'spk_external')}
                                        </div>
                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">SPK Fix / Material</h3>
                                            {renderInputCard('SPK Internal Fix', 'spk_internal_fix')}
                                            {renderInputCard('Upgrade Material', 'upgrade_material')}
                                            {renderInputCard('SPK Fisik Fix', 'spk_fisik_fix')}
                                            {renderInputCard('SPK External Fix', 'spk_external_fix')}
                                        </div>
                                        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Realisasi (Auto Calculated)</h3>
                                            <div className="space-y-3 pt-1">
                                                <div className="p-3 bg-stone-50 border border-stone-200/50 rounded-xl">
                                                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Realisasi Internal</span>
                                                    <span className="text-sm font-mono font-bold text-stone-700 block mt-1">{fmt(realisasi.internal)}</span>
                                                </div>
                                                <div className="p-3 bg-stone-50 border border-stone-200/50 rounded-xl">
                                                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Realisasi Fisik</span>
                                                    <span className="text-sm font-mono font-bold text-stone-700 block mt-1">{fmt(realisasi.fisik)}</span>
                                                </div>
                                                <div className="p-3 bg-stone-50 border border-stone-200/50 rounded-xl">
                                                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Realisasi External</span>
                                                    <span className="text-sm font-mono font-bold text-stone-700 block mt-1">{fmt(realisasi.external)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Efficiency Card */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4">Ringkasan Efisiensi SPK</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi Internal</span>
                                                <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_internal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(computed.saldo_efisiensi_internal)}</span>
                                            </div>
                                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi Fisik</span>
                                                <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_fisik >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(computed.saldo_efisiensi_fisik)}</span>
                                            </div>
                                            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi External</span>
                                                <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_external >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(computed.saldo_efisiensi_external)}</span>
                                            </div>
                                            <div className="bg-stone-800 rounded-xl p-3 text-white">
                                                <span className="text-[10px] text-stone-300 font-bold uppercase block">Total Saldo Efisiensi</span>
                                                <span className="text-sm font-mono font-bold block mt-1">{fmt(computed.total_saldo_efisiensi)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: ESTIMASI MARGIN & BREAKDOWN */}
                            {activeTab === 'margin' && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-6">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-4">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Breakdown Target Margin</h3>
                                            <button type="button" onClick={handleAddBreakdownItem} className="text-xs font-bold text-amber-600 hover:text-amber-700">+ Tambah Alokasi</button>
                                        </div>
                                        <div className="space-y-4">
                                            {generalForm.data.margin_breakdown_items.map((item, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                                                    <input
                                                        type="text"
                                                        value={item.label}
                                                        onChange={(e) => handleUpdateBreakdownItem(idx, 'label', e.target.value)}
                                                        className="w-full sm:w-1/3 px-3 py-1.5 text-xs text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-0 focus:border-stone-300"
                                                        placeholder="Nama Pengeluaran"
                                                    />
                                                    <div className="flex items-center gap-1 w-full sm:w-1/4">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.pct}
                                                            onChange={(e) => handleUpdateBreakdownItem(idx, 'pct', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-1.5 text-xs text-right font-mono text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-xs text-stone-500 font-bold">{item.base === 'fixed' ? 'Rp' : '%'}</span>
                                                    </div>
                                                    <select
                                                        value={item.base}
                                                        onChange={(e) => handleUpdateBreakdownItem(idx, 'base', e.target.value)}
                                                        className="w-full sm:w-1/4 px-2 py-1.5 text-xs text-stone-600 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                                    >
                                                        <option value="internal_margin">Dari Internal Margin</option>
                                                        <option value="fisik_eksternal">Dari Fisik + Eksternal</option>
                                                        <option value="total_kontrak">Dari Total Kontrak</option>
                                                        <option value="fixed">Nominal Tetap (Fixed)</option>
                                                    </select>
                                                    <div className="w-full sm:w-1/6 text-right font-mono font-bold text-xs text-stone-700 px-2">
                                                        {fmt(computed.breakdown_items[idx]?.amount || 0)}
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveBreakdownItem(idx)} className="text-xs text-rose-500 hover:text-rose-600 font-semibold p-1.5 hover:bg-rose-50 rounded-lg">Hapus</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fee Team Card */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-6">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-4">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Fee Team & Individu</h3>
                                            <button type="button" onClick={handleAddFeeMember} className="text-xs font-bold text-amber-600 hover:text-amber-700">+ Tambah Anggota</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {generalForm.data.fee_team_items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                                                    <input
                                                        type="text"
                                                        value={item.label}
                                                        onChange={(e) => handleUpdateFeeMember(idx, 'label', e.target.value)}
                                                        className="w-1/2 px-3 py-1.5 text-xs text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-0"
                                                    />
                                                    <div className="relative w-1/3">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]">Rp</span>
                                                        <input
                                                            type="number"
                                                            value={item.amount}
                                                            onChange={(e) => handleUpdateFeeMember(idx, 'amount', parseFloat(e.target.value) || 0)}
                                                            className="w-full pl-6 pr-2 py-1.5 text-right font-mono text-xs text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none"
                                                        />
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveFeeMember(idx)} className="text-xs text-rose-500 hover:text-rose-600 p-1">Hapus</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save General Footer */}
                            <div className="sticky bottom-4 z-10 flex justify-end bg-white/90 backdrop-blur-sm border border-stone-200/80 p-3 rounded-2xl shadow-lg">
                                <button type="submit" disabled={generalForm.processing} className="bg-amber-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-50">
                                    {generalForm.processing ? 'Menyimpan...' : 'Simpan Data Konfigurasi'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // =========================================================================
                        // TAB VIEW: VENDOR DETAILS (SUBMITS TO VENDOR ROUTE)
                        // =========================================================================
                        <form onSubmit={handleVendorSubmit} className="space-y-6">

                            {/* TAB: VENDOR INTERNAL */}
                            {activeTab === 'vendor_internal' && (
                                <div className="space-y-6">
                                    {/* Main Pembayaran Table */}
                                    {/* Main Pembayaran Table */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">1A. Rincian Pembayaran Vendor Utama</h3>
                                            <button
                                                type="button"
                                                onClick={() => handleAddMainPaymentRow('internal')}
                                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
                                            >
                                                + Tambah Pembayaran Utama
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left text-stone-600">
                                                <thead className="text-[10px] text-stone-400 uppercase bg-stone-50 border-b border-stone-200">
                                                    <tr>
                                                        <th className="px-4 py-2">Keterangan</th>
                                                        <th className="px-4 py-2">Target Fase</th>
                                                        <th className="px-4 py-2 text-right">Persentase (%)</th>
                                                        <th className="px-4 py-2 text-right">Nilai (U)</th>
                                                        <th className="px-4 py-2 text-right">Pembayaran (V)</th>
                                                        <th className="px-4 py-2">Tanggal Pembayaran</th>
                                                        <th className="px-4 py-2 text-center">AF</th>
                                                        <th className="px-4 py-2 text-center">FB</th>
                                                        <th className="px-4 py-2 text-center">JW</th>
                                                        <th className="px-4 py-2 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorForm.data.pembayaran_vendor_internal.map((item, idx) => {
                                                        const spk_internal_fix = parseFloat(generalForm.data.spk_internal_fix) || 0;
                                                        const totalMaterialInternalNilai = vendor_internal.total_material_nilai || 0;

                                                        let calculatedNilai = 0;
                                                        let calculatedPct = parseFloat(item.persentase as any) || 0;

                                                        if (item.notes === 'pelunasan') {
                                                            const sumNonPelunasan = vendorForm.data.pembayaran_vendor_internal
                                                                .filter(x => x.notes !== 'pelunasan')
                                                                .reduce((sum, x) => sum + (spk_internal_fix * ((parseFloat(x.persentase as any) || 0) / 100)), 0);
                                                            calculatedNilai = Math.max(0, spk_internal_fix - sumNonPelunasan - totalMaterialInternalNilai);
                                                            calculatedPct = spk_internal_fix > 0 ? (calculatedNilai / spk_internal_fix) * 100 : 0;
                                                        } else {
                                                            calculatedNilai = spk_internal_fix * (calculatedPct / 100);
                                                        }

                                                        return (
                                                            <tr key={item.id || idx} className="border-b border-stone-100">
                                                                <td className="p-1">
                                                                    <input
                                                                        type="text"
                                                                        value={item.label}
                                                                        onChange={(e) => handleUpdateMainVendorField('internal', idx, 'label', e.target.value)}
                                                                        className="w-full px-2 py-1 text-xs border border-stone-200 rounded font-semibold text-stone-700"
                                                                        placeholder="Nama Pembayaran"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="p-1">
                                                                    <select
                                                                        value={item.notes || 'dp'}
                                                                        onChange={(e) => handleUpdateMainVendorField('internal', idx, 'notes', e.target.value)}
                                                                        className="px-1 py-1 text-[11px] text-stone-600 bg-white border border-stone-200 rounded focus:outline-none"
                                                                    >
                                                                        <option value="dp">Fase I (DP)</option>
                                                                        <option value="cadangan">Cadangan Vendor</option>
                                                                        <option value="termin">Fase II (Termin)</option>
                                                                        <option value="pelunasan">Fase III (Pelunasan)</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-1 text-right">
                                                                    {item.notes !== 'pelunasan' ? (
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={item.persentase || ''}
                                                                            onChange={(e) => handleUpdateMainVendorField('internal', idx, 'persentase', parseFloat(e.target.value) || 0)}
                                                                            className="w-16 px-2 py-1 text-right text-xs font-semibold bg-white border border-stone-200 rounded"
                                                                            placeholder="0"
                                                                        />
                                                                    ) : (
                                                                        <span className="font-mono text-stone-400 font-semibold px-2">{calculatedPct.toFixed(1)}%</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono text-stone-500">{fmt(calculatedNilai)}</td>
                                                                <td className="p-1">
                                                                    <input
                                                                        type="number"
                                                                        value={item.pembayaran}
                                                                        onChange={(e) => handleUpdateMainVendorField('internal', idx, 'pembayaran', parseFloat(e.target.value) || 0)}
                                                                        className="w-24 px-2 py-1 text-right text-xs font-mono font-semibold bg-white border border-stone-200 rounded focus:ring-0"
                                                                    />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input
                                                                        type="date"
                                                                        value={item.tanggal_pembayaran || ''}
                                                                        onChange={(e) => handleUpdateMainVendorField('internal', idx, 'tanggal_pembayaran', e.target.value)}
                                                                        className="px-2 py-1 text-[11px] text-stone-600 bg-white border border-stone-200 rounded"
                                                                    />
                                                                </td>
                                                                {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                    <td key={flag} className="p-1 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!item[flag as keyof VendorMainEntry]}
                                                                            onChange={(e) => handleUpdateMainVendorField('internal', idx, flag as keyof VendorMainEntry, e.target.checked ? '✔' : null)}
                                                                            className="rounded border-stone-300 text-amber-500 focus:ring-amber-500 scale-90"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-1 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveMainPaymentRow('internal', idx)}
                                                                        className="text-rose-500 hover:text-rose-600 font-bold px-2 py-0.5 rounded"
                                                                    >
                                                                        x
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Material Hutang dinamis */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-6">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <div>
                                                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">1B. Material Hutang (Dinamis)</h3>
                                                <span className="text-[10px] text-stone-400 mt-1 block">Status PO: <span className={`font-bold uppercase ${vendor_internal.status_po === 'Bisa PO' ? 'text-emerald-600' : 'text-rose-500'}`}>{vendor_internal.status_po}</span></span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setModalTargetType('internal'); setShowGroupModal(true); }}
                                                className="text-xs font-bold text-amber-600 hover:text-amber-700"
                                            >
                                                + Tambah Vendor Group
                                            </button>
                                        </div>

                                        {vendorForm.data.material_groups_internal.length === 0 ? (
                                            <div className="text-center py-6 text-stone-400 text-xs">Belum ada vendor group material. Silakan tambahkan group baru.</div>
                                        ) : (
                                            vendorForm.data.material_groups_internal.map((group, groupIdx) => (
                                                <div key={groupIdx} className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 space-y-3">
                                                    <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                                                        <span className="font-bold text-xs text-stone-700">Vendor: {group.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <button type="button" onClick={() => handleAddInvoiceRow('internal', groupIdx)} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">+ Tambah Baris INV</button>
                                                            <button type="button" onClick={() => handleRemoveMaterialGroup('internal', groupIdx)} className="text-[10px] text-rose-500 font-bold">Hapus Group</button>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-[9px] uppercase text-stone-400">
                                                                <tr>
                                                                    <th className="px-2 py-1">Keterangan / No INV</th>
                                                                    <th className="px-2 py-1 text-right">Nilai</th>
                                                                    <th className="px-2 py-1 text-right">Pembayaran</th>
                                                                    <th className="px-2 py-1">Tanggal INV</th>
                                                                    <th className="px-2 py-1">Tanggal Bayar</th>
                                                                    <th className="px-2 py-1 text-center">AF</th>
                                                                    <th className="px-2 py-1 text-center">FB</th>
                                                                    <th className="px-2 py-1 text-center">JW</th>
                                                                    <th className="px-2 py-1 text-center">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.items.map((item, itemIdx) => (
                                                                    <tr key={itemIdx} className="border-b border-stone-100">
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="text"
                                                                                value={item.label}
                                                                                onChange={(e) => handleUpdateInvoiceRow('internal', groupIdx, itemIdx, 'label', e.target.value)}
                                                                                className="w-full px-2 py-1 text-xs border border-stone-200 rounded"
                                                                                placeholder="No/Ket Invoice"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="number"
                                                                                value={item.nilai}
                                                                                onChange={(e) => handleUpdateInvoiceRow('internal', groupIdx, itemIdx, 'nilai', parseFloat(e.target.value) || 0)}
                                                                                className="w-24 px-2 py-1 text-right text-xs font-mono border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="number"
                                                                                value={item.pembayaran}
                                                                                onChange={(e) => handleUpdateInvoiceRow('internal', groupIdx, itemIdx, 'pembayaran', parseFloat(e.target.value) || 0)}
                                                                                className="w-24 px-2 py-1 text-right text-xs font-mono border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="date"
                                                                                value={item.tanggal_inv || ''}
                                                                                onChange={(e) => handleUpdateInvoiceRow('internal', groupIdx, itemIdx, 'tanggal_inv', e.target.value)}
                                                                                className="px-2 py-1 text-xs text-stone-600 border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="date"
                                                                                value={item.tanggal_pembayaran || ''}
                                                                                onChange={(e) => handleUpdateInvoiceRow('internal', groupIdx, itemIdx, 'tanggal_pembayaran', e.target.value)}
                                                                                className="px-2 py-1 text-xs text-stone-600 border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                            <td key={flag} className="p-1 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!item[flag as keyof MaterialItem]}
                                                                                    onChange={(e) => handleInvoiceCheckboxChange('internal', groupIdx, itemIdx, flag as any, e.target.checked)}
                                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        <td className="p-1 text-center">
                                                                            <button type="button" onClick={() => handleRemoveInvoiceRow('internal', groupIdx, itemIdx)} className="text-rose-500 hover:text-rose-600 font-bold px-1.5 py-0.5 hover:bg-rose-50 rounded">x</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: VENDOR FISIK */}
                            {activeTab === 'vendor_fisik' && (
                                <div className="space-y-6">
                                    {/* Main Pembayaran Table */}
                                    {/* Main Pembayaran Table */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">2A. Rincian Pembayaran Vendor Utama (Fisik)</h3>
                                            <button
                                                type="button"
                                                onClick={() => handleAddMainPaymentRow('fisik')}
                                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700"
                                            >
                                                + Tambah Pembayaran Utama
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left text-stone-600">
                                                <thead className="text-[10px] text-stone-400 uppercase bg-stone-50 border-b border-stone-200">
                                                    <tr>
                                                        <th className="px-4 py-2">Keterangan</th>
                                                        <th className="px-4 py-2">Target Fase</th>
                                                        <th className="px-4 py-2 text-right">Persentase (%)</th>
                                                        <th className="px-4 py-2 text-right">Nilai (U)</th>
                                                        <th className="px-4 py-2 text-right">Pembayaran (V)</th>
                                                        <th className="px-4 py-2">Tanggal Pembayaran</th>
                                                        <th className="px-4 py-2 text-center">AF</th>
                                                        <th className="px-4 py-2 text-center">FB</th>
                                                        <th className="px-4 py-2 text-center">JW</th>
                                                        <th className="px-4 py-2 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorForm.data.pembayaran_vendor_fisik.map((item, idx) => {
                                                        const spk_fisik_fix = parseFloat(generalForm.data.spk_fisik_fix) || 0;
                                                        const calculatedPct = parseFloat(item.persentase as any) || 0;
                                                        const calculatedNilai = spk_fisik_fix * (calculatedPct / 100);

                                                        return (
                                                            <tr key={item.id || idx} className="border-b border-stone-100">
                                                                <td className="p-1">
                                                                    <input
                                                                        type="text"
                                                                        value={item.label}
                                                                        onChange={(e) => handleUpdateMainVendorField('fisik', idx, 'label', e.target.value)}
                                                                        className="w-full px-2 py-1 text-xs border border-stone-200 rounded font-semibold text-stone-700"
                                                                        placeholder="Nama Pembayaran"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="p-1">
                                                                    <select
                                                                        value={item.notes || 'dp'}
                                                                        onChange={(e) => handleUpdateMainVendorField('fisik', idx, 'notes', e.target.value)}
                                                                        className="px-1 py-1 text-[11px] text-stone-600 bg-white border border-stone-200 rounded focus:outline-none"
                                                                    >
                                                                        <option value="dp">Fase I (DP)</option>
                                                                        <option value="termin">Fase II (Termin)</option>
                                                                        <option value="pelunasan">Fase III (Pelunasan)</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-1 text-right">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={item.persentase || ''}
                                                                        onChange={(e) => handleUpdateMainVendorField('fisik', idx, 'persentase', parseFloat(e.target.value) || 0)}
                                                                        className="w-16 px-2 py-1 text-right text-xs font-semibold bg-white border border-stone-200 rounded"
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono text-stone-500">{fmt(calculatedNilai)}</td>
                                                                <td className="p-1">
                                                                    <input
                                                                        type="number"
                                                                        value={item.pembayaran}
                                                                        onChange={(e) => handleUpdateMainVendorField('fisik', idx, 'pembayaran', parseFloat(e.target.value) || 0)}
                                                                        className="w-24 px-2 py-1 text-right text-xs font-mono font-semibold bg-white border border-stone-200 rounded focus:ring-0"
                                                                    />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input
                                                                        type="date"
                                                                        value={item.tanggal_pembayaran || ''}
                                                                        onChange={(e) => handleUpdateMainVendorField('fisik', idx, 'tanggal_pembayaran', e.target.value)}
                                                                        className="px-2 py-1 text-[11px] text-stone-600 bg-white border border-stone-200 rounded"
                                                                    />
                                                                </td>
                                                                {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                    <td key={flag} className="p-1 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!item[flag as keyof VendorMainEntry]}
                                                                            onChange={(e) => handleUpdateMainVendorField('fisik', idx, flag as keyof VendorMainEntry, e.target.checked ? '✔' : null)}
                                                                            className="rounded border-stone-300 text-amber-500 focus:ring-amber-500 scale-90"
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-1 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveMainPaymentRow('fisik', idx)}
                                                                        className="text-rose-500 hover:text-rose-600 font-bold px-2 py-0.5 rounded"
                                                                    >
                                                                        x
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Material Hutang dinamis */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-6">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <div>
                                                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">2B. Material Hutang Fisik (Dinamis)</h3>
                                                <div className="flex gap-4 text-[10px] text-stone-400 mt-1 font-mono">
                                                    <span>Budget Material: <b>{fmt(vendor_fisik.budget_material)}</b></span>
                                                    <span>Sisa Budget: <b className="text-amber-600">{fmt(vendor_fisik.sisa_budget)}</b></span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setModalTargetType('fisik'); setShowGroupModal(true); }}
                                                className="text-xs font-bold text-amber-600 hover:text-amber-700"
                                            >
                                                + Tambah Vendor Group
                                            </button>
                                        </div>

                                        {vendorForm.data.material_groups_fisik.length === 0 ? (
                                            <div className="text-center py-6 text-stone-400 text-xs">Belum ada vendor group material. Silakan tambahkan group baru.</div>
                                        ) : (
                                            vendorForm.data.material_groups_fisik.map((group, groupIdx) => (
                                                <div key={groupIdx} className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 space-y-3">
                                                    <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                                                        <span className="font-bold text-xs text-stone-700">Vendor: {group.name}</span>
                                                        <div className="flex items-center gap-3">
                                                            <button type="button" onClick={() => handleAddInvoiceRow('fisik', groupIdx)} className="text-[10px] font-bold text-amber-600 hover:text-amber-700">+ Tambah Baris INV</button>
                                                            <button type="button" onClick={() => handleRemoveMaterialGroup('fisik', groupIdx)} className="text-[10px] text-rose-500 font-bold">Hapus Group</button>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-[9px] uppercase text-stone-400">
                                                                <tr>
                                                                    <th className="px-2 py-1">Keterangan / No INV</th>
                                                                    <th className="px-2 py-1 text-right">Nilai</th>
                                                                    <th className="px-2 py-1 text-right">Pembayaran</th>
                                                                    <th className="px-2 py-1">Tanggal INV</th>
                                                                    <th className="px-2 py-1">Tanggal Bayar</th>
                                                                    <th className="px-2 py-1 text-center">AF</th>
                                                                    <th className="px-2 py-1 text-center">FB</th>
                                                                    <th className="px-2 py-1 text-center">JW</th>
                                                                    <th className="px-2 py-1 text-center">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.items.map((item, itemIdx) => (
                                                                    <tr key={itemIdx} className="border-b border-stone-100">
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="text"
                                                                                value={item.label}
                                                                                onChange={(e) => handleUpdateInvoiceRow('fisik', groupIdx, itemIdx, 'label', e.target.value)}
                                                                                className="w-full px-2 py-1 text-xs border border-stone-200 rounded"
                                                                                placeholder="No/Ket Invoice"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="number"
                                                                                value={item.nilai}
                                                                                onChange={(e) => handleUpdateInvoiceRow('fisik', groupIdx, itemIdx, 'nilai', parseFloat(e.target.value) || 0)}
                                                                                className="w-24 px-2 py-1 text-right text-xs font-mono border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="number"
                                                                                value={item.pembayaran}
                                                                                onChange={(e) => handleUpdateInvoiceRow('fisik', groupIdx, itemIdx, 'pembayaran', parseFloat(e.target.value) || 0)}
                                                                                className="w-24 px-2 py-1 text-right text-xs font-mono border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="date"
                                                                                value={item.tanggal_inv || ''}
                                                                                onChange={(e) => handleUpdateInvoiceRow('fisik', groupIdx, itemIdx, 'tanggal_inv', e.target.value)}
                                                                                className="px-2 py-1 text-xs text-stone-600 border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        <td className="p-1">
                                                                            <input
                                                                                type="date"
                                                                                value={item.tanggal_pembayaran || ''}
                                                                                onChange={(e) => handleUpdateInvoiceRow('fisik', groupIdx, itemIdx, 'tanggal_pembayaran', e.target.value)}
                                                                                className="px-2 py-1 text-xs text-stone-600 border border-stone-200 rounded"
                                                                            />
                                                                        </td>
                                                                        {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                            <td key={flag} className="p-1 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!item[flag as keyof MaterialItem]}
                                                                                    onChange={(e) => handleInvoiceCheckboxChange('fisik', groupIdx, itemIdx, flag as any, e.target.checked)}
                                                                                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        <td className="p-1 text-center">
                                                                            <button type="button" onClick={() => handleRemoveInvoiceRow('fisik', groupIdx, itemIdx)} className="text-rose-500 hover:text-rose-600 font-bold px-1.5 py-0.5 hover:bg-rose-50 rounded">x</button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: VENDOR EXTERNAL */}
                            {activeTab === 'vendor_external' && (
                                <div className="space-y-6">
                                    {/* 3A. Daftar Item External */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">3A. Daftar Item External</h3>
                                            <button type="button" onClick={() => handleAddExternalRow('items')} className="text-xs font-bold text-amber-600 hover:text-amber-700">+ Tambah Item</button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px] text-left text-stone-600">
                                                <thead className="text-[9px] uppercase text-stone-400 bg-stone-50">
                                                    <tr>
                                                        <th className="px-2 py-2">Item External</th>
                                                        <th className="px-2 py-2">Vendor</th>
                                                        <th className="px-2 py-2 text-right">Estimasi</th>
                                                        <th className="px-2 py-2 text-right">SPK H+14</th>
                                                        <th className="px-2 py-2">Tgl Rencana</th>
                                                        <th className="px-2 py-2 text-right">Pembayaran (DP)</th>
                                                        <th className="px-2 py-2">Tgl Bayar DP</th>
                                                        <th className="px-2 py-2 text-center">AF/FB/JW (DP)</th>
                                                        <th className="px-2 py-2 text-right">Pembayaran (Termin)</th>
                                                        <th className="px-2 py-2">Tgl Bayar Ter.</th>
                                                        <th className="px-2 py-2 text-center">AF/FB/JW (Ter)</th>
                                                        <th className="px-2 py-2 text-right">Status Sisa</th>
                                                        <th className="px-2 py-2 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorForm.data.external_items.map((item, idx) => {
                                                        const sisa = item.spk_amount - item.pembayaran - item.pembayaran_termin;
                                                        return (
                                                            <tr key={idx} className="border-b border-stone-100">
                                                                <td className="p-1">
                                                                    <input type="text" value={item.label} onChange={(e) => handleUpdateExternalRow('items', idx, 'label', e.target.value)} className="w-24 px-1 py-0.5 border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="text" value={item.vendor_name} onChange={(e) => handleUpdateExternalRow('items', idx, 'vendor_name', e.target.value)} className="w-20 px-1 py-0.5 border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="number" value={item.nilai} onChange={(e) => handleUpdateExternalRow('items', idx, 'nilai', parseFloat(e.target.value) || 0)} className="w-20 px-1 py-0.5 text-right font-mono border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="number" value={item.spk_amount} onChange={(e) => handleUpdateExternalRow('items', idx, 'spk_amount', parseFloat(e.target.value) || 0)} className="w-20 px-1 py-0.5 text-right font-mono border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="date" value={item.tanggal_perencanaan || ''} onChange={(e) => handleUpdateExternalRow('items', idx, 'tanggal_perencanaan', e.target.value)} className="px-1 py-0.5 text-[10px] border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="number" value={item.pembayaran} onChange={(e) => handleUpdateExternalRow('items', idx, 'pembayaran', parseFloat(e.target.value) || 0)} className="w-20 px-1 py-0.5 text-right font-mono border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="date" value={item.tanggal_pembayaran || ''} onChange={(e) => handleUpdateExternalRow('items', idx, 'tanggal_pembayaran', e.target.value)} className="px-1 py-0.5 text-[10px] border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1 text-center">
                                                                    <div className="flex gap-1 justify-center">
                                                                        {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                            <input
                                                                                key={flag}
                                                                                type="checkbox"
                                                                                checked={!!item[flag as keyof ExternalEntry]}
                                                                                onChange={(e) => handleUpdateExternalRow('items', idx, flag as any, e.target.checked ? '✔' : null)}
                                                                                className="rounded text-amber-500 scale-75"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="number" value={item.pembayaran_termin} onChange={(e) => handleUpdateExternalRow('items', idx, 'pembayaran_termin', parseFloat(e.target.value) || 0)} className="w-20 px-1 py-0.5 text-right font-mono border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1">
                                                                    <input type="date" value={item.tanggal_pembayaran_termin || ''} onChange={(e) => handleUpdateExternalRow('items', idx, 'tanggal_pembayaran_termin', e.target.value)} className="px-1 py-0.5 text-[10px] border border-stone-200 rounded" />
                                                                </td>
                                                                <td className="p-1 text-center">
                                                                    <div className="flex gap-1 justify-center">
                                                                        {['flag_af_termin', 'flag_fb_termin', 'flag_jw_termin'].map((flag) => (
                                                                            <input
                                                                                key={flag}
                                                                                type="checkbox"
                                                                                checked={!!item[flag as keyof ExternalEntry]}
                                                                                onChange={(e) => handleUpdateExternalRow('items', idx, flag as any, e.target.checked ? '✔' : null)}
                                                                                className="rounded text-amber-500 scale-75"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-right font-mono font-semibold" style={{ color: sisa > 0 ? '#ea580c' : '#16a34a' }}>{fmt(sisa)}</td>
                                                                <td className="p-1 text-center">
                                                                    <button type="button" onClick={() => handleRemoveExternalRow('items', idx)} className="text-rose-500 hover:text-rose-600 font-bold px-1 hover:bg-rose-50 rounded">x</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 3B. Addendum External */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">3B. Addendum External</h3>
                                            <button type="button" onClick={() => handleAddExternalRow('addendums')} className="text-xs font-bold text-amber-600 hover:text-amber-700">+ Tambah Addendum</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="text-[9px] uppercase text-stone-400 bg-stone-50">
                                                    <tr>
                                                        <th className="px-2 py-1">Deskripsi</th>
                                                        <th className="px-2 py-1 text-right">Nilai Estimasi</th>
                                                        <th className="px-2 py-1 text-right">Pembayaran</th>
                                                        <th className="px-2 py-1">Tanggal Pembayaran</th>
                                                        <th className="px-2 py-1 text-center">AF</th>
                                                        <th className="px-2 py-1 text-center">FB</th>
                                                        <th className="px-2 py-1 text-center">JW</th>
                                                        <th className="px-2 py-1 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vendorForm.data.external_addendums.map((item, idx) => (
                                                        <tr key={idx} className="border-b border-stone-100">
                                                            <td className="p-1">
                                                                <input type="text" value={item.label} onChange={(e) => handleUpdateExternalRow('addendums', idx, 'label', e.target.value)} className="w-full px-2 py-1 border border-stone-200 rounded" />
                                                            </td>
                                                            <td className="p-1">
                                                                <input type="number" value={item.nilai} onChange={(e) => handleUpdateExternalRow('addendums', idx, 'nilai', parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right font-mono border border-stone-200 rounded" />
                                                            </td>
                                                            <td className="p-1">
                                                                <input type="number" value={item.pembayaran} onChange={(e) => handleUpdateExternalRow('addendums', idx, 'pembayaran', parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right font-mono border border-stone-200 rounded" />
                                                            </td>
                                                            <td className="p-1">
                                                                <input type="date" value={item.tanggal_pembayaran || ''} onChange={(e) => handleUpdateExternalRow('addendums', idx, 'tanggal_pembayaran', e.target.value)} className="px-2 py-1 border border-stone-200 rounded" />
                                                            </td>
                                                            {['flag_af', 'flag_fb', 'flag_jw'].map((flag) => (
                                                                <td key={flag} className="p-1 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!item[flag as keyof ExternalEntry]}
                                                                        onChange={(e) => handleUpdateExternalRow('addendums', idx, flag as any, e.target.checked ? '✔' : null)}
                                                                        className="rounded text-amber-500 scale-90"
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="p-1 text-center">
                                                                <button type="button" onClick={() => handleRemoveExternalRow('addendums', idx)} className="text-rose-500 hover:text-rose-600 font-bold px-2 py-0.5 rounded">x</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Vendor Footer */}
                            <div className="sticky bottom-4 z-10 flex justify-end bg-white/90 backdrop-blur-sm border border-stone-200/80 p-3 rounded-2xl shadow-lg">
                                <button type="submit" disabled={vendorForm.processing} className="bg-amber-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-50">
                                    {vendorForm.processing ? 'Menyimpan...' : 'Simpan Rincian Vendor'}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>

            {/* Vendor Group Creation Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-150">
                        <h3 className="text-sm font-bold text-stone-850 mb-3">Tambah Vendor Group Baru</h3>
                        <p className="text-xs text-stone-500 mb-4">Input nama vendor penyedia material untuk mengelompokkan invoice hutang.</p>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs text-stone-700 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 mb-5"
                            placeholder="Contoh: PT SOLMATOSS"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3.5">
                            <button type="button" onClick={() => { setShowGroupModal(false); setNewGroupName(''); }} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold">Batal</button>
                            <button type="button" onClick={handleAddMaterialGroup} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10">Buat Group</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
