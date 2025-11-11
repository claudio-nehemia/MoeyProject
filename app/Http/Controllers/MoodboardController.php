<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Order;
use App\Models\Moodboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MoodboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $orders = Order::with(['moodboard.estimasi', 'moodboard.commitmentFee', 'jenisInterior', 'users.role'])
            ->orderBy('created_at', 'desc')
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
                        'response_time' => $order->moodboard->response_time,
                        'response_by' => $order->moodboard->response_by,
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

    public function responseMoodboard(Request $request, $orderId)
    {
        try {
            Log::info('=== RESPONSE MOODBOARD START ===');
            Log::info('Order ID: ' . $orderId);
            Log::info('User: ' . auth()->user()->name);
            
            $order = Order::findOrFail($orderId);
            Log::info('Order found: ' . $order->id);

            // Check if moodboard already exists
            if ($order->moodboard) {
                Log::warning('Moodboard already exists for order: ' . $orderId);
                return back()->with('error', 'Moodboard sudah dibuat untuk order ini.');
            }

            $moodboard = Moodboard::create([
                'order_id' => $order->id,
                'response_time' => now(),
                'response_by' => auth()->user()->name,
                'status' => 'pending',
            ]);
            
            Log::info('Moodboard created with ID: ' . $moodboard->id);
            Log::info('=== RESPONSE MOODBOARD END ===');

            return back()->with('success', 'Moodboard berhasil dibuat.');
        } catch (\Exception $e) {
            Log::error('Response moodboard error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal membuat moodboard: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function uploadDesainKasar(Request $request)
    {
        try {
            Log::info('=== UPLOAD DESAIN KASAR START ===');
            Log::info('Request method: ' . $request->method());
            Log::info('Request headers: ', $request->headers->all());
            Log::info('Request data: ', $request->all());
            Log::info('Has file: ' . ($request->hasFile('moodboard_kasar') ? 'YES' : 'NO'));
            Log::info('Has token: ' . ($request->has('_token') ? 'YES' : 'NO'));
            
            $validated = $request->validate([
                'moodboard_id' => 'required|exists:moodboards,id',
                'moodboard_kasar' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            $moodboard = Moodboard::findOrFail($validated['moodboard_id']);
            Log::info('Moodboard found: ' . $moodboard->id);

            if ($request->hasFile('moodboard_kasar')) {
                Log::info('Processing file upload');
                // Delete old file if exists
                if ($moodboard->moodboard_kasar) {
                    Log::info('Deleting old file: ' . $moodboard->moodboard_kasar);
                    \Storage::disk('public')->delete($moodboard->moodboard_kasar);
                }
                $filePath = $request->file('moodboard_kasar')->store('moodboards', 'public');
                Log::info('File stored at: ' . $filePath);
                $moodboard->moodboard_kasar = $filePath;
            }

            $moodboard->status = 'pending';
            $moodboard->save();
            
            Log::info('Moodboard saved successfully');
            Log::info('=== UPLOAD DESAIN KASAR END ===');

            return back()->with('success', 'Desain kasar berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Upload desain kasar error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload desain kasar: ' . $e->getMessage());
        }
    }

    public function uploadDesainFinal(Request $request, $moodboardId)
    {
        try {
            Log::info('=== UPLOAD DESAIN FINAL START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Has file: ' . ($request->hasFile('moodboard_final') ? 'YES' : 'NO'));
            
            $moodboard = Moodboard::with('commitmentFee')->findOrFail($moodboardId);
            Log::info('Moodboard found, status: ' . $moodboard->status);
            
            if ($moodboard->status !== 'approved') {
                Log::warning('Moodboard not approved, status: ' . $moodboard->status);
                return back()->with('error', 'Moodboard harus di-approve terlebih dahulu sebelum upload desain final.');
            }

            // Check if commitment fee exists and completed
            if (!$moodboard->commitmentFee || $moodboard->commitmentFee->payment_status !== 'completed') {
                Log::warning('Commitment fee not completed for moodboard: ' . $moodboardId);
                return back()->with('error', 'Commitment Fee harus diselesaikan (completed) terlebih dahulu sebelum upload desain final.');
            }

            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            ]);

            Log::info('Validation passed');

            if ($request->hasFile('moodboard_final')) {
                Log::info('Processing file upload');
                // Delete old file if exists
                if ($moodboard->moodboard_final) {
                    Log::info('Deleting old file: ' . $moodboard->moodboard_final);
                    \Storage::disk('public')->delete($moodboard->moodboard_final);
                }
                $filePath = $request->file('moodboard_final')->store('moodboards', 'public');
                Log::info('File stored at: ' . $filePath);
                $moodboard->moodboard_final = $filePath;
            }

            $moodboard->save();
            Log::info('Moodboard saved successfully');
            Log::info('=== UPLOAD DESAIN FINAL END ===');

            return back()->with('success', 'Desain final berhasil diupload.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Upload desain final error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal upload desain final: ' . $e->getMessage());
        }
    }

    public function reviseMoodboard(Request $request, $moodboardId)
    {
        try {
            Log::info('=== REVISE MOODBOARD START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            Log::info('Request data: ', $request->all());
            
            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');

            // Check if estimasi exists
            if (!$moodboard->estimasi) {
                Log::warning('No estimasi found for moodboard: ' . $moodboardId);
                return back()->with('error', 'Estimasi harus dibuat terlebih dahulu sebelum revisi.');
            }
            
            $validated = $request->validate([
                'notes' => 'required|string|max:500',
            ]);

            Log::info('Validation passed');
            
            $moodboard->status = 'revisi';
            $moodboard->notes = $validated['notes'];
            $moodboard->save();
            
            Log::info('Moodboard updated, status: revisi');
            Log::info('=== REVISE MOODBOARD END ===');

            return back()->with('success', 'Moodboard diminta untuk revisi.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Revise moodboard error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal minta revisi: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return Inertia::render('Moodboard/Show', [
            'moodboard' => $moodboard,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function editDesainKasar($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return response()->json([
            'moodboard' => $moodboard,
        ]);
    }

    public function editDesainFinal($id)
    {
        $moodboard = Moodboard::with('order')->findOrFail($id);
        return response()->json([
            'moodboard' => $moodboard,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function updateDesainKasar(Request $request, Moodboard $moodboard)
    {
        $validated = $request->validate([
            'moodboard_id' => 'required|exists:moodboards,id',
            'moodboard_kasar' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        $moodboard = Moodboard::find($validated['moodboard_id']);

        if ($request->hasFile('moodboard_kasar')) {
            $moodboard->moodboard_kasar = $request->file('moodboard_kasar')->store('moodboards', 'public');
        }

        unset($validated['moodboard_id']);

        $moodboard->update($validated);

        return redirect()->back()->with('success', 'Moodboard updated successfully.');
    }

    public function updateDesainFinal(Request $request, $moodboardId)
    {
        $moodboard = Moodboard::findOrFail($moodboardId);
        if ($moodboard->status === 'approved') {
            $validated = $request->validate([
                'moodboard_final' => 'required|file|mimes:jpg,jpeg,png,pdf',
            ]);

            if ($request->hasFile('moodboard_final')) {
                $moodboard->moodboard_final = $request->file('moodboard_final')->store('moodboards', 'public');
            }

            $moodboard->update($validated);
        } else {
            return redirect()->back()->with('error', 'Cannot upload final design. Moodboard not approved yet.');
        }

        return redirect()->back()->with('success', 'Final design uploaded successfully.');
    }

    public function acceptDesain(Request $request, $moodboardId)
    {
        try {
            Log::info('=== ACCEPT DESAIN START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            
            $moodboard = Moodboard::findOrFail($moodboardId);
            Log::info('Moodboard found');
            
            if (!$moodboard->moodboard_kasar) {
                Log::warning('No kasar design found for moodboard: ' . $moodboardId);
                return back()->with('error', 'Desain kasar harus diupload terlebih dahulu.');
            }

            // Check if estimasi exists
            if (!$moodboard->estimasi) {
                Log::warning('No estimasi found for moodboard: ' . $moodboardId);
                return back()->with('error', 'Estimasi harus dibuat terlebih dahulu sebelum accept desain.');
            }

            $moodboard->status = 'approved';
            $moodboard->save();
            
            Log::info('Moodboard approved, status changed to: approved');
            Log::info('=== ACCEPT DESAIN END ===');

            return back()->with('success', 'Desain kasar diterima. Siap untuk upload desain final.');
        } catch (\Exception $e) {
            Log::error('Accept desain error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return back()->with('error', 'Gagal approve desain: ' . $e->getMessage());
        }
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Moodboard $moodboard)
    {
        $moodboard->delete();

        return redirect()->back()->with('success', 'Moodboard deleted successfully.');
    }
}
