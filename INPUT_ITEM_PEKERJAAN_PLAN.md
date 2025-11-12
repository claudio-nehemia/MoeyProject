# 📋 Input Item Pekerjaan - Implementation Plan

## 🎯 Overview
Tahapan setelah Desain Final diupload, user bisa input produk dan item pekerjaan untuk order tersebut.

---

## 📊 Database Structure & Migrations

### 1. **Migration: `create_item_pekerjaans_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_pekerjaans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moodboard_id')->constrained('moodboards')->onDelete('cascade');
            $table->string('response_by')->nullable();
            $table->timestamp('response_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaans');
    }
};
```

**Purpose:** Main record untuk menandai bahwa order ini sudah masuk tahap input item pekerjaan.

**Flow:**
- Dibuat otomatis saat user klik "Response Input Item Pekerjaan"
- Menggunakan `auth()->user()->name` dan `now()` (sama seperti Estimasi & Commitment Fee)
- One-to-One dengan Moodboard

---

### 2. **Migration: `create_item_pekerjaan_produks_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_pekerjaan_produks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_id')->constrained('item_pekerjaans')->onDelete('cascade');
            $table->foreignId('produk_id')->constrained('produks')->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaan_produks');
    }
};
```

**Purpose:** List produk yang akan dibuat untuk order ini.

**Fields:**
- `item_pekerjaan_id`: Link ke main record
- `produk_id`: Reference ke master data Produk
- `quantity`: Jumlah produk yang akan dibuat

**Example Data:**
```
item_pekerjaan_id: 1
produk_id: 5 (Lemari Pakaian)
quantity: 2

item_pekerjaan_id: 1
produk_id: 8 (Meja Kerja)
quantity: 1
```

---

### 3. **Migration: `create_item_pekerjaan_jenis_items_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_pekerjaan_jenis_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
            $table->foreignId('jenis_item_id')->constrained('jenis_items')->onDelete('cascade');
            $table->timestamps();
            
            // UNIQUE constraint: 1 jenis item hanya bisa dipilih 1x per produk
            $table->unique(['item_pekerjaan_produk_id', 'jenis_item_id'], 'unique_produk_jenis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaan_jenis_items');
    }
};
```

**Purpose:** Jenis item yang digunakan untuk setiap produk.

**Important Notes:**
- **Per produk, 1 jenis item hanya bisa dipilih SEKALI atau tidak sama sekali**
- UNIQUE constraint mencegah duplikasi jenis_item untuk produk yang sama
- Tidak ada quantity di level ini

**Example Data:**
```
item_pekerjaan_produk_id: 1 (Lemari Pakaian #1)
jenis_item_id: 3 (Kayu)

item_pekerjaan_produk_id: 1 (Lemari Pakaian #1)
jenis_item_id: 7 (Aksesoris)
```

---

### 4. **Migration: `create_item_pekerjaan_items_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('item_pekerjaan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_pekerjaan_jenis_item_id')->constrained('item_pekerjaan_jenis_items')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_pekerjaan_items');
    }
};
```

**Purpose:** Detail item yang dibutuhkan untuk setiap jenis item.

**Fields:**
- `item_pekerjaan_jenis_item_id`: Link ke jenis item yang dipilih
- `item_id`: Reference ke master data Item
- `quantity`: Jumlah item yang dibutuhkan

**Example Data:**
```
item_pekerjaan_jenis_item_id: 1 (Kayu untuk Lemari)
item_id: 15 (Kayu Jati)
quantity: 5

