# Sistem Tracking Response dan Deadline Task

## 📋 Overview

Sistem ini bertujuan untuk tracking semua response dan deadline dari setiap tahap project. Setiap tahap memiliki:
- **Response Time**: Kapan user klik tombol "Response"
- **Update Data Time**: Kapan data diisi/di-update (publish, bukan draft)
- **Start Time**: Kapan tahap dimulai
- **Deadline**: Batas waktu penyelesaian
- **Status**: menunggu_response, menunggu_input, selesai, telat
- **Duration**: Durasi yang dijadwalkan
- **Duration Actual**: Durasi sebenarnya (sebelum response)
- **Extend Time**: Berapa kali perpanjangan

---

## 🗄️ Database Schema

### Migration: `create_task_responses_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('tahap'); // survey, moodboard, cm_fee, desain_final, rab, kontrak, survey_ulang, gambar_kerja, produksi
            $table->timestamp('start_time'); // Kapan tahap dimulai
            $table->timestamp('response_time')->nullable(); // Kapan user klik Response
            $table->timestamp('update_data_time')->nullable(); // Kapan data diisi/di-update (publish, bukan draft)
            $table->timestamp('deadline'); // Batas waktu
            $table->integer('duration')->default(0); // Durasi dalam hari (total setelah response)
            $table->integer('duration_actual')->default(0); // Durasi sebenarnya (sebelum response)
            $table->integer('extend_time')->default(0); // Berapa kali perpanjangan
            $table->text('extend_reason')->nullable(); // Alasan perpanjangan
            $table->enum('status', [
                'menunggu_response', // Belum klik Response
                'menunggu_input',    // Sudah Response, belum isi data
                'selesai',           // Sudah Response dan sudah isi data (bukan draft)
                'telat'              // Lewat deadline
            ])->default('menunggu_response');
            $table->timestamps();
            
            // Index untuk performa query
            $table->index(['order_id', 'tahap']);
            $table->index(['status', 'deadline']);
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_responses');
    }
};
```

---

## 📦 Model: `TaskResponse.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskResponse extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'tahap',
        'start_time',
        'response_time',
        'update_data_time',
        'deadline',
        'duration',
        'duration_actual',
        'extend_time',
        'extend_reason',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'response_time' => 'datetime',
        'update_data_time' => 'datetime',
        'deadline' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Cek apakah sudah lewat deadline
     */
    public function isOverdue(): bool
    {
        return $this->deadline < now() && $this->status !== 'selesai';
    }

    /**
     * Cek apakah H-1 deadline
     */
    public function isOneDayBeforeDeadline(): bool
    {
        $oneDayBefore = $this->deadline->copy()->subDay();
        return now()->isSameDay($oneDayBefore) || 
               (now()->isAfter($oneDayBefore) && now()->isBefore($this->deadline));
    }
}
```

---

## 🎯 IMPLEMENTASI LENGKAP: TAHAP SURVEY

### Step 1: Update OrderController - Store Method

**File**: `app/Http/Controllers/OrderController.php`

Tambahkan setelah order dibuat (setelah line 120):

```php
use App\Models\TaskResponse;

// ... di dalam method store(), setelah $order = Order::create($validated);

// Create task response untuk tahap survey
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
```

### Step 2: Update SurveyResultsController - markResponse Method

**File**: `app/Http/Controllers/SurveyResultsController.php`

Tambahkan di method `markResponse()` setelah line 113:

```php
use App\Models\TaskResponse;

// ... di dalam method markResponse(), setelah SurveyResults::create atau update

// Update task response: user sudah klik Response
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'survey')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_response') {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        'response_time' => now(),
        'deadline' => now()->addDays(6), // Tambah 3 hari lagi (total 6 hari)
        'duration' => 6, // Total duration jadi 6 hari
        'duration_actual' => $taskResponse->duration_actual, // Tetap 3 hari
        'status' => 'menunggu_input', // Status berubah jadi menunggu input
    ]);
}
```

### Step 3: Update SurveyResultsController - store/update Method (Publish)

**File**: `app/Http/Controllers/SurveyResultsController.php`

Tambahkan di method `store()` dan `update()` setelah line 263 dan 419 (setelah notification dikirim):

```php
// Update task response: data sudah diisi (bukan draft)
if (!$isDraft) {
    $taskResponse = TaskResponse::where('order_id', $survey->order->id)
        ->where('tahap', 'survey')
        ->first();

    if ($taskResponse) {
        $taskResponse->update([
            'update_data_time' => now(), // Kapan data diisi
            'status' => 'selesai',
        ]);
    }
}
```

### Step 4: Create Command untuk Check Deadline (H-1 Reminder)

**File**: `app/Console/Commands/CheckTaskDeadlines.php`

```php
<?php

namespace App\Console\Commands;

use App\Models\TaskResponse;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CheckTaskDeadlines extends Command
{
    protected $signature = 'tasks:check-deadlines';
    protected $description = 'Check task deadlines and send notifications for H-1 reminders';

    public function handle()
    {
        $this->info('Checking task deadlines...');

        // Ambil semua task yang statusnya bukan 'selesai' dan deadline H-1
        $tasks = TaskResponse::whereIn('status', ['menunggu_response', 'menunggu_input'])
            ->whereDate('deadline', '=', Carbon::tomorrow())
            ->get();

        $this->info("Found {$tasks->count()} tasks with deadline tomorrow");

        $notificationService = new NotificationService();

        foreach ($tasks as $task) {
            $order = $task->order;
            
            // Tentukan user yang harus dikirim notifikasi berdasarkan tahap
            $usersToNotify = $this->getUsersForTahap($order, $task->tahap);

            foreach ($usersToNotify as $user) {
                $notificationService->sendTaskDeadlineReminderNotification(
                    $order,
                    $task,
                    $user
                );
            }
        }

        // Update status jadi 'telat' untuk yang lewat deadline
        $overdueTasks = TaskResponse::whereIn('status', ['menunggu_response', 'menunggu_input'])
            ->where('deadline', '<', now())
            ->get();

        foreach ($overdueTasks as $task) {
            $task->update(['status' => 'telat']);
            $this->warn("Task {$task->id} marked as overdue");
        }

        $this->info('Deadline check completed');
    }

    /**
     * Get users yang harus dikirim notifikasi berdasarkan tahap
     */
    private function getUsersForTahap(Order $order, string $tahap): array
    {
        $users = [];

        switch ($tahap) {
            case 'survey':
                // Hanya drafter dan surveyor dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->whereIn('nama_role', ['Surveyor', 'Drafter']);
                })->get()->toArray();
                break;

            case 'moodboard':
                // Desainer dari order team
                $users = $order->users()->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Desainer');
                })->get()->toArray();
                break;

            // Tambahkan case lain sesuai kebutuhan
            // case 'cm_fee': ...
            // case 'desain_final': ...
            // dll
        }

        return $users;
    }
}
```

### Step 5: Update NotificationService - Add Method untuk Deadline Reminder

**File**: `app/Services/NotificationService.php`

Tambahkan method baru:

```php
/**
 * Send deadline reminder notification (H-1)
 */
