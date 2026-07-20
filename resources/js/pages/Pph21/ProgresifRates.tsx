import { Head, useForm } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { PphTabs } from './Index';

interface ProgresifRate {
    id: number;
    pkp_dari: number;
    pkp_sampai: number | null;
    tarif_persen: number;
    status_aktif: boolean;
}

interface Props {
    rates: ProgresifRate[];
}

export default function ProgresifRates({ rates }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedRate, setSelectedRate] = useState<ProgresifRate | null>(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        pkp_dari: 0,
        pkp_sampai: '' as string | number,
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

    const openEditModal = (rate: ProgresifRate) => {
        setSelectedRate(rate);
        setData({
            pkp_dari: rate.pkp_dari,
            pkp_sampai: rate.pkp_sampai ?? '',
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
            put(`/pph21/progresif/update/${selectedRate.id}`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const formatRupiah = (val: number | string | null) => {
        if (val === null || val === '') return 'Keatas';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(val));
    };

    return (
        <>
            <Head title="PPh 21 - Tarif Progresif" />
            
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
                    <PphTabs active="progresif" />

                    {/* Progresif table list */}
                    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm ${mounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
                        <div className="px-4 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white font-bold text-xs">
                            Annual Progressive Tax Rate (PKP) Brackets - UU HPP
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-stone-600 font-sans">
                                <thead className="text-xs text-stone-700 font-semibold bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th scope="col" className="px-4 py-2.5">No</th>
                                        <th scope="col" className="px-4 py-2.5">PKP From (Penghasilan Kena Pajak Dari)</th>
                                        <th scope="col" className="px-4 py-2.5">PKP To (Penghasilan Kena Pajak Sampai)</th>
                                        <th scope="col" className="px-4 py-2.5">Tax Rate (Tarif Progresif %)</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                                        <th scope="col" className="px-4 py-2.5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rates.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                                                No progressive tax brackets available.
                                            </td>
                                        </tr>
                                    ) : (
                                        rates.map((item, index) => (
                                            <tr key={item.id} className="bg-white border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                                                <td className="px-4 py-2.5">{index + 1}</td>
                                                <td className="px-4 py-2.5 font-bold text-stone-900">{formatRupiah(item.pkp_dari)}</td>
                                                <td className="px-4 py-2.5 font-bold text-stone-900">{formatRupiah(item.pkp_sampai)}</td>
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
                            <h3>Edit Progressive Bracket Rate</h3>
                            <button onClick={closeModal} className="text-white hover:text-amber-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-stone-600">
                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">PKP From (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={data.pkp_dari}
                                    onChange={e => setData('pkp_dari', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 0"
                                    min={0}
                                />
                                {errors.pkp_dari && <p className="text-red-500 text-xxs mt-1">{errors.pkp_dari}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">PKP To (Rp - Empty for Keatas)</label>
                                <input
                                    type="number"
                                    value={data.pkp_sampai}
                                    onChange={e => setData('pkp_sampai', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 60000000"
                                    min={0}
                                />
                                {errors.pkp_sampai && <p className="text-red-500 text-xxs mt-1">{errors.pkp_sampai}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-700 mb-1">Progressive Rate (Tarif %)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={data.tarif_persen}
                                    onChange={e => setData('tarif_persen', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500"
                                    placeholder="e.g. 5"
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
