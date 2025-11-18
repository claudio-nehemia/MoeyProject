<?php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ItemPekerjaanProduk;
use Illuminate\Http\Request;

class ProjectManagementController extends Controller
{
    public function index()
    {
        $orders = Order::with([
            'moodboard.itemPekerjaans.produks.itemPekerjaan.rabVendor.rabVendorProduks'
        ])
            ->whereHas('moodboard.itemPekerjaans.invoice', function ($q) {
                $q
                    ->whereNotNull('bukti_bayar');
            })
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'nama_project' => $order->nama_project,
                    'company_name' => $order->company_name,
                    'customer_name' => $order->customer_name,
                    'progress' => $order->progress,
                ];
            });

        return inertia('ProjectManagement/Index', [
            'orders' => $orders
        ]);
    }


    public function show($id)
    {
        $order = Order::with(['moodboard.itemPekerjaans.produks.produk', 'moodboard.itemPekerjaans.rabVendor.rabVendorProduks'])
            ->findOrFail($id);

        $itemPekerjaans = $order->moodboard->itemPekerjaans->map(function ($itemPekerjaan) {
            // Calculate total harga for this item pekerjaan
            $totalHargaItem = $itemPekerjaan->produks->sum('total_harga');

            $produks = $itemPekerjaan->produks->map(function ($produk) use ($totalHargaItem) {
                // Calculate weight percentage based on harga
                $weightPercentage = $totalHargaItem > 0 ? ($produk->total_harga / $totalHargaItem) * 100 : 0;

                // Calculate actual contribution (weight * progress)
                $actualContribution = ($weightPercentage * $produk->progress) / 100;

                $canReportDefect = in_array($produk->current_stage, ['Finishing QC', 'Install QC']);

                $hasActiveDefect = $produk->defects()
                    ->whereIn('status', ['pending', 'in_repair'])
                    ->exists();

                return [
                    'id' => $produk->id,
                    'nama_produk' => $produk->produk->nama_produk,
                    'quantity' => $produk->quantity,
                    'dimensi' => "{$produk->panjang}×{$produk->lebar}×{$produk->tinggi}",
                    'total_harga' => $produk->total_harga,
                    'progress' => $produk->progress,
                    'current_stage' => $produk->current_stage,
                    'weight_percentage' => round($weightPercentage, 2),
                    'actual_contribution' => round($actualContribution, 2),
                    'can_report_defect' => $canReportDefect,
                    'has_active_defect' => $hasActiveDefect,
                    'defect_id' => $hasActiveDefect ? $produk->defects()
                        ->whereIn('status', ['pending', 'in_repair'])
                        ->first()->id : null,
                ];
            });

            return [
                'id' => $itemPekerjaan->id,
                'produks' => $produks,
                'progress' => $itemPekerjaan->progress,
                'total_harga' => $totalHargaItem,
            ];
        });

        return inertia('ProjectManagement/Detail', [
            'order' => [
                'id' => $order->id,
                'nama_project' => $order->nama_project,
                'company_name' => $order->company_name,
                'customer_name' => $order->customer_name,
                'progress' => $order->progress,
                'item_pekerjaans' => $itemPekerjaans,
            ],
            'stages' => config('stage.stages')
        ]);
    }

    public function updateStage(Request $request, $id)
    {
        $request->validate(['current_stage' => 'required|string']);
        $produk = ItemPekerjaanProduk::findOrFail($id);

        $allowed = array_keys(config('stage.stages'));
        if (!in_array($request->current_stage, $allowed)) {
            return back()->withErrors(['stage' => 'Tahap tidak valid']);
        }

        $produk->update(['current_stage' => $request->current_stage]);
        return back()->with('success', 'Tahap berhasil diperbarui');
    }
}