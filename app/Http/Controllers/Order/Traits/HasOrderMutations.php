<?php

namespace App\Http\Controllers\Order\Traits;

use App\Models\Order;
use App\Models\TaskResponse;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\ImageService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait HasOrderMutations
{
    public function store(Request $request)
    {
        Log::info('=== DEBUG ORDER STORE ===');
        Log::info('All Request Data:', $request->all());
        Log::info('User IDs from request:', ['user_ids' => $request->input('user_ids', [])]);
        Log::info('Has user_ids key?', ['has_user_ids' => $request->has('user_ids')]);

        Log::info('Individual Fields:', [
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
            'customer_email' => 'nullable|email|max:255',
            'customer_user_id' => 'nullable|exists:users,id',
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

        $validated['project_status'] = $validated['project_status'] ?? 'pending';
        $validated['priority_level'] = $validated['priority_level'] ?? 'medium';
        $validated['tanggal_masuk_customer'] = now()->toDateString();

        if (empty($validated['customer_user_id']) && !empty($validated['customer_email'])) {
            $existingUser = User::where('email', $validated['customer_email'])->first();
            if ($existingUser) {
                $validated['customer_user_id'] = $existingUser->id;
            }
        } elseif (!empty($validated['customer_user_id']) && empty($validated['customer_email'])) {
            $custUser = User::find($validated['customer_user_id']);
            if ($custUser) {
                $validated['customer_email'] = $custUser->email;
            }
        }

        Log::info('Validated Data:', $validated);
        Log::info('User IDs after validation:', ['user_ids' => $validated['user_ids'] ?? []]);

        if ($request->hasFile('mom_file')) {
            $result = app(ImageService::class)->saveRawFile($request->file('mom_file'), 'mom_files');
            $validated['mom_file'] = $result['path'];
            $validated['mom_files'] = [$result];
            Log::info('MOM file uploaded:', ['file' => $validated['mom_file'], 'original_name' => $result['original_name'] ?? null]);
        }

        $userIds = $validated['user_ids'] ?? [];
        unset($validated['user_ids']);

        $validated['created_by'] = auth()->id();

        $order = Order::create($validated);
        Log::info('Order created with ID:', ['order_id' => $order->id]);

        $teamNames = [];
        if (!empty($userIds)) {
            Log::info('Attaching users to order:', ['user_ids' => $userIds]);
            $order->users()->attach($userIds);
            Log::info('Users attached successfully');
            $teamNames = User::whereIn('id', $userIds)->pluck('name')->toArray();
            $notificationService = new NotificationService();
            $notificationService->sendSurveyRequestNotification($order);
        } else {
            Log::warning('No user_ids to attach - skipping team assignment');
        }

        ActivityLogService::log(
            $order->id,
            $order,
            'create',
            'Order Dibuat',
            "Membuat order baru #{$order->id}: {$order->nama_project} (Customer: {$order->customer_name})",
            [
                'order' => [
                    'nama_project' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'company_name' => $order->company_name,
                    'phone_number' => $order->phone_number,
                    'alamat' => $order->alamat,
                ],
                'team' => $teamNames,
                'has_mom' => !empty($order->mom_file) || !empty($order->mom_files),
            ]
        );

        $nextTaskExist = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey')
            ->exists();
        if (!$nextTaskExist) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'survey',
                'start_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => 3,
                'extend_time' => 0,
                'status' => 'menunggu_response',
            ]);

            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'survey',
                'start_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => 3,
                'extend_time' => 0,
                'status' => 'menunggu_response',
                'is_marketing' => true,
            ]);
        }

        return redirect('/order')->with('success', 'Order created successfully.');
    }

    public function update(Request $request, Order $order)
    {
        Log::info('=== DEBUG ORDER UPDATE ===');
        Log::info('Order ID:', ['order_id' => $order->id]);
        Log::info('All Request Data:', $request->all());
        Log::info('User IDs from request:', ['user_ids' => $request->input('user_ids', [])]);
        Log::info('Has user_ids key?', ['has_user_ids' => $request->has('user_ids')]);

        $validated = $request->validate([
            'nama_project' => 'required|string|max:255',
            'jenis_interior_id' => 'required|exists:jenis_interiors,id',
            'company_name' => 'required|string|max:255',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_user_id' => 'nullable|exists:users,id',
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

        $validated['project_status'] = $validated['project_status'] ?? $order->project_status ?? 'pending';
        $validated['priority_level'] = $validated['priority_level'] ?? $order->priority_level ?? 'medium';
        $validated['tanggal_masuk_customer'] = now()->toDateString();

        if (empty($validated['customer_user_id']) && !empty($validated['customer_email'])) {
            $existingUser = User::where('email', $validated['customer_email'])->first();
            if ($existingUser) {
                $validated['customer_user_id'] = $existingUser->id;
            }
        } elseif (!empty($validated['customer_user_id']) && empty($validated['customer_email'])) {
            $custUser = User::find($validated['customer_user_id']);
            if ($custUser) {
                $validated['customer_email'] = $custUser->email;
            }
        }

        Log::info('Validated Data:', $validated);
        Log::info('User IDs after validation:', ['user_ids' => $validated['user_ids'] ?? []]);

        if ($request->hasFile('mom_file')) {
            if ($order->mom_file && Storage::disk('public')->exists($order->mom_file)) {
                Storage::disk('public')->delete($order->mom_file);
                Log::info('Old MOM file deleted:', ['file' => $order->mom_file]);
            }

            $existingMomFiles = $order->mom_files ?? [];
            foreach ($existingMomFiles as $entry) {
                $path = is_array($entry) ? ($entry['path'] ?? null) : (is_string($entry) ? $entry : null);
                if ($path && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            $result = app(ImageService::class)->saveRawFile($request->file('mom_file'), 'mom_files');
            $validated['mom_file'] = $result['path'];
            $validated['mom_files'] = [$result];
            Log::info('New MOM file uploaded:', ['file' => $validated['mom_file'], 'original_name' => $result['original_name'] ?? null]);
        }

        $order->fill($validated);
        $changedAttributes = ActivityLogService::getChangedAttributes($order);

        $previousUserIds = $order->users->pluck('id')->toArray();
        $teamChanged = false;
        $newTeamNames = [];

        $order->save();
        Log::info('Order updated successfully');

        if ($request->has('user_ids')) {
            $userIds = $request->input('user_ids', []);
            Log::info('Syncing users to order:', ['user_ids' => $userIds]);
            $order->users()->sync($userIds);
            Log::info('Users synced successfully');

            sort($previousUserIds);
            $sortedNewUserIds = $userIds;
            sort($sortedNewUserIds);
            if ($previousUserIds !== $sortedNewUserIds) {
                $teamChanged = true;
                $newTeamNames = User::whereIn('id', $userIds)->pluck('name')->toArray();
            }
        } else {
            Log::info('Skipping team sync - user_ids not provided in request');
        }

        $logDescriptionParts = [];
        if (!empty($changedAttributes)) {
            $logDescriptionParts[] = ActivityLogService::formatChangesSummary($changedAttributes);
        }
        if ($request->hasFile('mom_file')) {
            $logDescriptionParts[] = "Mengunggah file MoM baru: " . ($validated['mom_file'] ?? 'file');
        }
        if ($teamChanged) {
            $logDescriptionParts[] = "Memperbarui tim project (" . count($newTeamNames) . " anggota)";
        }

        $logDescription = !empty($logDescriptionParts)
            ? implode(' | ', $logDescriptionParts)
            : "Memperbarui data order #{$order->id}";

        ActivityLogService::log(
            $order->id,
            $order,
            'update',
            'Order Diperbarui',
            $logDescription,
            [
                'changes' => $changedAttributes,
                'team_changed' => $teamChanged,
                'team' => $teamChanged ? $newTeamNames : null,
                'uploaded_mom' => $request->hasFile('mom_file'),
            ]
        );

        $nextTaskExist = TaskResponse::where('order_id', $order->id)
            ->where('tahap', 'survey')
            ->exists();
        if (!$nextTaskExist) {
            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'survey',
                'start_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => 3,
                'extend_time' => 0,
                'status' => 'menunggu_response',
            ]);

            TaskResponse::create([
                'order_id' => $order->id,
                'user_id' => null,
                'tahap' => 'survey',
                'start_time' => now(),
                'deadline' => now()->addDays(3),
                'duration' => 3,
                'duration_actual' => 3,
                'extend_time' => 0,
                'status' => 'menunggu_response',
                'is_marketing' => true,
            ]);

            $notificationService = new NotificationService();
            $notificationService->sendSurveyRequestNotification($order);
        }

        return redirect()->route('order.index')->with('success', 'Order updated successfully.');
    }
}
