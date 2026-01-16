# 📋 Dokumentasi Perubahan Rumus RAB

## 🎯 Rumus Utama (Baru)

**Harga Jual = (Harga Bahan Baku + Harga Finishing) ÷ (Markup / 100) × Dimensi × Qty**

### Penjelasan Komponen:
- **Harga Bahan Baku**: Sum dari `harga` atau `harga_jasa` bahan baku yang dipilih di Item Pekerjaan
- **Harga Finishing**: Sum dari harga item finishing (fn dalam & fn luar) yang dipilih, TIDAK termasuk Aksesoris & Bahan Baku
- **Markup**: Persentase markup, diubah jadi divider dengan dibagi 100 (misal: 150% → 150/100 = 1.5, lalu harga dibagi 1.5)
- **Dimensi**: Panjang × Lebar × Tinggi (minimum 1 untuk setiap dimensi)
- **Qty**: Quantity produk

**Contoh Perhitungan Markup**:
- Markup 150% → 150/100 = 1.5 (divider)
- Harga BB + Finishing = Rp 100,000
- Hasil: Rp 100,000 ÷ 1.5 = Rp 66,666.67

---

## 📊 Karakteristik Setiap Jenis RAB

### 1️⃣ RAB Internal
**Karakteristik**: 
- ✅ Pakai Markup
- ✅ Include Aksesoris
- ✅ Pakai harga_dasar (bukan harga_jasa)

**Rumus**:
```
markupDivider = markup / 100  // 150% → 1.5
Harga Satuan = (Harga Bahan Baku + Harga Finishing) ÷ markupDivider × Dimensi × Qty
Harga Akhir = Harga Satuan + Total Harga Aksesoris
```

**File yang Diubah**:
- `app/Http/Controllers/RabInternalController.php`
  - Method: `store()` (line ~218)
  - Method: `update()` (line ~525)

**Perubahan**:
- Ditambahkan komentar `✅ RUMUS BARU RAB INTERNAL` untuk klarifikasi formula
- Formula tetap sama, hanya dokumentasi yang diperjelas

---

### 2️⃣ RAB Kontrak
**Karakteristik**: 
- ✅ Pakai Markup (dari Internal, apply lagi ke bahan & finishing)
- ✅ Include Aksesoris
- ✅ Untuk kontrak dengan customer

**Rumus**:
```
// Ambil dari RAB Internal, apply pembagian markup ke bahan & finishing
markupDivider = markup / 100  // 150% → 1.5
harga_dasar_kontrak = harga_dasar_internal ÷ markupDivider
harga_items_kontrak = harga_items_internal ÷ markupDivider

// Harga satuan & akhir sudah include pembagian markup dari Internal
Harga Satuan = Harga Satuan Internal
Harga Akhir = Harga Akhir Internal
```

**File yang Diubah**:
- `app/Http/Controllers/RabKontrakController.php`
  - Method: `generate()` (line ~77)
  - Method: `regenerate()` (line ~338)

**Perubahan**:
- Ditambahkan komentar `✅ RAB KONTRAK: Apply markup HANYA pada harga_dasar & harga_items_non_aksesoris`
- Klarifikasi bahwa harga_satuan dan harga_akhir sudah include markup dari Internal

---

### 3️⃣ RAB Vendor
**Karakteristik**: 
- ❌ TANPA Markup (harga original)
- ✅ Include Aksesoris
- ✅ Harga asli untuk vendor

**Rumus**:
```
Harga Satuan = (Harga Bahan Baku + Harga Finishing) × Dimensi × Qty (NO MARKUP)
Harga Akhir = Harga Satuan + Total Harga Aksesoris (original prices)
```

**File yang Diubah**:
- `app/Http/Controllers/RabVendorController.php`
  - Method: `generate()` (line ~76)
  - Method: `regenerate()` (line ~348)

**Perubahan**:
- Ditambahkan komentar `✅ RAB VENDOR: TANPA markup - harga original untuk vendor`
- Klarifikasi formula tanpa markup
- Copy langsung harga original dari RAB Internal

---

### 4️⃣ RAB Jasa
**Karakteristik**: 
- ❌ TANPA Markup
- ❌ TANPA Aksesoris
- ✅ Pakai `harga_jasa` (bukan `harga`)

**Rumus**:
```
Harga Satuan = (Harga Jasa Bahan Baku + Harga Finishing) × Dimensi × Qty (NO MARKUP, NO AKSESORIS)
Harga Akhir = Harga Satuan (no aksesoris)
```

**File yang Diubah**:
- `app/Http/Controllers/RabJasaController.php`
  - Method: `generate()` (line ~77)
  - Method: `regenerate()` (line ~290)

**Perubahan**:
- Ditambahkan komentar `✅ RAB JASA: Pakai HARGA_JASA bukan harga, TANPA aksesoris`
- Klarifikasi formula khusus untuk jasa/labour
- Pakai `harga_jasa` dari `bahanBakus` pivot table

---

## 🔍 Perbedaan Utama Setiap RAB

