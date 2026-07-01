import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface OrderInfo { id: number; nama_project: string; customer_name: string; company_name: string; payment_status: string; tahapan_proyek: string; pm_name: string; }
interface Split { internal: number; fisik: number; eksternal: number; total: number; }
interface Pembayaran { dp: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; termin: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; pelunasan: { amount: number; pct: number; proyeksi: number; tanggal: string|null }; total_diterima: number; sisa_piutang: number; }
interface Spk { internal: number; fisik: number; external: number; internal_fix: number; upgrade_material: number; fisik_fix: number; external_fix: number; saldo_efisiensi_internal: number; saldo_efisiensi_physic: number; saldo_efisiensi_external: number; total_fix: number; total_saldo_efisiensi: number; }
interface Realisasi { internal: number; fisik: number; external: number; addendum: number; sisa_saldo_internal: number; sisa_saldo_fisik: number; sisa_saldo_external: number; total: number; }
interface FeeTeamItem { label: string; amount: number; }
interface BreakdownItem { label: string; pct: number; base: 'internal_margin' | 'fisik_eksternal' | 'total_kontrak' | 'fixed'; amount?: number; }
interface Margin { target_internal: number; target_fisik: number; target_external: number; total_target: number; pct_internal: number; pct_fisik: number; pct_external: number; pct_total: number; fee_team: number; pct_fee_team: number; fee_team_detail: FeeTeamItem[]; breakdown_items: BreakdownItem[]; sisa_margin: number; pct_sisa_margin: number; }
interface RpkDp { cash_in: number; dp_vendor: number; cadangan_vendor: number; dp_fisik: number; dp_external: number; fee_team_detail: FeeTeamItem[]; breakdown_items: BreakdownItem[]; sisa_cash_sebelum_mgmt: number; management: number; sisa_cash: number; }
interface RpkTermin { cash_in: number; sisa_cash_sebelumnya: number; total_cash: number; termin_vendor: number; material_hutang_vendor: number; termin_fisik: number; termin_external: number; sisa_cash_sebelum_mgmt: number; management: number; sisa_cash: number; }
interface RpkPelunasan { sisa_cash_sebelumnya: number; total_cash: number; pelunasan_vendor: number; material_hutang_vendor: number; pelunasan_fisik: number; pelunasan_external: number; sisa_cash_sebelum_mgmt: number; management: number; addendum_cadangan_gaji: number; pengeluaran_lain_lain: number; }
interface Props { order: OrderInfo; split: Split; pembayaran: Pembayaran; spk: Spk; realisasi: Realisasi; margin: Margin; rpk: { dp: RpkDp; termin: RpkTermin; pelunasan: RpkPelunasan }; status_project: number; }

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function Show({ order, split, pembayaran, spk, realisasi, margin, rpk, status_project }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
    const [activeTab, setActiveTab] = useState<'kontrak'|'spk'|'margin'|'rpk'>('kontrak');

    useEffect(() => {
        const h = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    const { data, setData, post, processing } = useForm({
        spk_internal: spk.internal.toString(),
        spk_fisik: spk.fisik.toString(),
        spk_external: spk.external.toString(),
        spk_internal_fix: spk.internal_fix.toString(),
        upgrade_material: spk.upgrade_material.toString(),
        spk_fisik_fix: spk.fisik_fix.toString(),
        spk_external_fix: spk.external_fix.toString(),
        realisasi_internal: realisasi.internal.toString(),
        realisasi_fisik: realisasi.fisik.toString(),
        realisasi_external: realisasi.external.toString(),
        realisasi_addendum: realisasi.addendum.toString(),
        dp_vendor: rpk.dp.dp_vendor.toString(),
        cadangan_vendor_dp: rpk.dp.cadangan_vendor.toString(),
        dp_fisik: rpk.dp.dp_fisik.toString(),
        dp_external: rpk.dp.dp_external.toString(),
        termin_vendor: rpk.termin.termin_vendor.toString(),
        material_hutang_vendor: rpk.termin.material_hutang_vendor.toString(),
        termin_fisik: rpk.termin.termin_fisik.toString(),
        termin_external: rpk.termin.termin_external.toString(),
        pelunasan_vendor: rpk.pelunasan.pelunasan_vendor.toString(),
        material_hutang_vendor_pel: rpk.pelunasan.material_hutang_vendor.toString(),
        pelunasan_fisik: rpk.pelunasan.pelunasan_fisik.toString(),
        pelunasan_external: rpk.pelunasan.pelunasan_external.toString(),
        addendum_cadangan_gaji: rpk.pelunasan.addendum_cadangan_gaji.toString(),
        pengeluaran_lain_lain: rpk.pelunasan.pengeluaran_lain_lain.toString(),
        fee_team_items: margin.fee_team_detail.map(item => ({ label: item.label, amount: item.amount })),
        margin_breakdown_items: margin.breakdown_items.map(item => ({ label: item.label, pct: item.pct, base: item.base }))
    });

    // ──────────────────────────────────────────
    // REACTIVE CALCULATOR ENGINE
    // Calculates everything on-the-fly inside the frontend
    // ──────────────────────────────────────────
    const computed = useMemo(() => {
        // Parse numerical inputs
        const spk_internal = parseFloat(data.spk_internal) || 0;
        const spk_fisik = parseFloat(data.spk_fisik) || 0;
        const spk_external = parseFloat(data.spk_external) || 0;

        const spk_internal_fix = parseFloat(data.spk_internal_fix) || 0;
        const spk_fisik_fix = parseFloat(data.spk_fisik_fix) || 0;
        const spk_external_fix = parseFloat(data.spk_external_fix) || 0;

        const realisasi_internal = parseFloat(data.realisasi_internal) || 0;
        const realisasi_fisik = parseFloat(data.realisasi_fisik) || 0;
        const realisasi_external = parseFloat(data.realisasi_external) || 0;
        const realisasi_addendum = parseFloat(data.realisasi_addendum) || 0;

        // SPK totals and efficiency
        const total_fix = spk_internal_fix + spk_fisik_fix + spk_external_fix;
        const saldo_efisiensi_internal = spk_internal_fix > 0 ? spk_internal - spk_internal_fix : 0;
        const saldo_efisiensi_fisik = spk_fisik_fix > 0 ? spk_fisik - spk_fisik_fix : 0;
        const saldo_efisiensi_external = spk_external_fix > 0 ? spk_external - spk_external_fix : 0;
        const total_saldo_efisiensi = saldo_efisiensi_internal + saldo_efisiensi_fisik + saldo_efisiensi_external;

        // Realisasi
        const sisa_saldo_internal = spk_internal - realisasi_internal;
        const sisa_saldo_fisik = spk_fisik - realisasi_fisik;
        const sisa_saldo_external = spk_external - realisasi_external;
        const total_realisasi = realisasi_internal + realisasi_fisik + realisasi_external + realisasi_addendum;

        // Margins
        const target_internal = split.internal - spk_internal;
        const target_fisik = split.fisik - spk_fisik;
        const target_external = split.eksternal - spk_external;
        const total_target = target_internal + target_fisik + target_external;

        const pct_internal = split.internal > 0 ? target_internal / split.internal : 0;
        const pct_fisik = split.fisik > 0 ? target_fisik / split.fisik : 0;
        const pct_external = split.eksternal > 0 ? target_external / split.eksternal : 0;
        const pct_total = split.total > 0 ? total_target / split.total : 0;

        // Breakdown based on internal margin % <= 30% or > 30% of kontrak internal
        const marginBase = (pct_internal <= 0.30) ? target_internal : (0.30 * split.internal);

        // Compute dynamic Margin Breakdown list values
        let total_breakdown_amount = 0;
        const breakdown_list_computed = data.margin_breakdown_items.map(item => {
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
            return {
                ...item,
                amount: roundedAmount
            };
        });

        // Sum up custom fee team list
        const total_fee_team = data.fee_team_items.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
        const pct_fee_team = split.internal > 0 ? (total_fee_team / split.internal) * 100 : 0;

        const sisa_margin = total_target - total_breakdown_amount - total_fee_team;
        const pct_sisa_margin = split.total > 0 ? sisa_margin / split.total : 0;

        // RPK DP
        const cash_in_dp = pembayaran.dp.amount;
        const dp_vendor = parseFloat(data.dp_vendor) || 0;
        const cadangan_vendor_dp = parseFloat(data.cadangan_vendor_dp) || 0;
        const dp_fisik = parseFloat(data.dp_fisik) || 0;
        const dp_external = parseFloat(data.dp_external) || 0;

        const total_pengeluaran_dp = dp_vendor + cadangan_vendor_dp + dp_fisik + dp_external + total_fee_team + total_breakdown_amount;
        const sisa_cash_sebelum_mgmt_dp = cash_in_dp - total_pengeluaran_dp;
        let management_dp = sisa_cash_sebelum_mgmt_dp > sisa_margin ? sisa_margin : sisa_cash_sebelum_mgmt_dp;
        if (management_dp < 0) management_dp = 0;
        const sisa_cash_dp = sisa_cash_sebelum_mgmt_dp - management_dp;

        // RPK Termin
        const cash_in_termin = pembayaran.termin.amount;
        const total_cash_termin = cash_in_termin + sisa_cash_dp;
        const termin_vendor = parseFloat(data.termin_vendor) || 0;
        const material_hutang_vendor = parseFloat(data.material_hutang_vendor) || 0;
        const termin_fisik = parseFloat(data.termin_fisik) || 0;
        const termin_external = parseFloat(data.termin_external) || 0;

        const sisa_cash_sebelum_mgmt_termin = total_cash_termin - termin_vendor - material_hutang_vendor - termin_fisik - termin_external;
        let management_termin = 0;
        if ((management_dp + sisa_cash_sebelum_mgmt_termin) > sisa_margin) {
            management_termin = sisa_margin - management_dp;
        } else {
            management_termin = cash_in_termin - termin_vendor - material_hutang_vendor - termin_fisik - termin_external;
        }
        if (management_termin < 0) management_termin = 0;
        const sisa_cash_termin = sisa_cash_sebelum_mgmt_termin - management_termin;

        // RPK Pelunasan
        const total_cash_pel = pembayaran.pelunasan.amount + sisa_cash_termin;
        const pelunasan_vendor = parseFloat(data.pelunasan_vendor) || 0;
        const material_hutang_vendor_pel = parseFloat(data.material_hutang_vendor_pel) || 0;
        const pelunasan_fisik = parseFloat(data.pelunasan_fisik) || 0;
        const pelunasan_external = parseFloat(data.pelunasan_external) || 0;

        const sisa_cash_sebelum_mgmt_pel = total_cash_pel - pelunasan_vendor - material_hutang_vendor_pel - pelunasan_fisik - pelunasan_external;
        let management_pel = 0;
        if (pembayaran.pelunasan.amount > 0) {
            management_pel = sisa_margin - management_dp - management_termin;
        }
        if (management_pel < 0) management_pel = 0;

        // Status Project final summary
        const status_project_calc = sisa_saldo_internal + sisa_saldo_fisik + sisa_saldo_external;

        return {
            total_fix,
            saldo_efisiensi_internal,
            saldo_efisiensi_fisik,
            saldo_efisiensi_external,
            total_saldo_efisiensi,
            sisa_saldo_internal,
            sisa_saldo_fisik,
            sisa_saldo_external,
            total_realisasi,
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
            dp: {
                total_pengeluaran: total_pengeluaran_dp,
                sisa_cash_sebelum_mgmt: sisa_cash_sebelum_mgmt_dp,
                management: management_dp,
                sisa_cash: sisa_cash_dp
            },
            termin: {
                total_cash: total_cash_termin,
                sisa_cash_sebelum_mgmt: sisa_cash_sebelum_mgmt_termin,
                management: management_termin,
                sisa_cash: sisa_cash_termin
            },
            pelunasan: {
                total_cash: total_cash_pel,
                sisa_cash_sebelum_mgmt: sisa_cash_sebelum_mgmt_pel,
                management: management_pel
            },
            status_project: status_project_calc
        };
    }, [data, split, pembayaran]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/cashflow/${order.id}/manual-entry`, { preserveScroll: true });
    };

    // ──────────────────────────────────────────
    // FEE TEAM HANDLERS
    // ──────────────────────────────────────────
    const handleAddFeeMember = () => {
        const current = [...data.fee_team_items];
        setData('fee_team_items', [...current, { label: 'Anggota Baru', amount: 0 }]);
    };

    const handleRemoveFeeMember = (idx: number) => {
        const current = data.fee_team_items.filter((_, i) => i !== idx);
        setData('fee_team_items', current);
    };

    const handleUpdateFeeMember = (idx: number, key: 'label'|'amount', val: any) => {
        const current = [...data.fee_team_items];
        current[idx] = { ...current[idx], [key]: val };
        setData('fee_team_items', current);
    };

    // ──────────────────────────────────────────
    // MARGIN BREAKDOWN HANDLERS
    // ──────────────────────────────────────────
    const handleAddBreakdownItem = () => {
        const current = [...data.margin_breakdown_items];
        setData('margin_breakdown_items', [...current, { label: 'Breakdown Baru', pct: 0, base: 'internal_margin' }]);
    };

    const handleRemoveBreakdownItem = (idx: number) => {
        const current = data.margin_breakdown_items.filter((_, i) => i !== idx);
        setData('margin_breakdown_items', current);
    };

    const handleUpdateBreakdownItem = (idx: number, key: 'label'|'pct'|'base', val: any) => {
        const current = [...data.margin_breakdown_items];
        current[idx] = { ...current[idx], [key]: val };
        setData('margin_breakdown_items', current);
    };

    const renderInputCard = (label: string, name: string, icon?: string) => {
        const val = parseFloat((data as any)[name]) || 0;
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
                        value={(data as any)[name]}
                        onChange={(e) => setData(name as any, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-right font-mono text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-0 focus:border-stone-300"
                        placeholder="0"
                    />
                </div>
                {val > 0 && (
                    <div className="text-[10px] text-stone-400 font-mono text-right mt-1.5">
                        {fmt(val)}
                    </div>
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

                    {/* Back Action & Navigation */}
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
                                {fmt(computed.status_project)}
                            </span>
                        </div>
                    </div>

                    {/* Dashboard Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Kontrak</p>
                            <h3 className="text-lg font-bold text-stone-800 font-mono mt-1">{fmt(split.total)}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Int: {pct(split.total > 0 ? split.internal / split.total : 0)}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Fis: {pct(split.total > 0 ? split.fisik / split.total : 0)}</span>
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
                            <h3 className={`text-lg font-bold font-mono mt-1 ${computed.total_target >= 0 ? 'text-violet-600' : 'text-red-500'}`}>
                                {fmt(computed.total_target)}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-bold mt-2 inline-block">
                                {pct(computed.pct_total)} Target
                            </span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-stone-200 gap-1 overflow-x-auto pb-px">
                        {[
                            { id: 'kontrak', label: 'Kontrak & Pembayaran', color: 'emerald' },
                            { id: 'spk', label: 'SPK & Realisasi', color: 'amber' },
                            { id: 'margin', label: 'Estimasi Margin & Fee', color: 'violet' },
                            { id: 'rpk', label: 'Rencana Keuangan (RPK)', color: 'sky' }
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

                    {/* Form Layout Wrapper */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* TAB 1: KONTRAK & PEMBAYARAN */}
                        {activeTab === 'kontrak' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contract Split Card */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Pembagian Kontrak</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-stone-100">
                                            <span className="text-xs font-semibold text-stone-600">Kontrak Internal</span>
                                            <span className="text-xs font-mono font-bold text-stone-800">{fmt(split.internal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-100">
                                            <span className="text-xs font-semibold text-stone-600">Kontrak Fisik</span>
                                            <span className="text-xs font-mono font-bold text-stone-800">{fmt(split.fisik)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-stone-100">
                                            <span className="text-xs font-semibold text-stone-600">Kontrak Eksternal</span>
                                            <span className="text-xs font-mono font-bold text-stone-800">{fmt(split.eksternal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 font-bold text-stone-900">
                                            <span className="text-xs">Total Kontrak</span>
                                            <span className="text-sm font-mono">{fmt(split.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payments / Invoices Info */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Histori Pembayaran</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {[
                                            { label: 'Pembayaran DP', info: pembayaran.dp },
                                            { label: 'Pembayaran Termin II', info: pembayaran.termin },
                                            { label: 'Pembayaran Pelunasan', info: pembayaran.pelunasan }
                                        ].map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-start py-2.5 border-b border-stone-100">
                                                <div>
                                                    <h4 className="text-xs font-bold text-stone-700">{p.label}</h4>
                                                    <span className="text-[10px] text-stone-400">
                                                        {p.info.tanggal ? `Paid: ${new Date(p.info.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}` : 'Belum Bayar'}
                                                    </span>
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
                        )}

                        {/* TAB 2: SPK & REALISASI */}
                        {activeTab === 'spk' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Column 1: Estimasi SPK */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Estimasi SPK</h3>
                                        {renderInputCard('SPK Internal', 'spk_internal')}
                                        {renderInputCard('SPK Fisik', 'spk_fisik')}
                                        {renderInputCard('SPK External', 'spk_external')}
                                    </div>

                                    {/* Column 2: SPK Fix */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">SPK Fix / Material</h3>
                                        {renderInputCard('SPK Internal Fix', 'spk_internal_fix')}
                                        {renderInputCard('Upgrade Material', 'upgrade_material')}
                                        {renderInputCard('SPK Fisik Fix', 'spk_fisik_fix')}
                                        {renderInputCard('SPK External Fix', 'spk_external_fix')}
                                    </div>

                                    {/* Column 3: Realisasi & Sisa */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Realisasi Pengeluaran</h3>
                                        {renderInputCard('Realisasi Internal', 'realisasi_internal')}
                                        {renderInputCard('Realisasi Fisik', 'realisasi_fisik')}
                                        {renderInputCard('Realisasi External', 'realisasi_external')}
                                        {renderInputCard('Addendum', 'realisasi_addendum')}
                                    </div>
                                </div>

                                {/* Efficiency Summary Card */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5">
                                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4">Ringkasan Efisiensi SPK</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi Internal</span>
                                            <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_internal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {fmt(computed.saldo_efisiensi_internal)}
                                            </span>
                                        </div>
                                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi Fisik</span>
                                            <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_fisik >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {parseFloat(data.spk_fisik_fix) === 0 ? 'Cek SPK' : fmt(computed.saldo_efisiensi_fisik)}
                                            </span>
                                        </div>
                                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                                            <span className="text-[10px] text-stone-400 font-bold uppercase block">Efisiensi External</span>
                                            <span className={`text-sm font-mono font-bold block mt-1 ${computed.saldo_efisiensi_external >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {fmt(computed.saldo_efisiensi_external)}
                                            </span>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100/50">
                                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Total Efisiensi</span>
                                            <span className={`text-sm font-mono font-extrabold block mt-1 ${computed.total_saldo_efisiensi >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {fmt(computed.total_saldo_efisiensi)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ESTIMASI MARGIN & FEE TEAM */}
                        {activeTab === 'margin' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column: Target Margins */}
                                <div className="md:col-span-1 space-y-6">
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Target Margin</h3>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs text-stone-600 font-semibold">Target Internal</span>
                                            <div className="text-right">
                                                <span className="text-xs font-mono font-bold block">{fmt(computed.target_internal)}</span>
                                                <span className="text-[10px] text-stone-400 font-semibold">{pct(computed.pct_internal)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs text-stone-600 font-semibold">Target Fisik</span>
                                            <div className="text-right">
                                                <span className="text-xs font-mono font-bold block">{fmt(computed.target_fisik)}</span>
                                                <span className="text-[10px] text-stone-400 font-semibold">{pct(computed.pct_fisik)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-xs text-stone-600 font-semibold">Target External</span>
                                            <div className="text-right">
                                                <span className={`text-xs font-mono font-bold block ${computed.target_external >= 0 ? '' : 'text-red-500'}`}>
                                                    {fmt(computed.target_external)}
                                                </span>
                                                <span className="text-[10px] text-stone-400 font-semibold">{pct(computed.pct_external)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Breakdown Margin & Fee Team */}
                                <div className="md:col-span-2 space-y-6">
                                    {/* Breakdown Margin Card */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Breakdown Margin & Fee</h3>
                                                <p className="text-[10px] text-stone-400 mt-0.5">Berdasarkan basis margin proyek</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddBreakdownItem}
                                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 hover:bg-amber-100/50 transition flex items-center gap-1"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                Tambah Alokasi
                                            </button>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {data.margin_breakdown_items.map((item, idx) => (
                                                <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                                                    <div className="flex-1 min-w-[150px]">
                                                        <input
                                                            type="text"
                                                            value={item.label}
                                                            onChange={(e) => handleUpdateBreakdownItem(idx, 'label', e.target.value)}
                                                            className="w-full text-xs font-bold text-stone-700 bg-transparent border-0 focus:ring-0 p-0 focus:outline-none"
                                                            placeholder="Label Pengeluaran"
                                                        />
                                                        <p className="text-[10px] text-stone-400 font-mono mt-1">
                                                            Nilai: {fmt(computed.breakdown_items[idx]?.amount || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="relative w-20">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.pct}
                                                                onChange={(e) => handleUpdateBreakdownItem(idx, 'pct', e.target.value)}
                                                                className="w-full pr-6 pl-2 py-1 text-right font-mono text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-0 focus:border-stone-300"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold">
                                                                {item.base === 'fixed' ? 'Rp' : '%'}
                                                            </span>
                                                        </div>
                                                        <select
                                                            value={item.base}
                                                            onChange={(e) => handleUpdateBreakdownItem(idx, 'base', e.target.value)}
                                                            className="text-[10px] font-semibold text-stone-600 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:ring-0 focus:outline-none"
                                                        >
                                                            <option value="internal_margin">Internal Margin</option>
                                                            <option value="fisik_eksternal">Fisik + Eksternal</option>
                                                            <option value="total_kontrak">Total Kontrak</option>
                                                            <option value="fixed">Nominal Tetap</option>
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveBreakdownItem(idx)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dynamic Fee Team List */}
                                    <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">FEE TEAM INDIVIDU ({computed.pct_fee_team.toFixed(1)}%)</h3>
                                            <button
                                                type="button"
                                                onClick={handleAddFeeMember}
                                                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 hover:bg-amber-100/50 transition flex items-center gap-1"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                Tambah Anggota
                                            </button>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="space-y-2">
                                                {data.fee_team_items.map((fee, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={fee.label}
                                                                onChange={(e) => handleUpdateFeeMember(idx, 'label', e.target.value)}
                                                                className="w-full text-xs font-semibold text-stone-700 bg-transparent border-0 focus:ring-0 p-0 focus:outline-none"
                                                                placeholder="Nama / Peran Anggota"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-[10px]">Rp</span>
                                                                <input
                                                                    type="number"
                                                                    value={fee.amount}
                                                                    onChange={(e) => handleUpdateFeeMember(idx, 'amount', e.target.value)}
                                                                    className="w-32 pl-7 pr-2 py-1 text-right font-mono text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-0 focus:border-stone-300"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveFeeMember(idx)}
                                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                            >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center bg-violet-50/50 p-3 rounded-xl border border-violet-100 mt-4">
                                                <span className="text-xs font-bold text-violet-800">Sisa Net Margin</span>
                                                <div className="text-right">
                                                    <span className="text-sm font-mono font-extrabold text-violet-700 block">{fmt(computed.sisa_margin)}</span>
                                                    <span className="text-[10px] text-violet-500 font-bold">{pct(computed.pct_sisa_margin)} dari kontrak</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: RENCANA PELAKSANAAN KEUANGAN (RPK) */}
                        {activeTab === 'rpk' && (
                            <div className="space-y-6">
                                {/* Fase DP Card */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-stone-100 bg-sky-50/30 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Fase I: Down Payment (DP)</h3>
                                        <span className="text-xs font-mono font-bold text-sky-700">Cash In: {fmt(rpk.dp.cash_in)}</span>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            {renderInputCard('DP Vendor', 'dp_vendor')}
                                            {renderInputCard('Cadangan Vendor', 'cadangan_vendor_dp')}
                                            {renderInputCard('DP Fisik', 'dp_fisik')}
                                            {renderInputCard('DP External', 'dp_external')}
                                        </div>
                                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100/60 mt-2 space-y-2.5">
                                            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">Estimasi Pengeluaran Lainnya (DP)</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px]">
                                                {computed.breakdown_items.map((item, idx) => (
                                                    <div key={idx}>
                                                        <span className="text-stone-400 font-semibold block">{item.label}</span>
                                                        <span className="font-mono font-bold text-stone-700">{fmt(item.amount || 0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
                                            <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Sisa Sebelum Management</span>
                                                <span className="text-xs font-mono font-bold text-stone-800">{fmt(computed.dp.sisa_cash_sebelum_mgmt)}</span>
                                            </div>
                                            <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Management Fee</span>
                                                <span className="text-xs font-mono font-bold text-stone-800">{fmt(computed.dp.management)}</span>
                                            </div>
                                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                                                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Sisa Gaji / Cash Akhir</span>
                                                <span className="text-sm font-mono font-extrabold text-emerald-700 block mt-0.5">{fmt(computed.dp.sisa_cash)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fase Termin II Card */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-stone-100 bg-sky-50/30 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Fase II: Termin II</h3>
                                        <div className="text-right">
                                            <span className="text-xs font-mono font-bold text-sky-700 block">Termin In: {fmt(rpk.termin.cash_in)}</span>
                                            <span className="text-[9px] text-stone-400">Total Cash (Inc Sisa DP): {fmt(computed.termin.total_cash)}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            {renderInputCard('Termin Vendor', 'termin_vendor')}
                                            {renderInputCard('Material Hutang Vendor', 'material_hutang_vendor')}
                                            {renderInputCard('Termin Fisik', 'termin_fisik')}
                                            {renderInputCard('Termin External', 'termin_external')}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
                                            <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Sisa Sebelum Management</span>
                                                <span className="text-xs font-mono font-bold text-stone-800">{fmt(computed.termin.sisa_cash_sebelum_mgmt)}</span>
                                            </div>
                                            <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Management Fee</span>
                                                <span className="text-xs font-mono font-bold text-stone-800">{fmt(computed.termin.management)}</span>
                                            </div>
                                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                                                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Sisa Gaji / Cash Akhir</span>
                                                <span className="text-sm font-mono font-extrabold text-emerald-700 block mt-0.5">{fmt(computed.termin.sisa_cash)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fase Pelunasan Card */}
                                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-stone-100 bg-sky-50/30 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider">Fase III: Pelunasan</h3>
                                        <span className="text-xs font-mono font-bold text-sky-700">Total Cash: {fmt(computed.pelunasan.total_cash)}</span>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            {renderInputCard('Pelunasan Vendor', 'pelunasan_vendor')}
                                            {renderInputCard('Material Hutang Vendor', 'material_hutang_vendor_pel')}
                                            {renderInputCard('Pelunasan Fisik', 'pelunasan_fisik')}
                                            {renderInputCard('Pelunasan External', 'pelunasan_external')}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                            {renderInputCard('Addendum (Cadangan Gaji)', 'addendum_cadangan_gaji')}
                                            {renderInputCard('Pengeluaran Lain Lain', 'pengeluaran_lain_lain')}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                                            <div className="bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-bold uppercase block">Sisa Sebelum Management</span>
                                                <span className="text-xs font-mono font-bold text-stone-800">{fmt(computed.pelunasan.sisa_cash_sebelum_mgmt)}</span>
                                            </div>
                                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/50">
                                                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Management Fee Pelunasan</span>
                                                <span className="text-sm font-mono font-extrabold text-emerald-700 block mt-0.5">{fmt(computed.pelunasan.management)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-4 z-10 flex justify-end bg-white/80 backdrop-blur-md border border-stone-200/80 p-3 rounded-2xl shadow-lg max-w-5xl mx-auto">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-amber-500/10 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Data Cashflow'}
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </>
    );
}
