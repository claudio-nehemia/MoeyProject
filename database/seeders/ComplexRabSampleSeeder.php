<?php

namespace Database\Seeders;

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
use App\Models\RabKontrakProduk;
use App\Models\RabProduk;
use App\Models\Termin;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComplexRabSampleSeeder extends Seeder
{
    public function run(): void
    {
        // Cleanup old sample data if exists
        $oldOrder = Order::where('nama_project', 'Apartemen Sudirman - Complex RAB')->first();
        if ($oldOrder) {
            \App\Models\CashflowVendorEntry::where('order_id', $oldOrder->id)->delete();
            \App\Models\CashflowManualEntry::where('order_id', $oldOrder->id)->delete();
            $oldOrder->delete();
        }

        // 1. Create Order
        $order = Order::create([
            'nama_project' => 'Apartemen Sudirman - Complex RAB',
            'company_name' => 'PT Sudirman Residence',
            'customer_name' => 'Budi Santoso',
            'customer_additional_info' => 'Project interior apartemen 3 Bedroom kustom premium',
            'phone_number' => '081234567890',
            'tanggal_masuk_customer' => '2026-03-01',
            'project_status' => 'in_progress',
            'payment_status' => 'dp',
            'tahapan_proyek' => 'rab',
            'jenis_interior_id' => 1,
        ]);

        // Assign PM
        $pm = User::first();
        if ($pm) {
            $order->users()->attach($pm->id);
        }

        // 2. Create Moodboard
        $moodboard = Moodboard::create([
            'order_id' => $order->id,
            'status' => 'approved',
        ]);

        // 3. Create Item Pekerjaan
        $itemPekerjaan = ItemPekerjaan::create([
            'moodboard_id' => $moodboard->id,
            'status' => 'published',
        ]);

        // 4. Create Termin & Kontrak
        $termin = Termin::firstOrCreate(
            ['kode_tipe' => 'STANDARD_4'],
            [
                'nama_tipe' => 'DP 50% - Termin II 30% - Pelunasan 20%',
                'deskripsi' => 'Standard 3 Tahap',
                'tahapan' => [
                    ['nama_tahapan' => 'DP', 'persentase' => 50],
                    ['nama_tahapan' => 'Termin II', 'persentase' => 30],
                    ['nama_tahapan' => 'Pelunasan', 'persentase' => 20],
                ],
            ]
        );

        Kontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'termin_id' => $termin->id,
            'harga_kontrak' => 1500000000, // 1.5 Milyar
            'durasi_kontrak' => 150,
            'tanggal_mulai' => '2026-03-10',
            'tanggal_selesai' => '2026-08-10',
        ]);

        // 5. Ensure Jenis Items Exist
        $jenisBahanBaku = JenisItem::where('nama_jenis_item', 'Bahan Baku')->first();
        $jenisFinishingLuar = JenisItem::where('nama_jenis_item', 'Finishing Luar')->first();
        $jenisFinishingDalam = JenisItem::where('nama_jenis_item', 'Finishing Dalam')->first();
        $jenisAksesoris = JenisItem::where('nama_jenis_item', 'Aksesoris')->first();

        // 6. Ensure some sample Items exist in master database
        $plywood = Item::firstOrCreate(
            ['nama_item' => 'Plywood 18mm Premium'],
            ['jenis_item_id' => $jenisBahanBaku->id, 'harga' => 220000, 'kategori' => 'internal']
        );
        $blockboard = Item::firstOrCreate(
            ['nama_item' => 'Blockboard 18mm Melamin'],
            ['jenis_item_id' => $jenisBahanBaku->id, 'harga' => 250000, 'kategori' => 'internal']
        );
        $hpl = Item::firstOrCreate(
            ['nama_item' => 'HPL Taco Matte Grey'],
            ['jenis_item_id' => $jenisFinishingLuar->id, 'harga' => 150000, 'kategori' => 'internal']
        );
        $melamic = Item::firstOrCreate(
            ['nama_item' => 'Melamic Spray Clear'],
            ['jenis_item_id' => $jenisFinishingDalam->id, 'harga' => 120000, 'kategori' => 'internal']
        );
        $engsel = Item::firstOrCreate(
            ['nama_item' => 'Engsel Slow-motion Huben'],
            ['jenis_item_id' => $jenisAksesoris->id, 'harga' => 45000, 'kategori' => 'internal']
        );
        $relLaci = Item::firstOrCreate(
            ['nama_item' => 'Rel Laci Tandem Double Track'],
            ['jenis_item_id' => $jenisAksesoris->id, 'harga' => 120000, 'kategori' => 'internal']
        );

        // 7. Define 3 Rooms, each with 3 Products
        $roomsData = [
            'Master Bedroom' => [
                ['nama' => 'Wardrobe Cabinet HPL', 'panjang' => 2.4, 'lebar' => 0.6, 'tinggi' => 2.8, 'qty' => 1],
                ['nama' => 'King Bedframe Padded Headboard', 'panjang' => 2.0, 'lebar' => 2.0, 'tinggi' => 1.2, 'qty' => 1],
                ['nama' => 'Floating Bedside Table', 'panjang' => 0.5, 'lebar' => 0.4, 'tinggi' => 0.2, 'qty' => 2],
            ],
            'Living Room' => [
                ['nama' => 'Premium TV Credenza Wood Panel', 'panjang' => 3.2, 'lebar' => 0.4, 'tinggi' => 2.4, 'qty' => 1],
                ['nama' => 'Wall Accent Fluted Panel', 'panjang' => 2.8, 'lebar' => 0.1, 'tinggi' => 2.8, 'qty' => 1],
                ['nama' => 'Floating Display Rack Glass Door', 'panjang' => 1.2, 'lebar' => 0.3, 'tinggi' => 1.5, 'qty' => 1],
            ],
            'Kitchen' => [
                ['nama' => 'Bottom Kitchen Cabinet Plywood', 'panjang' => 4.2, 'lebar' => 0.6, 'tinggi' => 0.85, 'qty' => 1],
                ['nama' => 'Top Kitchen Cabinet Hydraulic Lift', 'panjang' => 4.2, 'lebar' => 0.4, 'tinggi' => 0.9, 'qty' => 1],
                ['nama' => 'Kitchen Island Solid Surface Top', 'panjang' => 2.0, 'lebar' => 0.9, 'tinggi' => 0.85, 'qty' => 1],
            ],
        ];

        // Headers
        $rabKontrak = RabKontrak::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
            'response_by' => 'admin',
            'response_time' => now(),
        ]);

        $rabInternal = RabInternal::create([
            'item_pekerjaan_id' => $itemPekerjaan->id,
        ]);

        // 8. Loop through Rooms & Products
        foreach ($roomsData as $roomName => $products) {
            foreach ($products as $pData) {
                // Ensure master Produk exists
                $masterProduk = Produk::firstOrCreate(
                    ['nama_produk' => $pData['nama']],
                    ['harga' => 15000000, 'harga_jasa' => 2500000, 'kategori' => 'internal']
                );

                // Add Bahan Baku to product pivot (produk_items) if empty
                if ($masterProduk->bahanBakus()->count() === 0) {
                    $masterProduk->bahanBakus()->attach($plywood->id, ['harga_dasar' => 220000, 'harga_jasa' => 50000]);
                    $masterProduk->bahanBakus()->attach($blockboard->id, ['harga_dasar' => 250000, 'harga_jasa' => 60000]);
                }

                // Create ItemPekerjaanProduk
                $ipp = ItemPekerjaanProduk::create([
                    'item_pekerjaan_id' => $itemPekerjaan->id,
                    'nama_ruangan' => $roomName,
                    'produk_id' => $masterProduk->id,
                    'quantity' => $pData['qty'],
                    'panjang' => $pData['panjang'],
                    'lebar' => $pData['lebar'],
                    'tinggi' => $pData['tinggi'],
                ]);

                // Create ItemPekerjaanProdukBahanBaku
                ItemPekerjaanProdukBahanBaku::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'item_id' => $plywood->id,
                    'harga_dasar' => 220000,
                    'harga_jasa' => 50000,
                ]);
                ItemPekerjaanProdukBahanBaku::create([
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'item_id' => $blockboard->id,
                    'harga_dasar' => 250000,
                    'harga_jasa' => 60000,
                ]);

                // Create finishing items (Finishing Luar & Dalam)
                if ($jenisFinishingLuar) {
                    $itemPekJenisL = ItemPekerjaanJenisItem::create([
                        'item_pekerjaan_produk_id' => $ipp->id,
                        'jenis_item_id' => $jenisFinishingLuar->id,
                    ]);
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $itemPekJenisL->id,
                        'item_id' => $hpl->id,
                        'quantity' => 1,
                    ]);
                }

                if ($jenisFinishingDalam) {
                    $itemPekJenisD = ItemPekerjaanJenisItem::create([
                        'item_pekerjaan_produk_id' => $ipp->id,
                        'jenis_item_id' => $jenisFinishingDalam->id,
                    ]);
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $itemPekJenisD->id,
                        'item_id' => $melamic->id,
                        'quantity' => 1,
                    ]);
                }

                // Create Accessories items
                if ($jenisAksesoris) {
                    $itemPekJenisA = ItemPekerjaanJenisItem::create([
                        'item_pekerjaan_produk_id' => $ipp->id,
                        'jenis_item_id' => $jenisAksesoris->id,
                    ]);
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $itemPekJenisA->id,
                        'item_id' => $engsel->id,
                        'quantity' => 6,
                    ]);
                    ItemPekerjaanItem::create([
                        'item_pekerjaan_jenis_item_id' => $itemPekJenisA->id,
                        'item_id' => $relLaci->id,
                        'quantity' => 4,
                    ]);
                }

                // Calculate default pricing parameters
                $hargaDasarBahanBaku = 470000; // 220k + 250k
                $hargaFinishing = 150000 + 120000; // HPL + Melamic (qty selalu 1)
                $dimensiVolume = max(1, $pData['panjang'] * $pData['lebar'] * $pData['tinggi'] * $pData['qty']);
                $markup = 20; // 20%
                $markupDivider = 1 - ($markup / 100); // 0.8
                $hargaSatuanCalc = ($hargaDasarBahanBaku + $hargaFinishing) / $markupDivider * $dimensiVolume;

                // Accessories cost
                $hargaAksesorisTotal = (($engsel->harga / 0.8) * 6) + (($relLaci->harga / 0.8) * 4); // (45k/0.8*6) + (120k/0.8*4) = 337.5k + 600k = 937.5k

                // Create RabProduk for Internal
                RabProduk::create([
                    'rab_internal_id' => $rabInternal->id,
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'markup_satuan' => $markup,
                    'harga_dasar' => $hargaDasarBahanBaku,
                    'harga_items_non_aksesoris' => $hargaFinishing,
                    'harga_dimensi' => $dimensiVolume,
                    'harga_satuan' => $hargaSatuanCalc,
                    'harga_total_aksesoris' => $hargaAksesorisTotal,
                    'diskon_per_produk' => 0,
                    'harga_akhir' => $hargaSatuanCalc + $hargaAksesorisTotal,
                ]);

                // Create RabKontrakProduk for Kontrak
                \App\Models\RabKontrakProduk::create([
                    'rab_kontrak_id' => $rabKontrak->id,
                    'item_pekerjaan_produk_id' => $ipp->id,
                    'harga_dasar' => $hargaDasarBahanBaku,
                    'harga_finishing_luar' => 150000,
                    'harga_finishing_dalam' => 120000,
                    'harga_items_non_aksesoris' => $hargaFinishing,
                    'harga_dimensi' => $dimensiVolume,
                    'harga_satuan' => $hargaSatuanCalc,
                    'harga_total_aksesoris' => $hargaAksesorisTotal,
                    'diskon_per_produk' => 0,
                    'harga_akhir' => $hargaSatuanCalc + $hargaAksesorisTotal,
                ]);
            }
        }

        // Initialize default payments timeline in Cashflow
        $cfSeeder = new \App\Http\Controllers\CashflowController();
        // Since initializeDefaultVendorEntries is private, we can manually create default records here:
        $startDate = '2026-03-10';
        $endDate = '2026-08-10';
        $midDate = '2026-05-25';

        $defaultEntries = [
            ['label' => 'DP', 'persentase' => 50, 'notes' => 'dp', 'tanggal_pembayaran' => $startDate],
            ['label' => 'Termin II', 'persentase' => 30, 'notes' => 'termin', 'tanggal_pembayaran' => $midDate],
            ['label' => 'Pelunasan', 'persentase' => 20, 'notes' => 'pelunasan', 'tanggal_pembayaran' => $endDate],
        ];

        foreach (['internal', 'fisik'] as $type) {
            foreach ($defaultEntries as $idx => $item) {
                \App\Models\CashflowVendorEntry::create([
                    'order_id' => $order->id,
                    'vendor_type' => $type,
                    'section' => 'pembayaran_vendor',
                    'label' => $item['label'],
                    'persentase' => $item['persentase'],
                    'nilai' => 50000000, // Rp 50jt target
                    'pembayaran' => 0,
                    'pembayaran_termin' => 0,
                    'tanggal_pembayaran' => $item['tanggal_pembayaran'],
                    'sort_order' => $idx + 1,
                    'notes' => $item['notes'],
                ]);
            }
        }

        echo "ComplexRabSampleSeeder completed successfully! Generated order ID: " . $order->id . "\n";
    }
}
