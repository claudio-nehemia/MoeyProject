<?php

namespace App\Http\Controllers;

use App\Models\Defect;
use App\Models\DefectItem;
use App\Models\DefectRepair;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DefectController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== DEFECT MANAGEMENT INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));
        
        $defects = Defect::with([
            'itemPekerjaanProduk.produk',
            'itemPekerjaanProduk.itemPekerjaan.moodboard.order',
            'defectItems.repairs'
        ])
            ->whereHas('itemPekerjaanProduk.itemPekerjaan.moodboard.order', function($query) use ($user) {
                $query->visibleToSurveyUser($user);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($defect) {
                $produk = $defect->itemPekerjaanProduk;
                $order = $produk->itemPekerjaan->moodboard->order;

                $hasRejection = $defect->defectItems->flatMap->repairs->contains(fn($r) => !$r->is_approved && !empty($r->rejection_notes));
                $hasPendingApproval = $defect->defectItems->flatMap->repairs->contains(fn($r) => !$r->is_approved && empty($r->rejection_notes));
                $totalRepaired = $defect->defectItems->filter(fn($item) => $item->repairs->count() > 0)->count();

                $displayStatus = 'pending';
                if ($defect->status === 'completed') {
                    $displayStatus = 'completed';
                } else if ($hasRejection) {
                    $displayStatus = 'rejected';
                } else if ($hasPendingApproval || $totalRepaired > 0) {
                    $displayStatus = 'in_repair';
                }

                return [
                    'id' => $defect->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'nama_produk' => $produk->produk->nama_produk,
                    'qc_stage' => $defect->qc_stage,
                    'status' => $displayStatus,
                    'reported_by' => $defect->reported_by,
                    'reported_at' => $defect->reported_at,
                    'total_defects' => $defect->defectItems->count(),
                    'total_repaired' => $totalRepaired,
                ];
            });

        return inertia('DefectManagement/Index', [
            'defects' => $defects
        ]);
    }

    // Halaman Detail Defect - Lihat foto cacat dan input perbaikan
    public function show($id)
    {
        $defect = Defect::with([
            'itemPekerjaanProduk.produk',
            'itemPekerjaanProduk.itemPekerjaan.moodboard.order',
            'defectItems.repairs'
        ])->findOrFail($id);

        $produk = $defect->itemPekerjaanProduk;
        $order = $produk->itemPekerjaan->moodboard->order;

        $hasRejection = $defect->defectItems->flatMap->repairs->contains(fn($r) => !$r->is_approved && !empty($r->rejection_notes));
        $hasPendingApproval = $defect->defectItems->flatMap->repairs->contains(fn($r) => !$r->is_approved && empty($r->rejection_notes));

        $displayStatus = 'pending';
        if ($defect->status === 'completed') {
            $displayStatus = 'completed';
        } else if ($hasRejection) {
            $displayStatus = 'rejected';
        } else if ($hasPendingApproval || $defect->defectItems->flatMap->repairs->count() > 0) {
            $displayStatus = 'in_repair';
        }

        return inertia('DefectManagement/Show', [
            'defect' => [
                'id' => $defect->id,
                'nama_project' => $order->nama_project,
                'company_name' => $order->company_name,
                'customer_name' => $order->customer_name,
                'nama_produk' => $produk->produk->nama_produk,
                'qc_stage' => $defect->qc_stage,
                'status' => $displayStatus,
                'reported_by' => $defect->reported_by,
                'reported_at' => $defect->reported_at,
                'defect_items' => $defect->defectItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'photo_url' => $item->photo_url,
                        'notes' => $item->notes,
                        'order' => $item->order,
                        'repairs' => $item->repairs->map(function ($repair) {
                            return [
                                'id' => $repair->id,
                                'photo_url' => $repair->photo_url,
                                'notes' => $repair->notes,
                                'repaired_by' => $repair->repaired_by,
                                'repaired_at' => $repair->repaired_at,
                                'is_approved' => $repair->is_approved,
                                'approved_by' => $repair->approved_by,
                                'approved_at' => $repair->approved_at,
                                'rejection_notes' => $repair->rejection_notes,
                                'rejected_by' => $repair->rejected_by,
                                'rejected_at' => $repair->rejected_at,
                            ];
                        }),
                    ];
                }),
                'has_pending_approval' => $defect->has_pending_approval,
            ],
        ]);
    }

    // Store Defect dari Project Management Detail
    public function store(Request $request)
    {
        $request->validate([
            'item_pekerjaan_produk_id' => 'required|exists:item_pekerjaan_produks,id',
            'qc_stage' => 'required|in:Finishing QC,Install QC',
            'defect_items' => 'required|array|min:1',
            'defect_items.*.photo' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'defect_items.*.notes' => 'required|string',
        ]);

        // Cek apakah sudah ada defect aktif (pending/in_repair) untuk produk & stage ini
        $defect = Defect::where('item_pekerjaan_produk_id', $request->item_pekerjaan_produk_id)
            ->where('qc_stage', $request->qc_stage)
            ->whereIn('status', ['pending', 'in_repair'])
            ->first();

        if (!$defect) {
            $defect = Defect::create([
                'item_pekerjaan_produk_id' => $request->item_pekerjaan_produk_id,
                'qc_stage' => $request->qc_stage,
                'reported_by' => Auth::user()->name,
                'reported_at' => now(),
                'status' => 'pending',
            ]);
        }

        $existingCount = $defect->defectItems()->count();

        foreach ($request->defect_items as $index => $item) {
            $photoPath = $item['photo']->store('defects', 'public');

            DefectItem::create([
                'defect_id' => $defect->id,
                'photo_path' => $photoPath,
                'notes' => $item['notes'],
                'order' => $existingCount + $index,
            ]);
        }

        return redirect()->back()->with('success', 'Defect berhasil dilaporkan');
    }

    // Store Repair - Input foto perbaikan
    public function storeRepair(Request $request, $defectItemId)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'notes' => 'required|string',
        ]);

        $defectItem = DefectItem::findOrFail($defectItemId);

        $photoPath = $request->file('photo')->store('defect-repairs', 'public');

        $repair = DefectRepair::create([
            'defect_item_id' => $defectItemId,
            'photo_path' => $photoPath,
            'notes' => $request->notes,
            'repaired_by' => Auth::user()->name,
            'repaired_at' => now(),
        ]);

        // Update status defect menjadi in_repair
        $defect = $defectItem->defect;
        if ($defect->status === 'pending') {
            $defect->update(['status' => 'in_repair']);
        }

        // Cek apakah semua defect items sudah diperbaiki
        if ($defect->is_all_repaired) {
            $defect->update(['status' => 'completed']);
        }

        return redirect()->back()->with('success', 'Perbaikan berhasil dicatat');
    }

    // Delete Repair
    public function deleteRepair($repairId)
    {
        $repair = DefectRepair::findOrFail($repairId);

        // Delete foto dari storage
        Storage::disk('public')->delete($repair->photo_path);

        $defect = $repair->defectItem->defect;
        $repair->delete();

        // Update status defect
        if (!$defect->is_all_repaired) {
            $defect->update(['status' => 'in_repair']);
        }

        return redirect()->back()->with('success', 'Perbaikan berhasil dihapus');
    }

    // Update Status Defect (Manual)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,in_repair,completed',
        ]);

        $defect = Defect::findOrFail($id);
        $defect->update(['status' => $request->status]);

        return redirect()->back()->with('success', 'Status defect berhasil diupdate');
    }

    // Approve Repair - ACC perbaikan
    public function approveRepair($repairId)
    {
        $repair = DefectRepair::findOrFail($repairId);

        $repair->update([
            'is_approved' => true,
            'approved_by' => Auth::user()->name,
            'approved_at' => now(),
            'rejection_notes' => null,
            'rejected_by' => null,
            'rejected_at' => null,
        ]);

        // Cek apakah semua defect items sudah diperbaiki DAN di-approve
        $defect = $repair->defectItem->defect;
        if ($defect->is_all_repaired) {
            $defect->update(['status' => 'completed']);
        }

        return redirect()->back()->with('success', 'Perbaikan berhasil di-approve');
    }

    // Reject Repair - Tolak perbaikan dengan catatan
    public function rejectRepair(Request $request, $repairId)
    {
        $request->validate([
            'rejection_notes' => 'required|string|max:500',
        ]);

        $repair = DefectRepair::findOrFail($repairId);

        $repair->update([
            'is_approved' => false,
            'rejection_notes' => $request->rejection_notes,
            'rejected_by' => Auth::user()->name,
            'rejected_at' => now(),
        ]);

        $defect = $repair->defectItem->defect;
        if ($defect->status === 'completed') {
            $defect->update(['status' => 'in_repair']);
        }

        return redirect()->back()->with('success', 'Perbaikan berhasil ditolak dengan catatan.');
    }
}
