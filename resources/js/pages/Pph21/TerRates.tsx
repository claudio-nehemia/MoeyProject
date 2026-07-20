import { Head, useForm } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { PphTabs } from './Index';

interface TerRate {
    id: number;
    kategori: 'A' | 'B' | 'C';
    penghasilan_dari: number;
    penghasilan_sampai: number | null;
    tarif_persen: number;
    status_aktif: boolean;
}

interface Props {
    terA: TerRate[];
    terB: TerRate[];
    terC: TerRate[];
}

export default function TerRates({ terA, terB, terC }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);
    const [subTab, setSubTab] = useState<'A' | 'B' | 'C'>('A');
    const [showModal, setShowModal] = useState(false);
    const [selectedRate, setSelectedRate] = useState<TerRate | null>(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        tarif_persen: 0,
        status_aktif: true,
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

    const openEditModal = (rate: TerRate) => {
        setSelectedRate(rate);
        setData({
            tarif_persen: rate.tarif_persen,
            status_aktif: rate.status_aktif,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRate(null);
        reset();
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (selectedRate) {
            put(`/pph21/ter/update/${selectedRate.id}`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const formatRupiah = (val: number | string | null) => {
        if (val === null) return 'Keatas';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    const activeList = subTab === 'A' ? terA : subTab === 'B' ? terB : terC;

    return (
        <>
            <Head title="PPh 21 - Tarif TER" />
            
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
                    <PphTabs active="ter" />

                    {/* Sub Tab Categories */}
                    <div className={`flex border-b border-stone-200 mb-4 font-sans ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        {(['A', 'B', 'C'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSubTab(cat)}
                                className={`px-4 py-2 font-bold text-xxs transition-colors border-b-2 ${
                                    subTab === cat
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-stone-500 hover:text-stone-700'
                                }`}
                            >
                                Kategori TER {cat}
                            </button>
                        ))}
                    </div>

                    {/* TER table list */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                        <div className="px-4 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white font-bold text-xs">
                            Average Effective Tax Rate (TER) Category {subTab} Rules
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600 font-sans">
                                <thead className="text-xs text-stone-700 font-semibold bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5">No</th>
                                        <th scope="col" className="px-4 py-2.5">Gross Income From (Penghasilan Dari)</th>
                                        <th scope="col" className="px-4 py-2.5">Gross Income To (Penghasilan Sampai)</th>
                                        <th scope="col" className="px-4 py-2.5">Tax Rate (Tarif TER)</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeList.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                                No TER rates available for Category {subTab}.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeList.map((item, index) => (
                                            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5">{index + 1}</td>
                                                <td className="px-4 py-2.5 font-bold text-stone-900">{formatRupiah(item.penghasilan_dari)}</td>
                                                <td className="px-4 py-2.5 font-bold text-stone-900">{formatRupiah(item.penghasilan_sampai)}</td>
                                                <td className="px-4 py-2.5 font-bold text-amber-600">{item.tarif_persen}%</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold ${
                                                        item.status_aktif
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                                                    }`}>
                                                        {item.status_aktif ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
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

            {/* Edit Rate Modal */}
            {showModal && selectedRate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 font-sans">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-stone-200 animate-fadeInUp">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center font-bold text-sm">
                            <h3>Edit TER Rate Rule</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-stone-600">
                            <div>
                                <label className="block text-stone-500">Kategori</label>
                                <span className="text-sm font-bold text-stone-900">Kategori {selectedRate.kategori}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-stone-500">From Income</label>
                                    <span className="text-xs font-semibold text-stone-850">{formatRupiah(selectedRate.penghasilan_dari)}</span>
                                </div>
                                <div>
                                    <label className="block text-stone-500">To Income</label>
                                    <span className="text-xs font-semibold text-stone-850">{formatRupiah(selectedRate.penghasilan_sampai)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">TER Rate (Tarif TER %)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={data.tarif_persen}
                                    onChange={e => setData('tarif_persen', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 0.25"
                                    min={0}
                                    max={100}
                                />
                                {errors.tarif_persen && <p className="text-red-500 text-xxs mt-1">{errors.tarif_persen}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">Status</label>
                                <select
                                    required
                                    value={data.status_aktif ? '1' : '0'}
                                    onChange={e => setData('status_aktif', e.target.value === '1')}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                                >
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                                {errors.status_aktif && <p className="text-red-500 text-xxs mt-1">{errors.status_aktif}</p>}
                            </div>

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
