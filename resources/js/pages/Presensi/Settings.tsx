import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
    Settings as SettingsIcon,
    Key,
    Clock,
    Camera,
    Smartphone,
    Info,
    CheckCircle,
    MapPin,
    Calendar,
    MessageSquare,
    Save
} from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Props {
    settings: {
        cuti_approval_role_id: number | null;
        feature_visit_tracking: boolean;
        feature_daily_activity: boolean;
        feature_wa_notification: boolean;
        batasi_absen: boolean;
        batas_jam_absen: number;
        batas_jam_absen_pulang: number;
        face_recognition: boolean;
    };
    allRoles: Role[];
}

export default function Settings({ settings, allRoles }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });

    const { data, setData, post, processing } = useForm({
        cuti_approval_role_id: settings.cuti_approval_role_id || '',
        feature_visit_tracking: settings.feature_visit_tracking,
        feature_daily_activity: settings.feature_daily_activity,
        feature_wa_notification: settings.feature_wa_notification,
        batasi_absen: settings.batasi_absen,
        batas_jam_absen: settings.batas_jam_absen,
        batas_jam_absen_pulang: settings.batas_jam_absen_pulang,
        face_recognition: settings.face_recognition,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pengaturan-presensi', {
            preserveScroll: true,
            onSuccess: () => {
                alert('Pengaturan presensi dan mobile berhasil disimpan!');
            }
        });
    };

    return (
        <>
            <Head title="Pengaturan Presensi & Fitur Mobile" />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                
                .switch-input:checked ~ .switch-dot {
                    transform: translateX(100%);
                    background-color: #f59e0b;
                }
                .switch-input:checked ~ .switch-line {
                    background-color: #fef3c7;
                    border-color: #fde68a;
                }
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pengaturan-presensi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 max-w-4xl space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                ⚙️ Pengaturan Presensi & Aplikasi Mobile
                            </h1>
                            <span className="inline-flex px-2.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                                Konfigurasi Global
                            </span>
                        </div>
                        <p className="text-xs text-stone-500">
                            Kelola role berwenang untuk persetujuan cuti/izin/lembur serta on/off fitur opsional pada aplikasi mobile karyawan.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Section 1: Role Penyetuju */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                    <Key size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-850">
                                        🔑 Otoritas Approval Pengajuan
                                    </h3>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                        Tentukan tingkat role yang memiliki kewenangan penuh untuk menyetujui atau menolak permohonan (cuti, izin, lembur, dan koreksi absen) yang diajukan karyawan dari aplikasi mobile.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="pt-2 max-w-md">
                                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-400 mb-1.5">Pilih Role Penyetuju</label>
                                <select
                                    value={data.cuti_approval_role_id}
                                    onChange={(e) => setData('cuti_approval_role_id', e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 bg-white font-bold text-stone-700"
                                >
                                    <option value="">-- Tanpa Hubungkan (Bebas Approval) --</option>
                                    {allRoles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Section 2: Pembatasan Waktu Absen */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-855">
                                        ⏰ Toleransi & Pembatasan Waktu Presensi
                                    </h3>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                        Jika dibatasi, karyawan hanya diijinkan melakukan absensi check-in/out dalam rentang waktu toleransi tertentu dari jam kerja yang dijadwalkan.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-start gap-3.5 p-3.5 bg-stone-50/50 hover:bg-stone-50 border border-stone-200/80 rounded-2xl cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        checked={data.batasi_absen}
                                        onChange={(e) => setData('batasi_absen', e.target.checked)}
                                        className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">
                                            Aktifkan Pembatasan Waktu Absensi
                                        </div>
                                        <div className="text-[10px] text-stone-500 mt-0.5">
                                            Karyawan tidak diperkenankan absen masuk terlalu cepat, terlambat berlebihan, atau pulang lebih awal sebelum jam yang ditentukan.
                                        </div>
                                    </div>
                                </label>

                                {data.batasi_absen && (
                                    <div className="ml-2 pl-4 border-l-2 border-amber-300 space-y-4 py-1">
                                        <div className="max-w-md">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block mb-1">
                                                Toleransi Check-In (Dalam Menit)
                                            </label>
                                            <p className="text-[10px] text-stone-400 mb-1.5">
                                                Staf dapat melakukan check-in dimulai dari N menit sebelum jam masuk.
                                            </p>
                                            <input
                                                type="number"
                                                min={0}
                                                max={180}
                                                value={data.batas_jam_absen}
                                                onChange={(e) => setData('batas_jam_absen', parseInt(e.target.value) || 0)}
                                                className="w-32 px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 font-bold"
                                            />
                                        </div>
                                        
                                        <div className="max-w-md">
                                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block mb-1">
                                                Toleransi Check-Out (Dalam Menit)
                                            </label>
                                            <p className="text-[10px] text-stone-400 mb-1.5">
                                                Staf diperbolehkan check-out dimulai dari N menit sebelum jam pulang resmi.
                                            </p>
                                            <input
                                                type="number"
                                                min={0}
                                                max={180}
                                                value={data.batas_jam_absen_pulang}
                                                onChange={(e) => setData('batas_jam_absen_pulang', parseInt(e.target.value) || 0)}
                                                className="w-32 px-3 py-2 text-xs border border-stone-250 rounded-xl focus:ring-amber-500 focus:border-amber-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Face Recognition */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <Camera size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-850">
                                        👤 Verifikasi Pengenalan Wajah (Face Recognition AI)
                                    </h3>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                        Deteksi pencocokan wajah selfie saat absen dengan data wajah master staf terdaftar untuk mencegah manipulasi.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-start gap-3.5 p-3.5 bg-stone-50/50 hover:bg-stone-50 border border-stone-200/80 rounded-2xl cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        checked={data.face_recognition}
                                        onChange={(e) => setData('face_recognition', e.target.checked)}
                                        className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-slate-800">
                                            Wajibkan Pencocokan Selfie Wajah
                                        </div>
                                        <div className="text-[10px] text-stone-500 mt-0.5">
                                            Karyawan yang wajahnya belum terdaftar/registered di database tetap dapat melakukan absen (bypass) demi kelancaran operasional.
                                        </div>
                                    </div>
                                </label>

                                {data.face_recognition && (
                                    <div className="ml-2 pl-4 border-l-2 border-emerald-400">
                                        <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                                            <Info size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-[11px] text-emerald-800 font-extrabold">💡 Rekomendasi Optimal:</p>
                                                <ul className="text-[10px] text-emerald-700 mt-1 space-y-1 list-disc ml-3">
                                                    <li>Upload foto wajah beresolusi jelas di halaman <strong>Data Karyawan → Kelola Wajah</strong>.</li>
                                                    <li>Usahakan mendaftarkan minimal 2 foto wajah per karyawan dengan variasi cahaya berbeda.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Mobile App Toggles */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <Smartphone size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-850">
                                        📱 Kontrol Layanan & Modul Aplikasi Mobile
                                    </h3>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                        Aktifkan atau sembunyikan fitur-fitur opsional pada perangkat mobile karyawan secara dinamis dari cloud database admin.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Visit Tracking */}
                                <label className="flex items-start gap-3 p-3.5 bg-stone-50/50 hover:bg-stone-50 border border-stone-200/80 rounded-2xl cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        checked={data.feature_visit_tracking}
                                        onChange={(e) => setData('feature_visit_tracking', e.target.checked)}
                                        className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-slate-850 flex items-center gap-1">
                                            <MapPin size={12} className="text-stone-400" />
                                            Pelacakan Kunjungan (Visit Client)
                                        </div>
                                        <div className="text-[10px] text-stone-450 mt-1">
                                            Mengaktifkan modul sales/staf lapangan mencatat koordinat lokasi kunjungan klien di luar kantor.
                                        </div>
                                    </div>
                                </label>

                                {/* Daily Activity */}
                                <label className="flex items-start gap-3 p-3.5 bg-stone-50/50 hover:bg-stone-50 border border-stone-200/80 rounded-2xl cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        checked={data.feature_daily_activity}
                                        onChange={(e) => setData('feature_daily_activity', e.target.checked)}
                                        className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-slate-850 flex items-center gap-1">
                                            <Calendar size={12} className="text-stone-400" />
                                            Laporan Aktivitas Harian (Daily Log)
                                        </div>
                                        <div className="text-[10px] text-stone-455 mt-1">
                                            Mengijinkan karyawan mengupload rincian tugas dan bukti gambar pekerjaan harian mereka.
                                        </div>
                                    </div>
                                </label>

                                {/* WA Notifications */}
                                <label className="flex items-start gap-3 p-3.5 bg-stone-50/50 hover:bg-stone-50 border border-stone-200/80 rounded-2xl cursor-pointer transition-all col-span-1 md:col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={data.feature_wa_notification}
                                        onChange={(e) => setData('feature_wa_notification', e.target.checked)}
                                        className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500 w-4 h-4"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-slate-850 flex items-center gap-1">
                                            <MessageSquare size={12} className="text-stone-400" />
                                            Notifikasi Whatsapp Gateway
                                        </div>
                                        <div className="text-[10px] text-stone-455 mt-1">
                                            Mengirim chat notifikasi konfirmasi ke Whatsapp staf seketika setelah presensi in / out dinyatakan sukses oleh server.
                                        </div>
                                    </div>
                                </label>

                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                            >
                                <Save size={14} />
                                {processing ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Perubahan'}
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </>
    );
}
