import { Head, useForm, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Pph21Setting {
    id: number;
    status_aktif: boolean;
    metode: 'TER' | 'PROGRESIF';
    metode_tanggungan: 'GROSS' | 'GROSS_UP';
    biaya_jabatan_persen: number;
    biaya_jabatan_max_bulan: number;
}

interface StatusKawin {
    kode_status_kawin: string;
    status_kawin: string;
    nilai_ptkp: number;
    kategori_ter: 'A' | 'B' | 'C';
}

interface Props {
    setting: Pph21Setting;
    statuskawin: StatusKawin[];
}

export function PphTabs({ active }: { active: 'settings' | 'formula' | 'ter' | 'progresif' | 'simulasi' }) {
    return (
        <div className="flex border-b border-stone-200 mb-5 font-sans overflow-x-auto">
            <Link
                href="/pph21"
                className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 whitespace-nowrap ${
                    active === 'settings'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
            >
                Pengaturan (Settings)
            </Link>
            <Link
                href="/pph21/formula"
                className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 whitespace-nowrap ${
                    active === 'formula'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
            >
                Formula Komponen
            </Link>
            <Link
                href="/pph21/ter"
                className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 whitespace-nowrap ${
                    active === 'ter'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
            >
                Tarif TER
            </Link>
            <Link
                href="/pph21/progresif"
                className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 whitespace-nowrap ${
                    active === 'progresif'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
            >
                Tarif Progresif
            </Link>
            <Link
                href="/pph21/simulasi"
                className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 whitespace-nowrap ${
                    active === 'simulasi'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
            >
                Simulasi Perhitungan
            </Link>
        </div>
    );
}

export default function Index({ setting, statuskawin }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        metode: setting?.metode || 'TER',
        metode_tanggungan: setting?.metode_tanggungan || 'GROSS',
        biaya_jabatan_persen: setting?.biaya_jabatan_persen || 5,
        biaya_jabatan_max_bulan: setting?.biaya_jabatan_max_bulan || 500000,
        status_aktif: setting?.status_aktif ?? true,
    });

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/pph21/update-setting');
    };

    const formatRupiah = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    return (
        <>
            <Head title="PPh 21 - Pengaturan" />
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            `}</style>
            
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pph21" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    
                    {/* Header */}
                    <div className={`mb-5 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <h1 className="text-2xl font-bold text-stone-900">PPh Pasal 21 Tax Management</h1>
                        <p className="text-xs text-stone-600">
                            Configure calculation method, PTKP values, progressive rates, and tax formula rules for income tax
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <PphTabs active="settings" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                        
                        {/* Settings Form Column */}
                        <div className={`lg:col-span-1 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-fit ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm">
                                Tax Calculation Settings
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs text-stone-600">
                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Status Pajak PPh 21</label>
                                    <select
                                        value={data.status_aktif ? '1' : '0'}
                                        onChange={e => setData('status_aktif', e.target.value === '1')}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="1">Aktif (Hitung PPh 21 dalam Slip)</option>
                                        <option value="0">Non-Aktif</option>
                                    </select>
                                    {errors.status_aktif && <p className="text-red-500 text-xxs mt-1">{errors.status_aktif}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Metode Perhitungan</label>
                                    <select
                                        value={data.metode}
                                        onChange={e => setData('metode', e.target.value as 'TER' | 'PROGRESIF')}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="TER">Metode TER (Tarif Efektif Rata-rata)</option>
                                        <option value="PROGRESIF">Metode Progresif (UU HPP)</option>
                                    </select>
                                    {errors.metode && <p className="text-red-500 text-xxs mt-1">{errors.metode}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Metode Tanggungan</label>
                                    <select
                                        value={data.metode_tanggungan}
                                        onChange={e => setData('metode_tanggungan', e.target.value as 'GROSS' | 'GROSS_UP')}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="GROSS">Gross (Potong Gaji Karyawan)</option>
                                        <option value="GROSS_UP">Gross Up (Tunjangan Pajak Perusahaan)</option>
                                    </select>
                                    {errors.metode_tanggungan && <p className="text-red-500 text-xxs mt-1">{errors.metode_tanggungan}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Biaya Jabatan (Persen %)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={data.biaya_jabatan_persen}
                                        onChange={e => setData('biaya_jabatan_persen', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. 5"
                                    />
                                    {errors.biaya_jabatan_persen && <p className="text-red-500 text-xxs mt-1">{errors.biaya_jabatan_persen}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Maksimal Biaya Jabatan (Per Bulan Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        value={data.biaya_jabatan_max_bulan}
                                        onChange={e => setData('biaya_jabatan_max_bulan', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. 500000"
                                    />
                                    {errors.biaya_jabatan_max_bulan && <p className="text-red-500 text-xxs mt-1">{errors.biaya_jabatan_max_bulan}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </button>
                            </form>
                        </div>

                        {/* PTKP Column */}
                        <div className={`lg:col-span-2 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                            <div className="px-4 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white font-bold text-sm">
                                PTKP Threshold Rates (Nilai PTKP & Kategori TER)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left text-stone-600 font-sans">
                                    <thead className="text-xs text-stone-700 font-semibold bg-stone-50 border-b border-stone-200">
                                        <tr>
                                            <th scope="col" className="px-4 py-2.5">Code</th>
                                            <th scope="col" className="px-4 py-2.5">Status Kawin</th>
                                            <th scope="col" className="px-4 py-2.5">Nilai PTKP (Annual)</th>
                                            <th scope="col" className="px-4 py-2.5">Kategori TER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statuskawin.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                                                    No PTKP records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            statuskawin.map(sk => (
                                                <tr key={sk.kode_status_kawin} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                    <td className="px-4 py-2.5 font-semibold text-stone-900">{sk.kode_status_kawin}</td>
                                                    <td className="px-4 py-2.5 font-medium">{sk.status_pajak || sk.status_kawin}</td>
                                                    <td className="px-4 py-2.5 text-stone-950 font-bold">{formatRupiah(sk.nilai_ptkp)}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Kategori {sk.kategori_ter}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
