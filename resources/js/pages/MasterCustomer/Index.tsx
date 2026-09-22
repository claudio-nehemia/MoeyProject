import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
    Users,
    UserPlus,
    Key,
    Mail,
    Phone,
    Building2,
    CheckCircle2,
    AlertCircle,
    Search,
    Copy,
    Check,
    Eye,
    EyeOff,
    ShieldCheck,
    X,
    ExternalLink,
    RefreshCw,
    FolderKanban,
} from 'lucide-react';

interface OrderItem {
    id: number;
    nama_project: string;
    project_status: string;
    tahapan_proyek: string;
    created_at?: string;
}

interface CustomerUser {
    id: number;
    name: string;
    email: string;
    created_at?: string;
}

interface CustomerData {
    group_key: string;
    customer_name: string;
    customer_email: string;
    phone_number: string;
    alamat: string;
    company_name: string;
    orders: OrderItem[];
    user: CustomerUser | null;
    has_account: boolean;
}

interface Stats {
    total: number;
    with_account: number;
    without_account: number;
}

interface FlashCredentials {
    name: string;
    email: string;
    password: string;
}

interface FlashSuccess {
    title?: string;
    message?: string;
    credentials?: FlashCredentials;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    customers: Paginator<CustomerData>;
    stats: Stats;
    filters?: {
        search?: string;
        status?: 'all' | 'with_account' | 'without_account';
    };
    flash?: {
        success?: FlashSuccess | string;
        error?: string;
    };
}

