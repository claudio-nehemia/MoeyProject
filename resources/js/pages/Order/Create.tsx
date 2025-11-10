import { useState, FormEventHandler, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface User {
    id: number;
    name: string;
    email: string;
}

interface JenisInterior {
    id: number;
    nama_interior: string;
}

interface Props {
    marketings: User[];
    drafters: User[];
    desainers: User[];
    jenisInteriors: JenisInterior[];
}

export default function Create({ marketings, drafters, desainers, jenisInteriors }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    const [mounted, setMounted] = useState(false);
    const [selectedMarketings, setSelectedMarketings] = useState<number[]>([]);
    const [selectedDrafters, setSelectedDrafters] = useState<number[]>([]);
    const [selectedDesainers, setSelectedDesainers] = useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        nama_project: '',
        jenis_interior_id: '',
        company_name: '',
        customer_name: '',
        customer_additional_info: '',
        nomor_unit: '',
        phone_number: '',
        tanggal_masuk_customer: '',
        project_status: 'pending',
        priority_level: 'medium',
        mom_file: null as File | null,
        user_ids: [] as number[],
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

    const handleUserToggle = (userId: number, category: 'marketing' | 'drafter' | 'desainer') => {
        if (category === 'marketing') {
            setSelectedMarketings(prev => {
                const newSelection = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(newSelection, selectedDrafters, selectedDesainers);
                return newSelection;
            });
        } else if (category === 'drafter') {
            setSelectedDrafters(prev => {
                const newSelection = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(selectedMarketings, newSelection, selectedDesainers);
                return newSelection;
            });
        } else {
            setSelectedDesainers(prev => {
                const newSelection = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(selectedMarketings, selectedDrafters, newSelection);
                return newSelection;
            });
        }
    };

    const updateUserIds = (marketings: number[], drafters: number[], designers: number[]) => {
        const allUserIds = [...marketings, ...drafters, ...designers];
        setData('user_ids', allUserIds);
        console.log('Updated user_ids in form data:', allUserIds);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // DEBUG: Log semua data yang akan dikirim
        console.log('=== DEBUG CREATE ORDER ===');
        console.log('Selected Marketing IDs:', selectedMarketings);
        console.log('Selected Drafter IDs:', selectedDrafters);
        console.log('Selected Designer IDs:', selectedDesainers);
        console.log('Form data user_ids:', data.user_ids);
        console.log('Full form data:', data);
        console.log('Has file:', data.mom_file ? 'Yes' : 'No');
        
        // Submit menggunakan router.post agar otomatis convert ke FormData jika ada file
        router.post('/order', data, {
            preserveScroll: true,
            onError: (errors) => {
                console.log('Validation errors received:', errors);
            },
            onSuccess: () => {
                console.log('Order created successfully!');
            }
        });
    };

    const isUserSelected = (userId: number): boolean => {
        return selectedMarketings.includes(userId) || selectedDrafters.includes(userId) || selectedDesainers.includes(userId);
    };

    if (!mounted) return null;

    return (
        <>
            <Head title="Create Order" />

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .fadeInUp {
                    animation: fadeInUp 0.5s ease-out forwards;
                }

                .user-card {
                    transition: all 0.2s ease;
                }

                .user-card:hover {
                    transform: translateY(-2px);
                }

                .user-card.selected {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
                    border: 2px solid rgb(59, 130, 246);
                }

                .checkbox-custom {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #cbd5e1;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .checkbox-custom:checked {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #2563eb;
                }

                .checkbox-custom:checked::after {
                    content: '✓';
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="order" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60">
                <div className="p-3 mt-12">
                    {/* Header */}
                    <div className={`mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Create New Order
                                </h1>
                                <p className="text-sm text-stone-500">Fill in the project details and assign team members</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className={`bg-white rounded-2xl shadow-lg border border-stone-200 p-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Section 1: Project Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-stone-800 mb-5 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</span>
                                    Project Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Project Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Project Name *</label>
                                        <input
                                            type="text"
                                            value={data.nama_project}
                                            onChange={(e) => setData('nama_project', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter project name"
                                        />
                                        {errors.nama_project && <p className="text-red-500 text-xs mt-1">{errors.nama_project}</p>}
                                    </div>

                                    {/* Interior Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Interior Type *</label>
                                        <select
                                            value={data.jenis_interior_id}
                                            onChange={(e) => setData('jenis_interior_id', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="">Select Interior Type</option>
                                            {jenisInteriors.map(interior => (
                                                <option key={interior.id} value={interior.id}>
                                                    {interior.nama_interior}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.jenis_interior_id && <p className="text-red-500 text-xs mt-1">{errors.jenis_interior_id}</p>}
                                    </div>

                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Company Name *</label>
                                        <input
                                            type="text"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter company name"
                                        />
                                        {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                                    </div>

                                    {/* Customer Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Customer Name *</label>
                                        <input
                                            type="text"
                                            value={data.customer_name}
                                            onChange={(e) => setData('customer_name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter customer name"
                                        />
                                        {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                                    </div>

                                    {/* Unit Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Unit Number</label>
                                        <input
                                            type="text"
                                            value={data.nomor_unit}
                                            onChange={(e) => setData('nomor_unit', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter unit number"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter phone number"
                                        />
                                        {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
                                    </div>

                                    {/* Entry Date */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Entry Date *</label>
                                        <input
                                            type="date"
                                            value={data.tanggal_masuk_customer}
                                            onChange={(e) => setData('tanggal_masuk_customer', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                        {errors.tanggal_masuk_customer && <p className="text-red-500 text-xs mt-1">{errors.tanggal_masuk_customer}</p>}
                                    </div>

                                    {/* Project Status */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Project Status</label>
                                        <select
                                            value={data.project_status}
                                            onChange={(e) => setData('project_status', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Priority Level */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Priority Level</label>
                                        <select
                                            value={data.priority_level}
                                            onChange={(e) => setData('priority_level', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">Additional Information</label>
                                    <textarea
                                        value={data.customer_additional_info}
                                        onChange={(e) => setData('customer_additional_info', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Enter any additional customer information"
                                    />
                                </div>

                                {/* MOM File Upload */}
                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">MOM File (Minutes of Meeting) - Optional</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setData('mom_file', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-1">Supported formats: PDF, DOC, DOCX (Max 2MB)</p>
                                    {errors.mom_file && <p className="text-red-500 text-xs mt-1">{errors.mom_file}</p>}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-stone-200"></div>

                            {/* Section 2: Team Assignment */}
                            <div>
                                <h2 className="text-lg font-semibold text-stone-800 mb-5 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">2</span>
                                    Team Assignment
                                </h2>

                                {/* Marketing Selection */}
                                <div className="mb-8">
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                                        <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-md">M</span>
                                            Marketing Team
                                        </h3>
                                        <p className="text-xs text-amber-700 ml-9">
                                            Selected: <span className="font-semibold">{selectedMarketings.length}</span> member{selectedMarketings.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {marketings.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserToggle(user.id, 'marketing')}
                                                className={`user-card p-4 border-2 rounded-xl cursor-pointer flex items-start gap-3 transition-all ${
                                                    selectedMarketings.includes(user.id)
                                                        ? 'selected border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                                                        : 'border-stone-200 hover:border-amber-300 hover:shadow-sm bg-white'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMarketings.includes(user.id)}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-stone-900 truncate text-sm">{user.name}</p>
                                                    <p className="text-xs text-stone-500 truncate mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {marketings.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">No marketing staff available</p>
                                    )}
                                </div>

                                {/* Drafter Selection */}
                                <div className="mb-8">
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4">
                                        <h3 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">D</span>
                                            Drafter & Surveyor Team
                                        </h3>
                                        <p className="text-xs text-emerald-700 ml-9">
                                            Selected: <span className="font-semibold">{selectedDrafters.length}</span> member{selectedDrafters.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {drafters.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserToggle(user.id, 'drafter')}
                                                className={`user-card p-4 border-2 rounded-xl cursor-pointer flex items-start gap-3 transition-all ${
                                                    selectedDrafters.includes(user.id)
                                                        ? 'selected border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md'
                                                        : 'border-stone-200 hover:border-emerald-300 hover:shadow-sm bg-white'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDrafters.includes(user.id)}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-stone-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {drafters.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">No drafter/surveyor staff available</p>
                                    )}
                                </div>

                                {/* Designer Selection */}
                                <div>
                                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                D
                                            </span>
                                            <h3 className="text-sm font-bold text-stone-800">Designer Team</h3>
                                        </div>
                                        <span className="text-xs font-semibold text-rose-600">
                                            Selected: {selectedDesainers.length} member{selectedDesainers.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {desainers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleUserToggle(user.id, 'desainer')}
                                                className={`user-card p-4 border-2 rounded-xl cursor-pointer flex items-start gap-3 transition-all ${
                                                    selectedDesainers.includes(user.id)
                                                        ? 'selected border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 shadow-md'
                                                        : 'border-stone-200 hover:border-rose-300 hover:shadow-sm bg-white'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDesainers.includes(user.id)}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-stone-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {desainers.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">No designer staff available</p>
                                    )}
                                </div>

                                {/* Team Summary */}
                                {(selectedMarketings.length > 0 || selectedDrafters.length > 0 || selectedDesainers.length > 0) && (
                                    <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-indigo-900">Team Summary</p>
                                                <p className="text-xs text-indigo-700">
                                                    <span className="font-semibold">{selectedMarketings.length + selectedDrafters.length + selectedDesainers.length}</span> total member{(selectedMarketings.length + selectedDrafters.length + selectedDesainers.length) !== 1 ? 's' : ''} selected
                                                    <span className="mx-2">•</span>
                                                    <span className="text-amber-600">{selectedMarketings.length} Marketing</span>
                                                    <span className="mx-2">•</span>
                                                    <span className="text-emerald-600">{selectedDrafters.length} Drafter</span>
                                                    <span className="mx-2">•</span>
                                                    <span className="text-rose-600">{selectedDesainers.length} Designer</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-8 border-t border-stone-200">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-stone-400 disabled:to-stone-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Creating...' : 'Create Order'}
                                </button>
                                <a
                                    href="/order"
                                    className="flex-1 px-6 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-center"
                                >
                                    Cancel
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
