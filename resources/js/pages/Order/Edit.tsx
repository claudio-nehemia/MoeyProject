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

interface OrderData {
    id: number;
    nama_project: string;
    jenis_interior_id: number;
    company_name: string;
    customer_name: string;
    customer_additional_info: string | null;
    nomor_unit: string | null;
    phone_number: string;
    tanggal_masuk_customer: string;
    project_status: string;
    priority_level: string;
    mom_file: string | null;
}

interface Props {
    order: OrderData;
    marketings: User[];
    drafters: User[];
    desainers: User[];
    jenisInteriors: JenisInterior[];
    existingUserIds: number[];
}

export default function Edit({ order, marketings, drafters, desainers, jenisInteriors, existingUserIds }: Props) {
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
        nama_project: order.nama_project,
        jenis_interior_id: order.jenis_interior_id.toString(),
        company_name: order.company_name,
        customer_name: order.customer_name,
        customer_additional_info: order.customer_additional_info || '',
        nomor_unit: order.nomor_unit || '',
        phone_number: order.phone_number,
        tanggal_masuk_customer: order.tanggal_masuk_customer,
        project_status: order.project_status,
        priority_level: order.priority_level,
        mom_file: null as File | null,
        user_ids: [] as number[],
    });

    useEffect(() => {
        setMounted(true);
        // Set existing team members from order
        const marketingIds = marketings
            .filter(m => existingUserIds.includes(m.id))
            .map(m => m.id);
        const drafterIds = drafters
            .filter(d => existingUserIds.includes(d.id))
            .map(d => d.id);
        const desainerIds = desainers
            .filter(d => existingUserIds.includes(d.id))
            .map(d => d.id);
        
        setSelectedMarketings(marketingIds);
        setSelectedDrafters(drafterIds);
        setSelectedDesainers(desainerIds);
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
        console.log('=== DEBUG EDIT ORDER ===');
        console.log('Order ID:', order.id);
        console.log('Current errors object:', errors);
        console.log('Selected Marketing IDs:', selectedMarketings);
        console.log('Selected Drafter IDs:', selectedDrafters);
        console.log('Selected Designer IDs:', selectedDesainers);
        console.log('Form data user_ids:', data.user_ids);
        console.log('Full form data:', data);
        console.log('Has file:', data.mom_file ? 'Yes' : 'No');
        
        // Gunakan post dengan method PUT untuk support file upload
        // Inertia akan otomatis convert ke FormData jika ada File
        router.post(`/order/${order.id}`, {
            ...data,
            _method: 'PUT'
        }, {
            preserveScroll: true,
            onError: (errors) => {
                console.log('Validation errors received:', errors);
            },
            onSuccess: () => {
                console.log('Order updated successfully!');
            }
        });
    };


    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this order?')) {
            router.delete(`/order/${order.id}`);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <Head title="Edit Order" />

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
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-light text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Edit Order
                                    </h1>
                                    <p className="text-sm text-stone-500">Update project details and team assignment</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2.5 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white font-medium rounded-lg transition-all transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                        />
                                        {errors.tanggal_masuk_customer && <p className="text-red-500 text-xs mt-1">{errors.tanggal_masuk_customer}</p>}
                                    </div>

                                    {/* Project Status */}
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Project Status</label>
                                        <select
                                            value={data.project_status}
                                            onChange={(e) => setData('project_status', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                            className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
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
                                        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Enter any additional customer information"
                                    />
                                </div>

                                {/* MOM File Upload */}
                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-stone-700 mb-2">MOM File (Minutes of Meeting) - Optional</label>
                                    
                                    {/* Show existing file if available */}
                                    {order.mom_file && !data.mom_file && (
                                        <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-900">Current File</p>
                                                    <p className="text-xs text-blue-700">{order.mom_file.split('/').pop()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/storage/${order.mom_file}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setData('mom_file', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                                    />
                                    <p className="text-xs text-stone-500 mt-1">
                                        {order.mom_file && !data.mom_file 
                                            ? 'Upload a new file to replace the existing one' 
                                            : 'Supported formats: PDF, DOC, DOCX (Max 2MB)'}
                                    </p>
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
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                M
                                            </span>
                                            <h3 className="text-sm font-bold text-stone-800">Marketing Team</h3>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-600">
                                            Selected: {selectedMarketings.length} member{selectedMarketings.length !== 1 ? 's' : ''}
                                        </span>
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
                                                    <p className="font-semibold text-sm text-stone-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
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
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                D
                                            </span>
                                            <h3 className="text-sm font-bold text-stone-800">Drafter & Surveyor Team</h3>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-600">
                                            Selected: {selectedDrafters.length} member{selectedDrafters.length !== 1 ? 's' : ''}
                                        </span>
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
                                                    <p className="font-semibold text-sm text-stone-900 truncate">{user.name}</p>
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
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-stone-400 disabled:to-stone-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Updating...' : 'Update Order'}
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