public function sendTaskDeadlineReminderNotification(Order $order, TaskResponse $taskResponse, User $user)
{
    $tahapNames = [
        'survey' => 'Survey',
        'moodboard' => 'Moodboard',
        'cm_fee' => 'Commitment Fee',
        'desain_final' => 'Desain Final',
        'rab' => 'RAB',
        'kontrak' => 'Kontrak',
        'survey_ulang' => 'Survey Ulang',
        'gambar_kerja' => 'Gambar Kerja',
        'produksi' => 'Produksi',
    ];

    $tahapName = $tahapNames[$taskResponse->tahap] ?? $taskResponse->tahap;
    $statusText = $taskResponse->status === 'menunggu_response' 
        ? 'Response' 
        : 'Input Data';

    $notification = Notification::create([
        'user_id' => $user->id,
        'order_id' => $order->id,
        'type' => 'task_deadline_reminder',
        'title' => "Reminder: {$tahapName} - {$order->nama_project}",
        'message' => "Deadline {$tahapName} untuk project \"{$order->nama_project}\" besok. Segera {$statusText}.",
        'data' => [
            'order_name' => $order->nama_project,
            'customer_name' => $order->customer_name,
            'tahap' => $taskResponse->tahap,
            'deadline' => $taskResponse->deadline->toDateString(),
            'action_url' => $this->getActionUrlForTahap($taskResponse->tahap),
        ],
    ]);

    // Send FCM push notification
    $this->fcmService->sendToUser($user->id, [
        'title' => $notification->title,
        'body' => $notification->message,
        'data' => [
            'notification_id' => $notification->id,
            'type' => $notification->type,
            'order_id' => $order->id,
        ],
    ]);
}

/**
 * Get action URL berdasarkan tahap
 */
private function getActionUrlForTahap(string $tahap): string
{
    $urls = [
        'survey' => '/survey-results',
        'moodboard' => '/moodboard',
        'cm_fee' => '/commitment-fee',
        'desain_final' => '/desain-final',
        'rab' => '/rab-internal',
        'kontrak' => '/kontrak',
        'survey_ulang' => '/survey-ulang',
        'gambar_kerja' => '/gambar-kerja',
        'produksi' => '/project-management',
    ];

    return $urls[$tahap] ?? '/order';
}
```

### Step 6: Register Command di Kernel

**File**: `app/Console/Kernel.php` (jika menggunakan Laravel < 11) atau `routes/console.php` (Laravel 11+)

**Untuk Laravel 11+ (routes/console.php)**:
```php
<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('tasks:check-deadlines')->daily();
```

**Untuk Laravel < 11 (app/Console/Kernel.php)**:
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('tasks:check-deadlines')->daily();
}
```

### Step 7: Create Controller Method untuk Request Extension

**File**: `app/Http/Controllers/TaskResponseController.php` (BARU)

```php
<?php

namespace App\Http\Controllers;

use App\Models\TaskResponse;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskResponseController extends Controller
{
    /**
     * Request extension untuk task
     */
    public function requestExtension(Request $request, $orderId, $tahap)
    {
        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:30',
            'reason' => 'required|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $taskResponse = TaskResponse::where('order_id', $orderId)
                ->where('tahap', $tahap)
                ->firstOrFail();

            // Update deadline dengan tambahan hari
            $newDeadline = $taskResponse->deadline->copy()->addDays($validated['days']);
            
            $taskResponse->update([
                'deadline' => $newDeadline,
                'duration' => $taskResponse->duration + $validated['days'],
                'extend_time' => $taskResponse->extend_time + 1,
                'extend_reason' => ($taskResponse->extend_reason ? $taskResponse->extend_reason . "\n\n" : '') 
                    . "Perpanjangan #{$taskResponse->extend_time}: {$validated['reason']}",
            ]);

            DB::commit();

            return back()->with('success', "Perpanjangan {$validated['days']} hari berhasil diajukan.");
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error requesting extension: ' . $e->getMessage());
            return back()->with('error', 'Gagal mengajukan perpanjangan.');
        }
    }

    /**
     * Get task response untuk order dan tahap tertentu
     */
    public function getTaskResponse($orderId, $tahap)
    {
        $taskResponse = TaskResponse::where('order_id', $orderId)
            ->where('tahap', $tahap)
            ->first();

        return response()->json($taskResponse);
    }
}
```

### Step 8: Add Route untuk Extension

**File**: `routes/web.php`

```php
Route::post('/task-response/{orderId}/{tahap}/extend', [TaskResponseController::class, 'requestExtension'])
    ->name('task-response.extend');
Route::get('/task-response/{orderId}/{tahap}', [TaskResponseController::class, 'getTaskResponse'])
    ->name('task-response.show');
```

### Step 9: Update SurveyResultsController - Auto Create Next Task

**File**: `app/Http/Controllers/SurveyResultsController.php`

Tambahkan di method `store()` dan `update()` setelah task response survey diupdate jadi 'selesai':

```php
// Setelah update task response survey jadi 'selesai'
// Create task response untuk tahap selanjutnya (moodboard)
if (!$isDraft) {
    // Pastikan belum ada task response untuk moodboard
    $nextTaskExists = TaskResponse::where('order_id', $survey->order->id)
        ->where('tahap', 'moodboard')
        ->exists();

    if (!$nextTaskExists) {
        TaskResponse::create([
            'order_id' => $survey->order->id,
            'user_id' => null,
            'tahap' => 'moodboard',
            'start_time' => now(),
            'deadline' => now()->addDays(5), // Contoh: deadline 5 hari untuk moodboard
            'duration' => 5,
            'duration_actual' => 5,
            'extend_time' => 0,
            'status' => 'menunggu_response',
        ]);
    }
}
```

---

## 📝 TEMPLATE IMPLEMENTASI: TAHAP LAINNYA

### Template untuk Moodboard

**1. Update MoodboardController - responseMoodboard()**

```php
// Setelah line 122 (setelah moodboard dibuat/updated)
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'moodboard')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_response') {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        'response_time' => now(),
        'deadline' => now()->addDays(8), // Tambah 3 hari (total 8 hari)
        'duration' => 8,
        'duration_actual' => $taskResponse->duration_actual,
        'status' => 'menunggu_input',
    ]);
}
```

**2. Update MoodboardController - uploadDesainKasar() atau acceptDesain()**

```php
// Setelah desain kasar di-approve (line 584)
$taskResponse = TaskResponse::where('order_id', $moodboard->order->id)
    ->where('tahap', 'moodboard')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'update_data_time' => now(), // Kapan data diisi
        'status' => 'selesai',
    ]);

    // Create task response untuk tahap selanjutnya (cm_fee)
    $nextTaskExists = TaskResponse::where('order_id', $moodboard->order->id)
        ->where('tahap', 'cm_fee')
        ->exists();

    if (!$nextTaskExists) {
        TaskResponse::create([
            'order_id' => $moodboard->order->id,
            'user_id' => null,
            'tahap' => 'cm_fee',
            'start_time' => now(),
            'deadline' => now()->addDays(3), // Deadline untuk cm_fee
            'duration' => 3,
            'duration_actual' => 3,
            'extend_time' => 0,
            'status' => 'menunggu_response',
        ]);
    }
}
```

**3. Update CheckTaskDeadlines Command - getUsersForTahap()**

```php
case 'moodboard':
    // Desainer dari order team
    $users = $order->users()->whereHas('role', function ($query) {
        $query->where('nama_role', 'Desainer');
    })->get()->toArray();
    break;
```

### Template untuk Commitment Fee

**1. Update CommitmentFeeController - responseCommitmentFee() atau create()**

```php
// Setelah response
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'cm_fee')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_response') {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        'response_time' => now(),
        'deadline' => now()->addDays(5), // Tambah 2 hari (total 5 hari)
        'duration' => 5,
        'duration_actual' => $taskResponse->duration_actual,
        'status' => 'menunggu_input',
    ]);
}
```

**2. Update CommitmentFeeController - store() atau update() (setelah payment_status = 'completed')**

```php
// Setelah payment_status = 'completed'
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'cm_fee')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'status' => 'selesai',
    ]);

    // Create task response untuk tahap selanjutnya (desain_final)
    // ...
}
```

**3. Update CheckTaskDeadlines Command**

```php
case 'cm_fee':
    // Legal Admin (semua legal admin)
    $users = User::whereHas('role', function ($query) {
        $query->where('nama_role', 'Legal Admin');
    })->get()->toArray();
    break;
```

### Template untuk Tahap Lainnya

