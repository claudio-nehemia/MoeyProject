# Notification Feature Implementation Plan

## Overview
Sistem notifikasi untuk workflow order management yang mengatur alur kerja dari surveyor/drafter → desainer → estimator → desainer (approval & final design).

## Workflow Notifikasi

```
Order Created (Team Assignment)
    ↓
    → Notif ke Drafter/Surveyor (yang dipilih)
    ↓
Survey Completed
    ↓
    → Notif ke Desainer (yang dipilih)
    ↓
Moodboard Completed
    ↓
    → Notif ke SEMUA Estimator
    ↓
Estimasi Completed
    ↓
    → Notif ke Desainer (yang dipilih)
    ↓
Design Approved
    ↓
    → Notif ke Desainer (yang dipilih) untuk Final Design
```

## Database Schema

### 1. Create Notifications Table
```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('order_id')->constrained()->onDelete('cascade');
    $table->string('type'); // survey_request, moodboard_request, estimasi_request, design_approval, final_design_request
    $table->string('title');
    $table->text('message');
    $table->json('data')->nullable(); // Additional data
    $table->boolean('is_read')->default(false);
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'is_read']);
    $table->index(['order_id', 'type']);
});
```

### 2. Create Notification Settings Table (Optional)
```php
Schema::create('notification_settings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('notification_type');
    $table->boolean('email_enabled')->default(true);
    $table->boolean('push_enabled')->default(true);
    $table->boolean('in_app_enabled')->default(true);
    $table->timestamps();
    
    $table->unique(['user_id', 'notification_type']);
});
```

## Models

### Notification Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // Notification Types Constants
    const TYPE_SURVEY_REQUEST = 'survey_request';
    const TYPE_MOODBOARD_REQUEST = 'moodboard_request';
    const TYPE_ESTIMASI_REQUEST = 'estimasi_request';
    const TYPE_DESIGN_APPROVAL = 'design_approval';
    const TYPE_FINAL_DESIGN_REQUEST = 'final_design_request';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
```

### Update User Model
```php
// Add to User model
public function notifications()
{
    return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
}

public function unreadNotifications()
{
    return $this->hasMany(Notification::class)->where('is_read', false);
}

public function unreadNotificationsCount()
{
    return $this->unreadNotifications()->count();
}
```

## Service Layer

### NotificationService
```php
<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Order;
use App\Models\User;

