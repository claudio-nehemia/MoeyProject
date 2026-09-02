<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Jabatan;
use App\Models\Karyawan;
use App\Models\User;
use App\Models\Order;
use App\Models\Moodboard;
use App\Models\ItemPekerjaan;
use App\Models\ItemPekerjaanProduk;
use App\Models\Produk;
use App\Models\RabInternal;
use App\Models\RabKontrak;
use App\Models\RabProduk;
use App\Models\PayrollPositionConfig;
use App\Models\PayrollKasbon;
use App\Models\PayrollMonthly;
use App\Services\PayrollCalculationService;
use Illuminate\Support\Facades\DB;

class PayrollManualSimulationSeeder extends Seeder
{
    public function run(): void
    {
        $service = new PayrollCalculationService();

        // 1. Data Jabatan & Pemetaan Kode
        $jabatans = [
            ['kode' => 'DFT', 'nama' => 'Staff Drafter'],
            ['kode' => 'DSG', 'nama' => 'Staff Design'],
            ['kode' => 'MDS', 'nama' => 'Manager Design'],
            ['kode' => 'GMD', 'nama' => 'General Manager Design'],
            ['kode' => 'MMK', 'nama' => 'Manager Marketing'],
            ['kode' => 'GME', 'nama' => 'GM Estimator'],
            ['kode' => 'MLF', 'nama' => 'Manager Legal & Finance'],
            ['kode' => 'MBD', 'nama' => 'Manager Business Development'],
            ['kode' => 'PJM', 'nama' => 'Project Manager'],
            ['kode' => 'SPI', 'nama' => 'Supervisor Internal'],
            ['kode' => 'SPE', 'nama' => 'Supervisor Eksternal'],
        ];

        foreach ($jabatans as $j) {
            Jabatan::updateOrCreate(
                ['kode_jabatan' => $j['kode']],
                ['nama_jabatan' => $j['nama']]
            );

            // Update kode_jabatan di payroll_position_configs
            PayrollPositionConfig::where('jabatan', $j['nama'])
                ->update(['kode_jabatan' => $j['kode']]);
        }

        // 2. Data 11 Simulasi Karyawan sesuai Excel beserta Input Manualnya
        $simulasiList = [
            [
                'nik' => 'SIM-001',
                'nama' => 'Ms. A (Drafter)',
                'jabatan_kode' => 'DFT',
                'divisi' => 'Design',
                'jabatan_nama' => 'Staff Drafter',
                'omzet_internal' => 1950000000,
                'omzet_eksternal' => 700000000,
                'jumlah_cf' => 4, // CF 4x/bulan
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 1800000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-002',
                'nama' => 'Ms. C (Designer)',
                'jabatan_kode' => 'DSG',
                'divisi' => 'Design',
                'jabatan_nama' => 'Staff Design',
                'omzet_internal' => 1000000000,
                'omzet_eksternal' => 300000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 3780000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-003',
                'nama' => 'Mr. W (Manager Design)',
                'jabatan_kode' => 'MDS',
                'divisi' => 'Design',
                'jabatan_nama' => 'Manager Design',
                'omzet_internal' => 1200000000,
                'omzet_eksternal' => 500000000,
                'jumlah_cf' => 4, // 2 mandiri + 2 team
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 3780000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-004',
                'nama' => 'Mr. H (GM Design)',
                'jabatan_kode' => 'GMD',
                'divisi' => 'Design',
                'jabatan_nama' => 'General Manager Design',
                'omzet_internal' => 0,
                'omzet_eksternal' => 0,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 4860000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 1500000, // Dari Excel Row 121
                'kasbon_total' => 4500000,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-005',
                'nama' => 'Ms. A (Marketing)',
                'jabatan_kode' => 'MMK',
                'divisi' => 'Marketing',
                'jabatan_nama' => 'Manager Marketing',
                'omzet_internal' => 1000000000,
                'omzet_eksternal' => 300000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 0,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-006',
                'nama' => 'Mr. J (GM Estimator)',
                'jabatan_kode' => 'GME',
                'divisi' => 'Team Tengah',
                'jabatan_nama' => 'GM Estimator',
                'omzet_internal' => 2200000000,
                'omzet_eksternal' => 800000000,
                'jumlah_cf' => 4,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 4050000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-007',
                'nama' => 'Mrs. F (Finance & Legal)',
                'jabatan_kode' => 'MLF',
                'divisi' => 'Team Tengah',
                'jabatan_nama' => 'Manager Legal & Finance',
                'omzet_internal' => 2200000000,
                'omzet_eksternal' => 800000000,
                'jumlah_cf' => 4,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 1800000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-008',
                'nama' => 'Mr. B (Busdev)',
                'jabatan_kode' => 'MBD',
                'divisi' => 'Team Tengah',
                'jabatan_nama' => 'Manager Business Development',
                'omzet_internal' => 2200000000,
                'omzet_eksternal' => 800000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 1800000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 5000000, // Dari Excel Row 13
                'kasbon_total' => 15000000,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-009',
                'nama' => 'Mr. J (Project Manager)',
                'jabatan_kode' => 'PJM',
                'divisi' => 'Pelaksana Project',
                'jabatan_nama' => 'Project Manager',
                'omzet_internal' => 2200000000,
                'omzet_eksternal' => 800000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 2520000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-010',
                'nama' => 'Mr. R (Supervisor Internal)',
                'jabatan_kode' => 'SPI',
                'divisi' => 'Pelaksana Project',
                'jabatan_nama' => 'Supervisor Internal',
                'omzet_internal' => 1000000000,
                'omzet_eksternal' => 300000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 2520000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 0,
                'kasbon_total' => 0,
                'timeline_score' => 100,
            ],
            [
                'nik' => 'SIM-011',
                'nama' => 'Mr. S (Supervisor Eksternal)',
                'jabatan_kode' => 'SPE',
                'divisi' => 'Pelaksana Project',
                'jabatan_nama' => 'Supervisor Eksternal',
                'omzet_internal' => 0,
                'omzet_eksternal' => 800000000,
                'jumlah_cf' => 0,
                'hari_kerja' => 26,
                'hari_hadir' => 26,
                'komisi_pelunasan' => 2400000,
                'komisi_success_project' => 0,
                'achievement_pelaksanaan' => 0,
                'kasbon_cicilan' => 500000, // Dari Excel Row 338
                'kasbon_total' => 1500000,
                'timeline_score' => 100,
            ],
        ];

        $bulan = 9; // September
        $tahun = 2026;

        foreach ($simulasiList as $item) {
            $isFemale = str_starts_with($item['nama'], 'Ms.') || str_starts_with($item['nama'], 'Mrs.');
            
            // 1. Akun User Sistem
            $userEmail = strtolower(str_replace('-', '', $item['nik'])) . '@moey.id';
            $user = User::firstOrCreate(
                ['email' => $userEmail],
                [
                    'name' => $item['nama'],
                    'password' => bcrypt('password123'),
                    'role_id' => 1,
                ]
            );

            // 2. Karyawan
            $karyawan = Karyawan::updateOrCreate(
                ['nik' => $item['nik']],
                [
                    'nama_karyawan' => $item['nama'],
                    'jenis_kelamin' => $isFemale ? 'P' : 'L',
                    'kode_jabatan' => $item['jabatan_kode'],
                    'kode_cabang' => 'PST',
                    'kode_dept' => 'IT',
                    'tanggal_masuk' => '2024-01-01',
                    'status_karyawan' => 'K001',
                    'status_aktif_karyawan' => '1',
                    'user_id' => $user->id,
                ]
            );

            // 3. Presensi (September 2026)
            for ($d = 1; $d <= min(30, $item['hari_hadir']); $d++) {
                $dayStr = str_pad($d, 2, '0', STR_PAD_LEFT);
                $dateStr = "2026-09-{$dayStr}";
                if (date('N', strtotime($dateStr)) == 7) continue; // Skip hari Minggu

                DB::table('presensi')->updateOrInsert(
                    ['nik' => $item['nik'], 'tanggal' => $dateStr],
                    [
                        'jam_in' => "{$dateStr} 08:00:00",
                        'jam_out' => "{$dateStr} 17:00:00",
                        'status' => 'h',
                        'kode_jam_kerja' => 'TST',
                        'created_at' => "{$dateStr} 08:00:00",
                        'updated_at' => "{$dateStr} 17:00:00",
                    ]
                );
            }

            // 4. Project, RAB Internal & Omzet
            if ($item['omzet_internal'] > 0 || $item['omzet_eksternal'] > 0) {
                $projectName = "Project RAB - {$item['nama']}";
                $order = Order::firstOrCreate(
                    ['nama_project' => $projectName],
                    [
                        'company_name' => 'PT Client ' . substr($item['nama'], 0, 10),
                        'customer_name' => $item['nama'] . ' Client',
                        'phone_number' => '081234567890',
                        'tanggal_masuk_customer' => '2026-09-01',
                        'project_status' => 'in_progress',
                        'payment_status' => 'dp',
                        'tahapan_proyek' => 'rab',
                        'jenis_interior_id' => 1,
                        'created_by' => $user->id,
                        'created_at' => '2026-09-02 08:00:00',
                        'updated_at' => '2026-09-02 08:00:00',
                    ]
                );

                // Hubungkan user ke tim project (order_teams)
                DB::table('order_teams')->updateOrInsert(
                    ['order_id' => $order->id, 'user_id' => $user->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );

                $moodboard = Moodboard::firstOrCreate(
                    ['order_id' => $order->id],
                    ['status' => 'approved', 'created_at' => '2026-09-02 08:00:00']
                );

                $itemPekerjaan = ItemPekerjaan::firstOrCreate(
                    ['moodboard_id' => $moodboard->id],
                    ['status' => 'published', 'created_at' => '2026-09-02 08:00:00']
                );

                $rabInternal = RabInternal::firstOrCreate(
                    ['item_pekerjaan_id' => $itemPekerjaan->id],
                    [
                        'is_submitted' => true,
                        'submitted_by' => 'Estimator',
                        'submitted_at' => '2026-09-05 10:00:00',
                        'created_at' => '2026-09-02 08:00:00',
                    ]
                );

                $prodInt = Produk::firstOrCreate(
                    ['nama_produk' => 'Furnitur Interior Custom Internal'],
                    ['kategori' => 'internal', 'harga' => 1000000]
                );
                $prodExt = Produk::firstOrCreate(
                    ['nama_produk' => 'Pekerjaan Sipil / Eksternal'],
                    ['kategori' => 'eksternal', 'harga' => 1000000]
                );

                if ($item['omzet_internal'] > 0) {
                    $ippInt = ItemPekerjaanProduk::firstOrCreate(
                        ['item_pekerjaan_id' => $itemPekerjaan->id, 'produk_id' => $prodInt->id],
                        ['quantity' => 1, 'nama_ruangan' => 'Ruang Utama']
                    );
                    RabProduk::updateOrCreate(
                        ['rab_internal_id' => $rabInternal->id, 'item_pekerjaan_produk_id' => $ippInt->id],
                        [
                            'harga_dasar' => $item['omzet_internal'],
                            'harga_akhir' => $item['omzet_internal'],
                            'markup_satuan' => 0,
                        ]
                    );
                }

                if ($item['omzet_eksternal'] > 0) {
                    $ippExt = ItemPekerjaanProduk::firstOrCreate(
                        ['item_pekerjaan_id' => $itemPekerjaan->id, 'produk_id' => $prodExt->id],
                        ['quantity' => 1, 'nama_ruangan' => 'Ruang Eksternal']
                    );
                    RabProduk::updateOrCreate(
                        ['rab_internal_id' => $rabInternal->id, 'item_pekerjaan_produk_id' => $ippExt->id],
                        [
                            'harga_dasar' => $item['omzet_eksternal'],
                            'harga_akhir' => $item['omzet_eksternal'],
                            'markup_satuan' => 0,
                        ]
                    );
                }

                // 5. Commitment Fee
                if ($item['jumlah_cf'] > 0) {
                    for ($c = 1; $c <= $item['jumlah_cf']; $c++) {
                        DB::table('commitment_fees')->updateOrInsert(
                            ['moodboard_id' => $moodboard->id, 'response_by' => "Client {$c}"],
                            [
                                'total_fee' => 5000000,
                                'payment_status' => 'completed',
                                'payment_proof' => 'uploads/cf_sim.jpg',
                                'created_at' => '2026-09-10 10:00:00',
                                'updated_at' => '2026-09-10 10:00:00',
                            ]
                        );
                    }
                }

                // 6. Invoice Pelunasan
                if ($item['komisi_pelunasan'] > 0) {
                    $rabKontrak = RabKontrak::firstOrCreate(
                        ['item_pekerjaan_id' => $itemPekerjaan->id],
                        [
                            'response_by' => 'Legal',
                            'response_time' => '2026-09-02 08:00:00',
                            'created_at' => '2026-09-02 08:00:00',
                            'updated_at' => '2026-09-02 08:00:00'
                        ]
                    );

                    DB::table('invoices')->updateOrInsert(
                        ['item_pekerjaan_id' => $itemPekerjaan->id, 'termin_step' => 2],
                        [
                            'rab_kontrak_id' => $rabKontrak->id,
                            'invoice_number' => 'INV-PEL-' . $item['nik'],
                            'total_amount' => $item['omzet_internal'] > 0 ? ($item['omzet_internal'] * 0.6) : 50000000,
                            'status' => 'paid',
                            'termin_text' => 'Pelunasan 60%',
                            'paid_at' => '2026-09-25 10:00:00',
                            'created_at' => '2026-09-25 10:00:00',
                            'updated_at' => '2026-09-25 10:00:00',
                        ]
                    );
                }
            }

            // 7. Simpan Kasbon jika ada
            if ($item['kasbon_cicilan'] > 0) {
                PayrollKasbon::updateOrCreate(
                    ['nik' => $item['nik']],
                    [
                        'total_kasbon' => $item['kasbon_total'],
                        'cicilan_per_bulan' => $item['kasbon_cicilan'],
                        'sisa_kasbon' => $item['kasbon_total'] - $item['kasbon_cicilan'],
                        'keterangan' => 'Pinjaman/Kasbon Karyawan Simulasi Excel',
                        'status' => 'aktif',
                    ]
                );
            }

            // 8. Cari Config Jabatan & Generate Slip
            $config = PayrollPositionConfig::where('jabatan', $item['jabatan_nama'])->first();

            $slip = $service->generateSlip(
                $item['nik'],
                $bulan,
                $tahun,
                $config?->id,
                [
                    'hari_kerja' => $item['hari_kerja'],
                    'hari_hadir' => $item['hari_hadir'],
                    'capaian_omzet_internal' => $item['omzet_internal'],
                    'capaian_omzet_eksternal' => $item['omzet_eksternal'],
                    'jumlah_cf' => $item['jumlah_cf'],
                    'komisi_pelunasan' => $item['komisi_pelunasan'],
                    'komisi_success_project' => $item['komisi_success_project'],
                    'achievement_pelaksanaan' => $item['achievement_pelaksanaan'],
                    'timeline_score' => $item['timeline_score'],
                ]
            );

            $this->command?->info("Slip generated for {$item['nama']}: Rp " . number_format($slip->total_diterima, 0, ',', '.'));
        }

        $this->command?->info("Successfully seeded 11 simulation employees with complete linked system records!");
    }
}
