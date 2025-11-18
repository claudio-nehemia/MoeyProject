# Defect Management Feature - Tahapan Implementasi

## 📋 Overview
Fitur untuk mencatat dan mengelola cacat produk yang ditemukan pada tahap QC (Finishing QC atau Install QC), beserta proses perbaikannya.

---

## 🗂️ 1. Database Migration

### Migration: `create_defects_table.php`
```php
Schema::create('defects', function (Blueprint $table) {
    $table->id();
    $table->foreignId('item_pekerjaan_produk_id')->constrained('item_pekerjaan_produks')->onDelete('cascade');
    $table->enum('qc_stage', ['Finishing QC', 'Install QC']); // Tahap QC mana yang menemukan cacat
    $table->string('reported_by'); // User yang melaporkan
    $table->timestamp('reported_at');
    $table->enum('status', ['pending', 'in_repair', 'completed'])->default('pending');
    $table->timestamps();
});

Schema::create('defect_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('defect_id')->constrained('defects')->onDelete('cascade');
    $table->string('photo_path'); // Path foto cacat
    $table->text('notes'); // Catatan cacat
    $table->integer('order')->default(0); // Urutan foto
    $table->timestamps();
});

Schema::create('defect_repairs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('defect_item_id')->constrained('defect_items')->onDelete('cascade');
    $table->string('photo_path'); // Path foto hasil perbaikan
    $table->text('notes'); // Catatan perbaikan
    $table->string('repaired_by'); // User yang memperbaiki
    $table->timestamp('repaired_at');
    $table->timestamps();
});
```

---

## 🎯 2. Models

### `app/Models/Defect.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Defect extends Model
{
    protected $fillable = [
        'item_pekerjaan_produk_id',
        'qc_stage',
        'reported_by',
        'reported_at',
        'status',
    ];

    protected $casts = [
        'reported_at' => 'datetime',
    ];

    public function itemPekerjaanProduk()
    {
        return $this->belongsTo(ItemPekerjaanProduk::class);
    }

    public function defectItems()
    {
        return $this->hasMany(DefectItem::class);
    }

    // Accessor: Cek apakah semua defect items sudah diperbaiki
    public function getIsAllRepairedAttribute()
    {
        return $this->defectItems->every(function ($item) {
            return $item->repairs->count() > 0;
        });
    }
}
```

### `app/Models/DefectItem.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefectItem extends Model
{
    protected $fillable = [
        'defect_id',
        'photo_path',
        'notes',
        'order',
    ];

    public function defect()
    {
        return $this->belongsTo(Defect::class);
    }

    public function repairs()
    {
        return $this->hasMany(DefectRepair::class);
    }

    // Accessor: URL foto
    public function getPhotoUrlAttribute()
    {
        return asset('storage/' . $this->photo_path);
    }
}
```

### `app/Models/DefectRepair.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefectRepair extends Model
{
    protected $fillable = [
        'defect_item_id',
        'photo_path',
        'notes',
        'repaired_by',
        'repaired_at',
    ];

    protected $casts = [
        'repaired_at' => 'datetime',
    ];

    public function defectItem()
    {
        return $this->belongsTo(DefectItem::class);
    }

    // Accessor: URL foto
    public function getPhotoUrlAttribute()
    {
        return asset('storage/' . $this->photo_path);
    }
}
```

### Update `app/Models/ItemPekerjaanProduk.php`
Tambahkan relasi:
```php
public function defects()
{
    return $this->hasMany(Defect::class);
}

// Accessor: Cek apakah produk punya defect yang belum selesai
public function getHasPendingDefectsAttribute()
{
    return $this->defects()
        ->whereIn('status', ['pending', 'in_repair'])
        ->exists();
}
```

---

## 🎮 3. Controllers

### `app/Http/Controllers/DefectController.php`
```php
<?php

namespace App\Http\Controllers;