Ikuti pola yang sama:

1. **Response Method**: Update task response saat user klik Response
   - Set `user_id`, `response_time`
   - Update `deadline` (tambah hari sesuai kebutuhan)
   - Update `duration` (total)
   - Set `status` jadi `menunggu_input`

2. **Store/Update Method**: Update task response saat data sudah diisi (bukan draft)
   - Set `update_data_time` ke `now()`
   - Set `status` jadi `selesai`
   - Create task response untuk tahap selanjutnya

3. **CheckTaskDeadlines Command**: Tambahkan case untuk tahap tersebut
   - Tentukan user yang harus dikirim notifikasi

---

## 📋 MENU TANPA RESPONSE METHOD

Beberapa menu **TIDAK memiliki Response Method**, artinya mereka langsung masuk ke fase **"menunggu_input"** tanpa fase "menunggu_response". Menu-menu ini adalah:

1. **Invoice** - Langsung generate invoice, tidak ada response
2. **ApprovalRab** - Langsung edit/update keterangan material, tidak ada response
3. **ProjectManagement/Produksi** - Langsung update stage, tidak ada response

**Catatan**: Workplan **MEMILIKI response method**, jadi termasuk kategori menu dengan response, bukan tanpa response.

### Struktur Implementasi untuk Menu Tanpa Response

Untuk menu tanpa response, struktur task response berbeda:

#### 1. Saat Create Task Response (Auto dari tahap sebelumnya)

**Tidak ada fase "menunggu_response"**, langsung status `menunggu_input`:

```php
// Contoh: Saat kontrak selesai, create task response untuk Invoice
TaskResponse::create([
    'order_id' => $order->id,
    'user_id' => null, // Akan diisi saat user mulai input data
    'tahap' => 'invoice',
    'start_time' => now(),
    'deadline' => now()->addDays(3), // Deadline 3 hari
    'duration' => 3, // Durasi 3 hari
    'duration_actual' => 3, // Durasi actual 3 hari
    'extend_time' => 0,
    'status' => 'menunggu_input', // LANGSUNG menunggu_input, bukan menunggu_response
]);
```

#### 2. Saat User Mulai Input Data (Store/Update Method Pertama Kali)

**Update task response saat user pertama kali input data**:

```php
// Contoh: InvoiceController - generate() method
public function generate(Request $request, $itemPekerjaanId)
{
    // ... validasi dan logic generate invoice ...
    
    // Update task response: user mulai input data
    $order = $itemPekerjaan->moodboard->order;
    $taskResponse = TaskResponse::where('order_id', $order->id)
        ->where('tahap', 'invoice')
        ->first();

    if ($taskResponse && $taskResponse->status === 'menunggu_input' && !$taskResponse->user_id) {
        $taskResponse->update([
            'user_id' => auth()->user()->id,
            // TIDAK ada response_time karena tidak ada response method
            // Langsung update deadline jika perlu (optional)
            'deadline' => now()->addDays(3), // Tetap atau tambah hari sesuai kebutuhan
            'duration' => 3, // Tetap atau update sesuai kebutuhan
        ]);
    }
    
    // ... create invoice ...
}
```

#### 3. Saat Data Selesai Diisi

**Update task response saat data selesai**:

```php
// Contoh: InvoiceController - uploadBuktiBayar() atau method lain yang menandakan selesai
public function uploadBuktiBayar(Request $request, $invoiceId)
{
    // ... logic upload bukti bayar ...
    
    // Update task response: data selesai
    $order = $invoice->itemPekerjaan->moodboard->order;
    $taskResponse = TaskResponse::where('order_id', $order->id)
        ->where('tahap', 'invoice')
        ->first();

    if ($taskResponse) {
        $taskResponse->update([
            'update_data_time' => now(),
            'status' => 'selesai',
        ]);
        
        // Create task response untuk tahap selanjutnya jika ada
        // (misalnya tidak ada tahap selanjutnya untuk invoice)
    }
}
```

#### 4. Update CheckTaskDeadlines Command

**Untuk menu tanpa response, hanya kirim notifikasi "menunggu_input"**:

```php
// Di CheckTaskDeadlines Command - getUsersForTahap()
case 'invoice':
    // Legal Admin (semua legal admin)
    $users = User::whereHas('role', function ($query) {
        $query->where('nama_role', 'Legal Admin');
    })->get()->toArray();
    break;

case 'approval_rab':
    // Drafter dari survey schedule users
    $users = $order->surveyUsers()->whereHas('role', function ($query) {
        $query->where('nama_role', 'Drafter');
    })->get()->toArray();
    break;

case 'produksi': // ProjectManagement
    // Supervisor dan Kepala Marketing dari order team
    $supervisors = User::whereHas('role', function ($query) {
        $query->where('nama_role', 'Supervisor');
    })->get();
    $pms = $order->users()->whereHas('role', function ($query) {
        $query->where('nama_role', 'Kepala Marketing');
    })->get();
    $users = $supervisors->merge($pms)->toArray();
    break;
```

**Update method handle() untuk handle menu tanpa response**:

```php
// Di CheckTaskDeadlines Command - handle()
// Ambil semua task yang statusnya 'menunggu_input' dan deadline H-1
$tasks = TaskResponse::where('status', 'menunggu_input') // TIDAK include 'menunggu_response'
    ->whereDate('deadline', '=', Carbon::tomorrow())
    ->get();

// ... rest of the code sama ...
```

### Implementasi Lengkap: Invoice (Contoh Menu Tanpa Response)

#### Step 1: Create Task Response saat Kontrak Selesai

**File**: `app/Http/Controllers/KontrakController.php`

Tambahkan di method `uploadSignedContract()` setelah kontrak di-upload:

```php
use App\Models\TaskResponse;

// ... setelah kontrak di-update dan notification dikirim

// Create task response untuk invoice (tanpa response method)
TaskResponse::create([
    'order_id' => $kontrak->itemPekerjaan->moodboard->order->id,
    'user_id' => null,
    'tahap' => 'invoice',
    'start_time' => now(),
    'deadline' => now()->addDays(3), // Deadline 3 hari
    'duration' => 3,
    'duration_actual' => 3,
    'extend_time' => 0,
    'status' => 'menunggu_input', // LANGSUNG menunggu_input
]);
```

#### Step 2: Update Task Response saat Generate Invoice

**File**: `app/Http/Controllers/InvoiceController.php`

Tambahkan di method `generate()` setelah invoice dibuat:

```php
use App\Models\TaskResponse;

// ... setelah invoice dibuat

// Update task response: user mulai input data
$order = $itemPekerjaan->moodboard->order;
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'invoice')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_input' && !$taskResponse->user_id) {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        // TIDAK ada response_time
    ]);
}
```

#### Step 3: Update Task Response saat Invoice Paid

**File**: `app/Http/Controllers/InvoiceController.php`

Tambahkan di method `uploadBuktiBayar()` setelah invoice di-update jadi 'paid':

```php
// ... setelah invoice di-update jadi 'paid'

// Update task response: data selesai (invoice sudah dibayar)
$order = $invoice->itemPekerjaan->moodboard->order;
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'invoice')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_input') {
    $taskResponse->update([
        'update_data_time' => now(),
        'status' => 'selesai',
    ]);
    
    // Invoice adalah tahap terakhir, tidak ada tahap selanjutnya
    // Atau jika ada, create task response untuk tahap selanjutnya
}
```

### Implementasi Lengkap: RabInternal (Menu DENGAN Response)

**Catatan**: RabInternal **MEMILIKI response method** (`responseRabInternal`), jadi ikuti struktur menu dengan response.

#### Step 1: Update RabInternalController - store Method

**File**: `app/Http/Controllers/RabInternalController.php`

**Masalah**: Di method `store()` line 297, ada variabel `$moodboard` yang tidak ada. Perlu mendapatkan `order_id` melalui relasi.

