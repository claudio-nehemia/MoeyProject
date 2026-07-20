import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { PphTabs } from './Index';

interface FormulaKomponen {
    id: number;
    nama_komponen: string;
    tipe: 'penambah' | 'pengurang';
    sumber: 'gaji_pokok' | 'tunjangan' | 'bpjs_kesehatan' | 'bpjs_tenagakerja' | 'lembur';
    kode_sumber: string | null;
    status_aktif: boolean;
    urutan: number;
}

interface JenisTunjangan {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
}

interface Props {
    komponens: FormulaKomponen[];
    jenistunjangan: JenisTunjangan[];
}

export default function Formula({ komponens, jenistunjangan }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        nama_komponen: '',
        tipe: 'penambah' as 'penambah' | 'pengurang',
        sumber: 'gaji_pokok' as 'gaji_pokok' | 'tunjangan' | 'bpjs_kesehatan' | 'bpjs_tenagakerja' | 'lembur',
        kode_sumber: '',
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

    const openCreateModal = () => {
        reset();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/pph21/formula/store', {
            onSuccess: () => closeModal(),
        });
    };

    const handleToggle = (id: number) => {
        router.post(`/pph21/formula/toggle/${id}`);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this component from the formula?')) {
            router.delete(`/pph21/formula/delete/${id}`);
        }
    };

    const formatSumber = (sumber: string, kodeSumber: string | null) => {
        const mapping: { [key: string]: string } = {
            gaji_pokok: 'Gaji Pokok',
            tunjangan: 'Tunjangan',
            bpjs_kesehatan: 'BPJS Kesehatan',
            bpjs_tenagakerja: 'BPJS Ketenagakerjaan',
            lembur: 'Lembur'
        };
        const text = mapping[sumber] || sumber;
        return kodeSumber ? `${text} (${kodeSumber})` : text;
    };

    return (
        <>
            <Head title="PPh 21 - Formula Komponen" />
            
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
                    <PphTabs active="formula" />

                    {/* Formula components layout */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                        <div className="px-4 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white flex justify-between items-center font-sans font-bold text-sm">
                            <span>Income Tax Component Formula Builder (Gross Income & Deductions)</span>
                            <button
                                onClick={openCreateModal}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow transition-colors"
                            >
                                Add Component
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600 font-sans">
                                <thead className="text-xs text-stone-700 font-semibold bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5 w-16 text-center">Urutan</th>
                                        <th scope="col" className="px-4 py-2.5">Component Name</th>
                                        <th scope="col" className="px-4 py-2.5">Type (Tipe)</th>
                                        <th scope="col" className="px-4 py-2.5">Source (Sumber Data)</th>
                                        <th scope="col" className="px-4 py-2.5 w-24 text-center">Status</th>
                                        <th scope="col" className="px-4 py-2.5 w-24 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {komponens.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                                No formula components defined. Click "Add Component" to configure gross salary or deductions components.
                                            </td>
                                        </tr>
                                    ) : (
                                        komponens.map((item, index) => (
                                            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5 text-center font-bold text-stone-900">{index + 1}</td>
                                                <td className="px-4 py-2.5 font-semibold text-stone-900">{item.nama_komponen}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold ${
                                                        item.tipe === 'penambah'
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        {item.tipe === 'penambah' ? 'Penambah Penghasilan' : 'Pengurang / Deductible'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-stone-850">
                                                    {formatSumber(item.sumber, item.kode_sumber)}
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle(item.id)}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xxs font-bold transition-all shadow-sm ${
                                                            item.status_aktif
                                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                                : 'bg-stone-300 hover:bg-stone-400 text-white'
                                                        }`}
                                                    >
                                                        {item.status_aktif ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
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

            {/* Create Component Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center">
                            <h3 className="font-bold text-sm">Add Formula Component</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-stone-600">
                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">Component Name (Nama Komponen)</label>
                                <input
                                    type="text"
                                    required
                                    value={data.nama_komponen}
                                    onChange={e => setData('nama_komponen', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. Tunjangan Transport Masuk Pph21"
                                />
                                {errors.nama_komponen && <p className="text-red-500 text-xxs mt-1">{errors.nama_komponen}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">Type (Tipe)</label>
                                <select
                                    required
                                    value={data.tipe}
                                    onChange={e => setData('tipe', e.target.value as 'penambah' | 'pengurang')}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="penambah">Penambah Penghasilan Bruto</option>
                                    <option value="pengurang">Pengurang Penghasilan / Deductible</option>
                                </select>
                                {errors.tipe && <p className="text-red-500 text-xxs mt-1">{errors.tipe}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">Data Source (Sumber Data)</label>
                                <select
                                    required
                                    value={data.sumber}
                                    onChange={e => setData('sumber', e.target.value as any)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="gaji_pokok">Basic Salary (Gaji Pokok)</option>
                                    <option value="tunjangan">Allowance (Tunjangan)</option>
                                    <option value="bpjs_kesehatan">BPJS Kesehatan</option>
                                    <option value="bpjs_tenagakerja">BPJS Ketenagakerjaan</option>
                                    <option value="lembur">Overtime (Lembur)</option>
                                </select>
                                {errors.sumber && <p className="text-red-500 text-xxs mt-1">{errors.sumber}</p>}
                            </div>

                            {data.sumber === 'tunjangan' && (
                                <div>
                                    <label className="block font-semibold text-stone-700 mb-1">Allowance Type (Jenis Tunjangan)</label>
                                    <select
                                        required
                                        value={data.kode_sumber}
                                        onChange={e => setData('kode_sumber', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                    >
                                        <option value="">Select Jenis Tunjangan...</option>
                                        {jenistunjangan.map(jt => (
                                            <option key={jt.kode_jenis_tunjangan} value={jt.kode_jenis_tunjangan}>
                                                {jt.jenis_tunjangan} ({jt.kode_jenis_tunjangan})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.kode_sumber && <p className="text-red-500 text-xxs mt-1">{errors.kode_sumber}</p>}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
