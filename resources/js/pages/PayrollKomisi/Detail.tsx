import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface KpiDetail {
    komponen: string;
    bobot: number;
    capaian: number;
    skor: number;
}

interface PositionConfig {
    id: number;
    divisi: string;
    jabatan: string;
    min_omzet_komisi_dp: number;
    min_omzet_achievement: number;
}

interface Slip {
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
    kpi_detail: KpiDetail[] | null;
    status: string;
    karyawan: {
        nik: string;
        nama_lengkap: string;
        jabatan?: { nama_jabatan: string };
    };
    position_config: PositionConfig | null;
}

interface Props {
    slip: Slip;
}

const BULAN_LABELS = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
};

const kpiStatusColor = (status: string | null) => {
    switch (status) {
        case 'Sangat Baik': return 'bg-emerald-500 text-white';
        case 'Baik': return 'bg-blue-500 text-white';
        case 'Cukup': return 'bg-amber-500 text-white';
        case 'Buruk': return 'bg-orange-500 text-white';
        case 'Sangat Buruk': return 'bg-red-500 text-white';
        default: return 'bg-gray-400 text-white';
    }
};

export default function Detail({ slip }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    const karyawan = slip.karyawan;
    const config = slip.position_config;
    const totalOmzet = slip.capaian_omzet_internal + slip.capaian_omzet_eksternal;

    return (
        <>
            <Head title={`Slip Gaji - ${karyawan?.nama_lengkap || slip.nik}`} />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="payroll-komisi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                        {/* Back button */}
                        <button
                            onClick={() => router.visit('/payroll-komisi')}
                            className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            ← Kembali ke Daftar
                        </button>

                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Header — mirip layout Excel */}
                            <div className="bg-red-700 text-white rounded-xl overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-xl font-bold uppercase">
                                                {config?.jabatan || karyawan?.jabatan?.nama_jabatan || '-'}
                                            </h1>
                                            <p className="text-red-200 text-sm mt-1">
                                                {config?.divisi || '-'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold">
                                                {karyawan?.nama_lengkap || slip.nik}
                                            </div>
                                            <div className="text-red-200 text-sm mt-1">
                                                {BULAN_LABELS[slip.bulan]} {slip.tahun}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Capaian Omzet */}
                                <div className="bg-red-800 px-6 py-3">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-red-300">Min. Target</span>
                                            <div className="font-bold">{formatCurrency(config?.min_omzet_komisi_dp || 0)}</div>
                                        </div>
                                        <div>
                                            <span className="text-red-300">Omzet Internal</span>
                                            <div className="font-bold">{formatCurrency(slip.capaian_omzet_internal)}</div>
                                        </div>
                                        <div>
                                            <span className="text-red-300">Omzet Eksternal</span>
                                            <div className="font-bold">{formatCurrency(slip.capaian_omzet_eksternal)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Komposisi Pendapatan */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-red-700 text-white px-6 py-3 font-bold text-sm">
                                    KOMPOSISI PENDAPATAN
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-red-50">
                                            <th className="px-6 py-2 text-left font-medium text-red-800">No</th>
                                            <th className="px-6 py-2 text-left font-medium text-red-800">Komposisi</th>
                                            <th className="px-6 py-2 text-right font-medium text-red-800">Hari</th>
                                            <th className="px-6 py-2 text-right font-medium text-red-800">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="px-6 py-2.5">1</td>
                                            <td className="px-6 py-2.5">Gaji Pokok</td>
                                            <td className="px-6 py-2.5 text-right">{slip.hari_kerja}</td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium">{formatCurrency(slip.gaji_pokok)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="px-6 py-2.5">2</td>
                                            <td className="px-6 py-2.5">Tunjangan Jabatan</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium">{formatCurrency(slip.tunjangan_jabatan)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="px-6 py-2.5">3</td>
                                            <td className="px-6 py-2.5">Transportasi</td>
                                            <td className="px-6 py-2.5 text-right">{slip.hari_hadir}</td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium">{formatCurrency(slip.transportasi)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="px-6 py-2.5">4</td>
                                            <td className="px-6 py-2.5">Makan</td>
                                            <td className="px-6 py-2.5 text-right">{slip.hari_hadir}</td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium">{formatCurrency(slip.makan)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="px-6 py-2.5">5</td>
                                            <td className="px-6 py-2.5">Kehadiran</td>
                                            <td className="px-6 py-2.5 text-right">{slip.hari_hadir}</td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium">{formatCurrency(slip.kehadiran)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 bg-blue-50">
                                            <td className="px-6 py-2.5">6</td>
                                            <td className="px-6 py-2.5 text-blue-700">Komisi CF</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium text-blue-700">{formatCurrency(slip.komisi_cf)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 bg-purple-50">
                                            <td className="px-6 py-2.5">7</td>
                                            <td className="px-6 py-2.5 text-purple-700">Komisi atas DP</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium text-purple-700">{formatCurrency(slip.komisi_dp)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 bg-purple-50">
                                            <td className="px-6 py-2.5">8</td>
                                            <td className="px-6 py-2.5 text-purple-700">Komisi Pelunasan</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium text-purple-700">{formatCurrency(slip.komisi_pelunasan)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 bg-emerald-50">
                                            <td className="px-6 py-2.5">9</td>
                                            <td className="px-6 py-2.5 text-emerald-700">Achievement Omzet</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium text-emerald-700">{formatCurrency(slip.achievement_omzet)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 bg-emerald-50">
                                            <td className="px-6 py-2.5">10</td>
                                            <td className="px-6 py-2.5 text-emerald-700">Achievement Pelaksanaan</td>
                                            <td className="px-6 py-2.5 text-right"></td>
                                            <td className="px-6 py-2.5 text-right font-mono font-medium text-emerald-700">{formatCurrency(slip.achievement_pelaksanaan)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Subtotals */}
                                <div className="border-t-2 border-gray-300">
                                    <div className="flex justify-between px-6 py-2.5 border-b border-gray-100 bg-yellow-50">
                                        <span className="font-bold text-yellow-800">Total Pendapatan Diluar Komisi</span>
                                        <span className="font-mono font-bold text-yellow-800">{formatCurrency(slip.total_pendapatan_diluar_komisi)}</span>
                                    </div>
                                    <div className="flex justify-between px-6 py-2.5 border-b border-gray-100 bg-blue-50">
                                        <span className="font-bold text-blue-800">Total Pendapatan CF</span>
                                        <span className="font-mono font-bold text-blue-800">{formatCurrency(slip.total_pendapatan_cf)}</span>
                                    </div>
                                    <div className="flex justify-between px-6 py-2.5 border-b border-gray-100 bg-purple-50">
                                        <span className="font-bold text-purple-800">Total Komisi & Achievement</span>
                                        <span className="font-mono font-bold text-purple-800">{formatCurrency(slip.total_pendapatan_komisi_achievement)}</span>
                                    </div>
                                    {slip.kasbon > 0 && (
                                        <div className="flex justify-between px-6 py-2.5 border-b border-gray-100 bg-red-50">
                                            <span className="font-bold text-red-700">Pembayaran Kasbon</span>
                                            <span className="font-mono font-bold text-red-700">-{formatCurrency(slip.kasbon)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between px-6 py-4 bg-gray-900 text-white">
                                        <span className="text-lg font-bold">TOTAL DITERIMA</span>
                                        <span className="text-2xl font-bold font-mono">{formatCurrency(slip.total_diterima)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Section */}
                            {slip.kpi_detail && slip.kpi_detail.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="bg-red-700 text-white px-6 py-3 font-bold text-sm flex justify-between items-center">
                                        <span>PRODUCTIVITY (KPI)</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold">{slip.kpi_skor}%</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${kpiStatusColor(slip.kpi_status)}`}>
                                                {slip.kpi_status}
                                            </span>
                                        </div>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-red-50">
                                                <th className="px-6 py-2 text-left font-medium text-red-800">No</th>
                                                <th className="px-6 py-2 text-left font-medium text-red-800">Komponen</th>
                                                <th className="px-6 py-2 text-right font-medium text-red-800">Bobot (%)</th>
                                                <th className="px-6 py-2 text-right font-medium text-red-800">Capaian (%)</th>
                                                <th className="px-6 py-2 text-right font-medium text-red-800">Skor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slip.kpi_detail.map((kpi, i) => (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className="px-6 py-2.5">{i + 1}</td>
                                                    <td className="px-6 py-2.5 capitalize">{kpi.komponen.replace('_', ' ')}</td>
                                                    <td className="px-6 py-2.5 text-right font-mono">{kpi.bobot}%</td>
                                                    <td className="px-6 py-2.5 text-right font-mono">{kpi.capaian.toFixed(2)}%</td>
                                                    <td className="px-6 py-2.5 text-right font-mono font-medium">{kpi.skor.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* KPI Rules */}
                                    <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 space-y-1">
                                        <p>📌 KPI "Sangat Baik" 9x dalam 1 tahun → kenaikan Gaji 10%</p>
                                        <p>📌 KPI "Cukup" 3 bulan berturut → Surat Peringatan (SP) 1</p>
                                        <p>📌 SP 1 + Status "Buruk" → Komisi & Tunjangan dihanguskan + SP 2</p>
                                    </div>
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </>
    );
}