**Relasi yang ada**:
- RabInternal → belongsTo → ItemPekerjaan
- ItemPekerjaan → belongsTo → Moodboard  
- Moodboard → belongsTo → Order

**Perbaikan di method `store()`** (setelah line 295, sebelum line 297):

```php
// Setelah semua produk di-process (setelah line 295)
// Get RabInternal dengan relasi untuk mendapatkan Order
$rabInternal = RabInternal::with('itemPekerjaan.moodboard.order')
    ->findOrFail($validated['rab_internal_id']);

// Get Order dari relasi
$order = $rabInternal->itemPekerjaan->moodboard->order;

// Update task response: data sudah diisi
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'rab_internal')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'update_data_time' => now(), // Kapan data diisi
        'status' => 'selesai',
    ]);

    // Create task response untuk tahap selanjutnya (kontrak)
    // Catatan: Kontrak dibuat setelah RAB Internal, RAB Kontrak, RAB Vendor, RAB Jasa sudah submit
    // Jadi task response kontrak akan dibuat saat submit, bukan di sini
    // Tapi bisa juga dibuat di sini jika ingin tracking lebih awal
}
```

**Kode lengkap yang diperbaiki** (ganti line 297-325):

```php
// Get RabInternal dengan relasi untuk mendapatkan Order
$rabInternal = RabInternal::with('itemPekerjaan.moodboard.order')
    ->findOrFail($validated['rab_internal_id']);

// Get Order dari relasi
$order = $rabInternal->itemPekerjaan->moodboard->order;

// Update task response: data sudah diisi
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'rab_internal')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'update_data_time' => now(),
        'status' => 'selesai',
    ]);
    
    // Catatan: Task response untuk kontrak akan dibuat saat submit RAB
    // (di method submit() setelah semua RAB type sudah ada)
    // Jadi tidak perlu create di sini
}
```

#### Step 2: Update RabInternalController - submit Method

**File**: `app/Http/Controllers/RabInternalController.php`

Tambahkan di method `submit()` setelah notification dikirim (setelah line 693):

```php
use App\Models\TaskResponse;

// ... setelah notification dikirim

// Create task response untuk kontrak (setelah semua RAB submit)
$order = $itemPekerjaan->moodboard->order;
$nextTaskExists = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'kontrak')
    ->exists();

if (!$nextTaskExists) {
    TaskResponse::create([
        'order_id' => $order->id,
        'user_id' => null,
        'tahap' => 'kontrak',
        'start_time' => now(),
        'deadline' => now()->addDays(3), // Deadline untuk kontrak
        'duration' => 3,
        'duration_actual' => 3,
        'extend_time' => 0,
        'status' => 'menunggu_response',
    ]);
}
```

### Implementasi Lengkap: ApprovalRab (Contoh Menu Tanpa Response)

#### Step 1: Create Task Response saat Gambar Kerja Approved

**File**: `app/Http/Controllers/GambarKerjaController.php`

Tambahkan di method `approve()` setelah gambar kerja di-approve:

```php
use App\Models\TaskResponse;

// ... setelah gambar kerja di-approve dan notification dikirim

// Create task response untuk approval_rab (tanpa response method)
TaskResponse::create([
    'order_id' => $gambarKerja->order->id,
    'user_id' => null,
    'tahap' => 'approval_rab',
    'start_time' => now(),
    'deadline' => now()->addDays(5), // Deadline 5 hari
    'duration' => 5,
    'duration_actual' => 5,
    'extend_time' => 0,
    'status' => 'menunggu_input', // LANGSUNG menunggu_input
]);
```

#### Step 2: Update Task Response saat Edit/Update Keterangan Material

**File**: `app/Http/Controllers/ApprovalRabController.php`

Tambahkan di method `edit()` atau `update()`:

```php
use App\Models\TaskResponse;

// Di method update(), setelah keterangan material di-update
$order = $itemPekerjaan->moodboard->order;
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'approval_rab')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_input' && !$taskResponse->user_id) {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
    ]);
}
```

#### Step 3: Update Task Response saat Data Selesai

**File**: `app/Http/Controllers/ApprovalRabController.php`

Tambahkan di method `update()` setelah notification dikirim:

```php
// ... setelah notification dikirim

// Update task response: data selesai
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'approval_rab')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'update_data_time' => now(),
        'status' => 'selesai',
    ]);
    
    // Create task response untuk tahap selanjutnya (workplan)
    $nextTaskExists = TaskResponse::where('order_id', $order->id)
        ->where('tahap', 'workplan')
        ->exists();

    if (!$nextTaskExists) {
        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null,
            'tahap' => 'workplan',
            'start_time' => now(),
            'deadline' => now()->addDays(7), // Deadline untuk workplan
            'duration' => 7,
            'duration_actual' => 7,
            'extend_time' => 0,
            'status' => 'menunggu_input', // Workplan juga tanpa response
        ]);
    }
}
```

### Implementasi Lengkap: Workplan (Menu DENGAN Response)

**Catatan**: Workplan **MEMILIKI response method**, jadi ikuti struktur menu dengan response.

#### Step 1: Create Task Response saat ApprovalRab Selesai

**File**: `app/Http/Controllers/ApprovalRabController.php`

Tambahkan di method `update()` setelah notification dikirim:

```php
use App\Models\TaskResponse;

// ... setelah notification dikirim

// Create task response untuk workplan (DENGAN response method)
TaskResponse::create([
    'order_id' => $order->id,
    'user_id' => null, // Akan diisi saat user klik Response
    'tahap' => 'workplan',
    'start_time' => now(),
    'deadline' => now()->addDays(7), // Deadline 7 hari
    'duration' => 7, // Durasi awal 7 hari
    'duration_actual' => 7, // Durasi actual 7 hari
    'extend_time' => 0,
    'status' => 'menunggu_response', // MENUNGGU RESPONSE
]);
```

#### Step 2: Update Task Response saat Response Workplan

**File**: `app/Http/Controllers/WorkplanItemController.php`

Tambahkan di method `response()` setelah workplan items dibuat:

```php
use App\Models\TaskResponse;

// ... setelah workplan items dibuat (line 197)

// Update task response: user sudah klik Response
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'workplan')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_response') {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        'response_time' => now(),
        'deadline' => now()->addDays(10), // Tambah 3 hari lagi (total 10 hari)
        'duration' => 10, // Total duration jadi 10 hari
        'duration_actual' => $taskResponse->duration_actual, // Tetap 7 hari
        'status' => 'menunggu_input', // Status berubah jadi menunggu input
    ]);
}
```

#### Step 3: Update Task Response saat Workplan Selesai (Store/Update)

**File**: `app/Http/Controllers/WorkplanItemController.php`

Tambahkan di method `store()` dan `update()` setelah notification dikirim:

```php
// ... setelah notification dikirim (line 379 atau 484)

// Update task response: data sudah diisi
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'workplan')
    ->first();

if ($taskResponse) {
    $taskResponse->update([
        'update_data_time' => now(),
        'status' => 'selesai',
    ]);
    
    // Create task response untuk tahap selanjutnya (produksi)
    $nextTaskExists = TaskResponse::where('order_id', $order->id)
        ->where('tahap', 'produksi')
        ->exists();

    if (!$nextTaskExists) {
        TaskResponse::create([
            'order_id' => $order->id,
            'user_id' => null,
            'tahap' => 'produksi',
            'start_time' => now(),
            'deadline' => now()->addDays(30), // Deadline sesuai durasi kontrak
            'duration' => 30,
            'duration_actual' => 30,
            'extend_time' => 0,
            'status' => 'menunggu_input', // Produksi TANPA response method
        ]);
    }
}
```

#### Step 4: Update CheckTaskDeadlines Command

