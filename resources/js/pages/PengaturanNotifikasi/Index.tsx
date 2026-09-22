import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
    Settings, ClipboardList, Clock, HelpCircle, Search, Check, X, 
    Bell, Smartphone, FlaskConical, Edit3, Target, AlertTriangle, 
    Coins, CreditCard 
} from 'lucide-react';

interface RoleItem {
    id: number;
    nama_role: string;
}

interface NotificationSettingItem {
    id: number;
    event_key: string;
    category: 'order_stage' | 'reminder' | 'system';
    nama_pengaturan: string;
    deskripsi: string | null;
    is_active: boolean;
    send_database: boolean;
    send_fcm: boolean;
    recipient_type: 'order_team' | 'all_by_role';
    target_role_ids: number[] | null;
    send_to_management: boolean;
    management_role_ids: number[] | null;
    days_offset: number;
    title_template: string;
    message_template: string;
    action_url: string | null;
    available_placeholders: string[] | null;
}

interface Props {
    settings: NotificationSettingItem[];
    roles: RoleItem[];
}

export default function Index({ settings, roles }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    const [activeTab, setActiveTab] = useState<'stage' | 'reminder' | 'guide'>('stage');
    const [search, setSearch] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Modal state
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editingSetting, setEditingSetting] = useState<NotificationSettingItem | null>(null);
    const [formData, setFormData] = useState<Partial<NotificationSettingItem>>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [testSendingId, setTestSendingId] = useState<number | null>(null);

    // Filtered lists
    const stageSettings = useMemo(() => {
        return settings.filter(s => s.category === 'order_stage' && (
            !search ||
            s.nama_pengaturan.toLowerCase().includes(search.toLowerCase()) ||
            s.event_key.toLowerCase().includes(search.toLowerCase()) ||
            s.title_template.toLowerCase().includes(search.toLowerCase())
        ));
    }, [settings, search]);

    const reminderSettings = useMemo(() => {
        return settings.filter(s => s.category === 'reminder');
    }, [settings]);

    // Role map helper
    const roleMap = useMemo(() => {
        const map = new Map<number, string>();
        roles.forEach(r => map.set(r.id, r.nama_role));
        return map;
    }, [roles]);

    // Quick toggle handler
    const handleQuickToggle = (id: number, field: 'is_active' | 'send_database' | 'send_fcm' | 'send_to_management', currentValue: boolean) => {
        router.patch(`/pengaturan-notifikasi/${id}/quick-toggle`, {
            field,
            value: !currentValue,
        }, {
            preserveScroll: true,
        });
    };

    // Open edit modal
    const openEditModal = (setting: NotificationSettingItem) => {
        setEditingSetting(setting);
        setFormData({
            nama_pengaturan: setting.nama_pengaturan,
            deskripsi: setting.deskripsi || '',
            is_active: setting.is_active,
            send_database: setting.send_database,
            send_fcm: setting.send_fcm,
            recipient_type: setting.recipient_type,
            target_role_ids: setting.target_role_ids || [],
            send_to_management: setting.send_to_management,
            management_role_ids: setting.management_role_ids || [],
            days_offset: setting.days_offset || 0,
            title_template: setting.title_template,
            message_template: setting.message_template,
            action_url: setting.action_url || '',
        });
        setModalOpen(true);
    };

    // Save modal edits
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSetting) return;

        setSubmitting(true);
        router.put(`/pengaturan-notifikasi/${editingSetting.id}`, formData as any, {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    // Test send
    const handleTestSend = (id: number) => {
        setTestSendingId(id);
        router.post(`/pengaturan-notifikasi/${id}/test-send`, {}, {
            preserveScroll: true,
            onFinish: () => setTestSendingId(null),
        });
    };

    // Toggle role selection in target_role_ids
    const toggleTargetRole = (roleId: number) => {
        const current = formData.target_role_ids || [];
        if (current.includes(roleId)) {
            setFormData({ ...formData, target_role_ids: current.filter(id => id !== roleId) });
        } else {
            setFormData({ ...formData, target_role_ids: [...current, roleId] });
        }
    };

    // Toggle role selection in management_role_ids
    const toggleManagementRole = (roleId: number) => {
        const current = formData.management_role_ids || [];
        if (current.includes(roleId)) {
            setFormData({ ...formData, management_role_ids: current.filter(id => id !== roleId) });
        } else {
            setFormData({ ...formData, management_role_ids: [...current, roleId] });
        }
    };

    // Insert placeholder tag into message or title
    const insertPlaceholder = (target: 'title' | 'message', placeholder: string) => {
        if (target === 'title') {
            const current = formData.title_template || '';
            setFormData({ ...formData, title_template: current + ' ' + placeholder });
        } else {
            const current = formData.message_template || '';
            setFormData({ ...formData, message_template: current + ' ' + placeholder });
        }
    };

    // Stats calculations
    const totalActive = settings.filter(s => s.is_active).length;
    const totalFcmActive = settings.filter(s => s.send_fcm && s.is_active).length;
    const totalDbActive = settings.filter(s => s.send_database && s.is_active).length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Head title="Pengaturan Notifikasi Dinamis" />
            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pengaturan-notifikasi" onClose={() => setSidebarOpen(false)} />

            <main className="p-4 lg:ml-60 pt-20 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-violet-100 text-xs font-semibold backdrop-blur-sm mb-3">
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Konfigurasi Sistem Dinamis</span>
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                                    Pengaturan Notifikasi & Pengingat
                                </h1>
                                <p className="text-violet-200 text-sm mt-1 max-w-2xl">
                                    Atur seluruh alur pengiriman notifikasi tahapan order, target role penerima, pengingat deadline tugas, jatuh tempo pembayaran, dan template pesan secara dinamis tanpa hardcode.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveTab('stage')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                        activeTab === 'stage'
                                            ? 'bg-white text-violet-900 shadow-md'
                                            : 'bg-white/15 hover:bg-white/25 text-white'
                                    }`}
                                >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>Tahapan Order ({stageSettings.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('reminder')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                        activeTab === 'reminder'
                                            ? 'bg-white text-violet-900 shadow-md'
                                            : 'bg-white/15 hover:bg-white/25 text-white'
                                    }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pengingat Otomatis ({reminderSettings.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('guide')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                        activeTab === 'guide'
                                            ? 'bg-white text-violet-900 shadow-md'
                                            : 'bg-white/15 hover:bg-white/25 text-white'
                                    }`}
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>Panduan Variabel</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
                            <span className="text-xs font-medium text-slate-500">Total Pengaturan</span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-800">{settings.length}</span>
                                <span className="text-xs text-slate-400">Modul</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
                            <span className="text-xs font-medium text-emerald-600">Notifikasi Aktif</span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-600">{totalActive}</span>
                                <span className="text-xs text-slate-400">/ {settings.length}</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
                            <span className="text-xs font-medium text-indigo-600">Kanal Push FCM</span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-indigo-600">{totalFcmActive}</span>
                                <span className="text-xs text-slate-400">Aktif</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
                            <span className="text-xs font-medium text-violet-600">In-App Database</span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-violet-600">{totalDbActive}</span>
                                <span className="text-xs text-slate-400">Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* TAB 1: TAHAPAN ORDER */}
                    {activeTab === 'stage' && (
                        <div className="space-y-4">
                            {/* Search & Filter Bar */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="relative w-full sm:w-80">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <Search className="w-3.5 h-3.5" />
                                    </span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Cari tahapan, event key, template..."
                                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="text-xs text-slate-500">
                                    Menampilkan <span className="font-bold text-slate-700">{stageSettings.length}</span> alur tahapan proyek
                                </div>
                            </div>

                            {/* Stage Items Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stageSettings.map(setting => (
                                    <div
                                        key={setting.id}
                                        className={`bg-white rounded-xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                                            setting.is_active ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="p-4 space-y-3">
                                            {/* Header Card */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className="text-sm font-bold text-slate-800">
                                                            {setting.nama_pengaturan}
                                                        </h3>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {setting.event_key}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleQuickToggle(setting.id, 'is_active', setting.is_active)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-colors ${
                                                        setting.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                    }`}
                                                >
                                                    {setting.is_active ? '● AKTIF' : '○ NONAKTIF'}
                                                </button>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {setting.deskripsi || 'Tidak ada deskripsi.'}
                                            </p>

                                            {/* Recipients Roles */}
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                    Penerima Utama ({setting.recipient_type === 'order_team' ? 'Tim Proyek' : 'Semua Staf'}):
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {setting.target_role_ids && setting.target_role_ids.length > 0 ? (
                                                        setting.target_role_ids.map(rid => (
                                                            <span
                                                                key={rid}
                                                                className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-semibold"
                                                            >
                                                                {roleMap.get(rid) || `Role #${rid}`}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">Belum ada role diatur</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Management Copy */}
                                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                                                <span className="text-slate-500">Tembusan Manajemen (KM, PM, SPV):</span>
                                                <button
                                                    onClick={() => handleQuickToggle(setting.id, 'send_to_management', setting.send_to_management)}
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                                        setting.send_to_management
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {setting.send_to_management ? (
                                                        <>
                                                            <Check className="w-2.5 h-2.5" /> Ya
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-2.5 h-2.5" /> Tidak
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Delivery Channels */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => handleQuickToggle(setting.id, 'send_database', setting.send_database)}
                                                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                                                        setting.send_database
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                    title="In-App Database Notification"
                                                >
                                                    <Bell className="w-3 h-3" />
                                                    <span>In-App</span>
                                                    {setting.send_database ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleQuickToggle(setting.id, 'send_fcm', setting.send_fcm)}
                                                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                                                        setting.send_fcm
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                    title="Firebase Cloud Messaging Push"
                                                >
                                                    <Smartphone className="w-3 h-3" />
                                                    <span>Push FCM</span>
                                                    {setting.send_fcm ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => handleTestSend(setting.id)}
                                                disabled={testSendingId === setting.id}
                                                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 inline-flex items-center gap-1"
                                            >
                                                <FlaskConical className="w-3.5 h-3.5" />
                                                {testSendingId === setting.id ? 'Mengirim...' : 'Uji Coba'}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(setting)}
                                                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                                Ubah Pengaturan
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: PENGINGAT OTOMATIS (REMINDERS) */}
                    {activeTab === 'reminder' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs flex items-start gap-3">
                                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Informasi Scheduler Otomatis (Cron)</p>
                                    <p className="mt-0.5 text-amber-700">
                                        Modul pengingat di bawah ini dieksekusi secara otomatis oleh background cron di sistem:
                                        deadline tugas dicek harian, dan reminder pembayaran cashflow dieksekusi setiap pukul 08:00 pagi.
                                        Anda dapat mengubah jeda hari (H-1, H-7, H+3) secara bebas kapan saja.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {reminderSettings.map(reminder => (
                                    <div
                                        key={reminder.id}
                                        className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 relative overflow-hidden ${
                                            reminder.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600 inline-flex">
                                                        {reminder.event_key === 'reminder_task_deadline' ? <Target className="w-4 h-4" /> :
                                                         reminder.event_key === 'reminder_payment_h_min' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> :
                                                         reminder.event_key === 'reminder_payment_due' ? <Coins className="w-4 h-4 text-emerald-600" /> :
                                                         <CreditCard className="w-4 h-4 text-rose-600" />}
                                                    </span>
                                                    <h3 className="text-base font-bold text-slate-800">
                                                        {reminder.nama_pengaturan}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {reminder.deskripsi}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleQuickToggle(reminder.id, 'is_active', reminder.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                    reminder.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                                }`}
                                            >
                                                {reminder.is_active ? '● AKTIF' : '○ NONAKTIF'}
                                            </button>
                                        </div>

                                        {/* Jeda Hari / Offset Setting */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">
                                                    Jeda Hari Pemicu (Offset):
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {reminder.days_offset === 0 ? 'Tepat pada hari-H jatuh tempo (H-0)' :
                                                     reminder.event_key === 'reminder_material_fee' ? `${reminder.days_offset} hari setelah approval (H+${reminder.days_offset})` :
                                                     `${reminder.days_offset} hari sebelum jatuh tempo (H-${reminder.days_offset})`}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-sm font-black text-violet-700 shadow-sm">
                                                    {reminder.event_key === 'reminder_material_fee' ? `+${reminder.days_offset}` : `${reminder.days_offset}`} Hari
                                                </span>
                                            </div>
                                        </div>

                                        {/* Message Template Preview */}
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Template Pesan Pengingat:
                                            </span>
                                            <div className="p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl leading-relaxed">
                                                <div className="text-amber-300 font-bold mb-1">
                                                    {reminder.title_template}
                                                </div>
                                                <div>
                                                    {reminder.message_template}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Target Roles */}
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                Target Penerima:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {reminder.target_role_ids && reminder.target_role_ids.length > 0 ? (
                                                    reminder.target_role_ids.map(rid => (
                                                        <span
                                                            key={rid}
                                                            className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-semibold"
                                                        >
                                                            {roleMap.get(rid) || `Role #${rid}`}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Semua staf terkait</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                                            <button
                                                onClick={() => handleTestSend(reminder.id)}
                                                disabled={testSendingId === reminder.id}
                                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 inline-flex items-center gap-1"
                                            >
                                                <FlaskConical className="w-3.5 h-3.5" />
                                                {testSendingId === reminder.id ? 'Mengirim...' : 'Uji Coba Pengingat'}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(reminder)}
                                                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                                Atur Jeda & Template
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PANDUAN VARIABEL */}
                    {activeTab === 'guide' && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Daftar Placeholder Variabel Dinamis
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Saat notifikasi atau pengingat dikirimkan, teks di bawah ini akan otomatis digantikan dengan data asli proyek / order.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { tag: '{nama_project}', desc: 'Nama proyek yang sedang berjalan', c: 'Contoh: Villa Sunset Seminyak' },
                                    { tag: '{customer_name}', desc: 'Nama klien / pemilik proyek', c: 'Contoh: Ibu Rina Rahmawati' },
                                    { tag: '{tanggal_survey}', desc: 'Jadwal tanggal survey lapangan', c: 'Contoh: 15-09-2026' },
                                    { tag: '{tahap}', desc: 'Nama tahapan pengerjaan saat ini', c: 'Contoh: Moodboard / Desain Final' },
                                    { tag: '{deadline}', desc: 'Batas akhir waktu pengerjaan tugas', c: 'Contoh: 10-09-2026' },
                                    { tag: '{nominal}', desc: 'Jumlah uang atau tagihan terkait', c: 'Contoh: Rp 15.000.000' },
                                    { tag: '{vendor_label}', desc: 'Nama vendor / rekanan pengerjaan', c: 'Contoh: CV Prima Interior' },
                                    { tag: '{payment_type}', desc: 'Jenis pembayaran (DP / Termin)', c: 'Contoh: DP / Pembayaran' },
                                    { tag: '{days_offset}', desc: 'Jumlah hari pengingat (H-X atau H+X)', c: 'Contoh: 7 hari' },
                                    { tag: '{tanggal_jatuh_tempo}', desc: 'Tanggal jatuh tempo tagihan vendor', c: 'Contoh: 20-09-2026' },
                                    { tag: '{status_waktu}', desc: 'Keterangan waktu relatif pengingat', c: 'Contoh: besok' },
                                    { tag: '{status_aksi}', desc: 'Aksi yang diharapkan dari user', c: 'Contoh: Input Data / Response' },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                        <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200 inline-block">
                                            {item.tag}
                                        </span>
                                        <p className="text-xs font-medium text-slate-700">{item.desc}</p>
                                        <p className="text-[11px] text-slate-400 italic">{item.c}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL EDIT PENGATURAN NOTIFIKASI */}
            {modalOpen && editingSetting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">
                                    Edit Pengaturan: {editingSetting.nama_pengaturan}
                                </h3>
                                <p className="text-xs text-violet-200 font-mono mt-0.5">
                                    {editingSetting.event_key}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* Toggle Status & Channels */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active ?? true}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-bold text-slate-800">Status Aktif</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.send_database ?? true}
                                        onChange={e => setFormData({ ...formData, send_database: e.target.checked })}
                                        className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-medium text-slate-700">In-App Database</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.send_fcm ?? true}
                                        onChange={e => setFormData({ ...formData, send_fcm: e.target.checked })}
                                        className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-medium text-slate-700">Push Notification FCM</span>
                                </label>
                            </div>

                            {/* Nama & Deskripsi */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Pengaturan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nama_pengaturan || ''}
                                        onChange={e => setFormData({ ...formData, nama_pengaturan: e.target.value })}
                                        className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-violet-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Deskripsi
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.deskripsi || ''}
                                        onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                        className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>

                            {/* Jeda Hari Offset (If reminder) */}
                            {editingSetting.category === 'reminder' && (
                                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                                    <label className="block text-xs font-bold text-amber-900">
                                        Jeda Hari Pengingat (Days Offset)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={formData.days_offset ?? 0}
                                            onChange={e => setFormData({ ...formData, days_offset: Number(e.target.value) })}
                                            className="w-24 text-xs rounded-lg border border-amber-300 px-3 py-2 font-bold focus:ring-2 focus:ring-amber-500"
                                        />
                                        <span className="text-xs text-amber-800">
                                            {editingSetting.event_key === 'reminder_material_fee'
                                                ? 'Hari setelah status material disetujui (H+X)'
                                                : 'Hari sebelum tanggal jatuh tempo (H-X, isi 0 untuk hari-H)'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Tipe Penerima & Target Roles */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Cakupan Penerima Notifikasi
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                                            <input
                                                type="radio"
                                                name="recipient_type"
                                                value="order_team"
                                                checked={formData.recipient_type === 'order_team'}
                                                onChange={() => setFormData({ ...formData, recipient_type: 'order_team' })}
                                                className="text-violet-600 focus:ring-violet-500"
                                            />
                                            <span>Hanya Staf yang Terdaftar di Tim Order Ini</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                                            <input
                                                type="radio"
                                                name="recipient_type"
                                                value="all_by_role"
                                                checked={formData.recipient_type === 'all_by_role'}
                                                onChange={() => setFormData({ ...formData, recipient_type: 'all_by_role' })}
                                                className="text-violet-600 focus:ring-violet-500"
                                            />
                                            <span>Seluruh Pengguna dengan Role Tersebut</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Pilih Target Role Penerima
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                                        {roles.map(role => (
                                            <label
                                                key={role.id}
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer text-xs"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.target_role_ids || []).includes(role.id)}
                                                    onChange={() => toggleTargetRole(role.id)}
                                                    className="rounded text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                                                />
                                                <span className="truncate">{role.nama_role}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tembusan Manajemen */}
                            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.send_to_management ?? true}
                                            onChange={e => setFormData({ ...formData, send_to_management: e.target.checked })}
                                            className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4"
                                        />
                                        <span className="text-xs font-bold text-slate-800">
                                            Kirim Tembusan ke Tim Manajemen Proyek
                                        </span>
                                    </label>
                                </div>

                                {formData.send_to_management && (
                                    <div className="pt-2">
                                        <span className="text-[11px] text-slate-500 block mb-1.5">
                                            Role Manajemen yang Menerima Tembusan:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {roles.filter(r => [9, 10, 11].includes(r.id)).map(mRole => (
                                                <label
                                                    key={mRole.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.management_role_ids || []).includes(mRole.id)}
                                                        onChange={() => toggleManagementRole(mRole.id)}
                                                        className="rounded text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                                                    />
                                                    <span>{mRole.nama_role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Template Judul & Pesan */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-700">
                                            Template Judul Notifikasi
                                        </label>
                                        <span className="text-[10px] text-slate-400">Klik tag untuk menyisipkan:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {editingSetting.available_placeholders?.map(ph => (
                                            <button
                                                key={ph}
                                                type="button"
                                                onClick={() => insertPlaceholder('title', ph)}
                                                className="px-2 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-mono border border-violet-200"
                                            >
                                                +{ph}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.title_template || ''}
                                        onChange={e => setFormData({ ...formData, title_template: e.target.value })}
                                        className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-medium focus:ring-2 focus:ring-violet-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-700">
                                            Template Isi Pesan Notifikasi
                                        </label>
                                        <span className="text-[10px] text-slate-400">Klik tag untuk menyisipkan:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {editingSetting.available_placeholders?.map(ph => (
                                            <button
                                                key={ph}
                                                type="button"
                                                onClick={() => insertPlaceholder('message', ph)}
                                                className="px-2 py-0.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-mono border border-violet-200"
                                            >
                                                +{ph}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={formData.message_template || ''}
                                        onChange={e => setFormData({ ...formData, message_template: e.target.value })}
                                        className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 font-medium focus:ring-2 focus:ring-violet-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Live Preview Box */}
                            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Pratinjau Tampilan Notifikasi di Smartphone:
                                </span>
                                <div className="text-xs font-bold text-amber-300">
                                    {formData.title_template
                                        ?.replace('{nama_project}', 'Project Villa Canggu')
                                        ?.replace('{customer_name}', 'Bpk. Hendra Gunawan')
                                        ?.replace('{tahap}', 'Survey Lapangan')
                                        ?.replace('{deadline}', 'Besok') || 'Judul Notifikasi'}
                                </div>
                                <div className="text-xs text-slate-300">
                                    {formData.message_template
                                        ?.replace('{nama_project}', 'Project Villa Canggu')
                                        ?.replace('{customer_name}', 'Bpk. Hendra Gunawan')
                                        ?.replace('{tahap}', 'Survey Lapangan')
                                        ?.replace('{deadline}', 'Besok')
                                        ?.replace('{status_waktu}', 'besok')
                                        ?.replace('{status_aksi}', 'Input Data') || 'Isi pesan notifikasi...'}
                                </div>
                            </div>

                            {/* Footer Submit */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-md transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
