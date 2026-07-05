<?php

namespace Database\Seeders;

use App\Models\CashflowManualEntry;
use App\Models\CommitmentFee;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanItem;
use App\Models\ItemPekerjaanJenisItem;
use App\Models\ItemPekerjaanProduk;
use App\Models\ItemPekerjaanProdukBahanBaku;
use App\Models\JenisItem;
use App\Models\Kontrak;
use App\Models\Moodboard;
use App\Models\Order;
use App\Models\Produk;
use App\Models\RabInternal;
use App\Models\RabKontrak;
use App\Models\RabKontrakAksesoris;
use App\Models\RabKontrakProduk;
use App\Models\RabProduk;
use App\Models\Termin;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder to create a sample order with data closely matching
 * the "Salinan Moey Finance" spreadsheet (sheet: contoh).
 *
 * Target values from the spreadsheet:
 *   Kontrak Internal:  655.842.181
 *   Kontrak Fisik:      67.250.500
 *   Kontrak External:  126.912.430
 *   Total Kontrak:     850.005.111
 *
 *   SPK Internal:      362.412.673
 *   SPK Fisik:          42.056.500
 *   SPK External:      260.406.760
 *
 *   Pembayaran DP:     425.000.000 (50%)
 *   Pembayaran Termin: 326.813.223 (40%)
 */