class NotificationService
{
    /**
     * Send survey request notification to drafter/surveyor
     */
    public function sendSurveyRequestNotification(Order $order)
    {
        // Get drafter/surveyor from order team
        $surveyors = $order->users()->whereHas('role', function ($query) {
            $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
        })->get();

        foreach ($surveyors as $surveyor) {
            Notification::create([
                'user_id' => $surveyor->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_SURVEY_REQUEST,
                'title' => 'Survey Request - ' . $order->nama_project,
                'message' => 'Anda ditugaskan untuk melakukan survey pada project "' . $order->nama_project . '". Silakan lengkapi data survey.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                    'tanggal_survey' => $order->tanggal_survey,
                ],
            ]);
        }
    }

    /**
     * Send moodboard request notification to designer
     */
    public function sendMoodboardRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_MOODBOARD_REQUEST,
                'title' => 'Moodboard Request - ' . $order->nama_project,
                'message' => 'Survey telah selesai untuk project "' . $order->nama_project . '". Silakan buat moodboard.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                ],
            ]);
        }
    }

    /**
     * Send estimasi request notification to ALL estimators
     */
    public function sendEstimasiRequestNotification(Order $order)
    {
        // Get ALL users with Estimator role
        $estimators = User::whereHas('role', function ($query) {
            $query->where('nama_role', 'Estimator');
        })->get();

        foreach ($estimators as $estimator) {
            Notification::create([
                'user_id' => $estimator->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_ESTIMASI_REQUEST,
                'title' => 'Estimasi Request - ' . $order->nama_project,
                'message' => 'Moodboard telah selesai untuk project "' . $order->nama_project . '". Silakan buat estimasi.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                ],
            ]);
        }
    }

    /**
     * Send design approval notification to designer
     */
    public function sendDesignApprovalNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_DESIGN_APPROVAL,
                'title' => 'Design Approval - ' . $order->nama_project,
                'message' => 'Estimasi telah selesai untuk project "' . $order->nama_project . '". Silakan review dan approve design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                ],
            ]);
        }
    }

    /**
     * Send final design request notification to designer
     */
    public function sendFinalDesignRequestNotification(Order $order)
    {
        // Get designer from order team
        $designers = $order->users()->whereHas('role', function ($query) {
            $query->where('nama_role', 'Desainer');
        })->get();

        foreach ($designers as $designer) {
            Notification::create([
                'user_id' => $designer->id,
                'order_id' => $order->id,
                'type' => Notification::TYPE_FINAL_DESIGN_REQUEST,
                'title' => 'Final Design Request - ' . $order->nama_project,
                'message' => 'Design telah di-approve untuk project "' . $order->nama_project . '". Silakan buat final design.',
                'data' => [
                    'order_name' => $order->nama_project,
                    'customer_name' => $order->customer_name,
                ],
            ]);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId)
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId)
    {
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Get unread count for user
     */
    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Delete notification
     */
    public function deleteNotification($notificationId, $userId)
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->delete();
    }
}
```

## Controller

### NotificationController
```php
<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of user's notifications
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Notification/Index', [
            'notifications' => $notifications,
            'unreadCount' => $this->notificationService->getUnreadCount(auth()->id()),
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        return response()->json([
            'count' => $this->notificationService->getUnreadCount(auth()->id()),
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $this->notificationService->markAsRead($id, auth()->id());

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $this->notificationService->markAllAsRead(auth()->id());

        return response()->json(['success' => true]);
    }

    /**
     * Delete notification
     */
    public function destroy($id)
    {
        $this->notificationService->deleteNotification($id, auth()->id());

        return redirect()->back()->with('success', 'Notification deleted successfully.');
    }
}
```

## Implementation Steps

### Step 1: Create Migration
```bash
php artisan make:migration create_notifications_table
php artisan make:migration create_notification_settings_table
php artisan migrate
```

### Step 2: Create Models
- Create `app/Models/Notification.php`
- Update `app/Models/User.php` with notification relationships

### Step 3: Create Service
- Create `app/Services/NotificationService.php`

### Step 4: Create Controller
- Create `app/Http/Controllers/NotificationController.php`

### Step 5: Update Routes (routes/web.php)
**IMPORTANT**: Notification routes hanya memerlukan middleware `auth` saja, TIDAK perlu role-based permission. Semua user yang sudah login bisa mengakses notifikasi mereka sendiri.

```php
use App\Http\Controllers\NotificationController;

// Notification routes - Accessible by ALL authenticated users (no role permission needed)
Route::middleware(['auth'])->group(function () {
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::post('/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('mark-as-read');
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-as-read');
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
    });
});

// JANGAN tambahkan middleware permission atau role checking di routes ini
// Security sudah dijamin karena controller hanya mengambil notifikasi berdasarkan auth()->id()
```

### Step 6: Update OrderController
Tambahkan trigger notifikasi di OrderController:

```php
// In store method - after order creation and team assignment
use App\Services\NotificationService;

public function store(Request $request)
{
    // ... existing code ...
    
    $order = Order::create($validated);
    
    if (!empty($userIds)) {
        $order->users()->attach($userIds);
        
        // Send notification to surveyor/drafter
        $notificationService = new NotificationService();
        $notificationService->sendSurveyRequestNotification($order);
    }
    
    // ... rest of code ...
}
```

### Step 7: Update SurveyResultsController
Tambahkan trigger untuk mengirim notif ke desainer setelah survey selesai.
Trigger di method `store` setelah survey berhasil dibuat:

```php
// In SurveyResultsController@store - after survey update
use App\Services\NotificationService;