use App\Models\Defect;
use App\Models\DefectItem;
use App\Models\ItemPekerjaanProduk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class DefectController extends Controller
{
    // Halaman Index - List semua defect
    public function index()
    {
        $defects = Defect::with([
            'itemPekerjaanProduk.produk',
            'itemPekerjaanProduk.itemPekerjaan.moodboard.order',
            'defectItems.repairs'
        ])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($defect) {
            $produk = $defect->itemPekerjaanProduk;
            $order = $produk->itemPekerjaan->moodboard->order;
            
            return [
                'id' => $defect->id,
                'nama_project' => $order->nama_project,
                'company_name' => $order->company_name,
                'nama_produk' => $produk->produk->nama_produk,
                'qc_stage' => $defect->qc_stage,
                'status' => $defect->status,
                'reported_by' => $defect->reported_by,
                'reported_at' => $defect->reported_at,
                'total_defects' => $defect->defectItems->count(),
                'total_repaired' => $defect->defectItems->filter(fn($item) => $item->repairs->count() > 0)->count(),
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

        return inertia('DefectManagement/Show', [
            'defect' => [
                'id' => $defect->id,
                'nama_project' => $order->nama_project,
                'company_name' => $order->company_name,
                'customer_name' => $order->customer_name,
                'nama_produk' => $produk->produk->nama_produk,
                'qc_stage' => $defect->qc_stage,
                'status' => $defect->status,
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
                            ];
                        }),
                    ];
                }),
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

        $defect = Defect::create([
            'item_pekerjaan_produk_id' => $request->item_pekerjaan_produk_id,
            'qc_stage' => $request->qc_stage,
            'reported_by' => Auth::user()->name,
            'reported_at' => now(),
            'status' => 'pending',
        ]);

        foreach ($request->defect_items as $index => $item) {
            $photoPath = $item['photo']->store('defects', 'public');

            DefectItem::create([
                'defect_id' => $defect->id,
                'photo_path' => $photoPath,
                'notes' => $item['notes'],
                'order' => $index,
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
}
```

### Update `app/Http/Controllers/ProjectManagementController.php`
Tambahkan method untuk cek apakah produk bisa report defect:
```php
public function show($id)
{
    // ... existing code ...
    
    $produks = $itemPekerjaan->produks->map(function ($produk) use ($totalHargaItem) {
        // ... existing code ...
        
        // Cek apakah produk di tahap QC
        $canReportDefect = in_array($produk->current_stage, ['Finishing QC', 'Install QC']);
        
        // Cek apakah sudah ada defect yang pending/in_repair
        $hasActiveDefect = $produk->defects()
            ->whereIn('status', ['pending', 'in_repair'])
            ->exists();
        
        return [
            // ... existing fields ...
            'can_report_defect' => $canReportDefect,
            'has_active_defect' => $hasActiveDefect,
            'defect_id' => $hasActiveDefect ? $produk->defects()
                ->whereIn('status', ['pending', 'in_repair'])
                ->first()->id : null,
        ];
    });
    
    // ... rest of code ...
}
```

---

## 🛣️ 4. Routes

### `routes/web.php`
```php
// Defect Management Routes
Route::middleware(['auth'])->group(function () {
    Route::get('/defect-management', [DefectController::class, 'index'])->name('defect.index');
    Route::get('/defect-management/{id}', [DefectController::class, 'show'])->name('defect.show');
    Route::post('/defects', [DefectController::class, 'store'])->name('defect.store');
    Route::post('/defect-items/{id}/repair', [DefectController::class, 'storeRepair'])->name('defect.repair.store');
    Route::delete('/defect-repairs/{id}', [DefectController::class, 'deleteRepair'])->name('defect.repair.delete');
    Route::patch('/defects/{id}/status', [DefectController::class, 'updateStatus'])->name('defect.status.update');
});
```

---

## 🎨 5. Frontend Components

### A. Update `ProjectManagement/Detail.tsx`
Tambahkan tombol "Report Defect" untuk produk yang sedang di tahap QC:

```tsx
// Tambahkan di dalam card produk, setelah tombol Previous/Next
{produk.can_report_defect && (
    <div className="mt-4 pt-4 border-t border-gray-200">
        {produk.has_active_defect ? (
            <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-orange-600 font-medium">
                    ⚠️ Ada defect yang sedang ditangani
                </span>
                <Link
                    href={`/defect-management/${produk.defect_id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                >
                    Lihat Defect
                </Link>
            </div>
        ) : (
            <button
                onClick={() => setShowDefectModal(produk.id)}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg hover:from-red-600 hover:to-orange-700 font-medium shadow-lg"
            >
                🔍 Report Defect
            </button>
        )}
    </div>
)}
```

### B. Modal untuk Input Defect
```tsx
{showDefectModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Report Defect - {selectedProduk.nama_produk}</h2>
                
                <form onSubmit={handleSubmitDefect}>
                    <input type="hidden" name="item_pekerjaan_produk_id" value={selectedProduk.id} />
                    <input type="hidden" name="qc_stage" value={selectedProduk.current_stage} />
                    
                    {/* Dynamic Defect Items */}
                    {defectItems.map((item, index) => (
                        <div key={index} className="mb-4 p-4 border-2 border-gray-200 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">Cacat #{index + 1}</h3>
                                {defectItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDefectItem(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        🗑️ Hapus
                                    </button>
                                )}
                            </div>
                            
                            <div className="mb-2">
                                <label className="block text-sm font-medium mb-1">Foto Cacat</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={(e) => updateDefectItem(index, 'photo', e.target.files[0])}
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Catatan Cacat</label>
                                <textarea
                                    required
                                    value={item.notes}
                                    onChange={(e) => updateDefectItem(index, 'notes', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    rows={3}
                                    placeholder="Jelaskan cacat yang ditemukan..."
                                />
                            </div>
                        </div>
                    ))}
                    
                    <button
                        type="button"
                        onClick={addDefectItem}
                        className="w-full mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-medium"
                    >
                        + Tambah Cacat Lain
                    </button>
                    
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowDefectModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Submit Defect
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)}
```

### C. `DefectManagement/Index.tsx`
List semua defect dengan status:
```tsx
interface Defect {
    id: number;
    nama_project: string;
    company_name: string;
    nama_produk: string;
    qc_stage: string;
    status: string;
    reported_by: string;
    reported_at: string;
    total_defects: number;
    total_repaired: number;
}

export default function Index({ defects }: { defects: Defect[] }) {
    // Status badge colors
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'in_repair': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'completed': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    
    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending': return 'Menunggu Perbaikan';
            case 'in_repair': return 'Sedang Diperbaiki';
            case 'completed': return 'Selesai';
            default: return status;
        }
    };
    
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Defect Management</h1>
            
            <div className="grid grid-cols-1 gap-4">
                {defects.map(defect => (
                    <div key={defect.id} className="bg-white rounded-xl shadow-lg border p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">{defect.nama_project}</h3>
                                <p className="text-sm text-gray-600">{defect.company_name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(defect.status)}`}>
                                {getStatusLabel(defect.status)}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                                <span className="text-gray-600">Produk:</span>
                                <span className="ml-2 font-semibold">{defect.nama_produk}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">QC Stage:</span>
                                <span className="ml-2 font-semibold">{defect.qc_stage}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Dilaporkan oleh:</span>
                                <span className="ml-2 font-semibold">{defect.reported_by}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Tanggal:</span>
                                <span className="ml-2 font-semibold">
                                    {new Date(defect.reported_at).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm">
                                <span className="text-gray-600">Progress Perbaikan:</span>
                                <span className="ml-2 font-bold text-blue-600">
                                    {defect.total_repaired}/{defect.total_defects} diperbaiki
                                </span>
                            </div>
                            <Link
                                href={`/defect-management/${defect.id}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Lihat Detail
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### D. `DefectManagement/Show.tsx`
Detail defect dengan form upload perbaikan:
```tsx
interface DefectItem {
    id: number;
    photo_url: string;
    notes: string;
    order: number;
    repairs: Repair[];
}

interface Repair {
    id: number;
    photo_url: string;
    notes: string;
    repaired_by: string;
    repaired_at: string;
}

export default function Show({ defect }) {
    const [showRepairModal, setShowRepairModal] = useState<number | null>(null);
    const [repairPhoto, setRepairPhoto] = useState<File | null>(null);
    const [repairNotes, setRepairNotes] = useState('');
    
    const handleSubmitRepair = (defectItemId: number) => {
        const formData = new FormData();
        formData.append('photo', repairPhoto!);
        formData.append('notes', repairNotes);
        
        router.post(`/defect-items/${defectItemId}/repair`, formData, {
            onSuccess: () => {
                setShowRepairModal(null);
                setRepairPhoto(null);
                setRepairNotes('');
            }
        });
    };
    
    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h1 className="text-3xl font-bold mb-2">{defect.nama_project}</h1>
                <p className="text-gray-600 mb-4">{defect.company_name} - {defect.customer_name}</p>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Produk:</span>
                        <span className="ml-2 font-semibold">{defect.nama_produk}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">QC Stage:</span>
                        <span className="ml-2 font-semibold">{defect.qc_stage}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-semibold">{defect.status}</span>
                    </div>
                </div>
            </div>
            
            {/* Defect Items List */}
            <div className="space-y-6">
                {defect.defect_items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold mb-4">Cacat #{index + 1}</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {/* Foto Cacat */}
                            <div>
                                <h4 className="font-semibold mb-2 text-red-600">📸 Foto Cacat</h4>
                                <img 
                                    src={item.photo_url} 
                                    alt="Defect" 
                                    className="w-full rounded-lg border-2 border-red-300 mb-2"
                                />
                                <p className="text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                                    <strong>Catatan:</strong> {item.notes}
                                </p>
                            </div>
                            
                            {/* Foto Perbaikan */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-green-600">✅ Foto Perbaikan</h4>
                                    {item.repairs.length === 0 && (
                                        <button
                                            onClick={() => setShowRepairModal(item.id)}
                                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                        >
                                            + Upload Perbaikan
                                        </button>
                                    )}
                                </div>
                                
                                {item.repairs.length > 0 ? (
                                    item.repairs.map(repair => (
                                        <div key={repair.id} className="mb-4">
                                            <img 
                                                src={repair.photo_url} 
                                                alt="Repair" 
                                                className="w-full rounded-lg border-2 border-green-300 mb-2"
                                            />
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                                <p className="mb-1"><strong>Catatan:</strong> {repair.notes}</p>
                                                <p className="text-xs text-gray-600">
                                                    Diperbaiki oleh: {repair.repaired_by} 
                                                    pada {new Date(repair.repaired_at).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => router.delete(`/defect-repairs/${repair.id}`)}
                                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                                            >
                                                🗑️ Hapus Perbaikan
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                                        Belum ada foto perbaikan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Modal Upload Perbaikan */}
            {showRepairModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Upload Foto Perbaikan</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Foto Hasil Perbaikan</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setRepairPhoto(e.target.files?.[0] || null)}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Catatan Perbaikan</label>
                            <textarea
                                value={repairNotes}
                                onChange={(e) => setRepairNotes(e.target.value)}
                                className="w-full border rounded-lg p-2"
                                rows={4}
                                placeholder="Jelaskan perbaikan yang dilakukan..."
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRepairModal(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleSubmitRepair(showRepairModal)}
                                disabled={!repairPhoto || !repairNotes}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

## 📱 6. Update Sidebar

### `components/Sidebar.tsx`
Tambahkan menu Defect Management:
```tsx
const menuItems = [
    // ... existing menu items ...
    {
        name: 'Defect Management',
        href: '/defect-management',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        active: currentPage === 'defect-management',
    },
    // ... rest of menu items ...
];
```

---

## ✅ 7. Checklist Implementasi

### Database
- [ ] Buat migration `create_defects_table`
- [ ] Buat migration `create_defect_items_table`
- [ ] Buat migration `create_defect_repairs_table`
- [ ] Run migration: `php artisan migrate`

### Models
- [ ] Buat `app/Models/Defect.php`
- [ ] Buat `app/Models/DefectItem.php`
- [ ] Buat `app/Models/DefectRepair.php`
- [ ] Update `app/Models/ItemPekerjaanProduk.php` (tambah relasi)

### Controllers
- [ ] Buat `app/Http/Controllers/DefectController.php`
- [ ] Update `app/Http/Controllers/ProjectManagementController.php`

### Routes
- [ ] Tambahkan routes defect di `routes/web.php`

### Frontend - Project Management
- [ ] Update `ProjectManagement/Detail.tsx` (tambah tombol Report Defect)
- [ ] Buat modal input defect di `ProjectManagement/Detail.tsx`

### Frontend - Defect Management
- [ ] Buat `resources/js/Pages/DefectManagement/Index.tsx`
- [ ] Buat `resources/js/Pages/DefectManagement/Show.tsx`

### UI
- [ ] Update `components/Sidebar.tsx` (tambah menu Defect Management)
- [ ] Test responsive di mobile

### Storage
- [ ] Pastikan folder `storage/app/public/defects` tersedia
- [ ] Pastikan folder `storage/app/public/defect-repairs` tersedia
- [ ] Run: `php artisan storage:link` jika belum

### Testing
- [ ] Test report defect dari Project Management
- [ ] Test upload foto perbaikan
- [ ] Test delete foto perbaikan
- [ ] Test update status defect
- [ ] Test filter by status
- [ ] Test validasi file upload (max size, format)

---

## 🎯 Fitur Tambahan (Optional)

1. **Filter & Search** di Defect Management Index:
   - Filter by status (pending, in_repair, completed)
   - Filter by QC stage
   - Search by project name
   - Date range filter

2. **Notifikasi**:
   - Email ke team ketika defect dilaporkan
   - Notif ketika perbaikan selesai

3. **Export Report**:
   - Export defect report ke PDF
   - Include foto before-after

4. **Dashboard Analytics**:
   - Total defects by QC stage
   - Average repair time
   - Defect rate per produk

5. **Image Comparison**:
   - Side-by-side comparison cacat vs perbaikan
   - Image zoom/lightbox

---

## 📝 Notes

1. **File Upload Limit**: Default max 5MB per foto, bisa disesuaikan di validation
2. **Storage**: Semua foto disimpan di `storage/app/public/defects` dan `defect-repairs`
3. **Status Auto-Update**: Status defect otomatis berubah berdasarkan progress perbaikan
4. **Multiple Repairs**: Satu defect item bisa punya multiple repair attempts (untuk tracking rework)
5. **Permission**: Pertimbangkan role-based access (siapa yang bisa report, siapa yang bisa repair)

---

## 🚀 Deployment Notes

1. Pastikan folder storage writable: `chmod -R 775 storage`
2. Run migration di production: `php artisan migrate --force`
3. Clear cache: `php artisan config:clear && php artisan cache:clear`
4. Optimize: `php artisan optimize`

---

**Selamat mengimplementasikan! 🎉**