item_pekerjaan_jenis_item_id: 1 (Kayu untuk Lemari)
item_id: 18 (Kayu Mahoni)
quantity: 3
```

---

### **Migration Command:**
```bash
php artisan make:migration create_item_pekerjaans_table
php artisan make:migration create_item_pekerjaan_produks_table
php artisan make:migration create_item_pekerjaan_jenis_items_table
php artisan make:migration create_item_pekerjaan_items_table
```

**Run migrations:**
```bash
php artisan migrate
```

---

## 🔗 Data Structure Hierarchy

```
ItemPekerjaan (Response Record)
└── ItemPekerjaanProduk[] (Multiple Products)
    ├── produk_id
    ├── quantity
    └── ItemPekerjaanJenisItem[] (Multiple Jenis Items - MAX 1 per jenis)
        ├── jenis_item_id
        └── ItemPekerjaanItem[] (Multiple Items)
            ├── item_id
            └── quantity
```

**Real Example:**
```
ItemPekerjaan #1 (Order: Kitchen Set Minimalis)
│
├── Produk: Lemari Pakaian (qty: 2)
│   ├── Jenis Item: Kayu
│   │   ├── Item: Kayu Jati (qty: 5)
│   │   └── Item: Kayu Mahoni (qty: 3)
│   └── Jenis Item: Aksesoris
│       ├── Item: Handle Stainless (qty: 8)
│       └── Item: Engsel Hidrolik (qty: 12)
│
└── Produk: Meja Kerja (qty: 1)
    ├── Jenis Item: Kayu
    │   └── Item: Kayu Jati (qty: 2)
    └── Jenis Item: Kaca
        └── Item: Kaca Tempered 8mm (qty: 1)
```

---

## 📝 Model Relationships

### 1. **ItemPekerjaan.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaan extends Model
{
    protected $fillable = [
        'moodboard_id',
        'response_by',
        'response_time',
    ];

    public function moodboard()
    {
        return $this->belongsTo(Moodboard::class);
    }

    public function produks()
    {
        return $this->hasMany(ItemPekerjaanProduk::class);
    }
}
```