export default function Index({ customers, stats, filters, flash }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const { auth, flash: pageFlash } = usePage<{
        auth: { user?: { permissions?: string[] } };
        flash?: { success?: FlashSuccess | string; error?: string };
    }>().props;
    const permissions = auth?.user?.permissions || [];
    const canCreate = permissions.includes('customer.create');
    const canEdit = permissions.includes('customer.edit');

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [filterStatus, setFilterStatus] = useState<'all' | 'with_account' | 'without_account'>(
        filters?.status || 'all',
    );

    // Modal Create Account State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Modal Reset Password State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetUser, setResetUser] = useState<CustomerUser | null>(null);
    const [resetPasswordVal, setResetPasswordVal] = useState('password123');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isResetSubmitting, setIsResetSubmitting] = useState(false);

    // Success Credentials Modal State
    const [successModalData, setSuccessModalData] = useState<FlashSuccess | null>(null);
    const [copied, setCopied] = useState(false);

    // Watch flash message from session
    useEffect(() => {
        const activeFlash = flash?.success || pageFlash?.success;
        if (activeFlash && typeof activeFlash === 'object' && activeFlash.credentials) {
            setSuccessModalData(activeFlash);
        }
    }, [flash, pageFlash]);

    // Debounce search input to query server
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    '/master-customer',
                    {
                        search: searchQuery,
                        status: filterStatus,
                        page: 1,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusFilterChange = (status: 'all' | 'with_account' | 'without_account') => {
        setFilterStatus(status);
        router.get(
            '/master-customer',
            {
                search: searchQuery,
                status: status,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const customerList = customers?.data || [];

    // Open modal create account
    const handleOpenCreateModal = (cust?: CustomerData) => {
        setFormError(null);
        setShowPassword(false);
        setFormPassword('password123');

        if (cust) {
            setSelectedCustomer(cust);
            setFormName(cust.customer_name);
            setFormEmail(cust.customer_email || '');
            setSelectedOrderIds(cust.orders.map((o) => o.id));
        } else {
            setSelectedCustomer(null);
            setFormName('');
            setFormEmail('');
            setSelectedOrderIds([]);
        }
        setIsCreateModalOpen(true);
    };

    // Open reset password modal
    const handleOpenResetModal = (user: CustomerUser) => {
        setResetUser(user);
        setResetPasswordVal('password123');
        setShowResetPassword(false);
        setIsResetModalOpen(true);
    };

    // Submit Create Account
    const handleSubmitCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEmail.trim()) {
            setFormError('Email customer wajib diisi.');
            return;
        }
        if (!formName.trim()) {
            setFormError('Nama customer wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        router.post(
            '/master-customer/create-account',
            {
                name: formName.trim(),
                email: formEmail.trim(),
                password: formPassword.trim(),
                order_ids: selectedOrderIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errors)[0] as string;
                    setFormError(msg || 'Terjadi kesalahan saat membuat akun.');
                },
            },
        );
    };

    // Submit Reset Password
    const handleSubmitResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUser) return;

        setIsResetSubmitting(true);
        router.post(
            `/master-customer/reset-password/${resetUser.id}`,
            {
                password: resetPasswordVal.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsResetModalOpen(false);
                    setIsResetSubmitting(false);
                },
                onError: () => {
                    setIsResetSubmitting(false);
                },
            },
        );
    };

    // Copy format WhatsApp
    const handleCopyWhatsApp = (creds: FlashCredentials) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const text = `Halo Bapak/Ibu ${creds.name},\n\nBerikut adalah akun akses Portal Customer MOEY untuk memantau progres proyek Anda secara real-time:\n\n🌐 Link Portal: ${origin}/login\n📧 Email: ${creds.email}\n🔑 Password: ${creds.password}\n\nSilakan login untuk melihat Desain, RAB, Kontrak, dan Progres Pekerjaan Anda. Terima kasih!`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <Head title="Master Data Customer Portal" />

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar
                isOpen={sidebarOpen}
                currentPage="master-customer"
                onClose={() => setSidebarOpen(false)}
            />

            <div className="p-4 lg:ml-60">
                <div className="mt-16 p-2 md:p-4">
                    {/* Header */}
                    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-blue-500/20">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-2xl font-light text-stone-800 md:text-3xl"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    Master Customer Portal
                                </h1>
                                <p className="text-sm text-stone-500">
                                    Daftar customer dari Order dan kelola akun akses ke Portal Customer
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleOpenCreateModal()}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:from-cyan-700 hover:to-blue-700 active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span>+ Buat Akun Customer Baru</span>
                        </button>
                    </div>

                    {/* Stats Metrics */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                                        Total Customer
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-stone-800">
                                        {stats?.total ?? customers.length}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-stone-400">
                                Total kontak customer terdaftar di seluruh order
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
                                        Akun Portal Aktif
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-emerald-600">
                                        {stats?.with_account ?? 0}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-stone-400">
                                Sudah memiliki akun login ke Portal Customer
                            </p>
                        </div>

                        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
                                        Belum Ada Akun
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-amber-600">
                                        {stats?.without_account ?? 0}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-stone-400">
                                Dapat dibuatkan akun portal hanya dengan 1-klik
                            </p>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama customer, email, nomor telepon, atau proyek..."
                                className="w-full rounded-xl border border-stone-200 py-2 pr-9 pl-9 text-sm text-stone-800 placeholder-stone-400 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        router.get(
                                            '/master-customer',
                                            { search: '', status: filterStatus, page: 1 },
                                            { preserveState: true, preserveScroll: true, replace: true },
                                        );
                                    }}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                                    title="Bersihkan pencarian"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-stone-500">Status:</span>
                            <div className="flex rounded-xl bg-stone-100 p-1">
                                <button
                                    onClick={() => handleStatusFilterChange('all')}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                        filterStatus === 'all'
                                            ? 'bg-white text-stone-800 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Semua ({stats?.total ?? 0})
                                </button>
                                <button
                                    onClick={() => handleStatusFilterChange('with_account')}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                        filterStatus === 'with_account'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Sudah Aktif ({stats?.with_account ?? 0})
                                </button>
                                <button
                                    onClick={() => handleStatusFilterChange('without_account')}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                                        filterStatus === 'without_account'
                                            ? 'bg-white text-amber-700 shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    Belum Ada Akun ({stats?.without_account ?? 0})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Customer Table */}
                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-stone-600 uppercase">
                                    <tr>
                                        <th className="px-5 py-4">Customer</th>
                                        <th className="px-5 py-4">Email di Order</th>
                                        <th className="px-5 py-4">Proyek Terkait</th>
                                        <th className="px-5 py-4">Status Akun Portal</th>
                                        <th className="px-5 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 text-stone-700">
                                    {customerList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-stone-400">
                                                <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                                <p className="font-medium text-stone-600">Tidak ada data customer</p>
                                                <p className="text-xs text-stone-400">
                                                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada data customer di order'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        customerList.map((cust) => (
                                            <tr key={cust.group_key} className="transition-colors hover:bg-stone-50/60">
                                                {/* Customer Details */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 font-semibold text-stone-700">
                                                            {cust.customer_name ? cust.customer_name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-stone-900">{cust.customer_name}</p>
                                                            {cust.company_name && cust.company_name !== '-' && (
                                                                <p className="flex items-center gap-1 text-xs text-stone-500">
                                                                    <Building2 className="h-3 w-3" />
                                                                    <span>{cust.company_name}</span>
                                                                </p>
                                                            )}
                                                            {cust.phone_number && cust.phone_number !== '-' && (
                                                                <p className="flex items-center gap-1 text-xs text-stone-500">
                                                                    <Phone className="h-3 w-3" />
                                                                    <span>{cust.phone_number}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email di Order */}
                                                <td className="px-5 py-4">
                                                    {cust.customer_email ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100/80">
                                                            <Mail className="h-3.5 w-3.5 text-blue-500" />
                                                            <span>{cust.customer_email}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-stone-400 italic">
                                                            (Belum ada email di order)
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Projects */}
                                                <td className="px-5 py-4">
                                                    {cust.orders.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                            {cust.orders.slice(0, 2).map((ord) => (
                                                                <span
                                                                    key={ord.id}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700"
                                                                    title={`Order #${ord.id}: ${ord.nama_project} (${ord.tahapan_proyek})`}
                                                                >
                                                                    <FolderKanban className="h-3 w-3 text-stone-400" />
                                                                    <span className="max-w-[120px] truncate">{ord.nama_project}</span>
                                                                </span>
                                                            ))}
                                                            {cust.orders.length > 2 && (
                                                                <span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500 font-medium">
                                                                    +{cust.orders.length - 2} lagi
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-stone-400">-</span>
                                                    )}
                                                </td>

                                                {/* Account Status */}
                                                <td className="px-5 py-4">
                                                    {cust.has_account ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex items-center gap-1 w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                                Akun Aktif
                                                            </span>
                                                            {cust.user && (
                                                                <span className="text-[11px] text-stone-500">
                                                                    Login: <span className="font-medium text-stone-700">{cust.user.email}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                                                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                                                Belum Ada Akun
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-center">
                                                    {cust.has_account ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {canEdit ? (
                                                                <button
                                                                    onClick={() => cust.user && handleOpenResetModal(cust.user)}
                                                                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50 hover:text-stone-900 transition-all active:scale-95"
                                                                    title="Reset Password Akun Customer"
                                                                >
                                                                    <Key className="h-3.5 w-3.5 text-stone-500" />
                                                                    <span>Reset Password</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-stone-400">Siap Digunakan</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        canCreate ? (
                                                            <button
                                                                onClick={() => handleOpenCreateModal(cust)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:from-cyan-700 hover:to-blue-700 transition-all active:scale-95"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                                <span>Buat Akun Portal</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-stone-400">Belum Ada Akun</span>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {customers?.links && customers.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-stone-200 bg-white px-5 py-3.5">
                                {/* Mobile Pagination */}
                                <div className="flex flex-1 justify-between sm:hidden">
                                    {customers.prev_page_url ? (
                                        <Link
                                            href={customers.prev_page_url}
                                            preserveScroll
                                            preserveState
                                            className="relative inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50"
                                        >
                                            Sebelumnya
                                        </Link>
                                    ) : (
                                        <span className="relative inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-400 cursor-not-allowed">
                                            Sebelumnya
                                        </span>
                                    )}
                                    {customers.next_page_url ? (
                                        <Link
                                            href={customers.next_page_url}
                                            preserveScroll
                                            preserveState
                                            className="relative ml-3 inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50"
                                        >
                                            Selanjutnya
                                        </Link>
                                    ) : (
                                        <span className="relative ml-3 inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-400 cursor-not-allowed">
                                            Selanjutnya
                                        </span>
                                    )}
                                </div>

                                {/* Desktop Pagination */}
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">
                                            Menampilkan <span className="font-bold text-stone-800">{customers.from || 0}</span> sampai{' '}
                                            <span className="font-bold text-stone-800">{customers.to || 0}</span> dari{' '}
                                            <span className="font-bold text-stone-800">{customers.total}</span> customer
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex -space-x-px rounded-lg shadow-2xs" aria-label="Pagination">
                                            {customers.links.map((link, idx) => {
                                                let label = link.label;
                                                if (label.includes('Previous') || label.includes('&laquo;')) {
                                                    label = '‹';
                                                } else if (label.includes('Next') || label.includes('&raquo;')) {
                                                    label = '›';
                                                }

                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="relative inline-flex items-center border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-400 cursor-not-allowed first:rounded-l-lg last:rounded-r-lg"
                                                            dangerouslySetInnerHTML={{ __html: label }}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveScroll
                                                        preserveState
                                                        className={`relative inline-flex items-center border px-3.5 py-1.5 text-xs font-bold transition-all first:rounded-l-lg last:rounded-r-lg ${
                                                            link.active
                                                                ? 'z-10 border-blue-600 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-2xs'
                                                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:text-blue-600'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: label }}
                                                    />
                                                );
                                            })}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL 1: BUAT AKUN PORTAL CUSTOMER */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
                        <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-stone-800">Buat Akun Portal Customer</h3>
                                    <p className="text-xs text-stone-500">Akses login customer untuk melihat proyeknya</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitCreateAccount} className="space-y-4">
                            {/* Nama Customer */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-700">
                                    Nama Customer *
                                </label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Masukkan nama customer"
                                    required
                                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Email Customer */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-700">
                                    Email Login Customer *
                                </label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="contoh: customer@gmail.com"
                                    required
                                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="mt-1 text-[11px] text-stone-400">
                                    Email ini digunakan untuk login ke portal customer
                                </p>
                            </div>

                            {/* Role (Auto Customer) */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-700">
                                    Role Akses
                                </label>
                                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-semibold text-emerald-900">Customer</span>
                                    </div>
                                    <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                                        Otomatis
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-stone-400">
                                    Role Customer otomatis diarahkan ke Portal Customer saat login
                                </p>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <label className="text-xs font-semibold text-stone-700">
                                        Password Akun *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
                                            let gen = '';
                                            for (let i = 0; i < 8; i++) {
                                                gen += chars.charAt(Math.floor(Math.random() * chars.length));
                                            }
                                            setFormPassword(gen);
                                            setShowPassword(true);
                                        }}
                                        className="text-[11px] font-medium text-blue-600 hover:underline"
                                    >
                                        Acak Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full rounded-xl border border-stone-300 pr-10 pl-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="mt-1 text-[11px] text-stone-400">
                                    Default: <span className="font-mono text-stone-600">password123</span> (bisa diubah sesuai keinginan)
                                </p>
                            </div>

                            {/* Proyek yang akan ditautkan */}
                            {selectedCustomer && selectedCustomer.orders.length > 0 && (
                                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                    <p className="mb-1.5 text-xs font-semibold text-stone-700">
                                        Proyek yang Otomatis Ditautkan ({selectedCustomer.orders.length}):
                                    </p>
                                    <div className="max-h-28 space-y-1 overflow-y-auto">
                                        {selectedCustomer.orders.map((o) => (
                                            <div key={o.id} className="flex items-center gap-2 text-xs text-stone-600">
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>#{o.id} - {o.nama_project}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="mt-6 flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2 text-xs font-medium text-white shadow-md shadow-blue-600/20 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            <span>Buat Akun Portal</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: RESET PASSWORD */}
            {isResetModalOpen && resetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-amber-600" />
                                <h3 className="font-semibold text-stone-800">Reset Password Customer</h3>
                            </div>
                            <button
                                onClick={() => setIsResetModalOpen(false)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitResetPassword} className="space-y-4">
                            <div>
                                <p className="text-xs text-stone-500">Customer:</p>
                                <p className="font-semibold text-stone-800">{resetUser.name}</p>
                                <p className="text-xs text-stone-500 font-mono">{resetUser.email}</p>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-stone-700">
                                    Password Baru *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showResetPassword ? 'text' : 'password'}
                                        value={resetPasswordVal}
                                        onChange={(e) => setResetPasswordVal(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full rounded-xl border border-stone-300 pr-10 pl-3.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetPassword(!showResetPassword)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                    >
                                        {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetSubmitting}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isResetSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: SUKSES & SALIN KREDENSIAL */}
            {successModalData && successModalData.credentials && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-stone-900">
                                {successModalData.title || 'Akun Portal Berhasil Dibuat!'}
                            </h3>
                            <p className="mt-1 text-xs text-stone-500">
                                {successModalData.message || 'Kredensial login berikut dapat langsung diberikan kepada customer'}
                            </p>
                        </div>

                        {/* Credentials Card */}
                        <div className="mb-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-stone-500">Nama Customer:</span>
                                <span className="font-semibold text-stone-800">{successModalData.credentials.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-stone-500">Role Akun:</span>
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                                    Customer
                                </span>
                            </div>
                            <div className="border-t border-stone-200 pt-2 flex justify-between items-center text-xs">
                                <span className="text-stone-500">Email Login:</span>
                                <span className="font-mono font-semibold text-blue-600">{successModalData.credentials.email}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-stone-500">Password:</span>
                                <span className="font-mono font-bold text-stone-900">{successModalData.credentials.password}</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={() => successModalData.credentials && handleCopyWhatsApp(successModalData.credentials)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-medium text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>Teks WhatsApp Berhasil Disalin!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span>Salin Format Pesan WhatsApp</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setSuccessModalData(null)}
                                className="w-full rounded-xl border border-stone-200 bg-white py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
