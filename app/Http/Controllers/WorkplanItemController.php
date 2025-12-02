<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\ItemPekerjaanProduk;
use App\Models\WorkplanItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class WorkplanItemController extends Controller
{

    public static function defaultBreakdown()
    {
        return [
            ['nama_tahapan' => 'Potong'],
            ['nama_tahapan' => 'Rangkai'],
            ['nama_tahapan' => 'Finishing'],
            ['nama_tahapan' => 'Install'],
        ];
    }
    /**
     * Simpan / update full timeline workplan untuk satu produk.
     * Endpoint: POST /project-management/produk/{produk}/workplan
     */
    public function store(Request $request, ItemPekerjaanProduk $produk)
    {
        $validated = $request->validate([
            'items'                       => 'required|array|min:1',
            'items.*.nama_tahapan'       => 'required|string|max:255',
            'items.*.start_date'         => 'nullable|date',
            'items.*.end_date'           => 'nullable|date',
            'items.*.status'             => 'required|string|in:planned,in_progress,done,cancelled',
            'items.*.catatan'            => 'nullable|string',
        ], [
            'items.required'             => 'Minimal satu tahapan perlu diisi.',
            'items.*.nama_tahapan.required' => 'Nama tahapan wajib diisi.',
        ]);

        DB::transaction(function () use ($produk, $validated) {
            // hapus workplan lama
            $produk->workplanItems()->delete();

            foreach ($validated['items'] as $index => $item) {
                $start = !empty($item['start_date']) ? Carbon::parse($item['start_date']) : null;
                $end   = !empty($item['end_date']) ? Carbon::parse($item['end_date']) : null;

                $duration = null;
                if ($start && $end) {
                    // +1 biar inclusive (start & end dihitung)
                    $duration = $start->diffInDays($end) + 1;
                }

                WorkplanItem::create([
                    'item_pekerjaan_produk_id' => $produk->id,
                    'nama_tahapan'             => $item['nama_tahapan'],
                    'start_date'               => $start,
                    'end_date'                 => $end,
                    'duration_days'            => $duration,
                    'urutan'                   => $index + 1,
                    'status'                   => $item['status'],
                    'catatan'                  => $item['catatan'] ?? null,
                ]);
            }
        });

        return back()->with('success', 'Timeline workplan berhasil disimpan.');
    }

    public function updateStatus(Request $request, WorkplanItem $workplan)
    {
        $request->validate([
            'status' => 'required|in:planned,in_progress,done,cancelled',
        ]);

        $workplan->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status workplan diperbarui.');
    }

}
