import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface SlipgajiHarian {
    kode_slip_gaji_harian: string;
    tanggal_slip: string;
    dari: string;
    sampai: string;
    status: string;
}

interface DetailKaryawan {
    nik: string;
    nama_karyawan: string;
    nik_show: string;
    nama_jabatan: string;
    nama_dept: string;
}

interface Props {
    slipgaji: SlipgajiHarian;
    detail: DetailKaryawan[];
}

export default function Show({ slipgaji, detail }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);
    const [selectedNiks, setSelectedNiks] = useState<string[]>(detail.map(d => d.nik));

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

    const handleToggleNik = (nik: string) => {
        if (selectedNiks.includes(nik)) {
            setSelectedNiks(selectedNiks.filter(n => n !== nik));
        } else {
            setSelectedNiks([...selectedNiks, nik]);
        }
    };

    const handleToggleAll = () => {
        if (selectedNiks.length === detail.length) {
            setSelectedNiks([]);
        } else {
            setSelectedNiks(detail.map(d => d.nik));
        }
    };

    const handlePrint = () => {
        if (selectedNiks.length === 0) {
            alert('Please select at least one employee to print!');
            return;
        }
        
        // Build url like: /slip-gaji-harian/cetak?dari=...&sampai=...&nik[]=...
        const dariDate = slipgaji.dari.split(' ')[0];
        const sampaiDate = slipgaji.sampai.split(' ')[0];
        const nikQuery = selectedNiks.map(nik => `nik[]=${encodeURIComponent(nik)}`).join('&');
        const printUrl = `/slip-gaji-harian/cetak?dari=${dariDate}&sampai=${sampaiDate}&${nikQuery}`;
        
        window.open(printUrl, '_blank');
    };

    return (
        <>
            <Head title={`Slip Gaji Harian - ${slipgaji.kode_slip_gaji_harian}`} />
            
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
            <Sidebar isOpen={sidebarOpen} currentPage="slip-gaji" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-20">
                    
                    {/* Header */}
                    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/slip-gaji" className="text-amber-600 hover:text-amber-700 font-medium text-xs flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Periods List
                                </Link>
                            </div>
                            <h1 className="text-2xl font-bold text-stone-900">
                                Daily Slips Detail: {slipgaji.kode_slip_gaji_harian}
                            </h1>
                            <p className="text-xs text-stone-600">
                                Date Period: <span className="font-semibold">{new Date(slipgaji.dari).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span> to <span className="font-semibold">{new Date(slipgaji.sampai).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                disabled={selectedNiks.length === 0}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Selected Slips ({selectedNiks.length})
                            </button>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className={`bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-4 font-sans ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-xxs font-semibold text-stone-500 uppercase">Slip Date</span>
                                <span className="text-xs font-bold text-stone-850">
                                    {new Date(slipgaji.tanggal_slip).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xxs font-semibold text-stone-500 uppercase">Total Employees</span>
                                <span className="text-xs font-bold text-stone-850">{detail.length} Persons</span>
                            </div>
                            <div>
                                <span className="block text-xxs font-semibold text-stone-500 uppercase">Status</span>
                                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xxs font-semibold ${
                                    slipgaji.status === '1'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                    {slipgaji.status === '1' ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xxs font-semibold text-stone-500 uppercase">Selection</span>
                                <span className="text-xs font-bold text-stone-850">
                                    {selectedNiks.length} of {detail.length} Selected
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <table className="w-full text-xs text-left text-stone-600 font-sans">
                            <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedNiks.length === detail.length}
                                            onChange={handleToggleAll}
                                            className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 border-stone-300 rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-4 py-2.5">No</th>
                                    <th scope="col" className="px-4 py-2.5">Employee (Karyawan)</th>
                                    <th scope="col" className="px-4 py-2.5">NIK</th>
                                    <th scope="col" className="px-4 py-2.5">Department</th>
                                    <th scope="col" className="px-4 py-2.5">Position</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                            No employees are registered in this daily slip period.
                                        </td>
                                    </tr>
                                ) : (
                                    detail.map((item, index) => {
                                        const checked = selectedNiks.includes(item.nik);
                                        return (
                                            <tr key={item.nik} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => handleToggleNik(item.nik)}
                                                        className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 border-stone-300 rounded cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="font-semibold text-stone-700">{index + 1}</span>
                                                </td>
                                                <td className="px-4 py-2.5 font-bold text-stone-900">{item.nama_karyawan}</td>
                                                <td className="px-4 py-2.5 font-mono text-stone-600 text-xxs">{item.nik_show}</td>
                                                <td className="px-4 py-2.5 text-stone-850 font-medium">{item.nama_dept}</td>
                                                <td className="px-4 py-2.5 text-stone-850 font-medium">{item.nama_jabatan}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