| Aspek | Internal | Kontrak | Vendor | Jasa |
|-------|----------|---------|--------|------|
| **Markup** | ✅ Ya | ✅ Ya (double) | ❌ Tidak | ❌ Tidak |
| **Aksesoris** | ✅ Ya | ✅ Ya | ✅ Ya | ❌ Tidak |
| **Harga Dasar** | `harga` | `harga` × markup | `harga` (original) | `harga_jasa` |
| **Tujuan** | Hitung cost + profit | Customer contract | Purchase order vendor | Labour cost only |

---

## 📝 Catatan Penting

### Dimensi Calculation
```php
if (panjang && lebar && tinggi exist) {
    $hargaDimensi = max(1, panjang) × max(1, lebar) × max(1, tinggi) × qty
} else {
    $hargaDimensi = qty
}
```

### Harga Bahan Baku
- **Source**: Dipilih dari master data produk, kemudian di-select lagi di Item Pekerjaan
- **Stored in**: `item_pekerjaan_bahan_bakus` pivot table
- **Calculation**: Sum dari semua bahan baku yang dipilih

### Harga Finishing (harga_items_non_aksesoris)
- **Include**: Semua item SELAIN Aksesoris & Bahan Baku
- **Contoh**: Cat, Lem, Paku, dll (jenis item finishing dalam & luar)
- **Calculation**: Sum dari (harga × quantity) semua finishing items

### Aksesoris
- **Only in**: RAB Internal, Kontrak, Vendor
- **NOT in**: RAB Jasa
- **Applied**: Setelah harga_satuan dihitung, ditambahkan ke harga_akhir

---

## 🚀 Testing Checklist

### RAB Internal
- [ ] Create RAB Internal dengan markup 10%
- [ ] Verify harga_satuan = (bahan baku + finishing) × 1.10 × dimensi
- [ ] Verify harga_akhir = harga_satuan + aksesoris
- [ ] Update RAB Internal, pastikan formula sama

### RAB Kontrak
- [ ] Generate RAB Kontrak dari Internal
- [ ] Verify harga_dasar & harga_items ada markup
- [ ] Verify harga_satuan & harga_akhir match dengan Internal
- [ ] Regenerate, pastikan ambil harga terbaru dari Internal

### RAB Vendor
- [ ] Generate RAB Vendor dari Internal
- [ ] Verify TIDAK ada markup (harga original)
- [ ] Verify include aksesoris dengan harga original
- [ ] Regenerate, pastikan tetap harga original

### RAB Jasa
- [ ] Generate RAB Jasa dari Internal
- [ ] Verify pakai harga_jasa (bukan harga)
- [ ] Verify TIDAK ada aksesoris
- [ ] Verify TIDAK ada markup
- [ ] Regenerate, pastikan sum harga_jasa benar

---

## 📅 Changelog

**Date**: 2026-01-16

**Changes**:
1. ✅ Clarified formula documentation in all RAB controllers
2. ✅ Added detailed comments explaining each RAB type characteristics
3. ✅ Maintained existing logic, improved readability
4. ✅ Documented formula differences between RAB types

**Modified Files**:
- `app/Http/Controllers/RabInternalController.php`
- `app/Http/Controllers/RabKontrakController.php`
- `app/Http/Controllers/RabVendorController.php`
- `app/Http/Controllers/RabJasaController.php`

**Frontend Files Updated** ✅:
- `resources/js/pages/RabInternal/Show.tsx` - Added formula breakdown card with detailed explanation
- `resources/js/pages/RabKontrak/Show.tsx` - Added formula breakdown card showing markup application
- `resources/js/pages/RabVendor/Show.tsx` - Added formula breakdown card emphasizing no markup
- `resources/js/pages/RabJasa/Show.tsx` - Added formula breakdown card explaining harga_jasa usage

### Frontend Changes Detail:
Each RAB Show page now includes:
1. **Visual Formula Card** with color-coded components
2. **Step-by-step calculation** explanation
3. **Legend** explaining each component (Harga BB, Finishing, Markup, etc.)
4. **Characteristics box** highlighting unique features of each RAB type
5. **Color coding** matching table headers for consistency

---

## 🎓 Formula Examples

### Example 1: RAB Internal
```
Bahan Baku HPL: Rp 100,000
Finishing Cat: Rp 20,000
Finishing Lem: Rp 10,000
Markup: 150%
Dimensi: 2m × 1m × 0.5m
Qty: 3 pcs

harga_dasar = 100,000
harga_items_non_aksesoris = 20,000 + 10,000 = 30,000
harga_dimensi = 2 × 1 × 0.5 × 3 = 3
markupDivider = 150 / 100 = 1.5

Harga Satuan = (100,000 + 30,000) ÷ 1.5 × 3 = 260,000

Aksesoris Engsel: Rp 5,000 × 4 pcs = 20,000
Harga Akhir = 260,000 + 20,000 = 280,000
```

### Example 2: RAB Vendor (Same Product, No Markup)
```
Harga Satuan = (100,000 + 30,000) × 3 = 390,000
Harga Akhir = 390,000 + 20,000 = 410,000
```

### Example 3: RAB Jasa (Same Product, Use harga_jasa)
```
Assuming harga_jasa for HPL = 50,000

Harga Satuan = (50,000 + 30,000) × 3 = 240,000
Harga Akhir = 240,000 (no aksesoris)
```

---

**Created by**: GitHub Copilot
**Review Status**: ⏳ Pending User Validation
