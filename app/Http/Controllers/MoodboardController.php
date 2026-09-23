<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Moodboard\Traits\HasDesainFinal;
use App\Http\Controllers\Moodboard\Traits\HasDesainKasar;
use App\Http\Controllers\Moodboard\Traits\HasMoodboardReview;
use App\Models\Moodboard;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MoodboardController extends Controller
{
    use HasDesainKasar, HasDesainFinal, HasMoodboardReview;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        Log::info('=== MOODBOARD INDEX DEBUG ===');
        Log::info('User ID: ' . $user->id);
        Log::info('User Name: ' . $user->name);
        Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));

        $orders = Order::with(['moodboard.estimasi', 'moodboard.itemPekerjaan', 'moodboard.commitmentFee', 'moodboard.kasarFiles.estimasiFile', 'moodboard.finalFiles', 'jenisInterior', 'users.role'])
            ->visibleToUser($user)
            ->orderBy('created_at', 'desc')
            ->where(function ($query) {
                $query->where('tahapan_proyek', 'moodboard')
                    ->orWhereHas('moodboard', function ($moodboardQuery) {
                        $moodboardQuery->where('status', 'approved');
                    });
            })
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'jenis_interior' => $order->jenisInterior->nama_interior ?? '-',
                    'tanggal_masuk_customer' => $order->tanggal_masuk_customer,
                    'project_status' => $order->project_status,
                    'moodboard' => $order->moodboard ? [
                        'id' => $order->moodboard->id,
                        'moodboard_kasar' => $order->moodboard->moodboard_kasar,
                        'moodboard_final' => $order->moodboard->moodboard_final,
                        'kasar_files' => $order->moodboard->kasarFiles->map(function ($file) {
                            return [
                                'id' => $file->id,
                                'file_path' => $file->file_path,
                                'original_name' => $file->original_name,
                                'url' => asset('storage/' . $file->file_path),
                                'estimasi_file' => $file->estimasiFile ? [
                                    'id' => $file->estimasiFile->id,
                                    'file_path' => $file->estimasiFile->file_path,
                                    'original_name' => $file->estimasiFile->original_name,
                                    'url' => asset('storage/' . $file->estimasiFile->file_path),
                                ] : null,
                            ];
                        }),
                        'final_files' => $order->moodboard->finalFiles->map(function ($file) {
                            return [
                                'id' => $file->id,
                                'file_path' => $file->file_path,
                                'original_name' => $file->original_name,
                                'url' => asset('storage/' . $file->file_path),
                            ];
                        }),
                        'has_item_pekerjaan' => $order->moodboard->itemPekerjaan ? true : false,
                        'response_time' => $order->moodboard->response_time,
                        'response_by' => $order->moodboard->response_by,
                        'pm_response_time' => $order->moodboard->pm_response_time,
                        'pm_response_by' => $order->moodboard->pm_response_by,
                        'status' => $order->moodboard->status,
                        'notes' => $order->moodboard->notes,
                        'has_estimasi' => $order->moodboard->estimasi ? true : false,
                        'has_commitment_fee_completed' => $order->moodboard->commitmentFee && $order->moodboard->commitmentFee->payment_status === 'completed' ? true : false,
                    ] : null,
                    // Team members
                    'team' => $order->users->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'role' => $user->role->nama_role ?? 'No Role',
                        ];
                    }),
                ];
            });

        return Inertia::render('Moodboard/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return Inertia::render('Moodboard/Show', [
            'moodboard' => $moodboard,
        ]);
    }
}
