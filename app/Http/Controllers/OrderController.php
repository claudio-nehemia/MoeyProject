<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\TaskResponse;
use Illuminate\Http\Request;
use App\Models\JenisInterior;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        \Log::info('=== ORDER INDEX DEBUG ===');
        \Log::info('User ID: ' . $user->id);
        \Log::info('User Name: ' . $user->name);
        \Log::info('User Role: ' . ($user->role ? $user->role->nama_role : 'NO ROLE'));

        $orders = Order::with('users', 'jenisInterior')
            ->visibleToUser($user)
            ->get();

        \Log::info('Orders count: ' . $orders->count());
        \Log::info('Order IDs: ' . $orders->pluck('id')->implode(', '));

        return Inertia::render('Order/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $marketings = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Kepala Marketing');
        })->get();
        $drafters = User::whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get();
        $desainers = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();
        $jenisInteriors = JenisInterior::select('id', 'nama_interior')->get();

        return Inertia::render('Order/Create', [
            'marketings' => $marketings,
            'drafters' => $drafters,
            'desainers' => $desainers,
            'jenisInteriors' => $jenisInteriors,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // DEBUG: Log semua data yang diterima
        \Log::info('=== DEBUG ORDER STORE ===');
        \Log::info('All Request Data:', $request->all());
        \Log::info('User IDs from request:', ['user_ids' => $request->input('user_ids', [])]);
        \Log::info('Has user_ids key?', ['has_user_ids' => $request->has('user_ids')]);

        // Log each field individually for debugging
        \Log::info('Individual Fields:', [
            'nama_project' => $request->input('nama_project'),
            'jenis_interior_id' => $request->input('jenis_interior_id'),
            'company_name' => $request->input('company_name'),
            'customer_name' => $request->input('customer_name'),
            'phone_number' => $request->input('phone_number'),
            'tanggal_masuk_customer' => $request->input('tanggal_masuk_customer'),
        ]);

        $validated = $request->validate([
            'nama_project' => 'required|string|max:255',
            'jenis_interior_id' => 'required|exists:jenis_interiors,id',
            'company_name' => 'required|string|max:255',
            'customer_name' => 'required|string|max:255',
            'customer_additional_info' => 'nullable|string',
            'nomor_unit' => 'nullable|string|max:100',
            'phone_number' => 'required|string|max:20',
            'alamat' => 'required|string',
            'tanggal_masuk_customer' => 'required|date',
            'project_status' => 'nullable|string|max:100',
            'priority_level' => 'nullable|string|max:100',
            'mom_file' => 'nullable|file|mimes:pdf,doc,docx',
            'user_ids' => 'nullable|array',
            'tanggal_survey' => 'nullable|string',
        ]);

        // Set defaults for nullable fields if not provided
        $validated['project_status'] = $validated['project_status'] ?? 'pending';
        $validated['priority_level'] = $validated['priority_level'] ?? 'medium';

        $validated['tanggal_masuk_customer'] = now()->toDateString();

        \Log::info('Validated Data:', $validated);
        \Log::info('User IDs after validation:', ['user_ids' => $validated['user_ids'] ?? []]);

        // Handle file upload
        if ($request->hasFile('mom_file')) {
            $validated['mom_file'] = $request->file('mom_file')->store('mom_files', 'public');
            \Log::info('MOM file uploaded:', ['file' => $validated['mom_file']]);
        }

        // Remove user_ids from validated data before creating order
        $userIds = $validated['user_ids'] ?? [];
        unset($validated['user_ids']);

        $order = Order::create($validated);
        \Log::info('Order created with ID:', ['order_id' => $order->id]);

        // Tambahkan Kepala Marketing pertama (yang ID terkecil) ke team
        $firstKepalaMarketing = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Kepala Marketing');
        })->orderBy('id', 'asc')->first();

        if ($firstKepalaMarketing) {
            // Add Kepala Marketing to userIds if not already there
            if (!in_array($firstKepalaMarketing->id, $userIds)) {
                $userIds[] = $firstKepalaMarketing->id;
                \Log::info('Added first Kepala Marketing to team:', ['user_id' => $firstKepalaMarketing->id, 'name' => $firstKepalaMarketing->name]);
            }
        }

        if (!empty($userIds)) {
            \Log::info('Attaching users to order:', ['user_ids' => $userIds]);
            $order->users()->attach($userIds);
            \Log::info('Users attached successfully');
            $notificationService = new NotificationService();
            $notificationService->sendSurveyRequestNotification($order);
        } else {
            \Log::warning('No user_ids to attach - skipping team assignment');
        }

        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null, // Akan diisi saat user klik Response
            'tahap' => 'survey',
            'start_time' => now(),
            'deadline' => now()->addDays(3), // Deadline 3 hari
            'duration' => 3, // Durasi awal 3 hari
            'duration_actual' => 3, // Durasi actual 3 hari
            'extend_time' => 0,
            'status' => 'menunggu_response',
        ]);

        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null, // Akan diisi saat user klik Response
            'tahap' => 'survey',
            'start_time' => now(),
            'deadline' => now()->addDays(3), // Deadline 3 hari
            'duration' => 3, // Durasi awal 3 hari
            'duration_actual' => 3, // Durasi actual 3 hari
            'extend_time' => 0,
            'status' => 'menunggu_response',
            'is_marketing' => true,
        ]);

        return redirect('/order')->with('success', 'Order created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        $order->load('users.role', 'jenisInterior');
        return Inertia::render('Order/Show', [
            'order' => $order,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Order $order)
    {
        $marketings = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Kepala Marketing');
        })->get();
        $drafters = User::whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get();
        $desainers = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();
        $jenisInteriors = JenisInterior::select('id', 'nama_interior')->get();

        // Get existing team members (ambil ID dari User model, bukan dari pivot)
        $existingUserIds = $order->users->pluck('id')->toArray();

        return Inertia::render('Order/Edit', [
            'order' => $order,
            'marketings' => $marketings,
            'drafters' => $drafters,
            'desainers' => $desainers,
            'jenisInteriors' => $jenisInteriors,
            'existingUserIds' => $existingUserIds,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        // DEBUG: Log semua data yang diterima
        \Log::info('=== DEBUG ORDER UPDATE ===');
        \Log::info('Order ID:', ['order_id' => $order->id]);
        \Log::info('All Request Data:', $request->all());
        \Log::info('User IDs from request:', ['user_ids' => $request->input('user_ids', [])]);
        \Log::info('Has user_ids key?', ['has_user_ids' => $request->has('user_ids')]);

        $validated = $request->validate([
            'nama_project' => 'required|string|max:255',
            'jenis_interior_id' => 'required|exists:jenis_interiors,id',
            'company_name' => 'required|string|max:255',
            'customer_name' => 'required|string|max:255',
            'customer_additional_info' => 'nullable|string',
            'nomor_unit' => 'nullable|string|max:100',
            'phone_number' => 'required|string|max:20',
            'alamat' => 'required|string',
            'tanggal_masuk_customer' => 'required|date',
            'project_status' => 'nullable|string|max:100',
            'priority_level' => 'nullable|string|max:100',
            'mom_file' => 'nullable|file|mimes:pdf,doc,docx',
            'user_ids' => 'nullable|array',
            'tanggal_survey' => 'nullable|string',
        ]);

        // Set defaults for nullable fields if not provided
        $validated['project_status'] = $validated['project_status'] ?? $order->project_status ?? 'pending';
        $validated['priority_level'] = $validated['priority_level'] ?? $order->priority_level ?? 'medium';
        $validated['tanggal_masuk_customer'] = now()->toDateString();

        \Log::info('Validated Data:', $validated);
        \Log::info('User IDs after validation:', ['user_ids' => $validated['user_ids'] ?? []]);

        // Handle file upload - delete old file if new one is uploaded
        if ($request->hasFile('mom_file')) {
            // Delete old file if exists
            if ($order->mom_file && \Storage::disk('public')->exists($order->mom_file)) {
                \Storage::disk('public')->delete($order->mom_file);
                \Log::info('Old MOM file deleted:', ['file' => $order->mom_file]);
            }
            // Store new file
            $validated['mom_file'] = $request->file('mom_file')->store('mom_files', 'public');
            \Log::info('New MOM file uploaded:', ['file' => $validated['mom_file']]);
        }

        // Remove user_ids from validated data before updating order
        $userIds = $validated['user_ids'] ?? [];
        unset($validated['user_ids']);

        $order->update($validated);
        \Log::info('Order updated successfully');

        // Tambahkan Kepala Marketing pertama (yang ID terkecil) ke team jika user_ids disediakan
        if ($request->has('user_ids')) {
            $firstKepalaMarketing = User::whereHas('role', function ($query) {
                $query->where('nama_role', 'Kepala Marketing');
            })->orderBy('id', 'asc')->first();

            if ($firstKepalaMarketing) {
                // Add Kepala Marketing to userIds if not already there
                if (!in_array($firstKepalaMarketing->id, $userIds)) {
                    $userIds[] = $firstKepalaMarketing->id;
                    \Log::info('Added first Kepala Marketing to team during update:', ['user_id' => $firstKepalaMarketing->id, 'name' => $firstKepalaMarketing->name]);
                }
            }

            \Log::info('Syncing users to order:', ['user_ids' => $userIds]);
            $order->users()->sync($userIds);
            \Log::info('Users synced successfully');
        } else {
            \Log::info('Skipping team sync - user_ids not provided in request');
        }

        return redirect()->route('order.index')->with('success', 'Order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->back()->with('success', 'Order deleted successfully.');
    }
}
