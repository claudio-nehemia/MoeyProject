<?php

namespace App\Http\Controllers;

use App\Models\Pengaturanumum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PengaturanPresensiController extends Controller
{
    public function index()
    {
        $general = Pengaturanumum::first() ?? Pengaturanumum::create([
            'cuti_approval_role_id' => null,
            'feature_visit_tracking' => 1,
            'feature_daily_activity' => 1,
            'feature_wa_notification' => 1,
        ]);

        $allRoles = DB::table('roles')->select('id', 'nama_role as name')->get();

        return Inertia::render('Presensi/Settings', [
            'settings' => [
                'cuti_approval_role_id' => $general->cuti_approval_role_id,
                'feature_visit_tracking' => (bool) $general->feature_visit_tracking,
                'feature_daily_activity' => (bool) $general->feature_daily_activity,
                'feature_wa_notification' => (bool) $general->feature_wa_notification,
                'batasi_absen' => (bool) $general->batasi_absen,
                'batas_jam_absen' => (int) ($general->batas_jam_absen ?? 0),
                'batas_jam_absen_pulang' => (int) ($general->batas_jam_absen_pulang ?? 0),
                'face_recognition' => (bool) $general->face_recognition,
            ],
            'allRoles' => $allRoles
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'cuti_approval_role_id' => 'nullable|integer',
            'feature_visit_tracking' => 'required|boolean',
            'feature_daily_activity' => 'required|boolean',
            'feature_wa_notification' => 'required|boolean',
            'batasi_absen' => 'required|boolean',
            'batas_jam_absen' => 'required|integer|min:0|max:180',
            'batas_jam_absen_pulang' => 'required|integer|min:0|max:180',
            'face_recognition' => 'required|boolean',
        ]);

        $general = Pengaturanumum::first();
        if ($general) {
            $general->update([
                'cuti_approval_role_id' => $validated['cuti_approval_role_id'],
                'feature_visit_tracking' => $validated['feature_visit_tracking'] ? 1 : 0,
                'feature_daily_activity' => $validated['feature_daily_activity'] ? 1 : 0,
                'feature_wa_notification' => $validated['feature_wa_notification'] ? 1 : 0,
                'batasi_absen' => $validated['batasi_absen'] ? 1 : 0,
                'batas_jam_absen' => $validated['batas_jam_absen'],
                'batas_jam_absen_pulang' => $validated['batas_jam_absen_pulang'],
                'face_recognition' => $validated['face_recognition'] ? 1 : 0,
            ]);
        }

        return redirect()->back()->with('success', 'Pengaturan aplikasi mobile berhasil diperbarui.');
    }
}
