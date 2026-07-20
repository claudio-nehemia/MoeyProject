<?php

namespace App\Http\Controllers;

use App\Models\Pengumuman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PengumumanController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Pengumuman::query();
        if ($search) {
            $query->where('judul', 'like', '%' . $search . '%')
                  ->orWhere('isi', 'like', '%' . $search . '%');
        }

        $pengumuman = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Pengumuman/Index', [
            'pengumuman' => $pengumuman,
            'filters' => [
                'search' => $search
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string',
            'lampiran_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120'
        ]);

        $lampiranPath = null;
        if ($request->hasFile('lampiran_file')) {
            $lampiranPath = $request->file('lampiran_file')->store('uploads/pengumuman', 'public');
        }

        $pengumuman = Pengumuman::create([
            'judul' => $validated['judul'],
            'isi' => $validated['isi'],
            'lampiran' => $lampiranPath
        ]);

        // Broadcast to all users
        try {
            $users = \App\Models\User::all();
            $fcmService = new \App\Services\FCMService();
            $fcmTokens = [];
            $notificationsData = [];

            $now = now();
            foreach ($users as $user) {
                $notificationsData[] = [
                    'user_id' => $user->id,
                    'type' => 'pengumuman',
                    'title' => 'Pengumuman Baru: ' . $pengumuman->judul,
                    'message' => strip_tags($pengumuman->isi),
                    'data' => json_encode([
                        'pengumuman_id' => $pengumuman->id,
                        'action_url' => '/dashboard',
                    ]),
                    'is_read' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($user->fcm_token) {
                    $fcmTokens[] = $user->fcm_token;
                }
            }

            if (!empty($notificationsData)) {
                \App\Models\Notification::insert($notificationsData);
            }

            if (!empty($fcmTokens)) {
                $fcmService->sendMulticast($fcmTokens, [
                    'title' => 'Pengumuman Baru: ' . $pengumuman->judul,
                    'body' => strip_tags($pengumuman->isi),
                    'data' => [
                        'type' => 'pengumuman',
                        'pengumuman_id' => (string) $pengumuman->id,
                    ]
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Error broadcasting announcement: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Pengumuman berhasil diterbitkan.');
    }

    public function update(Request $request, $id)
    {
        $pengumuman = Pengumuman::findOrFail($id);

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'isi' => 'required|string',
            'lampiran_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120'
        ]);

        $data = [
            'judul' => $validated['judul'],
            'isi' => $validated['isi'],
        ];

        if ($request->hasFile('lampiran_file')) {
            if ($pengumuman->lampiran) {
                Storage::disk('public')->delete($pengumuman->lampiran);
            }
            $data['lampiran'] = $request->file('lampiran_file')->store('uploads/pengumuman', 'public');
        }

        $pengumuman->update($data);

        return redirect()->back()->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $pengumuman = Pengumuman::findOrFail($id);
        if ($pengumuman->lampiran) {
            Storage::disk('public')->delete($pengumuman->lampiran);
        }
        $pengumuman->delete();

        return redirect()->back()->with('success', 'Pengumuman berhasil dihapus.');
    }
}