**File**: `app/Console/Commands/CheckTaskDeadlines.php`

Tambahkan case untuk workplan:

```php
case 'workplan':
    // Kepala Marketing dari order team dan Supervisor
    $pms = $order->users()->whereHas('role', function ($query) {
        $query->where('nama_role', 'Kepala Marketing');
    })->get();
    $supervisors = User::whereHas('role', function ($query) {
        $query->where('nama_role', 'Supervisor');
    })->get();
    $users = $pms->merge($supervisors)->toArray();
    break;
```

### Implementasi Lengkap: ProjectManagement/Produksi (Contoh Menu Tanpa Response)

#### Step 1: Create Task Response saat Workplan Selesai

**File**: `app/Http/Controllers/WorkplanItemController.php`

Tambahkan di method `store()` atau `update()` setelah task response workplan diupdate jadi 'selesai':

```php
// Setelah update task response workplan jadi 'selesai'
// Create task response untuk tahap selanjutnya (produksi)
TaskResponse::create([
    'order_id' => $order->id,
    'user_id' => null,
    'tahap' => 'produksi',
    'start_time' => now(),
    'deadline' => now()->addDays(30), // Deadline sesuai durasi kontrak
    'duration' => 30,
    'duration_actual' => 30,
    'extend_time' => 0,
    'status' => 'menunggu_input', // LANGSUNG menunggu_input (TANPA response)
]);
```

#### Step 2: Update Task Response saat Update Stage Pertama Kali

**File**: `app/Http/Controllers/ProjectManagementController.php`

Tambahkan di method `updateStage()`:

```php
use App\Models\TaskResponse;

// ... setelah stage di-update

// Update task response: user mulai input data (update stage pertama kali)
$order = $produk->itemPekerjaan->moodboard->order;
$taskResponse = TaskResponse::where('order_id', $order->id)
    ->where('tahap', 'produksi')
    ->first();

if ($taskResponse && $taskResponse->status === 'menunggu_input' && !$taskResponse->user_id) {
    $taskResponse->update([
        'user_id' => auth()->user()->id,
        // TIDAK ada response_time karena tidak ada response method
    ]);
}
```

#### Step 3: Update Task Response saat Semua Produk Selesai (Install QC)

**File**: `app/Http/Controllers/ProjectManagementController.php`

Tambahkan di method `updateStage()` saat semua produk sudah Install QC:

```php
// ... setelah stage di-update

// Cek apakah semua produk sudah selesai (Install QC)
$itemPekerjaan = $produk->itemPekerjaan;
$allCompleted = $itemPekerjaan->produks->every(fn($p) => $p->current_stage === 'Install QC');

if ($allCompleted) {
    $order = $itemPekerjaan->moodboard->order;
    $taskResponse = TaskResponse::where('order_id', $order->id)
        ->where('tahap', 'produksi')
        ->first();

    if ($taskResponse && $taskResponse->status === 'menunggu_input') {
        $taskResponse->update([
            'update_data_time' => now(),
            'status' => 'selesai',
        ]);
        
        // Produksi adalah tahap terakhir, tidak ada tahap selanjutnya
    }
}
```

### Ringkasan Perbedaan Menu dengan dan tanpa Response

| Aspek | Menu dengan Response | Menu tanpa Response |
|-------|---------------------|---------------------|
| **Status Awal** | `menunggu_response` | `menunggu_input` |
| **Response Time** | Ada (saat klik Response) | Tidak ada |
| **User ID** | Diisi saat Response | Diisi saat mulai input data |
| **Fase** | 2 fase: Response → Input | 1 fase: Langsung Input |
| **Notifikasi H-1** | Untuk "menunggu_response" dan "menunggu_input" | Hanya untuk "menunggu_input" |
| **Contoh Menu** | Survey, Moodboard, Estimasi, dll | Invoice, ApprovalRab, Produksi |

### Checklist Implementasi Menu Tanpa Response

- [ ] Create task response dengan status `menunggu_input` (bukan `menunggu_response`)
- [ ] Update `user_id` saat user pertama kali input data
- [ ] Update `update_data_time` dan `status` jadi `selesai` saat data selesai
- [ ] Update CheckTaskDeadlines Command untuk handle status `menunggu_input`
- [ ] Tambahkan case di `getUsersForTahap()` untuk tahap tersebut
- [ ] Test notifikasi H-1 deadline
- [ ] Test extension (jika diperlukan)

---

## 🎨 Frontend Integration (Template)

### Tambahkan di Index Page setiap menu

**Contoh untuk SurveyResults/Index.tsx:**

```tsx
// Di dalam component, tambahkan state
const [taskResponse, setTaskResponse] = useState(null);
const [showExtendModal, setShowExtendModal] = useState(false);

// Fetch task response
useEffect(() => {
    axios.get(`/task-response/${orderId}/survey`)
        .then(res => setTaskResponse(res.data))
        .catch(err => console.error(err));
}, []);

// Tampilkan info deadline dan tombol extend
{taskResponse && (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-600">
                    Deadline: {new Date(taskResponse.deadline).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                    Status: {taskResponse.status}
                </p>
                {taskResponse.extend_time > 0 && (
                    <p className="text-sm text-orange-600">
                        Perpanjangan: {taskResponse.extend_time}x
                    </p>
                )}
            </div>
            {taskResponse.status !== 'selesai' && (
                <button
                    onClick={() => setShowExtendModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                    Minta Perpanjangan
                </button>
            )}
        </div>
    </div>
)}

// Modal untuk request extension
{showExtendModal && (
    <ExtendModal
        orderId={orderId}
        tahap="survey"
        onClose={() => setShowExtendModal(false)}
    />
)}
```

### Komponen ExtendModal Lengkap

**File**: `resources/js/components/ExtendModal.tsx` (BARU)

```tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

interface ExtendModalProps {
    orderId: number;
    tahap: string;
    onClose: () => void;
}

export default function ExtendModal({ orderId, tahap, onClose }: ExtendModalProps) {
    const [days, setDays] = useState<number>(1);
    const [reason, setReason] = useState<string>('');
    const [errors, setErrors] = useState<{ days?: string; reason?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tahapNames: Record<string, string> = {
        survey: 'Survey',
        moodboard: 'Moodboard',
        cm_fee: 'Commitment Fee',
        desain_final: 'Desain Final',
        rab: 'RAB',
        kontrak: 'Kontrak',
        survey_ulang: 'Survey Ulang',
        gambar_kerja: 'Gambar Kerja',
        produksi: 'Produksi',
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const newErrors: { days?: string; reason?: string } = {};
        
        if (!days || days < 1 || days > 30) {
            newErrors.days = 'Hari harus antara 1-30 hari';
        }
        
        if (!reason.trim()) {
            newErrors.reason = 'Alasan perpanjangan wajib diisi';
        } else if (reason.trim().length < 10) {
            newErrors.reason = 'Alasan minimal 10 karakter';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        // Submit form
        router.post(
            `/task-response/${orderId}/${tahap}/extend`,
            {
                days,
                reason: reason.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    // Reload page untuk update data
                    router.reload({ only: ['taskResponse'] });
                },
                onError: (errors) => {
                    setErrors(errors as any);
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Minta Perpanjangan - {tahapNames[tahap] || tahap}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-4">
                            {/* Days Input */}
                            <div>
                                <label
                                    htmlFor="days"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Tambah Hari <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="days"
                                    min="1"
                                    max="30"
                                    value={days}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setDays(Math.max(1, Math.min(30, value)));
                                        if (errors.days) {
                                            setErrors({ ...errors, days: undefined });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                        errors.days ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan jumlah hari (1-30)"
                                    disabled={isSubmitting}
                                />
                                {errors.days && (
                                    <p className="mt-1 text-sm text-red-600">{errors.days}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Maksimal 30 hari per perpanjangan
                                </p>
                            </div>

                            {/* Reason Input */}
                            <div>
                                <label
                                    htmlFor="reason"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Alasan Perpanjangan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        if (errors.reason) {
                                            setErrors({ ...errors, reason: undefined });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                        errors.reason ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Jelaskan alasan mengapa perlu perpanjangan deadline..."
                                    disabled={isSubmitting}
                                />
                                {errors.reason && (
                                    <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimal 10 karakter. {reason.length}/500
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !reason.trim() || days < 1}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <svg
                                        className="animate-spin h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                )}
                                {isSubmitting ? 'Mengirim...' : 'Ajukan Perpanjangan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
```

