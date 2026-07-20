import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface Slipgaji {
    kode_slip_gaji: string;
    bulan: number;
    tahun: number;
    status: string; // '0' or '1'
    jenis_upah: 'Bulanan' | 'Harian';
    created_at?: string;
    updated_at?: string;
}

interface SlipgajiHarian {
    kode_slip_gaji_harian: string;
    tanggal_slip: string;
    dari: string;
    sampai: string;
    status: string; // '0' or '1'
    detail_count?: number;
    created_at?: string;
    updated_at?: string;
}

interface Karyawan {
    nik: string;
    nik_show: string;
    nama_karyawan: string;
}

interface Props {
    slipgajis: Slipgaji[];
    slipgaji_harian: SlipgajiHarian[];
    list_bulan: { [key: number]: string };
    tahun_harian?: string;
}

export default function Index({ slipgajis, slipgaji_harian, list_bulan, tahun_harian }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [activeTab, setActiveTab] = useState<'bulanan' | 'harian'>('bulanan');
    const [mounted, setMounted] = useState(false);
    
    // Slips Modals
    const [showModalB, setShowModalB] = useState(false);
    const [editModeB, setEditModeB] = useState(false);
    const [selectedB, setSelectedB] = useState<Slipgaji | null>(null);

    const [showModalH, setShowModalH] = useState(false);
    const [editModeH, setEditModeH] = useState(false);
    const [selectedH, setSelectedH] = useState<SlipgajiHarian | null>(null);

    const [karyawans, setKaryawans] = useState<Karyawan[]>([]);
    const [selectedNiks, setSelectedNiks] = useState<string[]>([]);
    const [filterTahunHarian, setFilterTahunHarian] = useState(tahun_harian || new Date().getFullYear().toString());

    // Monthly Form
    const formB = useForm({
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        status: '0' as '0' | '1',
        jenis_upah: 'Bulanan' as 'Bulanan' | 'Harian'
    });

    // Daily Form
    const formH = useForm({
        dari: new Date().toISOString().split('T')[0],
        sampai: new Date().toISOString().split('T')[0],
        tanggal_slip: new Date().toISOString().split('T')[0],
        status: '0' as '0' | '1',
        nik: [] as string[]
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
        
        // Fetch karyawans from /gaji-pokok prop JSON
        fetch('/gaji-pokok', { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '1.0' } })
            .then(res => res.json())
            .then(json => {
                if (json.props && json.props.karyawans) {
                    setKaryawans(json.props.karyawans);
                }
            })
            .catch(err => console.error('Error fetching employees list:', err));

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Monthly Handlers
    const openCreateB = () => {
        setEditModeB(false);
        setSelectedB(null);
        formB.reset();
        setShowModalB(true);
    };

    const openEditB = (item: Slipgaji) => {
        setEditModeB(true);
        setSelectedB(item);
        formB.setData({
            bulan: item.bulan,
            tahun: item.tahun,
            status: item.status as '0' | '1',
            jenis_upah: item.jenis_upah
        });
        setShowModalB(true);
    };

    const handleSubmitB: FormEventHandler = (e) => {
        e.preventDefault();
        if (editModeB && selectedB) {
            formB.put(`/slip-gaji/${selectedB.kode_slip_gaji}`, {
                onSuccess: () => {
                    setShowModalB(false);
                    formB.reset();
                }
            });
        } else {
            formB.post('/slip-gaji', {
                onSuccess: () => {
                    setShowModalB(false);
                    formB.reset();
                }
            });
        }
    };

    const handleDeleteB = (kode: string) => {
        if (confirm('Are you sure you want to delete this monthly slip period?')) {
            router.delete(`/slip-gaji/${kode}`);
        }
    };

    const handleToggleStatusB = (item: Slipgaji) => {
        const newStatus = item.status === '1' ? '0' : '1';
        const actionText = newStatus === '1' ? 'Publish' : 'Set to Draft';
        if (confirm(`Are you sure you want to ${actionText} slip gaji for ${list_bulan[item.bulan]} ${item.tahun}?`)) {
            router.put(`/slip-gaji/${item.kode_slip_gaji}`, {
                bulan: item.bulan,
                tahun: item.tahun,
                jenis_upah: item.jenis_upah,
                status: newStatus
            });
        }
    };

    // Daily Handlers
    const openCreateH = () => {
        setEditModeH(false);
        setSelectedH(null);
        formH.reset();
        setSelectedNiks([]);
        setShowModalH(true);
    };

    const openEditH = (item: SlipgajiHarian) => {
        setEditModeH(true);
        setSelectedH(item);
        formH.setData({
            dari: item.dari.split(' ')[0],
            sampai: item.sampai.split(' ')[0],
            tanggal_slip: item.tanggal_slip.split(' ')[0],
            status: item.status as '0' | '1',
            nik: []
        });

        // Fetch detail employees for this slip
        fetch(`/slip-gaji-harian/${item.kode_slip_gaji_harian}`, { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '1.0' } })
            .then(res => res.json())
            .then(json => {
                if (json.props && json.props.detail) {
                    const niks = json.props.detail.map((d: any) => d.nik);
                    setSelectedNiks(niks);
                    formH.setData(prev => ({ ...prev, nik: niks }));
                }
            })
            .catch(err => console.error('Error fetching slip details:', err));

        setShowModalH(true);
    };

    const handleSubmitH: FormEventHandler = (e) => {
        e.preventDefault();
        
        // sync selectedNiks into form
        const formPayload = {
            ...formH.data,
            nik: selectedNiks
        };

        if (editModeH && selectedH) {
            router.put(`/slip-gaji-harian/${selectedH.kode_slip_gaji_harian}`, formPayload, {
                onSuccess: () => {
                    setShowModalH(false);
                    formH.reset();
                    setSelectedNiks([]);
                }
            });
        } else {
            router.post('/slip-gaji-harian', formPayload, {
                onSuccess: () => {
                    setShowModalH(false);
                    formH.reset();
                    setSelectedNiks([]);
                }
            });
        }
    };

    const handleDeleteH = (kode: string) => {
        if (confirm('Are you sure you want to delete this daily slip period? All detail employee slips will be deleted.')) {
            router.delete(`/slip-gaji-harian/${kode}`);
        }
    };

    const handleKaryawanToggle = (nik: string) => {
        if (selectedNiks.includes(nik)) {
            setSelectedNiks(selectedNiks.filter(n => n !== nik));
        } else {
            setSelectedNiks([...selectedNiks, nik]);
        }
    };

    const handleSelectAllKaryawan = () => {
        if (selectedNiks.length === karyawans.length) {
            setSelectedNiks([]);
        } else {
            setSelectedNiks(karyawans.map(k => k.nik));
        }
    };

    const handleYearHarianSearch = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const yr = e.target.value;
        setFilterTahunHarian(yr);
        router.get('/slip-gaji', { tahun_harian: yr }, { preserveState: true });
    };

    return (
        <>
            <Head title="Slip Gaji" />
            
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
                            <h1 className="text-2xl font-bold text-stone-900">Payslip Period (Slip Gaji)</h1>
                            <p className="text-xs text-stone-600">
                                Setup monthly or daily payslips generation and publish notifications to employees
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {activeTab === 'bulanan' ? (
                                <button
                                    onClick={openCreateB}
                                    className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Create Monthly period
                                </button>
                            ) : (
                                <>
                                    <select
                                        value={filterTahunHarian}
                                        onChange={handleYearHarianSearch}
                                        className="px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(yr => (
                                            <option key={yr} value={yr}>Tahun {yr}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={openCreateH}
                                        className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                    >
                                        Create Daily period
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-stone-200 mb-4 font-sans">
                        <button
                            onClick={() => setActiveTab('bulanan')}
                            className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 ${
                                activeTab === 'bulanan'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-stone-500 hover:text-stone-700'
                            }`}
                        >
                            Slip Gaji Bulanan (Monthly)
                        </button>
                        <button
                            onClick={() => setActiveTab('harian')}
                            className={`px-5 py-2.5 font-bold text-xs transition-colors border-b-2 ${
                                activeTab === 'harian'
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-transparent text-stone-500 hover:text-stone-700'
                            }`}
                        >
                            Slip Gaji Harian (Daily)
                        </button>
                    </div>

                    {/* Content tables */}
                    {activeTab === 'bulanan' ? (
                        <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                            <table className="w-full text-xs text-left text-stone-600 font-sans">
                                <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5">No</th>
                                        <th scope="col" className="px-4 py-2.5">Code (Kode)</th>
                                        <th scope="col" className="px-4 py-2.5">Bulan</th>
                                        <th scope="col" className="px-4 py-2.5">Tahun</th>
                                        <th scope="col" className="px-4 py-2.5">Type (Upah)</th>
                                        <th scope="col" className="px-4 py-2.5">Status</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slipgajis.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                                                No monthly payslips periods configured.
                                            </td>
                                        </tr>
                                    ) : (
                                        slipgajis.map((item, index) => (
                                            <tr key={item.kode_slip_gaji} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_slip_gaji}</td>
                                                <td className="px-4 py-2.5 font-medium text-stone-850">{list_bulan[item.bulan]}</td>
                                                <td className="px-4 py-2.5 text-stone-600">{item.tahun}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-2 py-0.5 rounded text-xxs font-bold bg-stone-100 text-stone-700">
                                                        {item.jenis_upah}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold ${
                                                        item.status === '1'
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                    }`}>
                                                        {item.status === '1' ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {item.status === '1' ? (
                                                            <button
                                                                onClick={() => handleToggleStatusB(item)}
                                                                className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                                                                title="Set back to Draft (Unpublish)"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggleStatusB(item)}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Publish Period & Notify Employees"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEditB(item)}
                                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteB(item.kode_slip_gaji)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                            <table className="w-full text-xs text-left text-stone-600 font-sans">
                                <thead className="text-xs text-stone-700 font-semibold bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5">No</th>
                                        <th scope="col" className="px-4 py-2.5">Code (Kode)</th>
                                        <th scope="col" className="px-4 py-2.5">Slip Date</th>
                                        <th scope="col" className="px-4 py-2.5">Start Date (Dari)</th>
                                        <th scope="col" className="px-4 py-2.5">End Date (Sampai)</th>
                                        <th scope="col" className="px-4 py-2.5">Employees Count</th>
                                        <th scope="col" className="px-4 py-2.5">Status</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slipgaji_harian.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                                                No daily payslips periods configured.
                                            </td>
                                        </tr>
                                    ) : (
                                        slipgaji_harian.map((item, index) => (
                                            <tr key={item.kode_slip_gaji_harian} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 font-semibold text-stone-900">{item.kode_slip_gaji_harian}</td>
                                                <td className="px-4 py-2.5 text-stone-850">
                                                    {new Date(item.tanggal_slip).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-2.5 text-stone-600">
                                                    {new Date(item.dari).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-2.5 text-stone-600">
                                                    {new Date(item.sampai).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-2.5 font-bold text-stone-800">
                                                    {item.detail_count ?? 0} Karyawan
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold ${
                                                        item.status === '1'
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                    }`}>
                                                        {item.status === '1' ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Link
                                                            href={`/slip-gaji-harian/${item.kode_slip_gaji_harian}`}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Detail Slips / Print"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => openEditH(item)}
                                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteH(item.kode_slip_gaji_harian)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Modal */}
            {showModalB && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editModeB ? 'Edit Monthly Period' : 'Add Monthly Period'}</h3>
                            <button onClick={() => setShowModalB(false)} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitB} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Month (Bulan)</label>
                                <select
                                    required
                                    value={formB.data.bulan}
                                    onChange={e => formB.setData('bulan', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    {Object.entries(list_bulan).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                                {formB.errors.bulan && <p className="text-red-500 text-xs mt-1">{formB.errors.bulan}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Year (Tahun)</label>
                                <select
                                    required
                                    value={formB.data.tahun}
                                    onChange={e => formB.setData('tahun', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                                {formB.errors.tahun && <p className="text-red-500 text-xs mt-1">{formB.errors.tahun}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Wage Type (Jenis Upah)</label>
                                <select
                                    required
                                    value={formB.data.jenis_upah}
                                    onChange={e => formB.setData('jenis_upah', e.target.value as 'Bulanan' | 'Harian')}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="Bulanan">Bulanan (Monthly)</option>
                                    <option value="Harian">Harian (Daily)</option>
                                </select>
                                {formB.errors.jenis_upah && <p className="text-red-500 text-xs mt-1">{formB.errors.jenis_upah}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                                <select
                                    required
                                    value={formB.data.status}
                                    onChange={e => formB.setData('status', e.target.value as '0' | '1')}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="0">Draft</option>
                                    <option value="1">Published (Notify Employees)</option>
                                </select>
                                {formB.errors.status && <p className="text-red-500 text-xs mt-1">{formB.errors.status}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModalB(false)}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formB.processing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow disabled:opacity-50"
                                >
                                    {formB.processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Daily Modal */}
            {showModalH && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">{editModeH ? 'Edit Daily Slip Period' : 'Add Daily Slip Period'}</h3>
                            <button onClick={() => setShowModalH(false)} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitH} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">Dari Tanggal (Start Date)</label>
                                    <input
                                        type="date"
                                        required
                                        value={formH.data.dari}
                                        onChange={e => formH.setData('dari', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    />
                                    {formH.errors.dari && <p className="text-red-500 text-xs mt-1">{formH.errors.dari}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1">Sampai Tanggal (End Date)</label>
                                    <input
                                        type="date"
                                        required
                                        value={formH.data.sampai}
                                        onChange={e => formH.setData('sampai', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    />
                                    {formH.errors.sampai && <p className="text-red-500 text-xs mt-1">{formH.errors.sampai}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal Slip (Slip Date)</label>
                                <input
                                    type="date"
                                    required
                                    value={formH.data.tanggal_slip}
                                    onChange={e => formH.setData('tanggal_slip', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                />
                                {formH.errors.tanggal_slip && <p className="text-red-500 text-xs mt-1">{formH.errors.tanggal_slip}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                                <select
                                    required
                                    value={formH.data.status}
                                    onChange={e => formH.setData('status', e.target.value as '0' | '1')}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="0">Draft</option>
                                    <option value="1">Published</option>
                                </select>
                                {formH.errors.status && <p className="text-red-500 text-xs mt-1">{formH.errors.status}</p>}
                            </div>

                            <div className="border-t border-stone-100 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-stone-900">Select Employees (Karyawan)</label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllKaryawan}
                                        className="text-xxs text-amber-600 hover:text-amber-700 underline font-semibold"
                                    >
                                        {selectedNiks.length === karyawans.length ? 'Clear All' : 'Select All'}
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-stone-200 rounded-lg p-2 bg-stone-50">
                                    {karyawans.map(k => {
                                        const checked = selectedNiks.includes(k.nik);
                                        return (
                                            <label key={k.nik} className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded cursor-pointer transition-colors text-xxs font-medium text-stone-700">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => handleKaryawanToggle(k.nik)}
                                                    className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 border-stone-300 rounded"
                                                />
                                                <span>{k.nama_karyawan} ({k.nik_show})</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                {formH.errors.nik && <p className="text-red-500 text-xs mt-1">{formH.errors.nik}</p>}
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModalH(false)}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formH.processing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow disabled:opacity-50"
                                >
                                    {formH.processing ? 'Generating...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