### 2. **ItemPekerjaanProduk.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanProduk extends Model
{
    protected $fillable = [
        'item_pekerjaan_id',
        'produk_id',
        'quantity',
    ];

    public function itemPekerjaan()
    {
        return $this->belongsTo(ItemPekerjaan::class);
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    public function jenisItems()
    {
        return $this->hasMany(ItemPekerjaanJenisItem::class);
    }
}
```

### 3. **ItemPekerjaanJenisItem.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanJenisItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'jenis_item_id',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function jenisItem()
    {
        return $this->belongsTo(JenisItem::class);
    }

    public function items()
    {
        return $this->hasMany(ItemPekerjaanItem::class);
    }
}
```

### 4. **ItemPekerjaanItem.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemPekerjaanItem extends Model
{
    protected $fillable = [
        'item_pekerjaan_jenis_item_id',
        'item_id',
        'quantity',
    ];

    public function itemPekerjaanJenisItem()
    {
        return $this->belongsTo(ItemPekerjaanJenisItem::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
```

### 5. **Update Moodboard.php**
```php
// Add this relationship
public function itemPekerjaan()
{
    return $this->hasOne(ItemPekerjaan::class);
}
```

### 6. **Update Produk.php**
```php
// Add this relationship
public function itemPekerjaanProduks()
{
    return $this->hasMany(ItemPekerjaanProduk::class);
}
```

### 7. **Update JenisItem.php**
```php
// Add this relationship
public function itemPekerjaanJenisItems()
{
    return $this->hasMany(ItemPekerjaanJenisItem::class);
}
```

### 8. **Update Item.php**
```php
// Add this relationship
public function itemPekerjaanItems()
{
    return $this->hasMany(ItemPekerjaanItem::class);
}
```

---

## 🎨 UI/UX Flow

### **Page: Input Item Pekerjaan Index**

#### **Tampilan Awal:**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Input Item Pekerjaan                                 │
│ Kelola produk dan item untuk order dengan desain final  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Project: Kitchen Set Minimalis                          │
│ Customer: PT Maju Jaya                                  │
│ Customer Name: Budi Santoso                             │
│                                                          │
│ [Response Input Item Pekerjaan]  ← State 1: Belum response
└─────────────────────────────────────────────────────────┘
```

#### **State 2: Sudah Response, Belum Input Produk**
```
┌─────────────────────────────────────────────────────────┐
│ Project: Kitchen Set Minimalis                          │
│ Customer: PT Maju Jaya                                  │
│                                                          │
│ ℹ️ Response Details                                     │
│ Response By: John Doe                                   │
│ Response Time: 12 Nov 2025, 14:30                       │
│                                                          │
│ 📦 Produk (0)                                           │
│ Belum ada produk ditambahkan                            │
│                                                          │
│ [+ Tambah Produk]                                       │
└─────────────────────────────────────────────────────────┘
```

#### **State 3: Sudah Ada Produk**
```
┌─────────────────────────────────────────────────────────┐
│ Project: Kitchen Set Minimalis                          │
│                                                          │
│ 📦 Produk (2)                                           │
│                                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 🪑 Lemari Pakaian (Qty: 2)                        │  │
│ │                                                    │  │
│ │ 🔧 Jenis Item & Material:                         │  │
│ │                                                    │  │
│ │ ▼ Kayu                                            │  │
│ │   • Kayu Jati (Qty: 5)                    [Edit]  │  │
│ │   • Kayu Mahoni (Qty: 3)                  [Edit]  │  │
│ │   [+ Tambah Item]                                 │  │
│ │                                                    │  │
│ │ ▼ Aksesoris                                       │  │
│ │   • Handle Stainless (Qty: 8)             [Edit]  │  │
│ │   [+ Tambah Item]                                 │  │
│ │                                                    │  │
│ │ [+ Tambah Jenis Item]                   [Hapus]   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 🪑 Meja Kerja (Qty: 1)                            │  │
│ │                                                    │  │
│ │ 🔧 Jenis Item & Material:                         │  │
│ │ Belum ada jenis item ditambahkan                  │  │
│ │                                                    │  │
│ │ [+ Tambah Jenis Item]                   [Hapus]   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ [+ Tambah Produk]                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow

### **Step 1: Response Input Item Pekerjaan**
1. User buka halaman "Input Item Pekerjaan"
2. Muncul daftar moodboard yang sudah upload desain final
3. User klik "Response Input Item Pekerjaan"
4. Sistem create record `ItemPekerjaan` dengan response_by dan response_time otomatis
5. Halaman refresh, muncul section untuk tambah produk

### **Step 2: Tambah Produk**
**Modal: Tambah Produk**
```
┌─────────────────────────────────────┐
│ Tambah Produk                       │
│                                     │
│ Pilih Produk:                       │
│ [Dropdown Master Produk ▼]          │
│                                     │
│ Quantity:                           │
│ [_____] (min: 1)                    │
│                                     │
│ [Batal]  [Simpan]                   │
└─────────────────────────────────────┘
```

**Validation:**
- Produk tidak boleh duplikat dalam 1 order
- Quantity minimal 1

### **Step 3: Tambah Jenis Item ke Produk**
**Modal: Tambah Jenis Item**
```
┌─────────────────────────────────────┐
│ Tambah Jenis Item                   │
│ Produk: Lemari Pakaian              │
│                                     │
│ Pilih Jenis Item:                   │
│ [Dropdown Jenis Item ▼]             │
│                                     │
│ ⚠️ Sudah dipilih: Kayu, Aksesoris  │
│                                     │
│ [Batal]  [Simpan]                   │
└─────────────────────────────────────┘
```

**Validation:**
- Jenis Item tidak boleh duplikat untuk produk yang sama
- Filter dropdown: hide jenis item yang sudah dipilih

### **Step 4: Tambah Item ke Jenis Item**
**Modal: Tambah Item**
```
┌─────────────────────────────────────┐
│ Tambah Item                          │
│ Produk: Lemari Pakaian              │
│ Jenis: Kayu                         │
│                                     │
│ Pilih Item:                         │
│ [Dropdown Item (filtered) ▼]        │
│                                     │
│ Quantity:                           │
│ [_____] (min: 1)                    │
│                                     │
│ [Batal]  [Simpan]                   │
└─────────────────────────────────────┘
```

**Validation:**
- Item harus dari jenis_item_id yang sesuai
- Item bisa duplikat (user bisa tambah item yang sama dengan qty berbeda jika perlu)
- Quantity minimal 1

---

## 🛣️ Routes

```php
// routes/web.php

// ITEM PEKERJAAN ROUTES
Route::get('item-pekerjaan', [ItemPekerjaanController::class, 'index'])->name('item-pekerjaan.index');
Route::post('item-pekerjaan/response/{moodboardId}', [ItemPekerjaanController::class, 'responseItemPekerjaan'])->name('item-pekerjaan.response');

// Produk Management
Route::post('item-pekerjaan/produk/store', [ItemPekerjaanController::class, 'storeProduk'])->name('item-pekerjaan.produk.store');
Route::put('item-pekerjaan/produk/{produkId}/update', [ItemPekerjaanController::class, 'updateProduk'])->name('item-pekerjaan.produk.update');
Route::delete('item-pekerjaan/produk/{produkId}/delete', [ItemPekerjaanController::class, 'deleteProduk'])->name('item-pekerjaan.produk.delete');

// Jenis Item Management
Route::post('item-pekerjaan/jenis-item/store', [ItemPekerjaanController::class, 'storeJenisItem'])->name('item-pekerjaan.jenis-item.store');
Route::delete('item-pekerjaan/jenis-item/{jenisItemId}/delete', [ItemPekerjaanController::class, 'deleteJenisItem'])->name('item-pekerjaan.jenis-item.delete');

// Item Management
Route::post('item-pekerjaan/item/store', [ItemPekerjaanController::class, 'storeItem'])->name('item-pekerjaan.item.store');
Route::put('item-pekerjaan/item/{itemId}/update', [ItemPekerjaanController::class, 'updateItem'])->name('item-pekerjaan.item.update');
Route::delete('item-pekerjaan/item/{itemId}/delete', [ItemPekerjaanController::class, 'deleteItem'])->name('item-pekerjaan.item.delete');
```

---

## 🎯 Controller Structure

### **ItemPekerjaanController.php**

```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Moodboard;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanProduk;
use App\Models\ItemPekerjaanJenisItem;
use App\Models\ItemPekerjaanItem;
use App\Models\Produk;
use App\Models\JenisItem;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ItemPekerjaanController extends Controller
{
    public function index()
    {
        // Get moodboards where moodboard_final exists
        $moodboards = Moodboard::with([
            'order',
            'itemPekerjaan.produks.produk',
            'itemPekerjaan.produks.jenisItems.jenisItem',
            'itemPekerjaan.produks.jenisItems.items.item'
        ])
        ->whereNotNull('moodboard_final')
        ->get()
        ->map(function ($moodboard) {
            return [
                'id' => $moodboard->id,
                'order' => [
                    'id' => $moodboard->order->id,
                    'nama_project' => $moodboard->order->nama_project,
                    'company_name' => $moodboard->order->company_name,
                    'customer_name' => $moodboard->order->customer_name,
                ],
                'itemPekerjaan' => $moodboard->itemPekerjaan ? [
                    'id' => $moodboard->itemPekerjaan->id,
                    'response_by' => $moodboard->itemPekerjaan->response_by,
                    'response_time' => $moodboard->itemPekerjaan->response_time,
                    'produks' => $moodboard->itemPekerjaan->produks->map(function ($produk) {
                        return [
                            'id' => $produk->id,
                            'produk_id' => $produk->produk_id,
                            'produk_name' => $produk->produk->nama_produk,
                            'quantity' => $produk->quantity,
                            'jenisItems' => $produk->jenisItems->map(function ($jenisItem) {
                                return [
                                    'id' => $jenisItem->id,
                                    'jenis_item_id' => $jenisItem->jenis_item_id,
                                    'jenis_item_name' => $jenisItem->jenisItem->nama_jenis_item,
                                    'items' => $jenisItem->items->map(function ($item) {
                                        return [
                                            'id' => $item->id,
                                            'item_id' => $item->item_id,
                                            'item_name' => $item->item->nama_item,
                                            'quantity' => $item->quantity,
                                        ];
                                    }),
                                ];
                            }),
                        ];
                    }),
                ] : null,
            ];
        });

        // Get master data
        $produks = Produk::select('id', 'nama_produk')->get();
        $jenisItems = JenisItem::select('id', 'nama_jenis_item')->get();

        return Inertia::render('ItemPekerjaan/Index', [
            'moodboards' => $moodboards,
            'produks' => $produks,
            'jenisItems' => $jenisItems,
        ]);
    }

    public function responseItemPekerjaan(Request $request, $moodboardId)
    {
        try {
            Log::info('=== ITEM PEKERJAAN RESPONSE START ===');
            Log::info('Moodboard ID: ' . $moodboardId);
            
            $moodboard = Moodboard::findOrFail($moodboardId);

            if($moodboard->itemPekerjaan) {
                Log::warning('Item Pekerjaan already exists for moodboard: ' . $moodboardId);
                return back()->with('error', 'Item Pekerjaan response sudah ada untuk moodboard ini.');
            }

            $itemPekerjaan = ItemPekerjaan::create([
                'moodboard_id' => $moodboardId,
                'response_by' => auth()->user()->name,
                'response_time' => now(),
            ]);
            
            Log::info('Item Pekerjaan created with ID: ' . $itemPekerjaan->id);
            Log::info('=== ITEM PEKERJAAN RESPONSE END ===');

            return back()->with('success', 'Item Pekerjaan response berhasil dibuat.');
        } catch (\Exception $e) {
            Log::error('Response item pekerjaan error: ' . $e->getMessage());
            return back()->with('error', 'Gagal membuat response item pekerjaan: ' . $e->getMessage());
        }
    }

    public function storeProduk(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_pekerjaan_id' => 'required|exists:item_pekerjaans,id',
                'produk_id' => 'required|exists:produks,id',
                'quantity' => 'required|integer|min:1',
            ]);

            // Check if produk already exists for this item_pekerjaan
            $exists = ItemPekerjaanProduk::where('item_pekerjaan_id', $validated['item_pekerjaan_id'])
                ->where('produk_id', $validated['produk_id'])
                ->exists();

            if ($exists) {
                return back()->with('error', 'Produk ini sudah ditambahkan.');
            }

            ItemPekerjaanProduk::create($validated);
            
            return back()->with('success', 'Produk berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Store produk error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan produk: ' . $e->getMessage());
        }
    }

    public function updateProduk(Request $request, $produkId)
    {
        try {
            $validated = $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);

            $produk = ItemPekerjaanProduk::findOrFail($produkId);
            $produk->update($validated);
            
            return back()->with('success', 'Quantity produk berhasil diupdate.');
        } catch (\Exception $e) {
            Log::error('Update produk error: ' . $e->getMessage());
            return back()->with('error', 'Gagal update produk: ' . $e->getMessage());
        }
    }

    public function deleteProduk($produkId)
    {
        try {
            $produk = ItemPekerjaanProduk::findOrFail($produkId);
            $produk->delete(); // Cascade delete jenis items dan items
            
            return back()->with('success', 'Produk berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete produk error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus produk: ' . $e->getMessage());
        }
    }

    public function storeJenisItem(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_pekerjaan_produk_id' => 'required|exists:item_pekerjaan_produks,id',
                'jenis_item_id' => 'required|exists:jenis_items,id',
            ]);

            // Check if jenis_item already exists for this produk (UNIQUE constraint)
            $exists = ItemPekerjaanJenisItem::where('item_pekerjaan_produk_id', $validated['item_pekerjaan_produk_id'])
                ->where('jenis_item_id', $validated['jenis_item_id'])
                ->exists();

            if ($exists) {
                return back()->with('error', 'Jenis item ini sudah ditambahkan untuk produk ini.');
            }

            ItemPekerjaanJenisItem::create($validated);
            
            return back()->with('success', 'Jenis item berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Store jenis item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan jenis item: ' . $e->getMessage());
        }
    }

    public function deleteJenisItem($jenisItemId)
    {
        try {
            $jenisItem = ItemPekerjaanJenisItem::findOrFail($jenisItemId);
            $jenisItem->delete(); // Cascade delete items
            
            return back()->with('success', 'Jenis item berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete jenis item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus jenis item: ' . $e->getMessage());
        }
    }

    public function storeItem(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_pekerjaan_jenis_item_id' => 'required|exists:item_pekerjaan_jenis_items,id',
                'item_id' => 'required|exists:items,id',
                'quantity' => 'required|integer|min:1',
            ]);

            // Validate that item belongs to correct jenis_item
            $jenisItem = ItemPekerjaanJenisItem::findOrFail($validated['item_pekerjaan_jenis_item_id']);
            $item = Item::findOrFail($validated['item_id']);
            
            if ($item->jenis_item_id !== $jenisItem->jenis_item_id) {
                return back()->with('error', 'Item tidak sesuai dengan jenis item yang dipilih.');
            }

            ItemPekerjaanItem::create($validated);
            
            return back()->with('success', 'Item berhasil ditambahkan.');
        } catch (\Exception $e) {
            Log::error('Store item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan item: ' . $e->getMessage());
        }
    }

    public function updateItem(Request $request, $itemId)
    {
        try {
            $validated = $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);

            $item = ItemPekerjaanItem::findOrFail($itemId);
            $item->update($validated);
            
            return back()->with('success', 'Quantity item berhasil diupdate.');
        } catch (\Exception $e) {
            Log::error('Update item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal update item: ' . $e->getMessage());
        }
    }

    public function deleteItem($itemId)
    {
        try {
            $item = ItemPekerjaanItem::findOrFail($itemId);
            $item->delete();
            
            return back()->with('success', 'Item berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Delete item error: ' . $e->getMessage());
            return back()->with('error', 'Gagal hapus item: ' . $e->getMessage());
        }
    }
}
```

---

## 🔧 Frontend Component Structure

### **ItemPekerjaan/Index.tsx**
```typescript
interface Props {
    moodboards: Moodboard[];
    produks: Produk[];
    jenisItems: JenisItem[];
}