### Update Index Page untuk Import ExtendModal

**Update di SurveyResults/Index.tsx atau menu lainnya:**

```tsx
import ExtendModal from '@/components/ExtendModal';

// ... di dalam component

// State untuk task response
const [taskResponse, setTaskResponse] = useState<any>(null);
const [showExtendModal, setShowExtendModal] = useState(false);

// Fetch task response saat component mount atau orderId berubah
useEffect(() => {
    if (orderId) {
        axios.get(`/task-response/${orderId}/survey`)
            .then(res => setTaskResponse(res.data))
            .catch(err => {
                console.error('Error fetching task response:', err);
                setTaskResponse(null);
            });
    }
}, [orderId]);

// ... di dalam return JSX, tambahkan:

{/* Task Response Info Card */}
{taskResponse && (
    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    Informasi Deadline
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Status:</p>
                        <p className={`font-medium ${
                            taskResponse.status === 'selesai' ? 'text-green-600' :
                            taskResponse.status === 'telat' ? 'text-red-600' :
                            taskResponse.status === 'menunggu_input' ? 'text-blue-600' :
                            'text-yellow-600'
                        }`}>
                            {taskResponse.status === 'menunggu_response' ? 'Menunggu Response' :
                             taskResponse.status === 'menunggu_input' ? 'Menunggu Input' :
                             taskResponse.status === 'selesai' ? 'Selesai' :
                             taskResponse.status === 'telat' ? 'Telat' : taskResponse.status}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Deadline:</p>
                        <p className="font-medium text-gray-800">
                            {new Date(taskResponse.deadline).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                        {new Date(taskResponse.deadline) < new Date() && taskResponse.status !== 'selesai' && (
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ Deadline telah lewat
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-600">Response Time:</p>
                        <p className="font-medium text-gray-800">
                            {taskResponse.response_time 
                                ? new Date(taskResponse.response_time).toLocaleDateString('id-ID')
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Update Data Time:</p>
                        <p className="font-medium text-gray-800">
                            {taskResponse.update_data_time 
                                ? new Date(taskResponse.update_data_time).toLocaleDateString('id-ID')
                                : '-'}
                        </p>
                    </div>
                </div>
                {taskResponse.extend_time > 0 && (
                    <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded">
                        <p className="text-xs text-orange-800">
                            <span className="font-semibold">Perpanjangan:</span> {taskResponse.extend_time}x
                        </p>
                        {taskResponse.extend_reason && (
                            <details className="mt-1">
                                <summary className="text-xs text-orange-700 cursor-pointer hover:text-orange-900">
                                    Lihat alasan perpanjangan
                                </summary>
                                <div className="mt-1 p-2 bg-white rounded text-xs text-gray-700 whitespace-pre-line">
                                    {taskResponse.extend_reason}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>
            {taskResponse.status !== 'selesai' && (
                <div className="ml-4">
                    <button
                        onClick={() => setShowExtendModal(true)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors flex items-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Minta Perpanjangan
                    </button>
                </div>
            )}
        </div>
    </div>
)}

{/* Extend Modal */}
{showExtendModal && (
    <ExtendModal
        orderId={orderId}
        tahap="survey"
        onClose={() => setShowExtendModal(false)}
    />
)}
```

### Alternatif: Menggunakan Inertia Form (Jika lebih suka)

Jika ingin menggunakan Inertia Form helper, bisa juga seperti ini:

```tsx
import { useForm } from '@inertiajs/react';

// Di dalam component
const { data, setData, post, processing, errors, reset } = useForm({
    days: 1,
    reason: '',
});

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/task-response/${orderId}/${tahap}/extend`, {
        preserveScroll: true,
        onSuccess: () => {
            onClose();
            reset();
            router.reload({ only: ['taskResponse'] });
        },
    });
};
```

Tapi versi dengan router.post yang sudah saya buatkan di atas sudah cukup baik dan fleksibel.

---

## 📋 Checklist Implementasi

### ✅ Survey (Lengkap)
- [x] Migration table task_responses
- [x] Model TaskResponse
- [x] OrderController: Create task response saat order dibuat
- [x] SurveyResultsController: Update saat Response diklik
- [x] SurveyResultsController: Update saat data di-publish (bukan draft)
- [x] SurveyResultsController: Create task response untuk moodboard
- [x] Command CheckTaskDeadlines
- [x] NotificationService: Method deadline reminder
- [x] TaskResponseController: Method request extension
- [x] Route untuk extension
- [x] Frontend integration (template)

### ⏳ Tahap Lainnya (Ikuti Template)
- [ ] Moodboard
- [ ] Commitment Fee
- [ ] Desain Final
- [ ] RAB
- [ ] Kontrak
- [ ] Survey Ulang
- [ ] Gambar Kerja
- [ ] Produksi

---

## 🔧 Testing

1. **Test Create Order**: Pastikan task response survey terbuat otomatis
2. **Test Response**: Klik Response di SurveyResults, pastikan task response terupdate
3. **Test Publish**: Publish survey (bukan draft), pastikan status jadi 'selesai' dan task moodboard terbuat
4. **Test Deadline Reminder**: Jalankan command `php artisan tasks:check-deadlines`, pastikan notifikasi terkirim
5. **Test Extension**: Request perpanjangan, pastikan deadline dan extend_time terupdate
6. **Test Overdue**: Pastikan status otomatis jadi 'telat' saat lewat deadline

---

## 📝 Catatan Penting

1. **Duration vs Duration Actual**:
   - `duration_actual`: Durasi yang dijadwalkan sebelum response (tetap)
   - `duration`: Durasi total setelah response (bisa berubah karena extension)

2. **Status Flow**:
   - `menunggu_response` → User klik Response → `menunggu_input`
   - `menunggu_input` → Data diisi (publish, bukan draft) → `selesai`
   - `menunggu_response` atau `menunggu_input` → Lewat deadline → `telat`

3. **Notifikasi**:
   - H-1 deadline: Kirim notifikasi ke user yang relevan
   - Tidak kirim notifikasi untuk status `selesai`

4. **Extension**:
   - Bisa dilakukan berkali-kali
   - Alasan disimpan di `extend_reason` (append)

5. **Auto Create Next Task**:
   - Saat task selesai, otomatis create task untuk tahap selanjutnya
   - Pastikan tidak duplicate (cek dulu apakah sudah ada)

---

## 🚀 Deployment

1. Run migration: `php artisan migrate`
2. Register command di scheduler (cron job):
   ```bash
   * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
   ```
3. Test command: `php artisan tasks:check-deadlines`
4. Monitor log untuk memastikan command berjalan setiap hari

---

## 📊 HALAMAN LOG - Monitoring Task Response

Halaman Log digunakan untuk memantau progress semua task response. Owner bisa melihat:
- User sudah response apa belum dan kapan
- User sudah update data kapan
- Order sudah sampai tahap mana
- Lagi dikerjain siapa
- Status setiap tahap

### Step 1: Create LogController

**File**: `app/Http/Controllers/LogController.php` (BARU)

```php
<?php

namespace App\Http\Controllers;