public function store(Request $request)
{
    // ... existing validation and update code ...
    
    $survey->update($validated);
    $survey->jenisPengukuran()->sync($jenisPengukuranIds);
    
    // Handle MOM file upload
    if ($request->hasFile('mom_file')) {
        // ... existing code ...
    }
    
    // Send notification to designer untuk buat moodboard
    $notificationService = new NotificationService();
    $notificationService->sendMoodboardRequestNotification($survey->order);
    
    return redirect()->route('survey-results.index')->with('success', 'Survey Results created successfully.');
}
```

### Step 8: Update MoodboardController
Tambahkan trigger untuk mengirim notif ke SEMUA estimator setelah moodboard kasar selesai diupload.
Trigger di method `uploadDesainKasar` setelah file berhasil diupload:

```php
// In MoodboardController@uploadDesainKasar - after upload desain kasar
use App\Services\NotificationService;

public function uploadDesainKasar(Request $request)
{
    // ... existing validation and upload code ...
    
    if ($request->hasFile('moodboard_kasar')) {
        foreach ($request->file('moodboard_kasar') as $file) {
            $filePath = $file->store('moodboards', 'public');
            $originalName = $file->getClientOriginalName();
            
            MoodboardFile::create([
                'moodboard_id' => $moodboard->id,
                'file_path' => $filePath,
                'original_name' => $originalName,
                'type' => 'kasar',
            ]);
        }
        
        // Send notification to ALL estimators untuk buat estimasi
        $notificationService = new NotificationService();
        $notificationService->sendEstimasiRequestNotification($moodboard->order);
    }
    
    return redirect()->route('moodboard.index')->with('success', 'Moodboard kasar uploaded successfully.');
}
```

### Step 9: Update EstimasiController
Tambahkan trigger untuk mengirim notif ke desainer setelah estimasi file selesai diupload.
Trigger di method `store` setelah estimasi file berhasil dibuat:

```php
// In EstimasiController@store - after estimasi file upload
use App\Services\NotificationService;

public function store(Request $request)
{
    // ... existing validation and upload code ...
    
    if ($request->hasFile('estimated_cost')) {
        $file = $request->file('estimated_cost');
        $filePath = $file->store('estimasi', 'public');
        $originalName = $file->getClientOriginalName();
        
        if ($estimasiFile) {
            // Update existing
            // ... code ...
        } else {
            // Create new
            \App\Models\EstimasiFile::create([
                'estimasi_id' => $estimasi->id,
                'moodboard_file_id' => $validated['moodboard_file_id'],
                'file_path' => $filePath,
                'original_name' => $originalName,
            ]);
        }
        
        // Send notification to designer untuk approval design
        $notificationService = new NotificationService();
        $notificationService->sendDesignApprovalNotification($estimasi->moodboard->order);
    }
    
    return redirect()->route('estimasi.index')->with('success', 'Estimasi uploaded successfully.');
}
```

### Step 10: Update MoodboardController - Accept Design
Tambahkan trigger notifikasi di method `acceptDesain` yang sudah ada.
Setelah design di-approve, trigger notif ke desainer untuk upload final design:

```php
// In MoodboardController@acceptDesain - after accept/approve design
use App\Services\NotificationService;

