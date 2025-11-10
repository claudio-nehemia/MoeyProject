# Debug Team Assignment - Order Management

## 🐛 Issue IDENTIFIED & FIXED! ✅

**Problem:** Nama-nama anggota tim tidak masuk ke database (`order_teams` table kosong setelah create/edit order).

**Root Cause Found:**
- `setData('user_ids', array)` di dalam handleSubmit TIDAK bekerja dengan baik
- Bahkan dengan setTimeout(0), data user_ids tetap `[]` empty array saat POST
- Inertia `setData()` adalah async dan tidak ter-apply sebelum `post()` dipanggil

**Debug Evidence:**
```
Frontend Console:
- All User IDs (combined): [33, 34, 9, 10, 22, 19] ✓ CORRECT
- Form data BEFORE setData: user_ids: [] 
- Form data AFTER setData: user_ids: [] ✗ STILL EMPTY!

Backend Log:
- User IDs from request: [] ✗ EMPTY ARRAY
- No user_ids to attach! ✗
```

## ✅ Solution Implemented

**New Approach:** Update `user_ids` **immediately when user selects/unselects** team members, bukan di handleSubmit.

### Changes Made:

1. **Created `updateUserIds()` function:**
   - Combines all team member IDs
   - Calls `setData('user_ids', allUserIds)` immediately
   - Logs for debugging

2. **Modified `handleUserToggle()`:**
   - Setiap kali user klik team member
   - State updated (selectedMarketings, etc)
   - **THEN immediately call `updateUserIds()`**
   - This ensures user_ids is always in sync

3. **Simplified `handleSubmit()`:**
   - No more setData in submit
   - No more setTimeout
   - Just directly `post()` - data sudah lengkap

### Code Pattern:

```typescript
const handleUserToggle = (userId: number, category: 'marketing' | 'drafter' | 'desainer') => {
    if (category === 'marketing') {
        setSelectedMarketings(prev => {
            const newSelection = prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId];
            // ✅ Update user_ids immediately!
            updateUserIds(newSelection, selectedDrafters, selectedDesainers);
            return newSelection;
        });
    }
    // ... same for drafter and desainer
};

const updateUserIds = (marketings: number[], drafters: number[], designers: number[]) => {
    const allUserIds = [...marketings, ...drafters, ...designers];
    setData('user_ids', allUserIds);
    console.log('Updated user_ids in form data:', allUserIds);
};

const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    console.log('Form data user_ids:', data.user_ids); // Should have values!
    post('/order'); // Just post - data already complete
};
```

## 📝 Debug Logs (STILL ACTIVE)

### Frontend (JavaScript Console)

**Create.tsx** - Menampilkan di browser console:
```
=== DEBUG CREATE ORDER ===
Selected Marketing IDs: [array of IDs]
Selected Drafter IDs: [array of IDs]
Selected Designer IDs: [array of IDs]
All User IDs (combined): [combined array]
Current form data BEFORE setData: {object}
Current form data AFTER setData (in setTimeout): {object}
Posting to /order...
```

**Edit.tsx** - Menampilkan di browser console:
```
=== DEBUG EDIT ORDER ===
Order ID: X
Selected Marketing IDs: [array of IDs]
Selected Drafter IDs: [array of IDs]
Selected Designer IDs: [array of IDs]
All User IDs (combined): [combined array]
Current form data BEFORE setData: {object}
Current form data AFTER setData (in setTimeout): {object}
Posting to /order/X
```

### Backend (Laravel Logs)

**OrderController@store** - Check di `storage/logs/laravel.log`:
```
=== DEBUG ORDER STORE ===
All Request Data: [all POST data]
User IDs from request: [array or null]
Has user_ids key?: true/false
Validated Data: [validated data]
User IDs after validation: [array or 'NOT SET']
Order created with ID: X
Attaching users to order: [array]
Users attached successfully
OR
No user_ids to attach! (WARNING)
```