use App\Models\TaskResponse;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogController extends Controller
{
    /**
     * Display log page dengan filter
     */
    public function index(Request $request)
    {
        $query = TaskResponse::with(['order', 'user.role']);

        // Filter berdasarkan user_id
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter berdasarkan order_id
        if ($request->has('order_id') && $request->order_id) {
            $query->where('order_id', $request->order_id);
        }

        // Filter berdasarkan tahap
        if ($request->has('tahap') && $request->tahap) {
            $query->where('tahap', $request->tahap);
        }

        // Filter berdasarkan status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Sort by created_at desc
        $taskResponses = $query->orderBy('created_at', 'desc')->paginate(50);

        // Get all users untuk filter dropdown
        $users = User::with('role')->orderBy('name')->get();

        // Get all orders untuk filter dropdown
        $orders = Order::select('id', 'nama_project', 'company_name', 'customer_name')
            ->orderBy('created_at', 'desc')
            ->get();

        // Tahap options
        $tahapOptions = [
            'survey' => 'Survey',
            'moodboard' => 'Moodboard',
            'cm_fee' => 'Commitment Fee',
            'desain_final' => 'Desain Final',
            'rab' => 'RAB',
            'kontrak' => 'Kontrak',
            'survey_ulang' => 'Survey Ulang',
            'gambar_kerja' => 'Gambar Kerja',
            'produksi' => 'Produksi',
        ];

        // Status options
        $statusOptions = [
            'menunggu_response' => 'Menunggu Response',
            'menunggu_input' => 'Menunggu Input',
            'selesai' => 'Selesai',
            'telat' => 'Telat',
        ];

        return Inertia::render('Log/Index', [
            'taskResponses' => $taskResponses,
            'users' => $users,
            'orders' => $orders,
            'tahapOptions' => $tahapOptions,
            'statusOptions' => $statusOptions,
            'filters' => [
                'user_id' => $request->user_id,
                'order_id' => $request->order_id,
                'tahap' => $request->tahap,
                'status' => $request->status,
            ],
        ]);
    }

    /**
     * Get task responses by user (untuk API atau detail view)
     */
    public function byUser($userId)
    {
        $user = User::with('role')->findOrFail($userId);
        
        $taskResponses = TaskResponse::with(['order', 'user.role'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'order_id' => $task->order_id,
                    'order_name' => $task->order->nama_project,
                    'customer_name' => $task->order->customer_name,
                    'tahap' => $task->tahap,
                    'status' => $task->status,
                    'start_time' => $task->start_time,
                    'response_time' => $task->response_time,
                    'update_data_time' => $task->update_data_time,
                    'deadline' => $task->deadline,
                    'duration' => $task->duration,
                    'duration_actual' => $task->duration_actual,
                    'extend_time' => $task->extend_time,
                    'is_overdue' => $task->isOverdue(),
                ];
            });

        return Inertia::render('Log/ByUser', [
            'user' => $user,
            'taskResponses' => $taskResponses,
        ]);
    }

    /**
     * Get task responses by order (untuk API atau detail view)
     */
    public function byOrder($orderId)
    {
        $order = Order::with(['users.role', 'jenisInterior'])->findOrFail($orderId);
        
        $taskResponses = TaskResponse::with(['user.role'])
            ->where('order_id', $orderId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'user_id' => $task->user_id,
                    'user_name' => $task->user ? $task->user->name : '-',
                    'user_role' => $task->user && $task->user->role ? $task->user->role->nama_role : '-',
                    'tahap' => $task->tahap,
                    'status' => $task->status,
                    'start_time' => $task->start_time,
                    'response_time' => $task->response_time,
                    'update_data_time' => $task->update_data_time,
                    'deadline' => $task->deadline,
                    'duration' => $task->duration,
                    'duration_actual' => $task->duration_actual,
                    'extend_time' => $task->extend_time,
                    'extend_reason' => $task->extend_reason,
                    'is_overdue' => $task->isOverdue(),
                ];
            });

        return Inertia::render('Log/ByOrder', [
            'order' => $order,
            'taskResponses' => $taskResponses,
        ]);
    }
}
```

### Step 2: Add Routes

**File**: `routes/web.php`

```php
// Log routes (hanya untuk Owner atau role tertentu)
Route::middleware(['auth'])->group(function () {
    Route::get('/log', [LogController::class, 'index'])->name('log.index');
    Route::get('/log/user/{userId}', [LogController::class, 'byUser'])->name('log.by-user');
    Route::get('/log/order/{orderId}', [LogController::class, 'byOrder'])->name('log.by-order');
});
```

### Step 3: Create Inertia Page - Log/Index.tsx

**File**: `resources/js/pages/Log/Index.tsx` (BARU)

```tsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface TaskResponse {
    id: number;
    order_id: number;
    user_id: number | null;
    tahap: string;
    status: string;
    start_time: string;
    response_time: string | null;
    update_data_time: string | null;
    deadline: string;
    duration: number;
    duration_actual: number;
    extend_time: number;
    order: {
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    };
    user: {
        id: number;
        name: string;
        role: {
            nama_role: string;
        } | null;
    } | null;
}

interface Props extends PageProps {
    taskResponses: {
        data: TaskResponse[];
        links: any;
        meta: any;
    };
    users: Array<{
        id: number;
        name: string;
        role: {
            nama_role: string;
        } | null;
    }>;
    orders: Array<{
        id: number;
        nama_project: string;
        company_name: string;
        customer_name: string;
    }>;
    tahapOptions: Record<string, string>;
    statusOptions: Record<string, string>;
    filters: {
        user_id?: number;
        order_id?: number;
        tahap?: string;
        status?: string;
    };
}

