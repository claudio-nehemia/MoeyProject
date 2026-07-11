import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

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
            `}</style>

            <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} currentPage="pengaturan-presensi" onClose={() => setSidebarOpen(false)} />

            <div className="p-3 lg:ml-60 min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/10 to-stone-50">
                <div className="p-3 mt-20 max-w-4xl space-y-6 fadeInUp">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            ⚙️ Pengaturan Presensi & Aplikasi Mobile
                        </h1>
                        <p className="text-xs text-stone-500 mt-1">
                            Kelola role berwenang untuk persetujuan cuti/izin/lembur serta on/off fitur opsional pada aplikasi mobile karyawan.
                        </p>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* Role Penyetuju */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">
                                    🔑 Role Penyetuju Izin / Cuti / Lembur / Koreksi
                                </h3>
                                <p className="text-[11px] text-stone-500 mb-3">
                                    Pilih role yang berwenang untuk menyetujui pengajuan izin, cuti, lembur, dan koreksi dari mobile.
                                </p>
                                <select
                                    value={data.cuti_approval_role_id}
                                    onChange={(e) => setData('cuti_approval_role_id', e.target.value)}
                                    className="w-full max-w-md px-3 py-2 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                >
                                    <option value="">-- Pilih Role --</option>
                                    {allRoles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <hr className="border-stone-150" />

                            {/* Pembatasan Waktu Absen */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">
                                    ⏰ Pembatasan Waktu Absen
                                </h3>
                                <p className="text-[11px] text-stone-500 mb-4">
                                    Jika diaktifkan, karyawan hanya bisa check-in/check-out dalam rentang waktu yang ditentukan sesuai jam kerja mereka.
                                </p>

                                <div className="space-y-4 max-w-2xl">
                                    <label className="flex items-start gap-3 p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-150 rounded-xl cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.batasi_absen}
                                            onChange={(e) => setData('batasi_absen', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">
                                                Aktifkan Pembatasan Waktu Absen
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5">
                                                Karyawan tidak bisa check-in terlalu awal/terlambat dan check-out sebelum waktunya.
                                            </div>
                                        </div>
                                    </label>

                                    {data.batasi_absen && (
                                        <div className="ml-2 pl-4 border-l-2 border-amber-300 space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                                    Toleransi Check-In (menit)
                                                </label>
                                                <p className="text-[10px] text-stone-500 mb-1">
                                                    Karyawan bisa check-in dalam rentang ± nilai ini dari jam masuk. Contoh: 30 menit berarti bisa check-in mulai 30 menit sebelum jam masuk.
                                                </p>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={180}
                                                    value={data.batas_jam_absen}
                                                    onChange={(e) => setData('batas_jam_absen', parseInt(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                                    Toleransi Check-Out (menit)
                                                </label>
                                                <p className="text-[10px] text-stone-500 mb-1">
                                                    Karyawan bisa check-out mulai dari nilai ini sebelum jam pulang. Contoh: 30 menit berarti bisa pulang mulai 30 menit sebelum jam pulang.
                                                </p>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={180}
                                                    value={data.batas_jam_absen_pulang}
                                                    onChange={(e) => setData('batas_jam_absen_pulang', parseInt(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 text-xs border border-stone-200 rounded-lg shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-stone-150" />

                            {/* Face Recognition */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">
                                    👤 Verifikasi Wajah (Face Recognition)
                                </h3>
                                <p className="text-[11px] text-stone-500 mb-4">
                                    Jika diaktifkan, setiap kali karyawan check-in/check-out harus melewati verifikasi wajah.
                                    Foto selfie akan dicocokkan dengan foto wajah terdaftar menggunakan AI.
                                </p>

                                <div className="space-y-4 max-w-2xl">
                                    <label className="flex items-start gap-3 p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-150 rounded-xl cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.face_recognition}
                                            onChange={(e) => setData('face_recognition', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">
                                                Aktifkan Verifikasi Wajah
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5">
                                                Karyawan yang belum memiliki foto wajah terdaftar tetap bisa absen tanpa verifikasi.
                                            </div>
                                        </div>
                                    </label>

                                    {data.face_recognition && (
                                        <div className="ml-2 pl-4 border-l-2 border-amber-300">
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-[11px] text-amber-800 font-semibold">⚠️ Catatan Penting:</p>
                                                <ul className="text-[10px] text-amber-700 mt-1 space-y-0.5 list-disc ml-3">
                                                    <li>Pastikan foto wajah karyawan sudah di-upload di halaman <strong>Data Karyawan → Face Registration</strong></li>
                                                    <li>Minimal 2 foto wajah per karyawan untuk hasil akurasi optimal</li>
                                                    <li>Karyawan tanpa foto wajah terdaftar akan tetap bisa absen (bypass verifikasi)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-stone-150" />

                            {/* Toggles */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-2">
                                    📱 Status Fitur Aplikasi Mobile
                                </h3>
                                <p className="text-[11px] text-stone-500 mb-4">
                                    Aktifkan atau nonaktifkan fitur-fitur opsional di bawah. Jika dinonaktifkan, menunya akan otomatis tersembunyi dari aplikasi mobile karyawan.
                                </p>

                                <div className="space-y-4 max-w-2xl">
                                    {/* Visit Tracking */}
                                    <label className="flex items-start gap-3 p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-150 rounded-xl cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.feature_visit_tracking}
                                            onChange={(e) => setData('feature_visit_tracking', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">
                                                📍 Fitur Pelacakan Kunjungan Lapangan (Sales/Client Visit)
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5">
                                                Memungkinkan karyawan mencatat riwayat kunjungan keluar dengan validasi GPS lokasi.
                                            </div>
                                        </div>
                                    </label>

                                    {/* Daily Activity */}
                                    <label className="flex items-start gap-3 p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-150 rounded-xl cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.feature_daily_activity}
                                            onChange={(e) => setData('feature_daily_activity', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">
                                                📸 Fitur Laporan Aktivitas Harian (Daily Activity Log)
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5">
                                                Memungkinkan karyawan untuk mengunggah aktivitas kerja harian mereka beserta foto lampiran.
                                            </div>
                                        </div>
                                    </label>

                                    {/* WA Notifications */}
                                    <label className="flex items-start gap-3 p-3 bg-stone-50/50 hover:bg-stone-50 border border-stone-150 rounded-xl cursor-pointer transition-all">
                                        <input
                                            type="checkbox"
                                            checked={data.feature_wa_notification}
                                            onChange={(e) => setData('feature_wa_notification', e.target.checked)}
                                            className="mt-0.5 rounded text-amber-500 border-stone-300 focus:ring-amber-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">
                                                💬 Fitur Notifikasi Gateway WhatsApp
                                            </div>
                                            <div className="text-[10px] text-stone-500 mt-0.5">
                                                Mengirim pesan notifikasi WhatsApp secara otomatis setiap kali check-in/out berhasil.
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-stone-150" />

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </>
    );
}
