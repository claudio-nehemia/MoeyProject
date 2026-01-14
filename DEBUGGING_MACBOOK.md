# Debugging Guide - MacBook & Ad Blocker Issues

## Masalah yang Diperbaiki

### 1. Form Submission Error di MacBook
**Solusi:**
- ✅ Menambahkan validasi input sebelum submit
- ✅ Membersihkan karakter non-digit dari harga (titik pemisah ribuan)
- ✅ Menambahkan error handling dengan alert dan console logging
- ✅ Sanitize input di backend untuk menghindari validation error

### 2. Ad Blocker Blocking Request
**Kemungkinan Penyebab:**
- URL mengandung kata "produk" atau "ad" yang di-block oleh ad blocker
- Request form data di-block

**Solusi Sementara:**
1. Disable ad blocker untuk localhost atau domain aplikasi
2. Whitelist domain di ad blocker settings
3. Gunakan browser mode incognito/private tanpa extensions

## Cara Debugging

### 1. Buka Browser Console
- **Chrome/Edge**: `Cmd + Option + J` (Mac) atau `F12` (Windows)
- **Firefox**: `Cmd + Option + K` (Mac) atau `F12` (Windows)
- **Safari**: `Cmd + Option + C` (Mac)

### 2. Cek Console Logs
Saat submit form, akan muncul log seperti ini:
```
=== Produk Submit Debug ===
Nama Produk: Test Produk
Bahan Baku: [{item_id: 1, harga_dasar: "1000000", harga_jasa: "500000"}]
Selected Images: 2
```

### 3. Cek Network Tab
- Buka tab **Network** di Developer Tools
- Submit form
- Lihat request ke `/produk`
- Cek status code (harus 200 atau 302)
- Jika 422: ada validation error
- Jika 500: ada server error
- Jika blocked: ad blocker atau CORS issue

### 4. Cek Laravel Logs
```bash
tail -f storage/logs/laravel.log
```

Akan muncul log seperti:
```
[2026-01-14 19:xx:xx] local.INFO: Produk Store Request {"nama_produk":"Test","bahan_baku":[...]}
```

## Solusi Ad Blocker

### Disable Ad Blocker untuk Development

**uBlock Origin:**
1. Klik icon uBlock
2. Klik tombol power besar untuk disable di site ini
3. Refresh halaman

**AdBlock/AdBlock Plus:**
1. Klik icon AdBlock
2. Pilih "Don't run on pages on this domain"
3. Refresh halaman

**Brave Browser:**
1. Klik icon Brave Shields (logo singa)
2. Toggle "Shields" ke Off
3. Refresh halaman

### Whitelist Localhost

Tambahkan ke whitelist ad blocker:
- `localhost`
- `127.0.0.1`
- Domain development Anda

## Checklist Troubleshooting

- [ ] Ad blocker sudah di-disable untuk site ini?
- [ ] Browser console menunjukkan error?
- [ ] Network tab menunjukkan request failed atau blocked?
- [ ] Validation error di form (cek alert message)?
- [ ] Semua field required sudah diisi?
- [ ] Format harga sudah benar (hanya angka)?
- [ ] File gambar tidak lebih dari 2MB?
- [ ] Laravel logs menunjukkan error?

## Known Issues & Solutions

### Issue: "Numeric value out of range"
**Solusi:** ✅ Sudah diperbaiki - kolom harga_jasa sekarang DECIMAL(15,2)

### Issue: "Validation failed for harga_dasar"
**Solusi:** ✅ Sudah diperbaiki - input di-sanitize untuk remove titik pemisah ribuan

### Issue: "Cannot read property of undefined"
**Solusi:** ✅ Sudah diperbaiki - tambah null checking di formatNumber

### Issue: Form tidak submit (no error shown)
**Penyebab:** Ad blocker atau browser extension blocking request
**Solusi:**
1. Disable ad blocker
2. Coba browser incognito/private mode
3. Cek console untuk error JavaScript

## Testing di MacBook

Pastikan test skenario berikut:

1. **Create Produk** tanpa bahan baku ✓
2. **Create Produk** dengan 1 bahan baku ✓
3. **Create Produk** dengan multiple bahan baku ✓
4. **Create Produk** dengan gambar ✓
5. **Edit Produk** - pastikan harga tampil benar ✓
6. **Delete Produk** ✓

## Contact Support

Jika masih ada masalah, kirim informasi berikut:
1. Screenshot console errors
2. Screenshot network tab
3. Browser & version (cek di About)
4. Ad blocker yang digunakan
5. Error message lengkap