export default function Index({ 
    taskResponses, 
    users, 
    orders, 
    tahapOptions, 
    statusOptions,
    filters 
}: Props) {
    const [selectedUserId, setSelectedUserId] = useState<number | ''>(filters.user_id || '');
    const [selectedOrderId, setSelectedOrderId] = useState<number | ''>(filters.order_id || '');
    const [selectedTahap, setSelectedTahap] = useState<string>(filters.tahap || '');
    const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || '');

    const handleFilter = () => {
        router.get('/log', {
            user_id: selectedUserId || undefined,
            order_id: selectedOrderId || undefined,
            tahap: selectedTahap || undefined,
            status: selectedStatus || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSelectedUserId('');
        setSelectedOrderId('');
        setSelectedTahap('');
        setSelectedStatus('');
        router.get('/log');
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            menunggu_response: 'bg-yellow-100 text-yellow-800',
            menunggu_input: 'bg-blue-100 text-blue-800',
            selesai: 'bg-green-100 text-green-800',
            telat: 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('id-ID');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Log Task Response
                </h2>
            }
        >
            <Head title="Log Task Response" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <h3 className="text-lg font-semibold mb-4">Filter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User
                                </label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Semua User</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role?.nama_role || 'No Role'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order
                                </label>
                                <select
                                    value={selectedOrderId}
                                    onChange={(e) => setSelectedOrderId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Order</option>
                                    {orders.map((order) => (
                                        <option key={order.id} value={order.id}>
                                            {order.nama_project} - {order.customer_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tahap
                                </label>
                                <select
                                    value={selectedTahap}
                                    onChange={(e) => setSelectedTahap(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Tahap</option>
                                    {Object.entries(tahapOptions).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Status</option>
                                    {Object.entries(statusOptions).map(([key, value]) => (
                                        <option key={key} value={key}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleFilter}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Filter
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tahap
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Response Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Update Data Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Deadline
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Extend
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {taskResponses.data.map((task) => (
                                            <tr key={task.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <Link
                                                            href={route('log.by-order', task.order_id)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                        >
                                                            {task.order.nama_project}
                                                        </Link>
                                                        <div className="text-sm text-gray-500">
                                                            {task.order.customer_name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {task.user ? (
                                                        <Link
                                                            href={route('log.by-user', task.user.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            {task.user.name}
                                                            <div className="text-sm text-gray-500">
                                                                {task.user.role?.nama_role || 'No Role'}
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium">
                                                        {tahapOptions[task.tahap] || task.tahap}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                                                        {statusOptions[task.status] || task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(task.response_time)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(task.update_data_time)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(task.deadline)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {task.extend_time > 0 ? (
                                                        <span className="text-orange-600 font-medium">
                                                            {task.extend_time}x
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {taskResponses.links && (
                                <div className="mt-4 flex justify-center">
                                    <nav className="flex space-x-2">
                                        {taskResponses.links.map((link: any, index: number) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-2 rounded-md ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Step 4: Update Checklist

Tambahkan di bagian Checklist:

```markdown
### ✅ Halaman Log
- [x] Migration: Tambah kolom update_data_time
- [x] Model: Update fillable dan casts
- [x] LogController: Method index, byUser, byOrder
- [x] Routes untuk log
- [x] Inertia page Log/Index.tsx
- [x] Update semua controller: Set update_data_time saat data diisi
```

---

## 🔐 MENAMBAHKAN MENU LOG KE SIDEBAR & MIDDLEWARE PERMISSION

### Step 1: Create Permission untuk Log

**File**: `database/seeders/PermissionSeeder.php`

Tambahkan permission untuk Log di bagian Operations (setelah permission terakhir):

```php
// Tambahkan di array $permissions, setelah permission terakhir Operations

// Log Permissions
[
    'name' => 'log.index',
    'display_name' => 'View Log Task Response',
    'group' => 'Operations - Log'
],
[
    'name' => 'log.by-user',
    'display_name' => 'View Log by User',
    'group' => 'Operations - Log'
],
[
    'name' => 'log.by-order',
    'display_name' => 'View Log by Order',
    'group' => 'Operations - Log'
],
```

**Jalankan seeder untuk menambahkan permission:**

```bash
php artisan db:seed --class=PermissionSeeder
```

### Step 2: Assign Permission ke Role Owner

**File**: `database/seeders/RolePermissionSeeder.php`

Tambahkan permission log ke role Owner:

```php
// Owner - View-only semua module + Log
$owner = Role::where('nama_role', 'Owner')->first();
if ($owner) {
    $ownerPermissions = Permission::where(function($query) {
        $query->where('name', 'LIKE', '%.index')
              ->orWhere('name', 'LIKE', '%.show')
              ->orWhere('name', 'LIKE', 'log.%'); // Tambahkan semua permission log
    })->pluck('name')->toArray();
    $owner->syncPermissions($ownerPermissions);
}
```

**Catatan**: Admin otomatis mendapat semua permission (termasuk log) karena di seeder sudah ada:
```php
$allPermissions = Permission::pluck('name')->toArray();
$admin->syncPermissions($allPermissions);
```

**Jalankan seeder untuk assign permission:**

```bash
php artisan db:seed --class=RolePermissionSeeder
```

### Step 3: Update Routes dengan Middleware Permission

**File**: `routes/web.php`

Update routes Log yang sudah dibuat sebelumnya:

```php
// Log routes (hanya untuk Owner dan Admin)
Route::middleware(['auth', 'permission:log.index'])->group(function () {
    Route::get('/log', [LogController::class, 'index'])->name('log.index');
    Route::get('/log/user/{userId}', [LogController::class, 'byUser'])
        ->middleware('permission:log.by-user')
        ->name('log.by-user');
    Route::get('/log/order/{orderId}', [LogController::class, 'byOrder'])
        ->middleware('permission:log.by-order')
        ->name('log.by-order');
});
```

### Step 4: Tambahkan Menu Log ke Sidebar

**File**: `resources/js/components/Sidebar.tsx`

Tambahkan menu Log ke array `operationsMenus` (setelah menu terakhir atau di posisi yang sesuai):

```tsx
// Tambahkan di array operationsMenus, setelah menu terakhir (misalnya setelah Defect Management)

{
    name: 'Log',
    href: '/log',
    page: 'log',
    permission: 'log.index', // Permission untuk akses menu
    icon: (
        <svg
            className="h-3.5 w-3.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
        </svg>
    ),
    gradient: 'from-slate-400 to-slate-600',
},
```

**Contoh lengkap di operationsMenus (tambahkan sebelum closing bracket):**

```tsx
const operationsMenus = [
    // ... menu-menu sebelumnya ...
    {
        name: 'Defect Management',
        href: '/defect',
        page: 'defect',
        permission: 'defect.index',
        // ... icon dan gradient ...
    },
    // TAMBAHKAN INI
    {
        name: 'Log',
        href: '/log',
        page: 'log',
        permission: 'log.index',
        icon: (
            <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        ),
        gradient: 'from-slate-400 to-slate-600',
    },
];
```

### Step 5: Update HandleInertiaRequests untuk Pass Permissions

**File**: `app/Http/Middleware/HandleInertiaRequests.php`

Pastikan permissions sudah di-pass ke Inertia (biasanya sudah ada, tapi cek dulu):

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role ? [
                    'id' => $request->user()->role->id,
                    'nama_role' => $request->user()->role->nama_role,
                ] : null,
                'permissions' => $request->user()->getPermissionNames(), // Pastikan ini ada
            ] : null,
        ],
    ];
}
```

### Step 6: Update LogController untuk Check Permission (Optional)

**File**: `app/Http/Controllers/LogController.php`

Tambahkan check permission di constructor atau method (optional, karena sudah ada middleware):

```php
public function __construct()
{
    // Middleware sudah handle di routes, tapi bisa tambahkan di sini juga untuk extra security
    $this->middleware('permission:log.index')->only(['index']);
    $this->middleware('permission:log.by-user')->only(['byUser']);
    $this->middleware('permission:log.by-order')->only(['byOrder']);
}
```

### Step 7: Testing

1. **Test Permission**:
   - Login sebagai Owner → Menu Log harus muncul
   - Login sebagai Admin → Menu Log harus muncul
   - Login sebagai role lain (Surveyor, Drafter, dll) → Menu Log TIDAK muncul

2. **Test Access**:
   - Owner bisa akses `/log` → ✅
   - Owner bisa akses `/log/user/{userId}` → ✅
   - Owner bisa akses `/log/order/{orderId}` → ✅
   - Role lain akses `/log` → ❌ 403 Forbidden

3. **Test Sidebar**:
   - Menu Log hanya muncul untuk user yang punya permission `log.index`
   - Menu Log tidak muncul untuk user tanpa permission

### Checklist Implementasi

- [ ] Tambahkan permission di PermissionSeeder
- [ ] Jalankan PermissionSeeder
- [ ] Assign permission ke role Owner di RolePermissionSeeder
- [ ] Jalankan RolePermissionSeeder
- [ ] Update routes dengan middleware permission
- [ ] Tambahkan menu Log ke Sidebar.tsx
- [ ] Pastikan HandleInertiaRequests pass permissions
- [ ] Test permission dan access
- [ ] Test sidebar visibility

### Catatan Penting

1. **Role Access**:
   - **Owner**: Bisa melihat semua log (monitoring)
   - **Admin**: Bisa melihat semua log (full access)
   - **Role lain**: Tidak bisa akses log (kecuali diberikan permission)

2. **Permission Structure**:
   - `log.index` → Akses halaman utama log
   - `log.by-user` → Akses detail log by user
   - `log.by-order` → Akses detail log by order

3. **Sidebar Visibility**:
   - Menu hanya muncul jika user punya permission `log.index`
   - Menggunakan `hasPermission()` helper di Sidebar component

4. **Security**:
   - Middleware di routes sebagai first line of defense
   - Permission check di controller sebagai second line (optional)
   - Frontend check hanya untuk UX (hide/show menu), bukan security

---

**Selamat mengimplementasikan! 🎉**

