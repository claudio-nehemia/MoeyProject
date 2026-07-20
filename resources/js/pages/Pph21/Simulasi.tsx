import { Head } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { PphTabs } from './Index';

interface StatusKawin {
    kode_status_kawin: string;
    status_kawin: string;
    nilai_ptkp: number;
}

interface JenisTunjangan {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
}

interface FormulaKomponen {
    id: number;
    nama_komponen: string;
    tipe: 'penambah' | 'pengurang';
    sumber: 'gaji_pokok' | 'tunjangan' | 'bpjs_kesehatan' | 'bpjs_tenagakerja' | 'lembur';
    kode_sumber: string | null;
}

interface Props {
    statuskawin: StatusKawin[];
    jenistunjangan: JenisTunjangan[];
    komponens: FormulaKomponen[];
}

export default function Simulasi({ statuskawin, jenistunjangan, komponens }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);
    
    // Calculator fields
    const [gajiPokok, setGajiPokok] = useState('0');
    const [kodeStatusKawin, setKodeStatusKawin] = useState(statuskawin[0]?.kode_status_kawin || '');
    const [bulan, setBulan] = useState('1');
    const [bpjsKesehatan, setBpjsKesehatan] = useState('0');
    const [bpjsTenagakerja, setBpjsTenagakerja] = useState('0');
    const [lembur, setLembur] = useState('0');
    const [tunjanganVals, setTunjanganVals] = useState<{ [key: string]: string }>({});

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

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

    const handleTunjanganChange = (kodeJT: string, value: string) => {
        setTunjanganVals({
            ...tunjanganVals,
            [kodeJT]: value
        });
    };

    const handleCalculate: FormEventHandler = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setResult(null);

        // Convert string values to numbers
        const cleanTunjangans: { [key: string]: number } = {};
        Object.entries(tunjanganVals).forEach(([k, v]) => {
            cleanTunjangans[k] = Number(v) || 0;
        });

        const payload = {
            gaji_pokok: Number(gajiPokok) || 0,
            kode_status_kawin: kodeStatusKawin,
            bulan: Number(bulan) || 1,
            bpjs_kesehatan: Number(bpjsKesehatan) || 0,
            bpjs_tenagakerja: Number(bpjsTenagakerja) || 0,
            lembur: Number(lembur) || 0,
            tunjangan: cleanTunjangans
        };

        // CSRF Token fetch
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        fetch('/pph21/simulasi/hitung', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(async (res) => {
            const data = await res.json();
            if (res.ok && data.success) {
                setResult(data.data);
            } else {
                setErrorMsg(data.message || 'Gagal menghitung simulasi pajak.');
            }
        })
        .catch((err) => {
            console.error(err);
            setErrorMsg('Terjadi kesalahan koneksi server.');
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const formatRupiah = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    const list_bulan_id: { [key: number]: string } = {
        1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
        5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
        9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
    };

    return (
        <>
            <Head title="PPh 21 - Simulasi Pajak" />
            
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
                    <PphTabs active="simulasi" />

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 font-sans">
                        
                        {/* Simulation Form */}
                        <div className={`lg:col-span-2 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden h-fit ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs">
                                PPh 21 Tax Calculator (Simulasi Hitung Pajak)
                            </div>
                            <form onSubmit={handleCalculate} className="p-4 space-y-3.5 text-stone-600 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-stone-700 mb-1">Status PTKP Karyawan</label>
                                        <select
                                            value={kodeStatusKawin}
                                            onChange={e => setKodeStatusKawin(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                        >
                                            {statuskawin.map(sk => (
                                                <option key={sk.kode_status_kawin} value={sk.kode_status_kawin}>
                                                    {sk.kode_status_kawin} ({formatRupiah(sk.nilai_ptkp)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-stone-700 mb-1">Bulan Kerja ke-</label>
                                        <select
                                            value={bulan}
                                            onChange={e => setBulan(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                        >
                                            {Object.entries(list_bulan_id).map(([k, v]) => (
                                                <option key={k} value={k}>Bulan {k} ({v})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-stone-100 pt-2.5 space-y-3">
                                    <div>
                                        <label className="block font-semibold text-stone-700 mb-1">Gaji Pokok (Basic Salary Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            value={gajiPokok}
                                            onChange={e => setGajiPokok(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-stone-700 mb-1">Uang Lembur (Overtime Rp)</label>
                                        <input
                                            type="number"
                                            value={lembur}
                                            onChange={e => setLembur(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-stone-700 mb-1">BPJS Kesehatan (Rp)</label>
                                            <input
                                                type="number"
                                                value={bpjsKesehatan}
                                                onChange={e => setBpjsKesehatan(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-stone-700 mb-1">BPJS TK (Rp)</label>
                                            <input
                                                type="number"
                                                value={bpjsTenagakerja}
                                                onChange={e => setBpjsTenagakerja(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-stone-100 pt-2.5">
                                    <label className="block font-bold text-stone-900 mb-2">Tunjangan Lainnya (Allowances Rp)</label>
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                        {jenistunjangan.map(jt => (
                                            <div key={jt.kode_jenis_tunjangan}>
                                                <label className="block text-xxs font-semibold text-stone-600 mb-0.5">
                                                    {jt.jenis_tunjangan}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={tunjanganVals[jt.kode_jenis_tunjangan] || ''}
                                                    onChange={e => handleTunjanganChange(jt.kode_jenis_tunjangan, e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50 text-xs mt-3"
                                >
                                    {loading ? 'Calculating...' : 'Calculate Tax (Hitung Pajak)'}
                                </button>
                            </form>
                        </div>

                        {/* Calculation Results Breakdown */}
                        <div className="lg:col-span-3">
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-medium mb-4">
                                    {errorMsg}
                                </div>
                            )}

                            {result ? (
                                <div className={`bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden animate-fadeInUp`} style={{ animationDelay: '0.08s' }}>
                                    <div className="px-4 py-3 bg-gradient-to-r from-stone-850 to-stone-950 text-white font-bold text-xs flex justify-between items-center">
                                        <span>Calculation Results Breakdown</span>
                                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-bold text-xxs">
                                            Metode: {result.metode || 'TER'}
                                        </span>
                                    </div>

                                    {/* Breakdown Rows */}
                                    <div className="p-4 space-y-4 text-xs font-sans text-stone-600">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-stone-100 pb-3">
                                            <div>
                                                <span className="block text-stone-500 text-xxs font-semibold uppercase">Status Pajak</span>
                                                <span className="text-stone-900 font-bold">{result.nama_status_kawin || '-'} ({result.kode_status_kawin})</span>
                                            </div>
                                            <div>
                                                <span className="block text-stone-500 text-xxs font-semibold uppercase">Nilai PTKP (Annual)</span>
                                                <span className="text-stone-900 font-bold">{formatRupiah(result.nilai_ptkp || 0)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 border-b border-stone-100 pb-3">
                                            <div className="flex justify-between font-semibold">
                                                <span>Penghasilan Bruto (Gross Income)</span>
                                                <span className="text-stone-950 font-bold">{formatRupiah(result.penghasilan_bruto || 0)}</span>
                                            </div>
                                            
                                            {/* Deductions if progressive */}
                                            {result.biaya_jabatan > 0 && (
                                                <div className="flex justify-between text-stone-500 pl-4">
                                                    <span>Deduction: Biaya Jabatan</span>
                                                    <span>-{formatRupiah(result.biaya_jabatan)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between font-semibold pt-1">
                                                <span>Penghasilan Netto (Net Income)</span>
                                                <span className="text-stone-900 font-bold">{formatRupiah(result.penghasilan_neto || 0)}</span>
                                            </div>
                                        </div>

                                        {result.metode === 'PROGRESIF' && (
                                            <div className="space-y-2 border-b border-stone-100 pb-3">
                                                <div className="flex justify-between font-medium">
                                                    <span>Penghasilan Netto Disetahunkan</span>
                                                    <span className="text-stone-850 font-bold">{formatRupiah(result.penghasilan_neto_setahun || 0)}</span>
                                                </div>
                                                <div className="flex justify-between font-medium text-red-600">
                                                    <span>PTKP (Tanggungan Gaji)</span>
                                                    <span>-{formatRupiah(result.nilai_ptkp || 0)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-stone-900">
                                                    <span>PKP (Penghasilan Kena Pajak Tahunan)</span>
                                                    <span>{formatRupiah(result.pkp || 0)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {result.metode === 'TER' && (
                                            <div className="space-y-2 border-b border-stone-100 pb-3">
                                                <div className="flex justify-between font-medium">
                                                    <span>Kategori TER</span>
                                                    <span className="font-bold text-stone-900">Kategori {result.kategori_ter || '-'}</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                    <span>Tarif TER Efektif Rata-rata</span>
                                                    <span className="font-bold text-amber-600">{result.tarif_persen || 0}%</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Total PPh 21 Box */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                            <div>
                                                <span className="block text-xxs font-bold text-amber-700 uppercase">PPh 21 Pajak Terutang (Bulan Ini)</span>
                                                <p className="text-xxs text-amber-600 mt-0.5">Calculated based on {result.metode === 'TER' ? 'Tarif TER Efektif Rata-rata' : 'Tarif Lapisan Progresif PKP'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-stone-900">
                                                    {formatRupiah(result.pph21 || result.pph21_sebulan || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-stone-200 border-dashed rounded-xl bg-stone-50/50 p-12 text-center text-stone-400 text-xs font-sans h-full flex flex-col items-center justify-center">
                                    <svg className="w-12 h-12 text-stone-300 mb-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="font-medium text-stone-600">No Calculation Done Yet</p>
                                    <p className="text-xxs text-stone-400 mt-1">Enter tax data on the left form and click "Calculate Tax" to see the tax calculation breakdown.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