class CashflowSampleSeeder extends Seeder
{
    public function run(): void
    {
        // Cleanup old sample data if exists to allow safe re-seeding
        $oldOrder = Order::where('nama_project', 'Titik Interior - Sample Finance')->first();
        if ($oldOrder) {
            \App\Models\CashflowVendorEntry::where('order_id', $oldOrder->id)->delete();
            \App\Models\CashflowManualEntry::where('order_id', $oldOrder->id)->delete();
            $oldOrder->delete();
        }

        // ──────────────────────────────────────────
        // 1. CREATE ORDER
        // ──────────────────────────────────────────
        $order = Order::create([
            'nama_project' => 'Titik Interior - Sample Finance',
            'company_name' => 'PT Titik Interior',
            'customer_name' => 'Januar',
            'customer_additional_info' => 'Data referensi dari Salinan Moey Finance',
            'phone_number' => '08123456789',
            'tanggal_masuk_customer' => '2026-01-15',
            'project_status' => 'in_progress',
            'payment_status' => 'dp',
            'tahapan_proyek' => 'rab',
            'jenis_interior_id' => 1,
        ]);

        // Assign PM (first user)
        $pm = User::first();
        if ($pm) {
            $order->users()->attach($pm->id);
        }

        // ──────────────────────────────────────────
        // 2. CREATE MOODBOARD
        // ──────────────────────────────────────────
        $moodboard = Moodboard::create([
            'order_id' => $order->id,
            'status' => 'approved',
        ]);

        // ──────────────────────────────────────────
        // 3. CREATE ITEM PEKERJAAN
        // ──────────────────────────────────────────
        $itemPekerjaan = ItemPekerjaan::create([
            'moodboard_id' => $moodboard->id,
            'status' => 'published',
        ]);

        // ──────────────────────────────────────────
        // 4. CREATE TERMIN & KONTRAK
        // ──────────────────────────────────────────
        $termin = Termin::firstOrCreate(
            ['kode_tipe' => 'STANDARD_3'],
            [
                'nama_tipe' => 'DP 50% - Termin 40% - Pelunasan 10%',
                'deskripsi' => 'Pembayaran 3 tahap standar',
                'tahapan' => [
                    ['nama_tahapan' => 'DP', 'persentase' => 50],
                    ['nama_tahapan' => 'Termin II', 'persentase' => 40],
                    ['nama_tahapan' => 'Pelunasan', 'persentase' => 10],
                ],
            ]
        );

        Kontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'termin_id' => $termin->id,
            'harga_kontrak' => 850005111, // Total kontrak from sheet
            'durasi_kontrak' => 120,
            'tanggal_mulai' => '2026-02-01',
            'tanggal_selesai' => '2026-06-01',
        ]);

        // ──────────────────────────────────────────
        // 5. ENSURE ITEMS WITH CATEGORIES EXIST
        // ──────────────────────────────────────────
        $jenisFinishingLuar = JenisItem::where('nama_jenis_item', 'Finishing Luar')->first();
        $jenisFinishingDalam = JenisItem::where('nama_jenis_item', 'Finishing Dalam')->first();
        $jenisAksesoris = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();
        $jenisBahanBaku = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();

        // Make sure items have categories set
        // Internal items
        $internalItems = Item::where('kategori', 'internal')->get();
        $fisikItems = Item::where('kategori', 'fisik')->get();
        $eksternalItems = Item::where('kategori', 'eksternal')->get();

        // If no items with categories yet, update existing items
        if ($internalItems->isEmpty() || $fisikItems->isEmpty() || $eksternalItems->isEmpty()) {
            $allItems = Item::all();
            $total = $allItems->count();
            $third = (int) ceil($total / 3);

            foreach ($allItems as $i => $item) {
                if ($i < $third) {
                    $item->update(['kategori' => 'internal']);
                } elseif ($i < $third * 2) {
                    $item->update(['kategori' => 'fisik']);
                } else {
                    $item->update(['kategori' => 'eksternal']);
                }
            }

            // Refresh
            $internalItems = Item::where('kategori', 'internal')->get();
            $fisikItems = Item::where('kategori', 'fisik')->get();
            $eksternalItems = Item::where('kategori', 'eksternal')->get();
        }

        // ──────────────────────────────────────────
        // 6. CREATE PRODUKS (Furniture Items)
        // ──────────────────────────────────────────
        // We'll create 5 produks to reach the total kontrak values
        // Target: Internal ~655.8M, Fisik ~67.3M, External ~126.9M
        $produks = [
            ['nama' => 'Kitchen Set', 'ruangan' => 'Dapur', 'harga_akhir' => 280000000],
            ['nama' => 'Wardrobe', 'ruangan' => 'Master Bedroom', 'harga_akhir' => 220000000],
            ['nama' => 'Lemari Buku', 'ruangan' => 'Ruang Kerja', 'harga_akhir' => 150000000],
            ['nama' => 'Meja Belajar', 'ruangan' => 'Kamar Anak', 'harga_akhir' => 120005111],
            ['nama' => 'Rak Sepatu', 'ruangan' => 'Entrance', 'harga_akhir' => 80000000],
        ];

        // Total: 850.005.111 ✓

        // Create RAB Kontrak header
        $rabKontrak = RabKontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'response_by' => 'admin',
            'response_time' => now(),
        ]);

        // Create RAB Internal header
        $rabInternal = RabInternal::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
        ]);

        // Define proportion targets for each produk
        // We'll use bahan baku (raw materials) to control the category proportions
        // Target proportions: Internal 77.16%, Fisik 7.91%, External 14.93%
        $pctInternal = 0.7716;
        $pctFisik = 0.0791;
        $pctExternal = 0.1493;

        foreach ($produks as $produkData) {
            $produk = Produk::where('nama_produk', $produkData['nama'])->first();
            if (!$produk) {
                $produk = Produk::first();
            }

            // Create ItemPekerjaanProduk
            $ipp = ItemPekerjaanProduk::create([
                'item_pekerjaan_id' => $itemPekerjaan->id,
                'nama_ruangan' => $produkData['ruangan'],
                'produk_id' => $produk->id,
                'quantity' => 1,
                'panjang' => 200,
                'lebar' => 60,
                'tinggi' => 240,
            ]);

            $hargaAkhir = $produkData['harga_akhir'];

            // Create bahan baku entries with proportional prices per category
            $hargaInternalBb = round($hargaAkhir * $pctInternal * 0.25); // 25% of proportion goes to raw materials
            $hargaFisikBb = round($hargaAkhir * $pctFisik * 0.25);
            $hargaExternalBb = round($hargaAkhir * $pctExternal * 0.25);

            // Get one item from each category for bahan baku
            $bbInternal = $internalItems->where('jenis_item_id', $jenisBahanBaku?->id)->first() ?? $internalItems->first();
            $bbFisik = $fisikItems->where('jenis_item_id', $jenisBahanBaku?->id)->first() ?? $fisikItems->first();
            $bbExternal = $eksternalItems->where('jenis_item_id', $jenisBahanBaku?->id)->first() ?? $eksternalItems->first();

            if ($bbInternal) {
                ItemPekerjaanProdukBahanBaku::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'item_id' => $bbInternal->id,
                    'harga_dasar' => $hargaInternalBb,
                    'harga_jasa' => round($hargaInternalBb * 0.3),
                ]);
            }

            if ($bbFisik) {
                ItemPekerjaanProdukBahanBaku::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'item_id' => $bbFisik->id,
                    'harga_dasar' => $hargaFisikBb,
                    'harga_jasa' => round($hargaFisikBb * 0.3),
                ]);
            }

            if ($bbExternal) {
                ItemPekerjaanProdukBahanBaku::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'item_id' => $bbExternal->id,
                    'harga_dasar' => $hargaExternalBb,
                    'harga_jasa' => round($hargaExternalBb * 0.3),
                ]);
            }

            // Create finishing items (Finishing Luar/Dalam)
            if ($jenisFinishingLuar) {
                $jenisFLuar = ItemPekerjaanJenisItem::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'jenis_item_id' => $jenisFinishingLuar->id,
                ]);

                // Add finishing items from different categories
                $finishInternal = $internalItems->where('jenis_item_id', $jenisFinishingLuar->id)->first();
                $finishFisik = $fisikItems->where('jenis_item_id', $jenisFinishingLuar->id)->first();
                $finishExternal = $eksternalItems->where('jenis_item_id', $jenisFinishingLuar->id)->first();

                if ($finishInternal) {
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $jenisFLuar->id,
                        'item_id' => $finishInternal->id,
                        'quantity' => round($hargaAkhir * $pctInternal * 0.35 / max($finishInternal->harga, 1)),
                    ]);
                }
                if ($finishFisik) {
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $jenisFLuar->id,
                        'item_id' => $finishFisik->id,
                        'quantity' => round($hargaAkhir * $pctFisik * 0.35 / max($finishFisik->harga, 1)),
                    ]);
                }
                if ($finishExternal) {
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $jenisFLuar->id,
                        'item_id' => $finishExternal->id,
                        'quantity' => round($hargaAkhir * $pctExternal * 0.35 / max($finishExternal->harga, 1)),
                    ]);
                }
            }

            // Create RabKontrakProduk
            RabKontrakProduk::create([
                'rab_kontrak_id' => $rabKontrak->id,
                'item_pekerjaan_produk_id' => $ipp->id,
                'harga_dasar' => round($hargaAkhir * 0.7),
                'harga_finishing_luar' => round($hargaAkhir * 0.1),
                'harga_finishing_dalam' => round($hargaAkhir * 0.05),
                'harga_items_non_aksesoris' => 0,
                'harga_dimensi' => round($hargaAkhir * 0.05),
                'harga_satuan' => $hargaAkhir,
                'harga_total_aksesoris' => round($hargaAkhir * 0.1),
                'diskon_per_produk' => 0,
                'harga_akhir' => $hargaAkhir,
            ]);
        }

        // ──────────────────────────────────────────
        // 7. CREATE INVOICES (Pembayaran DP & Termin II)
        // ──────────────────────────────────────────
        // DP: 425.000.000
        Invoice::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'rab_kontrak_id' => $rabKontrak->id,
            'invoice_number' => 'INV-2026-TITIK-001',
            'termin_step' => 1,
            'termin_text' => 'DP',
            'termin_persentase' => 50,
            'total_amount' => 425000000,
            'status' => 'paid',
            'paid_at' => '2026-02-03',
        ]);

        // Termin II: 326.813.223
        Invoice::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'rab_kontrak_id' => $rabKontrak->id,
            'invoice_number' => 'INV-2026-TITIK-002',
            'termin_step' => 2,
            'termin_text' => 'Termin II',
            'termin_persentase' => 40,
            'total_amount' => 326813223,
            'status' => 'paid',
            'paid_at' => '2026-05-18',
        ]);

        // ──────────────────────────────────────────
        // 8. CREATE CASHFLOW MANUAL ENTRIES
        // ──────────────────────────────────────────
        $manualEntries = [
            // SPK Values
            ['category' => 'spk_internal', 'amount_estimasi' => 362412673],
            ['category' => 'spk_fisik', 'amount_estimasi' => 42056500],
            ['category' => 'spk_external', 'amount_estimasi' => 260406760],

            // SPK Fix
            ['category' => 'spk_internal_fix', 'amount_estimasi' => 212079185],
            ['category' => 'upgrade_material', 'amount_estimasi' => 192699917],
            ['category' => 'spk_fisik_fix', 'amount_estimasi' => 0],
            ['category' => 'spk_external_fix', 'amount_estimasi' => 192699917],

            // Realisasi Pengeluaran
            ['category' => 'realisasi_internal', 'amount_estimasi' => 106698765],
            ['category' => 'realisasi_fisik', 'amount_estimasi' => 0],
            ['category' => 'realisasi_external', 'amount_estimasi' => 103519500],
            ['category' => 'realisasi_addendum', 'amount_estimasi' => 0],

            // Fee percentages (defaults from sheet)
            ['category' => 'pct_budget_dm', 'amount_estimasi' => 10],
            ['category' => 'pct_operasional', 'amount_estimasi' => 6],
            ['category' => 'pct_cadangan_overhead', 'amount_estimasi' => 17],
            ['category' => 'pct_entertaint', 'amount_estimasi' => 2],
            ['category' => 'pct_deposit_gaji', 'amount_estimasi' => 5],
            ['category' => 'pct_cadangan_problem', 'amount_estimasi' => 3],

            // RPK DP
            ['category' => 'dp_vendor', 'amount_estimasi' => 42415837],
            ['category' => 'cadangan_vendor_dp', 'amount_estimasi' => 31811878],
            ['category' => 'dp_fisik', 'amount_estimasi' => 0],
            ['category' => 'dp_external', 'amount_estimasi' => 72519500],

            // RPK Termin
            ['category' => 'termin_vendor', 'amount_estimasi' => 35000000],
            ['category' => 'material_hutang_vendor', 'amount_estimasi' => 64163421],
            ['category' => 'termin_fisik', 'amount_estimasi' => 0],
            ['category' => 'termin_external', 'amount_estimasi' => 31000000],

            // RPK Pelunasan
            ['category' => 'pelunasan_vendor', 'amount_estimasi' => 0],
            ['category' => 'material_hutang_vendor_pel', 'amount_estimasi' => 0],
            ['category' => 'pelunasan_fisik', 'amount_estimasi' => 0],
            ['category' => 'pelunasan_external', 'amount_estimasi' => 0],
            ['category' => 'addendum_cadangan_gaji', 'amount_estimasi' => 0],
            ['category' => 'pengeluaran_lain_lain', 'amount_estimasi' => 0],
        ];

        foreach ($manualEntries as $entry) {
            CashflowManualEntry::create([
                'order_id' => $order->id,
                'category' => $entry['category'],
                'label' => ucwords(str_replace('_', ' ', $entry['category'])),
                'amount_estimasi' => $entry['amount_estimasi'],
                'amount_realisasi' => 0,
                'section' => 'general',
                'phase' => 'general',
                'created_by' => $pm?->id,
            ]);
        }

        // ──────────────────────────────────────────
        // 9. SEED DETAILED VENDOR ENTRIES
        // ──────────────────────────────────────────
        // A. Internal Main Payments
        $internalMainData = [
            ['label' => 'SDM Workshop', 'persentase' => 20.0, 'nilai' => 42415837, 'pembayaran' => 4305911, 'tanggal_pembayaran' => '2026-04-20', 'notes' => 'dp', 'sort_order' => 1],
            ['label' => 'Cadangan Vendor', 'persentase' => 15.0, 'nilai' => 31811878, 'pembayaran' => 3229433, 'tanggal_pembayaran' => '2026-04-20', 'notes' => 'cadangan', 'sort_order' => 2],
            ['label' => 'Kasbon I', 'persentase' => 0.0, 'nilai' => 0, 'pembayaran' => 35000000, 'tanggal_pembayaran' => '2026-05-11', 'notes' => 'termin', 'sort_order' => 3],
            ['label' => 'Kasbon II', 'persentase' => 0.0, 'nilai' => 0, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'termin', 'sort_order' => 4],
            ['label' => 'SDM Workshop 2', 'persentase' => 10.0, 'nilai' => 21207919, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'termin', 'sort_order' => 5],
            ['label' => 'Pelunasan', 'persentase' => null, 'nilai' => 41359130, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'pelunasan', 'sort_order' => 6],
        ];
        foreach ($internalMainData as $item) {
            \App\Models\CashflowVendorEntry::create(array_merge($item, [
                'order_id' => $order->id,
                'vendor_type' => 'internal',
                'section' => 'pembayaran_vendor',
                'created_by' => $pm?->id,
            ]));
        }

        // B. Internal Material Hutang - SOLMATOSS
        $solmatossInternal = [
            ['label' => 'Pembelian Material 26003105 - INV', 'nilai' => 193439, 'pembayaran' => 193439, 'tanggal_inv' => '2026-03-29', 'tanggal_pembayaran' => '2026-06-21', 'flag_af' => '✔'],
            ['label' => 'Pembelian Material 26003103 - INV', 'nilai' => 11981518, 'pembayaran' => 11981518, 'tanggal_inv' => '2026-03-29', 'tanggal_pembayaran' => '2026-06-21', 'flag_af' => '✔'],
            ['label' => 'Pembelian Material 26004315 - INV', 'nilai' => 45595199, 'pembayaran' => 45595199, 'tanggal_inv' => '2026-04-05', 'tanggal_pembayaran' => '2026-06-21', 'flag_af' => '✔'],
            ['label' => 'Pembelian Material 26005731 - INV', 'nilai' => 6393265, 'pembayaran' => 6393265, 'tanggal_inv' => '2026-06-01', 'tanggal_pembayaran' => '2026-06-21', 'flag_af' => '✔'],
        ];
        foreach ($solmatossInternal as $item) {
            \App\Models\CashflowVendorEntry::create(array_merge($item, [
                'order_id' => $order->id,
                'vendor_type' => 'internal',
                'section' => 'material_hutang',
                'vendor_group' => 'SOLMATOSS',
                'created_by' => $pm?->id,
            ]));
        }

        // C. Internal Material Hutang - FINARTINDO
        $finartindoInternal = [
            ['label' => 'Pembelian Material SI 20260401820', 'nilai' => 6396999, 'pembayaran' => 0, 'tanggal_inv' => '2026-05-20', 'tanggal_pembayaran' => '2026-06-25'],
            ['label' => 'Pembelian Material SI 20260401575', 'nilai' => 4194000, 'pembayaran' => 0, 'tanggal_inv' => '2026-05-16', 'tanggal_pembayaran' => '2026-06-25'],
            ['label' => 'Pembelian Material SI 20260500611', 'nilai' => 530002, 'pembayaran' => 0, 'tanggal_inv' => '2026-06-03', 'tanggal_pembayaran' => '2026-06-25'],
        ];
        foreach ($finartindoInternal as $item) {
            \App\Models\CashflowVendorEntry::create(array_merge($item, [
                'order_id' => $order->id,
                'vendor_type' => 'internal',
                'section' => 'material_hutang',
                'vendor_group' => 'FINARTINDO',
                'created_by' => $pm?->id,
            ]));
        }

        // D. Fisik Main Payments
        $fisikMainData = [
            ['label' => 'DP', 'persentase' => 50.0, 'nilai' => 21028250, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'dp', 'sort_order' => 1],
            ['label' => 'Termin II', 'persentase' => 40.0, 'nilai' => 16822600, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'termin', 'sort_order' => 2],
            ['label' => 'Pelunasan', 'persentase' => 10.0, 'nilai' => 4205650, 'pembayaran' => 0, 'tanggal_pembayaran' => null, 'notes' => 'pelunasan', 'sort_order' => 3],
        ];
        foreach ($fisikMainData as $item) {
            \App\Models\CashflowVendorEntry::create(array_merge($item, [
                'order_id' => $order->id,
                'vendor_type' => 'fisik',
                'section' => 'pembayaran_vendor',
                'created_by' => $pm?->id,
            ]));
        }

        // E. External Items (Tabel 3A)
        $externalItems = [
            ['label' => 'Meja Konsol', 'vendor_name' => 'Nunggu bungke', 'nilai' => 2800000, 'spk_amount' => 4000000, 'tanggal_perencanaan' => '2026-06-25', 'pembayaran' => 4000000, 'tanggal_pembayaran' => '2026-06-25', 'flag_af' => '✔'],
            ['label' => 'Marmer', 'vendor_name' => 'Teguh', 'nilai' => 17567500, 'spk_amount' => 0, 'tanggal_perencanaan' => '2026-07-02', 'pembayaran' => 0, 'tanggal_pembayaran' => null],
            ['label' => 'Duco', 'vendor_name' => 'Edi', 'nilai' => 119717000, 'spk_amount' => 98500000, 'tanggal_perencanaan' => '2026-05-13', 'pembayaran' => 0, 'tanggal_pembayaran' => null],
            ['label' => 'Panel', 'vendor_name' => 'List Joints', 'nilai' => 28569430, 'spk_amount' => 0, 'tanggal_perencanaan' => '2026-06-25', 'pembayaran' => 0, 'tanggal_pembayaran' => null],
            ['label' => 'Besi', 'vendor_name' => 'Kasbon Besi', 'nilai' => 4060000, 'spk_amount' => 3500000, 'tanggal_perencanaan' => '2026-06-12', 'pembayaran' => 0, 'tanggal_pembayaran' => null],
            ['label' => 'Padded', 'vendor_name' => 'Mang Ujang', 'nilai' => 12808610, 'spk_amount' => 11000000, 'tanggal_perencanaan' => '2026-06-22', 'pembayaran' => 0, 'tanggal_pembayaran' => null],
        ];
        foreach ($externalItems as $item) {
            \App\Models\CashflowVendorEntry::create(array_merge($item, [
                'order_id' => $order->id,
                'vendor_type' => 'external',
                'section' => 'item_external',
                'created_by' => $pm?->id,
            ]));
        }

        $this->command->info("✅ Sample cashflow order created: '{$order->nama_project}' (ID: {$order->id})");
        $this->command->info("   Total Kontrak: Rp 850.005.111");
        $this->command->info("   DP Paid: Rp 425.000.000 | Termin Paid: Rp 326.813.223");
        $this->command->info("   SPK Int: 362.4M | SPK Fisik: 42.1M | SPK Ext: 260.4M");
    }
}
