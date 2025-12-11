import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

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

export default function Create({
    marketings,
    drafters,
    desainers,
    jenisInteriors,
}: Props) {
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
        alamat: '',
        tanggal_masuk_customer: '',
        tanggal_survey: '',
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

        const today = new Date().toISOString().split('T')[0];
        setData('tanggal_masuk_customer', today);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleUserToggle = (
        userId: number,
        category: 'marketing' | 'drafter' | 'desainer',
    ) => {
        if (category === 'marketing') {
            setSelectedMarketings((prev) => {
                const newSelection = prev.includes(userId)
                    ? prev.filter((id) => id !== userId)
                    : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(
                    newSelection,
                    selectedDrafters,
                    selectedDesainers,
                );
                return newSelection;
            });
        } else if (category === 'drafter') {
            setSelectedDrafters((prev) => {
                const newSelection = prev.includes(userId)
                    ? prev.filter((id) => id !== userId)
                    : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(
                    selectedMarketings,
                    newSelection,
                    selectedDesainers,
                );
                return newSelection;
            });
        } else {
            setSelectedDesainers((prev) => {
                const newSelection = prev.includes(userId)
                    ? prev.filter((id) => id !== userId)
                    : [...prev, userId];
                // Update user_ids immediately
                updateUserIds(
                    selectedMarketings,
                    selectedDrafters,
                    newSelection,
                );
                return newSelection;
            });
        }
    };

    const updateUserIds = (
        marketings: number[],
        drafters: number[],
        designers: number[],
    ) => {
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
            },
        });
    };

    const isUserSelected = (userId: number): boolean => {
        return (
            selectedMarketings.includes(userId) ||
            selectedDrafters.includes(userId) ||
            selectedDesainers.includes(userId)
        );
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
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="order"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-3 lg:ml-60">
                <div className="mt-12 p-3">
                    {/* Header */}
                    <div
                        className={`mb-8 ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                    >
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1
                                    className="text-3xl font-light text-stone-800"
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                    }}
                                >
                                    Create New Order
                                </h1>
                                <p className="text-sm text-stone-500">
                                    Fill in the project details and assign team
                                    members
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div
                        className={`rounded-2xl border border-stone-200 bg-white p-8 shadow-lg ${mounted ? 'fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '0.1s' }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Section 1: Project Information */}
                            <div>
                                <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-stone-800">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                        1
                                    </span>
                                    Project Information
                                </h2>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Project Name */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Project Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama_project}
                                            onChange={(e) =>
                                                setData(
                                                    'nama_project',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter project name"
                                        />
                                        {errors.nama_project && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.nama_project}
                                            </p>
                                        )}
                                    </div>

                                    {/* Interior Type */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Interior Type *
                                        </label>
                                        <select
                                            value={data.jenis_interior_id}
                                            onChange={(e) =>
                                                setData(
                                                    'jenis_interior_id',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">
                                                Select Interior Type
                                            </option>
                                            {jenisInteriors.map((interior) => (
                                                <option
                                                    key={interior.id}
                                                    value={interior.id}
                                                >
                                                    {interior.nama_interior}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.jenis_interior_id && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.jenis_interior_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Company Name */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.company_name}
                                            onChange={(e) =>
                                                setData(
                                                    'company_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter company name"
                                        />
                                        {errors.company_name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.company_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Customer Name */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Customer Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.customer_name}
                                            onChange={(e) =>
                                                setData(
                                                    'customer_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter customer name"
                                        />
                                        {errors.customer_name && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.customer_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Unit Number */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Unit Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nomor_unit}
                                            onChange={(e) =>
                                                setData(
                                                    'nomor_unit',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter unit number"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.phone_number}
                                            onChange={(e) =>
                                                setData(
                                                    'phone_number',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter phone number"
                                        />
                                        {errors.phone_number && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.phone_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Entry Date */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Entry Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.tanggal_masuk_customer}
                                            readOnly
                                            className="w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-100 px-4 py-2.5"
                                        />

                                        {errors.tanggal_masuk_customer && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.tanggal_masuk_customer}
                                            </p>
                                        )}
                                    </div>

                                    {/* Project Status */}
                                    {/* <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Project Status
                                        </label>
                                        <select
                                            value={data.project_status}
                                            onChange={(e) =>
                                                setData(
                                                    'project_status',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">
                                                Pending
                                            </option>
                                            <option value="in_progress">
                                                In Progress
                                            </option>
                                            <option value="completed">
                                                Done
                                            </option>
                                        </select>
                                    </div> */}

                                    {/* Priority Level */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Priority Level
                                        </label>
                                        <select
                                            value={data.priority_level}
                                            onChange={(e) =>
                                                setData(
                                                    'priority_level',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">
                                                Medium
                                            </option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-stone-700">
                                            Survey Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.tanggal_survey}
                                            onChange={(e) =>
                                                setData(
                                                    'tanggal_survey',
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.tanggal_survey && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.tanggal_survey}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Alamat */}
                                <div className="mt-6">
                                    <label className="mb-2 block text-sm font-semibold text-stone-700">
                                        <span className="text-red-500">*</span> Alamat
                                    </label>
                                    <textarea
                                        value={data.alamat}
                                        onChange={(e) =>
                                            setData('alamat', e.target.value)
                                        }
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Masukkan alamat lengkap project"
                                        required
                                    />
                                    {errors.alamat && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.alamat}
                                        </p>
                                    )}
                                </div>

                                {/* Additional Info */}
                                <div className="mt-6">
                                    <label className="mb-2 block text-sm font-semibold text-stone-700">
                                        Additional Information
                                    </label>
                                    <textarea
                                        value={data.customer_additional_info}
                                        onChange={(e) =>
                                            setData(
                                                'customer_additional_info',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter any additional customer information"
                                    />
                                </div>

                                {/* MOM File Upload */}
                                <div className="mt-6">
                                    <label className="mb-2 block text-sm font-semibold text-stone-700">
                                        MOM File (Minutes of Meeting) - Optional
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) =>
                                            setData(
                                                'mom_file',
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="w-full rounded-lg border border-stone-300 px-4 py-2.5 transition-all outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-stone-500">
                                        Supported formats: PDF, DOC, DOCX (Max
                                        2MB)
                                    </p>
                                    {errors.mom_file && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.mom_file}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-stone-200"></div>

                            {/* Section 2: Team Assignment */}
                            <div>
                                <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-stone-800">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                                        2
                                    </span>
                                    Team Assignment
                                </h2>

                                {/* Marketing Selection */}
                                <div className="mb-8">
                                    <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                                        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-900">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white shadow-md">
                                                M
                                            </span>
                                            Marketing Team
                                        </h3>
                                        <p className="ml-9 text-xs text-amber-700">
                                            Selected:{' '}
                                            <span className="font-semibold">
                                                {selectedMarketings.length}
                                            </span>{' '}
                                            member
                                            {selectedMarketings.length !== 1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {marketings.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() =>
                                                    handleUserToggle(
                                                        user.id,
                                                        'marketing',
                                                    )
                                                }
                                                className={`user-card flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                                                    selectedMarketings.includes(
                                                        user.id,
                                                    )
                                                        ? 'selected border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                                                        : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMarketings.includes(
                                                        user.id,
                                                    )}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-stone-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-stone-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {marketings.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">
                                            No marketing staff available
                                        </p>
                                    )}
                                </div>

                                {/* Drafter Selection */}
                                <div className="mb-8">
                                    <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                                        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-900">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white shadow-md">
                                                D
                                            </span>
                                            Drafter & Surveyor Team
                                        </h3>
                                        <p className="ml-9 text-xs text-emerald-700">
                                            Selected:{' '}
                                            <span className="font-semibold">
                                                {selectedDrafters.length}
                                            </span>{' '}
                                            member
                                            {selectedDrafters.length !== 1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {drafters.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() =>
                                                    handleUserToggle(
                                                        user.id,
                                                        'drafter',
                                                    )
                                                }
                                                className={`user-card flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                                                    selectedDrafters.includes(
                                                        user.id,
                                                    )
                                                        ? 'selected border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md'
                                                        : 'border-stone-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDrafters.includes(
                                                        user.id,
                                                    )}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-stone-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-stone-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {drafters.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">
                                            No drafter/surveyor staff available
                                        </p>
                                    )}
                                </div>

                                {/* Designer Selection */}
                                <div>
                                    <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 text-xs font-bold text-white shadow-sm">
                                                D
                                            </span>
                                            <h3 className="text-sm font-bold text-stone-800">
                                                Designer Team
                                            </h3>
                                        </div>
                                        <span className="text-xs font-semibold text-rose-600">
                                            Selected: {selectedDesainers.length}{' '}
                                            member
                                            {selectedDesainers.length !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {desainers.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() =>
                                                    handleUserToggle(
                                                        user.id,
                                                        'desainer',
                                                    )
                                                }
                                                className={`user-card flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                                                    selectedDesainers.includes(
                                                        user.id,
                                                    )
                                                        ? 'selected border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 shadow-md'
                                                        : 'border-stone-200 bg-white hover:border-rose-300 hover:shadow-sm'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDesainers.includes(
                                                        user.id,
                                                    )}
                                                    onChange={() => {}}
                                                    className="checkbox-custom mt-0.5"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-stone-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-stone-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {desainers.length === 0 && (
                                        <p className="text-sm text-stone-400 italic">
                                            No designer staff available
                                        </p>
                                    )}
                                </div>

                                {/* Team Summary */}
                                {(selectedMarketings.length > 0 ||
                                    selectedDrafters.length > 0 ||
                                    selectedDesainers.length > 0) && (
                                    <div className="mt-6 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-white"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-indigo-900">
                                                    Team Summary
                                                </p>
                                                <p className="text-xs text-indigo-700">
                                                    <span className="font-semibold">
                                                        {selectedMarketings.length +
                                                            selectedDrafters.length +
                                                            selectedDesainers.length}
                                                    </span>{' '}
                                                    total member
                                                    {selectedMarketings.length +
                                                        selectedDrafters.length +
                                                        selectedDesainers.length !==
                                                    1
                                                        ? 's'
                                                        : ''}{' '}
                                                    selected
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span className="text-amber-600">
                                                        {
                                                            selectedMarketings.length
                                                        }{' '}
                                                        Marketing
                                                    </span>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span className="text-emerald-600">
                                                        {
                                                            selectedDrafters.length
                                                        }{' '}
                                                        Drafter
                                                    </span>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <span className="text-rose-600">
                                                        {
                                                            selectedDesainers.length
                                                        }{' '}
                                                        Designer
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 border-t border-stone-200 pt-8">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed disabled:from-stone-400 disabled:to-stone-400"
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Order'}
                                </button>
                                <a
                                    href="/order"
                                    className="flex-1 rounded-lg bg-stone-200 px-6 py-3 text-center font-semibold text-stone-800 shadow-md transition-all hover:bg-stone-300 hover:shadow-lg"
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
