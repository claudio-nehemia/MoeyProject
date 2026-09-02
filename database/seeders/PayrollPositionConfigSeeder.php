<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollPositionConfig;
use App\Models\PayrollKpiConfig;

class PayrollPositionConfigSeeder extends Seeder
{
    public function run(): void
    {
        // Data dari Excel: Simulasi Komposisi Pendapatan Moey.xlsx
        // 11 jabatan dalam 4 divisi

        $positions = [
            // ========================================
            // DIVISI DESIGN
            // ========================================
            [
                'divisi' => 'Design',
                'jabatan' => 'Staff Drafter',
                'gaji_pokok' => 3000000, // Rp 76.923/hari × 26 + 1.000.000 (dari Excel R8: =(D8*E8)+1000000)
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 1000000,
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 890000000, // Excel: IF($AS$5<=890000000,0,1000000)
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 450000, // 200000+250000 dari Excel N25
                'cf_max_per_bulan' => 4,
                'komisi_dp_persen_internal' => 0.004,  // 0.4% (AE20)
                'komisi_dp_persen_eksternal' => 0.002, // 0.2% (AE21)
                'komisi_dp_bayar_persen' => 100, // Full (Excel: =AQ20, no discount)
                'min_omzet_komisi_dp' => 700000000, // AQ21=700jt
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 50,
                'achievement_rate' => 0,
                'min_omzet_achievement' => 1000000000,
                'achievement_fixed' => 2000000, // Excel R16: =if(G6>=D7,2000000,0)
                'min_success_project_persen' => 75,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0,
                'komisi_success_bayar_persen' => 0,
                'achievement_pelaksanaan_persen' => 0,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 40, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 15, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 15, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 30, 'urutan' => 4],
                ],
                'catatan' => 'Masa toleransi 2 bulan (Omzet 0-300jt tanpa CF). Masa toleransi 3 bulan (Omzet 300-500jt + CF).',
            ],
            [
                'divisi' => 'Design',
                'jabatan' => 'Staff Design',
                'gaji_pokok' => 2000000, // Excel R40: G40=2000000
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 0, // Tidak ada tunjangan jabatan
                'tunjangan_jabatan_condition' => null,
                'tunjangan_jabatan_min_omzet' => 0,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 1000000, // Excel N50
                'cf_max_per_bulan' => 2,
                'komisi_dp_persen_internal' => 0.014, // 1.4% (AE14)
                'komisi_dp_persen_eksternal' => 0.007, // 0.7% (AE15)
                'komisi_dp_bayar_persen' => 70, // Excel S7: =AQ14*70%
                'min_omzet_komisi_dp' => 350000000, // AQ15=350jt
                'komisi_pelunasan_persen_internal' => 0.014,
                'komisi_pelunasan_persen_eksternal' => 0.007,
                'komisi_pelunasan_bayar_persen' => 30,
                'achievement_rate' => 0.0035, // AT14=0.0035
                'min_omzet_achievement' => 500000000, // AR14=500jt
                'achievement_fixed' => 0,
                'min_success_project_persen' => 50,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0,
                'komisi_success_bayar_persen' => 0,
                'achievement_pelaksanaan_persen' => 0.002, // AX36=0.002
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 40, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 15, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 15, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 30, 'urutan' => 4],
                ],
                'catatan' => 'Masa toleransi 2 bulan (Omzet 0-300jt tanpa CF). Masa toleransi 3 bulan (Omzet 300-500jt + CF).',
            ],
            [
                'divisi' => 'Design',
                'jabatan' => 'Manager Design',
                'gaji_pokok' => 2000000, // Excel R71: G71=2000000
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 2000000, // Excel R72: =P5 → IF($AQ$5<=$P$3,0,2000000)
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000, // $P$3=900jt
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 500000, // Excel N51 (Manager Design CF)
                'cf_max_per_bulan' => 4, // 2 mandiri + 2 team
                'komisi_dp_persen_internal' => 0.014, // AE8=0.014
                'komisi_dp_persen_eksternal' => 0.007, // AE9=AE8/2
                'komisi_dp_bayar_persen' => 70, // Excel S5: =AQ8*70%
                'min_omzet_komisi_dp' => 500000000, // AQ9=500jt
                'komisi_pelunasan_persen_internal' => 0.004, // AX30=0.004
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 30,
                'achievement_rate' => 0.0035, // AT8=0.0035
                'min_omzet_achievement' => 500000000, // AR8=500jt
                'achievement_fixed' => 0,
                'min_success_project_persen' => 50,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0,
                'komisi_success_bayar_persen' => 0,
                'achievement_pelaksanaan_persen' => 0.001, // AX32
                'kpi' => [
                    ['komponen' => 'omzet_mandiri', 'bobot' => 20, 'urutan' => 1],
                    ['komponen' => 'omzet_team', 'bobot' => 20, 'urutan' => 2],
                    ['komponen' => 'cf_mandiri', 'bobot' => 7.5, 'urutan' => 3],
                    ['komponen' => 'cf_team', 'bobot' => 7.5, 'urutan' => 4],
                    ['komponen' => 'absensi', 'bobot' => 15, 'urutan' => 5],
                    ['komponen' => 'timeline', 'bobot' => 20, 'urutan' => 6],
                    ['komponen' => 'team', 'bobot' => 10, 'urutan' => 7],
                ],
                'catatan' => 'Manager punya KPI mandiri + team. Masa toleransi 2 bulan (0-500jt). 3 bulan (500-700jt + CF).',
            ],
            [
                'divisi' => 'Design',
                'jabatan' => 'General Manager Design',
                'gaji_pokok' => 2000000, // =G71 (sama dengan Manager Design)
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 3000000, // Excel R110: IF($AQ$5<=$P$3,0,3000000)
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 1500000, // N24 (GM)
                'cf_max_per_bulan' => 2,
                'komisi_dp_persen_internal' => 0.018, // AE17=0.018
                'komisi_dp_persen_eksternal' => 0.009, // AE18
                'komisi_dp_bayar_persen' => 70,
                'min_omzet_komisi_dp' => 500000000, // AQ18=500jt
                'komisi_pelunasan_persen_internal' => 0.018,
                'komisi_pelunasan_persen_eksternal' => 0.009,
                'komisi_pelunasan_bayar_persen' => 30,
                'achievement_rate' => 0.0049, // AT17=AT8+AT11
                'min_omzet_achievement' => 500000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 50,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0,
                'komisi_success_bayar_persen' => 0,
                'achievement_pelaksanaan_persen' => 0.002,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 40, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 15, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 15, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 30, 'urutan' => 4],
                ],
                'catatan' => 'GM Design mengcover seluruh divisi Design. Masa toleransi 2 bulan (0-500jt).',
            ],

            // ========================================
            // DIVISI MARKETING
            // ========================================
            [
                'divisi' => 'Marketing',
                'jabatan' => 'Manager Marketing',
                'gaji_pokok' => 2000000, // D142*E142
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 2000000, // =2000000/26*26
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 1000000, // N52 (Marketing)
                'cf_max_per_bulan' => 8,
                'komisi_dp_persen_internal' => 0.004, // AE26=0.004
                'komisi_dp_persen_eksternal' => 0.002, // AE27
                'komisi_dp_bayar_persen' => 70,
                'min_omzet_komisi_dp' => 1500000000, // AQ27=1.5M
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 30,
                'achievement_rate' => 0, // Fixed 15jt: =if(AG26>=AR26,(15000000),0)
                'min_omzet_achievement' => 3000000000, // AR26=3M
                'achievement_fixed' => 15000000,
                'min_success_project_persen' => 0,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0,
                'komisi_success_bayar_persen' => 0,
                'achievement_pelaksanaan_persen' => 0.002,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 40, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 15, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 15, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 30, 'urutan' => 4],
                ],
                'catatan' => 'Marketing. Min omzet 3M untuk achievement Rp 15jt fixed. Toleransi 2 bulan (0-800jt).',
            ],

            // ========================================
            // DIVISI TEAM TENGAH
            // ========================================
            [
                'divisi' => 'Team Tengah',
                'jabatan' => 'GM Estimator',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 3000000,
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 450000, // N27
                'cf_max_per_bulan' => 8,
                'komisi_dp_persen_internal' => 0.009, // AE29=0.009
                'komisi_dp_persen_eksternal' => 0.0045, // AE30=AE29/2
                'komisi_dp_bayar_persen' => 50, // Dibayarkan 50%
                'min_omzet_komisi_dp' => 1500000000,
                'komisi_pelunasan_persen_internal' => 0.009,
                'komisi_pelunasan_persen_eksternal' => 0.0045,
                'komisi_pelunasan_bayar_persen' => 50,
                'achievement_rate' => 0.0021, // AT29=0.0021
                'min_omzet_achievement' => 2000000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 70,
                'komisi_success_persen_internal' => 0.009,
                'komisi_success_persen_eksternal' => 0.0045,
                'komisi_success_bayar_persen' => 50,
                'achievement_pelaksanaan_persen' => 0.0025,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 20, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 10, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 50, 'urutan' => 4],
                ],
                'catatan' => 'GM Estimator. KPI berat di timeline (50%). Toleransi 2 bulan (0-800jt).',
            ],
            [
                'divisi' => 'Team Tengah',
                'jabatan' => 'Manager Legal & Finance',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 2000000,
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 100000, // N28
                'cf_max_per_bulan' => 8,
                'komisi_dp_persen_internal' => 0.004, // AE32=0.004
                'komisi_dp_persen_eksternal' => 0.002, // AE33
                'komisi_dp_bayar_persen' => 50,
                'min_omzet_komisi_dp' => 1500000000,
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 50,
                'achievement_rate' => 0.0015, // AT32=0.0015
                'min_omzet_achievement' => 2000000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 70,
                'komisi_success_persen_internal' => 0.004,
                'komisi_success_persen_eksternal' => 0.002,
                'komisi_success_bayar_persen' => 50,
                'achievement_pelaksanaan_persen' => 0.0025,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 20, 'urutan' => 1],
                    ['komponen' => 'cf', 'bobot' => 10, 'urutan' => 2],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 3],
                    ['komponen' => 'timeline', 'bobot' => 50, 'urutan' => 4],
                ],
                'catatan' => 'Finance & Legal. KPI timeline 50%.',
            ],
            [
                'divisi' => 'Team Tengah',
                'jabatan' => 'Manager Business Development',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 2000000,
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000, // Note: Excel says "Absensi" bukan "Kehadiran"
                'cf_per_client' => 0, // Busdev tidak ada CF
                'cf_max_per_bulan' => 0,
                'komisi_dp_persen_internal' => 0.004, // AE35=0.004
                'komisi_dp_persen_eksternal' => 0.002,
                'komisi_dp_bayar_persen' => 50,
                'min_omzet_komisi_dp' => 1500000000,
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 50,
                'achievement_rate' => 0.0015, // AT35=0.0015
                'min_omzet_achievement' => 2000000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 75,
                'komisi_success_persen_internal' => 0.004,
                'komisi_success_persen_eksternal' => 0.002,
                'komisi_success_bayar_persen' => 50,
                'achievement_pelaksanaan_persen' => 0.002,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 30, 'urutan' => 1],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 2],
                    ['komponen' => 'timeline', 'bobot' => 50, 'urutan' => 3],
                ],
                'catatan' => 'Business Development. Tidak ada CF. KPI timeline 50%.',
            ],

            // ========================================
            // DIVISI PELAKSANA PROJECT
            // ========================================
            [
                'divisi' => 'Pelaksana Project',
                'jabatan' => 'Project Manager',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 2000000,
                'tunjangan_jabatan_condition' => 'omzet_min',
                'tunjangan_jabatan_min_omzet' => 900000000,
                'transportasi_harian' => 25000,
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 0,
                'cf_max_per_bulan' => 0,
                'komisi_dp_persen_internal' => 0.004, // AE38=0.004
                'komisi_dp_persen_eksternal' => 0.002,
                'komisi_dp_bayar_persen' => 30, // Dibayarkan 30%
                'min_omzet_komisi_dp' => 1500000000,
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 70, // Pelunasan 70%
                'achievement_rate' => 0,
                'min_omzet_achievement' => 2000000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 75,
                'komisi_success_persen_internal' => 0.004,
                'komisi_success_persen_eksternal' => 0.002,
                'komisi_success_bayar_persen' => 70,
                'achievement_pelaksanaan_persen' => 0.003,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 10, 'urutan' => 1],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 2],
                    ['komponen' => 'timeline', 'bobot' => 70, 'urutan' => 3],
                ],
                'catatan' => 'PM. KPI berat di timeline (70%). Komisi DP 30%, pelunasan 70%.',
            ],
            [
                'divisi' => 'Pelaksana Project',
                'jabatan' => 'Supervisor Internal',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 0, // SPV tidak ada tunjangan jabatan
                'tunjangan_jabatan_condition' => null,
                'tunjangan_jabatan_min_omzet' => 0,
                'transportasi_harian' => 100000, // SPV Internal Rp 100.000/hari (Excel D302)
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 0,
                'cf_max_per_bulan' => 0,
                'komisi_dp_persen_internal' => 0.004, // AE41=0.004
                'komisi_dp_persen_eksternal' => 0.002,
                'komisi_dp_bayar_persen' => 30,
                'min_omzet_komisi_dp' => 750000000, // AQ42=750jt
                'komisi_pelunasan_persen_internal' => 0.004,
                'komisi_pelunasan_persen_eksternal' => 0.002,
                'komisi_pelunasan_bayar_persen' => 70,
                'achievement_rate' => 0,
                'min_omzet_achievement' => 1000000000,
                'achievement_fixed' => 0,
                'min_success_project_persen' => 50,
                'komisi_success_persen_internal' => 0.004,
                'komisi_success_persen_eksternal' => 0.002,
                'komisi_success_bayar_persen' => 70,
                'achievement_pelaksanaan_persen' => 0.003,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 10, 'urutan' => 1],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 2],
                    ['komponen' => 'timeline', 'bobot' => 70, 'urutan' => 3],
                ],
                'catatan' => 'SPV Internal. Transportasi Rp 100.000/hari. KPI timeline 70%.',
            ],
            [
                'divisi' => 'Pelaksana Project',
                'jabatan' => 'Supervisor Eksternal',
                'gaji_pokok' => 2000000,
                'gaji_pokok_harian' => 76923,
                'tunjangan_jabatan' => 0,
                'tunjangan_jabatan_condition' => null,
                'tunjangan_jabatan_min_omzet' => 0,
                'transportasi_harian' => 100000, // SPV Eksternal juga Rp 100.000/hari
                'makan_harian' => 40000,
                'kehadiran_harian' => 55000,
                'cf_per_client' => 0,
                'cf_max_per_bulan' => 0,
                'komisi_dp_persen_internal' => 0, // SPV Ext: hanya omzet eksternal
                'komisi_dp_persen_eksternal' => 0.01, // AE44=0.01
                'komisi_dp_bayar_persen' => 30,
                'min_omzet_komisi_dp' => 0, // No minimum, =AP44
                'komisi_pelunasan_persen_internal' => 0,
                'komisi_pelunasan_persen_eksternal' => 0.01,
                'komisi_pelunasan_bayar_persen' => 70,
                'achievement_rate' => 0,
                'min_omzet_achievement' => 700000000, // AR44=700jt
                'achievement_fixed' => 2000000, // AS44: =if(AG44>=AR44,2000000,0)
                'min_success_project_persen' => 75,
                'komisi_success_persen_internal' => 0,
                'komisi_success_persen_eksternal' => 0.01,
                'komisi_success_bayar_persen' => 70,
                'achievement_pelaksanaan_persen' => 0,
                'kpi' => [
                    ['komponen' => 'omzet', 'bobot' => 10, 'urutan' => 1],
                    ['komponen' => 'absensi', 'bobot' => 20, 'urutan' => 2],
                    ['komponen' => 'timeline', 'bobot' => 70, 'urutan' => 3],
                ],
                'catatan' => 'SPV Eksternal. Hanya omzet eksternal. Achievement fixed Rp 2jt.',
            ],
        ];

        foreach ($positions as $posData) {
            $kpi = $posData['kpi'];
            unset($posData['kpi']);

            $config = PayrollPositionConfig::updateOrCreate(
                [
                    'divisi' => $posData['divisi'],
                    'jabatan' => $posData['jabatan'],
                ],
                $posData
            );

            // Seed KPI configs
            $config->kpiConfigs()->delete();
            foreach ($kpi as $k) {
                $config->kpiConfigs()->create($k);
            }
        }

        $this->command?->info('Seeded 11 payroll position configs with KPI.');
    }
}
