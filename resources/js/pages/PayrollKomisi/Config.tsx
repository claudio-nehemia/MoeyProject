import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface KpiConfig {
    id: number;
    komponen: string;
    bobot: number;
    urutan: number;
}

interface PositionConfig {
    id: number;
    divisi: string;
    jabatan: string;
    kode_jabatan: string | null;
    gaji_pokok: number;
    gaji_pokok_harian: number;
    tunjangan_jabatan: number;
    tunjangan_jabatan_condition: string | null;
    tunjangan_jabatan_min_omzet: number;
    transportasi_harian: number;
    makan_harian: number;
    kehadiran_harian: number;
    cf_per_client: number;
    cf_max_per_bulan: number;
    komisi_dp_persen_internal: number;
    komisi_dp_persen_eksternal: number;
    komisi_dp_bayar_persen: number;
    min_omzet_komisi_dp: number;
    achievement_rate: number;
    min_omzet_achievement: number;
    achievement_fixed: number;
    hari_kerja_default: number;
    is_active: boolean;
    catatan: string | null;
    kpi_configs: KpiConfig[];
}

interface Props {
    configs: PositionConfig[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
};

const formatPersen = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
};

export default function Config({ configs }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { flash } = usePage().props as any;

    // Group by divisi
    const grouped: Record<string, PositionConfig[]> = {};
    configs.forEach(c => {
        if (!grouped[c.divisi]) grouped[c.divisi] = [];
        grouped[c.divisi].push(c);
    });

    const divisiColors: Record<string, string> = {
        'Design': 'border-l-indigo-500 bg-indigo-50',
        'Marketing': 'border-l-emerald-500 bg-emerald-50',
        'Team Tengah': 'border-l-amber-500 bg-amber-50',
        'Pelaksana Project': 'border-l-rose-500 bg-rose-50',
    };

    return (
        <>
            <Head title="Konfigurasi Payroll per Jabatan" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="payroll-komisi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                        {/* Back button */}
                        <button
                            onClick={() => router.visit('/payroll-komisi')}
                            className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            ← Kembali ke Payroll
                        </button>

                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">
                                ⚙️ Konfigurasi Payroll per Jabatan
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {configs.length} jabatan dari {Object.keys(grouped).length} divisi
                            </p>
                        </div>

                        {/* Flash */}
                        {flash?.success && (
                            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                                ✅ {flash.success}
                            </div>
                        )}

                        {/* Grouped Cards */}
                        <div className="space-y-8">
                            {Object.entries(grouped).map(([divisi, items]) => (
                                <div key={divisi}>
                                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${
                                            divisi === 'Design' ? 'bg-indigo-500' :
                                            divisi === 'Marketing' ? 'bg-emerald-500' :
                                            divisi === 'Team Tengah' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}></span>
                                        Divisi {divisi}
                                        <span className="text-sm font-normal text-gray-400">({items.length} jabatan)</span>
                                    </h2>

                                    <div className="space-y-3">
                                        {items.map(config => (
                                            <div
                                                key={config.id}
                                                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${divisiColors[divisi] || 'border-l-gray-400'} overflow-hidden`}
                                            >
                                                {/* Collapsed Header */}
                                                <div
                                                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                                    onClick={() => setExpandedId(expandedId === config.id ? null : config.id)}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div>
                                                            <div className="font-bold text-gray-900">{config.jabatan}</div>
                                                            <div className="text-xs text-gray-400">{config.kode_jabatan || '-'}</div>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Gaji Pokok:</span>{' '}
                                                            <span className="font-mono">Rp {formatCurrency(config.gaji_pokok)}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">CF:</span>{' '}
                                                            <span className="font-mono">Rp {formatCurrency(config.cf_per_client)}</span>
                                                            <span className="text-gray-400"> × {config.cf_max_per_bulan}/bln</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Komisi DP:</span>{' '}
                                                            <span className="font-mono">{formatPersen(config.komisi_dp_persen_internal)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs ${config.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {config.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                        <span className="text-gray-400">{expandedId === config.id ? '▲' : '▼'}</span>
                                                    </div>
                                                </div>

                                                {/* Expanded Detail */}
                                                {expandedId === config.id && (
                                                    <div className="border-t border-gray-200 px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            {/* Gaji & Tunjangan */}
                                                            <div>
                                                                <h4 className="font-bold text-gray-700 text-sm mb-2">💰 Gaji & Tunjangan</h4>
                                                                <div className="space-y-1 text-sm">
                                                                    <div className="flex justify-between"><span className="text-gray-500">Gaji Pokok</span><span className="font-mono">Rp {formatCurrency(config.gaji_pokok)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Gaji/Hari</span><span className="font-mono">Rp {formatCurrency(config.gaji_pokok_harian)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Tunjangan Jabatan</span><span className="font-mono">Rp {formatCurrency(config.tunjangan_jabatan)}</span></div>
                                                                    {config.tunjangan_jabatan_condition && (
                                                                        <div className="text-xs text-gray-400">
                                                                            Syarat: Omzet {'>'} Rp {formatCurrency(config.tunjangan_jabatan_min_omzet)}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between"><span className="text-gray-500">Transportasi/Hari</span><span className="font-mono">Rp {formatCurrency(config.transportasi_harian)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Makan/Hari</span><span className="font-mono">Rp {formatCurrency(config.makan_harian)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Kehadiran/Hari</span><span className="font-mono">Rp {formatCurrency(config.kehadiran_harian)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Hari Kerja Default</span><span className="font-mono">{config.hari_kerja_default}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Komisi */}
                                                            <div>
                                                                <h4 className="font-bold text-gray-700 text-sm mb-2">📊 Komisi & Achievement</h4>
                                                                <div className="space-y-1 text-sm">
                                                                    <div className="flex justify-between"><span className="text-gray-500">CF per Client</span><span className="font-mono">Rp {formatCurrency(config.cf_per_client)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Max CF/Bulan</span><span className="font-mono">{config.cf_max_per_bulan}×</span></div>
                                                                    <hr className="my-1" />
                                                                    <div className="flex justify-between"><span className="text-gray-500">Komisi DP (Int)</span><span className="font-mono">{formatPersen(config.komisi_dp_persen_internal)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Komisi DP (Ext)</span><span className="font-mono">{formatPersen(config.komisi_dp_persen_eksternal)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Bayar</span><span className="font-mono">{config.komisi_dp_bayar_persen}%</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Min Omzet Komisi</span><span className="font-mono">Rp {formatCurrency(config.min_omzet_komisi_dp)}</span></div>
                                                                    <hr className="my-1" />
                                                                    <div className="flex justify-between"><span className="text-gray-500">Achievement Rate</span><span className="font-mono">{formatPersen(config.achievement_rate)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Achievement Fixed</span><span className="font-mono">Rp {formatCurrency(config.achievement_fixed)}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500">Min Omzet Achievement</span><span className="font-mono">Rp {formatCurrency(config.min_omzet_achievement)}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* KPI */}
                                                            <div>
                                                                <h4 className="font-bold text-gray-700 text-sm mb-2">🎯 Bobot KPI</h4>
                                                                <div className="space-y-2">
                                                                    {config.kpi_configs.map((kpi, i) => (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className="flex-1">
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-gray-600 capitalize">{kpi.komponen.replace('_', ' ')}</span>
                                                                                    <span className="font-mono font-medium">{kpi.bobot}%</span>
                                                                                </div>
                                                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                                                                                    <div
                                                                                        className="bg-blue-500 rounded-full h-1.5 transition-all"
                                                                                        style={{ width: `${kpi.bobot}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {config.catatan && (
                                                                    <div className="mt-3 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                                                        📌 {config.catatan}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                </div>
            </div>
        </>
    );
}