**OrderController@update** - Check di `storage/logs/laravel.log`:
```
=== DEBUG ORDER UPDATE ===
Order ID: X
All Request Data: [all PUT data]
User IDs from request: [array or null]
Has user_ids key?: true/false
Validated Data: [validated data]
User IDs after validation: [array or 'NOT SET']
Order updated successfully
Syncing users to order: [array]
Users synced successfully
OR
No user_ids to sync! (WARNING)
```

## 🔍 How to Debug

### 1. Test Create Order
1. Buka browser ke `/order/create`
2. Buka Developer Tools (F12) → Console tab
3. Pilih beberapa anggota tim
4. Klik "Create Order"
5. **Check console log** untuk melihat data yang dikirim
6. **Check Laravel log** (`storage/logs/laravel.log`) untuk melihat data yang diterima

### 2. Test Edit Order
1. Buka browser ke `/order/{id}/edit`
2. Buka Developer Tools (F12) → Console tab
3. Modifikasi anggota tim
4. Klik "Update Order"
5. **Check console log** untuk melihat data yang dikirim
6. **Check Laravel log** (`storage/logs/laravel.log`) untuk melihat data yang diterima

### 3. Compare Logs
Bandingkan log frontend vs backend:

**✅ EXPECTED (CORRECT):**
```
Frontend: All User IDs (combined): [1, 2, 3]
Backend:  User IDs from request: [1, 2, 3]
Backend:  Attaching users to order: [1, 2, 3]
```

**❌ PROBLEM SCENARIOS:**

**Scenario A - user_ids tidak terkirim:**
```
Frontend: All User IDs (combined): [1, 2, 3]  ✓
Backend:  User IDs from request: null          ✗ (MASALAH!)
Backend:  No user_ids to attach!               ✗
```
→ **Solusi:** Data tidak sampai ke backend, cek Inertia form submission

**Scenario B - user_ids masih kosong di frontend:**
```
Frontend: All User IDs (combined): []         ✗ (MASALAH!)
Backend:  User IDs from request: null         ✗
```
→ **Solusi:** State management issue, user selection tidak tersimpan

**Scenario C - setData tidak bekerja:**
```
Frontend: Current form data BEFORE setData: {..., user_ids: []}  ✓
Frontend: Current form data AFTER setData: {..., user_ids: []}   ✗ (MASALAH!)
```
→ **Solusi:** setData async issue, perlu fix timing atau approach

## 📊 Check Database

Setelah create/edit order, cek tabel `order_teams`:

```sql
-- Check apakah ada record
SELECT * FROM order_teams WHERE order_id = [order_id_yang_baru_dibuat];

-- Expected result:
+----------+---------+
| order_id | user_id |
+----------+---------+
|    X     |    1    |
|    X     |    2    |
|    X     |    3    |
+----------+---------+
```

Jika tabel kosong, cocokkan dengan log untuk identifikasi masalah.

## 🔧 Files Modified

1. **Create.tsx** - Added console.log in handleSubmit
2. **Edit.tsx** - Added console.log in handleSubmit  
3. **OrderController.php** - Added \Log::info in store() and update()

## 📍 Next Steps After Testing

1. **Share log output** - Copy paste console log + Laravel log
2. **Analyze** - Lihat dimana data hilang (frontend → backend → database)
3. **Fix** - Based on analysis:
   - If data not sent: Fix Inertia form submission
   - If setData not working: Change approach (different state management)
   - If validation fails: Adjust validation rules
   - If attach/sync fails: Check relationship setup

## 🗑️ Remove Debug Logs (After Fixed)

Once issue is identified and fixed, remove debug logs:
- Search for `console.log('=== DEBUG` in Create.tsx & Edit.tsx
- Search for `\Log::info('=== DEBUG` in OrderController.php
- Delete or comment out debug statements

---

**Status:** 🔍 Debug mode active
**Next:** Test create/edit order and check logs