public function acceptDesain(Request $request, $moodboardId)
{
    // ... existing validation and accept logic ...
    
    // Update moodboard with selected files
    $moodboard->moodboard_kasar = $moodboardFile->file_path;
    $moodboard->estimasi->estimated_cost = $estimasiFile->file_path;
    $moodboard->status = 'approved';

    $moodboard->save();
    $moodboard->estimasi->save();
    
    // Send notification to designer untuk buat final design
    $notificationService = new NotificationService();
    $notificationService->sendFinalDesignRequestNotification($moodboard->order);

    Log::info('Moodboard approved with selected file');
    Log::info('=== ACCEPT DESAIN END ===');

    return back()->with('success', 'Desain kasar diterima. Siap untuk upload desain final.');
}
```

### Step 11: Create Frontend Components

#### NotificationBell Component (Header)
```tsx
// resources/js/Components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    
    useEffect(() => {
        fetchUnreadCount();
        
        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(interval);
    }, []);
    
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-as-read');
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };
    
    return (
        <div className="relative">
            <button 
                onClick={() => router.visit('/notifications')}
                className="relative p-2"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
```

#### Notification Index Page
```tsx
// resources/js/Pages/Notification/Index.tsx
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ notifications, unreadCount }) {
    const handleMarkAsRead = async (id) => {
        await axios.post(`/notifications/${id}/mark-as-read`);
        router.reload();
    };
    
    return (
        <AuthenticatedLayout>
            <Head title="Notifications" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
                            
                            {notifications.data.map((notification) => (
                                <div 
                                    key={notification.id}
                                    className={`p-4 mb-2 rounded ${
                                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                                    }`}
                                >
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-semibold">{notification.title}</h3>
                                            <p className="text-sm text-gray-600">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Step 12: Update Layout
Add NotificationBell component to the main layout header.

## Access Control Rules

### Survey Response
- **Hanya** Drafter/Surveyor yang **dipilih di order team** yang bisa mengisi survey
- Check: `$order->users()->where('user_id', auth()->id())->whereHas('role', fn($q) => $q->whereIn('nama_role', ['Surveyor', 'Drafter']))->exists()`

### Moodboard
- **Hanya** Desainer yang **dipilih di order team** yang bisa mengisi moodboard
- Check: `$order->users()->where('user_id', auth()->id())->whereHas('role', fn($q) => $q->where('nama_role', 'Desainer'))->exists()`

### Estimasi
- **SEMUA** Estimator bisa mengisi estimasi (tidak perlu dipilih di team)
- Check: `auth()->user()->role->nama_role === 'Estimator'`

### Design Approval & Final Design
- **Hanya** Desainer yang **dipilih di order team** yang bisa approve dan buat final design
- Check: `$order->users()->where('user_id', auth()->id())->whereHas('role', fn($q) => $q->where('nama_role', 'Desainer'))->exists()`

## Testing Checklist

- [ ] Migration berhasil dijalankan
- [ ] Model Notification terbuat dengan baik
- [ ] NotificationService berfungsi untuk semua tipe notifikasi
- [ ] Notifikasi terkirim ke drafter/surveyor saat order dibuat dengan team
- [ ] Notifikasi terkirim ke desainer setelah survey selesai
- [ ] Notifikasi terkirim ke SEMUA estimator setelah moodboard selesai
- [ ] Notifikasi terkirim ke desainer setelah estimasi selesai
- [ ] Notifikasi terkirim ke desainer untuk final design setelah approve
- [ ] Badge unread count muncul di notification bell
- [ ] Mark as read berfungsi
- [ ] Mark all as read berfungsi
- [ ] Access control untuk response berfungsi sesuai rule
- [ ] Frontend notification list tampil dengan baik

## Future Enhancements

1. **Real-time Notifications**
   - Implementasi Laravel Echo + Pusher/WebSockets
   - Push notification untuk mobile

2. **Email Notifications**
   - Send email untuk notifikasi penting
   - Email digest (daily/weekly summary)

3. **Notification Preferences**
   - User bisa set preference notifikasi apa yang mau diterima
   - Channel preference (in-app, email, push)

4. **Notification Templates**
   - Template system untuk customizable notification messages

5. **Notification History**
   - Archive old notifications
   - Search and filter notifications

## Notes
- Pastikan setiap stage workflow memiliki status/flag yang jelas untuk trigger notifikasi berikutnya
- Consider adding `order_status` atau `workflow_stage` field di orders table untuk tracking
- Implement proper error handling untuk notification failures
- Add logging untuk tracking notification delivery