// State management
const [showProdukModal, setShowProdukModal] = useState(false);
const [showJenisItemModal, setShowJenisItemModal] = useState(false);
const [showItemModal, setShowItemModal] = useState(false);

// Selected data for modals
const [selectedItemPekerjaan, setSelectedItemPekerjaan] = useState(null);
const [selectedProduk, setSelectedProduk] = useState(null);
const [selectedJenisItem, setSelectedJenisItem] = useState(null);

// Form data
const [produkForm, setProdukForm] = useState({ produk_id: '', quantity: 1 });
const [jenisItemForm, setJenisItemForm] = useState({ jenis_item_id: '' });
const [itemForm, setItemForm] = useState({ item_id: '', quantity: 1 });
```

### **Components Breakdown:**
1. **MoodboardCard** - Display moodboard dengan order info
2. **ProdukList** - List produk yang sudah ditambahkan
3. **ProdukCard** - Card untuk 1 produk dengan nested jenis items
4. **JenisItemSection** - Section untuk jenis item dengan items
5. **ItemRow** - Row untuk individual item dengan quantity
6. **AddProdukModal** - Modal untuk tambah produk
7. **AddJenisItemModal** - Modal untuk tambah jenis item
8. **AddItemModal** - Modal untuk tambah item

---

## 🔗 Integration dengan Moodboard

### **Update MoodboardController.php - index()**
```php
public function index()
{
    $orders = Order::with([
        'moodboard.estimasi',
        'moodboard.commitmentFee',
        'moodboard.itemPekerjaan', // Add this
        'jenisInterior',
        'users.role'
    ])
    ->orderBy('created_at', 'desc')
    ->get()
    ->map(function ($order) {
        return [
            // ... existing fields
            'moodboard' => $order->moodboard ? [
                // ... existing fields
            'has_item_pekerjaan' => $order->moodboard->itemPekerjaan ? true : false,
            ] : null,
        ];
    });
}
```

### **Update Moodboard/Index.tsx**
```typescript
// Add link di moodboard card setelah desain final uploaded
{moodboard.moodboard_final && (
    <Link
        href="/item-pekerjaan"
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
        {moodboard.has_item_pekerjaan 
            ? '✓ Lihat Item Pekerjaan' 
            : '→ Input Item Pekerjaan'}
    </Link>
)}
```

---

## 📌 Important Notes

### **Validation Rules:**
1. ✅ 1 Produk hanya bisa dipilih 1x per order
2. ✅ 1 Jenis Item hanya bisa dipilih 1x per produk (UNIQUE constraint)
3. ✅ Item harus match dengan jenis_item_id yang dipilih
4. ✅ Item bisa duplikat (kalau user mau input 2x dengan qty berbeda)
5. ✅ Quantity minimal 1 untuk produk dan item

### **Cascade Delete:**
- Delete Produk → Cascade delete semua jenis items dan items terkait
- Delete Jenis Item → Cascade delete semua items terkait
- Delete ItemPekerjaan → Cascade delete semua produks, jenis items, dan items terkait

### **UI/UX Guidelines:**
1. Gunakan accordion/collapsible untuk jenis items
2. Gunakan badge untuk quantity
3. Gunakan color coding:
   - Blue: Produk level
   - Green: Jenis Item level
   - Gray: Item level
4. Confirm dialog untuk delete actions
5. Disable produk di dropdown kalau sudah dipilih
6. Filter jenis item di dropdown berdasarkan yang sudah dipilih

### **Performance:**
- Eager load semua relations di index untuk menghindari N+1 query
- Cache master data (produks, jenis_items) kalau perlu
- Pagination kalau data moodboard banyak

---

## 🎯 Next Steps (Future Enhancement)

Setelah Input Item Pekerjaan selesai, next tahap bisa:
1. **RAB (Rencana Anggaran Biaya)** - Hitung harga otomatis dari items
2. **Purchase Order** - Generate PO untuk vendor
3. **Stock Management** - Track item yang sudah dibeli
4. **Production Tracking** - Monitor progress produksi
5. **Quality Control** - Checklist QC sebelum delivery

---

## ✅ Checklist Implementation

### **Backend:**
- [ ] Create 4 migrations
- [ ] Create 4 models dengan relationships
- [ ] Update existing models (Moodboard, Produk, JenisItem, Item)
- [ ] Create ItemPekerjaanController dengan 10 methods
- [ ] Add routes (11 routes)
- [ ] Test all CRUD operations

### **Frontend:**
- [ ] Create ItemPekerjaan/Index.tsx
- [ ] Create modals (Produk, JenisItem, Item)
- [ ] Implement nested data structure display
- [ ] Add validation & error handling
- [ ] Add loading states
- [ ] Test responsive design

### **Integration:**
- [ ] Update MoodboardController
- [ ] Update Moodboard/Index.tsx dengan link
- [ ] Add Sidebar menu item
- [ ] Test complete flow dari Moodboard ke Item Pekerjaan

---

**Good luck bang! 🚀 Struktur data ini scalable dan bisa extend untuk fitur RAB dan production tracking nanti!**
